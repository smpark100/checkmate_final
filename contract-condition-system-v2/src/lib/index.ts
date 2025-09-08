// 계약조건 시스템 라이브러리
export * from './types'
export * from './parser'
export * from './utils'

// 설정 상수
export const CONTRACT_CONDITION_SYSTEM_CONFIG = {
  version: '2.0.0',
  namespace: 'ContractConditionSystem',
  apiPrefix: '/api/contract-condition-system',
  defaultImagePath: '/images'
} as const