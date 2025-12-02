from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
import uuid

from app.api.deps import get_db_session, get_current_user
from app.models import User, Notification, BlogPost, Comment, Follow
from app.schemas.notification import (
    NotificationResponse,
    NotificationList,
    NotificationActor,
    NotificationPost,
    NotificationComment,
    MarkReadRequest
)

router = APIRouter()


def notification_to_response(notification: Notification, db: Session, current_user_id: str) -> dict:
    """Convert notification to response dict"""
    actor = notification.actor
    post = notification.post
    comment = notification.comment

    # Check if current user is following the actor
    is_following = db.query(Follow).filter(
        Follow.follower_id == current_user_id,
        Follow.following_id == actor.id
    ).first() is not None

    result = {
        "id": notification.id,
        "type": notification.type,
        "actor": {
            "id": actor.id,
            "username": actor.username,
            "github_username": actor.github_username,
            "avatar_url": actor.avatar_url,
            "is_following": is_following,
        },
        "post": None,
        "comment": None,
        "is_read": notification.is_read,
        "created_at": notification.created_at,
    }

    if post:
        # Get post author username for navigation
        post_author = post.user
        result["post"] = {
            "id": post.id,
            "title": post.title,
            "slug": post.slug,
            "author_username": post_author.username if post_author else "",
        }

    if comment:
        result["comment"] = {
            "id": comment.id,
            "content": comment.content[:100] if comment.content else "",
            "post_id": comment.post_id,
        }

    return result


@router.get("", response_model=NotificationList)
def get_notifications(
    page: int = 1,
    limit: int = 20,
    unread_only: bool = False,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get user's notifications"""
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )

    if unread_only:
        query = query.filter(Notification.is_read == False)

    # Get total and unread counts
    total_count = query.count()
    unread_count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).scalar()

    # Paginate and order
    offset = (page - 1) * limit
    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()

    return {
        "notifications": [notification_to_response(n, db, current_user.id) for n in notifications],
        "unread_count": unread_count,
        "total_count": total_count,
    }


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).scalar()

    return {"count": count}


@router.post("/mark-read")
def mark_notifications_read(
    data: MarkReadRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Mark notifications as read"""
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )

    if data.notification_ids:
        query = query.filter(Notification.id.in_(data.notification_ids))

    query.update({"is_read": True}, synchronize_session=False)
    db.commit()

    return {"status": "success"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()

    return {"status": "deleted"}


# Helper function to create notifications (used by other endpoints)
def create_notification(
    db: Session,
    user_id: str,  # Recipient
    actor_id: str,  # Who triggered
    notification_type: str,
    post_id: Optional[str] = None,
    comment_id: Optional[str] = None
):
    """Create a new notification"""
    # Don't create notification if user is notifying themselves
    if user_id == actor_id:
        return None

    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        actor_id=actor_id,
        type=notification_type,
        post_id=post_id,
        comment_id=comment_id,
    )
    db.add(notification)
    return notification
