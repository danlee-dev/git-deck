# GitDeck

<div align="center">
<h1>GitDeck</h1>
<p>GitHub Profile README Editor & Developer Blog Platform</p>
</div>

> 개발기간: 2025.12 ~
>
> Built with Next.js 14, FastAPI, PostgreSQL

## 프로젝트 개요

GitDeck은 GitHub 프로필 README를 시각적으로 편집하고 실시간 미리보기를 제공하는 웹 애플리케이션입니다. 140개 이상의 기술 뱃지와 스니펫 라이브러리를 통해 전문적인 프로필을 빠르게 구성할 수 있으며, GitHub과의 양방향 동기화로 편집한 내용을 즉시 배포할 수 있습니다.

또한 개발자를 위한 소셜 블로그 플랫폼을 제공하여 기술 포스트 작성, 팔로우/팔로잉, 좋아요, 댓글 기능을 통해 개발자 커뮤니티를 형성할 수 있습니다.

## Screenshots

| Profile Editor | Blog Feed |
|:---:|:---:|
| ![Profile Editor](images/v1-profile-editor.png) | ![Blog Feed](images/v1-blog-feed.png) |
| GitHub 프로필 README 실시간 편집기 | 팔로우한 개발자들의 포스트 피드 |

| Blog Post | My Page |
|:---:|:---:|
| ![Blog Post](images/v1-blog-page.png) | ![My Page](images/v1-mypage.png) |
| 마크다운 기술 블로그 상세 페이지 | 개인 통계 및 분석 차트 |

| Notifications |
|:---:|
| ![Notifications](images/v1-notification.png) |
| 실시간 알림 (좋아요, 댓글, 팔로우) |

## 주요 기능

### 프로필 에디터

- 실시간 마크다운 에디터: CodeMirror 6 기반, GitHub 렌더링과 동일한 미리보기
- 클릭-투-소스 네비게이션: 미리보기 요소 클릭 시 에디터의 해당 위치로 이동
- Quick Insert 패널: 6개 Stats 위젯, 5개 섹션 템플릿, 140+ 기술 뱃지
- 양방향 README 동기화: Load/Save with SHA-based 충돌 감지
- 로컬 자동 저장: localStorage 기반 세션 연속성

### 블로그 플랫폼

- 마크다운 블로그: 기술 포스트 작성 및 발행
- 소셜 기능: 팔로우/팔로잉, 좋아요, 댓글/답글
- 실시간 알림: 10초 폴링 기반, 사운드 알림 지원
- 분석 차트: 일별 조회수, 좋아요, 댓글 추이

### 공통 기능

- GitHub OAuth 인증: 원클릭 로그인 및 계정 연동
- 다크/라이트 테마: 시스템 설정 연동 지원

## 핵심 기능

### Profile Editor 상세

CodeMirror 6 기반의 마크다운 에디터와 실시간 GitHub 렌더링 미리보기를 제공합니다.

- **3단 레이아웃**: Editor | Preview | Quick Insert 패널 구성
- **실시간 미리보기**: GitHub Markdown API를 사용한 동일한 렌더링
- **클릭-투-소스**: 미리보기 클릭 시 에디터의 해당 소스 위치로 자동 스크롤
- **스마트 리스트**: 번호/불릿 리스트 자동 연속, 블록인용 자동 연속
- **테마 연동**: 다크/라이트 모드 자동 전환

### Quick Insert Panel

140개 이상의 스니펫과 뱃지를 제공하는 빠른 삽입 패널입니다.

- **Stats (6개)**:
  - Capsule Render (동적 헤더)
  - GitHub Stats Card (테마 인식 `<picture>` 태그)
  - Streak Stats (기여 연속 기록)
  - Activity Graph (기여 타임라인)
  - Top Languages (언어 비율)
  - Profile Views Counter

- **Sections (5개)**: About Me, Tech Stack, Projects, Awards, Contact 템플릿

- **Badges (140+)**: 언어, 프레임워크, DB, 클라우드, 도구 등 카테고리별 검색

- **Repository Selector**: GitHub 레포지토리 검색 및 카드/링크 삽입

### GitHub Integration

GitHub OAuth 2.0 인증과 양방향 README 동기화를 제공합니다.

- **OAuth 인증**: user, repo, read:org 스코프
- **README 동기화**: `{username}/{username}` 레포지토리 자동 감지
- **충돌 감지**: SHA 기반 외부 변경 감지 및 해결 UI
- **레포지토리 동기화**: stars, forks, language, topics 메타데이터 저장

## AI 기능 (Planned)

생산성 향상을 위한 AI 에이전트 통합을 계획 중입니다.

