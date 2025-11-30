from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid
from app.api.deps import get_db_session
from app.models import BlogPost, Series, User
from app.schemas.blog import (
    BlogPostCreate, BlogPostUpdate, BlogPostResponse,
    SeriesCreate, SeriesUpdate, SeriesResponse
)

router = APIRouter()

# Blog Post endpoints
@router.get("/posts", response_model=List[BlogPostResponse])
def get_posts(
    user_id: str = None,
    status: str = "published",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """
    Get blog posts, optionally filtered by user_id and status
    """
    query = db.query(BlogPost)

    if user_id:
        query = query.filter(BlogPost.user_id == user_id)

    if status:
        query = query.filter(BlogPost.status == status)

    posts = query.order_by(BlogPost.published_at.desc()).offset(skip).limit(limit).all()
    return posts

@router.get("/posts/{post_id}", response_model=BlogPostResponse)
def get_post(post_id: str, db: Session = Depends(get_db_session)):
    """
    Get blog post by ID
    """
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.post("/posts", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    user_id: str,
    post_data: BlogPostCreate,
    db: Session = Depends(get_db_session)
):
    """
    Create new blog post
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if post_data.series_id:
        series = db.query(Series).filter(Series.id == post_data.series_id).first()
        if not series:
            raise HTTPException(status_code=404, detail="Series not found")

    existing_post = db.query(BlogPost).filter(
        BlogPost.user_id == user_id,
        BlogPost.slug == post_data.slug
    ).first()
    if existing_post:
        raise HTTPException(status_code=400, detail="Post with this slug already exists")

    new_post = BlogPost(
        id=str(uuid.uuid4()),
        user_id=user_id,
        series_id=post_data.series_id,
        title=post_data.title,
        slug=post_data.slug,
        content_md=post_data.content_md,
        excerpt=post_data.excerpt,
        cover_image=post_data.cover_image,
        tags=post_data.tags,
        status=post_data.status,
        published_at=datetime.utcnow() if post_data.status == "published" else None,
        view_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return new_post

@router.put("/posts/{post_id}", response_model=BlogPostResponse)
def update_post(
    post_id: str,
    post_data: BlogPostUpdate,
    db: Session = Depends(get_db_session)
):
    """
    Update blog post
    """
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    update_data = post_data.model_dump(exclude_unset=True)

    if "slug" in update_data:
        existing_post = db.query(BlogPost).filter(
            BlogPost.user_id == post.user_id,
            BlogPost.slug == update_data["slug"],
            BlogPost.id != post_id
        ).first()
        if existing_post:
            raise HTTPException(status_code=400, detail="Slug already taken")

    if "series_id" in update_data and update_data["series_id"]:
        series = db.query(Series).filter(Series.id == update_data["series_id"]).first()
        if not series:
            raise HTTPException(status_code=404, detail="Series not found")

    if "status" in update_data:
        if update_data["status"] == "published" and post.status != "published":
            post.published_at = datetime.utcnow()
        elif update_data["status"] != "published" and post.status == "published":
            post.published_at = None

    for field, value in update_data.items():
        setattr(post, field, value)

    post.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(post)

    return post

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: str, db: Session = Depends(get_db_session)):
    """
    Delete blog post
    """
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    db.delete(post)
    db.commit()

    return None

# Series endpoints
@router.get("/series", response_model=List[SeriesResponse])
def get_series_list(
    user_id: str = None,
    db: Session = Depends(get_db_session)
):
    """
    Get all series
    """
    query = db.query(Series)

    if user_id:
        query = query.filter(Series.user_id == user_id)

    series_list = query.all()
    return series_list

@router.get("/series/{series_id}", response_model=SeriesResponse)
def get_series(series_id: str, db: Session = Depends(get_db_session)):
    """
    Get series by ID
    """
    series = db.query(Series).filter(Series.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    return series

@router.post("/series", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
def create_series(
    user_id: str,
    series_data: SeriesCreate,
    db: Session = Depends(get_db_session)
):
    """
    Create new series
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_series = db.query(Series).filter(
        Series.user_id == user_id,
        Series.slug == series_data.slug
    ).first()
    if existing_series:
        raise HTTPException(status_code=400, detail="Series with this slug already exists")

    new_series = Series(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=series_data.title,
        slug=series_data.slug,
        description=series_data.description,
        thumbnail=series_data.thumbnail,
        is_public=series_data.is_public,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_series)
    db.commit()
    db.refresh(new_series)

    return new_series

@router.put("/series/{series_id}", response_model=SeriesResponse)
def update_series(
    series_id: str,
    series_data: SeriesUpdate,
    db: Session = Depends(get_db_session)
):
    """
    Update series
    """
    series = db.query(Series).filter(Series.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    update_data = series_data.model_dump(exclude_unset=True)

    if "slug" in update_data:
        existing_series = db.query(Series).filter(
            Series.user_id == series.user_id,
            Series.slug == update_data["slug"],
            Series.id != series_id
        ).first()
        if existing_series:
            raise HTTPException(status_code=400, detail="Slug already taken")

    for field, value in update_data.items():
        setattr(series, field, value)

    series.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(series)

    return series

@router.delete("/series/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_series(series_id: str, db: Session = Depends(get_db_session)):
    """
    Delete series
    """
    series = db.query(Series).filter(Series.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    db.delete(series)
    db.commit()

    return None
