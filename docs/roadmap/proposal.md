# 📑 Project: DevDeck (The AI-Powered Developer Branding Platform)

## 1. 프로젝트 개요 (Overview)

- **슬로건:** "Write Once, Sync Everywhere. Your Dev Profile, Automated."
- **핵심 가치:**
    - **No-Code:** 디자인 감각 없이도 Notion처럼 블록 조립으로 프로필 완성.
    - **Auto-Sync:** 코드만 짜면 프로필과 블로그가 자동으로 업데이트.
    - **AI-Driven:** 커밋 로그를 분석해 블로그 글과 프로젝트 설명을 자동 생성.
- **플랫폼 전략:**
    - **Phase 1 (Web):** SaaS 형태. GitHub OAuth로 로그인하여 관리.
    - **Phase 2 (Desktop):** Electron/Tauri 기반 앱. 로컬 마크다운 파일 관리 + 오프라인 편집 지원 (Obsidian/Draw.io 스타일).

---

## 2. 핵심 기능 상세 (Core Features)

### A. 🎨 The Editor (Notion-like Builder)

사용자가 가장 먼저 마주하는 화면입니다.

- **Grid System:** 드래그 앤 드롭으로 README 레이아웃 배치 (2단, 3단 나누기).
- **Live Preview:** 편집하는 화면이 실제 GitHub Dark/Light 모드에서 어떻게 보일지 실시간 미리보기.
- **Smart Blocks (위젯):**
    - `Project Card`: 레포지토리 선택 시 Star 수, 언어, 설명 자동 로딩.
    - `Tech Stack`: 아이콘 검색 및 자동 배치.
    - `Blog Feed`: 최근 작성한 블로그 글 리스트 자동 노출.
    - `Activity Graph`: GitHub 잔디 외에 상세 활동 분석 차트 (Satori로 SVG 생성).

### B. 🔄 The Sync Engine (GitHub Automation)

가장 중요한 "자동화" 엔진입니다.

- **Real-time Deploy:** [Save] 버튼 클릭 시, 백엔드가 GitHub API를 통해 `README.md`를 덮어씀.
- **Webhook Listener (자동 갱신):**
    - 새로운 Repo 생성 → 프로필의 'Recent Projects' 섹션 자동 추가.
    - 특정 Repo에 커밋 발생 → 프로필의 'Latest Activity' 섹션 텍스트 갱신.
- **Image Hosting:** GitHub README는 외부 이미지를 써야 합니다. 플랫폼에서 생성된 동적 이미지(뱃지, 차트)를 위한 영구적 URL 제공.

### C. 📝 Integrated Dev-Log (CMS)

블로그를 따로 운영하기 싫은 개발자를 위한 기능입니다.

- **Markdown First:** 개발자 친화적인 마크다운 에디터 제공.
- **Repo-Backed Storage:** 글을 발행하면 플랫폼 DB에도 저장되지만, 사용자의 GitHub `blog` 레포지토리에 `.md` 파일로도 자동 푸시됨 (백업 겸용).
- **Series Management:** "자료구조 정복하기" 같은 시리즈(컬렉션) 관리 기능.

---

## 3. 🤖 AI 기능 정의 (AI Agent Integration)

FastAPI와 LLM을 활용해 차별점을 두는 부분입니다.

### ① Repo-to-Showcase (프로젝트 설명 생성기)

- **문제:** 레포는 만들었는데 `README.md` 쓰기가 귀찮아서 비어있음.
- **기능:** 레포지토리 URL만 입력하면, AI가 **코드 구조(파일 트리)와 주요 함수를 분석**하여 멋진 프로젝트 설명(개요, 설치법, 기술 스택)을 작성해줌.
- **Trigger:** 프로젝트 블록을 추가할 때 "AI로 설명 생성하기" 버튼 노출.

### ② Commit-to-Blog (회고 자동화)

- **문제:** 공부는 했는데 블로그 쓸 시간이 없음.
- **기능:** "지난 1주일간의 커밋 내역"을 AI가 분석하여 **"주간 개발 회고록" 초안**을 작성해줌.
    - *예: "이번 주는 Next.js 최적화 작업을 주로 했네요. `Image` 컴포넌트 적용 경험을 글로 써드릴까요?"*

