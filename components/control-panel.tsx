"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ConditionTabs } from "@/components/condition-tabs"
import { ContractConditionSelector } from "@/components/ContractConditionSelector"
import { RiskAssessmentPanel } from "@/components/risk-assessment-panel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RotateCcw, Shield } from "lucide-react"
import { analyzeRisk, type RiskAnalysis } from "@/lib/risk-assessment"
import { ContractClause } from "@/lib/types"

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
  showModal: (title: string, message: string, type: "success" | "warning" | "error", onConfirm?: () => void, onDelete?: () => void, showDelete?: boolean) => void
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
  const [siteSearchTerm, setSiteSearchTerm] = useState("")
  const [siteOptions, setSiteOptions] = useState<Array<{ label: string; value: string }>>([])
  const [presets, setPresets] = useState<Record<string, any>>({})
  const [contractConditions, setContractConditions] = useState<ContractClause[]>([])
  

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
            () => {
              // 복원 로직
              try {
                const parsed = JSON.parse(savedData)
                if (parsed.projectInfo) {
                  setProjectInfo(parsed.projectInfo)
                }
                if (parsed.selectedConditions) {
                  setSelectedConditions(parsed.selectedConditions)
                }
                showModal("복원 완료", "임시 저장된 데이터가 성공적으로 복원되었습니다.", "success")
              } catch (error) {
                showModal("복원 실패", "데이터 복원 중 오류가 발생했습니다.", "error")
              }
            },
            () => {
              // 삭제 로직
              localStorage.removeItem("quote-generator-temp-save")
              showModal("삭제 완료", "임시 저장된 데이터가 삭제되었습니다.", "success")
            },
            true // showDelete = true
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

  const handleContractConditionsChange = useCallback((conditions: ContractClause[]) => {
    console.log('선택된 계약조건:', conditions)
    setContractConditions(conditions)
    
    // ContractConditionSelector에서 선택된 조건들을 construction 조건으로 추가 (이미지 포함)
    const contractConstructionConditions = conditions.map((condition, index) => ({
      id: `contract-${condition.공종코드}-${index}`,
      text: condition.내용,
      isForced: condition.중요표기 === '중요',
      uploadedImages: condition.uploadedImages || []
    }))
    
    console.log('생성된 contractConstructionConditions:', contractConstructionConditions)
    
    // 기존 selectedConditions의 construction 조건과 ContractConditionSelector 조건을 병합
    setSelectedConditions(prev => {
      const currentProjectConditions = prev[projectInfo.detailedType] || {
        basic: [],
        construction: [],
        safety: [],
        quality: [],
        custom: []
      }
      
      // 기존 construction 조건에서 contract-로 시작하지 않는 조건들만 유지
      const existingConstructionConditions = currentProjectConditions.construction.filter(
        condition => !condition.id.startsWith('contract-')
      )
      
      const newConditions = {
        ...prev,
        [projectInfo.detailedType]: {
          ...currentProjectConditions,
          construction: [...existingConstructionConditions, ...contractConstructionConditions]
        }
      }
      
      console.log('ContractConditionSelector에서 업데이트된 selectedConditions:', newConditions)
      console.log('현재 프로젝트 타입:', projectInfo.detailedType)
      console.log('추가된 construction 조건들:', contractConstructionConditions)
      
      return newConditions
    })
  }, [projectInfo.detailedType])


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
            <ConditionTabs
              projectInfo={projectInfo}
              selectedConditions={selectedConditions}
              setSelectedConditions={setSelectedConditions}
              showModal={showModal}
            />
          </Card>
        </div>
        </TabsContent>

        <TabsContent value="contract-conditions" className="space-y-6 mt-6">
          <ContractConditionSelector 
            onConditionsChange={handleContractConditionsChange}
          />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
