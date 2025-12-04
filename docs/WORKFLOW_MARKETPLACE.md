# Workflow Builder and Marketplace Implementation

이 문서는 GitDeck의 GitHub Actions 시각적 워크플로우 빌더와 마켓플레이스 기능의 구현 방법을 설명합니다.

## 목차

1. [아키텍처 개요](#아키텍처-개요)
2. [워크플로우 빌더](#워크플로우-빌더)
3. [마켓플레이스](#마켓플레이스)
4. [데이터 모델](#데이터-모델)
5. [API 엔드포인트](#api-엔드포인트)

---

## 아키텍처 개요

### 기술 스택
- **프론트엔드**: Next.js 14 (App Router), React, TypeScript
- **상태 관리**: Zustand (persist middleware로 로컬 스토리지 지원)
- **백엔드**: FastAPI (Python)
- **데이터베이스**: PostgreSQL

### 파일 구조

```
frontend/src/
├── app/(dashboard)/
│   ├── workflows/
│   │   ├── page.tsx          # 워크플로우 목록 페이지
│   │   └── [id]/page.tsx     # 워크플로우 에디터 페이지
│   └── marketplace/
│       └── page.tsx          # 마켓플레이스 페이지
├── components/workflow-builder/
│   ├── WorkflowCanvas.tsx    # 메인 캔버스 (드래그 앤 드롭)
│   ├── WorkflowNode.tsx      # 개별 블록 노드
│   ├── NodePalette.tsx       # 블록 팔레트 (사이드바)
│   ├── PropertiesPanel.tsx   # 블록 속성 패널
│   └── AnimatedEdge.tsx      # 연결선 애니메이션
├── data/
│   └── marketplaceTemplates.ts  # 마켓플레이스 템플릿 데이터
├── store/
│   └── workflowStore.ts      # Zustand 상태 관리
└── types/
    └── workflow.ts           # TypeScript 타입 정의

backend/app/
├── api/v1/endpoints/
│   └── workflows.py          # 워크플로우 API 엔드포인트
├── models/
│   └── models.py             # SQLAlchemy 모델 (Workflow)
└── schemas/
    └── workflow.py           # Pydantic 스키마
```

---

## 워크플로우 빌더

### 핵심 개념

#### 1. 블록 정의 (Block Definition)
블록은 GitHub Actions의 개별 단계를 시각적으로 표현합니다.

```typescript
interface BlockDefinition {
  type: string;           // 고유 식별자 (예: 'trigger-push')
  category: BlockCategory; // trigger, job, action, control, integration, utility
  name: string;           // 표시 이름
  description: string;    // 설명
  icon: string;           // Lucide 아이콘 이름
  color: string;          // 블록 색상
  inputs: Port[];         // 입력 포트
  outputs: Port[];        // 출력 포트
  configFields: ConfigField[]; // 설정 필드
  defaultConfig: Record<string, unknown>; // 기본 설정값
}
```

#### 2. 블록 카테고리
- **trigger**: 워크플로우 시작 이벤트 (push, pull_request, schedule 등)
- **job**: 작업 단계 (checkout, setup-node, build, test 등)
- **action**: GitHub Actions (create-release, comment-pr 등)
- **control**: 제어 흐름 (condition, matrix, parallel 등)
- **integration**: 외부 서비스 연동 (vercel, docker, slack 등)
- **utility**: 유틸리티 (cache, artifact 등)

#### 3. 블록 인스턴스
캔버스에 배치된 실제 블록입니다.

```typescript
interface BlockInstance {
  id: string;
  type: string;           // BlockDefinition.type 참조
  position: { x: number; y: number };
  config: Record<string, unknown>;
  label?: string;
}
```

#### 4. 연결 (Connection)
블록 간의 실행 흐름을 나타냅니다.

```typescript
interface Connection {
  id: string;
  sourceBlockId: string;
  sourcePortId: string;
  targetBlockId: string;
  targetPortId: string;
  animated?: boolean;
}
```

### 캔버스 구현 (WorkflowCanvas.tsx)

#### 드래그 앤 드롭
- 팔레트에서 블록을 캔버스로 드래그하여 추가
- 캔버스 내에서 블록 위치 이동
- 블록 간 연결선 드래그로 연결 생성

#### 줌/팬 기능
- 마우스 휠로 줌 인/아웃 (0.25x ~ 2x)
- 캔버스 드래그로 뷰포트 이동
- 리셋 버튼으로 기본 뷰 복원

#### 블록 포트 연결
1. 출력 포트에서 마우스 다운
2. 드래그하여 연결선 미리보기
3. 입력 포트에서 마우스 업하여 연결 완성
4. 연결 유효성 검사 (같은 블록 연결 방지, 중복 연결 방지)

### YAML 생성

워크플로우 블록들을 GitHub Actions YAML로 변환합니다.

```typescript
generateYAML: () => {
  // 1. 트리거 블록에서 'on:' 섹션 생성
  // 2. 작업 블록들을 위상 정렬 (topological sort)
  // 3. 각 블록을 해당 YAML 문법으로 변환
  // 4. 완성된 YAML 문자열 반환
}
```

위상 정렬 알고리즘 (Kahn's Algorithm)을 사용하여 블록 실행 순서를 결정합니다.

### 상태 관리 (workflowStore.ts)

Zustand를 사용한 전역 상태 관리:

```typescript
interface WorkflowState {
  // 현재 워크플로우
  currentWorkflow: Workflow | null;
  workflows: Workflow[];

  // 선택 상태
  selectedBlockId: string | null;
  selectedConnectionId: string | null;

  // UI 상태
  zoom: number;
  panOffset: { x: number; y: number };
  isConnecting: boolean;

  // API 상태
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // 액션들
  addBlock: (type, position) => BlockInstance;
  removeBlock: (blockId) => void;
  addConnection: (...) => Connection | null;
  generateYAML: () => string;
  validateWorkflow: () => { valid: boolean; errors: string[] };
  // ... 기타 액션들
}
```

---

## 마켓플레이스

### 템플릿 구조

```typescript
interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  longDescription: string;    // 상세 설명
  category: string;           // 자동화, CI/CD, 모니터링 등
  icon: React.ElementType;    // Lucide 아이콘
  blocks: BlockInstance[];    // 블록 구성
  connections: Connection[];  // 블록 연결
  popularity: number;         // 인기도 점수
  tags: string[];            // 검색 태그
  configGuide: string;       // 설정 가이드
  requiredSecrets: string[]; // 필요한 시크릿
}
```

### 제공 템플릿

1. **Node.js CI**: 기본 Node.js 빌드/테스트 파이프라인
2. **Python CI**: Python 프로젝트 테스트 파이프라인
3. **Docker Build & Push**: Docker 이미지 빌드 및 푸시
4. **Vercel Deploy**: Vercel 자동 배포
5. **Release Automation**: 자동 릴리스 생성
6. **Slack Notifications**: Slack 알림 통합
7. **Dependency Updates**: 의존성 자동 업데이트 확인
8. **Security Scan**: 보안 취약점 스캔
9. **Code Quality**: ESLint/Prettier 코드 품질 검사
10. **Auto Merge Dependabot**: Dependabot PR 자동 병합

### 템플릿 가져오기

1. 사용자가 템플릿 선택
2. 템플릿의 blocks와 connections 복사
3. 새 워크플로우 생성
4. 워크플로우 에디터로 이동

```typescript
const handleImport = async (template: MarketplaceTemplate) => {
  const workflow = await createWorkflow(template.name, template.description);
  // 블록과 연결 복사 로직
  router.push(`/workflows/${workflow.id}`);
};
```

---

## 데이터 모델

### 백엔드 (SQLAlchemy)

```python
class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    blocks = Column(JSON, default=list)       # BlockInstance[]
    connections = Column(JSON, default=list)  # Connection[]
    yaml_content = Column(Text)               # 생성된 YAML
    is_deployed = Column(Boolean, default=False)
    repository_id = Column(String)            # 연결된 GitHub 저장소
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Pydantic 스키마

```python
class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    blocks: List[dict] = []
    connections: List[dict] = []

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    blocks: Optional[List[dict]] = None
    connections: Optional[List[dict]] = None
```

---

## API 엔드포인트

### 워크플로우 CRUD

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/v1/workflows` | 사용자의 모든 워크플로우 조회 |
| POST | `/api/v1/workflows` | 새 워크플로우 생성 |
| GET | `/api/v1/workflows/{id}` | 특정 워크플로우 조회 |
| PUT | `/api/v1/workflows/{id}` | 워크플로우 수정 |
| DELETE | `/api/v1/workflows/{id}` | 워크플로우 삭제 |

### 프론트엔드 API 클라이언트

```typescript
// lib/api.ts
export const workflowAPI = {
  list: () => api.get('/workflows'),
  get: (id: string) => api.get(`/workflows/${id}`),
  create: (data: WorkflowCreate) => api.post('/workflows', data),
  update: (id: string, data: WorkflowUpdate) => api.put(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
};
```

---

## 향후 개선 사항

1. **실시간 협업**: WebSocket을 통한 다중 사용자 동시 편집
2. **버전 관리**: 워크플로우 변경 이력 추적
3. **GitHub 저장소 배포**: 생성된 YAML을 직접 저장소에 커밋
4. **실행 테스트**: 워크플로우 시뮬레이션 및 디버깅
5. **커스텀 블록**: 사용자 정의 블록 생성 기능
6. **템플릿 공유**: 사용자 간 템플릿 공유 마켓플레이스
