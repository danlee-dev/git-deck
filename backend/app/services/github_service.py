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
        url = f"{self.BASE_URL}/repos/{owner}/{repo}"
        print(f">>> get_repository: GET {url}")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers
            )
            print(f">>> get_repository response: {response.status_code}")
            if response.status_code == 200:
                return response.json()
            else:
                print(f">>> get_repository error: {response.text[:500] if response.text else 'empty'}")
            return None

    async def get_readme(self, owner: str, repo: str, branch: str = "main") -> Optional[Dict[str, str]]:
        """
        Fetch README content from a repository and render it using GitHub API
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

                    # Render markdown using GitHub API
                    render_response = await client.post(
                        f"{self.BASE_URL}/markdown",
                        headers={
                            "Authorization": f"Bearer {self.access_token}",
                            "Accept": "application/vnd.github.v3+json",
                            "Content-Type": "application/json"
                        },
                        json={
                            "text": decoded,
                            "mode": "gfm",
                            "context": f"{owner}/{repo}"
                        }
                    )

                    if render_response.status_code == 200:
                        return {
                            "content": decoded,
                            "html": render_response.text
                        }
                    else:
                        return {
                            "content": decoded,
                            "html": None
                        }
                except Exception:
                    return None
            return None

    async def get_user_info(self) -> Optional[Dict[str, Any]]:
        """
        Fetch authenticated user's information
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/user",
                headers=self.headers
            )
            print(f">>> get_user_info response: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f">>> Authenticated as: {data.get('login')}")
                return data
            else:
                print(f">>> get_user_info error: {response.text[:200] if response.text else 'empty'}")
            return None

    async def sync_repositories(self, user: User, db: Session) -> Dict[str, Any]:
        """
        Sync user's GitHub repositories to database
        """
        repos = await self.get_user_repositories()
        github_user = await self.get_user_info()
        github_username = github_user.get("login") if github_user else None

        synced_count = 0
        updated_count = 0

        for repo_data in repos:
            existing_repo = db.query(GitHubRepository).filter(
                GitHubRepository.user_id == user.id,
                GitHubRepository.github_repo_id == str(repo_data["id"])
            ).first()

            is_profile_repo = (
                github_username and
                repo_data["name"].lower() == github_username.lower()
            )

            github_updated_at = repo_data.get("updated_at")
            if github_updated_at:
                from dateutil import parser
                github_updated_at = parser.parse(github_updated_at)

            repo_info = {
                "user_id": user.id,
                "github_repo_id": str(repo_data["id"]),
                "name": repo_data["name"],
                "full_name": repo_data["full_name"],
                "description": repo_data.get("description"),
                "url": repo_data["html_url"],
                "homepage": repo_data.get("homepage"),
                "is_private": repo_data["private"],
                "is_featured": is_profile_repo,
                "stars_count": repo_data["stargazers_count"],
                "forks_count": repo_data["forks_count"],
                "language": repo_data.get("language"),
                "topics": repo_data.get("topics", []),
                "last_synced_at": datetime.utcnow()
            }

            if existing_repo:
                for key, value in repo_info.items():
                    if key != "user_id":
                        setattr(existing_repo, key, value)
                if github_updated_at:
                    existing_repo.updated_at = github_updated_at
                else:
                    existing_repo.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                new_repo = GitHubRepository(
                    id=str(uuid.uuid4()),
                    created_at=datetime.utcnow(),
                    updated_at=github_updated_at if github_updated_at else datetime.utcnow(),
                    **repo_info
                )
                db.add(new_repo)
                synced_count += 1

        db.commit()

        sync_history = SyncHistory(
            id=str(uuid.uuid4()),
            user_id=user.id,
            target_type="repository_sync",
            status="success",
            created_at=datetime.utcnow()
        )
        db.add(sync_history)
        db.commit()

        return {
            "synced": synced_count,
            "updated": updated_count,
            "total": len(repos)
        }

    async def get_file_content(self, owner: str, repo: str, path: str, branch: str = "main") -> Optional[Dict[str, Any]]:
        """
        Get file content and SHA from repository
        """
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/contents/{path}"
        print(f">>> get_file_content: GET {url} (ref={branch})")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers,
                params={"ref": branch}
            )
            print(f">>> get_file_content response: {response.status_code}")
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                print(f">>> get_file_content: File not found (this is OK for new files)")
            else:
                print(f">>> get_file_content error: {response.text}")
            return None

    async def create_or_update_file(
        self,
        owner: str,
        repo: str,
        path: str,
        content: str,
        message: str,
        branch: str = "main",
        sha: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create or update a file in the repository
        """
        import base64

        print(f">>> create_or_update_file: {owner}/{repo}/{path} on branch {branch}")
        print(f">>> Token used (first 20 chars): {self.access_token[:20] if self.access_token else 'None'}...")

        # If sha not provided, try to get existing file's sha
        if sha is None:
            existing = await self.get_file_content(owner, repo, path, branch)
            print(f">>> Existing file check result: {existing is not None}")
            if existing:
                sha = existing.get("sha")
                print(f">>> Existing SHA: {sha}")

        payload = {
            "message": message,
            "content": base64.b64encode(content.encode()).decode(),
            "branch": branch
        }

        if sha:
            payload["sha"] = sha

        url = f"{self.BASE_URL}/repos/{owner}/{repo}/contents/{path}"
        print(f">>> PUT request to: {url}")

        async with httpx.AsyncClient() as client:
            response = await client.put(
                url,
                headers=self.headers,
                json=payload
            )

            print(f">>> GitHub API response status: {response.status_code}")
            print(f">>> GitHub API response headers: {dict(response.headers)}")

            if response.status_code in [200, 201]:
                return {"success": True, "data": response.json()}
            else:
                error_data = response.json()
                print(f">>> GitHub API error body: {error_data}")
                error_msg = error_data.get("message", "Unknown error")
                # Add more context to error message
                if response.status_code == 404:
                    error_msg = f"Repository '{owner}/{repo}' not found or no write access. Please reconnect GitHub with repo permissions."
                elif response.status_code == 401:
                    error_msg = "GitHub token expired or invalid. Please reconnect GitHub."
                elif response.status_code == 403:
                    error_msg = f"No permission to write to '{owner}/{repo}'. Check repository access."
                return {
                    "success": False,
                    "error": error_msg,
                    "status_code": response.status_code
                }

    async def deploy_workflow(
        self,
        owner: str,
        repo: str,
        workflow_name: str,
        yaml_content: str,
        branch: str = "main"
    ) -> Dict[str, Any]:
        """
        Deploy a GitHub Actions workflow YAML file to repository
        """
        print(f">>> deploy_workflow: {owner}/{repo}, workflow={workflow_name}, branch={branch}")

        # Verify repository exists and get default branch
        repo_info = await self.get_repository(owner, repo)
        if repo_info:
            print(f">>> Repository found: {repo_info.get('full_name')}")
            print(f">>> Default branch: {repo_info.get('default_branch')}")
            print(f">>> Requested branch: {branch}")
            print(f">>> Permissions: {repo_info.get('permissions')}")
        else:
            print(f">>> Repository NOT found or no access: {owner}/{repo}")
            return {"success": False, "error": f"Cannot access repository {owner}/{repo}"}

        # Sanitize workflow name for filename
        safe_name = workflow_name.lower().replace(" ", "-").replace("_", "-")
        safe_name = "".join(c for c in safe_name if c.isalnum() or c == "-")
        filename = f"{safe_name}.yml"
        path = f".github/workflows/{filename}"
        print(f">>> Target path: {path}")

        result = await self.create_or_update_file(
            owner=owner,
            repo=repo,
            path=path,
            content=yaml_content,
            message=f"Deploy workflow: {workflow_name}",
            branch=branch
        )

        if result["success"]:
            return {
                "success": True,
                "path": path,
                "url": f"https://github.com/{owner}/{repo}/blob/{branch}/{path}",
                "actions_url": f"https://github.com/{owner}/{repo}/actions"
            }
        else:
            return result

    async def delete_workflow(
        self,
        owner: str,
        repo: str,
        workflow_name: str,
        branch: str = "main"
    ) -> Dict[str, Any]:
        """
        Delete a workflow file from repository
        """
        safe_name = workflow_name.lower().replace(" ", "-").replace("_", "-")
        safe_name = "".join(c for c in safe_name if c.isalnum() or c == "-")
        filename = f"{safe_name}.yml"
        path = f".github/workflows/{filename}"

        # Get file SHA
        existing = await self.get_file_content(owner, repo, path, branch)
        if not existing:
            return {"success": False, "error": "Workflow file not found"}

        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.BASE_URL}/repos/{owner}/{repo}/contents/{path}",
                headers=self.headers,
                json={
                    "message": f"Remove workflow: {workflow_name}",
                    "sha": existing["sha"],
                    "branch": branch
                }
            )

            if response.status_code == 200:
                return {"success": True}
            else:
                return {
                    "success": False,
                    "error": response.json().get("message", "Unknown error")
                }
