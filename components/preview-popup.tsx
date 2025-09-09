"use client";

import { useMemo, useState, useEffect } from "react";

interface ProjectInfo {
  name: string;
  location: string;
  client: string;
  summary: string;
  projectType: string;
  detailedType: string;
  exemptionRate?: number;
  orderVolumeRate?: number;
  contactRole?: string;
  contactName?: string;
  contactPhoneRest?: string;
  contactEmailLocal?: string;
  docsUrl?: string;
  docsPassword?: string;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  description?: string;
}

interface Condition {
  id: string;
  text: string;
  isForced?: boolean;
  uploadedImages?: UploadedImage[];
}

type ConditionBuckets = {
  basic: Condition[];
  construction: Condition[];
  safety: Condition[];
  quality: Condition[];
  custom: Condition[];
};

interface PreviewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  projectInfo: ProjectInfo;
  selectedConditions: {
    [key: string]: ConditionBuckets | undefined;
  };
  setProjectInfo?: (info: ProjectInfo) => void;
  misoResult?: string;
}

const EMPTY_BUCKETS: ConditionBuckets = {
  basic: [],
  construction: [],
  safety: [],
  quality: [],
  custom: [],
};

export function PreviewPopup({ 
  isOpen, 
  onClose, 
  projectInfo, 
  selectedConditions, 
  setProjectInfo, 
  misoResult 
}: PreviewPopupProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleDateString("ko-KR") + " " + now.toLocaleTimeString("ko-KR"));
  }, []);

  const currentConditions = useMemo<ConditionBuckets>(() => {
    return selectedConditions[projectInfo.detailedType] ?? EMPTY_BUCKETS;
  }, [selectedConditions, projectInfo.detailedType]);

  const today = useMemo(() => new Date(), []);

  const detailedTypeLabel = useMemo(() => {
    switch (projectInfo.detailedType) {
      case "tile_work":
        return "타일공사";
      case "framing_work":
        return "골조공사";
      case "finishing_work":
        return "미장조적공사";
      case "painting_work":
        return "도장공사";
      case "interior_woodwork":
        return "내장목공사";
      default:
        return projectInfo.projectType || "공종";
    }
  }, [projectInfo.detailedType, projectInfo.projectType]);

  const totalConditions = useMemo(() => {
    return (Object.values(currentConditions) as Condition[][])
      .reduce((total, arr) => total + arr.length, 0);
  }, [currentConditions]);

  const suppliedMaterialsByType = useMemo(() => {
    const typeKorean = projectInfo.projectType || "";
    if (projectInfo.detailedType === "finishing_work" || /미장공사/.test(typeKorean)) {
      return "공사용 용수/전력(단, 협력사사무실 전력 제외), 타워크레인, 건설용리프트, 레미탈, 철근, 벌크시멘트, 단열재(단, 비드법단열재는 \"수급사업자\"의 지입자재임.)";
    }
    if (/석공사|방수공사/.test(typeKorean)) {
      return "공사용 용수/전력(단, 협력사사무실 전력 제외), 건설용리프트, 시멘트";
    }
    return "공사용 용수/전력(단, 협력사사무실 전력 제외), 건설용리프트, 시멘트";
  }, [projectInfo.projectType, projectInfo.detailedType]);

  // 이미지 렌더링 함수
  const renderImages = (images: UploadedImage[]) => {
    if (!images || images.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-2">
        <div className="text-sm font-medium text-gray-600">첨부 이미지:</div>
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative">
              <img
                src={image.preview}
                alt={image.description || "업로드된 이미지"}
                className="w-20 h-20 object-cover rounded border border-gray-300"
              />
              {image.description && (
                <div className="text-xs text-gray-500 mt-1 max-w-20 truncate">
                  {image.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };


  // 팝업이 열리면 자동으로 인쇄 대화상자 실행
  useEffect(() => {
    if (isOpen) {
      // 약간의 지연을 두고 인쇄 대화상자 실행
      const timer = setTimeout(() => {
        window.print();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 인쇄 완료 후 팝업 닫기
  useEffect(() => {
    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 인쇄용 스타일 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        `
      }} />
      
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        {/* 미리보기 내용 */}
        <div className="print-content p-0 m-0">
          <div id="previewDocument" className="bg-white p-4 max-w-4xl mx-auto min-h-full">

            {/* 1. 현장 일반사항 */}
            <div className="mb-6">
              <h2 className="font-bold text-lg">1. 현장 일반사항</h2>
              <div className="space-y-2 mt-3 text-sm leading-6">
                <div className="text-pretty pl-6">
                  <span className="font-medium">1)</span> 본 입찰의 현장설명회는 On-line으로만 진행하며, 별도 Off-line 현장설명회가 진행되지 않으므로, 견적조건을 포함한 입찰안내 서류를 면밀히 숙지하고 투찰한다.
                </div>
                <div className="text-pretty pl-6">
                  <span className="font-medium">2)</span> [발주 물량 공지] 금회 발주 물량은 전체 예상 물량의 약
                  {" "}
                  {typeof setProjectInfo === "function" ? (
                    <>
                      <input
                        type="number"
                        min={60}
                        max={100}
                        step={10}
                        value={Number(projectInfo.orderVolumeRate ?? 100)}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          const snapped = Math.round(value / 10) * 10;
                          const clamped = Math.max(60, Math.min(100, isNaN(snapped) ? 60 : snapped));
                          setProjectInfo({ ...projectInfo, orderVolumeRate: clamped });
                        }}
                        className="mx-1 h-6 w-20 border border-gray-300 rounded px-1 text-sm bg-yellow-100/60 align-baseline"
                      />
                      %
                    </>
                  ) : (
                    <strong className="mx-1">{String(projectInfo.orderVolumeRate ?? 100)}%</strong>
                  )}
                  {" "}
                  수준이며, 내역 확정 후 증감수량은 변경계약을 통하여 반영예정임
                </div>
                <div className="text-pretty pl-6">
                  <span className="font-medium">3)</span> 지급자재 : {suppliedMaterialsByType}
                </div>
                <div className="text-pretty pl-6">
                  <span className="font-medium">4)</span> 담당자 : 
                  {typeof setProjectInfo === "function" ? (
                    <>
                      <input
                        className="mx-1 h-5 w-12 border border-gray-300 rounded px-1 bg-yellow-100/60 text-xs"
                        placeholder="역할"
                        value={projectInfo.contactRole ?? ""}
                        onChange={(e) => setProjectInfo({ ...projectInfo, contactRole: e.target.value })}
                      />
                      <input
                        className="mx-1 h-5 w-20 border border-gray-300 rounded px-1 text-xs"
                        placeholder="이름"
                        value={projectInfo.contactName ?? ""}
                        onChange={(e) => setProjectInfo({ ...projectInfo, contactName: e.target.value })}
                      />
                      전임(연락처 : 010-
                      <input
                        className="mx-1 h-5 w-20 border border-gray-300 rounded px-1 text-xs"
                        placeholder="전화뒷자리"
                        value={projectInfo.contactPhoneRest ?? ""}
                        onChange={(e) => setProjectInfo({ ...projectInfo, contactPhoneRest: e.target.value })}
                      />
                      / 이메일 : 
                      <input
                        className="mx-1 h-5 w-20 border border-gray-300 rounded px-1 text-xs"
                        placeholder="이메일ID"
                        value={projectInfo.contactEmailLocal ?? ""}
                        onChange={(e) => setProjectInfo({ ...projectInfo, contactEmailLocal: e.target.value })}
                      />
                      @gsenc.com)
                    </>
                  ) : (
                    `${projectInfo.contactRole ?? "공무"} ${projectInfo.contactName ?? "000"} 전임(연락처 : 010-${projectInfo.contactPhoneRest ?? "5252-5252"} / 이메일 : ${projectInfo.contactEmailLocal ?? "5252"}@gsenc.com)`
                  )}
                </div>
              </div>
            </div>

            {/* 2. VAT 금액 산정 */}
            <div className="mb-6">
              <h2 className="font-bold text-lg">2. VAT 금액 산정</h2>
              <div className="mt-3 text-sm space-y-3">
                {/* 1) 아파트 면세율 */}
                <div className="flex items-center gap-2 pl-6">
                  <div>1) 아파트 면세율 :</div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={Number(projectInfo.exemptionRate ?? 83.99)}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
                      setProjectInfo?.({ ...projectInfo, exemptionRate: clamped });
                    }}
                    className="h-7 w-24 border border-gray-300 rounded px-2 text-sm bg-yellow-100/60"
                  />
                  <span>%</span>
                </div>

                {/* 2) 면세 적용에 따른 VAT 금액 산출 */}
                <div className="pl-6">2) 면세 적용에 따른 VAT 금액 산출</div>

                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-2 divide-x">
                    {/* 면세 */}
                    <div className="p-0">
                      <div className="bg-gray-50 border-b p-2 text-center font-semibold">면세</div>
                      <div className="p-3 space-y-2">
                        <div>"아파트+주차장+부속동"의 직접비 계</div>
                        <div>X 아파트면세율({(projectInfo.exemptionRate ?? 0).toFixed(2)}%) X 0%</div>
                      </div>
                    </div>
                    {/* 과세 */}
                    <div className="p-0">
                      <div className="bg-gray-50 border-b p-2 text-center font-semibold">과세</div>
                      <div className="p-3 space-y-2">
                        <div>1) "아파트+주차장+부속동"의 직접비 계</div>
                        <div>
                          X (100% - 아파트면세율({(projectInfo.exemptionRate ?? 0).toFixed(2)}%)) X 10%
                        </div>
                        <div>2) 상가 직접비 X 10%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  * 간접비는 직접비총액 중 과세금액(아파트+주차장+부속동 과세금액 및 상가금액) 비율 적용
                </div>
              </div>
            </div>

            {/* 3. 하자보증기간 안내 */}
            <div className="mb-6">
              <h2 className="font-bold text-lg">3. 하자보증기간 안내</h2>
              <div className="mt-3 text-sm pl-6">
                <div>• 공동주택 2년</div>
              </div>
            </div>

            {/* 4. 설계도서 및 기술자료 열람 */}
            <div className="mb-6">
              <h2 className="font-bold text-lg">4. 설계도서 및 기술자료 열람</h2>
              <div className="mt-3 text-sm space-y-2 pl-6">
                <div className="text-pretty">
                  <span className="font-medium">1)</span> 아래 URL을 통해 실시설계 자료를 확인한다.
                </div>
                <div className="text-pretty">
                  <span className="font-medium">2)</span> URL: {projectInfo.docsUrl ? (
                    <a href={projectInfo.docsUrl} target="_blank" rel="noreferrer noopener" className="text-blue-600 underline">{projectInfo.docsUrl}</a>
                  ) : (
                    <span className="text-gray-400">미등록</span>
                  )}
                </div>
                <div className="text-pretty">
                  <span className="font-medium">3)</span> 패스워드: {projectInfo.docsPassword ?? <span className="text-gray-400">미등록</span>}
                </div>
              </div>
            </div>

            {/* 5. 현장 기본조건 */}
            <div className="mb-6">
              <h2 className="font-bold text-lg">5. 현장 기본조건</h2>
              <div className="space-y-4 mt-3 text-sm leading-6">
                {/* 기본 조건들 */}
                {currentConditions.basic.length > 0 ? (
                  currentConditions.basic.map((c, i) => (
                    <div key={c.id || String(i)} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="text-pretty">
                        <span className="font-medium">{i + 1})</span> {c.text}
                      </div>
                      {/* 이미지 표시 */}
                      {c.uploadedImages && renderImages(c.uploadedImages)}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 pl-6">좌측 패널에서 기본조건을 선택하세요.</div>
                )}
                
                {/* 현장 특수조건들 (custom 조건들) */}
                {currentConditions.custom.length > 0 && (
                  <>
                    {currentConditions.custom.map((c, i) => (
                      <div key={c.id || String(i)} className={`border-l-4 border-yellow-400 pl-4 py-2 ${c.isForced ? 'bg-yellow-100 px-2 py-1 rounded' : ''}`}>
                        <div className="text-pretty">
                          <span className="font-medium">{currentConditions.basic.length + i + 1})</span> {c.text}
                        </div>
                        {/* 이미지 표시 */}
                        {c.uploadedImages && renderImages(c.uploadedImages)}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* 하단 생성 정보 */}
            <div className="mt-10 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              <div>본 견적조건서는 견적 조건서 생성기를 통해 생성되었습니다.</div>
              <div>생성일시: {currentTime || "로딩 중..."}</div>
              <div>총 조건 수: {totalConditions}개</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
