from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GitHubRepositoryResponse(BaseModel):
    id: str
    user_id: str
    github_repo_id: str
    name: str
    full_name: str
    description: Optional[str]
    url: str
    homepage: Optional[str]
    is_private: bool
    is_featured: bool
    stars_count: int
    forks_count: int
    language: Optional[str]
    topics: Optional[list]
    created_at: datetime
    updated_at: datetime
    last_synced_at: Optional[datetime]

    class Config:
        from_attributes = True

class SyncHistoryResponse(BaseModel):
    id: str
    user_id: str
    target_type: str
    target_id: Optional[str]
    status: str
    error_code: Optional[str]
    error_detail: Optional[str]
    triggered_by: Optional[str]
    duration_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
