# GitDeck Implementation Roadmap

> Date: 2025-12-02
>
> Status: Phase 1 Core Editor 대부분 완료, Phase 2 진입 준비

## Current Implementation Status

### Completed Features

1. **Authentication System**
   - GitHub OAuth 2.0 (user, repo, read:org scopes)
   - Email/password registration and login
   - JWT token-based session management
   - Account deletion with 7-day grace period

2. **Profile Editor**
   - CodeMirror 6 markdown editor with syntax highlighting
   - Real-time preview using GitHub Markdown API
   - Click-to-source navigation (preview -> editor)
   - Smart list continuation (numbered, bulleted, checkbox)
   - Blockquote auto-continuation
   - Dark/light theme support

3. **Quick Insert Panel**
   - 6 Stats widgets (Capsule Render, GitHub Stats, Streak, Activity Graph, Top Languages, Profile Views)
   - 5 Section templates (About Me, Tech Stack, Projects, Awards, Contact)
   - 140+ technology badges with search
   - Repository selector with search

4. **GitHub Integration**
   - README load from `{username}/{username}` repository
   - README save with SHA-based conflict detection
   - Conflict resolution modal
   - Repository metadata sync (stars, forks, language, topics)

5. **State Management**
   - Zustand stores (auth, theme, profileEditor)
   - localStorage persistence for editor content
   - Session continuity across page reloads

---

## Pending Implementation Tasks

### High Priority (Phase 1 Completion)

#### 1. Badge Position Mapping Issue

**Problem**: 뱃지 요소(`![badge](url)`)가 프리뷰-에디터 간 정확한 위치 매핑이 되지 않는 문제

**Current State**:
- 헤딩, 일반 텍스트 패러그래프는 정상 매핑
- `<picture>`, `<img>` 태그 포함 HTML 블록 감지 로직 추가됨
- 일부 뱃지 패턴 (`![Python](...)`) 매핑 개선됨

**Remaining Issues**:
- 연속된 뱃지 그룹에서 순차 매핑 오류
- Raw HTML 뱃지 (`<sub><picture>...</picture></sub>`)와 마크다운 뱃지 혼합 시 매핑 불일치
- 빈 텍스트 콘텐츠 블록 매핑 fallback 개선 필요

**Solution Approach**:
- `markdownPositionMapper.ts`에서 이미지 전용 블록과 텍스트 블록 분리 로직 강화
- HTML 렌더링 결과에서 이미지 포함 여부 판별 정확도 개선
- 순차 매핑 대신 콘텐츠 기반 유사도 매칭 우선 적용

#### 2. Element Alignment Options

**Requirement**: Quick Insert에서 요소 추가 전 정렬 기준 선택 기능

**Specification**:
- 정렬 옵션: Left (default), Center, Right
- 적용 대상: Stats widgets, Badges, Images
- 마크다운 출력:
  - Left: `![image](url)` (기본)
  - Center: `<div align="center">![image](url)</div>`
  - Right: `<div align="right">![image](url)</div>`

**Implementation Plan**:
1. `SnippetCard.tsx`에 정렬 선택 드롭다운 추가
2. `snippetData.ts`의 스니펫 템플릿에 `{align}` 플레이스홀더 추가
3. 삽입 시 선택된 정렬 옵션에 따라 래핑 HTML 생성

---

### Medium Priority (Phase 2)

#### 3. Section Content Pre-fill

**Requirement**: 섹션 템플릿 삽입 전 내용 미리 작성 기능

**Specification**:
- About Me, Tech Stack, Projects, Awards, Contact 섹션에 적용
- 모달 또는 인라인 폼으로 필드 입력
- 예: About Me
  - Current role/job
  - Learning interests
  - Collaboration topics
  - Contact email
  - Fun facts

**Implementation Plan**:
1. `SectionFormModal.tsx` 컴포넌트 생성
2. 각 섹션별 폼 스키마 정의 (`sectionFormSchemas.ts`)
3. 입력값을 마크다운 템플릿에 바인딩하여 삽입

#### 4. Repository-linked Project Section

**Requirement**: Projects 섹션에서 레포지토리 선택 시 자동 카드 생성

**Current State**:
- `RepoSelector.tsx` 모달로 레포지토리 검색/선택 가능
- 현재는 단순 링크 또는 뱃지만 삽입

**Enhancement**:
- 선택한 레포지토리의 메타데이터 활용
  - name, description, language, stars, forks
- 프로젝트 카드 마크다운 자동 생성
  ```markdown
  ### [Project Name](repo_url)

  Description from repository

  ![Language](badge) ![Stars](badge) ![Forks](badge)
  ```

**Implementation Plan**:
1. `RepoSelector.tsx`에 "Insert as Card" 옵션 추가
2. 카드 템플릿 정의 (`projectCardTemplate.ts`)
3. 선택된 레포 데이터로 템플릿 채우기

#### 5. AI Content Generation

**Requirement**: AI를 활용한 콘텐츠 자동 생성

