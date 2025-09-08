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
    errors.push("현장명을 입력해주세요.")
  }

  if (!data.projectInfo.projectType.trim()) {
    errors.push("공종을 선택해주세요.")
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

export function sanitizeElementForPDF(element: HTMLElement): void {
  // Remove all CSS classes
  element.className = ""
  
  // Remove all child elements' CSS classes and problematic styles
  const allElements = element.querySelectorAll('*')
  allElements.forEach((el: Element) => {
    const htmlEl = el as HTMLElement
    
    // Remove all CSS classes
    htmlEl.className = ""
    
    // Force safe inline styles
    htmlEl.style.backgroundColor = htmlEl.style.backgroundColor.includes('oklch') ? '#ffffff' : htmlEl.style.backgroundColor
    htmlEl.style.color = htmlEl.style.color.includes('oklch') ? '#000000' : htmlEl.style.color
    htmlEl.style.borderColor = htmlEl.style.borderColor.includes('oklch') ? '#cccccc' : htmlEl.style.borderColor
    
    // Set basic safe styles
    if (!htmlEl.style.backgroundColor) htmlEl.style.backgroundColor = '#ffffff'
    if (!htmlEl.style.color) htmlEl.style.color = '#000000'
    if (!htmlEl.style.fontFamily) htmlEl.style.fontFamily = 'Arial, sans-serif'
  })
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

  // Store original values outside try block
  const originalStyle = element.style.cssText
  const originalClasses = element.className

  try {
    onProgress?.(10)

    // Dynamic import to avoid SSR issues
    const html2pdf = await import("html2pdf.js")
    onProgress?.(30)

    // Apply PDF-safe styles
    element.style.width = "210mm" // A4 width
    element.style.minHeight = "297mm" // A4 height
    element.style.padding = "20mm"
    element.style.boxSizing = "border-box"
    element.style.backgroundColor = "white"
    element.style.color = "black"
    element.style.fontFamily = "Arial, sans-serif"
    
    // Sanitize all elements to remove problematic CSS
    sanitizeElementForPDF(element)

    onProgress?.(50)

    const options = {
      margin: exportData.exportOptions.margin,
      filename: generateFileName(exportData.projectInfo, exportData.exportOptions.template),
      image: {
        type: "jpeg",
        quality: exportData.exportOptions.quality,
      },
      html2canvas: {
        scale: 1,
        useCORS: false,
        letterRendering: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
        removeContainer: true,
        foreignObjectRendering: false,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        ignoreElements: (element) => {
          // Skip elements with problematic styles
          const style = window.getComputedStyle(element)
          return style.backgroundColor.includes('oklch') || 
                 style.color.includes('oklch') || 
                 style.borderColor.includes('oklch')
        },
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

    // Add a small delay to ensure styles are applied
    await new Promise(resolve => setTimeout(resolve, 100))

    await html2pdf.default().from(element).set(options).save()

    onProgress?.(90)

    // Save export history
    try {
      const history = JSON.parse(localStorage.getItem("pdf-export-history") || "[]")
      history.unshift({
        ...exportData,
        exportedAt: new Date().toISOString(),
      })
      if (history.length > 20) {
        history.splice(20)
      }
      localStorage.setItem("pdf-export-history", JSON.stringify(history))
    } catch (storageError) {
      console.warn("Failed to save export history:", storageError)
    }

    onProgress?.(100)

  } catch (error) {
    console.error("PDF export error:", error)
    throw new Error(`PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  } finally {
    // Always restore original styles
    try {
      element.style.cssText = originalStyle
      element.className = originalClasses
    } catch (restoreError) {
      console.warn("Failed to restore original styles:", restoreError)
    }
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
