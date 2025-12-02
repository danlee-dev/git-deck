from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NotificationActor(BaseModel):
    id: str
    username: str
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None
    is_following: bool = False  # Whether current user is following this actor

    class Config:
        from_attributes = True


class NotificationPost(BaseModel):
    id: str
    title: str
    slug: str
    author_username: str  # Post author's username for navigation

    class Config:
        from_attributes = True


class NotificationComment(BaseModel):
    id: str
    content: str
    post_id: str

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    type: str  # like, comment, follow, reply
    actor: NotificationActor
    post: Optional[NotificationPost] = None
    comment: Optional[NotificationComment] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationList(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total_count: int


class MarkReadRequest(BaseModel):
    notification_ids: Optional[List[str]] = None  # If None, mark all as read
