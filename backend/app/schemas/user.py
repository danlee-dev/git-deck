from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=500)
    company: Optional[str] = Field(None, max_length=255)

class UserCreate(UserBase):
    github_id: str = Field(..., max_length=100)
    access_token: str

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=500)
    company: Optional[str] = Field(None, max_length=255)

class UserResponse(UserBase):
    id: str
    github_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
