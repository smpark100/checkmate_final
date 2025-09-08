"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileDown, Settings, CheckCircle, Loader2, AlertTriangle } from "lucide-react"
import { type PDFExportOptions, defaultPDFOptions, exportToPDF, validateExportData } from "@/lib/pdf-export"

interface PDFExportDialogProps {
  isOpen: boolean
  onClose: () => void
  projectInfo: any
  selectedConditions: any
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function PDFExportDialog({
  isOpen,
  onClose,
  projectInfo,
  selectedConditions,
  onSuccess,
  onError,
}: PDFExportDialogProps) {
  const [options, setOptions] = useState<PDFExportOptions>(defaultPDFOptions)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const exportData = {
    projectInfo,
    selectedConditions,
    exportOptions: options,
    timestamp: new Date().toISOString(),
  }

  const validation = validateExportData(exportData)

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      await exportToPDF("previewDocument", exportData, setExportProgress)
      onSuccess("PDF 파일이 성공적으로 생성되었습니다.")
      onClose()
    } catch (error) {
      onError(error instanceof Error ? error.message : "PDF 생성 중 오류가 발생했습니다.")
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const updateOptions = (key: keyof PDFExportOptions, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const getTotalConditions = () => {
    const conditions = selectedConditions[projectInfo.detailedType] || {}
    return Object.values(conditions).reduce(
      (total: number, conditionList: any) => total + (conditionList?.length || 0),
      0,
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            PDF 내보내기
          </DialogTitle>
          <DialogDescription>견적조건서를 PDF 파일로 내보내기 위한 설정을 선택하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Status */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">{validation.isValid ? "내보내기 준비 완료" : "내보내기 전 확인 필요"}</span>
            </div>

            {!validation.isValid && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">다음 항목을 확인해주세요:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">프로젝트:</span>
                <span className="ml-2 font-medium">{projectInfo.name || "미입력"}</span>
              </div>
              <div>
                <span className="text-gray-600">선택된 조건:</span>
                <Badge variant="outline" className="ml-2">
                  {getTotalConditions()}개
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">공종:</span>
                <span className="ml-2">{projectInfo.projectType}</span>
              </div>
              <div>
                <span className="text-gray-600">세부공종:</span>
                <span className="ml-2">
                  {projectInfo.detailedType === "tile_work" && "타일 공사"}
                  {projectInfo.detailedType === "framing_work" && "골조 공사"}
                  {projectInfo.detailedType === "finishing_work" && "미장 공사"}
                  {projectInfo.detailedType === "painting_work" && "도장 공사"}
                  {projectInfo.detailedType === "interior_woodwork" && "내장 목공사"}
                </span>
              </div>
            </div>
          </Card>

          {/* Basic Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="format">용지 크기</Label>
              <Select value={options.format} onValueChange={(value: "a4" | "letter") => updateOptions("format", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 (210 × 297mm)</SelectItem>
                  <SelectItem value="letter">Letter (8.5 × 11in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="orientation">방향</Label>
              <Select
                value={options.orientation}
                onValueChange={(value: "portrait" | "landscape") => updateOptions("orientation", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">세로</SelectItem>
                  <SelectItem value="landscape">가로</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="template">템플릿</Label>
            <Select
              value={options.template}
              onValueChange={(value: "standard" | "compact" | "detailed") => updateOptions("template", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">표준 (권장)</SelectItem>
                <SelectItem value="compact">간소형</SelectItem>
                <SelectItem value="detailed">상세형</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options */}
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 p-0 h-auto"
            >
              <Settings className="h-4 w-4" />
              고급 설정 {showAdvanced ? "숨기기" : "보기"}
            </Button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 border rounded-lg bg-gray-50">
                <div>
                  <Label htmlFor="margin">여백 (인치)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[options.margin]}
                      onValueChange={([value]) => updateOptions("margin", value)}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.5"</span>
                      <span>{options.margin}"</span>
                      <span>2.0"</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="quality">이미지 품질</Label>
                  <div className="mt-2">
                    <Slider
                      value={[options.quality * 100]}
                      onValueChange={([value]) => updateOptions("quality", value / 100)}
                      max={100}
                      min={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>50%</span>
                      <span>{Math.round(options.quality * 100)}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHeader"
                      checked={options.includeHeader}
                      onCheckedChange={(checked) => updateOptions("includeHeader", checked)}
                    />
                    <Label htmlFor="includeHeader">헤더 포함</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeFooter"
                      checked={options.includeFooter}
                      onCheckedChange={(checked) => updateOptions("includeFooter", checked)}
                    />
                    <Label htmlFor="includeFooter">푸터 포함</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeWatermark"
                      checked={options.includeWatermark}
                      onCheckedChange={(checked) => updateOptions("includeWatermark", checked)}
                    />
                    <Label htmlFor="includeWatermark">워터마크 포함</Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">PDF 생성 중...</span>
                <span className="text-sm text-gray-500">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            취소
          </Button>
          <Button onClick={handleExport} disabled={!validation.isValid || isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                PDF 내보내기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
