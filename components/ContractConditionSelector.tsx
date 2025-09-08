'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Star, RefreshCw } from 'lucide-react'
import { ContractClause, ContractConditionSelectorProps, UploadedImage } from '@/lib/types'
import { parseCSVData, getUniqueCategories, getUniqueSubCategories, getUniqueTags, getFilteredClauses, getWorkTypes } from '@/lib/parser'
import { getImagePath, formatFileSize, generateId, createImagePreview, validateImageFile } from '@/lib/contract-utils'

export function ContractConditionSelector({ onConditionsChange }: ContractConditionSelectorProps) {
  const [clauses, setClauses] = useState<ContractClause[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 필터 상태
  const [selectedWorkType, setSelectedWorkType] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')

  // 선택된 조건들
  const [selectedConditions, setSelectedConditions] = useState<ContractClause[]>([])

  // 이미지 업로드 상태
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: UploadedImage[] }>({})

  // CSV 데이터 로드
  const loadCSVData = async () => {
    try {
      setLoading(true)
      setError(null)
     
      const response = await fetch('/api/contract-condition-system/csv-data')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
     
      const csvText = await response.text()
      console.log('CSV 텍스트 길이:', csvText.length)
      console.log('CSV 첫 500자:', csvText.substring(0, 500))
      
      const parsedData = parseCSVData(csvText)
      console.log('파싱된 데이터 개수:', parsedData.length)
      console.log('첫 번째 데이터:', parsedData[0])
      
      setClauses(parsedData)
     
      // 첫 번째 공종으로 초기화
      const workTypes = getWorkTypes(parsedData)
      console.log('사용 가능한 공종들:', workTypes)
      if (workTypes.length > 0) {
        setSelectedWorkType(workTypes[0])
      }
    } catch (err) {
      console.error('CSV 데이터 로드 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCSVData()
  }, [])

  // 필터 옵션들
  const workTypes = getWorkTypes(clauses)
  const categories = getUniqueCategories(clauses, selectedWorkType)
  const subCategories = getUniqueSubCategories(clauses, selectedWorkType, selectedCategory)
  const tags = getUniqueTags(clauses, selectedWorkType, selectedCategory, selectedSubCategory)
  const filteredClauses = getFilteredClauses(clauses, selectedWorkType, selectedCategory, selectedSubCategory, selectedTag)

  // 조건 선택/해제
  const toggleCondition = (clause: ContractClause) => {
    const isSelected = selectedConditions.some(c => c.공종코드 === clause.공종코드 && c.내용 === clause.내용)
   
    if (isSelected) {
      setSelectedConditions(prev => prev.filter(c => !(c.공종코드 === clause.공종코드 && c.내용 === clause.내용)))
    } else {
      setSelectedConditions(prev => [...prev, clause])
    }
  }

  // 이미지 업로드
  const handleImageUpload = async (clause: ContractClause, files: FileList) => {
    const clauseKey = `${clause.공종코드}-${clause.내용}`
    const newImages: UploadedImage[] = []
   
    for (const file of Array.from(files)) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        continue
      }

      try {
        const preview = await createImagePreview(file)
        const id = generateId()
        newImages.push({ id, file, preview })
      } catch (error) {
        console.error('이미지 미리보기 생성 실패:', error)
      }
    }
   
    setUploadingImages(prev => ({
      ...prev,
      [clauseKey]: [...(prev[clauseKey] || []), ...newImages]
    }))
  }

  // 이미지 삭제
  const removeImage = (clause: ContractClause, imageId: string) => {
    const clauseKey = `${clause.공종코드}-${clause.내용}`
    setUploadingImages(prev => ({
      ...prev,
      [clauseKey]: (prev[clauseKey] || []).filter(img => img.id !== imageId)
    }))
  }

  // 선택된 조건 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    const conditionsWithImages = selectedConditions.map(condition => {
      const clauseKey = `${condition.공종코드}-${condition.내용}`
      const uploadedImages = uploadingImages[clauseKey] || []
      return {
        ...condition,
        uploadedImages
      }
    })
    onConditionsChange(conditionsWithImages)
  }, [selectedConditions, uploadingImages, onConditionsChange])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>데이터를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button onClick={loadCSVData} className="ml-2" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            다시 시도
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* 새로고침 버튼 */}
      <div className="flex justify-end">
        <Button onClick={loadCSVData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          데이터 새로고침
        </Button>
      </div>

      {/* 필터링 UI */}
      <Card>
        <CardHeader>
          <CardTitle>계약조건 선택</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 공종 선택 */}
          <div>
            <label className="text-sm font-medium mb-2 block">공종</label>
            <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
              <SelectTrigger>
                <SelectValue placeholder="공종을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {workTypes.map(workType => (
                  <SelectItem key={workType} value={workType}>
                    {workType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 대분류 선택 */}
          {selectedWorkType && (
            <div>
              <label className="text-sm font-medium mb-2 block">대분류</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="대분류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 중분류 선택 */}
          {selectedCategory && (
            <div>
              <label className="text-sm font-medium mb-2 block">중분류</label>
              <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="중분류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map(subCategory => (
                    <SelectItem key={subCategory} value={subCategory}>
                      {subCategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 태그 선택 */}
          {selectedSubCategory && (
            <div>
              <label className="text-sm font-medium mb-2 block">태그</label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="태그를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map(tag => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 조건 목록 */}
      {selectedTag && (
        <Card>
          <CardHeader>
            <CardTitle>계약조건 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredClauses.map((clause, index) => {
                  const isSelected = selectedConditions.some(c => c.공종코드 === clause.공종코드 && c.내용 === clause.내용)
                  const clauseKey = `${clause.공종코드}-${clause.내용}`
                  const images = uploadingImages[clauseKey] || []
                 
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCondition(clause)}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            {clause.중요표기 === '중요' && (
                              <Star className="h-4 w-4 text-red-500 fill-current" />
                            )}
                            <span className="font-medium">{clause.내용}</span>
                            {clause.중요표기 === '중요' && (
                              <Badge variant="destructive" className="text-xs">중요</Badge>
                            )}
                          </div>
                         
                          {/* 이미지 업로드 */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => e.target.files && handleImageUpload(clause, e.target.files)}
                                className="hidden"
                                id={`image-upload-${index}`}
                              />
                              <label htmlFor={`image-upload-${index}`}>
                                <Button variant="outline" size="sm" asChild>
                                  <span>
                                    <Upload className="h-4 w-4 mr-1" />
                                    이미지 업로드
                                  </span>
                                </Button>
                              </label>
                              {images.length > 0 && (
                                <Badge variant="secondary">{images.length}개</Badge>
                              )}
                            </div>
                           
                            {/* 업로드된 이미지 미리보기 */}
                            {images.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {images.map(image => (
                                  <div key={image.id} className="relative">
                                    <img
                                      src={image.preview}
                                      alt="업로드된 이미지"
                                      className="w-16 h-16 object-cover rounded border"
                                    />
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                      onClick={() => removeImage(clause, image.id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 선택된 조건 요약 */}
      {selectedConditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>선택된 계약조건 ({selectedConditions.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 overflow-y-auto">
              <div className="space-y-2">
                {selectedConditions.map((condition, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {condition.중요표기 === '중요' && (
                          <Star className="h-4 w-4 text-red-500 fill-current" />
                        )}
                        <span className="text-sm">{condition.내용}</span>
                        {condition.중요표기 === '중요' && (
                          <Badge variant="destructive" className="text-xs">중요</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}