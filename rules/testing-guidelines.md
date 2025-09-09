# 테스트 가이드라인

## 1. 테스트 전략

### 테스트 피라미드
```
    /\
   /  \
  / E2E \     (10%) - 사용자 시나리오 테스트
 /______\
/        \
/  통합 테스트  \  (20%) - 컴포넌트 간 상호작용
/______________\
/                \
/   단위 테스트    \  (70%) - 개별 함수/컴포넌트
/__________________\
```

### 테스트 원칙
- **AAA 패턴**: Arrange, Act, Assert
- **FIRST 원칙**: Fast, Independent, Repeatable, Self-validating, Timely
- **테스트 격리**: 각 테스트는 독립적으로 실행 가능
- **명확한 네이밍**: 테스트 의도를 명확히 표현

## 2. 단위 테스트

### 유틸리티 함수 테스트
```typescript
// lib/contract-utils.test.ts
import { parseCSVData, validateContractClause } from '../lib/contract-utils'

describe('parseCSVData', () => {
  it('올바른 CSV 데이터를 파싱해야 함', () => {
    // Arrange
    const csvText = `공종명,대분류,중분류,태그,내용
미장조적공사,공통,현장일반,주차,주차장 확보
석공사,공통,현장일반,주차,주차장 확보`

    // Act
    const result = parseCSVData(csvText)

    // Assert
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      공종명: '미장조적공사',
      대분류: '공통',
      중분류: '현장일반',
      태그: '주차',
      내용: '주차장 확보',
      공종코드: '',
      주요: '',
      이미지: ''
    })
  })

  it('잘못된 데이터는 필터링해야 함', () => {
    // Arrange
    const csvText = `공종명,대분류,중분류,태그,내용
,공통,현장일반,주차,주차장 확보
미장조적공사,,현장일반,주차,주차장 확보`

    // Act
    const result = parseCSVData(csvText)

    // Assert
    expect(result).toHaveLength(0)
  })

  it('중복 데이터는 제거해야 함', () => {
    // Arrange
    const csvText = `공종명,대분류,중분류,태그,내용
미장조적공사,공통,현장일반,주차,주차장 확보
미장조적공사,공통,현장일반,주차,주차장 확보`

    // Act
    const result = parseCSVData(csvText)

    // Assert
    expect(result).toHaveLength(1)
  })
})

describe('validateContractClause', () => {
  it('유효한 데이터는 true를 반환해야 함', () => {
    // Arrange
    const validData = {
      공종명: '미장조적공사',
      대분류: '공통',
      중분류: '현장일반',
      내용: '주차장 확보'
    }

    // Act
    const result = validateContractClause(validData)

    // Assert
    expect(result).toBe(true)
  })

  it('필수 필드가 누락된 데이터는 false를 반환해야 함', () => {
    // Arrange
    const invalidData = {
      공종명: '',
      대분류: '공통',
      중분류: '현장일반',
      내용: '주차장 확보'
    }

    // Act
    const result = validateContractClause(invalidData)

    // Assert
    expect(result).toBe(false)
  })
})
```

### API 함수 테스트
```typescript
// app/api/csv-data/route.test.ts
import { GET } from '../route'
import fs from 'fs'
import path from 'path'

// Mock fs module
jest.mock('fs')
const mockedFs = fs as jest.Mocked<typeof fs>

describe('/api/csv-data', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('파일이 존재할 때 CSV 데이터를 반환해야 함', async () => {
    // Arrange
    const mockCSVContent = '공종명,대분류,중분류,태그,내용\n미장조적공사,공통,현장일반,주차,주차장 확보'
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockReturnValue(mockCSVContent)

    // Act
    const response = await GET()

    // Assert
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(mockCSVContent)
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
  })

  it('파일이 없을 때 404 에러를 반환해야 함', async () => {
    // Arrange
    mockedFs.existsSync.mockReturnValue(false)

    // Act
    const response = await GET()

    // Assert
    expect(response.status).toBe(404)
    const errorData = await response.json()
    expect(errorData.error).toBe('FILE_NOT_FOUND')
  })

  it('파일이 비어있을 때 400 에러를 반환해야 함', async () => {
    // Arrange
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockReturnValue('')

    // Act
    const response = await GET()

    // Assert
    expect(response.status).toBe(400)
    const errorData = await response.json()
    expect(errorData.error).toBe('EMPTY_FILE')
  })
})
```

