import httpx
import base64
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import uuid
from app.models import User, Profile, Block, SyncHistory

class SyncService:
    BASE_URL = "https://api.github.com"

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def generate_readme_content(self, profile: Profile, blocks: list) -> str:
        """
        Generate README.md content from profile blocks
        """
        content_parts = []

        if profile.display_name:
            content_parts.append(f"# {profile.display_name}\n")

        if profile.bio:
            content_parts.append(f"{profile.bio}\n")

        sorted_blocks = sorted(blocks, key=lambda x: x.order_index)

        for block in sorted_blocks:
            if not block.is_visible:
                continue

            block_type = block.type
            block_content = block.content or {}

            if block_type == "header":
                title = block.title or block_content.get("title", "")
                content_parts.append(f"\n## {title}\n")

            elif block_type == "text":
                text = block_content.get("text", "")
                content_parts.append(f"{text}\n")

            elif block_type == "skills":
                skills = block_content.get("skills", [])
                if skills:
                    content_parts.append("\n### Skills\n")
                    for skill in skills:
                        content_parts.append(f"- {skill}\n")

            elif block_type == "social":
                links = block_content.get("links", [])
                if links:
                    content_parts.append("\n### Connect with me\n")
                    for link in links:
                        name = link.get("name", "Link")
                        url = link.get("url", "#")
                        content_parts.append(f"- [{name}]({url})\n")

            elif block_type == "stats":
                username = block_content.get("username", "")
                if username:
                    content_parts.append(f"\n### GitHub Stats\n")
                    content_parts.append(f"![GitHub Stats](https://github-readme-stats.vercel.app/api?username={username}&show_icons=true)\n")

            elif block_type == "projects":
                projects = block_content.get("projects", [])
                if projects:
                    content_parts.append("\n### Projects\n")
                    for project in projects:
                        title = project.get("title", "Project")
                        description = project.get("description", "")
                        url = project.get("url", "#")
                        content_parts.append(f"#### [{title}]({url})\n{description}\n\n")

            elif block_type == "custom_html":
                html_content = block_content.get("html", "")
                content_parts.append(f"{html_content}\n")

        footer = "\n---\n*This README was generated with [DevDeck](https://github.com/yourusername/devdeck)*\n"
        content_parts.append(footer)

        return "\n".join(content_parts)

    async def get_readme_sha(self, owner: str, repo: str) -> Optional[str]:
        """
        Get SHA of existing README.md file
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/contents/README.md",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json().get("sha")
            return None

    async def push_readme_to_repo(
        self,
        owner: str,
        repo: str,
        content: str,
        message: str = "Update README.md via DevDeck"
    ) -> Dict[str, Any]:
        """
        Push README content to GitHub repository
        """
        encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')

        sha = await self.get_readme_sha(owner, repo)

        data = {
            "message": message,
            "content": encoded_content,
            "branch": "main"
        }

        if sha:
            data["sha"] = sha

        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.BASE_URL}/repos/{owner}/{repo}/contents/README.md",
                headers=self.headers,
                json=data
            )

            if response.status_code in [200, 201]:
                return {"status": "success", "data": response.json()}
            else:
                return {"status": "error", "message": response.text}

    async def sync_profile_to_readme(
        self,
        user: User,
        profile: Profile,
        repo_owner: str,
        repo_name: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Sync profile blocks to GitHub README
        """
        blocks = db.query(Block).filter(
            Block.profile_id == profile.id
        ).order_by(Block.order_index).all()

        readme_content = self.generate_readme_content(profile, blocks)

        try:
            result = await self.push_readme_to_repo(
                owner=repo_owner,
                repo=repo_name,
                content=readme_content
            )

            sync_history = SyncHistory(
                id=str(uuid.uuid4()),
                user_id=user.id,
                sync_type="profile_to_readme",
                status="success" if result["status"] == "success" else "failed",
                details={
                    "profile_id": profile.id,
                    "repo": f"{repo_owner}/{repo_name}",
                    "blocks_count": len(blocks)
                },
                created_at=datetime.utcnow()
            )
            db.add(sync_history)
            db.commit()

            return {
                "status": result["status"],
                "message": "README synced successfully" if result["status"] == "success" else "Failed to sync README",
                "readme_content": readme_content
            }

        except Exception as e:
            sync_history = SyncHistory(
                id=str(uuid.uuid4()),
                user_id=user.id,
                sync_type="profile_to_readme",
                status="failed",
                details={
                    "profile_id": profile.id,
                    "repo": f"{repo_owner}/{repo_name}",
                    "error": str(e)
                },
                created_at=datetime.utcnow()
            )
            db.add(sync_history)
            db.commit()

            return {
                "status": "error",
                "message": f"Error: {str(e)}"
            }
