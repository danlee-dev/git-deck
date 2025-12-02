"""add follows, likes, and social features

Revision ID: c2f3a8b94567
Revises: b1cca9590232
Create Date: 2025-12-02 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2f3a8b94567'
down_revision: Union[str, None] = 'b1cca9590232'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add bio to users
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))

    # Add likes_count to blog_posts
    op.add_column('blog_posts', sa.Column('likes_count', sa.Integer(), nullable=True, server_default='0'))

    # Create follows table
    op.create_table('follows',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('follower_id', sa.String(length=36), nullable=False),
        sa.Column('following_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['following_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_follows_follower_id', 'follows', ['follower_id'], unique=False)
    op.create_index('ix_follows_following_id', 'follows', ['following_id'], unique=False)
    op.create_index('ix_follows_unique', 'follows', ['follower_id', 'following_id'], unique=True)

    # Create post_likes table
    op.create_table('post_likes',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['blog_posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_post_likes_user_id', 'post_likes', ['user_id'], unique=False)
    op.create_index('ix_post_likes_post_id', 'post_likes', ['post_id'], unique=False)
    op.create_index('ix_post_likes_unique', 'post_likes', ['user_id', 'post_id'], unique=True)


def downgrade() -> None:
    # Drop post_likes table
    op.drop_index('ix_post_likes_unique', table_name='post_likes')
    op.drop_index('ix_post_likes_post_id', table_name='post_likes')
    op.drop_index('ix_post_likes_user_id', table_name='post_likes')
    op.drop_table('post_likes')

    # Drop follows table
    op.drop_index('ix_follows_unique', table_name='follows')
    op.drop_index('ix_follows_following_id', table_name='follows')
    op.drop_index('ix_follows_follower_id', table_name='follows')
    op.drop_table('follows')

    # Drop likes_count from blog_posts
    op.drop_column('blog_posts', 'likes_count')

    # Drop bio from users
    op.drop_column('users', 'bio')
