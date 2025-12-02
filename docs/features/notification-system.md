# Notification System

Real-time notification system with sound alerts, inline reply, and follow-back functionality.

## Features

- Real-time polling (10 second intervals)
- Sound notification on new alerts
- Inline reply to comments
- Follow-back button for follow notifications
- Correct navigation to posts
- Mark as read functionality

## Bug Fixes Implemented

### 1. Navigation to Wrong Post

**Problem**: Clicking a like/comment notification navigated to the actor's post instead of the user's own post.

**Root Cause**: Navigation used `notification.actor.username` instead of the post author's username.

**Solution**: Added `author_username` field to notification response.

```python
# backend/app/schemas/notification.py
class NotificationPost(BaseModel):
    id: str
    title: str
    slug: str
    author_username: str  # Added: Post author's username for navigation
```

```python
# backend/app/api/v1/endpoints/notifications.py
if post:
    post_author = post.user
    result["post"] = {
        "id": post.id,
        "title": post.title,
        "slug": post.slug,
        "author_username": post_author.username if post_author else "",
    }
```

```typescript
// frontend/src/components/notifications/NotificationDropdown.tsx
router.push(`/blog/${notification.post.author_username}/${notification.post.slug}`);
```

### 2. Double Comment Submission

**Problem**: Pressing Enter quickly submitted the same comment twice.

**Root Cause**: No check for submission state before starting new submission.

**Solution**: Check `isSubmittingReply` and clear content immediately.

```typescript
const handleSubmitReply = async (notification: Notification) => {
  // Prevent double submission
  if (!replyContent.trim() || !notification.comment || isSubmittingReply) return;

  const content = replyContent.trim();
  setIsSubmittingReply(true);
  setReplyContent(''); // Clear immediately to prevent double submit

  try {
    await feedAPI.createComment(notification.comment.post_id, {
      content,
      parent_id: notification.comment.id,
    });
    setReplyingTo(null);
  } catch (error) {
    console.error('Failed to submit reply:', error);
    setReplyContent(content); // Restore content on error
  } finally {
    setIsSubmittingReply(false);
  }
};
```

### 3. Notification Sound on Page Navigation

**Problem**: Sound played every time user navigated back to a page with notifications.

**Root Cause**: `lastUnreadCount.current` reset to `0` on component remount, making any existing notifications appear "new".

**Solution**: Initialize to `null` and track initial fetch state.

```typescript
const lastUnreadCount = useRef<number | null>(null); // null = not yet fetched
const isInitialFetch = useRef(true);

// In fetchUnreadCount:
if (!isInitialFetch.current && lastUnreadCount.current !== null && newCount > lastUnreadCount.current) {
  audioRef.current?.play().catch(() => {});
}
lastUnreadCount.current = newCount;
isInitialFetch.current = false;
```

### 4. Follow Button Shows Wrong Status

**Problem**: "Follow back" button appeared even when user already follows the notification actor.

**Root Cause**: Frontend used local state that wasn't initialized with actual follow relationships.

**Solution**: Backend provides `is_following` status in notification response.

```python
# backend/app/api/v1/endpoints/notifications.py
def notification_to_response(notification: Notification, db: Session, current_user_id: str) -> dict:
    # Check if current user is following the actor
    is_following = db.query(Follow).filter(
        Follow.follower_id == current_user_id,
        Follow.following_id == actor.id
    ).first() is not None

    result = {
        # ...
        "actor": {
            "id": actor.id,
            "username": actor.username,
            "github_username": actor.github_username,
            "avatar_url": actor.avatar_url,
            "is_following": is_following,  # Added
        },
        # ...
    }
```

```typescript
// Frontend uses backend data instead of local state
{notification.type === 'follow' && (
  <button
    onClick={e => handleFollowBack(e, notification)}
    disabled={notification.actor.is_following || followLoading === notification.actor.id}
    className={`... ${
      notification.actor.is_following
        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
        : 'bg-blue-600 text-white hover:bg-blue-700'
    }`}
  >
    {notification.actor.is_following ? 'Following' : 'Follow back'}
  </button>
)}
```

## Polling Architecture

```
Component Mount
    |
    v
fetchUnreadCount() --> Sets isInitialFetch = false
    |
    v
setInterval(10000) --> Poll every 10 seconds
    |
    v
On new notification count increase --> Play sound
    |
    v
Dropdown Open --> fetchNotifications() --> Full data load
```

## File Structure

```
backend/
  app/
    api/v1/endpoints/
      notifications.py      # API endpoints
    schemas/
      notification.py       # Pydantic schemas
    models/
      models.py             # Notification model

frontend/
  src/
    components/notifications/
      NotificationDropdown.tsx  # Main component
    types/
      blog.ts               # TypeScript interfaces
    lib/
      api.ts                # API client
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | Get notifications with pagination |
| GET | `/api/v1/notifications/unread-count` | Get unread count only |
| POST | `/api/v1/notifications/mark-read` | Mark notifications as read |
| DELETE | `/api/v1/notifications/{id}` | Delete a notification |

## Database Schema

```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),      -- Recipient
    actor_id VARCHAR(36) NOT NULL REFERENCES users(id),     -- Who triggered
    type VARCHAR(20) NOT NULL,                              -- like, comment, follow, reply
    post_id VARCHAR(36) REFERENCES blog_posts(id),
    comment_id VARCHAR(36) REFERENCES comments(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ix_notifications_user_id ON notifications(user_id);
CREATE INDEX ix_notifications_is_read ON notifications(is_read);
CREATE INDEX ix_notifications_created_at ON notifications(created_at);
```

## Dependencies

- `date-fns` - For relative time formatting (`formatDistanceToNow`)
- `lucide-react` - Icons (Bell, Heart, MessageCircle, UserPlus, Reply, etc.)
