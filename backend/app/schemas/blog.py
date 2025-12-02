from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# Blog Folder Schemas
class BlogFolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    icon: str = Field(default="folder", max_length=50)
    order_index: int = Field(default=0)

class BlogFolderCreate(BlogFolderBase):
    parent_id: Optional[str] = None

class BlogFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    icon: Optional[str] = Field(None, max_length=50)
    order_index: Optional[int] = None
    parent_id: Optional[str] = None
    is_expanded: Optional[bool] = None

class BlogFolderResponse(BlogFolderBase):
    id: str
    user_id: str
    parent_id: Optional[str]
    is_expanded: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Blog Post Schemas
class BlogPostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    slug: str = Field(..., min_length=1, max_length=255)
    content_md: str
    content_blocks: Optional[List[Any]] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    status: str = Field(default="draft", max_length=20)

class BlogPostCreate(BlogPostBase):
    series_id: Optional[str] = None
    folder_id: Optional[str] = None
    github_repo_id: Optional[str] = None

class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    content_md: Optional[str] = None
    content_blocks: Optional[List[Any]] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = Field(None, max_length=20)
    series_id: Optional[str] = None
    folder_id: Optional[str] = None
    github_repo_id: Optional[str] = None

class BlogPostResponse(BlogPostBase):
    id: str
    user_id: str
    series_id: Optional[str]
    folder_id: Optional[str]
    github_repo_id: Optional[str]
    github_path: Optional[str]
    github_sha: Optional[str]
    published_at: Optional[datetime]
    view_count: int
    likes_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Public schemas for feed/public API
class AuthorPublic(BaseModel):
    id: str
    username: str
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True


class BlogPostPublic(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None
    status: str
    published_at: Optional[datetime]
    view_count: int
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime
    author: AuthorPublic

    class Config:
        from_attributes = True


class BlogPostDetailPublic(BlogPostPublic):
    content_md: str
    content_blocks: Optional[List[Any]] = None
    github_repo_id: Optional[str] = None

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


# Comment Schemas
class CommentAuthor(BaseModel):
    id: str
    username: str
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[str] = None


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class CommentResponse(BaseModel):
    id: str
    content: str
    author: CommentAuthor
    parent_id: Optional[str] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    replies: List["CommentResponse"] = []

    class Config:
        from_attributes = True


# Stats History for charts
class DailyStats(BaseModel):
    date: str
    views: int = 0
    likes: int = 0
    comments: int = 0


class StatsHistory(BaseModel):
    daily_stats: List[DailyStats]
    total_views: int
    total_likes: int
    total_comments: int
