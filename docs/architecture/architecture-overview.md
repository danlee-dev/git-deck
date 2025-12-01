# GitDeck Architecture Overview

This document provides a comprehensive overview of the GitDeck application architecture, technical implementation details, and user-facing features.

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [GitHub Integration](#github-integration)
4. [Backend Technical Details](#backend-technical-details)
5. [Frontend Technical Details](#frontend-technical-details)
6. [Quick Insert Panel](#quick-insert-panel)
7. [User Value Delivered](#user-value-delivered)

---

## Project Overview

GitDeck is a full-stack web application that enables users to create, edit, and manage their GitHub profile README files with a real-time preview and rich snippet library. The application provides a visual editor experience similar to modern content management systems while maintaining full compatibility with GitHub's markdown rendering.

### Core Technologies

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL |
| Frontend | Next.js 14+, React 18, TypeScript, Tailwind CSS |
| State Management | Zustand (frontend), Pydantic (backend schemas) |
| Authentication | JWT (python-jose), bcrypt, GitHub OAuth 2.0 |
| Editor | CodeMirror 6 with markdown language support |
| HTTP Client | Axios (frontend), httpx (backend async) |

---

## System Architecture

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   Next.js App     |<--->|   FastAPI Server  |<--->|   PostgreSQL DB   |
|   (Frontend)      |     |   (Backend)       |     |                   |
|                   |     |                   |     +-------------------+
+-------------------+     +-------------------+
        |                         |
        |                         |
        v                         v
+-------------------+     +-------------------+
|                   |     |                   |
|   LocalStorage    |     |   GitHub API      |
|   (Client State)  |     |   (OAuth + REST)  |
|                   |     |                   |
+-------------------+     +-------------------+
```

### Data Flow

1. **Authentication Flow**: User authenticates via email/password or GitHub OAuth
2. **Editor Flow**: Markdown content is edited in CodeMirror and previewed in real-time
3. **Sync Flow**: Content is synchronized bidirectionally with GitHub repositories
4. **State Persistence**: Editor state is saved to localStorage for session continuity

---

## GitHub Integration

### OAuth 2.0 Authentication Flow

```
User                    GitDeck Frontend        GitDeck Backend         GitHub
  |                            |                       |                   |
  |---(1) Click Login--------->|                       |                   |
  |                            |---(2) Redirect------->|                   |
  |                            |                       |---(3) Auth URL--->|
  |<---(4) GitHub Login Page---|---------------------->|<------------------|
  |---(5) Authorize----------->|                       |                   |
  |                            |<---(6) Code-----------|-------------------|
  |                            |                       |---(7) Exchange--->|
  |                            |                       |<---(8) Token------|
  |                            |                       |---(9) User Info-->|
  |                            |                       |<---(10) Profile---|
  |                            |<---(11) JWT + User----|                   |
  |<---(12) Dashboard----------|                       |                   |
```

### OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `user` | Access user profile information |
| `repo` | Read/write access to public and private repositories |
| `read:org` | Read organization membership |

### GitHub API Integrations

1. **User Information**
   - Fetch authenticated user profile
   - Retrieve avatar, username, email

2. **Repository Management**
   - List all user repositories (public/private)
   - Sync repository metadata (stars, forks, language, topics)
   - Track repository updates

3. **README Operations**
   - Read README content from `{username}/{username}` repository
   - Render markdown using GitHub's Markdown API (ensures visual parity)
   - Commit README changes with SHA-based conflict detection

4. **Markdown Rendering**
   - Uses `POST https://api.github.com/markdown` endpoint
   - Ensures rendered output matches GitHub's actual display
   - Supports GitHub Flavored Markdown (GFM)

### Conflict Detection

The system tracks the SHA of the last synced README to detect external changes:

```typescript
// Frontend stores last synced SHA
localStorage.setItem('gitdeck-last-synced-sha', sha);

// On save, backend compares with current SHA
if (current_sha !== expected_sha) {
  return { status: 'conflict', current_content: ... }
}
```

---

## Backend Technical Details

### Directory Structure

```
/backend/app/
├── main.py                 # FastAPI application entry point
├── api/
│   ├── deps.py            # Dependency injection (auth, db)
│   └── v1/
│       ├── api.py         # Router configuration
│       └── endpoints/
│           ├── auth.py    # Authentication endpoints
│           ├── blocks.py  # Profile blocks management
│           ├── github.py  # GitHub integration
│           ├── profiles.py # Profile CRUD
│           ├── users.py   # User management
│           └── blog.py    # Blog functionality
├── core/
│   ├── config.py          # Environment configuration
│   └── security.py        # JWT and password hashing
├── models/
│   ├── base.py            # SQLAlchemy base configuration
│   └── models.py          # Database models (8 tables)
├── schemas/               # Pydantic request/response schemas
└── services/
    ├── github_service.py  # GitHub API wrapper
    └── sync_service.py    # Repository synchronization
```

### Database Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| User | User accounts | id, email, github_username, github_access_token |
| Profile | User profiles | slug, display_name, theme_config (JSONB) |
| Block | Content blocks | type, content (JSONB), order_index |
| GitHubRepository | Synced repos | name, stars_count, language, topics (JSONB) |
| BlogPost | Blog entries | title, content_md, status, github_sha |
| Series | Blog series | title, description |
| SyncHistory | Sync logs | status, error_detail, duration_ms |
| Webhook | Webhook configs | service, event_type, target_url |

### Key API Endpoints

#### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Email/password registration |
| POST | `/login` | Email/password login |
| GET | `/me` | Get current user info |
| GET | `/github/login` | Initiate GitHub OAuth |
| GET | `/github/callback` | Handle OAuth callback |
| POST | `/connect-github` | Link GitHub to existing account |
| DELETE | `/account` | Soft delete (7-day grace period) |
| POST | `/account/restore` | Restore deleted account |

#### Blocks (`/api/v1/blocks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List blocks (optional profile filter) |
| POST | `/` | Create new block |
| PUT | `/{id}` | Update block |
| DELETE | `/{id}` | Delete block |
| GET | `/load-from-github` | Load README from GitHub |
| POST | `/render-markdown` | Render markdown via GitHub API |
| POST | `/save-to-github` | Save to GitHub with conflict detection |

### Security Implementation

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: 7-day expiry, HS256 algorithm
3. **GitHub Token Storage**: Encrypted in database
4. **Dependency Guards**: `get_current_active_user`, `require_github_connection`

---

## Frontend Technical Details

### Directory Structure

```
/frontend/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── auth/callback/ # OAuth callback handler
│   └── (dashboard)/       # Protected dashboard routes
│       ├── profile/       # README editor
│       ├── github/        # GitHub settings
│       ├── settings/      # User settings
│       └── blog/          # Blog management
├── components/
│   ├── layout/            # Header, Footer, Navigation
│   └── profile-editor/    # Editor components
│       └── snippets/      # Quick insert system
├── lib/
│   ├── api.ts             # Axios API client
│   ├── markdown.ts        # Markdown utilities
│   └── markdownPositionMapper.ts  # AST-based position tracking
├── store/                 # Zustand state stores
│   ├── authStore.ts       # Authentication state
│   ├── themeStore.ts      # Dark/light mode
│   └── profileEditorStore.ts  # Editor state
└── types/                 # TypeScript type definitions
```

### State Management (Zustand)

#### Auth Store
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  connectGithub: (code: string) => Promise<void>;
}
```

#### Profile Editor Store
```typescript
interface ProfileEditorState {
  markdownContent: string;
  rawHTML: string | null;
  renderedHTML: string | null;
  setMarkdownContent: (content: string) => void;
  clearContent: () => void;
}
```

### Markdown Editor Implementation

The editor uses CodeMirror 6 with custom extensions:

1. **Language Support**: `@codemirror/lang-markdown` with GFM
2. **Theme Switching**: Custom light/dark themes matching GitHub
3. **Smart List Continuation**: Auto-continues numbered/bulleted lists
4. **Tab Indentation**: `indentWithTab` keymap
5. **Line Wrapping**: `EditorView.lineWrapping`

### Position Mapping (Click-to-Source)

The system maps rendered HTML elements back to source markdown positions:

```typescript
// Parse markdown AST to extract block positions
function parseMarkdownBlocks(markdown: string): BlockPosition[] {
  // Uses unified, remark-parse, remark-gfm
  // Returns: { type, start, end, text, depth?, hasImage? }
}

// Add data attributes to HTML
function addPositionDataToHTML(html: string, markdown: string): string {
  // Adds data-line-start, data-line-end attributes
  // Uses text content matching for accuracy
}

// Handle click events
function handlePreviewClick(e: MouseEvent) {
  // Find element with position data
  // Scroll editor to center selection
  // Set CodeMirror selection
}
```

### Theme System

- CSS custom properties for colors
- Tailwind dark mode classes (`dark:`)
- LocalStorage persistence
- System preference detection

---

## Quick Insert Panel

The Quick Insert panel provides pre-built markdown snippets for common GitHub profile elements.

### Category Overview

| Category | Items | Description |
|----------|-------|-------------|
| Stats | 6 | GitHub statistics widgets |
| Sections | 5 | Profile section templates |
| Badges | 140+ | Technology and skill badges |

### Stats Snippets

#### 1. Capsule Render Header
Dynamic SVG header with customizable text and colors.
```markdown
![header](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=300&section=header&text=Your%20Name&fontSize=90)
```

#### 2. GitHub Stats Card
Theme-aware statistics card using `<picture>` tag for light/dark mode.
```markdown
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="...&theme=dark">
  <source media="(prefers-color-scheme: light)" srcset="...&theme=default">
  <img src="..." alt="GitHub Stats">
</picture>
```

#### 3. Streak Stats
Contribution streak display from github-readme-streak-stats.
```markdown
![GitHub Streak](https://streak-stats.demolab.com?user=USERNAME&theme=default)
```

#### 4. Activity Graph
Contribution activity timeline visualization.
```markdown
![Activity Graph](https://github-readme-activity-graph.vercel.app/graph?username=USERNAME)
```

#### 5. Top Languages
Language usage breakdown with customizable layout.
```markdown
![Top Langs](https://github-readme-stats.vercel.app/api/top-langs/?username=USERNAME&layout=compact)
```

#### 6. Profile Views Counter
Visitor counter badge.
```markdown
![Profile Views](https://komarev.com/ghpvc/?username=USERNAME)
```

### Section Templates

#### 1. About Me
```markdown
## About Me
- Current role and focus
- Learning goals
- Collaboration interests
- Contact information
- Fun facts
```

#### 2. Tech Stack
Pre-formatted section with badge placeholders for languages, frameworks, databases, and tools.

#### 3. Projects
Template for featured project showcase with description and link format.

#### 4. Awards
Section for achievements, certifications, and recognition.

#### 5. Contact
Social media and professional contact links section.

### Badge Library

The badge system includes 140+ technology badges organized by category:

#### Languages (17)
JavaScript, TypeScript, Python, Java, C#, C++, C, Go, Rust, PHP, Ruby, Swift, Kotlin, Dart, R, Scala, Shell

#### Frameworks (19)
React, Next.js, Vue, Nuxt, Angular, Svelte, Solid, Astro, Gatsby, Node.js, Express, NestJS, Fastify, Django, Flask, FastAPI, Spring, Laravel, Rails

#### Databases (9)
MongoDB, PostgreSQL, MySQL, Redis, SQLite, MariaDB, Elasticsearch, Supabase, Firebase

#### Cloud and DevOps (8)
AWS, GCP, Azure, Vercel, Netlify, Heroku, Docker, Kubernetes

#### Tools (30+)
Git, GitHub, GitLab, VS Code, IntelliJ, Vim, Postman, Figma, Tailwind CSS, Sass, styled-components, Bootstrap, Material-UI, Jest, Vitest, Cypress, Playwright, Pytest, Redux, Zustand, MobX, Webpack, Vite, Rollup, npm, Yarn, pnpm

#### AI/ML (3)
TensorFlow, PyTorch, OpenCV

#### GraphQL and API (4)
GraphQL, Apollo, Prisma, tRPC

### Repository Selector

The Repository Selector modal allows users to:

1. Search through synced GitHub repositories
2. View repository metadata (stars, forks, language)
3. Insert formatted repository links or cards

---

## User Value Delivered

### Current Features

1. **Visual README Editing**
   - Real-time preview matching GitHub's rendering
   - Click-to-source navigation between preview and editor
   - Smooth scroll centering on selected content

2. **GitHub Integration**
   - One-click OAuth authentication
   - Bidirectional README synchronization
   - Conflict detection and resolution
   - Repository metadata access

3. **Rich Snippet Library**
   - 6 dynamic stats widgets
   - 5 section templates
   - 140+ searchable technology badges
   - Repository card generator

4. **Modern Editor Experience**
   - CodeMirror-based markdown editor
   - Syntax highlighting
   - Smart list/quote continuation
   - Dark/light theme support

5. **State Persistence**
   - Auto-save to localStorage
   - Session continuity
   - SHA tracking for sync status

### User Workflow

```
1. Login/Register
       |
       v
2. Connect GitHub Account
       |
       v
3. Load Existing README (optional)
       |
       v
4. Edit with Quick Insert snippets
       |
       v
5. Preview in real-time
       |
       v
6. Save to GitHub
       |
       v
7. View on GitHub Profile
```

### Planned Features

- Blog post management
- Custom themes
- Template library
- Analytics dashboard
- Webhook notifications

---

## Appendix

### Environment Variables

#### Backend
```
DATABASE_URL=postgresql://...
SECRET_KEY=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_REDIRECT_URI=...
FRONTEND_URL=...
```

#### Frontend
```
NEXT_PUBLIC_API_URL=...
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
```

### API Base URL

- Development: `http://localhost:8000/api/v1`
- Production: `https://api.gitdeck.dev/api/v1`

### Database Migrations

Managed with Alembic:
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```
