from sqlalchemy import Column, String, Text, Boolean, Integer, TIMESTAMP, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    avatar_url = Column(Text)

    github_id = Column(String(100), unique=True, nullable=True, index=True)
    github_username = Column(String(255), nullable=True, index=True)
    github_access_token = Column(Text, nullable=True)
    github_webhook_id = Column(String(100), nullable=True)
    is_github_connected = Column(Boolean, default=False)

    is_active = Column(Boolean, default=True)
    deleted_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    profiles = relationship("Profile", back_populates="user", cascade="all, delete-orphan")
    blog_posts = relationship("BlogPost", back_populates="user", cascade="all, delete-orphan")
    series = relationship("Series", back_populates="user", cascade="all, delete-orphan")
    github_repositories = relationship("GitHubRepository", back_populates="user", cascade="all, delete-orphan")
    sync_history = relationship("SyncHistory", back_populates="user", cascade="all, delete-orphan")
    webhooks = relationship("Webhook", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(255))
    bio = Column(Text)
    theme_config = Column(JSONB)
    is_public = Column(Boolean, default=True)
    custom_domain = Column(String(255), unique=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profiles")
    blocks = relationship("Block", back_populates="profile", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_profiles_user_id', 'user_id'),
    )

class Block(Base):
    __tablename__ = "blocks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255))
    content = Column(JSONB)
    order_index = Column(Integer, nullable=False)
    width = Column(Integer, default=12)
    is_visible = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    profile = relationship("Profile", back_populates="blocks")

    __table_args__ = (
        Index('ix_blocks_profile_id', 'profile_id'),
        Index('ix_blocks_profile_id_order_index', 'profile_id', 'order_index'),
        Index('ix_blocks_type', 'type'),
    )

class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    series_id = Column(String(36), ForeignKey("series.id", ondelete="SET NULL"))
    title = Column(String(500), nullable=False)
    slug = Column(String(500), nullable=False)
    content_md = Column(Text, nullable=False)
    excerpt = Column(Text)
    cover_image = Column(Text)
    tags = Column(JSONB)
    status = Column(String(20), default='draft')
    published_at = Column(TIMESTAMP)
    view_count = Column(Integer, default=0)
    github_path = Column(String(500))
    github_sha = Column(String(100))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="blog_posts")
    series = relationship("Series", back_populates="blog_posts")

    __table_args__ = (
        Index('ix_blog_posts_user_id', 'user_id'),
        Index('ix_blog_posts_series_id', 'series_id'),
        Index('ix_blog_posts_user_id_slug', 'user_id', 'slug', unique=True),
        Index('ix_blog_posts_status', 'status'),
        Index('ix_blog_posts_published_at', 'published_at'),
    )

class Series(Base):
    __tablename__ = "series"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    description = Column(Text)
    thumbnail = Column(Text)
    is_public = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="series")
    blog_posts = relationship("BlogPost", back_populates="series")

    __table_args__ = (
        Index('ix_series_user_id', 'user_id'),
        Index('ix_series_user_id_slug', 'user_id', 'slug', unique=True),
    )

class GitHubRepository(Base):
    __tablename__ = "github_repositories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    github_repo_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    full_name = Column(String(500), nullable=False)
    description = Column(Text)
    url = Column(Text, nullable=False)
    homepage = Column(Text)
    language = Column(String(100))
    stars_count = Column(Integer, default=0)
    forks_count = Column(Integer, default=0)
    is_private = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False, index=True)
    topics = Column(JSONB)
    last_synced_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="github_repositories")

    __table_args__ = (
        Index('ix_github_repositories_user_id', 'user_id'),
    )

class SyncHistory(Base):
    __tablename__ = "sync_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(36))
    status = Column(String(20), nullable=False)
    error_code = Column(String(50))
    error_detail = Column(Text)
    triggered_by = Column(String(50))
    duration_ms = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="sync_history")

    __table_args__ = (
        Index('ix_sync_history_user_id', 'user_id'),
        Index('ix_sync_history_target_type', 'target_type'),
        Index('ix_sync_history_status', 'status'),
        Index('ix_sync_history_created_at', 'created_at'),
    )

class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    service = Column(String(50), nullable=False)
    event_type = Column(String(100), nullable=False)
    target_url = Column(Text, nullable=False)
    secret = Column(String(255))
    is_active = Column(Boolean, default=True, index=True)
    last_triggered_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="webhooks")

    __table_args__ = (
        Index('ix_webhooks_user_id', 'user_id'),
        Index('ix_webhooks_event_type', 'event_type'),
    )
