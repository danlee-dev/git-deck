from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db_session, require_github_connection
from app.models import User, GitHubRepository, SyncHistory
from app.schemas.github import GitHubRepositoryResponse, SyncHistoryResponse
from app.services.github_service import GitHubService

router = APIRouter()

@router.post("/sync/repositories")
async def sync_repositories(
    current_user: User = Depends(require_github_connection),
    db: Session = Depends(get_db_session)
):
    """
    Sync user's GitHub repositories
    """
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="No GitHub access token found. Please reconnect your GitHub account."
        )

    github_service = GitHubService(current_user.github_access_token)

    try:
        result = await github_service.sync_repositories(current_user, db)
        return {
            "status": "success",
            "message": f"Synced {result['synced']} new repositories, updated {result['updated']} repositories",
            "data": result
        }
    except Exception as e:
        sync_history = SyncHistory(
            id=str(__import__('uuid').uuid4()),
            user_id=current_user.id,
            target_type="repository_sync",
            status="failed",
            error_detail=str(e),
            created_at=__import__('datetime').datetime.utcnow()
        )
        db.add(sync_history)
        db.commit()

        raise HTTPException(status_code=500, detail=f"Failed to sync repositories: {str(e)}")

@router.get("/repositories", response_model=List[GitHubRepositoryResponse])
def get_repositories(
    current_user: User = Depends(require_github_connection),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """
    Get user's synced GitHub repositories
    """
    repos = db.query(GitHubRepository).filter(
        GitHubRepository.user_id == current_user.id
    ).order_by(GitHubRepository.stars_count.desc()).offset(skip).limit(limit).all()

    return repos

@router.get("/repositories/{repo_id}", response_model=GitHubRepositoryResponse)
def get_repository(
    repo_id: str,
    current_user: User = Depends(require_github_connection),
    db: Session = Depends(get_db_session)
):
    """
    Get a specific repository
    """
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    return repo

@router.get("/readme/{owner}/{repo}")
async def get_readme(
    owner: str,
    repo: str,
    current_user: User = Depends(require_github_connection)
):
    """
    Get README content from a GitHub repository
    """
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="No GitHub access token found"
        )

    github_service = GitHubService(current_user.github_access_token)

    readme = await github_service.get_readme(owner, repo)

    if readme is None:
        raise HTTPException(status_code=404, detail="README not found")

    return {"content": readme}

@router.get("/sync/history", response_model=List[SyncHistoryResponse])
def get_sync_history(
    current_user: User = Depends(require_github_connection),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db_session)
):
    """
    Get sync history for the user
    """
    history = db.query(SyncHistory).filter(
        SyncHistory.user_id == current_user.id
    ).order_by(SyncHistory.created_at.desc()).offset(skip).limit(limit).all()

    return history
