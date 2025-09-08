import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // 프로젝트 루트의 Contract_Clause.csv 파일 읽기
    const csvPath = path.join(process.cwd(), 'Contract_Clause.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('CSV 파일 읽기 오류:', error)
    return new NextResponse('CSV 파일을 읽을 수 없습니다.', { status: 500 })
  }
}
