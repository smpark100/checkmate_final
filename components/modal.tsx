"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  title: string
  message: string
  type: "success" | "warning" | "error"
  onClose: () => void
  onConfirm?: () => void // 추가된 콜백 함수
  onDelete?: () => void // 삭제 콜백 함수
  showDelete?: boolean // 삭제 버튼 표시 여부
}

export function Modal({ isOpen, title, message, type, onClose, onConfirm, onDelete, showDelete }: ModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />
      case "error":
        return <XCircle className="h-12 w-12 text-red-500" />
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95">
        <div className="flex flex-col items-center justify-center space-y-4">
          {getIcon()}
          <h3 className="text-xl font-semibold text-center text-balance">{title}</h3>
          <p className="text-gray-600 text-center text-balance">{message}</p>
          <div className="flex gap-2 mt-4">
            {onConfirm && (
              <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
                확인
              </Button>
            )}
            {showDelete && onDelete && (
              <Button onClick={handleDelete} variant="destructive">
                삭제
              </Button>
            )}
            <Button onClick={onClose} variant={onConfirm || showDelete ? "outline" : "default"}>
              {onConfirm || showDelete ? "취소" : "확인"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
