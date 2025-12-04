from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid

from app.api.deps import get_db_session, get_current_active_user
from app.models import User
from app.models.models import Workflow
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowListItem,
)
from app.services.github_service import GitHubService


class DeployRequest(BaseModel):
    repo_owner: str
    repo_name: str
    branch: str = "main"


class DeployResponse(BaseModel):
    success: bool
    path: Optional[str] = None
    url: Optional[str] = None
    actions_url: Optional[str] = None
    error: Optional[str] = None

router = APIRouter()


@router.get("", response_model=List[WorkflowListItem])
def list_workflows(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all workflows for the current user
    """
    workflows = (
        db.query(Workflow)
        .filter(Workflow.user_id == current_user.id)
        .order_by(Workflow.updated_at.desc())
        .all()
    )

    return [
        WorkflowListItem(
            id=w.id,
            name=w.name,
            description=w.description,
            is_active=w.is_active,
            blocks_count=len(w.blocks) if w.blocks else 0,
            created_at=w.created_at,
            updated_at=w.updated_at,
        )
        for w in workflows
    ]


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    workflow_in: WorkflowCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new workflow
    """
    workflow = Workflow(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=workflow_in.name,
        description=workflow_in.description,
        blocks=[block.model_dump() for block in workflow_in.blocks],
        connections=[conn.model_dump() for conn in workflow_in.connections],
    )

    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    return workflow


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a specific workflow by ID
    """
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id)
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: str,
    workflow_in: WorkflowUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a workflow
    """
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id)
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    update_data = workflow_in.model_dump(exclude_unset=True)

    if "blocks" in update_data and update_data["blocks"] is not None:
        update_data["blocks"] = [
            block.model_dump() if hasattr(block, "model_dump") else block
            for block in update_data["blocks"]
        ]

    if "connections" in update_data and update_data["connections"] is not None:
        update_data["connections"] = [
            conn.model_dump() if hasattr(conn, "model_dump") else conn
            for conn in update_data["connections"]
        ]

    for field, value in update_data.items():
        setattr(workflow, field, value)

    db.commit()
    db.refresh(workflow)

    return workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a workflow
    """
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id)
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    db.delete(workflow)
    db.commit()

    return None


@router.post("/{workflow_id}/deploy", response_model=DeployResponse)
async def deploy_workflow(
    workflow_id: str,
    deploy_request: DeployRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Deploy workflow to GitHub repository as GitHub Actions YAML
    """
    # Get the workflow
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id)
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    # Check if user has GitHub token
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub account not connected",
        )

    print(f">>> Deploy: user_id={current_user.id}, github_username={current_user.github_username}")
    print(f">>> Deploy: token starts with: {current_user.github_access_token[:20] if current_user.github_access_token else 'None'}...")
    print(f">>> Deploy: target repo={deploy_request.repo_owner}/{deploy_request.repo_name}")

    # Generate YAML from workflow blocks
    yaml_content = generate_yaml_from_blocks(workflow.name, workflow.blocks, workflow.connections)
    print(f">>> Deploy: Generated YAML length: {len(yaml_content)} chars")

    # blocks.py와 완전히 동일한 방식으로 직접 요청 (GitHubService 우회)
    import httpx
    import base64

    headers = {
        "Authorization": f"Bearer {current_user.github_access_token}",
        "Accept": "application/vnd.github.v3+json"
    }

    # 파일명 생성
    safe_name = workflow.name.lower().replace(" ", "-").replace("_", "-")
    safe_name = "".join(c for c in safe_name if c.isalnum() or c == "-")
    filename = f"{safe_name}.yml"
    file_path = f".github/workflows/{filename}"

    print(f">>> Deploy: path={file_path}")

    # 기존 파일 확인
    async with httpx.AsyncClient() as client:
        get_url = f"https://api.github.com/repos/{deploy_request.repo_owner}/{deploy_request.repo_name}/contents/{file_path}"
        print(f">>> Deploy Direct GET: {get_url}")
        response = await client.get(get_url, headers=headers)
        print(f">>> Deploy Direct GET response: {response.status_code}")

        sha = None
        if response.status_code == 200:
            file_data = response.json()
            sha = file_data.get("sha")
            print(f">>> Deploy Direct: existing sha={sha}")

    # 파일 생성/업데이트 (blocks.py와 완전히 동일)
    encoded_content = base64.b64encode(yaml_content.encode('utf-8')).decode('utf-8')

    data = {
        "message": f"Deploy workflow: {workflow.name}",
        "content": encoded_content,
        "branch": deploy_request.branch
    }

    if sha:
        data["sha"] = sha

    print(f">>> Deploy Direct PUT data: message={data['message']}, branch={data['branch']}, has_sha={sha is not None}")

    async with httpx.AsyncClient() as client:
        put_url = f"https://api.github.com/repos/{deploy_request.repo_owner}/{deploy_request.repo_name}/contents/{file_path}"
        print(f">>> Deploy Direct PUT: {put_url}")
        put_response = await client.put(put_url, headers=headers, json=data)

        print(f">>> Deploy Direct PUT response: {put_response.status_code}")
        if put_response.status_code not in [200, 201]:
            print(f">>> Deploy Direct PUT error: {put_response.text}")

        if put_response.status_code in [200, 201]:
            return DeployResponse(
                success=True,
                path=file_path,
                url=f"https://github.com/{deploy_request.repo_owner}/{deploy_request.repo_name}/blob/{deploy_request.branch}/{file_path}",
                actions_url=f"https://github.com/{deploy_request.repo_owner}/{deploy_request.repo_name}/actions"
            )
        else:
            error_body = put_response.json()
            return DeployResponse(
                success=False,
                error=error_body.get("message", "Unknown error")
            )


