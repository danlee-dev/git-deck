from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid
from app.api.deps import get_db_session
from app.models import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """
    Get all users
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db_session)):
    """
    Get user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users/username/{username}", response_model=UserResponse)
def get_user_by_username(username: str, db: Session = Depends(get_db_session)):
    """
    Get user by username
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db_session)):
    """
    Create new user
    """
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.github_id == user_data.github_id)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this username or GitHub ID already exists"
        )

    new_user = User(
        id=str(uuid.uuid4()),
        github_id=user_data.github_id,
        username=user_data.username,
        email=user_data.email,
        avatar_url=user_data.avatar_url,
        bio=user_data.bio,
        location=user_data.location,
        website=user_data.website,
        company=user_data.company,
        access_token=user_data.access_token,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db_session)
):
    """
    Update user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.model_dump(exclude_unset=True)

    if "username" in update_data:
        existing_user = db.query(User).filter(
            User.username == update_data["username"],
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")

    for field, value in update_data.items():
        setattr(user, field, value)

    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, db: Session = Depends(get_db_session)):
    """
    Delete user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return None
