from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.api.deps import get_db_session, get_current_user
from app.models import User, BlogPost, PostLike, Follow, Comment, PostView
from app.schemas.social import (
    MyPageProfile,
    UserStats,
    SocialLink,
    SocialLinksUpdate,
    UserBioUpdate,
    FollowerUser
)
from app.schemas.blog import BlogPostPublic, AuthorPublic, DailyStats, StatsHistory

router = APIRouter()


@router.get("/me", response_model=MyPageProfile)
def get_my_page(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get current user's my page profile with stats"""
    # Calculate stats
    total_posts = db.query(func.count(BlogPost.id)).filter(
        BlogPost.user_id == current_user.id,
        BlogPost.status == "published"
    ).scalar()

    total_views = db.query(func.coalesce(func.sum(BlogPost.view_count), 0)).filter(
        BlogPost.user_id == current_user.id
    ).scalar()

    total_likes_received = db.query(func.coalesce(func.sum(BlogPost.likes_count), 0)).filter(
        BlogPost.user_id == current_user.id
    ).scalar()

    total_likes_given = db.query(func.count(PostLike.id)).filter(
        PostLike.user_id == current_user.id
    ).scalar()

    followers_count = db.query(func.count(Follow.id)).filter(
        Follow.following_id == current_user.id
    ).scalar()

    following_count = db.query(func.count(Follow.id)).filter(
        Follow.follower_id == current_user.id
    ).scalar()

    stats = UserStats(
        total_posts=total_posts,
        total_views=total_views,
        total_likes_received=total_likes_received,
        total_likes_given=total_likes_given,
        followers_count=followers_count,
        following_count=following_count
    )

    # Parse social_links from JSONB
    social_links = None
    if current_user.social_links:
        social_links = [SocialLink(**link) for link in current_user.social_links]

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "github_username": current_user.github_username,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "social_links": social_links,
        "is_github_connected": current_user.is_github_connected,
        "created_at": current_user.created_at,
        "stats": stats
    }


