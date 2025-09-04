export interface PDFExportOptions {
  format: "a4" | "letter"
  orientation: "portrait" | "landscape"
  margin: number
  includeHeader: boolean
  includeFooter: boolean
  includeWatermark: boolean
  quality: number
  template: "standard" | "compact" | "detailed"
}

export const defaultPDFOptions: PDFExportOptions = {
  format: "a4",
  orientation: "portrait",
  margin: 1,
  includeHeader: true,
  includeFooter: true,
  includeWatermark: false,
  quality: 0.98,
  template: "standard",
}

export interface ExportData {
  projectInfo: {
    name: string
    location: string
    client: string
    summary: string
    projectType: string
    detailedType: string
  }
  selectedConditions: any
  exportOptions: PDFExportOptions
  timestamp: string
}

export function validateExportData(data: ExportData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.projectInfo.name.trim()) {
    errors.push("프로젝트명을 입력해주세요.")
  }

  if (!data.projectInfo.location.trim()) {
    errors.push("공사위치를 입력해주세요.")
  }

  if (!data.projectInfo.client.trim()) {
    errors.push("발주처를 입력해주세요.")
  }

  // Check if at least one condition is selected
  const totalConditions = Object.values(data.selectedConditions[data.projectInfo.detailedType] || {}).reduce(
    (total: number, conditions: any) => total + (conditions?.length || 0),
    0,
  )

  if (totalConditions === 0) {
    errors.push("최소 하나 이상의 조건을 선택해주세요.")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function generateFileName(projectInfo: any, template: string): string {
  const date = new Date().toISOString().split("T")[0]
  const projectName = projectInfo.name.trim() || "견적조건서"
  const templateSuffix = template !== "standard" ? `_${template}` : ""

  return `${projectName}_견적조건서${templateSuffix}_${date}.pdf`
}

export async function exportToPDF(
  elementId: string,
  exportData: ExportData,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error("문서 요소를 찾을 수 없습니다.")
  }

  const validation = validateExportData(exportData)
  if (!validation.isValid) {
    throw new Error(validation.errors.join("\n"))
  }

  try {
    onProgress?.(10)

    // Dynamic import to avoid SSR issues
    const html2pdf = await import("html2pdf.js")
    onProgress?.(30)

    // Prepare the element for PDF export
    const originalStyle = element.style.cssText
    element.style.width = "210mm" // A4 width
    element.style.minHeight = "297mm" // A4 height
    element.style.padding = "20mm"
    element.style.boxSizing = "border-box"
    element.style.backgroundColor = "white"

    onProgress?.(50)

    const options = {
      margin: exportData.exportOptions.margin,
      filename: generateFileName(exportData.projectInfo, exportData.exportOptions.template),
      image: {
        type: "jpeg",
        quality: exportData.exportOptions.quality,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
      },
      jsPDF: {
        unit: "in",
        format: exportData.exportOptions.format,
        orientation: exportData.exportOptions.orientation,
        compress: true,
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
        before: ".page-break-before",
        after: ".page-break-after",
      },
    }

    onProgress?.(70)

    await html2pdf.default().from(element).set(options).save()

    onProgress?.(90)

    // Restore original styles
    element.style.cssText = originalStyle

    onProgress?.(100)

    // Save export history
    const history = JSON.parse(localStorage.getItem("pdf-export-history") || "[]")
    history.unshift({
      ...exportData,
      exportedAt: new Date().toISOString(),
    })
    if (history.length > 20) {
      history.splice(20)
    }
    localStorage.setItem("pdf-export-history", JSON.stringify(history))
  } catch (error) {
    // Restore original styles in case of error
    element.style.cssText = element.style.cssText
    throw error
  }
}

export function getExportHistory(): ExportData[] {
  try {
    return JSON.parse(localStorage.getItem("pdf-export-history") || "[]")
  } catch {
    return []
  }
}

export function clearExportHistory(): void {
  localStorage.removeItem("pdf-export-history")
}
