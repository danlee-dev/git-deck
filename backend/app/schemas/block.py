from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class BlockBase(BaseModel):
    type: str = Field(..., max_length=50)
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[Dict[str, Any]] = None
    order_index: int = Field(default=0)
    width: int = Field(default=12)
    is_visible: bool = Field(default=True)

class BlockCreate(BaseModel):
    profile_id: str
    type: str = Field(..., max_length=50)
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[Dict[str, Any]] = None
    order_index: int = Field(default=0)
    width: int = Field(default=12)
    is_visible: bool = Field(default=True)

class BlockUpdate(BaseModel):
    type: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[Dict[str, Any]] = None
    order_index: Optional[int] = None
    width: Optional[int] = None
    is_visible: Optional[bool] = None

class BlockResponse(BaseModel):
    id: str
    profile_id: str
    type: str
    title: Optional[str]
    content: Optional[Dict[str, Any]]
    order_index: int
    width: int
    is_visible: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