@router.patch("/me/bio")
def update_my_bio(
    data: UserBioUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update current user's bio"""
    current_user.bio = data.bio
    db.commit()
    db.refresh(current_user)
    return {"bio": current_user.bio}


@router.put("/me/social-links")
def update_social_links(
    data: SocialLinksUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update current user's social links"""
    # Convert to list of dicts for JSONB storage
    links_data = [link.model_dump() for link in data.social_links]
    current_user.social_links = links_data
    db.commit()
    db.refresh(current_user)

    return {"social_links": current_user.social_links}


@router.get("/me/posts", response_model=List[BlogPostPublic])
def get_my_posts(
    status: Optional[str] = None,  # all, published, draft
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get current user's posts"""
    query = db.query(BlogPost).filter(BlogPost.user_id == current_user.id)

    if status == "published":
        query = query.filter(BlogPost.status == "published")
    elif status == "draft":
        query = query.filter(BlogPost.status == "draft")

    query = query.order_by(desc(BlogPost.updated_at))

    offset = (page - 1) * limit
    posts = query.offset(offset).limit(limit).all()

    author = AuthorPublic(
        id=current_user.id,
        username=current_user.username,
        github_username=current_user.github_username,
        avatar_url=current_user.avatar_url,
        bio=current_user.bio
    )

    return [
        {
            "id": post.id,
            "title": post.title,
            "slug": post.slug,
            "excerpt": post.excerpt,
            "cover_image": post.cover_image,
            "tags": post.tags,
            "status": post.status,
            "published_at": post.published_at,
            "view_count": post.view_count,
            "likes_count": post.likes_count or 0,
            "created_at": post.created_at,
            "author": author
        }
        for post in posts
    ]


@router.get("/me/liked-posts", response_model=List[BlogPostPublic])
def get_my_liked_posts(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get posts liked by current user"""
    query = db.query(BlogPost).join(PostLike).join(
        User, BlogPost.user_id == User.id
    ).filter(
        PostLike.user_id == current_user.id,
        BlogPost.status == "published"
    ).order_by(desc(PostLike.created_at))

    offset = (page - 1) * limit
    posts = query.offset(offset).limit(limit).all()

    return [
        {
            "id": post.id,
            "title": post.title,
            "slug": post.slug,
            "excerpt": post.excerpt,
            "cover_image": post.cover_image,
            "tags": post.tags,
            "status": post.status,
            "published_at": post.published_at,
            "view_count": post.view_count,
            "likes_count": post.likes_count or 0,
            "created_at": post.created_at,
            "author": {
                "id": post.user.id,
                "username": post.user.username,
                "github_username": post.user.github_username,
                "avatar_url": post.user.avatar_url,
                "bio": post.user.bio
            }
        }
        for post in posts
    ]


@router.get("/me/followers", response_model=List[FollowerUser])
def get_my_followers(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get current user's followers"""
    offset = (page - 1) * limit
    follows = db.query(Follow).filter(
        Follow.following_id == current_user.id
    ).order_by(desc(Follow.created_at)).offset(offset).limit(limit).all()

    result = []
    for follow in follows:
        follower = follow.follower
        # Check if current user follows back
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == follower.id
        ).first() is not None

        result.append({
            "id": follower.id,
            "username": follower.username,
            "github_username": follower.github_username,
            "avatar_url": follower.avatar_url,
            "bio": follower.bio,
            "is_following": is_following
        })

    return result


@router.get("/me/following", response_model=List[FollowerUser])
def get_my_following(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get users that current user is following"""
    offset = (page - 1) * limit
    follows = db.query(Follow).filter(
        Follow.follower_id == current_user.id
    ).order_by(desc(Follow.created_at)).offset(offset).limit(limit).all()

    result = []
    for follow in follows:
        following = follow.following
        result.append({
            "id": following.id,
            "username": following.username,
            "github_username": following.github_username,
            "avatar_url": following.avatar_url,
            "bio": following.bio,
            "is_following": True  # Obviously following since this is the following list
        })

    return result


@router.get("/me/stats", response_model=UserStats)
def get_my_stats(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get current user's statistics"""
    total_posts = db.query(func.count(BlogPost.id)).filter(
        BlogPost.user_id == current_user.id,
        BlogPost.status == "published"
    ).scalar()

    total_views = db.query(func.coalesce(func.sum(BlogPost.view_count), 0)).filter(
        BlogPost.user_id == current_user.id
    ).scalar()

    total_likes_received = db.query(func.coalesce(func.sum(BlogPost.likes_count), 0)).filter(
        BlogPost.user_id == current_user.id
    ).scalar()

    total_likes_given = db.query(func.count(PostLike.id)).filter(
        PostLike.user_id == current_user.id
    ).scalar()

    followers_count = db.query(func.count(Follow.id)).filter(
        Follow.following_id == current_user.id
    ).scalar()

    following_count = db.query(func.count(Follow.id)).filter(
        Follow.follower_id == current_user.id
    ).scalar()

    return UserStats(
        total_posts=total_posts,
        total_views=total_views,
        total_likes_received=total_likes_received,
        total_likes_given=total_likes_given,
        followers_count=followers_count,
        following_count=following_count
    )


@router.get("/me/stats/history", response_model=StatsHistory)
def get_my_stats_history(
    days: int = 30,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get user's stats history for charts (likes and comments received on my posts by date)"""
    # Limit days to prevent abuse
    days = min(days, 90)

    # Get all user's post IDs
    user_post_ids = db.query(BlogPost.id).filter(
        BlogPost.user_id == current_user.id
    ).all()
    post_ids = [p.id for p in user_post_ids]

    # Calculate date range
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days - 1)

    # Get views by date on user's posts
    views_by_date = {}
    if post_ids:
        views_query = db.query(
            cast(PostView.view_date, Date).label('date'),
            func.sum(PostView.view_count).label('count')
        ).filter(
            PostView.post_id.in_(post_ids),
            cast(PostView.view_date, Date) >= start_date
        ).group_by(cast(PostView.view_date, Date)).all()

        for row in views_query:
            views_by_date[str(row.date)] = row.count or 0

    # Get likes by date on user's posts
    likes_by_date = {}
    if post_ids:
        likes_query = db.query(
            cast(PostLike.created_at, Date).label('date'),
            func.count(PostLike.id).label('count')
        ).filter(
            PostLike.post_id.in_(post_ids),
            cast(PostLike.created_at, Date) >= start_date
        ).group_by(cast(PostLike.created_at, Date)).all()

        for row in likes_query:
            likes_by_date[str(row.date)] = row.count

    # Get comments by date on user's posts
    comments_by_date = {}
    if post_ids:
        comments_query = db.query(
            cast(Comment.created_at, Date).label('date'),
            func.count(Comment.id).label('count')
        ).filter(
            Comment.post_id.in_(post_ids),
            Comment.is_deleted == False,
            cast(Comment.created_at, Date) >= start_date
        ).group_by(cast(Comment.created_at, Date)).all()

        for row in comments_query:
            comments_by_date[str(row.date)] = row.count

    # Build daily stats for all days in range
    daily_stats = []
    current_date = start_date
    while current_date <= end_date:
        date_str = str(current_date)
        daily_stats.append(DailyStats(
            date=date_str,
            views=views_by_date.get(date_str, 0),
            likes=likes_by_date.get(date_str, 0),
            comments=comments_by_date.get(date_str, 0)
        ))
        current_date += timedelta(days=1)

    # Get totals
    total_views = db.query(func.coalesce(func.sum(BlogPost.view_count), 0)).filter(
        BlogPost.user_id == current_user.id
    ).scalar()

    total_likes = db.query(func.coalesce(func.sum(BlogPost.likes_count), 0)).filter(
        BlogPost.user_id == current_user.id
    ).scalar()

    total_comments = db.query(func.coalesce(func.sum(BlogPost.comments_count), 0)).filter(
        BlogPost.user_id == current_user.id
    ).scalar()

    return StatsHistory(
        daily_stats=daily_stats,
        total_views=total_views,
        total_likes=total_likes,
        total_comments=total_comments
    )
