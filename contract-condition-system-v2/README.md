# 계약조건 선택 시스템 v2.0

## 🚀 주요 기능

- **계약조건 선택**: 공종별 계약조건 필터링 및 선택
- **이미지 업로드**: 각 계약조건에 이미지 첨부 가능
- **중요 조건 강조**: 중요 조건 시각적 표시
- **데이터 새로고침**: 실시간 데이터 업데이트
- **충돌 방지**: 별도 네임스페이스로 격리

## �� 설치 방법

### 1. 파일 복사
```bash
# 압축 파일 해제
unzip contract-condition-system-v2.zip
cd contract-condition-system-v2

# 의존성 설치
npm install
```

### 2. 프로젝트 통합
```bash
# 다른 프로젝트에 복사
cp -r src/ ./your-project/
cp package.json ./your-project/
cp components.json ./your-project/
cp Contract_Clause.csv ./your-project/
```

### 3. API 엔드포인트 설정
```typescript
// app/api/contract-condition-system/csv-data/route.ts
// 제공된 API 코드를 복사하여 사용
```

## 🎯 사용 방법

### 기본 사용법
```typescript
import { ContractConditionSelector } from 'contract-condition-system'

function MyPage() {
  const handleConditionsChange = (conditions) => {
    console.log('선택된 조건:', conditions)
    
    // 업로드된 이미지 확인
    conditions.forEach(condition => {
      if (condition.uploadedImages?.length > 0) {
        console.log('업로드된 이미지:', condition.uploadedImages)
      }
    })
  }

  return (
    <ContractConditionSelector 
      onConditionsChange={handleConditionsChange}
    />
  )
}
```

### 고급 사용법
```typescript
import { 
  ContractConditionSelector,
  parseCSVData,
  ContractClause 
} from 'contract-condition-system'

// CSV 데이터 직접 파싱
const csvText = await fetch('/api/csv-data').then(r => r.text())
const { data, errors, warnings } = parseCSVData(csvText)

// 타입 안전한 사용
const conditions: ContractClause[] = data
```

## 🔧 설정

### package.json 의존성
```json
{
  "dependencies": {
    "papaparse": "^5.4.1",
    "lucide-react": "^0.454.0",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-select": "2.1.4",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-separator": "^1.1.1"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

### tsconfig.json 설정
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 📋 CSV 데이터 형식

```csv
공종명,공종코드,대분류,중분류,태그,내용,중요표기
미장조적공사,3061,공통,현장일반,주차/민원/인허가/공사시간,"주변 APT, 주택, 학교 등 민원발생 다발지역으로 소음저감활동 및 비산먼지 저감활동에 적극 동참하고, 부지내 여유공간이 협소하여 현장 내 주차는 불가하며, 현장내 가설식당이 없으므로, 외부 식당을 이용하여야 한다.",
미장조적공사,3061,공통,현장일반,주차/민원/인허가/공사시간,작업자 차량 및 협력사 직원 차량은 현장 여건 상 현장 내 주차장 지원 불가함을 감안하여 투찰한다.,
미장조적공사,3061,공통,현장일반,주차/민원/인허가/공사시간/현장사무실,공사 가능시간 (평일 : 07시~18시 / 일요일 : 작업불가),중요
```

## 🐛 문제 해결

### 일반적인 문제들

1. **CSV 파일을 찾을 수 없음**
   - `Contract_Clause.csv` 파일이 프로젝트 루트에 있는지 확인
   - API 엔드포인트 경로가 올바른지 확인

2. **UI 컴포넌트 오류**
   - shadcn/ui 설정이 올바른지 확인
   - Tailwind CSS가 설치되어 있는지 확인

3. **타입 오류**
   - TypeScript 설정이 올바른지 확인
   - 필요한 타입 정의가 import되어 있는지 확인

## 📞 지원

문제가 발생하면 다음을 확인해주세요:
- Node.js 버전 (v16 이상 권장)
- Next.js 버전 (v14 이상 권장)
- TypeScript 설정
- 의존성 설치 상태

## 📄 라이선스

MIT License
