from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, date
import uuid

from app.api.deps import get_db_session, get_current_user_optional, get_current_user
from app.models import User, BlogPost, PostLike, Follow, Comment, Notification, PostView
from app.api.v1.endpoints.notifications import create_notification
from app.schemas.blog import BlogPostPublic, BlogPostDetailPublic, AuthorPublic, CommentCreate, CommentUpdate, CommentResponse
from app.schemas.social import (
    UserPublicProfile,
    FollowResponse,
    FollowerUser,
    LikeResponse,
    UserBioUpdate
)

router = APIRouter()


def post_to_public(post: BlogPost, author: User) -> dict:
    """Convert post to public response with author info"""
    return {
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
        "comments_count": post.comments_count or 0,
        "created_at": post.created_at,
        "author": {
            "id": author.id,
            "username": author.username,
            "github_username": author.github_username,
            "avatar_url": author.avatar_url,
            "bio": author.bio
        }
    }


@router.get("/feed", response_model=List[BlogPostPublic])
def get_feed(
    sort_by: str = Query("recent", enum=["recent", "popular", "trending"]),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get public feed of published posts
    - recent: sorted by published_at desc
    - popular: sorted by likes_count desc
    - trending: sorted by view_count desc (recent 7 days)
    """
    query = db.query(BlogPost).join(User).filter(
        BlogPost.status == "published",
        User.is_active == True
    )

    if sort_by == "recent":
        query = query.order_by(desc(BlogPost.published_at))
    elif sort_by == "popular":
        query = query.order_by(desc(BlogPost.likes_count), desc(BlogPost.published_at))
    elif sort_by == "trending":
        query = query.order_by(desc(BlogPost.view_count), desc(BlogPost.published_at))

    offset = (page - 1) * limit
    posts = query.offset(offset).limit(limit).all()

    result = []
    for post in posts:
        result.append(post_to_public(post, post.user))

    return result


@router.get("/feed/liked", response_model=List[BlogPostPublic])
def get_liked_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
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

    result = []
    for post in posts:
        result.append(post_to_public(post, post.user))

    return result


@router.get("/users/{username}", response_model=UserPublicProfile)
def get_user_profile(
    username: str,
    db: Session = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get public user profile"""
    user = db.query(User).filter(
        User.username == username,
        User.is_active == True
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Count followers/following/posts
    followers_count = db.query(func.count(Follow.id)).filter(
        Follow.following_id == user.id
    ).scalar()

    following_count = db.query(func.count(Follow.id)).filter(
        Follow.follower_id == user.id
    ).scalar()

    posts_count = db.query(func.count(BlogPost.id)).filter(
        BlogPost.user_id == user.id,
        BlogPost.status == "published"
    ).scalar()

    # Check if current user is following
    is_following = False
    if current_user and current_user.id != user.id:
        follow = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user.id
        ).first()
        is_following = follow is not None

    # Parse social_links
    social_links = None
    if user.social_links:
        social_links = user.social_links

    return {
        "id": user.id,
        "username": user.username,
        "github_username": user.github_username,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "social_links": social_links,
        "is_github_connected": user.is_github_connected,
        "created_at": user.created_at,
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count,
        "is_following": is_following
    }


@router.get("/users/{username}/posts", response_model=List[BlogPostPublic])
def get_user_posts(
    username: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """Get published posts by user"""
    user = db.query(User).filter(
        User.username == username,
        User.is_active == True
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = db.query(BlogPost).filter(
        BlogPost.user_id == user.id,
        BlogPost.status == "published"
    ).order_by(desc(BlogPost.published_at))

    offset = (page - 1) * limit
    posts = query.offset(offset).limit(limit).all()

    result = []
    for post in posts:
        result.append(post_to_public(post, user))

    return result


@router.get("/users/{username}/posts/{slug}", response_model=BlogPostDetailPublic)
def get_user_post(
    username: str,
    slug: str,
    db: Session = Depends(get_db_session)
):
    """Get a specific published post by user and slug"""
    user = db.query(User).filter(
        User.username == username,
        User.is_active == True
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    post = db.query(BlogPost).filter(
        BlogPost.user_id == user.id,
        BlogPost.slug == slug,
        BlogPost.status == "published"
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Increment view count
    post.view_count = (post.view_count or 0) + 1

    # Track view history by date
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_view = db.query(PostView).filter(
        PostView.post_id == post.id,
        PostView.view_date == today
    ).first()

    if existing_view:
        existing_view.view_count += 1
    else:
        new_view = PostView(
            id=str(uuid.uuid4()),
            post_id=post.id,
            view_date=today,
            view_count=1
        )
        db.add(new_view)

    db.commit()

    return {
        "id": post.id,
        "title": post.title,
        "slug": post.slug,
        "content_md": post.content_md,
        "content_blocks": post.content_blocks,
        "excerpt": post.excerpt,
        "cover_image": post.cover_image,
        "tags": post.tags,
        "status": post.status,
        "published_at": post.published_at,
        "view_count": post.view_count,
        "likes_count": post.likes_count or 0,
        "comments_count": post.comments_count or 0,
        "github_repo_id": post.github_repo_id,
        "created_at": post.created_at,
        "author": {
            "id": user.id,
            "username": user.username,
            "github_username": user.github_username,
            "avatar_url": user.avatar_url,
            "bio": user.bio
        }
    }


# Like endpoints
@router.post("/posts/{post_id}/like", response_model=LikeResponse)
def like_post(
    post_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Like a post"""
    post = db.query(BlogPost).filter(
        BlogPost.id == post_id,
        BlogPost.status == "published"
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if already liked
    existing_like = db.query(PostLike).filter(
        PostLike.user_id == current_user.id,
        PostLike.post_id == post_id
    ).first()

    if existing_like:
        raise HTTPException(status_code=400, detail="Already liked")

    like = PostLike(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        post_id=post_id
    )
    db.add(like)

    # Update likes count
    post.likes_count = (post.likes_count or 0) + 1

    # Create notification for post author
    create_notification(
        db=db,
        user_id=post.user_id,
        actor_id=current_user.id,
        notification_type="like",
        post_id=post_id
    )

    db.commit()
    db.refresh(like)

    return like


@router.delete("/posts/{post_id}/like")
def unlike_post(
    post_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Unlike a post"""
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    like = db.query(PostLike).filter(
        PostLike.user_id == current_user.id,
        PostLike.post_id == post_id
    ).first()

    if not like:
        raise HTTPException(status_code=400, detail="Not liked")

    db.delete(like)

    # Update likes count
    post.likes_count = max((post.likes_count or 0) - 1, 0)
    db.commit()

    return {"status": "unliked"}


@router.get("/posts/{post_id}/liked")
def check_liked(
    post_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Check if current user liked a post"""
    like = db.query(PostLike).filter(
        PostLike.user_id == current_user.id,
        PostLike.post_id == post_id
    ).first()

    return {"liked": like is not None}


# Follow endpoints
@router.post("/users/{user_id}/follow", response_model=FollowResponse)
def follow_user(
    user_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Follow a user"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target_user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already following
    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()

    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following")

    follow = Follow(
        id=str(uuid.uuid4()),
        follower_id=current_user.id,
        following_id=user_id
    )
    db.add(follow)

    # Create notification for followed user
    create_notification(
        db=db,
        user_id=user_id,
        actor_id=current_user.id,
        notification_type="follow"
    )

    db.commit()
    db.refresh(follow)

    return follow


@router.delete("/users/{user_id}/follow")
def unfollow_user(
    user_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Unfollow a user"""
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()

    if not follow:
        raise HTTPException(status_code=400, detail="Not following")

    db.delete(follow)
    db.commit()

    return {"status": "unfollowed"}


@router.get("/users/{user_id}/followers", response_model=List[FollowerUser])
def get_followers(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get user's followers"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    offset = (page - 1) * limit
    follows = db.query(Follow).filter(
        Follow.following_id == user_id
    ).offset(offset).limit(limit).all()

    result = []
    for follow in follows:
        follower = follow.follower
        is_following = False
        if current_user:
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


@router.get("/users/{user_id}/following", response_model=List[FollowerUser])
def get_following(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get users that this user is following"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    offset = (page - 1) * limit
    follows = db.query(Follow).filter(
        Follow.follower_id == user_id
    ).offset(offset).limit(limit).all()

    result = []
    for follow in follows:
        following = follow.following
        is_following = False
        if current_user:
            is_following = db.query(Follow).filter(
                Follow.follower_id == current_user.id,
                Follow.following_id == following.id
            ).first() is not None

        result.append({
            "id": following.id,
            "username": following.username,
            "github_username": following.github_username,
            "avatar_url": following.avatar_url,
            "bio": following.bio,
            "is_following": is_following
        })

    return result


# User bio update
@router.patch("/users/me/bio")
def update_bio(
    data: UserBioUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update current user's bio"""
    current_user.bio = data.bio
    db.commit()
    db.refresh(current_user)

    return {"bio": current_user.bio}


# Comment endpoints
def comment_to_response(comment: Comment) -> dict:
    """Convert comment to response dict"""
    return {
        "id": comment.id,
        "content": comment.content if not comment.is_deleted else "[deleted]",
        "author": {
            "id": comment.user.id,
            "username": comment.user.username,
            "github_username": comment.user.github_username,
            "avatar_url": comment.user.avatar_url,
        },
        "parent_id": comment.parent_id,
        "is_deleted": comment.is_deleted,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "replies": []
    }


def build_comment_tree(comments: List[Comment]) -> List[dict]:
    """Build hierarchical comment tree from flat list"""
    comment_dict = {}
    root_comments = []

    # First pass: create dict entries
    for comment in comments:
        comment_dict[comment.id] = comment_to_response(comment)

    # Second pass: build tree
    for comment in comments:
        if comment.parent_id is None:
            root_comments.append(comment_dict[comment.id])
        elif comment.parent_id in comment_dict:
            comment_dict[comment.parent_id]["replies"].append(comment_dict[comment.id])

    return root_comments


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_post_comments(
    post_id: str,
    db: Session = Depends(get_db_session)
):
    """Get all comments for a post"""
    post = db.query(BlogPost).filter(
        BlogPost.id == post_id,
        BlogPost.status == "published"
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = db.query(Comment).filter(
        Comment.post_id == post_id
    ).order_by(Comment.created_at.asc()).all()

    return build_comment_tree(comments)


@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def create_comment(
    post_id: str,
    data: CommentCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new comment on a post"""
    post = db.query(BlogPost).filter(
        BlogPost.id == post_id,
        BlogPost.status == "published"
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Validate parent comment if provided
    if data.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == data.parent_id,
            Comment.post_id == post_id
        ).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    comment = Comment(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        post_id=post_id,
        parent_id=data.parent_id,
        content=data.content
    )
    db.add(comment)

    # Update comments count
    post.comments_count = (post.comments_count or 0) + 1

    # Create notification
    if data.parent_id:
        # Reply to a comment - notify parent comment author
        parent_comment = db.query(Comment).filter(Comment.id == data.parent_id).first()
        if parent_comment:
            create_notification(
                db=db,
                user_id=parent_comment.user_id,
                actor_id=current_user.id,
                notification_type="reply",
                post_id=post_id,
                comment_id=comment.id
            )
    else:
        # New comment - notify post author
        create_notification(
            db=db,
            user_id=post.user_id,
            actor_id=current_user.id,
            notification_type="comment",
            post_id=post_id,
            comment_id=comment.id
        )

    db.commit()
    db.refresh(comment)

    return comment_to_response(comment)


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: str,
    data: CommentUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update a comment (only by author)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")

    if comment.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot edit deleted comment")

    comment.content = data.content
    db.commit()
    db.refresh(comment)

    return comment_to_response(comment)


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a comment (soft delete, only by author)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    comment.is_deleted = True
    comment.content = ""

    # Update comments count
    post = db.query(BlogPost).filter(BlogPost.id == comment.post_id).first()
    if post:
        post.comments_count = max((post.comments_count or 0) - 1, 0)

    db.commit()

    return {"status": "deleted"}
