# 마이그레이션 가이드

## v1.0 → v2.0 변경사항

### 주요 변경사항
1. **필드명 변경**: `주요` → `중요표기`
2. **이미지 업로드 기능 추가**: 각 계약조건에 이미지 첨부 가능
3. **새로고침 기능 추가**: 데이터 수동 새로고침 버튼
4. **충돌 방지**: 별도 네임스페이스로 격리

### 코드 변경사항

#### 타입 정의
```typescript
// v1.0
interface ContractClause {
  주요: string
}

// v2.0
interface ContractClause {
  중요표기: string
  uploadedImages?: UploadedImage[]
}

interface UploadedImage {
  id: string
  file: File
  preview: string
  description?: string
}
```

#### 컴포넌트 사용법
```typescript
// v1.0
import { ContractConditionSelector } from './components/contract-condition-selector'

// v2.0
import { ContractConditionSelector } from 'contract-condition-system'
```

### 마이그레이션 단계

1. **기존 코드 백업**
   ```bash
   cp -r your-project your-project-backup
   ```

2. **새 패키지 설치**
   ```bash
   npm install contract-condition-system-v2
   ```

3. **import 경로 수정**
   ```typescript
   // 기존
   import { ContractClause } from './lib/contract-data'
   
   // 변경
   import { ContractClause } from 'contract-condition-system'
   ```

4. **필드명 수정**
   ```typescript
   // 기존
   if (clause.주요 === '주요') { ... }
   
   // 변경
   if (clause.중요표기 === '중요') { ... }
   ```

5. **테스트 실행**
   ```bash
   npm run dev
   ```

### 호환성 확인

- ✅ 기존 CSV 파일 형식 호환
- ✅ 기존 컴포넌트 API 호환
- ✅ 점진적 마이그레이션 가능
- ⚠️ 필드명 변경으로 인한 코드 수정 필요
