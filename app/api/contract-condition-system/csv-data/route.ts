import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'Contract_Clause.csv')
   
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'CSV 파일을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
   
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
   
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('CSV 데이터 로드 오류:', error)
    return NextResponse.json(
      { error: 'CSV 데이터를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
