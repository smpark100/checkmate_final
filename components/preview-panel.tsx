"use client"

import { useMemo } from "react"

interface ProjectInfo {
  name: string
  location: string
  client: string
  summary: string
  projectType: string
  detailedType: string
}

interface Condition {
  id: string
  text: string
}

interface PreviewPanelProps {
  projectInfo: ProjectInfo
  selectedConditions: {
    [key: string]: {
      basic: Condition[]
      construction: Condition[]
      safety: Condition[]
      quality: Condition[]
      custom: Condition[]
    }
  }
}

export function PreviewPanel({ projectInfo, selectedConditions }: PreviewPanelProps) {
  const currentConditions = useMemo(() => {
    return (
      selectedConditions[projectInfo.detailedType] || {
        basic: [],
        construction: [],
        safety: [],
        quality: [],
        custom: [],
      }
    )
  }, [selectedConditions, projectInfo.detailedType])

  const sections = [
    { title: "II. 현장기본조건", tab: "basic" },
    { title: "III. 공사사항", tab: "construction" },
    { title: "IV. 안전사항", tab: "safety" },
    { title: "V. 품질사항", tab: "quality" },
    { title: "VI. 현장 특수사항", tab: "custom" },
  ]

  const totalConditions = useMemo(() => {
    return Object.values(currentConditions).reduce((total, conditions) => total + conditions.length, 0)
  }, [currentConditions])

  return (
    <section className="w-2/3 bg-gray-100 p-8 overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">총 {totalConditions}개 조건이 선택되었습니다</div>
        <div className="text-sm text-gray-500">
          {projectInfo.detailedType === "tile_work" && "타일 공사"}
          {projectInfo.detailedType === "framing_work" && "골조 공사"}
          {projectInfo.detailedType === "finishing_work" && "미장 공사"}
          {projectInfo.detailedType === "painting_work" && "도장 공사"}
          {projectInfo.detailedType === "interior_woodwork" && "내장 목공사"}
        </div>
      </div>

      <div id="previewDocument" className="bg-white p-12 shadow-lg rounded-lg max-w-4xl mx-auto min-h-full">
        <div className="prose prose-sm max-w-none">
          <div className="page-break-before">
            <h1 className="text-center text-3xl font-bold mb-2 text-balance">견 적 조 건</h1>
            <p className="text-center text-lg font-semibold mb-10 text-gray-500 text-balance">
              {projectInfo.name || "[프로젝트명이 여기에 표시됩니다]"}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md mb-8 border">
            <h3 className="font-bold text-md mb-2">I. 공사 개요</h3>
            <dl className="grid grid-cols-4 gap-x-4 gap-y-1 text-sm">
              <dt className="font-semibold col-span-1">공 사 위 치</dt>
              <dd className="col-span-3">: {projectInfo.location || "-"}</dd>
              <dt className="font-semibold col-span-1">발 주 처</dt>
              <dd className="col-span-3">: {projectInfo.client || "-"}</dd>
              <dt className="font-semibold col-span-1">공 사 개 요</dt>
              <dd className="col-span-3">: {projectInfo.summary || "-"}</dd>
            </dl>
          </div>

          <div>
            {sections.map((section, sectionIndex) => {
              const conditions = currentConditions[section.tab as keyof typeof currentConditions]
              if (!conditions || conditions.length === 0) return null

              return (
                <div key={section.tab} className={sectionIndex > 2 ? "page-break-before" : ""}>
                  <h2 className="text-xl font-bold border-b-2 border-gray-800 pb-2 mt-8 text-balance">
                    {section.title}
                  </h2>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    {conditions.map((condition, index) => (
                      <li key={condition.id || index} className="text-pretty break-inside-avoid">
                        {condition.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {totalConditions > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500 page-break-after">
              <div className="space-y-1">
                <p>본 견적조건서는 견적 조건서 생성기를 통해 생성되었습니다.</p>
                <p>생성일시: {new Date().toLocaleString("ko-KR")}</p>
                <p>총 조건 수: {totalConditions}개</p>
                <p>
                  공종: {projectInfo.projectType} -{" "}
                  {(projectInfo.detailedType === "tile_work" && "타일 공사") ||
                    (projectInfo.detailedType === "framing_work" && "골조 공사") ||
                    (projectInfo.detailedType === "finishing_work" && "미장 공사") ||
                    (projectInfo.detailedType === "painting_work" && "도장 공사") ||
                    (projectInfo.detailedType === "interior_woodwork" && "내장 목공사")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
