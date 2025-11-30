from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid
from app.api.deps import get_db_session
from app.models import Block, Profile
from app.schemas.block import BlockCreate, BlockUpdate, BlockResponse

router = APIRouter()

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
