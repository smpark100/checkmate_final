# 에러 처리 규칙

## 1. 에러 처리 원칙

### 기본 원칙
- **일관성**: 모든 에러를 동일한 형식으로 처리
- **투명성**: 사용자에게 명확한 에러 메시지 제공
- **복구 가능성**: 가능한 경우 자동 복구 시도
- **로깅**: 모든 에러를 적절히 로깅

### 에러 처리 계층
1. **컴포넌트 레벨**: UI 에러 바운더리
2. **API 레벨**: 서버 에러 응답
3. **유틸리티 레벨**: 데이터 처리 에러
4. **시스템 레벨**: 전역 에러 핸들러

## 2. 에러 타입 정의

### 표준 에러 타입
```typescript
type ErrorType = 
  | 'FILE_NOT_FOUND'           // 파일 없음
  | 'EMPTY_FILE'               // 빈 파일
  | 'PARSE_ERROR'              // 파싱 오류
  | 'VALIDATION_ERROR'         // 검증 오류
  | 'NETWORK_ERROR'            // 네트워크 오류
  | 'INTERNAL_SERVER_ERROR'    // 서버 내부 오류
  | 'UNAUTHORIZED'             // 인증 실패
  | 'FORBIDDEN'                // 권한 없음
  | 'RATE_LIMIT_EXCEEDED'      // 요청 한도 초과
  | 'TIMEOUT'                  // 타임아웃
  | 'INVALID_INPUT'            // 잘못된 입력
  | 'RESOURCE_CONFLICT'        // 리소스 충돌
```

### 에러 심각도 레벨
```typescript
enum ErrorSeverity {
  LOW = 'low',           // 경고 수준
  MEDIUM = 'medium',     // 주의 수준
  HIGH = 'high',         // 오류 수준
  CRITICAL = 'critical'  // 치명적 수준
}
```

## 3. 표준 에러 응답 형식

### 기본 에러 응답 인터페이스
```typescript
interface StandardErrorResponse {
  error: string                    // 에러 타입
  message: string                  // 사용자 친화적 메시지
  timestamp: string               // 에러 발생 시간
  details?: any                   // 추가 상세 정보
  code?: number                   // HTTP 상태 코드
  severity?: ErrorSeverity        // 에러 심각도
  traceId?: string               // 추적 ID
}
```

### 에러 응답 생성 함수
```typescript
function createErrorResponse(
  errorType: ErrorType,
  message: string,
  statusCode: number,
  details?: any,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): StandardErrorResponse {
  return {
    error: errorType,
    message,
    timestamp: new Date().toISOString(),
    details,
    code: statusCode,
    severity,
    traceId: generateTraceId()
  }
}
```

## 4. API 레벨 에러 처리

### Next.js API 라우트 에러 처리
```typescript
export async function GET() {
  try {
    // API 로직
    return NextResponse.json(data)
  } catch (error) {
    console.error('API 에러:', error)
    
    if (error instanceof FileNotFoundError) {
      return NextResponse.json(
        createErrorResponse('FILE_NOT_FOUND', '파일을 찾을 수 없습니다.', 404),
        { status: 404 }
      )
    }
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', '데이터 검증 실패', 400, error.details),
        { status: 400 }
      )
    }
    
    // 기본 서버 에러
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.', 500),
      { status: 500 }
    )
  }
}
```

### 커스텀 에러 클래스
```typescript
class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`파일을 찾을 수 없습니다: ${filePath}`)
    this.name = 'FileNotFoundError'
  }
}

class ValidationError extends Error {
  public details: any
  
  constructor(message: string, details: any) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

class NetworkError extends Error {
  constructor(url: string, status: number) {
    super(`네트워크 오류: ${url} (${status})`)
    this.name = 'NetworkError'
  }
}
```

## 5. 클라이언트 사이드 에러 처리

