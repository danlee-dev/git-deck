from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SocialLink(BaseModel):
    platform: str  # github, linkedin, twitter, instagram, youtube, website, etc.
    url: str
    label: Optional[str] = None  # custom label for "website" type


class UserPublicProfile(BaseModel):
    id: str
    username: str
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    social_links: Optional[List[SocialLink]] = None
    is_github_connected: bool = False
    created_at: datetime
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    is_following: bool = False

    class Config:
        from_attributes = True


class FollowResponse(BaseModel):
    id: str
    follower_id: str
    following_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class FollowerUser(BaseModel):
    id: str
    username: str
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_following: bool = False

    class Config:
        from_attributes = True


class LikeResponse(BaseModel):
    id: str
    user_id: str
    post_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class FeedFilters(BaseModel):
    sort_by: str = "recent"  # recent, popular, liked
    page: int = 1
    limit: int = 20


class UserBioUpdate(BaseModel):
    bio: Optional[str] = None


class SocialLinksUpdate(BaseModel):
    social_links: List[SocialLink]


class UserStats(BaseModel):
    total_posts: int = 0
    total_views: int = 0
    total_likes_received: int = 0
    total_likes_given: int = 0
    followers_count: int = 0
    following_count: int = 0


class MyPageProfile(BaseModel):
    id: str
    username: str
    email: str
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    social_links: Optional[List[SocialLink]] = None
    is_github_connected: bool = False
    created_at: datetime
    stats: UserStats

    class Config:
        from_attributes = True