@router.delete("/{workflow_id}/undeploy")
async def undeploy_workflow(
    workflow_id: str,
    deploy_request: DeployRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Remove workflow from GitHub repository
    """
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id)
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    if not current_user.github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub account not connected",
        )

    github_service = GitHubService(current_user.github_access_token)
    result = await github_service.delete_workflow(
        owner=deploy_request.repo_owner,
        repo=deploy_request.repo_name,
        workflow_name=workflow.name,
        branch=deploy_request.branch,
    )

    return result


def generate_yaml_from_blocks(
    workflow_name: str,
    blocks: List[Dict[str, Any]],
    connections: List[Dict[str, Any]],
) -> str:
    """
    Generate GitHub Actions YAML from workflow blocks
    """
    # Find trigger blocks
    triggers = [b for b in blocks if b.get("type", "").startswith("trigger-")]
    job_blocks = [b for b in blocks if not b.get("type", "").startswith("trigger-")]

    yaml = f"name: {workflow_name}\n\n"

    # Generate on: section from triggers
    if triggers:
        yaml += "on:\n"
        for trigger in triggers:
            trigger_type = trigger.get("type", "")
            config = trigger.get("config", {})

            if trigger_type == "trigger-push":
                yaml += "  push:\n"
                if config.get("branches"):
                    yaml += "    branches:\n"
                    for branch in str(config["branches"]).split(","):
                        yaml += f"      - {branch.strip()}\n"
                if config.get("paths"):
                    yaml += "    paths:\n"
                    for path in str(config["paths"]).split(","):
                        yaml += f"      - {path.strip()}\n"

            elif trigger_type == "trigger-pr":
                yaml += "  pull_request:\n"
                if config.get("types") and isinstance(config["types"], list):
                    yaml += f"    types: [{', '.join(config['types'])}]\n"
                if config.get("branches"):
                    yaml += "    branches:\n"
                    for branch in str(config["branches"]).split(","):
                        yaml += f"      - {branch.strip()}\n"

            elif trigger_type == "trigger-schedule":
                yaml += "  schedule:\n"
                yaml += f"    - cron: '{config.get('cron', '0 0 * * *')}'\n"

            elif trigger_type == "trigger-manual":
                yaml += "  workflow_dispatch:\n"
                if config.get("inputs"):
                    yaml += "    inputs:\n"
                    for line in str(config["inputs"]).split("\n"):
                        yaml += f"      {line}\n"

            elif trigger_type == "trigger-release":
                yaml += "  release:\n"
                if config.get("types") and isinstance(config["types"], list):
                    yaml += f"    types: [{', '.join(config['types'])}]\n"

        yaml += "\n"

    # Generate jobs section
    if job_blocks:
        yaml += "jobs:\n"
        yaml += "  build:\n"
        yaml += "    runs-on: ubuntu-latest\n"
        yaml += "    steps:\n"

        # Sort blocks by connection order
        ordered_blocks = topological_sort_blocks(job_blocks, connections)

        for block in ordered_blocks:
            block_type = block.get("type", "")
            config = block.get("config", {})

            if block_type == "job-checkout":
                yaml += "      - name: Checkout\n"
                yaml += "        uses: actions/checkout@v4\n"
                if config.get("fetchDepth"):
                    yaml += "        with:\n"
                    yaml += f"          fetch-depth: {config['fetchDepth']}\n"

            elif block_type == "job-setup-node":
                yaml += "      - name: Setup Node.js\n"
                yaml += "        uses: actions/setup-node@v4\n"
                yaml += "        with:\n"
                yaml += f"          node-version: '{config.get('nodeVersion', '20')}'\n"
                if config.get("cache"):
                    yaml += f"          cache: '{config['cache']}'\n"

            elif block_type == "job-setup-python":
                yaml += "      - name: Setup Python\n"
                yaml += "        uses: actions/setup-python@v5\n"
                yaml += "        with:\n"
                yaml += f"          python-version: '{config.get('pythonVersion', '3.11')}'\n"

            elif block_type == "job-run-script":
                name = config.get("name", "Run script")
                yaml += f"      - name: {name}\n"
                yaml += "        run: |\n"
                for line in str(config.get("run", "")).split("\n"):
                    yaml += f"          {line}\n"

            elif block_type == "job-install-deps":
                yaml += "      - name: Install dependencies\n"
                pm = config.get("packageManager", "npm")
                frozen = config.get("frozen", True)
                if pm == "npm":
                    yaml += f"        run: {'npm ci' if frozen else 'npm install'}\n"
                elif pm == "yarn":
                    yaml += f"        run: {'yarn --frozen-lockfile' if frozen else 'yarn'}\n"
                elif pm == "pnpm":
                    yaml += f"        run: {'pnpm install --frozen-lockfile' if frozen else 'pnpm install'}\n"
                elif pm == "pip":
                    yaml += "        run: pip install -r requirements.txt\n"

            elif block_type == "job-build":
                yaml += "      - name: Build\n"
                yaml += f"        run: {config.get('command', 'npm run build')}\n"

            elif block_type == "job-test":
                yaml += "      - name: Run tests\n"
                yaml += f"        run: {config.get('command', 'npm test')}\n"

            elif block_type == "job-lint":
                yaml += "      - name: Lint\n"
                yaml += f"        run: {config.get('command', 'npm run lint')}\n"

            elif block_type == "utility-cache":
                yaml += "      - name: Cache\n"
                yaml += "        uses: actions/cache@v4\n"
                yaml += "        with:\n"
                yaml += f"          path: {config.get('path', 'node_modules')}\n"
                default_cache_key = '${{ runner.os }}-node-${{ hashFiles("**/package-lock.json") }}'
                yaml += f"          key: {config.get('key', default_cache_key)}\n"
                if config.get("restoreKeys"):
                    yaml += f"          restore-keys: {config['restoreKeys']}\n"

            elif block_type == "utility-upload-artifact":
                yaml += "      - name: Upload artifact\n"
                yaml += "        uses: actions/upload-artifact@v4\n"
                yaml += "        with:\n"
                yaml += f"          name: {config.get('name', 'artifact')}\n"
                yaml += f"          path: {config.get('path', 'dist')}\n"

            elif block_type == "integration-deploy-vercel":
                yaml += "      - name: Deploy to Vercel\n"
                yaml += "        uses: amondnet/vercel-action@v25\n"
                yaml += "        with:\n"
                yaml += "          vercel-token: ${{ secrets.VERCEL_TOKEN }}\n"
                yaml += f"          vercel-org-id: {config.get('orgId', '${{ secrets.VERCEL_ORG_ID }}')}\n"
                yaml += f"          vercel-project-id: {config.get('projectId', '${{ secrets.VERCEL_PROJECT_ID }}')}\n"
                if config.get("production"):
                    yaml += "          vercel-args: --prod\n"

            elif block_type == "integration-docker-build":
                yaml += "      - name: Login to Container Registry\n"
                yaml += "        uses: docker/login-action@v3\n"
                yaml += "        with:\n"
                yaml += f"          registry: {config.get('registry', 'ghcr.io')}\n"
                yaml += "          username: ${{ github.actor }}\n"
                yaml += "          password: ${{ secrets.GITHUB_TOKEN }}\n"
                yaml += "      - name: Build and push Docker image\n"
                yaml += "        uses: docker/build-push-action@v5\n"
                yaml += "        with:\n"
                yaml += "          push: true\n"
                yaml += f"          tags: {config.get('registry', 'ghcr.io')}/{config.get('imageName', '${{ github.repository }}')}:{config.get('tags', 'latest')}\n"

            elif block_type == "integration-notify-slack":
                yaml += "      - name: Slack Notification\n"
                yaml += "        uses: 8398a7/action-slack@v3\n"
                yaml += "        with:\n"
                yaml += "          status: ${{ job.status }}\n"
                yaml += f"          text: {config.get('message', 'Build completed')}\n"
                yaml += "        env:\n"
                yaml += f"          SLACK_WEBHOOK_URL: {config.get('webhookUrl', '${{ secrets.SLACK_WEBHOOK_URL }}')}\n"

    return yaml


def topological_sort_blocks(
    blocks: List[Dict[str, Any]],
    connections: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Sort blocks by connection order using Kahn's algorithm
    """
    block_map = {b["id"]: b for b in blocks}
    in_degree = {b["id"]: 0 for b in blocks}
    adjacency = {b["id"]: [] for b in blocks}

    for conn in connections:
        source_id = conn.get("sourceBlockId")
        target_id = conn.get("targetBlockId")
        if source_id in block_map and target_id in block_map:
            adjacency[source_id].append(target_id)
            in_degree[target_id] = in_degree.get(target_id, 0) + 1

    queue = [bid for bid, degree in in_degree.items() if degree == 0]
    result = []

    while queue:
        bid = queue.pop(0)
        block = block_map.get(bid)
        if block:
            result.append(block)

        for neighbor in adjacency.get(bid, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return result