**Features**:
- About Me 섹션 자동 작성 (GitHub 활동 기반)
- Project 설명 자동 생성 (레포지토리 분석)
- Tech Stack 자동 감지 (레포지토리 언어/프레임워크 분석)

**Implementation Plan**:
1. Backend에 `/api/v1/ai/generate-content` 엔드포인트 추가
2. OpenAI API 또는 Claude API 연동
3. 프롬프트 템플릿 정의 (`ai_prompts/`)
4. Frontend에 "Generate with AI" 버튼 추가

#### 6. More Design Elements

**Requirement**: 다양한 디자인 요소 지원

**Proposed Elements**:
- Dividers (horizontal rules with styles)
- Callout boxes (tip, warning, note)
- Collapsible sections (`<details><summary>`)
- Animated SVGs (typing effect, wave)
- Social links row (formatted icons)
- Quote blocks (styled)

**Implementation Plan**:
1. `snippetData.ts`에 Design 카테고리 추가
2. 각 요소별 마크다운/HTML 템플릿 정의
3. 프리뷰 스타일링 (`globals.css`) 추가

---

### Low Priority (Phase 3)

#### 7. GitHub Actions Integration

**Requirement**: GitHub Actions를 통한 자동 프로필 업데이트

**Use Cases**:
- 매일/매주 자동으로 최신 activity 반영
- 새 레포지토리 생성 시 Featured Projects 자동 업데이트
- 커밋 통계 자동 갱신

**Implementation Plan**:
1. GitHub Actions workflow 템플릿 생성
2. GitDeck API 호출을 위한 서비스 토큰 발급 시스템
3. 사용자 설정에서 자동화 on/off 토글

#### 8. Featured Projects Auto-Update

**Requirement**: 사용자 정의 기준으로 Featured Projects 자동 선정

**Criteria Options**:
- Most starred
- Most recent activity
- Specific topics/languages
- Pinned repositories

**Implementation Plan**:
1. 사용자별 Featured Projects 규칙 설정 UI
2. 규칙 기반 레포지토리 필터링 로직
3. GitHub Actions 또는 Webhook으로 트리거

#### 9. Blog Integration

**Requirement**: 블로그 플랫폼과 연동하여 프로필에 최신 글 표시

**Integration Targets**:
- GitHub repository (markdown files)
- Dev.to API
- Medium RSS
- Velog

**Features**:
- 최신 N개 글 자동 표시
- 글 제목, 날짜, 썸네일
- 조회수/좋아요 표시 (지원 시)

**Implementation Plan**:
1. 블로그 소스 설정 UI (URL/API key 입력)
2. 블로그 데이터 fetching 서비스 (`blog_service.py`)
3. 블로그 피드 위젯 마크다운 생성

#### 10. AI Feature Expansion

**Requirement**: AI 기능 확장

**Proposed Features**:
- **Profile Analyzer**: 현재 프로필 분석 및 개선 제안
- **Commit-to-Blog**: 주간 커밋 요약 블로그 글 초안 생성
- **Smart Translator**: 프로필 다국어 버전 자동 생성
- **Style Suggester**: 디자인 스타일 추천

#### 11. Junior Developer Onboarding

**Requirement**: 시니어 개발자 GitHub 활용법을 초보자에게 쉽게 제공

**Features**:
- GitHub 프로필 Best Practices 가이드
- 템플릿 마켓플레이스 (인기 개발자 프로필 참조)
- GitHub Actions 튜토리얼 (자동화 설정 가이드)
- SEO 최적화 팁 (프로필 검색 노출)

---

## Technical Debt

### Known Issues

1. **Position Mapping Accuracy**
   - 복잡한 HTML 블록 매핑 정확도 개선 필요
   - 중첩 태그 처리 로직 강화

2. **Editor Performance**
   - 대용량 마크다운 파일 렌더링 지연
   - Debounce 타이밍 최적화 필요

3. **Mobile Responsiveness**
   - 3단 레이아웃 모바일 대응
   - Quick Insert 패널 모바일 UI

### Refactoring Needs

1. **API Error Handling**
   - 통합 에러 핸들링 미들웨어
   - 사용자 친화적 에러 메시지

2. **Type Safety**
   - API 응답 타입 정의 완성
   - Zod 스키마 validation 추가

3. **Test Coverage**
   - Unit tests for markdown parser
   - Integration tests for GitHub sync
   - E2E tests for editor flow

---

## Next Steps

### Immediate (This Week)

1. Badge position mapping 디버깅 및 수정
2. Element alignment option UI 구현
3. Section pre-fill modal 프로토타입

### Short-term (This Month)

1. Repository-linked project cards
2. AI content generation MVP
3. Additional design elements

### Mid-term (Q1 2025)

1. GitHub Actions integration
2. Blog platform integration
3. Mobile responsive design

---

## References

- [Architecture Overview](./architecture-overview.md)
- [Setup Guide](./setup.md)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
