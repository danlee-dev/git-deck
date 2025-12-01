# Git Deck - 시작하기

이 문서는 Git Deck을 로컬 환경에서 설정하고 실행하는 방법을 안내합니다.

## 사전 요구사항

시작하기 전에 다음 프로그램들이 설치되어 있는지 확인하세요:

- **Python 3.10+** - 백엔드 런타임
- **Node.js 18+** - 프론트엔드 런타임
- **PostgreSQL 14+** - 데이터베이스 (또는 Supabase 계정)
- **Git** - 버전 관리

## 프로젝트 개요

Git Deck은 GitHub 프로필과 블로그 관리를 자동화하는 AI 기반 개발자 브랜딩 플랫폼입니다.

```
git-deck/
├── backend/              # FastAPI 백엔드
├── frontend/             # Next.js 프론트엔드
└── docs/                 # 문서
```

## 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/git-deck.git
cd git-deck
```

### 2. 백엔드 설정

#### 단계 1: 백엔드 디렉토리로 이동

```bash
cd backend
```

#### 단계 2: 가상환경 생성

```bash
# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

#### 단계 3: 패키지 설치

```bash
pip install -r requirements.txt
```

#### 단계 4: 환경 변수 설정

```bash
# 예제 환경 변수 파일 복사
cp .env.example .env

# .env 파일을 편집기로 열어 설정 수정
# 필수 설정 항목:
# - DATABASE_URL: PostgreSQL 연결 문자열
# - GITHUB_CLIENT_ID: GitHub OAuth App Client ID
# - GITHUB_CLIENT_SECRET: GitHub OAuth App Secret
# - SECRET_KEY: JWT 서명을 위한 랜덤 시크릿 키
```

`.env` 설정 예시:

```env
PROJECT_NAME=Git Deck
API_VERSION=v1
ENVIRONMENT=development

HOST=0.0.0.0
PORT=8006

FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Supabase (Transaction Pooler - 포트 6543 사용)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# GitHub OAuth (https://github.com/settings/developers 에서 생성)
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_REDIRECT_URI=http://localhost:8006/api/v1/auth/github/callback

# 생성 방법: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-random-secret-key-here

# 선택사항: AI 기능 사용 시
OPENAI_API_KEY=your_openai_api_key
```

#### 단계 5: 데이터베이스 설정

**방법 A: 자동 설정 (개발 환경 권장)**

```bash
# 마이그레이션 실행 + 테스트 데이터 생성을 한 번에
python setup_dev.py
```

이 명령은 다음을 수행합니다:
- 모든 데이터베이스 마이그레이션 실행
- 3개의 테스트 유저 생성 (프로필 및 블록 포함)
- 테스트 계정 정보 출력

**방법 B: 수동 설정**

```bash
# 마이그레이션만 실행
alembic upgrade head

# 선택사항: 테스트 데이터 생성
python -m app.scripts.seed_data
```

#### 단계 6: 백엔드 서버 실행

```bash
# uvicorn 직접 사용
uvicorn app.main:app --host 0.0.0.0 --port 8006 --reload

# 또는 run 스크립트 사용
python run.py
```

백엔드 API 접근 주소:
- API: `http://localhost:8006`
- Swagger UI: `http://localhost:8006/docs`
- ReDoc: `http://localhost:8006/redoc`

### 3. 프론트엔드 설정

#### 단계 1: 프론트엔드 디렉토리로 이동

```bash
# 프로젝트 루트에서
cd frontend
```

#### 단계 2: 패키지 설치

```bash
npm install
```

#### 단계 3: 환경 변수 설정

```bash
# 예제 환경 변수 파일 복사
cp .env.example .env.local

# .env.local 파일 편집
```

`.env.local` 설정 예시:

```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8006
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

#### 단계 4: 프론트엔드 서버 실행

```bash
npm run dev
```

프론트엔드 접근 주소: `http://localhost:3000`

## 테스트 계정

개발 환경 설정 후 다음 테스트 계정으로 로그인할 수 있습니다:

