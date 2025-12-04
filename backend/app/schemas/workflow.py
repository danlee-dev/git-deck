from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


class BlockPosition(BaseModel):
    x: float
    y: float


class BlockInstance(BaseModel):
    id: str
    type: str
    position: BlockPosition
    config: Dict[str, Any] = Field(default_factory=dict)
    label: Optional[str] = None


class Connection(BaseModel):
    id: str
    sourceBlockId: str
    sourcePortId: str
    targetBlockId: str
    targetPortId: str
    animated: bool = True


class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None


class WorkflowCreate(WorkflowBase):
    blocks: List[BlockInstance] = Field(default_factory=list)
    connections: List[Connection] = Field(default_factory=list)


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    blocks: Optional[List[BlockInstance]] = None
    connections: Optional[List[Connection]] = None
    is_active: Optional[bool] = None


class WorkflowResponse(WorkflowBase):
    id: str
    user_id: str
    blocks: List[BlockInstance]
    connections: List[Connection]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowListItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool
    blocks_count: int
    created_at: datetime
    updated_at: datetime
