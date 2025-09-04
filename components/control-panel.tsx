"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ConditionTabs } from "@/components/condition-tabs"
import { RiskAssessmentPanel } from "@/components/risk-assessment-panel"
import { RotateCcw, Shield } from "lucide-react"
import { analyzeRisk, type RiskAnalysis } from "@/lib/risk-assessment"

interface ProjectInfo {
  name: string
  location: string
  client: string
  summary: string
  projectType: string
  detailedType: string
}

interface ControlPanelProps {
  projectInfo: ProjectInfo
  setProjectInfo: (info: ProjectInfo) => void
  selectedConditions: any
  setSelectedConditions: (conditions: any) => void
  showModal: (title: string, message: string, type: "success" | "warning" | "error") => void
}

export function ControlPanel({
  projectInfo,
  setProjectInfo,
  selectedConditions,
  setSelectedConditions,
  showModal,
}: ControlPanelProps) {
  const [customConditionText, setCustomConditionText] = useState("")
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null)
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    const savedData = localStorage.getItem("quote-generator-temp-save")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        const savedTime = new Date(parsed.timestamp)
        const now = new Date()
        const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60)

        if (hoursDiff < 24) {
          showModal(
            "임시 저장된 데이터 발견",
            `${savedTime.toLocaleString("ko-KR")}에 저장된 데이터가 있습니다. 복원하시겠습니까?`,
            "warning",
          )
        }
      } catch (error) {
        console.error("Failed to parse saved data:", error)
      }
    }
  }, [showModal])

  const handleProjectInfoChange = (field: keyof ProjectInfo, value: string) => {
    setProjectInfo({ ...projectInfo, [field]: value })
  }

  const handleReviewRisk = async () => {
    if (!customConditionText.trim()) {
      showModal("입력 오류", "분석할 내용을 먼저 입력해 주세요.", "error")
      return
    }

    setIsAnalyzing(true)

    setTimeout(() => {
      const analysis = analyzeRisk(customConditionText)
      setRiskAnalysis(analysis)
      setShowRiskAnalysis(true)
      setIsAnalyzing(false)

      const history = JSON.parse(localStorage.getItem("risk-analysis-history") || "[]")
      history.push({
        text: customConditionText,
        analysis,
        timestamp: new Date().toISOString(),
      })
      if (history.length > 10) {
        history.shift()
      }
      localStorage.setItem("risk-analysis-history", JSON.stringify(history))
    }, 1000)
  }

  const handleAddCustomCondition = () => {
    if (!customConditionText.trim()) {
      showModal("입력 오류", "추가할 내용을 먼저 입력해 주세요.", "error")
      return
    }

    if (!riskAnalysis) {
      showModal("검토 필요", '목록 추가 전, 먼저 "위험도 분석" 버튼을 눌러주세요.', "warning")
      return
    }

    if (riskAnalysis.level === "critical" || riskAnalysis.level === "high") {
      showModal(
        "추가 불가",
        `위험도가 ${riskAnalysis.level === "critical" ? "매우 높은" : "높은"} 조건은 추가할 수 없습니다. 조건을 수정하거나 담당자와 협의하세요.`,
        "error",
      )
      return
    }

    if (riskAnalysis.level === "medium") {
      showModal("주의 필요", "중간 위험도의 조건입니다. 담당자와 협의 후 추가하시기 바랍니다.", "warning")
    }

    const newCondition = {
      id: `custom-${Date.now()}`,
      text: customConditionText.trim(),
      riskLevel: riskAnalysis.level,
      riskScore: riskAnalysis.score,
    }

    const updatedConditions = { ...selectedConditions }
    updatedConditions[projectInfo.detailedType].custom.push(newCondition)
    setSelectedConditions(updatedConditions)

    setCustomConditionText("")
    setRiskAnalysis(null)
    setShowRiskAnalysis(false)
    showModal("추가 완료", "현장 특수사항이 목록에 성공적으로 추가되었습니다.", "success")
  }

  const handleReset = () => {
    setCustomConditionText("")
    setRiskAnalysis(null)
    setShowRiskAnalysis(false)
  }

  return (
    <aside className="w-1/3 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-3 border-l-4 border-blue-500 pl-3">1. 공종 선택</h2>
          <Select
            value={projectInfo.projectType}
            onValueChange={(value) => handleProjectInfoChange("projectType", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="건축공사">건축공사</SelectItem>
              <SelectItem value="토목공사">토목공사</SelectItem>
              <SelectItem value="전기공사">전기공사</SelectItem>
              <SelectItem value="설비공사">설비공사</SelectItem>
              <SelectItem value="소방공사">소방공사</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 border-l-4 border-blue-500 pl-3">2. 세부 공종 선택</h2>
          <Select
            value={projectInfo.detailedType}
            onValueChange={(value) => handleProjectInfoChange("detailedType", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tile_work">타일 공사</SelectItem>
              <SelectItem value="framing_work">골조 공사</SelectItem>
              <SelectItem value="finishing_work">미장 공사</SelectItem>
              <SelectItem value="painting_work">도장 공사</SelectItem>
              <SelectItem value="interior_woodwork">내장 목공사</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 border-l-4 border-blue-500 pl-3">3. 현장 기본 정보</h2>
          <div className="space-y-3">
            <Input
              placeholder="프로젝트명 (예: OOO 신축공사)"
              value={projectInfo.name}
              onChange={(e) => handleProjectInfoChange("name", e.target.value)}
            />
            <Input
              placeholder="공사위치"
              value={projectInfo.location}
              onChange={(e) => handleProjectInfoChange("location", e.target.value)}
            />
            <Input
              placeholder="발주처"
              value={projectInfo.client}
              onChange={(e) => handleProjectInfoChange("client", e.target.value)}
            />
            <Textarea
              placeholder="공사개요를 간략히 입력하세요..."
              rows={3}
              value={projectInfo.summary}
              onChange={(e) => handleProjectInfoChange("summary", e.target.value)}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 border-l-4 border-blue-500 pl-3">4. 조건 선택 및 추가</h2>
          <Card className="p-4 bg-gray-50">
            <ConditionTabs
              projectInfo={projectInfo}
              selectedConditions={selectedConditions}
              setSelectedConditions={setSelectedConditions}
            />
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-semibold">현장 특수사항 추가</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              초기화
            </Button>
          </div>
          <div className="space-y-3">
            <Textarea
              placeholder="추가할 조건을 입력하세요..."
              rows={3}
              value={customConditionText}
              onChange={(e) => setCustomConditionText(e.target.value)}
            />
            <Button
              onClick={handleReviewRisk}
              disabled={isAnalyzing || !customConditionText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  분석 중...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  위험도 분석
                </>
              )}
            </Button>
            <RiskAssessmentPanel analysis={riskAnalysis!} isVisible={showRiskAnalysis && !!riskAnalysis} />
            <Button
              onClick={handleAddCustomCondition}
              disabled={!riskAnalysis || riskAnalysis.level === "critical" || riskAnalysis.level === "high"}
              className="w-full"
            >
              목록에 추가
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