| 이메일 | 비밀번호 | GitHub 연결 |
|-------|---------|------------|
| devuser1@gitdeck.dev | password123 | 아니오 |
| devuser2@gitdeck.dev | password123 | 예 |
| devuser3@gitdeck.dev | password123 | 예 |

## GitHub OAuth 설정

GitHub 인증을 활성화하려면:

1. https://github.com/settings/developers 접속
2. "New OAuth App" 클릭
3. 정보 입력:
   - Application name: `Git Deck (Dev)`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:8006/api/v1/auth/github/callback`
4. "Register application" 클릭
5. Client ID 복사 및 Client Secret 생성
6. 백엔드 `.env` 파일에 추가

## 데이터베이스 스키마

PostgreSQL을 사용하며 주요 테이블은 다음과 같습니다:

- **users** - 사용자 계정 (이메일/비밀번호 또는 GitHub OAuth)
- **profiles** - 사용자 프로필 (커스터마이징 가능한 블록 포함)
- **blocks** - 프로필 구성요소 (header, skills, stats 등)
- **blog_posts** - 마크다운 형식의 블로그 포스트
- **series** - 블로그 포스트 시리즈/컬렉션
- **github_repositories** - 동기화된 GitHub 저장소
- **sync_history** - 동기화 작업 로그
- **webhooks** - 아웃고잉 웹훅 설정

자세한 스키마는 [erd.dbml](diagrams/erd.dbml)을 참고하세요.

## API 엔드포인트

### 인증
- `POST /api/v1/auth/register` - 이메일/비밀번호로 회원가입
- `POST /api/v1/auth/login` - 이메일/비밀번호로 로그인
- `GET /api/v1/auth/github/login` - GitHub OAuth 로그인
- `POST /api/v1/auth/connect-github` - 기존 계정에 GitHub 연결
- `GET /api/v1/auth/me` - 현재 사용자 정보 조회
- `DELETE /api/v1/auth/account` - 계정 삭제 (7일간 보관)
- `POST /api/v1/auth/account/restore` - 삭제된 계정 복구

### 사용자
- `GET /api/v1/users` - 사용자 목록 조회
- `GET /api/v1/users/{user_id}` - 사용자 상세 정보
- `PUT /api/v1/users/{user_id}` - 사용자 정보 수정
- `DELETE /api/v1/users/{user_id}` - 사용자 삭제

### 프로필
- `GET /api/v1/profiles` - 프로필 목록 조회
- `POST /api/v1/profiles` - 프로필 생성
- `GET /api/v1/profiles/{profile_id}` - 프로필 조회
- `PUT /api/v1/profiles/{profile_id}` - 프로필 수정
- `DELETE /api/v1/profiles/{profile_id}` - 프로필 삭제
- `POST /api/v1/profiles/{profile_id}/sync-to-readme` - GitHub README로 동기화 (GitHub 연결 필요)

### 블록
- `GET /api/v1/blocks` - 블록 목록 조회
- `POST /api/v1/blocks` - 블록 생성
- `PUT /api/v1/blocks/{block_id}` - 블록 수정
- `DELETE /api/v1/blocks/{block_id}` - 블록 삭제

### 블로그
- `GET /api/v1/posts` - 블로그 포스트 목록
- `POST /api/v1/posts` - 포스트 작성
- `GET /api/v1/posts/{post_id}` - 포스트 조회
- `PUT /api/v1/posts/{post_id}` - 포스트 수정
- `DELETE /api/v1/posts/{post_id}` - 포스트 삭제
- `GET /api/v1/series` - 시리즈 목록
- `POST /api/v1/series` - 시리즈 생성

### GitHub 연동 (GitHub 연결 필요)
- `POST /api/v1/github/sync/repositories` - GitHub에서 저장소 동기화
- `GET /api/v1/github/repositories` - 동기화된 저장소 목록
- `GET /api/v1/github/readme/{owner}/{repo}` - README 내용 조회
- `GET /api/v1/github/sync/history` - 동기화 이력 조회

## 인증 흐름

### 이메일/비밀번호 인증

1. **회원가입**: `POST /api/v1/auth/register`
   ```json
   {
     "username": "johndoe",
     "email": "john@example.com",
     "password": "securepassword123"
   }
   ```

2. **로그인**: `POST /api/v1/auth/login`
   ```json
   {
     "email": "john@example.com",
     "password": "securepassword123"
   }
   ```

3. **응답**: JWT 토큰 수신
   ```json
   {
     "access_token": "eyJ0eXAi...",
     "token_type": "bearer",
     "user_id": "uuid",
     "username": "johndoe",
     "is_github_connected": false
   }
   ```

4. **토큰 사용**: Authorization 헤더에 포함
   ```
   Authorization: Bearer eyJ0eXAi...
   ```

### GitHub 인증

1. 사용자는 먼저 이메일로 회원가입/로그인
2. 이후 `POST /api/v1/auth/connect-github`로 GitHub 계정 연결
3. GitHub 연결이 필요한 기능:
   - 저장소 동기화
   - README 동기화
   - GitHub API 기능

## 개발 스크립트

### 백엔드 스크립트

```bash
# 개발 환경 자동 설정 (마이그레이션 + 테스트 데이터)
python setup_dev.py

