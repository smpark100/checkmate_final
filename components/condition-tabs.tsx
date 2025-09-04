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
  const [activeTab, setActiveTab] = useState("basic")
  const [searchTerm, setSearchTerm] = useState("")
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  const tabs = [
    { id: "basic", label: "현장기본조건", color: "blue" },
    { id: "construction", label: "공사사항", color: "green" },
    { id: "safety", label: "안전사항", color: "red" },
    { id: "quality", label: "품질사항", color: "purple" },
    { id: "custom", label: "현장 특수사항", color: "orange" },
  ]

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
    if (activeTab === "custom") {
      const customConditions = selectedConditions[projectInfo.detailedType].custom
      if (customConditions.length === 0) return []

      return customConditions.filter((condition: any) =>
        condition.text.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    const dataSource =
      activeTab === "basic" ? conditionData.basic : conditionData[projectInfo.detailedType]?.[activeTab] || []
    const selectedInTab = selectedConditions[projectInfo.detailedType][activeTab]

    return dataSource.filter((condition: any) => {
      const matchesSearch = condition.text.toLowerCase().includes(searchTerm.toLowerCase())
      const isSelected = selectedInTab.some((c: any) => c.id === condition.id)

      if (showOnlySelected) {
        return matchesSearch && isSelected
      }
      return matchesSearch
    })
  }, [activeTab, searchTerm, showOnlySelected, selectedConditions, projectInfo.detailedType])

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
      if (activeTab === "custom") {
        return <p className="text-gray-500 text-center py-8">추가된 현장 특수사항이 없습니다.</p>
      }
      if (searchTerm) {
        return <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
      }
      return <p className="text-gray-500 text-center py-8">해당 공종에 대한 조건이 없습니다.</p>
    }

    return filteredConditions.map((condition: any) => {
      const isChecked = selectedConditions[projectInfo.detailedType][activeTab].some((c: any) => c.id === condition.id)
      const isCustom = activeTab === "custom"

      return (
        <Card
          key={condition.id}
          className={`p-3 transition-all hover:shadow-sm ${isChecked ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isCustom ? true : isChecked}
              onCheckedChange={(checked) =>
                !isCustom && handleConditionChange(condition.id, checked as boolean, activeTab)
              }
              className="mt-1 flex-shrink-0"
              disabled={isCustom}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-relaxed text-pretty">{condition.text}</p>
              {isChecked && !isCustom && (
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
      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const selectedCount = getSelectedCount(tab.id)
            const totalCount = getTotalCount(tab.id)

            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 ${
                  activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600"
                }`}
              >
                <span>{tab.label}</span>
                {totalCount > 0 && (
                  <Badge variant={activeTab === tab.id ? "secondary" : "outline"} className="ml-2 text-xs">
                    {selectedCount}/{totalCount}
                  </Badge>
                )}
              </Button>
            )
          })}
        </nav>
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

        {activeTab !== "custom" && getTotalCount(activeTab) > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleSelectAll(activeTab)} className="h-8 px-2">
                <CheckSquare className="h-4 w-4 mr-1" />
                전체 선택
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeselectAll(activeTab)} className="h-8 px-2">
                <Square className="h-4 w-4 mr-1" />
                전체 해제
              </Button>
            </div>
            <div className="text-gray-500">{getSelectedCount(activeTab)}개 선택됨</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
        <span>
          현재 공종: <strong>{workTypeNames[projectInfo.detailedType as keyof typeof workTypeNames]}</strong>
        </span>
        <span>{conditionCategories[activeTab as keyof typeof conditionCategories]?.description}</span>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">{renderConditions()}</div>
    </div>
  )
}
