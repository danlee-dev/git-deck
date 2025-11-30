"""
Cleanup script for permanently deleting accounts marked for deletion over 7 days ago.

Run this script with:
python -m app.scripts.cleanup_deleted_accounts

Or set up a cron job:
0 0 * * * cd /path/to/backend && python -m app.scripts.cleanup_deleted_accounts
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.base import SessionLocal
from app.models import User

def cleanup_deleted_accounts():
    """
    Permanently delete users marked for deletion over 7 days ago
    """
    db: Session = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=7)

        deleted_users = db.query(User).filter(
            User.deleted_at.isnot(None),
            User.deleted_at < cutoff_date
        ).all()

        count = len(deleted_users)

        if count == 0:
            print(f"[{datetime.utcnow()}] No accounts to delete")
            return

        print(f"[{datetime.utcnow()}] Found {count} accounts to permanently delete")

        for user in deleted_users:
            print(f"  - Deleting user: {user.username} (ID: {user.id}, deleted_at: {user.deleted_at})")
            db.delete(user)

        db.commit()
        print(f"[{datetime.utcnow()}] Successfully deleted {count} accounts")

    except Exception as e:
        db.rollback()
        print(f"[{datetime.utcnow()}] Error during cleanup: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_deleted_accounts()
