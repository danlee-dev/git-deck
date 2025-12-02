# GitDeck Automation Blocks 기획서

> 작성일: 2025-12-02
>
> 목표: 시니어 개발자들의 GitHub Actions 워크플로우를 노코드 블록으로 제공

## 개요

시니어 개발자들은 GitHub를 단순한 코드 저장소가 아닌 자동화된 작업장(Workstation)으로 활용합니다. GitHub Actions를 통해 반복 작업을 자동화하고, 프로필을 동적으로 관리합니다.

GitDeck은 이러한 복잡한 YAML 워크플로우를 **클릭 가능한 블록**으로 포장하여, 주니어 개발자도 시니어처럼 GitHub를 활용할 수 있게 합니다.

**핵심 가치 제안:** "시니어처럼 일하고 싶으신가요? 이 블록을 드래그해서 프로필에 놓기만 하세요."

---

## 자동화 블록 카테고리

### 1. Information Collector (정보 수집 블록)

시니어들은 관심 있는 정보를 GitHub가 대신 모아오게 합니다.

#### 1.1 Tech News Digest

- **기능:** 매일 정해진 시간에 관심 기술 키워드의 최신 아티클 수집
- **소스:** Hacker News, Dev.to, Medium, Reddit
- **출력:** README 하단 위젯 또는 Issue로 등록
- **설정 옵션:**
  - 키워드 선택 (React, AI, LLM, Next.js 등)
  - 수집 주기 (매일/주간)
  - 최대 아티클 수
- **내부 구현:** Cron Job + RSS/API Crawler + README 자동 업데이트

#### 1.2 Algorithm Problem Tracker

- **기능:** 백준(BOJ), LeetCode, 프로그래머스 풀이 자동 동기화
- **출력:** 난이도별 폴더 구조로 자동 정리, 통계 뱃지 생성
- **설정 옵션:**
  - 플랫폼 연동 (백준 ID, LeetCode username)
  - 폴더 구조 템플릿 선택
  - 통계 뱃지 스타일
- **내부 구현:** 플랫폼별 Crawler + Git Commit Action

#### 1.3 GitHub Activity Summary

- **기능:** 주간/월간 GitHub 활동 요약 자동 생성
- **출력:** 커밋 통계, PR/Issue 활동, 기여한 레포지토리 목록
- **설정 옵션:**
  - 요약 주기 (주간/월간)
  - 포함할 메트릭 선택
  - 출력 형식 (README 섹션, Issue, Release Note)

---

### 2. Dynamic Profile (동적 프로필 블록)

실시간 데이터를 시각화해서 프로필에 표시합니다.

#### 2.1 WakaTime Integration

- **기능:** 코딩 시간 통계를 그래프로 시각화
- **표시 정보:**
  - 이번 주 총 코딩 시간
  - 언어별 사용 비율
  - 가장 활발한 코딩 시간대
  - 주로 사용하는 IDE
- **설정 옵션:**
  - 표시 기간 (주간/월간)
  - 그래프 스타일 (바 차트, 파이 차트, 타임라인)
  - 테마 (다크/라이트)

#### 2.2 Spotify Now Playing

- **기능:** 현재 듣고 있는 음악을 프로필에 실시간 표시
- **디자인 옵션:**
  - LP판 스타일
  - 미니멀 바 스타일
  - 앨범 아트 카드
- **설정 옵션:**
  - 표시 위치
  - "최근 재생" 폴백 옵션

#### 2.3 Status Indicator

- **기능:** 현재 상태를 Slack 스타일로 프로필에 표시
- **상태 옵션:**
  - 빡코딩 중
  - 휴가 중
  - 미팅 중
  - 오픈 투 워크
- **연동:** Slack, Discord, 캘린더 상태 자동 동기화

#### 2.4 Blog Latest Posts

- **기능:** 블로그 최신 글을 프로필에 자동 표시
- **지원 플랫폼:** Velog, Tistory, Medium, 개인 블로그 (RSS)
- **설정 옵션:**
  - 표시할 글 개수
  - 썸네일 포함 여부
  - 카테고리 필터

---

### 3. Content Pipeline (콘텐츠 배포 블록)

코드를 배포하듯 글과 지식을 배포합니다.

#### 3.1 TIL Auto Publisher

- **기능:** TIL 마크다운 파일을 정적 블로그로 자동 빌드/배포
- **워크플로우:**
  1. `til/2025-12-02.md` 파일 푸시
  2. 정적 사이트 빌드 (Hugo/Jekyll/Next.js)
  3. GitHub Pages 배포
  4. SNS 자동 포스팅 (선택)
- **설정 옵션:**
  - 블로그 테마 선택
  - 카테고리/태그 자동 분류
  - SNS 연동 (Twitter, LinkedIn)

#### 3.2 Resume PDF Generator

- **기능:** `resume.md` 수정 시 스타일링된 PDF 자동 생성
- **출력:** GitHub Releases 탭에 PDF 첨부
- **설정 옵션:**
  - PDF 템플릿 선택 (모던, 클래식, 미니멀)
  - 언어별 버전 (한글/영문)
  - 자동 버전 관리

