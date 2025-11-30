"""add email login support

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make email NOT NULL
    op.alter_column('users', 'email',
               existing_type=sa.String(255),
               nullable=False)

    # Make github_id nullable
    op.alter_column('users', 'github_id',
               existing_type=sa.String(100),
               nullable=True)

    # Add new columns
    op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('is_github_connected', sa.Boolean(), server_default='false', nullable=False))

    # Make github_access_token and github_webhook_id nullable
    op.alter_column('users', 'github_access_token',
               existing_type=sa.Text(),
               nullable=True)

    op.alter_column('users', 'github_webhook_id',
               existing_type=sa.String(100),
               nullable=True)

    # Update existing users to have is_github_connected = true if they have github_id
    op.execute("UPDATE users SET is_github_connected = true WHERE github_id IS NOT NULL")


def downgrade() -> None:
    # Remove new columns
    op.drop_column('users', 'is_github_connected')
    op.drop_column('users', 'password_hash')

    # Revert nullable changes
    op.alter_column('users', 'github_id',
               existing_type=sa.String(100),
               nullable=False)

    op.alter_column('users', 'email',
               existing_type=sa.String(255),
               nullable=True)