### React 에러 바운더리
```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('에러 바운더리:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

### 에러 폴백 컴포넌트
```typescript
interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="error-fallback">
      <h2>문제가 발생했습니다</h2>
      <p>{error?.message || '알 수 없는 오류가 발생했습니다.'}</p>
      {resetError && (
        <button onClick={resetError}>
          다시 시도
        </button>
      )}
    </div>
  )
}
```

### 비동기 에러 처리
```typescript
async function loadDataWithErrorHandling() {
  try {
    const response = await fetch('/api/csv-data')
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new NetworkError('/api/csv-data', response.status)
    }
    
    return await response.text()
  } catch (error) {
    if (error instanceof NetworkError) {
      // 네트워크 에러 처리
      showNotification('네트워크 연결을 확인해주세요.', 'error')
    } else {
      // 기타 에러 처리
      showNotification('데이터를 불러오는 중 오류가 발생했습니다.', 'error')
    }
    
    console.error('데이터 로딩 실패:', error)
    throw error
  }
}
```

## 6. 데이터 처리 에러 처리

### CSV 파싱 에러 처리
```typescript
function parseCSVWithErrorHandling(csvText: string): ContractClause[] {
  try {
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim()
    })

    if (result.errors.length > 0) {
      console.warn('CSV 파싱 경고:', result.errors)
      
      // 경고 수준 에러는 계속 진행
      const warnings = result.errors.filter(error => error.type === 'Warning')
      if (warnings.length > 0) {
        logger.warn('CSV 파싱 경고 발생', { warnings })
      }
      
      // 치명적 에러는 예외 발생
      const criticalErrors = result.errors.filter(error => error.type === 'Error')
      if (criticalErrors.length > 0) {
        throw new ValidationError('CSV 파싱 실패', criticalErrors)
      }
    }

    // 데이터 검증
    const validData = result.data.filter(validateContractClause)
    
    if (validData.length === 0) {
      throw new ValidationError('유효한 데이터가 없습니다', { 
        totalRows: result.data.length,
        validRows: 0 
      })
    }

    return validData
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    
    console.error('CSV 파싱 오류:', error)
    throw new ValidationError('CSV 파싱 중 오류가 발생했습니다', { 
      originalError: error instanceof Error ? error.message : '알 수 없는 오류'
    })
  }
}
```

### 데이터 검증 에러 처리
```typescript
function validateContractClause(data: any): data is ContractClause {
  const errors: string[] = []
  
  if (!data.공종명 || typeof data.공종명 !== 'string' || data.공종명.trim() === '') {
    errors.push('공종명은 필수입니다')
  }
  
  if (!data.대분류 || typeof data.대분류 !== 'string' || data.대분류.trim() === '') {
    errors.push('대분류는 필수입니다')
  }
  
  if (!data.중분류 || typeof data.중분류 !== 'string' || data.중분류.trim() === '') {
    errors.push('중분류는 필수입니다')
  }
  
  if (!data.내용 || typeof data.내용 !== 'string' || data.내용.trim() === '') {
    errors.push('내용은 필수입니다')
  }
  
  if (errors.length > 0) {
    console.warn('데이터 검증 실패:', { data, errors })
    return false
  }
  
  return true
}
```

## 7. 로깅 및 모니터링

### 구조화된 로깅
```typescript
interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  component?: string
  action?: string
}

const logger = {
  info: (message: string, context?: LogContext, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, { context, data })
  },
  
  warn: (message: string, context?: LogContext, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, { context, data })
  },
  
  error: (message: string, error?: Error, context?: LogContext) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, { 
      error: error?.stack, 
      context 
    })
  }
}
```

### 에러 추적
```typescript
function trackError(error: Error, context?: LogContext) {
  logger.error('에러 발생', error, context)
  
  // 에러 추적 서비스에 전송 (예: Sentry)
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, { extra: context })
  }
}
```

## 8. 사용자 친화적 에러 메시지

### 에러 메시지 매핑
```typescript
const ERROR_MESSAGES: Record<ErrorType, string> = {
  FILE_NOT_FOUND: '요청하신 파일을 찾을 수 없습니다.',
  EMPTY_FILE: '파일이 비어있습니다.',
  PARSE_ERROR: '데이터를 처리하는 중 오류가 발생했습니다.',
  VALIDATION_ERROR: '입력 데이터가 올바르지 않습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  INTERNAL_SERVER_ERROR: '서버에 일시적인 문제가 발생했습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  RATE_LIMIT_EXCEEDED: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  TIMEOUT: '요청 시간이 초과되었습니다.',
  INVALID_INPUT: '입력값이 올바르지 않습니다.',
  RESOURCE_CONFLICT: '리소스 충돌이 발생했습니다.'
}
```

### 에러 메시지 표시
```typescript
function showErrorMessage(errorType: ErrorType, customMessage?: string) {
  const message = customMessage || ERROR_MESSAGES[errorType] || '알 수 없는 오류가 발생했습니다.'
  
  // 토스트 알림 또는 모달로 표시
  showNotification(message, 'error')
}
```

## 9. 재시도 로직

### 지수 백오프 재시도
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // 지수 백오프: 1초, 2초, 4초...
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      logger.warn(`재시도 ${attempt + 1}/${maxRetries}`, { delay, error: lastError.message })
    }
  }
  
  throw lastError!
}
```

### 사용 예시
```typescript
const data = await retryWithBackoff(
  () => loadCSVData(),
  3, // 최대 3회 재시도
  1000 // 기본 1초 지연
)
```

## 10. 테스트를 위한 에러 처리

### 에러 상황 시뮬레이션
```typescript
// 테스트용 에러 발생 함수
function simulateError(errorType: ErrorType) {
  switch (errorType) {
    case 'FILE_NOT_FOUND':
      throw new FileNotFoundError('/test/path.csv')
    case 'NETWORK_ERROR':
      throw new NetworkError('/api/test', 500)
    case 'VALIDATION_ERROR':
      throw new ValidationError('테스트 검증 실패', { field: 'test' })
    default:
      throw new Error('테스트 에러')
  }
}
```

### 에러 처리 테스트
```typescript
describe('에러 처리', () => {
  it('파일 없음 에러를 올바르게 처리해야 함', async () => {
    const error = new FileNotFoundError('/test.csv')
    const response = createErrorResponse('FILE_NOT_FOUND', '파일을 찾을 수 없습니다.', 404)
    
    expect(response.error).toBe('FILE_NOT_FOUND')
    expect(response.code).toBe(404)
  })
  
  it('재시도 로직이 올바르게 작동해야 함', async () => {
    let attemptCount = 0
    const fn = () => {
      attemptCount++
      if (attemptCount < 3) {
        throw new Error('임시 오류')
      }
      return '성공'
    }
    
    const result = await retryWithBackoff(fn, 3, 100)
    expect(result).toBe('성공')
    expect(attemptCount).toBe(3)
  })
})
```
