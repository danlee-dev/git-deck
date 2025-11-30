from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BlogPostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    slug: str = Field(..., min_length=1, max_length=255)
    content_md: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    status: str = Field(default="draft", max_length=20)

class BlogPostCreate(BlogPostBase):
    series_id: Optional[str] = None

class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    content_md: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = Field(None, max_length=20)
    series_id: Optional[str] = None

class BlogPostResponse(BlogPostBase):
    id: str
    user_id: str
    series_id: Optional[str]
    published_at: Optional[datetime]
    view_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SeriesBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    is_public: bool = Field(default=True)

class SeriesCreate(SeriesBase):
    pass

class SeriesUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    is_public: Optional[bool] = None

class SeriesResponse(SeriesBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
