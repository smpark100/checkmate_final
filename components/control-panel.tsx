"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ContractConditionSelector } from "@/components/ContractConditionSelector"
import { RiskAssessmentPanel } from "@/components/risk-assessment-panel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RotateCcw, Shield } from "lucide-react"
import { analyzeRisk, type RiskAnalysis } from "@/lib/risk-assessment"

interface ProjectInfo {
  name: string
  location: string
  client: string
  summary: string
  projectType: string
  detailedType: string
  exemptionRate?: number
  orderVolumeRate?: number
  contactRole?: string
  contactName?: string
  contactPhoneRest?: string
  contactEmailLocal?: string
  docsUrl?: string
  docsPassword?: string
}

interface ControlPanelProps {
  projectInfo: ProjectInfo
  setProjectInfo: (info: ProjectInfo) => void
  selectedConditions: any
  setSelectedConditions: (conditions: any) => void
  showModal: (title: string, message: string, type: "success" | "warning" | "error", onConfirm?: () => void) => void
  onMisoResult?: (text: string) => void
}

export function ControlPanel({
  projectInfo,
  setProjectInfo,
  selectedConditions,
  setSelectedConditions,
  showModal,
  onMisoResult,
}: ControlPanelProps) {
  const [customConditionText, setCustomConditionText] = useState("")
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null)
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false)
  const [siteSearchTerm, setSiteSearchTerm] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [siteOptions, setSiteOptions] = useState<Array<{ label: string; value: string }>>([])
  const [presets, setPresets] = useState<Record<string, any>>({})
  

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

  // Load site presets from API
  useEffect(() => {
    fetch("/api/site-presets")
      .then((res) => res.json())
      .then((data) => {
        const opts = (data.presets || []).map((p: any) => ({ label: p.siteName, value: p.siteName }))
        setSiteOptions(opts)
        const map: Record<string, any> = {}
        ;(data.presets || []).forEach((p: any) => {
          map[p.siteName] = p
        })
        setPresets(map)
      })
      .catch(() => {})
  }, [])

  const handleProjectInfoChange = (field: keyof ProjectInfo, value: string) => {
    setProjectInfo({ ...projectInfo, [field]: value })
  }

  const handleReviewRisk = async () => {
    if (!customConditionText.trim()) {
      showModal("입력 오류", "분석할 내용을 먼저 입력해 주세요.", "error")
      return
    }

    setIsAnalyzing(true)
    try {
      // Call backend MISO workflow API
      const res = await fetch("/api/miso/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: customConditionText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "API 오류")
      }

      // Send MISO result upward
      onMisoResult?.(data?.result ?? "")

      // Create analysis based on MISO result
      const misoResult = data?.result ?? ""
      const hasUnfairClause = misoResult.includes("부당특약") || misoResult.includes("부당")
      
      const analysis = {
        score: hasUnfairClause ? 75 : 5,
        level: hasUnfairClause ? "high" as const : "low" as const,
        category: hasUnfairClause ? "부당특약" : "일반사항",
        issues: hasUnfairClause ? ["부당특약 발견"] : [],
        suggestions: [misoResult], // MISO 결과를 권장사항으로 사용
        blockedKeywords: [],
      }
      
      setRiskAnalysis(analysis)
      setShowRiskAnalysis(true)

      // Optionally persist brief history
      const history = JSON.parse(localStorage.getItem("risk-analysis-history") || "[]")
      history.push({
        text: customConditionText,
        analysis,
        timestamp: new Date().toISOString(),
        misoResult: data?.result ?? "",
      })
      if (history.length > 10) {
        history.shift()
      }
      localStorage.setItem("risk-analysis-history", JSON.stringify(history))
    } catch (e: any) {
      console.error(e)
      showModal("API 오류", e?.message || "미소 API 호출 중 오류가 발생했습니다.", "error")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddCustomCondition = () => {
    if (!customConditionText.trim()) {
      showModal("입력 오류", "추가할 내용을 먼저 입력해 주세요.", "error")
      return
    }

    if (!riskAnalysis) {
      showModal("경고", "위험도 분석을 수행하지 않고 조건을 추가하면 부당특약이나 위험 요소가 포함될 수 있습니다. 정말 추가하시겠습니까?", "warning")
      return
    }

    if (riskAnalysis.level === "critical" || riskAnalysis.level === "high") {
      showModal(
        "위험도 높음",
        `위험도가 ${riskAnalysis.level === "critical" ? "매우 높은" : "높은"} 조건입니다. 강제로 추가하시겠습니까?`,
        "warning",
        () => {
          // 강제 추가 로직
          const newCondition = {
            id: `custom-${Date.now()}`,
            text: customConditionText.trim(),
            riskLevel: riskAnalysis.level,
            riskScore: riskAnalysis.score,
            isForced: true, // 강제 추가 플래그
          }

          const updatedConditions = { ...selectedConditions }
          updatedConditions[projectInfo.detailedType].custom.push(newCondition)
          setSelectedConditions(updatedConditions)

          setCustomConditionText("")
          setRiskAnalysis(null)
          setShowRiskAnalysis(false)
          showModal("강제 추가 완료", "위험도가 높은 조건이 강제로 추가되었습니다. 별도 확인이 필요합니다.", "warning")
        }
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
      <Tabs defaultValue="project-info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="project-info">프로젝트 정보</TabsTrigger>
          <TabsTrigger value="contract-conditions">계약조건 선택</TabsTrigger>
        </TabsList>
        
        <TabsContent value="project-info" className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-3 border-l-4 border-blue-500 pl-3">1. 현장 기본 정보</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="현장명을 검색하세요..."
                value={siteSearchTerm}
                onChange={(e) => setSiteSearchTerm(e.target.value)}
                className="w-full"
              />
              <Select
                value={projectInfo.name}
                onValueChange={(value) => {
                  handleProjectInfoChange("name", value)
                  const p = presets[value]
                  if (p) {
                    setProjectInfo({
                      ...projectInfo,
                      name: value,
                      exemptionRate: p.exemptionRate ?? projectInfo.exemptionRate,
                      contactRole: projectInfo.contactRole ?? "공무",
                      contactName: p.contactName ?? projectInfo.contactName,
                      contactPhoneRest: p.contactPhoneRest ?? projectInfo.contactPhoneRest,
                      contactEmailLocal: p.contactEmailLocal ?? projectInfo.contactEmailLocal,
                      docsUrl: p.docsUrl ?? projectInfo.docsUrl,
                      docsPassword: p.docsPassword ?? projectInfo.docsPassword,
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="현장명을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {siteOptions
                    .filter(opt => 
                      siteSearchTerm === "" || 
                      opt.label.toLowerCase().includes(siteSearchTerm.toLowerCase())
                    )
                    .map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 border-l-4 border-blue-500 pl-3">2. 조건 선택 및 추가</h2>
          <Card className="p-4 bg-gray-50">
            {/* 기존 ConditionTabs는 계약조건 선택 탭으로 이동됨 */}
            <p className="text-sm text-gray-600">계약조건 선택은 상단의 "계약조건 선택" 탭을 이용하세요.</p>
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
              className="w-full"
            >
              목록에 추가
            </Button>
          </div>
        </div>
        </TabsContent>

        <TabsContent value="contract-conditions" className="space-y-6 mt-6">
          <ContractConditionSelector 
            onConditionsChange={(conditions) => {
              console.log('선택된 계약조건:', conditions)
              // 여기서 선택된 조건들을 처리할 수 있습니다
            }}
          />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
