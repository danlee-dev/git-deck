from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx
import uuid
from datetime import datetime
from app.api.deps import get_db_session, get_current_active_user
from app.models import User
from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.schemas.auth import EmailRegister, EmailLogin, Token

router = APIRouter()

# Email/Password Authentication
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: EmailRegister, db: Session = Depends(get_db_session)):
    """
    Register with email and password
    """
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email or username already exists"
        )

    new_user = User(
        id=str(uuid.uuid4()),
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        is_github_connected=False,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": new_user.id, "username": new_user.username})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        username=new_user.username,
        is_github_connected=False
    )

@router.post("/login", response_model=Token)
async def login(credentials: EmailLogin, db: Session = Depends(get_db_session)):
    """
    Login with email and password
    """
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="This account uses GitHub login. Please login with GitHub."
        )

    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if user.deleted_at:
        deletion_deadline = user.deleted_at + __import__('datetime').timedelta(days=7)
        if datetime.utcnow() > deletion_deadline:
            raise HTTPException(
                status_code=403,
                detail="Account has been permanently deleted"
            )
        else:
            raise HTTPException(
                status_code=403,
                detail="Account is scheduled for deletion. Please restore your account first."
            )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(data={"sub": user.id, "username": user.username})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        is_github_connected=user.is_github_connected
    )

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Get current user information
    """
    if current_user.is_github_connected and not current_user.github_username and current_user.github_access_token:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.github.com/user",
                    headers={
                        "Authorization": f"Bearer {current_user.github_access_token}",
                        "Accept": "application/json",
                    },
                )
                if response.status_code == 200:
                    github_user = response.json()
                    current_user.github_username = github_user["login"]
                    db.commit()
                    db.refresh(current_user)
        except Exception as e:
            print(f"Failed to fetch GitHub username: {e}")

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
        "github_username": current_user.github_username,
        "is_github_connected": current_user.is_github_connected,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }

# GitHub OAuth
@router.get("/github/login")
async def github_login():
    """
    Redirect to GitHub OAuth login (for new users)
    """
    # GitHub Actions 기능에 필요한 전체 권한
    scopes = ",".join([
        "user",           # 유저 정보
        "repo",           # 레포지토리 전체 접근
        "read:org",       # 조직 정보 읽기
        "workflow",       # 워크플로우 파일 수정 (.github/workflows)
        "write:packages", # GitHub Packages 푸시 (Docker 등)
        "read:packages",  # GitHub Packages 읽기
    ])
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope={scopes}"
    )
    return RedirectResponse(url=github_auth_url)

@router.post("/connect-github")
async def connect_github(
    code: str,
    redirect_uri: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Connect or reconnect GitHub account to existing user
    """
    # Use provided redirect_uri or fall back to default
    actual_redirect_uri = redirect_uri or settings.GITHUB_REDIRECT_URI

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": actual_redirect_uri,
            },
        )

        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="No access token in response")

        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
        )

        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")

        github_user = user_response.json()

    existing_github_user = db.query(User).filter(
        User.github_id == str(github_user["id"])
    ).first()

    if existing_github_user and existing_github_user.id != current_user.id:
        raise HTTPException(
            status_code=400,
            detail="This GitHub account is already connected to another user"
        )

    current_user.github_id = str(github_user["id"])
    current_user.github_access_token = access_token
    current_user.is_github_connected = True
    current_user.avatar_url = github_user.get("avatar_url") or current_user.avatar_url
    current_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(current_user)

    return {
        "message": "GitHub connected successfully",
        "is_github_connected": True
    }


@router.post("/disconnect-github")
async def disconnect_github(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Disconnect GitHub account from user
    """
    if not current_user.is_github_connected:
        raise HTTPException(status_code=400, detail="GitHub is not connected")

    # Check if user has password (can login without GitHub)
    if not current_user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="Cannot disconnect GitHub. Please set a password first as this is a GitHub-only account."
        )

    current_user.github_id = None
    current_user.github_username = None
    current_user.github_access_token = None
    current_user.is_github_connected = False
    current_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(current_user)

    return {
        "message": "GitHub disconnected successfully",
        "is_github_connected": False
    }


@router.get("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db_session)):
    """
    Handle GitHub OAuth callback (for GitHub-only login)
    """
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
        )

        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="No access token in response")

        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
        )

        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")

        github_user = user_response.json()

    existing_user = db.query(User).filter(
        User.github_id == str(github_user["id"])
    ).first()

    if existing_user:
        existing_user.github_username = github_user["login"]
        existing_user.github_access_token = access_token
        existing_user.is_github_connected = True
        existing_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_user)
        user = existing_user
    else:
        email = github_user.get("email")
        if not email:
            email = f"{github_user['login']}@users.noreply.github.com"

        new_user = User(
            id=str(uuid.uuid4()),
            github_id=str(github_user["id"]),
            github_username=github_user["login"],
            username=github_user["login"],
            email=email,
            avatar_url=github_user.get("avatar_url"),
            github_access_token=access_token,
            is_github_connected=True,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user

    jwt_token = create_access_token(data={"sub": user.id, "username": user.username})

    redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}&user_id={user.id}"
    return RedirectResponse(url=redirect_url)

@router.post("/refresh")
async def refresh_token(current_user_id: str, db: Session = Depends(get_db_session)):
    """
    Refresh JWT token
    """
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_token = create_access_token(data={"sub": user.id, "username": user.username})
    return {"access_token": new_token, "token_type": "bearer"}

# Account Management
@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Soft delete user account (stored for 7 days before permanent deletion)
    """
    if current_user.deleted_at:
        raise HTTPException(
            status_code=400,
            detail="Account already marked for deletion"
        )

    current_user.deleted_at = datetime.utcnow()
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Account deletion scheduled",
        "deleted_at": current_user.deleted_at,
        "permanent_deletion_date": current_user.deleted_at + __import__('datetime').timedelta(days=7),
        "note": "You have 7 days to restore your account. After that, it will be permanently deleted."
    }

@router.post("/account/restore", status_code=status.HTTP_200_OK)
async def restore_account(
    email: str,
    password: str,
    db: Session = Depends(get_db_session)
):
    """
    Restore a soft-deleted account (within 7 days)
    """
    from app.core.security import verify_password

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.deleted_at:
        raise HTTPException(status_code=400, detail="Account is not marked for deletion")

    if not user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="This account uses GitHub login. Please contact support to restore."
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")

    deletion_deadline = user.deleted_at + __import__('datetime').timedelta(days=7)
    if datetime.utcnow() > deletion_deadline:
        raise HTTPException(
            status_code=403,
            detail="Restoration period has expired. Account cannot be restored."
        )

    user.deleted_at = None
    user.is_active = True
    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.id, "username": user.username})

    return {
        "message": "Account restored successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }
