# Git Deck - 개발 환경 설정 가이드

> 자세한 설정 가이드는 [GETTING_STARTED.md](GETTING_STARTED.md)를 참고하세요.

## 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/git-deck.git
cd git-deck
```

### 2. 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (DATABASE_URL, GITHUB_CLIENT_ID 등)

# 개발 환경 자동 설정 (마이그레이션 + 테스트 데이터)
python setup_dev.py

# 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 8006 --reload
```

### 3. 프론트엔드 설정

```bash
cd frontend

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 수정

# 개발 서버 실행
npm run dev
```

### 4. 테스트 계정

개발 환경 설정 후 다음 계정으로 로그인 가능:

- **Email**: `devuser1@gitdeck.dev`
- **Email**: `devuser2@gitdeck.dev` (GitHub 연결됨)
- **Email**: `devuser3@gitdeck.dev` (GitHub 연결됨)
- **Password**: `password123`

## 환경 변수 설정

### 1. 환경 변수 파일의 역할

- `.env.example`: GitHub에 커밋되는 템플릿 파일 (기본값 예시)
- `.env` 또는 `.env.local`: 개인 환경 설정 파일 (gitignore에 포함, 커밋 안 됨)

### 2. 백엔드 설정

```bash
cd backend
cp .env.example .env
```

`.env` 파일에서 필요한 값 수정:
```env
# 프론트엔드 포트를 변경한 경우 여기도 수정
FRONTEND_URL=http://localhost:3006
CORS_ORIGINS=http://localhost:3006,http://127.0.0.1:3006
```

**우선순위**: 시스템 환경 변수 > .env 파일 > config.py 기본값

### 3. 프론트엔드 설정

```bash
cd frontend
cp .env.example .env.local
```

`.env.local` 파일에서 필요한 값 수정:
```env
# 포트 번호 변경 시
PORT=3006

# 백엔드 API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 포트 변경 시 주의사항

프론트엔드 포트를 변경하면 **백엔드 CORS 설정도 함께 변경**해야 합니다:

1. 프론트엔드 `.env.local`에서 `PORT` 변경
2. 백엔드 `.env`에서 `FRONTEND_URL`과 `CORS_ORIGINS` 변경

예시:
- 프론트엔드: `PORT=3006`
- 백엔드: `CORS_ORIGINS=http://localhost:3006,http://127.0.0.1:3006`

## 데이터베이스 연결

### Supabase 연결 설정

1. Supabase 프로젝트에서 Connection String 복사
2. 비밀번호에 특수문자가 있는 경우 URL 인코딩 필요:
   - `#` → `%23`
   - `!` → `%21`
   - `@` → `%40`
3. 백엔드 `.env` 파일에 연결 문자열 설정:

```env
DATABASE_URL=postgresql://postgres:[ENCODED_PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**주의**: 비밀번호는 절대 `.env.example`이나 GitHub에 커밋하지 말 것
