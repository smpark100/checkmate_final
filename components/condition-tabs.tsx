"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { conditionData, conditionCategories, workTypeNames } from "@/lib/condition-data"
import { Search, CheckSquare, Square, Filter } from "lucide-react"

interface ProjectInfo {
  name: string
  location: string
  client: string
  summary: string
  projectType: string
  detailedType: string
}

interface ConditionTabsProps {
  projectInfo: ProjectInfo
  selectedConditions: any
  setSelectedConditions: (conditions: any) => void
}

export function ConditionTabs({ projectInfo, selectedConditions, setSelectedConditions }: ConditionTabsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  const handleConditionChange = (conditionId: string, checked: boolean, tab: string) => {
    const updatedConditions = { ...selectedConditions }
    const currentProjectConditions = updatedConditions[projectInfo.detailedType]

    if (checked) {
      const dataSource = tab === "basic" ? conditionData.basic : conditionData[projectInfo.detailedType]?.[tab] || []
      const condition = dataSource.find((c: any) => c.id === conditionId)
      if (condition && !currentProjectConditions[tab].some((c: any) => c.id === conditionId)) {
        currentProjectConditions[tab].push(condition)
      }
    } else {
      currentProjectConditions[tab] = currentProjectConditions[tab].filter((c: any) => c.id !== conditionId)
    }

    setSelectedConditions(updatedConditions)
  }

  const handleSelectAll = (tab: string) => {
    const dataSource = tab === "basic" ? conditionData.basic : conditionData[projectInfo.detailedType]?.[tab] || []
    const updatedConditions = { ...selectedConditions }
    const currentProjectConditions = updatedConditions[projectInfo.detailedType]

    dataSource.forEach((condition: any) => {
      if (!currentProjectConditions[tab].some((c: any) => c.id === condition.id)) {
        currentProjectConditions[tab].push(condition)
      }
    })

    setSelectedConditions(updatedConditions)
  }

  const handleDeselectAll = (tab: string) => {
    const updatedConditions = { ...selectedConditions }
    updatedConditions[projectInfo.detailedType][tab] = []
    setSelectedConditions(updatedConditions)
  }

  const filteredConditions = useMemo(() => {
    const dataSource = conditionData.basic
    const selectedInTab = selectedConditions[projectInfo.detailedType]["basic"]

    return dataSource.filter((condition: any) => {
      const matchesSearch = condition.text.toLowerCase().includes(searchTerm.toLowerCase())
      const isSelected = selectedInTab.some((c: any) => c.id === condition.id)

      if (showOnlySelected) {
        return matchesSearch && isSelected
      }
      return matchesSearch
    })
  }, [searchTerm, showOnlySelected, selectedConditions, projectInfo.detailedType])

  const getSelectedCount = (tab: string) => {
    return selectedConditions[projectInfo.detailedType][tab]?.length || 0
  }

  const getTotalCount = (tab: string) => {
    if (tab === "custom") {
      return selectedConditions[projectInfo.detailedType].custom.length
    }
    const dataSource = tab === "basic" ? conditionData.basic : conditionData[projectInfo.detailedType]?.[tab] || []
    return dataSource.length
  }

  const renderConditions = () => {
    if (filteredConditions.length === 0) {
      if (searchTerm) {
        return <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
      }
      return <p className="text-gray-500 text-center py-8">현장기본조건이 없습니다.</p>
    }

    return filteredConditions.map((condition: any) => {
      const isChecked = selectedConditions[projectInfo.detailedType]["basic"].some((c: any) => c.id === condition.id)

      return (
        <Card
          key={condition.id}
          className={`p-3 transition-all hover:shadow-sm ${isChecked ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) =>
                handleConditionChange(condition.id, checked as boolean, "basic")
              }
              className="mt-1 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-relaxed text-pretty">{condition.text}</p>
              {isChecked && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  선택됨
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* 현장기본조건 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">현장기본조건</h3>
        <Badge variant="outline" className="text-xs">
          {getSelectedCount("basic")}/{getTotalCount("basic")}
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="조건 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlySelected(!showOnlySelected)}
            className={showOnlySelected ? "bg-blue-50 border-blue-200" : ""}
          >
            <Filter className="h-4 w-4 mr-1" />
            선택된 항목만
          </Button>
        </div>

        {getTotalCount("basic") > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleSelectAll("basic")} className="h-8 px-2">
                <CheckSquare className="h-4 w-4 mr-1" />
                전체 선택
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeselectAll("basic")} className="h-8 px-2">
                <Square className="h-4 w-4 mr-1" />
                전체 해제
              </Button>
            </div>
            <div className="text-gray-500">{getSelectedCount("basic")}개 선택됨</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
        <span>
          현재 공종: <strong>{workTypeNames[projectInfo.detailedType as keyof typeof workTypeNames]}</strong>
        </span>
        <span>모든 공종에 공통으로 적용되는 기본 조건</span>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">{renderConditions()}</div>
    </div>
  )
}
