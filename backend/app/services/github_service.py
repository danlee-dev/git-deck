import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import uuid
from app.models import User, GitHubRepository, SyncHistory

class GitHubService:
    BASE_URL = "https://api.github.com"

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }

    async def get_user_repositories(self) -> List[Dict[str, Any]]:
        """
        Fetch all repositories for the authenticated user
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/user/repos",
                headers=self.headers,
                params={"per_page": 100, "sort": "updated"}
            )
            if response.status_code == 200:
                return response.json()
            return []

    async def get_repository(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a specific repository
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
            return None

    async def get_readme(self, owner: str, repo: str, branch: str = "main") -> Optional[str]:
        """
        Fetch README content from a repository
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/readme",
                headers=self.headers
            )
            if response.status_code == 200:
                readme_data = response.json()
                content = readme_data.get("content", "")

                import base64
                try:
                    decoded = base64.b64decode(content).decode('utf-8')
                    return decoded
                except Exception:
                    return None
            return None

    async def sync_repositories(self, user: User, db: Session) -> Dict[str, Any]:
        """
        Sync user's GitHub repositories to database
        """
        repos = await self.get_user_repositories()

        synced_count = 0
        updated_count = 0

        for repo_data in repos:
            existing_repo = db.query(GitHubRepository).filter(
                GitHubRepository.user_id == user.id,
                GitHubRepository.repo_name == repo_data["name"]
            ).first()

            repo_info = {
                "user_id": user.id,
                "repo_name": repo_data["name"],
                "full_name": repo_data["full_name"],
                "description": repo_data.get("description"),
                "html_url": repo_data["html_url"],
                "clone_url": repo_data["clone_url"],
                "default_branch": repo_data.get("default_branch", "main"),
                "is_private": repo_data["private"],
                "stars": repo_data["stargazers_count"],
                "forks": repo_data["forks_count"],
                "language": repo_data.get("language"),
                "topics": repo_data.get("topics", []),
                "last_synced_at": datetime.utcnow()
            }

            if existing_repo:
                for key, value in repo_info.items():
                    if key != "user_id":
                        setattr(existing_repo, key, value)
                existing_repo.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                new_repo = GitHubRepository(
                    id=str(uuid.uuid4()),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    **repo_info
                )
                db.add(new_repo)
                synced_count += 1

        db.commit()

        sync_history = SyncHistory(
            id=str(uuid.uuid4()),
            user_id=user.id,
            sync_type="repository_sync",
            status="success",
            details={
                "synced": synced_count,
                "updated": updated_count,
                "total": len(repos)
            },
            created_at=datetime.utcnow()
        )
        db.add(sync_history)
        db.commit()

        return {
            "synced": synced_count,
            "updated": updated_count,
            "total": len(repos)
        }
