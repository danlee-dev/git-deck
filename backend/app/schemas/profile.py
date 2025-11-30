from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ProfileBase(BaseModel):
    slug: str = Field(..., min_length=1, max_length=255)
    display_name: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = None
    theme_config: Optional[Dict[str, Any]] = None
    is_public: bool = Field(default=True)
    custom_domain: Optional[str] = Field(None, max_length=255)

class ProfileCreate(BaseModel):
    slug: str = Field(..., min_length=1, max_length=255)
    display_name: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = None
    theme_config: Optional[Dict[str, Any]] = None
    is_public: bool = Field(default=True)
    custom_domain: Optional[str] = Field(None, max_length=255)

class ProfileUpdate(BaseModel):
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    display_name: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = None
    theme_config: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None
    custom_domain: Optional[str] = Field(None, max_length=255)

class ProfileResponse(BaseModel):
    id: str
    user_id: str
    slug: str
    display_name: Optional[str]
    bio: Optional[str]
    theme_config: Optional[Dict[str, Any]]
    is_public: bool
    custom_domain: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
