# 성능 최적화 규칙

## 1. 성능 최적화 원칙

### 기본 원칙
- **측정 우선**: 성능 문제를 정확히 측정한 후 최적화
- **점진적 개선**: 한 번에 하나씩 최적화하고 효과 측정
- **사용자 경험 중심**: 실제 사용자에게 영향을 주는 지표에 집중
- **균형 유지**: 성능과 코드 가독성, 유지보수성의 균형

### 핵심 성능 지표
- **LCP (Largest Contentful Paint)**: 최대 콘텐츠 렌더링 시간 < 2.5초
- **FID (First Input Delay)**: 첫 입력 지연 시간 < 100ms
- **CLS (Cumulative Layout Shift)**: 누적 레이아웃 이동 < 0.1
- **TTI (Time to Interactive)**: 상호작용 가능 시간 < 3.8초

## 2. 서버 사이드 최적화

### API 응답 최적화
```typescript
// 캐싱 전략
const CACHE_DURATION = 5 * 60 * 1000 // 5분
let cache: { data: any; timestamp: number } | null = null

export async function GET() {
  // 캐시 확인
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return new NextResponse(cache.data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'HIT'
      }
    })
  }
  
  // 데이터 로딩 및 캐시 저장
  const data = await loadData()
  cache = { data, timestamp: Date.now() }
  
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'X-Cache': 'MISS'
    }
  })
}
```

### 데이터베이스 쿼리 최적화
```typescript
// 인덱스 활용
const optimizedQuery = `
  SELECT 공종명, 대분류, 중분류, 태그, 내용 
  FROM contract_clauses 
  WHERE 공종명 = ? 
  ORDER BY 공종명, 대분류, 중분류
  LIMIT 100
`

// 페이지네이션
const paginatedQuery = `
  SELECT * FROM contract_clauses 
  WHERE 공종명 = ? 
  ORDER BY id 
  LIMIT ? OFFSET ?
`
```

### 메모리 사용량 최적화
```typescript
// 스트리밍 처리
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'

function processLargeCSV(filePath: string): Promise<ContractClause[]> {
  return new Promise((resolve, reject) => {
    const results: ContractClause[] = []
    const parser = parse({ 
      headers: true,
      skipEmptyLines: true 
    })
    
    parser.on('data', (row) => {
      if (validateContractClause(row)) {
        results.push(row)
      }
    })
    
    parser.on('end', () => resolve(results))
    parser.on('error', reject)
    
    createReadStream(filePath).pipe(parser)
  })
}
```

## 3. 클라이언트 사이드 최적화

### React 컴포넌트 최적화
```typescript
// 메모이제이션
const ContractConditionSelector = memo(({ 
  clauses, 
  selectedWorkType, 
  onWorkTypeChange 
}: Props) => {
  // 계산 비용이 높은 작업 메모이제이션
  const uniqueWorkTypes = useMemo(() => 
    [...new Set(clauses.map(c => c.공종명))].sort(),
    [clauses]
  )
  
  // 이벤트 핸들러 메모이제이션
  const handleWorkTypeChange = useCallback((workType: string) => {
    onWorkTypeChange(workType)
  }, [onWorkTypeChange])
  
  return (
    <div>
      {uniqueWorkTypes.map(workType => (
        <button
          key={workType}
          onClick={() => handleWorkTypeChange(workType)}
          className={selectedWorkType === workType ? 'active' : ''}
        >
          {workType}
        </button>
      ))}
    </div>
  )
})
```

### 가상화 (Virtualization)
```typescript
import { FixedSizeList as List } from 'react-window'

const VirtualizedConditionList = ({ conditions }: { conditions: ContractClause[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ConditionItem condition={conditions[index]} />
    </div>
  )
  
  return (
    <List
      height={600}
      itemCount={conditions.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### 지연 로딩 (Lazy Loading)
```typescript
// 컴포넌트 지연 로딩
const LazyRiskAssessmentPanel = lazy(() => import('./risk-assessment-panel'))
const LazyPDFExportDialog = lazy(() => import('./pdf-export-dialog'))

// 데이터 지연 로딩
const useContractData = (workType: string) => {
  return useQuery({
    queryKey: ['contract-data', workType],
    queryFn: () => loadContractData(workType),
    enabled: !!workType, // workType이 있을 때만 로딩
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}
```

## 4. 번들 크기 최적화

### Tree Shaking
```typescript
// 전체 라이브러리 대신 필요한 부분만 import
import { parse } from 'csv-parse'
// import * as Papa from 'papaparse' ❌

// 라이브러리별 최적화
import { debounce } from 'lodash/debounce'
// import _ from 'lodash' ❌
```

### 동적 import
```typescript
// 필요할 때만 로딩
const loadHeavyLibrary = async () => {
  const { default: Papa } = await import('papaparse')
  return Papa
}

// 컴포넌트 코드 분할
const HeavyComponent = lazy(() => 
  import('./heavy-component').then(module => ({
    default: module.HeavyComponent
  }))
)
```

### 번들 분석
```bash
# 번들 크기 분석
npm install -D @next/bundle-analyzer
ANALYZE=true npm run build

# webpack-bundle-analyzer 사용
npm install -D webpack-bundle-analyzer
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

## 5. 이미지 최적화

### Next.js Image 컴포넌트 사용
```typescript
import Image from 'next/image'

// 최적화된 이미지 로딩
<Image
  src="/placeholder-logo.png"
  alt="로고"
  width={200}
  height={100}
  priority // 중요한 이미지는 우선 로딩
  placeholder="blur" // 블러 플레이스홀더
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 이미지 포맷 최적화
```typescript
// WebP 포맷 사용
const optimizedImage = {
  src: '/images/logo.webp',
  fallback: '/images/logo.png', // WebP 미지원 브라우저용
  alt: '로고'
}

// 반응형 이미지
<picture>
  <source srcSet="/images/logo-2x.webp" media="(min-width: 768px)" type="image/webp" />
  <source srcSet="/images/logo-2x.png" media="(min-width: 768px)" type="image/png" />
  <source srcSet="/images/logo.webp" type="image/webp" />
  <img src="/images/logo.png" alt="로고" />
</picture>
```

## 6. 네트워크 최적화

### HTTP/2 및 압축
```typescript
// Next.js 설정
// next.config.mjs
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true
  }
}
```

### 리소스 우선순위
```typescript
// 중요한 리소스 우선 로딩
<link rel="preload" href="/api/csv-data" as="fetch" />
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossOrigin="" />