## 3. 컴포넌트 테스트

### React 컴포넌트 테스트
```typescript
// components/ContractConditionSelector.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ContractConditionSelector from './ContractConditionSelector'

// 테스트용 QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('ContractConditionSelector', () => {
  const mockClauses = [
    {
      공종명: '미장조적공사',
      공종코드: '3061',
      대분류: '공통',
      중분류: '현장일반',
      태그: '주차',
      내용: '주차장 확보',
      주요: '',
      이미지: ''
    },
    {
      공종명: '석공사',
      공종코드: '3090',
      대분류: '공통',
      중분류: '현장일반',
      태그: '주차',
      내용: '주차장 확보',
      주요: '',
      이미지: ''
    }
  ]

  it('공종 목록을 렌더링해야 함', () => {
    // Arrange & Act
    render(
      <TestWrapper>
        <ContractConditionSelector clauses={mockClauses} />
      </TestWrapper>
    )

    // Assert
    expect(screen.getByText('미장조적공사')).toBeInTheDocument()
    expect(screen.getByText('석공사')).toBeInTheDocument()
  })

  it('공종 선택 시 대분류 목록이 업데이트되어야 함', async () => {
    // Arrange
    render(
      <TestWrapper>
        <ContractConditionSelector clauses={mockClauses} />
      </TestWrapper>
    )

    // Act
    fireEvent.click(screen.getByText('미장조적공사'))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('공통')).toBeInTheDocument()
    })
  })

  it('조건 선택 시 체크박스가 토글되어야 함', () => {
    // Arrange
    render(
      <TestWrapper>
        <ContractConditionSelector clauses={mockClauses} />
      </TestWrapper>
    )

    // Act
    fireEvent.click(screen.getByText('미장조적공사'))
    fireEvent.click(screen.getByText('공통'))
    fireEvent.click(screen.getByText('현장일반'))
    
    const checkbox = screen.getByRole('checkbox', { name: /주차장 확보/ })
    fireEvent.click(checkbox)

    // Assert
    expect(checkbox).toBeChecked()
  })
})
```

### 커스텀 훅 테스트
```typescript
// hooks/useContractData.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useContractData } from './useContractData'

// Mock fetch
global.fetch = jest.fn()

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useContractData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('데이터를 성공적으로 로딩해야 함', async () => {
    // Arrange
    const mockData = '공종명,대분류,중분류,태그,내용\n미장조적공사,공통,현장일반,주차,주차장 확보'
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockData)
    })

    // Act
    const { result } = renderHook(() => useContractData(), {
      wrapper: createWrapper()
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toBe(mockData)
  })

  it('에러 발생 시 에러 상태를 반환해야 함', async () => {
    // Arrange
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    // Act
    const { result } = renderHook(() => useContractData(), {
      wrapper: createWrapper()
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toBeDefined()
  })
})
```

## 4. 통합 테스트

### API 통합 테스트
```typescript
// __tests__/api/csv-data.integration.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '../../app/api/csv-data/route'
import fs from 'fs'

// Mock fs module
jest.mock('fs')
const mockedFs = fs as jest.Mocked<typeof fs>

describe('/api/csv-data 통합 테스트', () => {
  it('실제 파일 시스템과 통합되어 작동해야 함', async () => {
    // Arrange
    const mockCSVContent = '공종명,대분류,중분류,태그,내용\n미장조적공사,공통,현장일반,주차,주차장 확보'
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockReturnValue(mockCSVContent)

    const { req, res } = createMocks({
      method: 'GET'
    })

    // Act
    await handler(req, res)

    // Assert
    expect(res._getStatusCode()).toBe(200)
    expect(res._getHeaders()['content-type']).toBe('text/plain; charset=utf-8')
  })
})
```