### ③ Smart Translator (글로벌 진출)

- **기능:** 한글로 프로필/블로그를 작성하면, 클릭 한 번으로 **영어 버전 README**를 생성하여 `README.en.md`로 저장하고, 상단에 언어 전환 뱃지를 달아줌.

---

## 4. 기술 스택 및 아키텍처 (Tech Stack)

웹 서비스 후 데스크탑 확장까지 고려한 구성입니다.

### Frontend (Web & Desktop View)

- **Framework:** `Next.js 14+` (App Router)
- **State Management:** `Zustand` (블록 배치 상태 관리에 가벼움)
- **UI Lib:** `Tailwind CSS`, `Shadcn/ui` (깔끔한 디자인), `dnd-kit` (드래그 앤 드롭)
- **Editor:** `Tiptap` or `Milkdown` (Notion 스타일 에디터 구현 용이)

### Backend (API & AI Agent)

- **Framework:** `FastAPI` (Python) - **강력 추천**
    - AI 라이브러리(LangChain, OpenAI/Anthropic SDK)와의 호환성 최강.
    - 비동기 처리(GitHub API 대량 호출 시) 성능 우수.
- **Database:** `PostgreSQL` (Supabase 사용 추천 - Auth, DB, Realtime 해결)
- **Image Generation:** `Satori` (Python 래퍼나 Node.js 마이크로서비스로 구성하여 SVG 생성)

### Desktop App (Future)

- **Tech:** `Electron` 또는 `Tauri`
- **전략:** Next.js로 만든 웹 프론트엔드를 그대로 패키징(`next export`).
- **차별점:** 데스크탑 앱은 **"로컬 폴더 감시"** 기능 추가. 로컬에서 코딩하다가 저장하면 앱이 감지해서 프로필 업데이트 제안.

---

## 5. 🗺️ 시스템 흐름도 (Architecture Flow)

사용자와 시스템 간의 상호작용 흐름입니다.

1. **User Action:** 웹에서 프로필 블록 배치 및 저장.
2. **Next.js:** 변경된 데이터를 JSON 형태로 FastAPI 서버로 전송.
3. **FastAPI:**
    - 데이터를 DB에 저장.
    - **Markdown Generator:** JSON 블록을 GitHub 호환 Markdown 텍스트로 변환.
    - **AI Agent (Optional):** 내용 요약이나 번역이 필요하면 LLM 호출.
4. **GitHub API:** 변환된 Markdown을 타겟 리포지토리(`username/README.md`)에 Push.
5. **Result:** 사용자 GitHub 프로필 즉시 변경됨.

---

## 6. 개발 로드맵 (MVP Strategy)

### Phase 1: The "Editor" (웹 버전 출시)

- 기능: GitHub 로그인, 기본 블록(텍스트, 이미지, 헤더), 프로젝트 불러오기, README 내보내기(Push).
- 목표: "손코딩보다 편하게 README를 만들 수 있다"는 가치 증명.

### Phase 2: The "AI & Automation" (차별화)

- 기능: AI 프로젝트 설명 생성, AI 회고록 작성, Webhook 기반 자동 업데이트.
- 목표: 사용자가 플랫폼에 머무르게 만드는 "락인(Lock-in)" 효과.

### Phase 3: The "Platform" (데스크탑 & 생태계)

- 기능: 데스크탑 앱 배포(Mac/Win), 커스텀 테마 마켓플레이스 오픈.
- 목표: Draw.io처럼 "개발자 필수 유틸리티"로 자리매김.

---

### 💡 Daniel 님을 위한 "Kick-off" 제안

지금 바로 시작하신다면, **Next.js + FastAPI** 보일러플레이트를 세팅하고, **GitHub OAuth**를 연동해서 **"내 레포지토리 목록을 가져와서 화면에 뿌려주는 것"**부터 구현해보세요. 그게 되면 절반은 시작된 것입니다!

이 기획서가 마음에 드시나요? 추가하거나 수정하고 싶은 부분이 있다면 말씀해 주세요.
