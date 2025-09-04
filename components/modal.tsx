"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  title: string
  message: string
  type: "success" | "warning" | "error"
  onClose: () => void
}

export function Modal({ isOpen, title, message, type, onClose }: ModalProps) {
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

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95">
        <div className="flex flex-col items-center justify-center space-y-4">
          {getIcon()}
          <h3 className="text-xl font-semibold text-center text-balance">{title}</h3>
          <p className="text-gray-600 text-center text-balance">{message}</p>
          <Button onClick={onClose} className="mt-4">
            확인
          </Button>
        </div>
      </div>
    </div>
  )
}
