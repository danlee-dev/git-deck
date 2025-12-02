# GitDeck Features Documentation

This directory contains technical documentation for features implemented in GitDeck.

## Table of Contents

1. [Notification System](./notification-system.md) - Real-time notifications with sound alerts, follow-back functionality, and quick reply
2. [View Analytics](./view-analytics.md) - Post view tracking by date for analytics charts
3. [Custom Charts](./custom-charts.md) - Custom SVG line charts for MyPage analytics
4. [UI Improvements](./ui-improvements.md) - Footer redesign and color consistency fixes

## Overview

### Session Updates (2025-12-02)

The following major features were added or significantly improved:

| Feature | Type | Description |
|---------|------|-------------|
| Notification Navigation Fix | Bug Fix | Fixed navigation to correct post when clicking notifications |
| Double Submit Prevention | Bug Fix | Prevented duplicate comment submissions on Enter key |
| Notification Sound Fix | Bug Fix | Fixed sound playing repeatedly on page navigation |
| Follow Status in Notifications | Enhancement | Show correct "Following" status for already-followed users |
| View History Tracking | New Feature | Track post views by date for analytics |
| Custom SVG Charts | Redesign | Replaced Nivo with custom minimal SVG charts |
| Footer Redesign | UI Change | Removed background, simplified to text-only footer |
| Background Color Fix | Bug Fix | Fixed color mismatch in MyPage (github-gray vs gray) |

## Architecture

```
Frontend (Next.js)
    |
    +-- NotificationDropdown.tsx  --> Polling, sound, follow-back
    +-- StatsCharts.tsx           --> Custom SVG line charts
    +-- Footer.tsx                --> Minimal text footer
    +-- mypage/page.tsx           --> MyPage with analytics
    |
Backend (FastAPI)
    |
    +-- notifications.py          --> Notification API with is_following
    +-- mypage.py                 --> Stats history with view data
    +-- feed.py                   --> View tracking on post read
    |
Database (PostgreSQL)
    |
    +-- post_views                --> View history by date
    +-- notifications             --> Notification records
```

## Related Files

### Backend
- `backend/app/models/models.py` - PostView, Notification models
- `backend/app/api/v1/endpoints/notifications.py` - Notification endpoints
- `backend/app/api/v1/endpoints/mypage.py` - Stats history endpoint
- `backend/app/api/v1/endpoints/feed.py` - View tracking
- `backend/app/schemas/notification.py` - Notification schemas

### Frontend
- `frontend/src/components/notifications/NotificationDropdown.tsx`
- `frontend/src/components/charts/StatsCharts.tsx`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/app/(dashboard)/mypage/page.tsx`
- `frontend/src/types/blog.ts`

### Migrations
- `backend/alembic/versions/925b074574a8_add_post_views_table.py`
