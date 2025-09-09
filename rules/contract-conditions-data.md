# 계약조건 데이터 관리 규칙

## 1. 데이터 소스 및 파일 구조

### 데이터 소스
- **프로젝트 루트**: `Contract_Clause.csv` 파일 사용
- **API 엔드포인트**: `/api/csv-data`를 통해 서버에서 직접 파일 읽기
- **캐시 방지**: public 폴더의 CSV 파일은 사용하지 않음

### 파일 구조
```
Contract_Clause.csv
├── 공종명 (예: 미장조적공사, 석공사, 방수공사)
├── 공종코드 (예: 3061, 3090, 3070)
├── 대분류 (예: 공통, 미장공사, 조적공사)
├── 중분류 (예: 현장일반, 공사사항, 안전사항, 품질사항)
├── 태그 (예: 주차/민원/인허가/공사시간, 기타, 근로자)
└── 내용 (계약조건 상세 내용)
```

## 2. 데이터 로딩 구현

### API 라우트 규칙 (`app/api/csv-data/route.ts`)
- 프로젝트 루트의 `Contract_Clause.csv` 파일 읽기
- 파일 존재 여부 확인 및 적절한 에러 응답
- 표준화된 에러 응답 형식 사용
- 5분 캐시 설정 (`Cache-Control: public, max-age=300`)

### 컴포넌트 사용 규칙
- `loadCSVData()` 함수를 통한 표준화된 에러 처리
- HTTP 상태 코드 확인 및 에러 메시지 파싱
- 네트워크 오류에 대한 재시도 로직 구현

## 3. 데이터 파싱 규칙

### 필수 라이브러리
- **papaparse**: 검증된 CSV 파싱 라이브러리 사용
- **TypeScript**: 타입 안전성을 위한 인터페이스 정의

### 데이터 검증 규칙
- **필수 필드**: 공종명, 대분류, 중분류, 내용 (빈 문자열 불가)
- **선택 필드**: 공종코드, 태그, 주요, 이미지 (빈 문자열 허용)
- **중복 제거**: 공종명 + 대분류 + 중분류 + 내용 기준으로 중복 제거
- **정렬**: 공종명 알파벳 순으로 정렬

### 파싱 함수 구현
```typescript
// ContractClause 인터페이스 정의 필수
export interface ContractClause {
  공종명: string
  공종코드: string
  대분류: string
  중분류: string
  태그: string
  내용: string
  주요: string
  이미지: string
}

// validateContractClause 함수로 데이터 검증
// parseCSVData 함수로 CSV 파싱 및 검증
```

## 4. 필터링 로직

### 단계별 필터링 순서
1. **공종 선택**: `공종명` 필드로 필터링
2. **대분류 선택**: `대분류` 필드로 필터링  
3. **중분류 선택**: `중분류` 필드로 필터링
4. **태그 선택**: `태그` 필드로 필터링
5. **내용 표시**: `내용` 필드의 체크박스 형태로 표시

### 필터링 함수 구현 규칙
- `getUniqueCategories()`: 고유 대분류 추출
- `getUniqueSubCategories()`: 고유 중분류 추출
- `getUniqueTags()`: 고유 태그 추출
- `getConditionsByTag()`: 태그별 조건 추출
- 모든 함수는 타입 안전성 보장 및 빈 값 처리

## 5. 데이터 업데이트 규칙

### CSV 파일 수정 시
1. **프로젝트 루트의 `Contract_Clause.csv`만 수정**
2. **public 폴더의 CSV 파일은 사용하지 않음**
3. **서버 재시작 없이 자동 반영** (API를 통한 실시간 로딩)
4. **캐시 무효화**: 파일 수정 시 클라이언트 캐시 자동 갱신

### 데이터 검증 규칙
- 필수 필드 누락 시 해당 데이터 제외
- 중복 데이터 자동 제거
- 데이터 정렬 및 정규화

## 6. 에러 처리 규칙

### 표준화된 에러 응답 형식
```typescript
interface StandardErrorResponse {
  error: string
  message: string
  timestamp: string
  details?: any
}
```

### 에러 타입 정의
- `FILE_NOT_FOUND`: 파일 없음
- `EMPTY_FILE`: 빈 파일
- `PARSE_ERROR`: 파싱 오류
- `VALIDATION_ERROR`: 검증 오류
- `NETWORK_ERROR`: 네트워크 오류
- `INTERNAL_SERVER_ERROR`: 서버 내부 오류

### 에러 상황별 처리
- **파일 없음**: 404 에러와 함께 파일 경로 정보 제공
- **파싱 오류**: 상세한 파싱 에러 정보와 함께 빈 배열 반환
- **네트워크 오류**: 재시도 로직과 함께 사용자 친화적 메시지 제공
- **검증 오류**: 어떤 필드에서 오류가 발생했는지 구체적으로 표시

## 7. 성능 최적화 규칙

### 서버 사이드 캐싱
- 5분 캐시 지속 시간 설정
- 캐시 히트/미스 헤더 추가
- 메모리 기반 캐시 구현

### 클라이언트 사이드 최적화
- React Query를 활용한 데이터 캐싱
- staleTime: 5분, cacheTime: 10분 설정
- 지수 백오프 재시도 로직

### 메모리 관리
- 지연 로딩: 필요한 데이터만 메모리에 로드
- 가비지 컬렉션: 사용하지 않는 필터링 결과 자동 해제
- 메모리 모니터링: 개발 환경에서 메모리 사용량 추적

## 8. 의존성 관리

### 필요한 패키지
```json
{
  "dependencies": {
    "papaparse": "^5.4.1",
    "@tanstack/react-query": "^4.35.0"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

### 설치 명령어
```bash
npm install papaparse @tanstack/react-query
npm install -D @types/papaparse
```

## 9. 마이그레이션 가이드

### 기존 코드에서 새 규칙으로 전환
1. **papaparse 설치**: `npm install papaparse @types/papaparse`
2. **기존 파싱 함수 교체**: 정규식 기반 파싱을 papaparse로 교체
3. **에러 처리 표준화**: 모든 에러 응답을 표준 형식으로 변경
4. **캐싱 로직 추가**: 서버와 클라이언트 캐싱 구현
5. **타입 정의 추가**: ContractClause 인터페이스 정의

### 호환성 확인
- 기존 CSV 파일 형식과 호환
- 기존 컴포넌트 API와 호환
- 점진적 마이그레이션 가능

## 10. 테스트 가이드

### 단위 테스트
- `parseCSVData` 함수 테스트
- 데이터 검증 함수 테스트
- 필터링 함수 테스트

### 통합 테스트
- API 엔드포인트 응답 테스트
- 파일 존재 여부 확인 테스트
- 에러 응답 형식 테스트

### 테스트 데이터
- 유효한 CSV 데이터
- 잘못된 형식의 CSV 데이터
- 빈 파일 및 누락된 필드 데이터
