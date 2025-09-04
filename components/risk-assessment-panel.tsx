"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import { useState } from "react"
import { type RiskAnalysis, getRiskLevelInfo } from "@/lib/risk-assessment"

interface RiskAssessmentPanelProps {
  analysis: RiskAnalysis
  isVisible: boolean
}

export function RiskAssessmentPanel({ analysis, isVisible }: RiskAssessmentPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible) return null

  const levelInfo = getRiskLevelInfo(analysis.level)

  const getIcon = () => {
    switch (analysis.level) {
      case "safe":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "low":
        return <Info className="h-5 w-5 text-blue-600" />
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case "critical":
        return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  return (
    <Card className={`${levelInfo.bgColor} ${levelInfo.borderColor} border-2`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className={`font-semibold ${levelInfo.textColor}`}>위험도 분석 결과</span>
            <Badge variant="outline" className={levelInfo.textColor}>
              {levelInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${levelInfo.textColor}`}>{analysis.score}/100</span>
          </div>
        </div>

        <Progress
          value={analysis.score}
          className="mb-3"
          // @ts-ignore
          style={{
            "--progress-background":
              levelInfo.color === "green"
                ? "#10b981"
                : levelInfo.color === "blue"
                  ? "#3b82f6"
                  : levelInfo.color === "yellow"
                    ? "#f59e0b"
                    : levelInfo.color === "orange"
                      ? "#f97316"
                      : "#ef4444",
          }}
        />

        <div className={`text-sm ${levelInfo.textColor} mb-3`}>
          <strong>분석 결과:</strong> {analysis.category}
        </div>

        {analysis.issues.length > 0 && (
          <Alert className={`mb-3 ${levelInfo.bgColor} ${levelInfo.borderColor}`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className={levelInfo.textColor}>
              <strong>발견된 위험 요소:</strong>
              <ul className="mt-1 list-disc list-inside">
                {analysis.issues.map((issue, index) => (
                  <li key={index} className="text-xs">
                    {issue}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
              <span className={`text-sm font-medium ${levelInfo.textColor}`}>권장사항 및 대응방안</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className={`text-xs ${levelInfo.textColor} space-y-1`}>
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">•</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {analysis.blockedKeywords.length > 0 && (
          <Alert className="mt-3 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>차단된 키워드:</strong> {analysis.blockedKeywords.join(", ")}
              <br />
              <span className="text-xs">이러한 키워드가 포함된 조건은 추가할 수 없습니다.</span>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  )
}
