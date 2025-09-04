export interface RiskAnalysis {
  score: number // 0-100 (0 = safe, 100 = very dangerous)
  level: "safe" | "low" | "medium" | "high" | "critical"
  category: string
  issues: string[]
  suggestions: string[]
  blockedKeywords: string[]
}

export const riskKeywords = {
  critical: {
    keywords: ["신호수", "비용으로 재시공", "일체 책임", "전액 부담", "손해배상", "위약금", "지체상금"],
    weight: 25,
    category: "부당특약",
  },
  high: {
    keywords: ["귀책", "원사업자 비용", "수급인 책임", "무상", "책임으로 한다", "배상", "과태료"],
    weight: 20,
    category: "책임전가",
  },
  medium: {
    keywords: ["별도 비용", "추가 부담", "재작업", "재시공", "본인 부담", "자비"],
    weight: 15,
    category: "비용부담",
  },
  low: {
    keywords: ["협의", "별도", "추가", "변경", "조정", "검토", "확인"],
    weight: 5,
    category: "주의사항",
  },
}

export const riskSuggestions = {
  critical: [
    "해당 조건은 부당특약에 해당할 가능성이 매우 높습니다.",
    "건축 외주팀 담당자와 즉시 협의하시기 바랍니다.",
    "계약서 검토를 통해 조건을 수정하거나 삭제를 요청하세요.",
    "법무팀 검토를 받아보시기 바랍니다.",
  ],
  high: [
    "책임 범위가 명확하지 않은 조건입니다.",
    "구체적인 책임 범위와 한계를 명시하도록 요청하세요.",
    "상호 협의를 통한 해결 방안을 제시하세요.",
    "관련 법규를 확인하여 적법성을 검토하세요.",
  ],
  medium: [
    "추가 비용 발생 가능성이 있는 조건입니다.",
    "비용 부담 주체를 명확히 하도록 요청하세요.",
    "예상 비용 규모를 사전에 협의하세요.",
    "비용 상한선을 설정하는 것을 고려하세요.",
  ],
  low: [
    "일반적인 협의 사항이 포함되어 있습니다.",
    "구체적인 협의 절차와 기준을 확인하세요.",
    "협의 결과에 대한 문서화를 요청하세요.",
  ],
  safe: ["일반적인 공사 조건에 부합합니다.", "특별한 위험 요소가 발견되지 않았습니다."],
}

export function analyzeRisk(text: string): RiskAnalysis {
  const normalizedText = text.toLowerCase().trim()
  let totalScore = 0
  const foundIssues: string[] = []
  const blockedKeywords: string[] = []
  let primaryCategory = "일반사항"

  // Check each risk level
  Object.entries(riskKeywords).forEach(([level, config]) => {
    const foundKeywords = config.keywords.filter((keyword) => normalizedText.includes(keyword.toLowerCase()))

    if (foundKeywords.length > 0) {
      totalScore += config.weight * foundKeywords.length
      foundIssues.push(`${config.category}: ${foundKeywords.join(", ")}`)

      if (level === "critical" || level === "high") {
        blockedKeywords.push(...foundKeywords)
        primaryCategory = config.category
      }
    }
  })

  // Determine risk level based on score
  let riskLevel: RiskAnalysis["level"]
  if (totalScore >= 50) {
    riskLevel = "critical"
  } else if (totalScore >= 30) {
    riskLevel = "high"
  } else if (totalScore >= 15) {
    riskLevel = "medium"
  } else if (totalScore >= 5) {
    riskLevel = "low"
  } else {
    riskLevel = "safe"
  }

  // Additional pattern checks
  const suspiciousPatterns = [
    { pattern: /\d+%?\s*(이상|초과).*부담/, description: "비율 기반 부담 조건" },
    { pattern: /(전부|모든|일체).*책임/, description: "포괄적 책임 조건" },
    { pattern: /무제한.*책임/, description: "무제한 책임 조건" },
    { pattern: /(즉시|지체없이).*배상/, description: "즉시 배상 조건" },
  ]

  suspiciousPatterns.forEach(({ pattern, description }) => {
    if (pattern.test(normalizedText)) {
      totalScore += 15
      foundIssues.push(`위험 패턴: ${description}`)
      if (riskLevel === "safe" || riskLevel === "low") {
        riskLevel = "medium"
      }
    }
  })

  return {
    score: Math.min(totalScore, 100),
    level: riskLevel,
    category: primaryCategory,
    issues: foundIssues,
    suggestions: riskSuggestions[riskLevel] || riskSuggestions.safe,
    blockedKeywords,
  }
}

export function getRiskLevelInfo(level: RiskAnalysis["level"]) {
  const levelInfo = {
    safe: {
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      icon: "✅",
      label: "안전",
    },
    low: {
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      icon: "ℹ️",
      label: "주의",
    },
    medium: {
      color: "yellow",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700",
      icon: "⚠️",
      label: "경고",
    },
    high: {
      color: "orange",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      icon: "🚨",
      label: "위험",
    },
    critical: {
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      icon: "🚫",
      label: "매우위험",
    },
  }

  return levelInfo[level]
}