### Repo-to-Showcase (프로젝트 설명 생성기)

- 코드 구조 분석을 통한 프로젝트 설명 자동 생성
- 개요, 설치 방법, 기술 스택 등 README 섹션 생성

### Commit-to-Blog (회고 자동화)

- 커밋 히스토리 분석을 통한 주간 개발 회고록 초안 작성
- 작업 내용 요약 및 블로그 포스트 제안

### Smart Translator (다국어 지원)

- 한글 프로필/블로그 작성 후 영문 버전 자동 생성
- 언어 전환 뱃지 자동 삽입

## 프로젝트 구조

```plaintext
git-deck/
├── backend/                        # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/endpoints/       # API 엔드포인트
│   │   │   ├── auth.py             # 인증 (GitHub OAuth, 이메일)
│   │   │   ├── blog.py             # 블로그 CRUD
│   │   │   ├── feed.py             # 피드, 댓글, 좋아요
│   │   │   ├── mypage.py           # 마이페이지, 통계
│   │   │   ├── notifications.py    # 알림 시스템
│   │   │   ├── github.py           # GitHub API 연동
│   │   │   ├── profiles.py         # 프로필 관리
│   │   │   ├── blocks.py           # 프로필 블록
│   │   │   └── users.py            # 사용자 관리
│   │   ├── core/                   # 설정 및 보안
│   │   ├── models/                 # SQLAlchemy 모델 (14개 테이블)
│   │   ├── schemas/                # Pydantic 스키마
│   │   ├── services/               # GitHub API 서비스
│   │   └── utils/                  # 유틸리티
│   ├── alembic/                    # DB 마이그레이션
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                       # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                    # App Router
│   │   │   ├── (auth)/             # 인증 (login, register, callback)
│   │   │   ├── (dashboard)/        # 대시보드 레이아웃
│   │   │   │   ├── profile/        # README 에디터
│   │   │   │   ├── blog/           # 블로그 작성/수정
│   │   │   │   ├── mypage/         # 마이페이지
│   │   │   │   ├── dashboard/      # 피드
│   │   │   │   └── settings/       # 설정
│   │   │   └── blog/[username]/    # 공개 블로그 페이지
│   │   ├── components/
│   │   │   ├── layout/             # Header, Footer, Navigation
│   │   │   ├── profile-editor/     # 에디터, 프리뷰, 스니펫
│   │   │   ├── blog-editor/        # 블로그 에디터
│   │   │   ├── charts/             # 커스텀 SVG 차트
│   │   │   ├── notifications/      # 알림 드롭다운
│   │   │   ├── comments/           # 댓글 컴포넌트
│   │   │   └── feed/               # 피드 카드
│   │   ├── lib/                    # API 클라이언트, 유틸리티
│   │   ├── store/                  # Zustand 스토어
│   │   ├── hooks/                  # 커스텀 훅
│   │   └── types/                  # TypeScript 타입
│   ├── public/sounds/              # 알림 사운드
│   ├── package.json
│   └── .env.example
│
├── docs/                           # 문서
│   ├── architecture/               # 아키텍처 설계
│   │   └── diagrams/               # ERD, 시스템 다이어그램
│   ├── features/                   # 기능별 문서
│   ├── guides/                     # 설치 가이드
│   └── roadmap/                    # 개발 로드맵
│
└── images/                         # README 스크린샷
```

## 기술 스택

### Frontend Core

| 기술 | 용도 |
|------|------|
| Next.js 14+ | App Router 기반 React 프레임워크 |
| TypeScript | 타입 안전성 |
| Tailwind CSS | 유틸리티 기반 스타일링 |
| Zustand | 경량 상태 관리 (auth, theme, editor) |
| React Query | 서버 상태 관리 및 캐싱 |
| React Hook Form + Zod | 폼 검증 |
| Axios | HTTP 클라이언트 |

### Editor & Rich Text

| 기술 | 용도 |
|------|------|
| CodeMirror 6 | 프로필 README 마크다운 에디터 |
| BlockNote | Notion 스타일 블로그 에디터 |
| TipTap | 확장 가능한 Rich Text 에디터 |
| Mantine | BlockNote UI 컴포넌트 |

### Markdown & Syntax

| 기술 | 용도 |
|------|------|
| remark + remark-gfm | GitHub Flavored Markdown 파싱 |
| react-markdown | 마크다운 렌더링 |
| rehype-highlight | 코드 구문 강조 |
| highlight.js | 언어별 구문 강조 |

### UI Components

