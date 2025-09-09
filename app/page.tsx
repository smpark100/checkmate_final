"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/header"
import { ControlPanel } from "@/components/control-panel"
import { PreviewPanel } from "@/components/preview-panel"
import { Modal } from "@/components/modal"

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

interface Condition {
  id: string
  text: string
  isForced?: boolean
}

interface SelectedConditions {
  [key: string]: {
    basic: Condition[]
    construction: Condition[]
    safety: Condition[]
    quality: Condition[]
    custom: Condition[]
  }
}

export default function QuoteGeneratorPage() {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: "",
    location: "",
    client: "",
    summary: "",
    projectType: "건축공사",
    detailedType: "tile_work",
    exemptionRate: 100,
    orderVolumeRate: 100,
    contactRole: "공무",
    contactName: "000",
    contactPhoneRest: "5252-5252",
    contactEmailLocal: "5252",
  })

  // MISO 워크플로우 결과 텍스트 저장
  const [misoResult, setMisoResult] = useState<string>("")

  const [selectedConditions, setSelectedConditions] = useState<SelectedConditions>({
    tile_work: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
    framing_work: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
    finishing_work: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
    painting_work: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
    interior_woodwork: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
  })

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success" as "success" | "warning" | "error",
    onConfirm: undefined as (() => void) | undefined,
    onDelete: undefined as (() => void) | undefined,
    showDelete: false,
  })

  const [showPrintDialog, setShowPrintDialog] = useState(false)

  const showModal = useCallback((title: string, message: string, type: "success" | "warning" | "error", onConfirm?: () => void, onDelete?: () => void, showDelete?: boolean) => {
    setModalState({ isOpen: true, title, message, type, onConfirm, onDelete, showDelete: showDelete || false })
  }, [])

  const hideModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const handlePrint = useCallback(() => {
    setShowPrintDialog(true)
  }, [])

  const handleTempSave = useCallback(() => {
    const saveData = {
      projectInfo,
      selectedConditions,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem("quote-generator-temp-save", JSON.stringify(saveData))
    showModal("저장 완료", "현재 작업 내용이 임시 저장되었습니다.", "success")
  }, [projectInfo, selectedConditions, showModal])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header onPrint={handlePrint} onTempSave={handleTempSave} />

      <main className="flex-grow flex overflow-hidden">
        <ControlPanel
          projectInfo={projectInfo}
          setProjectInfo={setProjectInfo}
          selectedConditions={selectedConditions}
          setSelectedConditions={setSelectedConditions}
          showModal={showModal}
          onMisoResult={(text) => setMisoResult(text)}
        />

        <PreviewPanel projectInfo={projectInfo} selectedConditions={selectedConditions} setProjectInfo={setProjectInfo} misoResult={misoResult} />
      </main>

      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        onDelete={modalState.onDelete}
        showDelete={modalState.showDelete}
      />

      {/* Print Preview Dialog */}
      {showPrintDialog && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-full h-full flex flex-col">
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">인쇄 미리보기</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print()
                    setShowPrintDialog(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  인쇄하기
                </button>
                <button
                  onClick={() => setShowPrintDialog(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <PreviewPanel 
                projectInfo={projectInfo} 
                selectedConditions={selectedConditions} 
                setProjectInfo={setProjectInfo} 
                misoResult={misoResult}
                isPrintMode={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
