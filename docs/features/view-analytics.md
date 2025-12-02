# View Analytics

Post view tracking by date for analytics charts in MyPage.

## Overview

Previously, only total view counts were tracked on posts. To display view trends in charts, views needed to be tracked by date.

## Implementation

### 1. Database Model

Created `PostView` model to track views by date:

```python
# backend/app/models/models.py
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
        Index('ix_post_views_post_date', 'post_id', 'view_date', unique=True),  # One record per post per day
    )
```

### 2. Migration

```python
# backend/alembic/versions/925b074574a8_add_post_views_table.py
def upgrade() -> None:
    op.create_table('post_views',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('view_date', sa.TIMESTAMP(), nullable=False),
        sa.Column('view_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['blog_posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_post_views_post_date', 'post_views', ['post_id', 'view_date'], unique=True)
    op.create_index('ix_post_views_post_id', 'post_views', ['post_id'], unique=False)
    op.create_index('ix_post_views_view_date', 'post_views', ['view_date'], unique=False)
```

Run migration:
```bash
cd backend
alembic upgrade head
```

### 3. View Tracking on Post Read

When a post is viewed, both total count and daily count are updated:

```python
# backend/app/api/v1/endpoints/feed.py
@router.get("/users/{username}/posts/{slug}", response_model=BlogPostDetailPublic)
def get_user_post(username: str, slug: str, db: Session = Depends(get_db_session)):
    # ... get post ...

    # Increment total view count
    post.view_count = (post.view_count or 0) + 1

    # Track view history by date
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_view = db.query(PostView).filter(
        PostView.post_id == post.id,
        PostView.view_date == today
    ).first()

    if existing_view:
        existing_view.view_count += 1
    else:
        new_view = PostView(
            id=str(uuid.uuid4()),
            post_id=post.id,
            view_date=today,
            view_count=1
        )
        db.add(new_view)

    db.commit()
    # ...
```

### 4. Stats History API

Query view history for charts:

```python
# backend/app/api/v1/endpoints/mypage.py
@router.get("/me/stats/history", response_model=StatsHistory)
def get_my_stats_history(
    days: int = 30,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    days = min(days, 90)  # Limit to prevent abuse

    # Get all user's post IDs
    user_post_ids = db.query(BlogPost.id).filter(
        BlogPost.user_id == current_user.id
    ).all()
    post_ids = [p.id for p in user_post_ids]

    # Calculate date range
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days - 1)

    # Get views by date on user's posts
    views_by_date = {}
    if post_ids:
        views_query = db.query(
            cast(PostView.view_date, Date).label('date'),
            func.sum(PostView.view_count).label('count')
        ).filter(
            PostView.post_id.in_(post_ids),
            cast(PostView.view_date, Date) >= start_date
        ).group_by(cast(PostView.view_date, Date)).all()

        for row in views_query:
            views_by_date[str(row.date)] = row.count or 0

    # Similarly for likes and comments...

    # Build daily stats for all days in range
    daily_stats = []
    current_date = start_date
    while current_date <= end_date:
        date_str = str(current_date)
        daily_stats.append(DailyStats(
            date=date_str,
            views=views_by_date.get(date_str, 0),
            likes=likes_by_date.get(date_str, 0),
            comments=comments_by_date.get(date_str, 0)
        ))
        current_date += timedelta(days=1)

    return StatsHistory(
        daily_stats=daily_stats,
        total_views=total_views,
        total_likes=total_likes,
        total_comments=total_comments
    )
```

## Data Flow

```
User visits post
    |
    v
GET /api/v1/feed/users/{username}/posts/{slug}
    |
    v
+-- Increment BlogPost.view_count (total)
+-- Upsert PostView record for today
    |
    v
User visits MyPage
    |
    v
GET /api/v1/mypage/me/stats/history?days=30
    |
    v
Query PostView grouped by date
    |
    v
Return daily_stats array for charts
```

## Database Schema

```sql
CREATE TABLE post_views (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    view_date TIMESTAMP NOT NULL,
    view_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX ix_post_views_post_id ON post_views(post_id);
CREATE INDEX ix_post_views_view_date ON post_views(view_date);
CREATE UNIQUE INDEX ix_post_views_post_date ON post_views(post_id, view_date);
```

## API Response

```typescript
interface DailyStats {
  date: string;      // "2025-12-02"
  views: number;
  likes: number;
  comments: number;
}

interface StatsHistory {
  daily_stats: DailyStats[];
  total_views: number;
  total_likes: number;
  total_comments: number;
}
```

## Frontend Usage

```typescript
// frontend/src/app/(dashboard)/mypage/page.tsx
const fetchStatsHistory = async () => {
  const response = await mypageAPI.getStatsHistory(30);
  setStatsHistory(response.data);
};

// Pass to charts component
<StatsCharts
  statsHistory={statsHistory}
  isLoading={isLoadingStats}
  fallbackViews={profile.stats.total_views}
  fallbackLikes={profile.stats.total_likes_received}
/>
```

## Notes

- Views are tracked at the day level (hour/minute/second truncated)
- Unique constraint prevents duplicate records for same post/date
- Historical data before this feature shows as 0 in charts
- Total view count still maintained on BlogPost for quick access
