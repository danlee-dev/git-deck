# DevDeck

<div align="center">
<h1>DevDeck</h1>
<p>AI 기반 개발자 브랜딩 플랫폼</p>
</div>

> 개발기간: 2025.01 ~
>
> Built with Next.js 14, FastAPI, PostgreSQL

## 프로젝트 개요

한 번 작성하면 모든 곳에 자동 동기화. AI가 관리하는 개발자 프로필.

DevDeck은 GitHub 프로필과 블로그 관리를 자동화하는 차세대 개발자 브랜딩 플랫폼입니다. Notion처럼 직관적인 드래그 앤 드롭 인터페이스로 디자인 감각 없이도 전문적인 프로필을 만들 수 있으며, 강력한 자동화 기능을 제공합니다.

개발자는 코딩에만 집중하면 프로필과 블로그가 자동으로 업데이트됩니다. AI 기능이 커밋 로그를 분석하여 블로그 글과 프로젝트 설명을 자동으로 생성해주므로 문서화 작업이 간편합니다.

## 핵심 기능

### 에디터 (Notion-like Builder)

직관적인 드래그 앤 드롭 인터페이스를 제공하는 노코드 프로필 빌더입니다.

- **그리드 시스템**: 드래그 앤 드롭으로 README 레이아웃 배치 (2단, 3단 구성)
- **실시간 미리보기**: GitHub Dark/Light 모드에서의 실시간 프리뷰
- **스마트 블록**:
  - `프로젝트 카드`: 레포지토리에서 스타 수, 언어, 설명 자동 로딩
  - `기술 스택`: 기술 아이콘 검색 및 자동 배치
  - `블로그 피드`: 최근 블로그 글 자동 표시
  - `활동 그래프`: GitHub 잔디 그래프 외 상세 활동 분석 차트

### 동기화 엔진 (GitHub Automation)

GitHub과의 원활한 통합을 위한 강력한 자동화 엔진입니다.

- **실시간 배포**: 저장 버튼 클릭 시 GitHub API를 통해 README.md 자동 업데이트
- **웹훅 리스너**:
  - 새 레포지토리 생성 시 '최근 프로젝트' 섹션에 자동 추가
  - 커밋 이벤트 발생 시 '최근 활동' 섹션 텍스트 자동 갱신
- **이미지 호스팅**: 동적으로 생성된 이미지(뱃지, 차트)를 위한 영구 URL 제공

### 통합 개발 로그 (CMS)

별도의 블로그 관리를 원하지 않는 개발자를 위한 내장 블로깅 시스템입니다.

- **마크다운 우선**: 개발자 친화적인 마크다운 에디터
- **레포지토리 백업 저장**: 발행된 게시물을 플랫폼 DB에 저장하고 GitHub `blog` 레포지토리에 `.md` 파일로 자동 푸시
- **시리즈 관리**: 게시물을 시리즈/컬렉션으로 구성 (예: "자료구조 정복하기")

## AI 기능

생산성 향상을 위한 FastAPI와 LLM 기반 AI 에이전트 통합입니다.

### Repo-to-Showcase (프로젝트 설명 생성기)

- **문제**: 레포지토리는 만들었는데 귀찮아서 README.md가 비어있음
- **해결**: AI가 코드 구조와 주요 함수를 분석하여 전문적인 프로젝트 설명 생성 (개요, 설치 방법, 기술 스택)
- **트리거**: 프로젝트 블록 추가 시 "AI로 설명 생성하기" 버튼

### Commit-to-Blog (회고 자동화)

- **문제**: 코딩은 했는데 블로그 쓸 시간이 없음
- **해결**: AI가 지난 주의 커밋 히스토리를 분석하여 주간 개발 회고록 초안 작성
- **예시**: "이번 주는 주로 Next.js 최적화 작업을 하셨네요. `Image` 컴포넌트 적용 경험을 글로 써드릴까요?"

### Smart Translator (글로벌 진출)

- **해결**: 한글로 프로필/블로그 작성 후 클릭 한 번으로 영문 버전 `README.en.md` 생성, 언어 전환 뱃지 포함

## 프로젝트 구조

```plaintext
git-deck/
├── backend/              # FastAPI 백엔드
│   ├── app/
│   │   ├── api/          # API 라우트
│   │   ├── core/         # 핵심 설정
│   │   ├── models/       # 데이터베이스 모델
│   │   ├── services/     # 비즈니스 로직
│   │   └── utils/        # 유틸리티 함수
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/             # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # React 컴포넌트
│   │   ├── lib/          # 라이브러리 및 유틸리티
│   │   ├── hooks/        # 커스텀 React 훅
│   │   └── types/        # TypeScript 타입
│   ├── public/
│   ├── package.json
│   └── .env.example
│
└── docs/                 # 문서
    └── proposal.md
```

## 기술 스택 및 아키텍처

웹 서비스를 위한 확장 가능한 아키텍처로, 향후 데스크톱 앱 확장을 고려한 설계입니다.

### 프론트엔드 (웹 & 데스크톱 뷰)

- **프레임워크**: Next.js 14+ (App Router)
- **상태 관리**: Zustand (블록 배치 상태 관리에 최적화된 경량 라이브러리)
- **UI 라이브러리**: Tailwind CSS, Shadcn/ui, dnd-kit (드래그 앤 드롭)
- **에디터**: Tiptap 또는 Milkdown (Notion 스타일 에디터)

### 백엔드 (API & AI 에이전트)

- **프레임워크**: FastAPI (Python) - AI 라이브러리(LangChain, OpenAI/Anthropic SDK)와의 뛰어난 호환성
- **데이터베이스**: PostgreSQL (Supabase 권장 - Auth, DB, Realtime 통합)
- **이미지 생성**: Satori (Python 래퍼 또는 Node.js 마이크로서비스를 통한 SVG 생성)

### 데스크톱 앱 (향후)

- **기술**: Electron 또는 Tauri
- **전략**: Next.js 프론트엔드를 그대로 패키징 (`next export`)
- **핵심 기능**: 로컬 폴더 모니터링 - 파일 저장 감지 후 프로필 업데이트 제안

## 시스템 아키텍처

```plaintext
사용자 액션
    ↓
Next.js (웹 UI)
    ↓ JSON
FastAPI (백엔드)
    ├─→ 데이터베이스 (PostgreSQL)
    ├─→ 마크다운 생성기 (JSON → Markdown)
    └─→ AI 에이전트 (LLM) [선택]
         ↓
GitHub API
    ↓
GitHub 프로필 업데이트
```

## 개발 로드맵

### Phase 1: 에디터 (웹 버전)

- **기능**: GitHub 로그인, 기본 블록(텍스트, 이미지, 헤더), 프로젝트 가져오기, README 내보내기(푸시)
- **목표**: 가치 증명 - "손코딩보다 쉬운 README 제작"

### Phase 2: AI & 자동화 (차별화)

- **기능**: AI 프로젝트 설명 생성, AI 회고록 작성, 웹훅 기반 자동 업데이트
- **목표**: 사용자를 플랫폼에 머무르게 하는 락인 효과 창출

### Phase 3: 플랫폼 (데스크톱 & 생태계)

- **기능**: 데스크톱 앱 배포 (Mac/Win), 커스텀 테마 마켓플레이스
- **목표**: Draw.io처럼 필수 개발자 유틸리티로 자리매김

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