// 덜 중요한 리소스 지연 로딩
<link rel="prefetch" href="/api/site-presets" />
```

### CDN 활용
```typescript
// 정적 자산 CDN 사용
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || ''

const getOptimizedImageUrl = (src: string) => {
  if (src.startsWith('http')) return src
  return `${CDN_URL}${src}`
}
```

## 7. 상태 관리 최적화

### 상태 구조 최적화
```typescript
// 상태 정규화
interface NormalizedState {
  clauses: {
    byId: Record<string, ContractClause>
    allIds: string[]
  }
  filters: {
    workType: string
    category: string
    subCategory: string
    tag: string
  }
  ui: {
    loading: boolean
    error: string | null
  }
}
```

### 선택적 구독
```typescript
// 필요한 상태만 구독
const workTypes = useSelector(state => state.clauses.workTypes)
const selectedWorkType = useSelector(state => state.filters.workType)

// 메모이제이션된 선택자
const selectFilteredClauses = createSelector(
  [(state: RootState) => state.clauses.byId, (state: RootState) => state.filters],
  (clauses, filters) => {
    return Object.values(clauses).filter(clause => 
      clause.공종명 === filters.workType &&
      clause.대분류 === filters.category
    )
  }
)
```

## 8. 캐싱 전략

### React Query 캐싱
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
})

// 쿼리 키 전략
const queryKeys = {
  contractData: (workType: string) => ['contract-data', workType],
  sitePresets: () => ['site-presets'],
  health: () => ['health']
}
```

### 브라우저 캐싱
```typescript
// Service Worker를 통한 캐싱
const CACHE_NAME = 'contract-conditions-v1'
const urlsToCache = [
  '/',
  '/api/csv-data',
  '/static/js/bundle.js',
  '/static/css/main.css'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})
```

## 9. 성능 모니터링

### 성능 측정
```typescript
// Web Vitals 측정
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // 분석 서비스로 전송
  console.log(metric)
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

### 성능 프로파일링
```typescript
// React DevTools Profiler 사용
import { Profiler } from 'react'

function onRenderCallback(id, phase, actualDuration) {
  console.log('Profiler:', { id, phase, actualDuration })
}

<Profiler id="ContractConditionSelector" onRender={onRenderCallback}>
  <ContractConditionSelector />
</Profiler>
```

### 메모리 사용량 모니터링
```typescript
// 메모리 사용량 체크
function checkMemoryUsage() {
  if (performance.memory) {
    console.log('메모리 사용량:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    })
  }
}

// 주기적으로 메모리 체크
setInterval(checkMemoryUsage, 30000) // 30초마다
```

## 10. 성능 테스트

### 성능 테스트 도구
```typescript
// Jest 성능 테스트
describe('성능 테스트', () => {
  it('CSV 파싱 성능', () => {
    const start = performance.now()
    const result = parseCSVData(largeCSVData)
    const end = performance.now()
    
    expect(end - start).toBeLessThan(1000) // 1초 이내
    expect(result).toHaveLength(expectedLength)
  })
  
  it('컴포넌트 렌더링 성능', () => {
    const start = performance.now()
    render(<ContractConditionSelector clauses={largeClauses} />)
    const end = performance.now()
    
    expect(end - start).toBeLessThan(100) // 100ms 이내
  })
})
```

### Lighthouse CI
```yaml
# .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    }
  }
}
```

## 11. 성능 체크리스트

### 개발 단계
- [ ] 번들 크기 분석 및 최적화
- [ ] 불필요한 리렌더링 방지
- [ ] 메모이제이션 적절히 사용
- [ ] 지연 로딩 구현
- [ ] 이미지 최적화

### 배포 전
- [ ] Lighthouse 점수 확인 (90점 이상)
- [ ] Core Web Vitals 측정
- [ ] 번들 크기 검증
- [ ] 메모리 누수 확인
- [ ] 캐싱 전략 검증

### 운영 중
- [ ] 성능 모니터링 설정
- [ ] 사용자 피드백 수집
- [ ] 정기적인 성능 검토
- [ ] 점진적 개선
