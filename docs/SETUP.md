# 개발 환경 설정 가이드

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
