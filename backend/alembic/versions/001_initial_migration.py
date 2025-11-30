"""Initial migration

Revision ID: 001
Revises:
Create Date: 2025-12-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('github_id', sa.String(100), nullable=False),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255)),
        sa.Column('avatar_url', sa.Text()),
        sa.Column('github_access_token', sa.Text()),
        sa.Column('github_webhook_id', sa.String(100)),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.UniqueConstraint('github_id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_github_id', 'users', ['github_id'])
    op.create_index('ix_users_username', 'users', ['username'])

    # Create profiles table
    op.create_table(
        'profiles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(255)),
        sa.Column('bio', sa.Text()),
        sa.Column('theme_config', postgresql.JSONB()),
        sa.Column('is_public', sa.Boolean(), server_default='true'),
        sa.Column('custom_domain', sa.String(255)),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('slug'),
        sa.UniqueConstraint('custom_domain')
    )
    op.create_index('ix_profiles_user_id', 'profiles', ['user_id'])
    op.create_index('ix_profiles_slug', 'profiles', ['slug'])
    op.create_index('ix_profiles_custom_domain', 'profiles', ['custom_domain'])

    # Create blocks table
    op.create_table(
        'blocks',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('profile_id', sa.String(36), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255)),
        sa.Column('content', postgresql.JSONB()),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('width', sa.Integer(), server_default='12'),
        sa.Column('is_visible', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE')
    )
    op.create_index('ix_blocks_profile_id', 'blocks', ['profile_id'])
    op.create_index('ix_blocks_profile_id_order_index', 'blocks', ['profile_id', 'order_index'])
    op.create_index('ix_blocks_type', 'blocks', ['type'])

    # Create series table
    op.create_table(
        'series',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('thumbnail', sa.Text()),
        sa.Column('is_public', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('ix_series_user_id', 'series', ['user_id'])
    op.create_index('ix_series_user_id_slug', 'series', ['user_id', 'slug'], unique=True)

    # Create blog_posts table
    op.create_table(
        'blog_posts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('series_id', sa.String(36)),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('slug', sa.String(500), nullable=False),
        sa.Column('content_md', sa.Text(), nullable=False),
        sa.Column('excerpt', sa.Text()),
        sa.Column('cover_image', sa.Text()),
        sa.Column('tags', postgresql.JSONB()),
        sa.Column('status', sa.String(20), server_default='draft'),
        sa.Column('published_at', sa.TIMESTAMP()),
        sa.Column('view_count', sa.Integer(), server_default='0'),
        sa.Column('github_path', sa.String(500)),
        sa.Column('github_sha', sa.String(100)),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['series_id'], ['series.id'], ondelete='SET NULL')
    )
    op.create_index('ix_blog_posts_user_id', 'blog_posts', ['user_id'])
    op.create_index('ix_blog_posts_series_id', 'blog_posts', ['series_id'])
    op.create_index('ix_blog_posts_user_id_slug', 'blog_posts', ['user_id', 'slug'], unique=True)
    op.create_index('ix_blog_posts_status', 'blog_posts', ['status'])
    op.create_index('ix_blog_posts_published_at', 'blog_posts', ['published_at'])

    # Create github_repositories table
    op.create_table(
        'github_repositories',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('github_repo_id', sa.String(100), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(500), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('homepage', sa.Text()),
        sa.Column('language', sa.String(100)),
        sa.Column('stars_count', sa.Integer(), server_default='0'),
        sa.Column('forks_count', sa.Integer(), server_default='0'),
        sa.Column('is_private', sa.Boolean(), server_default='false'),
        sa.Column('is_featured', sa.Boolean(), server_default='false'),
        sa.Column('topics', postgresql.JSONB()),
        sa.Column('last_synced_at', sa.TIMESTAMP()),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('github_repo_id')
    )
    op.create_index('ix_github_repositories_user_id', 'github_repositories', ['user_id'])
    op.create_index('ix_github_repositories_github_repo_id', 'github_repositories', ['github_repo_id'])
    op.create_index('ix_github_repositories_is_featured', 'github_repositories', ['is_featured'])

    # Create sync_history table
    op.create_table(
        'sync_history',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('target_type', sa.String(50), nullable=False),
        sa.Column('target_id', sa.String(36)),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('error_code', sa.String(50)),
        sa.Column('error_detail', sa.Text()),
        sa.Column('triggered_by', sa.String(50)),
        sa.Column('duration_ms', sa.Integer()),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('ix_sync_history_user_id', 'sync_history', ['user_id'])
    op.create_index('ix_sync_history_target_type', 'sync_history', ['target_type'])
    op.create_index('ix_sync_history_status', 'sync_history', ['status'])
    op.create_index('ix_sync_history_created_at', 'sync_history', ['created_at'])

    # Create webhooks table
    op.create_table(
        'webhooks',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('service', sa.String(50), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('target_url', sa.Text(), nullable=False),
        sa.Column('secret', sa.String(255)),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('last_triggered_at', sa.TIMESTAMP()),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('ix_webhooks_user_id', 'webhooks', ['user_id'])
    op.create_index('ix_webhooks_event_type', 'webhooks', ['event_type'])
    op.create_index('ix_webhooks_is_active', 'webhooks', ['is_active'])

    # Enable UUID extension for PostgreSQL
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')


def downgrade() -> None:
    op.drop_table('webhooks')
    op.drop_table('sync_history')
    op.drop_table('github_repositories')
    op.drop_table('blog_posts')
    op.drop_table('series')
    op.drop_table('blocks')
    op.drop_table('profiles')
    op.drop_table('users')
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
