"""
Development setup script - runs migrations and seeds data.

Run this script with:
python setup_dev.py
"""
import subprocess
import sys
from app.core.config import settings

def main():
    """Run database migrations and seed development data"""

    # Safety check
    if settings.ENVIRONMENT == "production":
        print("ERROR: This script should not be run in production!")
        sys.exit(1)

    print("=" * 60)
    print("Git Deck - Development Environment Setup")
    print("=" * 60)

    # Run migrations
    print("\n[1/2] Running database migrations...")
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        print("✓ Migrations completed successfully")
    except subprocess.CalledProcessError as e:
        print(f"✗ Migration failed: {e.stderr}")
        sys.exit(1)

    # Seed development data
    print("\n[2/2] Seeding development data...")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "app.scripts.seed_data"],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        print("✓ Seed data created successfully")
    except subprocess.CalledProcessError as e:
        print(f"✗ Seeding failed: {e.stderr}")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("Development setup completed!")
    print("=" * 60)
    print("\nYou can now start the server with:")
    print("  uvicorn app.main:app --host 0.0.0.0 --port 8006 --reload")
    print("\nTest credentials:")
    print("  Email: devuser1@gitdeck.dev")
    print("  Password: password123")

if __name__ == "__main__":
    main()
