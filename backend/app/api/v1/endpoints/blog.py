from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import base64
import os
from app.api.deps import get_db_session, get_current_user
from app.models import BlogPost, BlogFolder, Series, User
from app.schemas.blog import (
    BlogPostCreate, BlogPostUpdate, BlogPostResponse,
    BlogFolderCreate, BlogFolderUpdate, BlogFolderResponse,
    SeriesCreate, SeriesUpdate, SeriesResponse
)

router = APIRouter()

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Image upload endpoint
@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an image and return its URL"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Save file
    content = await file.read()
    with open(filepath, 'wb') as f:
        f.write(content)

    # Return URL (relative path)
    return {"url": f"/api/v1/blog/images/{filename}"}


@router.get("/images/{filename}")
async def get_image(filename: str):
    """Serve uploaded image"""
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image not found")

    # Determine content type
    ext = filename.split('.')[-1].lower()
    content_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
    }
    content_type = content_types.get(ext, 'application/octet-stream')

    return FileResponse(filepath, media_type=content_type)


# Blog Folder endpoints
@router.get("/folders", response_model=List[BlogFolderResponse])
def get_folders(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get all folders for current user"""
    folders = db.query(BlogFolder).filter(
        BlogFolder.user_id == current_user.id
    ).order_by(BlogFolder.order_index).all()
    return folders


@router.get("/folders/{folder_id}", response_model=BlogFolderResponse)
def get_folder(
    folder_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get folder by ID"""
    folder = db.query(BlogFolder).filter(
        BlogFolder.id == folder_id,
        BlogFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder


@router.post("/folders", response_model=BlogFolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    folder_data: BlogFolderCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create new folder"""
    if folder_data.parent_id:
        parent = db.query(BlogFolder).filter(
            BlogFolder.id == folder_data.parent_id,
            BlogFolder.user_id == current_user.id
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    new_folder = BlogFolder(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        parent_id=folder_data.parent_id,
        name=folder_data.name,
        icon=folder_data.icon,
        order_index=folder_data.order_index,
        is_expanded=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    return new_folder


@router.patch("/folders/{folder_id}", response_model=BlogFolderResponse)
def update_folder(
    folder_id: str,
    folder_data: BlogFolderUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update folder"""
    folder = db.query(BlogFolder).filter(
        BlogFolder.id == folder_id,
        BlogFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    update_data = folder_data.model_dump(exclude_unset=True)

    if "parent_id" in update_data and update_data["parent_id"]:
        if update_data["parent_id"] == folder_id:
            raise HTTPException(status_code=400, detail="Cannot set folder as its own parent")
        parent = db.query(BlogFolder).filter(
            BlogFolder.id == update_data["parent_id"],
            BlogFolder.user_id == current_user.id
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    for field, value in update_data.items():
        setattr(folder, field, value)

    folder.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(folder)

    return folder


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete folder and move children to parent"""
    folder = db.query(BlogFolder).filter(
        BlogFolder.id == folder_id,
        BlogFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Move child folders to parent
    db.query(BlogFolder).filter(
        BlogFolder.parent_id == folder_id
    ).update({"parent_id": folder.parent_id})

    # Move posts to parent folder
    db.query(BlogPost).filter(
        BlogPost.folder_id == folder_id
    ).update({"folder_id": folder.parent_id})

    db.delete(folder)
    db.commit()

    return None


# Blog Post endpoints
@router.get("/posts", response_model=List[BlogPostResponse])
def get_posts(
    folder_id: Optional[str] = None,
    post_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get blog posts for current user"""
    query = db.query(BlogPost).filter(BlogPost.user_id == current_user.id)

    if folder_id:
        query = query.filter(BlogPost.folder_id == folder_id)

    if post_status:
        query = query.filter(BlogPost.status == post_status)

    posts = query.order_by(BlogPost.updated_at.desc()).offset(skip).limit(limit).all()
    return posts


@router.get("/posts/{post_id}", response_model=BlogPostResponse)
def get_post(
    post_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get blog post by ID"""
    post = db.query(BlogPost).filter(
        BlogPost.id == post_id,
        BlogPost.user_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/posts", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_data: BlogPostCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create new blog post"""
    if post_data.series_id:
        series = db.query(Series).filter(
            Series.id == post_data.series_id,
            Series.user_id == current_user.id
        ).first()
        if not series:
            raise HTTPException(status_code=404, detail="Series not found")

    if post_data.folder_id:
        folder = db.query(BlogFolder).filter(
            BlogFolder.id == post_data.folder_id,
            BlogFolder.user_id == current_user.id
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")

    existing_post = db.query(BlogPost).filter(
        BlogPost.user_id == current_user.id,
        BlogPost.slug == post_data.slug
    ).first()
    if existing_post:
        raise HTTPException(status_code=400, detail="Post with this slug already exists")

    new_post = BlogPost(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        series_id=post_data.series_id,
        folder_id=post_data.folder_id,
        title=post_data.title,
        slug=post_data.slug,
        content_md=post_data.content_md,
        content_blocks=post_data.content_blocks,
        excerpt=post_data.excerpt,
        cover_image=post_data.cover_image,
        tags=post_data.tags,
        status=post_data.status,
        github_repo_id=post_data.github_repo_id,
        published_at=datetime.utcnow() if post_data.status == "published" else None,
        view_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return new_post


@router.patch("/posts/{post_id}", response_model=BlogPostResponse)
def update_post(
    post_id: str,
    post_data: BlogPostUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update blog post"""
    post = db.query(BlogPost).filter(
        BlogPost.id == post_id,
        BlogPost.user_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    update_data = post_data.model_dump(exclude_unset=True)

    if "slug" in update_data:
        existing_post = db.query(BlogPost).filter(
            BlogPost.user_id == current_user.id,
            BlogPost.slug == update_data["slug"],
            BlogPost.id != post_id
        ).first()
        if existing_post:
            raise HTTPException(status_code=400, detail="Slug already taken")

    if "series_id" in update_data and update_data["series_id"]:
        series = db.query(Series).filter(
            Series.id == update_data["series_id"],
            Series.user_id == current_user.id
        ).first()
        if not series:
            raise HTTPException(status_code=404, detail="Series not found")

    if "folder_id" in update_data and update_data["folder_id"]:
        folder = db.query(BlogFolder).filter(
            BlogFolder.id == update_data["folder_id"],
            BlogFolder.user_id == current_user.id
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")

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
def delete_post(
    post_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete blog post"""
    post = db.query(BlogPost).filter(
        BlogPost.id == post_id,
        BlogPost.user_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    db.delete(post)
    db.commit()

    return None


# Series endpoints
@router.get("/series", response_model=List[SeriesResponse])
def get_series_list(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get all series for current user"""
    series_list = db.query(Series).filter(
        Series.user_id == current_user.id
    ).all()
    return series_list


@router.get("/series/{series_id}", response_model=SeriesResponse)
def get_series(
    series_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get series by ID"""
    series = db.query(Series).filter(
        Series.id == series_id,
        Series.user_id == current_user.id
    ).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    return series


@router.post("/series", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
def create_series(
    series_data: SeriesCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create new series"""
    existing_series = db.query(Series).filter(
        Series.user_id == current_user.id,
        Series.slug == series_data.slug
    ).first()
    if existing_series:
        raise HTTPException(status_code=400, detail="Series with this slug already exists")

    new_series = Series(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
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


@router.patch("/series/{series_id}", response_model=SeriesResponse)
def update_series(
    series_id: str,
    series_data: SeriesUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update series"""
    series = db.query(Series).filter(
        Series.id == series_id,
        Series.user_id == current_user.id
    ).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    update_data = series_data.model_dump(exclude_unset=True)

    if "slug" in update_data:
        existing_series = db.query(Series).filter(
            Series.user_id == current_user.id,
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
def delete_series(
    series_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete series"""
    series = db.query(Series).filter(
        Series.id == series_id,
        Series.user_id == current_user.id
    ).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    db.delete(series)
    db.commit()

    return None
