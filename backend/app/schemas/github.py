from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GitHubRepositoryResponse(BaseModel):
    id: str
    user_id: str
    repo_name: str
    full_name: str
    description: Optional[str]
    html_url: str
    clone_url: str
    default_branch: str
    is_private: bool
    stars: int
    forks: int
    language: Optional[str]
    topics: list
    created_at: datetime
    updated_at: datetime
    last_synced_at: Optional[datetime]

    class Config:
        from_attributes = True

class SyncHistoryResponse(BaseModel):
    id: str
    user_id: str
    sync_type: str
    status: str
    details: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True
