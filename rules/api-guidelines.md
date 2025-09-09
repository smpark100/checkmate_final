# API 개발 가이드라인

## 1. API 엔드포인트 설계 원칙

### RESTful API 설계
- **명사 사용**: 동사 대신 명사로 리소스 표현
- **HTTP 메서드 활용**: GET, POST, PUT, DELETE 적절히 사용
- **계층적 구조**: `/api/{resource}/{action}` 형태로 구성

### 엔드포인트 명명 규칙
```
/api/csv-data          # CSV 데이터 조회
/api/health            # 헬스 체크
/api/site-presets      # 사이트 프리셋 조회
/api/miso/workflow     # MISO 워크플로우 관련
```

## 2. 응답 형식 표준화

### 성공 응답
```typescript
// 단일 데이터
{
  data: T,
  message?: string,
  timestamp: string
}

// 목록 데이터
{
  data: T[],
  total: number,
  page?: number,
  limit?: number,
  message?: string,
  timestamp: string
}
```

### 에러 응답
```typescript
interface ErrorResponse {
  error: string
  message: string
  timestamp: string
  details?: any
  code?: number
}
```

### HTTP 상태 코드 사용
- **200**: 성공
- **400**: 잘못된 요청
- **404**: 리소스 없음
- **500**: 서버 내부 오류

## 3. 에러 처리 표준

### 에러 타입 정의
```typescript
type ErrorType = 
  | 'FILE_NOT_FOUND'
  | 'EMPTY_FILE'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
```

### 에러 응답 생성 함수
```typescript
function createErrorResponse(
  error: ErrorType,
  message: string,
  status: number,
  details?: any
): Response {
  const errorResponse: ErrorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
    details,
    code: status
  }
  
  return NextResponse.json(errorResponse, { status })
}
```

## 4. 파일 처리 규칙

### CSV 파일 처리
- **경로**: `process.cwd()` 기준 상대 경로 사용
- **인코딩**: UTF-8 고정
- **캐싱**: 5분 캐시 설정
- **검증**: 파일 존재 여부 및 내용 검증

### 파일 업로드 처리
- **크기 제한**: 10MB 이하
- **파일 타입**: CSV, Excel 파일만 허용
- **보안**: 파일명 검증 및 경로 조작 방지

## 5. 캐싱 전략

### 서버 사이드 캐싱
```typescript
const CACHE_DURATION = 5 * 60 * 1000 // 5분
let cache: { data: any; timestamp: number } | null = null

// 캐시 확인 및 반환
if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
  return new NextResponse(cache.data, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'X-Cache': 'HIT'
    }
  })
}
```

### 클라이언트 사이드 캐싱
- **React Query**: 서버 상태 관리
- **staleTime**: 5분 (데이터가 fresh한 시간)
- **cacheTime**: 10분 (캐시 유지 시간)
- **재시도**: 지수 백오프 방식

## 6. 보안 규칙

### 입력 검증
- **타입 검증**: TypeScript 타입 가드 사용
- **길이 제한**: 문자열 길이 제한
- **특수 문자**: SQL 인젝션 방지
- **파일 확장자**: 허용된 확장자만 처리

### CORS 설정
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

### 환경 변수 관리
- **민감한 정보**: 환경 변수로 관리
- **기본값 설정**: 개발 환경용 기본값 제공
- **검증**: 필수 환경 변수 존재 여부 확인

## 7. 로깅 규칙

### 구조화된 로깅
```typescript
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data)
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error)
  }
}
```

### 로그 레벨
- **INFO**: 일반적인 정보 (요청 처리, 데이터 로딩)
- **WARN**: 경고 상황 (파싱 경고, 캐시 미스)
- **ERROR**: 오류 상황 (파일 없음, 파싱 실패)

## 8. 성능 모니터링

### 응답 시간 측정
```typescript
const startTime = Date.now()
// ... 처리 로직 ...
const duration = Date.now() - startTime
logger.info(`API 처리 시간: ${duration}ms`)
```

### 메모리 사용량 모니터링
- **개발 환경**: 메모리 사용량 로깅
- **프로덕션**: 메모리 누수 방지
- **가비지 컬렉션**: 불필요한 데이터 정리

## 9. 테스트 규칙

### 단위 테스트
- **API 핸들러**: 각 엔드포인트별 테스트
- **에러 케이스**: 다양한 에러 상황 테스트
- **경계값**: 최대/최소 값 테스트

### 통합 테스트
- **엔드투엔드**: 전체 API 플로우 테스트
- **데이터베이스**: 실제 데이터와의 연동 테스트
- **외부 의존성**: 외부 API 호출 테스트

### 테스트 데이터
- **Mock 데이터**: 테스트용 가짜 데이터
- **실제 데이터**: 프로덕션과 유사한 데이터
- **에러 데이터**: 오류 상황을 위한 잘못된 데이터

## 10. 문서화 규칙

### API 문서
- **Swagger/OpenAPI**: 자동 생성 문서
- **예시**: 요청/응답 예시 포함
- **에러 코드**: 각 에러 상황별 설명

### 코드 문서
- **JSDoc**: 함수별 상세 설명
- **타입 정의**: TypeScript 인터페이스 문서화
- **예외 처리**: 예외 상황별 처리 방법

## 11. 버전 관리

### API 버전 관리
- **URL 버전**: `/api/v1/`, `/api/v2/` 형태
- **호환성**: 하위 호환성 유지
- **마이그레이션**: 점진적 마이그레이션 지원

### 변경 사항 추적
- **CHANGELOG**: 변경 사항 기록
- **Breaking Changes**: 호환성 깨지는 변경사항 명시
- **Deprecation**: 사용 중단 예정 기능 알림