| 기술 | 용도 |
|------|------|
| Lucide React | 아이콘 라이브러리 |
| DnD Kit | 드래그 앤 드롭 |
| date-fns | 날짜 포맷팅 |
| clsx + tailwind-merge | 조건부 클래스 병합 |

### Backend

| 기술 | 용도 |
|------|------|
| FastAPI | Python 비동기 웹 프레임워크 |
| SQLAlchemy 2.0 | ORM (async 지원) |
| PostgreSQL | 관계형 데이터베이스 (14개 테이블) |
| Alembic | DB 마이그레이션 |
| python-jose | JWT 토큰 |
| bcrypt | 비밀번호 해싱 |
| httpx | 비동기 HTTP 클라이언트 (GitHub API) |

## 시스템 아키텍처

![System Architecture](images/v1-architecture.png)

### Data Flow

1. **Authentication**: GitHub OAuth 2.0 또는 이메일/비밀번호 -> JWT 토큰 발급
2. **Profile Editor**: CodeMirror 편집 -> GitHub Markdown API 렌더링 -> 실시간 미리보기
3. **README Sync**: SHA 기반 충돌 감지 -> GitHub API로 커밋
4. **Blog Editor**: BlockNote/TipTap -> 마크다운 변환 -> DB 저장
5. **Social Flow**: 좋아요/댓글/팔로우 -> 알림 생성 -> 10초 폴링
6. **Analytics**: PostView 테이블에 일별 조회수 집계 -> 차트 렌더링

### ERD (Entity Relationship Diagram)

![ERD](images/v1-erd.png)

14개 테이블: Users, Profiles, Blocks, BlogPosts, BlogFolders, Series, GitHubRepositories, SyncHistory, Webhooks, Follows, PostLikes, Comments, Notifications, PostViews

## 개발 로드맵

### Phase 1: Core Platform (Completed)

- [x] GitHub OAuth 인증
- [x] CodeMirror 마크다운 에디터
- [x] GitHub API 실시간 렌더링
- [x] 클릭-투-소스 네비게이션
- [x] Quick Insert 패널 (Stats, Sections, Badges)
- [x] README 양방향 동기화
- [x] 다크/라이트 테마 지원
- [x] 블로그 플랫폼 (작성, 수정, 삭제)
- [x] 소셜 기능 (팔로우, 좋아요, 댓글)
- [x] 실시간 알림 시스템
- [x] 마이페이지 통계 차트

### Phase 2: Enhanced Editor

- [ ] 뱃지 요소 Position Mapping 개선
- [ ] 요소 정렬 옵션 (center, left, right)
- [ ] 섹션 내용 사전 작성 기능
- [ ] 레포지토리 연동 Project 섹션
- [ ] 더 다양한 디자인 요소

### Phase 3: AI Integration

- [ ] Repo-to-Showcase 프로젝트 설명 생성
- [ ] Commit-to-Blog 회고 자동화
- [ ] Smart Translator 다국어 지원

### Phase 4: Automation

- [ ] GitHub Actions 연동
- [ ] Featured Projects 자동 업데이트
- [ ] 스케줄 기반 자동 동기화

## 시작하기

### 사전 요구사항

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 백엔드 설정

```bash
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# .env 파일을 설정에 맞게 수정

# 옵션 1: run.py 사용 (.env에서 PORT와 HOST 읽기)
python run.py

# 옵션 2: uvicorn 직접 사용
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 프론트엔드 설정

```bash
cd frontend

npm install

cp .env.example .env.local
# .env.local 파일을 설정에 맞게 수정

npm run dev
```

### 환경 변수

#### 백엔드 (.env)

개발 환경:

```env
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

DATABASE_URL=postgresql://user:password@localhost:5432/devdeck

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

OPENAI_API_KEY=your_openai_api_key
```

프로덕션 환경:

```env
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com

DATABASE_URL=postgresql://user:password@production:5432/devdeck
```

#### 프론트엔드 (.env.local)

개발 환경:

```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

프로덕션 환경:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

## 개발자

| 이성민                                                                                              |
| --------------------------------------------------------------------------------------------------- |
| <img src="https://avatars.githubusercontent.com/danlee-dev" width="160px" alt="이성민" />          |
| [GitHub: @danlee-dev](https://github.com/danlee-dev)                                                |
| 풀스택 개발<br>AI 에이전트 시스템 설계<br>프로젝트 아키텍처 및 문서화                              |
| 고려대학교 정보대학 컴퓨터학과                                                                      |

## 라이선스

MIT

---

## 기술 스택 배지

### 개발 환경

![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

### 백엔드 & AI

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

### 프론트엔드

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

### AI & LLM

![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-121212?style=for-the-badge&logo=chainlink&logoColor=white)