### 컴포넌트 통합 테스트
```typescript
// __tests__/components/ContractConditionSelector.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ContractConditionSelector from '../../components/ContractConditionSelector'

// Mock API
jest.mock('../../lib/api', () => ({
  loadCSVData: jest.fn().mockResolvedValue('공종명,대분류,중분류,태그,내용\n미장조적공사,공통,현장일반,주차,주차장 확보')
}))

const IntegrationTestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('ContractConditionSelector 통합 테스트', () => {
  it('전체 플로우가 올바르게 작동해야 함', async () => {
    // Arrange & Act
    render(
      <IntegrationTestWrapper>
        <ContractConditionSelector />
      </IntegrationTestWrapper>
    )

    // Assert - 데이터 로딩 확인
    await waitFor(() => {
      expect(screen.getByText('미장조적공사')).toBeInTheDocument()
    })

    // Act - 공종 선택
    fireEvent.click(screen.getByText('미장조적공사'))

    // Assert - 대분류 표시 확인
    await waitFor(() => {
      expect(screen.getByText('공통')).toBeInTheDocument()
    })

    // Act - 대분류 선택
    fireEvent.click(screen.getByText('공통'))

    // Assert - 중분류 표시 확인
    await waitFor(() => {
      expect(screen.getByText('현장일반')).toBeInTheDocument()
    })
  })
})
```

## 5. E2E 테스트

### Playwright E2E 테스트
```typescript
// e2e/contract-condition-selector.spec.ts
import { test, expect } from '@playwright/test'

test.describe('계약조건 선택기 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('전체 사용자 플로우가 올바르게 작동해야 함', async ({ page }) => {
    // 1. 페이지 로딩 확인
    await expect(page.locator('h1')).toContainText('계약조건 선택기')

    // 2. 공종 목록 표시 확인
    await expect(page.locator('[data-testid="work-type-list"]')).toBeVisible()
    await expect(page.locator('text=미장조적공사')).toBeVisible()

    // 3. 공종 선택
    await page.click('text=미장조적공사')

    // 4. 대분류 목록 표시 확인
    await expect(page.locator('[data-testid="category-list"]')).toBeVisible()
    await expect(page.locator('text=공통')).toBeVisible()

    // 5. 대분류 선택
    await page.click('text=공통')

    // 6. 중분류 목록 표시 확인
    await expect(page.locator('[data-testid="subcategory-list"]')).toBeVisible()
    await expect(page.locator('text=현장일반')).toBeVisible()

    // 7. 중분류 선택
    await page.click('text=현장일반')

    // 8. 태그 목록 표시 확인
    await expect(page.locator('[data-testid="tag-list"]')).toBeVisible()
    await expect(page.locator('text=주차')).toBeVisible()

    // 9. 태그 선택
    await page.click('text=주차')

    // 10. 조건 목록 표시 확인
    await expect(page.locator('[data-testid="condition-list"]')).toBeVisible()
    await expect(page.locator('text=주차장 확보')).toBeVisible()

    // 11. 조건 선택
    const checkbox = page.locator('input[type="checkbox"]').first()
    await checkbox.check()
    await expect(checkbox).toBeChecked()

    // 12. 선택된 조건 수 확인
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('1')
  })

  test('에러 상황을 올바르게 처리해야 함', async ({ page }) => {
    // API 에러 시뮬레이션
    await page.route('/api/csv-data', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'INTERNAL_SERVER_ERROR', message: '서버 오류' })
      })
    })

    await page.goto('/')

    // 에러 메시지 표시 확인
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=서버 오류')).toBeVisible()
  })
})
```

