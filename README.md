# GitDeck

<div align="center">
<h1>GitDeck</h1>
<p>GitHub Profile README Editor with Real-time Preview</p>
</div>

> 개발기간: 2025.12 ~
>
> Built with Next.js 14, FastAPI, PostgreSQL

## 프로젝트 개요

GitDeck은 GitHub 프로필 README를 시각적으로 편집하고 실시간 미리보기를 제공하는 웹 애플리케이션입니다. 140개 이상의 기술 뱃지와 스니펫 라이브러리를 통해 전문적인 프로필을 빠르게 구성할 수 있으며, GitHub과의 양방향 동기화로 편집한 내용을 즉시 배포할 수 있습니다.

### 현재 구현된 기능

- **실시간 마크다운 에디터**: CodeMirror 6 기반, GitHub 렌더링과 동일한 미리보기
- **클릭-투-소스 네비게이션**: 미리보기 요소 클릭 시 에디터의 해당 위치로 이동
- **Quick Insert 패널**: 6개 Stats 위젯, 5개 섹션 템플릿, 140+ 기술 뱃지
- **GitHub OAuth 인증**: 원클릭 로그인 및 계정 연동
- **양방향 README 동기화**: Load/Save with SHA-based 충돌 감지
- **다크/라이트 테마**: 시스템 설정 연동 지원
- **로컬 자동 저장**: localStorage 기반 세션 연속성

![GitDeck Profile Editor](images/v1-profile-editor.png)

## 핵심 기능

### Profile Editor

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
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/endpoints/   # API 엔드포인트 (auth, blocks, github, profiles, users, blog)
│   │   ├── core/               # 설정 및 보안 (config.py, security.py)
│   │   ├── models/             # SQLAlchemy 모델 (8개 테이블)
│   │   ├── schemas/            # Pydantic 스키마
│   │   └── services/           # GitHub API, 동기화 서비스
│   ├── alembic/                # DB 마이그레이션
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                # App Router (auth, dashboard, profile, github, blog)
│   │   ├── components/
│   │   │   ├── layout/         # Header, Footer, Navigation
│   │   │   └── profile-editor/ # ProfilePreview, MarkdownEditor, SnippetsPanel
│   │   ├── lib/                # API 클라이언트, 마크다운 유틸리티
│   │   ├── store/              # Zustand 스토어 (auth, theme, profileEditor)
│   │   └── types/              # TypeScript 타입 정의
│   ├── package.json
│   └── .env.example
│
└── docs/                       # 문서
    ├── architecture/           # 아키텍처 및 설계
    │   ├── architecture-overview.md
    │   └── diagrams/
    ├── guides/                 # 설치 및 시작 가이드
    │   ├── GETTING_STARTED.md
    │   └── SETUP.md
    └── roadmap/                # 개발 계획 및 로드맵
        ├── 2025-12-02-implementation-roadmap.md
        └── proposal.md
```

## 기술 스택

### Frontend

| 기술 | 용도 |
|------|------|
| Next.js 14+ | App Router 기반 React 프레임워크 |
| TypeScript | 타입 안전성 |
| Tailwind CSS | 유틸리티 기반 스타일링 |
| Zustand | 경량 상태 관리 (auth, theme, editor) |
| CodeMirror 6 | 마크다운 에디터 |
| Axios | HTTP 클라이언트 |
| Lucide React | 아이콘 라이브러리 |

### Backend

| 기술 | 용도 |
|------|------|
| FastAPI | Python 비동기 웹 프레임워크 |
| SQLAlchemy | ORM |
| PostgreSQL | 관계형 데이터베이스 |
| Alembic | DB 마이그레이션 |
| python-jose | JWT 토큰 |
| bcrypt | 비밀번호 해싱 |
| httpx | 비동기 HTTP 클라이언트 (GitHub API) |

### Markdown Processing

| 기술 | 용도 |
|------|------|
| unified | 마크다운 파싱 프레임워크 |
| remark-parse | 마크다운 파서 |
| remark-gfm | GitHub Flavored Markdown 지원 |
| unist-util-visit | AST 순회 유틸리티 |

## 시스템 아키텍처

```plaintext
+-------------------+     +-------------------+     +-------------------+
|   Next.js App     |<--->|   FastAPI Server  |<--->|   PostgreSQL DB   |
|   (Frontend)      |     |   (Backend)       |     |                   |
+-------------------+     +-------------------+     +-------------------+
        |                         |
        v                         v
+-------------------+     +-------------------+
|   LocalStorage    |     |   GitHub API      |
|   (Client State)  |     |   (OAuth + REST)  |
+-------------------+     +-------------------+
```

### Data Flow

1. **Authentication**: GitHub OAuth 또는 이메일/비밀번호 인증
2. **Editor**: 마크다운 편집 -> GitHub API 렌더링 -> 실시간 미리보기
3. **Sync**: SHA 기반 충돌 감지 후 GitHub 레포지토리에 커밋
4. **State**: localStorage를 통한 세션 연속성 유지

## 개발 로드맵

### Phase 1: Core Editor (Current)

- [x] GitHub OAuth 인증
- [x] CodeMirror 마크다운 에디터
- [x] GitHub API 실시간 렌더링
- [x] 클릭-투-소스 네비게이션
- [x] Quick Insert 패널 (Stats, Sections, Badges)
- [x] README 양방향 동기화
- [x] 다크/라이트 테마 지원
- [ ] 뱃지 요소 Position Mapping 개선
- [ ] 요소 정렬 옵션 (center, left, right)

### Phase 2: Enhanced Editor

- [ ] 섹션 내용 사전 작성 기능
- [ ] 레포지토리 연동 Project 섹션
- [ ] AI 콘텐츠 생성 통합
- [ ] 더 다양한 디자인 요소

### Phase 3: Automation

- [ ] GitHub Actions 연동
- [ ] Featured Projects 자동 업데이트
- [ ] 블로그 연동
- [ ] 다국어 자동 번역

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
