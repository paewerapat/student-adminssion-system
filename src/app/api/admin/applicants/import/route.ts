import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Generate application number
function generateApplicationNumber(): string {
  const year = new Date().getFullYear() + 543
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `${year}-${random}`
}

// POST - Import applicants from CSV data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, courseId, academicYearId, setAsApproved = false } = body

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลสำหรับ import' }, { status: 400 })
    }

    if (!courseId || !academicYearId) {
      return NextResponse.json({ error: 'กรุณาเลือกหลักสูตรและปีการศึกษา' }, { status: 400 })
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of data) {
      try {
        // Required fields
        const nationalId = row.nationalId || row['เลขบัตรประชาชน'] || row['national_id']
        const firstName = row.firstName || row['ชื่อ'] || row['first_name']
        const lastName = row.lastName || row['นามสกุล'] || row['last_name']
        const prefix = row.prefix || row['คำนำหน้า'] || 'เด็กชาย'
        const gender = row.gender || row['เพศ'] || 'MALE'
        const birthDate = row.birthDate || row['วันเกิด'] || row['birth_date']

        if (!nationalId || !firstName || !lastName) {
          skipped++
          errors.push(`ข้อมูลไม่ครบ: ${nationalId || 'ไม่มีเลขบัตร'}`)
          continue
        }

        // Check duplicate
        const existing = await prisma.applicant.findFirst({
          where: { nationalId, academicYearId }
        })

        if (existing) {
          skipped++
          errors.push(`ซ้ำ: ${nationalId}`)
          continue
        }

        // Parse gender
        let genderValue = 'MALE'
        if (gender === 'หญิง' || gender === 'FEMALE' || gender === 'F') {
          genderValue = 'FEMALE'
        }

        // Parse birth date
        let birthDateValue = new Date()
        if (birthDate) {
          birthDateValue = new Date(birthDate)
        }

        // Create applicant
        await prisma.applicant.create({
          data: {
            applicationNumber: generateApplicationNumber(),
            nationalId: nationalId.toString().replace(/\D/g, ''),
            prefix,
            firstName,
            lastName,
            gender: genderValue,
            birthDate: birthDateValue,
            nationality: row.nationality || row['สัญชาติ'] || 'ไทย',
            phone: row.phone || row['โทรศัพท์'] || null,
            email: row.email || row['อีเมล'] || null,
            previousSchool: row.previousSchool || row['โรงเรียนเดิม'] || null,
            courseId,
            academicYearId,
            status: setAsApproved ? 'APPROVED' : 'SUBMITTED',
            submittedAt: new Date(),
            approvedAt: setAsApproved ? new Date() : null,
            approvedBy: setAsApproved ? session.user.id : null,
          }
        })

        imported++
      } catch (err: any) {
        skipped++
        errors.push(`Error: ${err.message}`)
      }
    }

    return NextResponse.json({
      message: 'Import สำเร็จ',
      imported,
      skipped,
      total: data.length,
      errors: errors.slice(0, 10) // Show first 10 errors only
    })

  } catch (error) {
    console.error('Error importing applicants:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