## 6. 성능 테스트

### 성능 테스트
```typescript
// __tests__/performance/parseCSVData.performance.test.ts
import { parseCSVData } from '../../lib/contract-utils'

describe('parseCSVData 성능 테스트', () => {
  it('대용량 CSV 데이터를 1초 이내에 파싱해야 함', () => {
    // Arrange - 대용량 CSV 데이터 생성
    const largeCSVData = generateLargeCSVData(10000) // 10,000행

    // Act
    const start = performance.now()
    const result = parseCSVData(largeCSVData)
    const end = performance.now()

    // Assert
    expect(end - start).toBeLessThan(1000) // 1초 이내
    expect(result).toHaveLength(10000)
  })

  it('메모리 사용량이 적절해야 함', () => {
    // Arrange
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    const largeCSVData = generateLargeCSVData(5000)

    // Act
    const result = parseCSVData(largeCSVData)
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory

    // Assert
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB 이하
  })
})

function generateLargeCSVData(rowCount: number): string {
  const headers = '공종명,대분류,중분류,태그,내용\n'
  const rows = Array.from({ length: rowCount }, (_, i) => 
    `공종${i},대분류${i % 5},중분류${i % 10},태그${i % 3},내용${i}`
  ).join('\n')
  return headers + rows
}
```

## 7. 접근성 테스트

### 접근성 테스트
```typescript
// __tests__/accessibility/ContractConditionSelector.a11y.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import ContractConditionSelector from '../../components/ContractConditionSelector'

expect.extend(toHaveNoViolations)

describe('ContractConditionSelector 접근성 테스트', () => {
  it('접근성 규칙을 위반하지 않아야 함', async () => {
    // Arrange
    const { container } = render(<ContractConditionSelector />)

    // Act
    const results = await axe(container)

    // Assert
    expect(results).toHaveNoViolations()
  })

  it('키보드 네비게이션이 가능해야 함', () => {
    // Arrange
    render(<ContractConditionSelector />)

    // Act & Assert
    const firstButton = screen.getByRole('button', { name: /미장조적공사/ })
    firstButton.focus()
    expect(firstButton).toHaveFocus()

    // Tab 키로 다음 요소로 이동
    fireEvent.keyDown(firstButton, { key: 'Tab' })
    // 다음 포커스 가능한 요소 확인
  })
})
```

## 8. 테스트 설정

### Jest 설정
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### 테스트 유틸리티
```typescript
// __tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient }
}

export * from '@testing-library/react'
export { renderWithProviders as render }
```

## 9. 테스트 실행

### 테스트 스크립트
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### CI/CD 설정
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

## 10. 테스트 모범 사례

### 테스트 작성 가이드라인
1. **명확한 테스트 이름**: 테스트가 무엇을 하는지 명확히 표현
2. **단일 책임**: 각 테스트는 하나의 기능만 테스트
3. **독립성**: 테스트 간 의존성 없이 독립적으로 실행
4. **재현 가능성**: 동일한 결과를 보장
5. **빠른 실행**: 테스트는 빠르게 실행되어야 함

### 테스트 데이터 관리
```typescript
// __tests__/fixtures/contract-clauses.ts
export const mockContractClauses = [
  {
    공종명: '미장조적공사',
    공종코드: '3061',
    대분류: '공통',
    중분류: '현장일반',
    태그: '주차',
    내용: '주차장 확보',
    주요: '',
    이미지: ''
  },
  // ... 더 많은 테스트 데이터
]

export const mockCSVData = `공종명,대분류,중분류,태그,내용
미장조적공사,공통,현장일반,주차,주차장 확보
석공사,공통,현장일반,주차,주차장 확보`
```

### 테스트 유지보수
- 정기적인 테스트 리팩토링
- 중복 코드 제거
- 테스트 데이터 업데이트
- 성능 테스트 모니터링
