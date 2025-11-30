"""
Seed script for development environment - creates fake user data.

Run this script with:
python -m app.scripts.seed_data

WARNING: This script should ONLY be run in development environment.
"""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.base import SessionLocal
from app.models import User, Profile, Block
from app.core.security import get_password_hash
from app.core.config import settings

def seed_development_data():
    """
    Create fake user data for development environment
    """
    # Safety check - only run in development
    if not hasattr(settings, 'ENVIRONMENT') or settings.ENVIRONMENT == 'production':
        print("ERROR: This script should only be run in development environment!")
        return

    db: Session = SessionLocal()
    try:
        # Check if seed data already exists
        existing_user = db.query(User).filter(User.username == "devuser1").first()
        if existing_user:
            print("Seed data already exists. Skipping...")
            return

        print(f"[{datetime.utcnow()}] Starting seed data generation...")

        # Create 3 fake users
        users_data = [
            {
                "id": str(uuid.uuid4()),
                "username": "devuser1",
                "email": "devuser1@gitdeck.dev",
                "password_hash": get_password_hash("password123"),
                "avatar_url": "https://avatars.githubusercontent.com/u/1?v=4",
                "github_id": None,
                "github_access_token": None,
                "is_github_connected": False,
                "is_active": True,
                "deleted_at": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "username": "devuser2",
                "email": "devuser2@gitdeck.dev",
                "password_hash": get_password_hash("password123"),
                "avatar_url": "https://avatars.githubusercontent.com/u/2?v=4",
                "github_id": "1234567890",
                "github_access_token": "ghp_fake_token_for_dev_only",
                "is_github_connected": True,
                "is_active": True,
                "deleted_at": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "username": "devuser3",
                "email": "devuser3@gitdeck.dev",
                "password_hash": get_password_hash("password123"),
                "avatar_url": "https://avatars.githubusercontent.com/u/3?v=4",
                "github_id": "9876543210",
                "github_access_token": "ghp_fake_token_for_dev_only_2",
                "is_github_connected": True,
                "is_active": True,
                "deleted_at": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]

        created_users = []
        for user_data in users_data:
            user = User(**user_data)
            db.add(user)
            created_users.append(user)
            print(f"  - Created user: {user.username} (ID: {user.id})")

        db.commit()

        # Create profiles for each user
        print(f"\n[{datetime.utcnow()}] Creating profiles...")
        for i, user in enumerate(created_users, 1):
            profile = Profile(
                id=str(uuid.uuid4()),
                user_id=user.id,
                slug=f"devuser{i}",
                display_name=f"Developer User {i}",
                bio=f"I'm a passionate developer working on Git Deck! User #{i}",
                theme_config={
                    "primaryColor": "#3b82f6",
                    "secondaryColor": "#8b5cf6",
                    "backgroundColor": "#ffffff"
                },
                is_public=True,
                custom_domain=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(profile)
            print(f"  - Created profile for {user.username}: @{profile.slug}")

            # Create sample blocks for the profile
            blocks_data = [
                {
                    "type": "header",
                    "title": f"{profile.display_name}",
                    "content": {
                        "text": f"Welcome to my profile! I'm {profile.display_name}.",
                        "subtitle": "Full Stack Developer"
                    },
                    "order_index": 0,
                    "width": 12
                },
                {
                    "type": "skills",
                    "title": "Tech Stack",
                    "content": {
                        "skills": [
                            {"name": "Python", "icon": "python"},
                            {"name": "JavaScript", "icon": "javascript"},
                            {"name": "React", "icon": "react"},
                            {"name": "FastAPI", "icon": "fastapi"}
                        ]
                    },
                    "order_index": 1,
                    "width": 6
                },
                {
                    "type": "stats",
                    "title": "GitHub Stats",
                    "content": {
                        "show_private_commits": True,
                        "show_language_distribution": True
                    },
                    "order_index": 2,
                    "width": 6
                }
            ]

            for block_data in blocks_data:
                block = Block(
                    id=str(uuid.uuid4()),
                    profile_id=profile.id,
                    type=block_data["type"],
                    title=block_data["title"],
                    content=block_data["content"],
                    order_index=block_data["order_index"],
                    width=block_data["width"],
                    is_visible=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(block)

        db.commit()

        print(f"\n[{datetime.utcnow()}] Seed data generation completed!")
        print("\nTest credentials:")
        print("  Email: devuser1@gitdeck.dev")
        print("  Email: devuser2@gitdeck.dev")
        print("  Email: devuser3@gitdeck.dev")
        print("  Password: password123")

    except Exception as e:
        db.rollback()
        print(f"[{datetime.utcnow()}] Error during seed data generation: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_development_data()
