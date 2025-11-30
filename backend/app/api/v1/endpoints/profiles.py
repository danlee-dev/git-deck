from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid
from app.api.deps import get_db_session, get_current_active_user, require_github_connection
from app.models import Profile, User
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.sync_service import SyncService

router = APIRouter()

@router.get("/profiles", response_model=List[ProfileResponse])
def get_profiles(
    user_id: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """
    Get all profiles, optionally filtered by user_id
    """
    query = db.query(Profile)

    if user_id:
        query = query.filter(Profile.user_id == user_id)

    profiles = query.offset(skip).limit(limit).all()
    return profiles

@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: str, db: Session = Depends(get_db_session)):
    """
    Get profile by ID
    """
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.get("/profiles/slug/{slug}", response_model=ProfileResponse)
def get_profile_by_slug(slug: str, db: Session = Depends(get_db_session)):
    """
    Get profile by slug
    """
    profile = db.query(Profile).filter(Profile.slug == slug).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/profiles", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    user_id: str,
    profile_data: ProfileCreate,
    db: Session = Depends(get_db_session)
):
    """
    Create new profile for a user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_profile = db.query(Profile).filter(Profile.slug == profile_data.slug).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile with this slug already exists")

    new_profile = Profile(
        id=str(uuid.uuid4()),
        user_id=user_id,
        slug=profile_data.slug,
        display_name=profile_data.display_name,
        bio=profile_data.bio,
        theme_config=profile_data.theme_config,
        is_public=profile_data.is_public,
        custom_domain=profile_data.custom_domain,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile

@router.put("/profiles/{profile_id}", response_model=ProfileResponse)
def update_profile(
    profile_id: str,
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db_session)
):
    """
    Update profile
    """
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = profile_data.model_dump(exclude_unset=True)

    if "slug" in update_data:
        existing_profile = db.query(Profile).filter(
            Profile.slug == update_data["slug"],
            Profile.id != profile_id
        ).first()
        if existing_profile:
            raise HTTPException(status_code=400, detail="Slug already taken")

    if "custom_domain" in update_data and update_data["custom_domain"]:
        existing_profile = db.query(Profile).filter(
            Profile.custom_domain == update_data["custom_domain"],
            Profile.id != profile_id
        ).first()
        if existing_profile:
            raise HTTPException(status_code=400, detail="Custom domain already taken")

    for field, value in update_data.items():
        setattr(profile, field, value)

    profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)

    return profile

@router.delete("/profiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(profile_id: str, db: Session = Depends(get_db_session)):
    """
    Delete profile
    """
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    db.delete(profile)
    db.commit()

    return None

@router.post("/profiles/{profile_id}/sync-to-readme")
async def sync_profile_to_readme(
    profile_id: str,
    repo_owner: str,
    repo_name: str,
    current_user: User = Depends(require_github_connection),
    db: Session = Depends(get_db_session)
):
    """
    Sync profile blocks to GitHub README (GitHub connection required)
    """
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to sync this profile")

    sync_service = SyncService(current_user.access_token)

    result = await sync_service.sync_profile_to_readme(
        user=current_user,
        profile=profile,
        repo_owner=repo_owner,
        repo_name=repo_name,
        db=db
    )

    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])

    return result
