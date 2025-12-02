from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models import User
from app.core.security import verify_token

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

def get_db_session() -> Generator[Session, None, None]:
    """
    Database session dependency
    """
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_session)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db_session)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise (for public endpoints)
    """
    if credentials is None:
        return None

    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        return None

    user_id: str = payload.get("sub")
    if user_id is None:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user
    """
    if current_user.deleted_at:
        raise HTTPException(
            status_code=403,
            detail="Account is scheduled for deletion. Please restore your account to continue."
        )

    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    return current_user

def require_github_connection(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Require user to have GitHub connected
    """
    if not current_user.is_github_connected:
        raise HTTPException(
            status_code=403,
            detail="GitHub connection required. Please connect your GitHub account to use this feature."
        )
    return current_user
