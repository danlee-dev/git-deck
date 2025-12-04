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

    bio = Column(Text, nullable=True)
    social_links = Column(JSONB, nullable=True)  # [{"platform": "linkedin", "url": "..."}]

    is_active = Column(Boolean, default=True)
    deleted_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    profiles = relationship("Profile", back_populates="user", cascade="all, delete-orphan")
    blog_posts = relationship("BlogPost", back_populates="user", cascade="all, delete-orphan")
    blog_folders = relationship("BlogFolder", back_populates="user", cascade="all, delete-orphan")
    series = relationship("Series", back_populates="user", cascade="all, delete-orphan")
    github_repositories = relationship("GitHubRepository", back_populates="user", cascade="all, delete-orphan")
    sync_history = relationship("SyncHistory", back_populates="user", cascade="all, delete-orphan")
    webhooks = relationship("Webhook", back_populates="user", cascade="all, delete-orphan")

    # Follow relationships
    followers = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following", cascade="all, delete-orphan")
    following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower", cascade="all, delete-orphan")

    # Likes
    post_likes = relationship("PostLike", back_populates="user", cascade="all, delete-orphan")

    # Comments
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")

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

class BlogFolder(Base):
    __tablename__ = "blog_folders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(String(36), ForeignKey("blog_folders.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(255), nullable=False)
    icon = Column(String(50), default='folder')
    order_index = Column(Integer, default=0)
    is_expanded = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="blog_folders")
    parent = relationship("BlogFolder", remote_side=[id], back_populates="children")
    children = relationship("BlogFolder", back_populates="parent", cascade="all, delete-orphan")
    blog_posts = relationship("BlogPost", back_populates="folder")

    __table_args__ = (
        Index('ix_blog_folders_user_id', 'user_id'),
        Index('ix_blog_folders_parent_id', 'parent_id'),
    )


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    series_id = Column(String(36), ForeignKey("series.id", ondelete="SET NULL"))
    folder_id = Column(String(36), ForeignKey("blog_folders.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(500), nullable=False)
    slug = Column(String(500), nullable=False)
    content_md = Column(Text, nullable=False)
    content_blocks = Column(JSONB, nullable=True)
    excerpt = Column(Text)
    cover_image = Column(Text)
    tags = Column(JSONB)
    status = Column(String(20), default='draft')
    published_at = Column(TIMESTAMP)
    view_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    github_repo_id = Column(String(36), ForeignKey("github_repositories.id", ondelete="SET NULL"), nullable=True)
    github_path = Column(String(500))
    github_sha = Column(String(100))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="blog_posts")
    series = relationship("Series", back_populates="blog_posts")
    folder = relationship("BlogFolder", back_populates="blog_posts")
    github_repo = relationship("GitHubRepository", back_populates="blog_posts")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_blog_posts_user_id', 'user_id'),
        Index('ix_blog_posts_series_id', 'series_id'),
        Index('ix_blog_posts_folder_id', 'folder_id'),
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
    blog_posts = relationship("BlogPost", back_populates="github_repo")

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


class Follow(Base):
    __tablename__ = "follows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    follower_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers")

    __table_args__ = (
        Index('ix_follows_follower_id', 'follower_id'),
        Index('ix_follows_following_id', 'following_id'),
        Index('ix_follows_unique', 'follower_id', 'following_id', unique=True),
    )


class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(String(36), ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="post_likes")
    post = relationship("BlogPost", back_populates="likes")

    __table_args__ = (
        Index('ix_post_likes_user_id', 'user_id'),
        Index('ix_post_likes_post_id', 'post_id'),
        Index('ix_post_likes_unique', 'user_id', 'post_id', unique=True),
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(String(36), ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(String(36), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="comments")
    post = relationship("BlogPost", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_comments_user_id', 'user_id'),
        Index('ix_comments_post_id', 'post_id'),
        Index('ix_comments_parent_id', 'parent_id'),
        Index('ix_comments_created_at', 'created_at'),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # Recipient
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # Who triggered
    type = Column(String(20), nullable=False)  # like, comment, follow, reply
    post_id = Column(String(36), ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=True)
    comment_id = Column(String(36), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], backref="notifications_received")
    actor = relationship("User", foreign_keys=[actor_id], backref="notifications_sent")
    post = relationship("BlogPost", backref="notifications")
    comment = relationship("Comment", backref="notifications")

    __table_args__ = (
        Index('ix_notifications_user_id', 'user_id'),
        Index('ix_notifications_is_read', 'is_read'),
        Index('ix_notifications_created_at', 'created_at'),
    )


class PostView(Base):
    """Track post views by date for analytics"""
    __tablename__ = "post_views"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False)
    view_date = Column(TIMESTAMP, nullable=False)  # Date of the view (truncated to day)
    view_count = Column(Integer, default=1)  # Count for that day
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    post = relationship("BlogPost", backref="view_history")

    __table_args__ = (
        Index('ix_post_views_post_id', 'post_id'),
        Index('ix_post_views_view_date', 'view_date'),
        Index('ix_post_views_post_date', 'post_id', 'view_date', unique=True),
    )


class Workflow(Base):
    """GitHub Actions workflow definitions"""
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    blocks = Column(JSONB, nullable=False, default=list)  # Block instances
    connections = Column(JSONB, nullable=False, default=list)  # Connection definitions
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="workflows")

    __table_args__ = (
        Index('ix_workflows_user_id', 'user_id'),
        Index('ix_workflows_name', 'name'),
    )