#### 3.3 Weekly Retrospective

- **기능:** 주간 커밋 히스토리 기반 회고록 초안 자동 생성
- **출력 내용:**
  - 이번 주 작업 요약
  - 주요 변경 사항
  - 다음 주 예정 작업 제안
- **설정 옵션:**
  - AI 요약 스타일 (기술적/캐주얼)
  - 출력 형식 (Issue, 마크다운 파일, 블로그 포스트)

---

### 4. Code Gardener (코드 품질 관리 블록)

코드 품질을 자동으로 관리합니다.

#### 4.1 Auto Formatter

- **기능:** PR 시 코드 포맷 자동 수정
- **지원 도구:** Prettier, ESLint, Black, gofmt
- **워크플로우:**
  1. PR 생성/업데이트 감지
  2. 린터 실행
  3. 자동 수정 후 커밋
  4. 결과 코멘트
- **설정 옵션:**
  - 언어별 린터 선택
  - 규칙 프리셋 (Airbnb, Google, Standard)

#### 4.2 TODO Tracker

- **기능:** 코드 내 TODO 주석을 Issue로 자동 등록
- **감지 패턴:** `// TODO:`, `# FIXME:`, `/* HACK: */`
- **출력:** 라벨링된 Issue 생성, 기존 Issue 업데이트
- **설정 옵션:**
  - 감지할 키워드 커스텀
  - Issue 라벨 매핑
  - 담당자 자동 할당

#### 4.3 Dependency Update Bot

- **기능:** 의존성 업데이트 PR 자동 생성
- **지원:** npm, pip, cargo, go mod
- **설정 옵션:**
  - 업데이트 주기
  - 메이저/마이너/패치 필터
  - 자동 머지 조건

---

### 5. Archiver (백업/동기화 블록)

데이터를 안전하게 백업하고 동기화합니다.

#### 5.1 Notion Sync

- **기능:** Notion 페이지를 GitHub 마크다운으로 양방향 동기화
- **워크플로우:**
  - Notion -> GitHub: 노션 변경 감지 시 마크다운 변환 후 커밋
  - GitHub -> Notion: 마크다운 푸시 시 노션 페이지 업데이트
- **설정 옵션:**
  - 동기화할 Notion 데이터베이스 선택
  - 폴더 구조 매핑
  - 동기화 방향 (단방향/양방향)

#### 5.2 Image Optimizer

- **기능:** 이미지 파일 자동 최적화
- **처리:**
  - 압축 (용량 감소)
  - WebP 변환
  - 리사이즈
- **설정 옵션:**
  - 압축 품질 (1-100)
  - 최대 해상도
  - 원본 보존 여부

#### 5.3 Star History Tracker

- **기능:** 스타 히스토리 자동 추적 및 시각화
- **출력:** 스타 증가 그래프, 마일스톤 알림
- **설정 옵션:**
  - 추적할 레포지토리
  - 알림 조건 (100스타 단위 등)

---

## 기술 구현 계획

### Phase 1: 인프라 구축

- GitHub App 등록 (현재 OAuth에서 확장)
- Actions 워크플로우 템플릿 시스템 설계
- 블록 설정 UI 컴포넌트 개발

### Phase 2: 핵심 블록 개발

- Dynamic Profile 블록 (WakaTime, Spotify, Blog Posts)
- Content Pipeline 블록 (TIL Publisher, Weekly Retrospective)
- Information Collector 블록 (Tech News, Algorithm Tracker)

### Phase 3: 고급 블록 개발

- Code Gardener 블록 (Auto Formatter, TODO Tracker)
- Archiver 블록 (Notion Sync, Image Optimizer)
- 커스텀 블록 빌더

### Phase 4: 마켓플레이스

- 커뮤니티 블록 공유 시스템
- 블록 평점/리뷰
- 프리미엄 블록 구독 모델

---

## 비즈니스 모델

### 무료 티어

- 프로필 에디터 (현재 구현)
- 기본 자동화 블록 2개
- 월 50회 Actions 실행

### Pro 티어 ($5/월)

- 모든 자동화 블록
- 무제한 Actions 실행
- 우선 지원

### Team 티어 ($15/월/인)

- 팀 공유 템플릿
- 조직 프로필 관리
- 분석 대시보드

---

## 경쟁 우위

1. **노코드 접근성:** YAML 작성 없이 클릭만으로 워크플로우 생성
2. **통합 환경:** 프로필 에디터 + 자동화가 한 곳에
3. **시니어 노하우 패키징:** 검증된 워크플로우를 블록으로 제공
4. **한국 개발자 타겟:** 백준, Velog, 티스토리 등 국내 서비스 우선 지원

---

## 참고 자료

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [awesome-github-profile-readme](https://github.com/abhisheknaiidu/awesome-github-profile-readme)
- [WakaTime API](https://wakatime.com/developers)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
