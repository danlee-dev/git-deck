# 다이어그램 관리

## 파일 구조

### 시스템 아키텍처
- `architecture.drawio`: Draw.io 원본 파일
- `architecture.png`: 내보낸 이미지 (README 등에서 사용)

### ERD (Entity Relationship Diagram)
- `erd.dbml`: dbdiagram.io 원본 파일
- `erd.png`: 내보낸 이미지 (문서에서 사용)

## 작업 방법

### Draw.io 아키텍처
1. [draw.io](https://app.diagrams.net/) 또는 VS Code Draw.io 확장에서 작업
2. `architecture.drawio` 파일 수정
3. File → Export as → PNG로 `architecture.png` 내보내기

### dbdiagram ERD
1. [dbdiagram.io](https://dbdiagram.io/) 에서 작업
2. Export → DBML로 `erd.dbml` 저장
3. Export → PNG로 `erd.png` 저장

## 버전 관리

- **원본 파일** (.drawio, .dbml): 반드시 Git에 커밋
- **이미지 파일** (.png): Git에 커밋 (문서에서 참조)