# 마이그레이션만 실행
alembic upgrade head

# 새 마이그레이션 생성
alembic revision -m "설명"

# 테스트 데이터 생성
python -m app.scripts.seed_data

# 7일 이상 지난 삭제 계정 정리
python -m app.scripts.cleanup_deleted_accounts
```

### 프론트엔드 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린터 실행
npm run lint
```

## 프로덕션 배포

### 백엔드

1. 환경 변수 설정:
   ```env
   ENVIRONMENT=production
   SECRET_KEY=your-strong-random-key
   DATABASE_URL=your-production-database-url
   FRONTEND_URL=https://your-domain.com
   ```

2. 마이그레이션 실행:
   ```bash
   alembic upgrade head
   ```

3. 서버 실행:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8006
   ```

4. (선택) 계정 정리 크론잡 설정:
   ```bash
   # 매일 자정에 실행
   0 0 * * * cd /path/to/backend && python -m app.scripts.cleanup_deleted_accounts
   ```

### 프론트엔드

1. 애플리케이션 빌드:
   ```bash
   npm run build
   ```

2. 프로덕션 서버 실행:
   ```bash
   npm start
   ```

## 문제 해결

### 데이터베이스 연결 오류

**문제**: `could not connect to server`

**해결방법**:
- DATABASE_URL이 올바른지 확인
- Supabase 사용 시 Transaction Pooler(포트 6543) 사용, Session Pooler 아님
- 데이터베이스 방화벽 규칙에서 IP가 허용되었는지 확인

### 마이그레이션 오류

**문제**: `column "access_token" does not exist`

**해결방법**:
- 데이터베이스를 삭제하고 재생성
- 마이그레이션을 처음부터 실행: `alembic upgrade head`

### Import 오류

**문제**: `ModuleNotFoundError: No module named 'app'`

**해결방법**:
- backend 디렉토리에 있는지 확인
- 가상환경 활성화: `source venv/bin/activate`
- 패키지 재설치: `pip install -r requirements.txt`

### GitHub OAuth 작동 안 함

**문제**: 인증 리다이렉트 실패

**해결방법**:
- GitHub OAuth App 콜백 URL이 백엔드 URL과 일치하는지 확인
- .env의 GITHUB_CLIENT_ID와 GITHUB_CLIENT_SECRET 확인
- GITHUB_REDIRECT_URI가 올바른지 확인

## 추가 자료

- [데이터베이스 ERD](diagrams/erd.dbml) - 데이터베이스 스키마 다이어그램
- [설정 가이드](SETUP.md) - 상세 설정 가이드
- [API 문서](http://localhost:8000/docs) - 대화형 API 문서 (백엔드 실행 중일 때)

## 지원

문제 또는 질문이 있으신 경우:
- GitHub Issues: https://github.com/your-username/git-deck/issues
- 이메일: contact@gitdeck.dev

## 라이선스

MIT License - 자세한 내용은 LICENSE 파일 참고
