from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import base64
import httpx
from app.api.deps import get_db_session, get_current_active_user, require_github_connection
from app.models import Block, Profile, User
from app.schemas.block import BlockCreate, BlockUpdate, BlockResponse
from pydantic import BaseModel

router = APIRouter()

class SaveToGitHubRequest(BaseModel):
    blocks: List[Dict[str, Any]]
    markdown_content: str
    repo_owner: str
    repo_name: str
    last_known_sha: Optional[str] = None

@router.get("/blocks", response_model=List[BlockResponse])
def get_blocks(
    profile_id: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """
    Get blocks, optionally filtered by profile_id
    """
    query = db.query(Block)

    if profile_id:
        query = query.filter(Block.profile_id == profile_id)

    blocks = query.order_by(Block.order_index).offset(skip).limit(limit).all()
    return blocks

@router.get("/blocks/load-from-github")
async def load_blocks_from_github(
    repo_owner: str,
    repo_name: str,
    current_user: User = Depends(require_github_connection),
    db: Session = Depends(get_db_session)
):
    """
    Load blocks from GitHub README and convert to block format
    """
    try:
        headers = {
            "Authorization": f"Bearer {current_user.github_access_token}",
            "Accept": "application/vnd.github.v3+json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/README.md",
                headers=headers
            )

            if response.status_code == 404:
                return {
                    "status": "not_found",
                    "message": "README.md not found",
                    "blocks": [],
                    "sha": None
                }

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch README: {response.text}"
                )

            readme_data = response.json()
            sha = readme_data.get("sha")
            content = base64.b64decode(readme_data.get("content", "")).decode('utf-8')

            blocks = parse_markdown_to_blocks(content)

            rendered_html = await render_markdown_with_github(content, repo_owner, repo_name, current_user.github_access_token)

            return {
                "status": "success",
                "message": "README loaded successfully",
                "blocks": blocks,
                "sha": sha,
                "raw_content": content,
                "rendered_html": rendered_html
            }

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/blocks/render-markdown")
async def render_markdown(
    request: Dict[str, str],
    current_user: User = Depends(require_github_connection)
):
    """
    Render markdown using GitHub's API
    """
    markdown_content = request.get("markdown", "")
    repo_owner = request.get("repo_owner", "")
    repo_name = request.get("repo_name", "")

    try:
        rendered_html = await render_markdown_with_github(
            markdown_content,
            repo_owner,
            repo_name,
            current_user.github_access_token
        )

        return {
            "status": "success",
            "rendered_html": rendered_html
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render markdown: {str(e)}")

@router.get("/blocks/{block_id}", response_model=BlockResponse)
def get_block(block_id: str, db: Session = Depends(get_db_session)):
    """
    Get block by ID
    """
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    return block

@router.post("/blocks", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
def create_block(
    block_data: BlockCreate,
    db: Session = Depends(get_db_session)
):
    """
    Create new block for a profile
    """
    profile = db.query(Profile).filter(Profile.id == block_data.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    new_block = Block(
        id=str(uuid.uuid4()),
        profile_id=block_data.profile_id,
        type=block_data.type,
        title=block_data.title,
        content=block_data.content,
        order_index=block_data.order_index,
        width=block_data.width,
        is_visible=block_data.is_visible,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_block)
    db.commit()
    db.refresh(new_block)

    return new_block

@router.put("/blocks/{block_id}", response_model=BlockResponse)
def update_block(
    block_id: str,
    block_data: BlockUpdate,
    db: Session = Depends(get_db_session)
):
    """
    Update block
    """
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    update_data = block_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(block, field, value)

    block.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(block)

    return block

@router.delete("/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(block_id: str, db: Session = Depends(get_db_session)):
    """
    Delete block
    """
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    db.delete(block)
    db.commit()

    return None

@router.post("/blocks/save-to-github")
async def save_blocks_to_github(
    request: SaveToGitHubRequest,
    current_user: User = Depends(require_github_connection),
    db: Session = Depends(get_db_session)
):
    """
    Save blocks to GitHub README (GitHub connection required)
    """
    try:
        headers = {
            "Authorization": f"Bearer {current_user.github_access_token}",
            "Accept": "application/vnd.github.v3+json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{request.repo_owner}/{request.repo_name}/contents/README.md",
                headers=headers
            )

            sha = None
            current_content = None
            if response.status_code == 200:
                readme_data = response.json()
                sha = readme_data.get("sha")
                current_content = base64.b64decode(readme_data.get("content", "")).decode('utf-8')

                if request.last_known_sha and request.last_known_sha != sha:
                    return {
                        "status": "conflict",
                        "message": "GitHub README has been modified since your last sync",
                        "current_sha": sha,
                        "last_known_sha": request.last_known_sha,
                        "current_content": current_content
                    }

        encoded_content = base64.b64encode(request.markdown_content.encode('utf-8')).decode('utf-8')

        data = {
            "message": "Update README.md via GitDeck",
            "content": encoded_content,
            "branch": "main"
        }

        if sha:
            data["sha"] = sha

        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"https://api.github.com/repos/{request.repo_owner}/{request.repo_name}/contents/README.md",
                headers=headers,
                json=data
            )

            if response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to update GitHub README: {response.text}"
                )

            result_data = response.json()
            new_sha = result_data.get("content", {}).get("sha")

            return {
                "status": "success",
                "message": "README updated successfully",
                "sha": new_sha,
                "data": result_data
            }

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

async def render_markdown_with_github(markdown: str, repo_owner: str, repo_name: str, token: str) -> str:
    """
    Render markdown using GitHub's Markdown API
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.github.com/markdown",
                json={
                    "text": markdown,
                    "mode": "gfm",
                    "context": f"{repo_owner}/{repo_name}"
                },
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )

            if response.status_code == 200:
                return response.text
            else:
                return f"<p>Failed to render markdown: {response.status_code}</p>"
    except Exception as e:
        return f"<p>Error rendering markdown: {str(e)}</p>"

def parse_markdown_to_blocks(markdown: str) -> list:
    """
    Simple markdown parser to convert to blocks
    """
    lines = markdown.split('\n')
    blocks = []
    i = 0
    order = 0

    while i < len(lines):
        line = lines[i]

        if line.startswith('# '):
            blocks.append({
                'type': 'heading-1',
                'content': f'<h1>{line[2:].strip()}</h1>',
                'order': order
            })
            order += 1
            i += 1
        elif line.startswith('## '):
            blocks.append({
                'type': 'heading-2',
                'content': f'<h2>{line[3:].strip()}</h2>',
                'order': order
            })
            order += 1
            i += 1
        elif line.startswith('### '):
            blocks.append({
                'type': 'heading-3',
                'content': f'<h3>{line[4:].strip()}</h3>',
                'order': order
            })
            order += 1
            i += 1
        elif line.startswith('```'):
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code_lines.append(lines[i])
                i += 1
            blocks.append({
                'type': 'code',
                'content': f'<pre><code>{chr(10).join(code_lines)}</code></pre>',
                'order': order
            })
            order += 1
            i += 1
        elif line.startswith('> '):
            quote_lines = [line[2:]]
            i += 1
            while i < len(lines) and lines[i].startswith('> '):
                quote_lines.append(lines[i][2:])
                i += 1
            blocks.append({
                'type': 'quote',
                'content': f'<blockquote><p>{chr(10).join(quote_lines)}</p></blockquote>',
                'order': order
            })
            order += 1
        elif line.startswith('- ') or line.startswith('* '):
            list_items = [line[2:]]
            i += 1
            while i < len(lines) and (lines[i].startswith('- ') or lines[i].startswith('* ')):
                list_items.append(lines[i][2:])
                i += 1
            items_html = ''.join([f'<li>{item}</li>' for item in list_items])
            blocks.append({
                'type': 'list',
                'content': f'<ul>{items_html}</ul>',
                'order': order
            })
            order += 1
        elif line.strip():
            blocks.append({
                'type': 'paragraph',
                'content': f'<p>{line.strip()}</p>',
                'order': order
            })
            order += 1
            i += 1
        else:
            i += 1

    return blocks
