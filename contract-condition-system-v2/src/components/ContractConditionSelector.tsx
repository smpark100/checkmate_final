"use client"

import { useState, useEffect } from "react"
import { ContractClause, UploadedImage, parseCSVData, getUniqueCategories, getImagePath } from "@/lib/contract-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, CheckCircle, AlertCircle, RefreshCw, Star, Image, Upload, X } from "lucide-react"

interface ContractConditionSelectorProps {
  onConditionsChange: (conditions: ContractClause[]) => void
}


// 각 계약조건별 이미지를 관리하기 위한 새로운 인터페이스
interface ConditionWithImages {
  conditionKey: string
  images: UploadedImage[]
}

export function ContractConditionSelector({ onConditionsChange }: ContractConditionSelectorProps) {
  const [clauses, setClauses] = useState<ContractClause[]>([])
  const [selectedWorkType, setSelectedWorkType] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("")
  const [selectedTag, setSelectedTag] = useState<string>("")
  const [selectedConditions, setSelectedConditions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  // 각 계약조건별 이미지 관리를 위한 새로운 상태
  const [conditionImages, setConditionImages] = useState<Map<string, UploadedImage[]>>(new Map())
  const [activeImageUpload, setActiveImageUpload] = useState<string | null>(null)

  // CSV 데이터 로드 함수
  const loadCSVData = async () => {
    try {
      setIsLoading(true)
      setError("")
      // 프로젝트 루트의 CSV 파일을 직접 읽기
      const response = await fetch('/api/csv-data')
      if (!response.ok) {
        throw new Error('CSV 파일을 불러올 수 없습니다.')
      }
      const csvText = await response.text()
      const parsedClauses = parseCSVData(csvText)
      setClauses(parsedClauses)
      
      // 디버깅: 로드된 데이터 확인
      console.log('로드된 총 데이터 수:', parsedClauses.length)
      console.log('공종별 데이터 수:', {
        미장조적공사: parsedClauses.filter(c => c.공종명 === '미장조적공사').length,
        석공사: parsedClauses.filter(c => c.공종명 === '석공사').length,
        방수공사: parsedClauses.filter(c => c.공종명 === '방수공사').length
      })
      
      // 미장조적공사 공통 데이터 상세 확인
      const 미장조적공사공통 = parsedClauses.filter(c => c.공종명 === '미장조적공사' && c.대분류 === '공통')
      console.log('미장조적공사 공통 데이터:', 미장조적공사공통.map(c => ({
        중분류: c.중분류,
        태그: c.태그,
        내용: c.내용.substring(0, 50) + '...'
      })))
      
      // 낙찰자결정이 포함된 데이터 찾기
      const 낙찰자결정데이터 = parsedClauses.filter(c => 
        c.중분류.includes('낙찰자결정') || 
        c.태그.includes('낙찰자결정') || 
        c.내용.includes('낙찰자결정')
      )
      console.log('낙찰자결정 관련 데이터:', 낙찰자결정데이터)
      
      // 동시입찰이 포함된 데이터 찾기
      const 동시입찰데이터 = parsedClauses.filter(c => c.태그.includes('동시입찰'))
      console.log('동시입찰 관련 데이터:', 동시입찰데이터)
      
      // 기본 공종 선택 (미장조적공사)
      setSelectedWorkType("미장조적공사")
    } catch (error) {
      console.error('CSV 데이터 로드 실패:', error)
      setError(error instanceof Error ? error.message : '데이터 로드 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    loadCSVData()
  }, [])

  // 공종 선택 시 카테고리 초기화
  useEffect(() => {
    if (selectedWorkType) {
      const categories = getUniqueCategories(clauses, selectedWorkType)
      if (categories.length > 0) {
        setSelectedCategory(categories[0])
      }
    }
  }, [selectedWorkType, clauses])

  // 대분류 선택 시 중분류 초기화
  useEffect(() => {
    if (selectedWorkType && selectedCategory) {
      const filteredSubCategories = [...new Set(
        clauses
          .filter(clause => 
            clause.공종명 === selectedWorkType && 
            clause.대분류 === selectedCategory
          )
          .map(clause => clause.중분류)
      )].sort()
      
      if (filteredSubCategories.length > 0) {
        setSelectedSubCategory(filteredSubCategories[0])
      }
    }
  }, [selectedWorkType, selectedCategory, clauses])

  // 중분류 선택 시 태그 초기화
  useEffect(() => {
    if (selectedWorkType && selectedCategory && selectedSubCategory) {
      const filteredTags = [...new Set(
        clauses
          .filter(clause => 
            clause.공종명 === selectedWorkType && 
            clause.대분류 === selectedCategory &&
            clause.중분류 === selectedSubCategory
          )
          .map(clause => clause.태그)
      )].sort()
      
      if (filteredTags.length > 0) {
        setSelectedTag(filteredTags[0])
      }
    }
  }, [selectedWorkType, selectedCategory, selectedSubCategory, clauses])

  // 선택된 조건이 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    const selectedClauses = clauses.filter(clause => 
      selectedConditions.has(`${clause.공종명}-${clause.중분류}-${clause.태그}-${clause.내용}`)
    ).map(clause => {
      const conditionKey = getConditionKey(clause)
      const uploadedImages = conditionImages.get(conditionKey) || []
      return {
        ...clause,
        uploadedImages
      }
    })
    onConditionsChange(selectedClauses)
  }, [selectedConditions, clauses, conditionImages, onConditionsChange])

  const categories = selectedWorkType ? getUniqueCategories(clauses, selectedWorkType) : []
  const subCategories = selectedWorkType && selectedCategory ? 
    [...new Set(
      clauses
        .filter(clause => 
          clause.공종명 === selectedWorkType && 
          clause.대분류 === selectedCategory
        )
        .map(clause => clause.중분류)
    )].sort() : []
  
  const tags = selectedWorkType && selectedCategory && selectedSubCategory ?
    [...new Set(
      clauses
        .filter(clause => 
          clause.공종명 === selectedWorkType && 
          clause.대분류 === selectedCategory &&
          clause.중분류 === selectedSubCategory
        )
        .map(clause => clause.태그)
    )].sort() : []

  const filteredClauses = selectedWorkType && selectedCategory && selectedSubCategory && selectedTag ?
    clauses.filter(clause => 
      clause.공종명 === selectedWorkType && 
      clause.대분류 === selectedCategory &&
      clause.중분류 === selectedSubCategory &&
      clause.태그 === selectedTag
    ) : []
  
  // 디버깅: 선택된 공종에 따른 필터링 결과 확인
  if (selectedWorkType) {
    console.log(`선택된 공종: ${selectedWorkType}`)
    console.log('대분류:', categories)
    if (selectedCategory) {
      console.log('선택된 대분류:', selectedCategory)
      console.log('중분류:', subCategories)
      
      // 미장조적공사, 공통의 경우 중분류 상세 확인
      if (selectedWorkType === '미장조적공사' && selectedCategory === '공통') {
        const commonClauses = clauses.filter(clause => 
          clause.공종명 === '미장조적공사' && clause.대분류 === '공통'
        )
        console.log('미장조적공사 공통 데이터:', commonClauses.map(c => ({ 중분류: c.중분류, 태그: c.태그 })))
        const uniqueSubCategories = [...new Set(commonClauses.map(c => c.중분류))].sort()
        console.log('실제 중분류 목록:', uniqueSubCategories)
      }
    }
    if (selectedSubCategory) {
      console.log('선택된 중분류:', selectedSubCategory)
      console.log('태그:', tags)
    }
    if (selectedTag) {
      console.log('선택된 태그:', selectedTag)
      console.log('필터링된 조건 수:', filteredClauses.length)
    }
  }

  const handleConditionToggle = (clause: ContractClause) => {
    const conditionKey = `${clause.공종명}-${clause.중분류}-${clause.태그}-${clause.내용}`
    setSelectedConditions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(conditionKey)) {
        newSet.delete(conditionKey)
      } else {
        newSet.add(conditionKey)
      }
      return newSet
    })
  }

  const isConditionSelected = (clause: ContractClause) => {
    const conditionKey = `${clause.공종명}-${clause.중분류}-${clause.태그}-${clause.내용}`
    return selectedConditions.has(conditionKey)
  }

  // 각 계약조건별 이미지 업로드 관련 함수들
  const handleConditionImageUpload = (conditionKey: string, files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const newImage: UploadedImage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file,
            preview: e.target?.result as string,
            description: ''
          }
          
          setConditionImages(prev => {
            const newMap = new Map(prev)
            const existingImages = newMap.get(conditionKey) || []
            newMap.set(conditionKey, [...existingImages, newImage])
            return newMap
          })
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeConditionImage = (conditionKey: string, imageId: string) => {
    setConditionImages(prev => {
      const newMap = new Map(prev)
      const existingImages = newMap.get(conditionKey) || []
      newMap.set(conditionKey, existingImages.filter(img => img.id !== imageId))
      return newMap
    })
  }

  const updateConditionImageDescription = (conditionKey: string, imageId: string, description: string) => {
    setConditionImages(prev => {
      const newMap = new Map(prev)
      const existingImages = newMap.get(conditionKey) || []
      newMap.set(conditionKey, existingImages.map(img => 
        img.id === imageId ? { ...img, description } : img
      ))
      return newMap
    })
  }

  const getConditionKey = (clause: ContractClause) => {
    return `${clause.공종명}-${clause.중분류}-${clause.태그}-${clause.내용}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>계약조건 데이터를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* 새로고침 버튼 */}
      <div className="flex justify-end">
        <Button 
          onClick={loadCSVData} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          데이터 새로고침
        </Button>
      </div>

      {/* 공종 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. 공종 선택
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="공종을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="미장조적공사">미장조적공사</SelectItem>
              <SelectItem value="석공사">석공사</SelectItem>
              <SelectItem value="방수공사">방수공사</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 세부공종 선택 */}
      {selectedWorkType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              2. 대분류
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="text-sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 중분류 선택 */}
      {selectedWorkType && selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              3. 중분류
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {subCategories.map((subCategory) => (
                <Button
                  key={subCategory}
                  variant={selectedSubCategory === subCategory ? "default" : "outline"}
                  onClick={() => setSelectedSubCategory(subCategory)}
                  className="text-sm"
                >
                  {subCategory}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 태그 선택 */}
      {selectedWorkType && selectedCategory && selectedSubCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              4. 태그
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  onClick={() => setSelectedTag(tag)}
                  className="text-sm"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 내용 선택 */}
      {selectedWorkType && selectedCategory && selectedSubCategory && selectedTag && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              5. 내용
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-3">
                {filteredClauses.map((clause, index) => {
                  const conditionKey = getConditionKey(clause)
                  const clauseImages = conditionImages.get(conditionKey) || []
                  
                  return (
                    <div key={index} className="border rounded-lg p-3 space-y-2 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          checked={isConditionSelected(clause)}
                          onCheckedChange={() => handleConditionToggle(clause)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {clause.중요표기 === '중요' && (
                              <Badge variant="destructive" className="text-xs text-white bg-red-600 hover:bg-red-700">
                                중요
                              </Badge>
                            )}
                            <span className="text-sm font-medium text-blue-600">{clause.태그}</span>
                            {/* 이미지 개수 표시 */}
                            {clauseImages.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Image className="h-3 w-3 mr-1" />
                                {clauseImages.length}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
                            {clause.중요표기 === '중요' && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                            )}
                            <span>{clause.내용}</span>
                          </p>
                          
                          {/* 기존 CSV 이미지 */}
                          {clause.이미지 && (
                            <div className="mt-2">
                              <img
                                src={getImagePath(clause.이미지)}
                                alt={clause.이미지}
                                className="max-w-full h-auto rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          
                          {/* 이미지 업로드 버튼 */}
                          <div className="mt-2 flex gap-2">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleConditionImageUpload(conditionKey, e.target.files)}
                              className="hidden"
                              id={`image-upload-${index}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Upload className="h-3 w-3" />
                              이미지 추가
                            </Button>
                          </div>
                          
                          {/* 업로드된 이미지 미리보기 */}
                          {clauseImages.length > 0 && (
                            <div className="mt-2 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                {clauseImages.map((image) => (
                                  <div key={image.id} className="relative border rounded p-1">
                                    <img
                                      src={image.preview}
                                      alt="업로드된 이미지"
                                      className="w-full h-16 object-cover rounded"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-0 right-0 h-4 w-4 p-0"
                                      onClick={() => removeConditionImage(conditionKey, image.id)}
                                    >
                                      <X className="h-2 w-2" />
                                    </Button>
                                    <input
                                      type="text"
                                      placeholder="설명"
                                      value={image.description || ''}
                                      onChange={(e) => updateConditionImageDescription(conditionKey, image.id, e.target.value)}
                                      className="w-full mt-1 px-1 py-0.5 text-xs border rounded"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {filteredClauses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>선택된 태그에 해당하는 조건이 없습니다.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 선택된 조건 요약 */}
      {selectedConditions.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              선택된 조건 ({selectedConditions.size}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full">
              <div className="space-y-2">
                {clauses
                  .filter(clause => isConditionSelected(clause))
                  .map((clause, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                      {clause.중요표기 === '중요' && (
                        <Badge variant="destructive" className="text-xs text-white bg-red-600 hover:bg-red-700">
                          중요
                        </Badge>
                      )}
                      <span className="text-sm flex-1 line-clamp-2 flex items-start gap-2">
                        {clause.중요표기 === '중요' && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span>{clause.내용}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConditionToggle(clause)}
                        className="text-red-500 hover:text-red-700"
                      >
                        제거
                      </Button>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
