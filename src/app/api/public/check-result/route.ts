import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nationalId, birthDate } = body

    if (!nationalId || !birthDate) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
    }

    // Parse birth date
    const birthDateObj = new Date(birthDate)
    birthDateObj.setHours(0, 0, 0, 0)
    
    // Set end of day for comparison
    const birthDateEnd = new Date(birthDate)
    birthDateEnd.setHours(23, 59, 59, 999)

    const applicant = await prisma.applicant.findFirst({
      where: {
        nationalId,
        birthDate: {
          gte: birthDateObj,
          lte: birthDateEnd,
        }
      },
      select: {
        applicationNumber: true,
        prefix: true,
        firstName: true,
        lastName: true,
        status: true,
        seatNumber: true,
        course: {
          select: { name: true }
        },
        academicYear: {
          select: { name: true }
        },
        examRoom: {
          select: {
            roomNumber: true,
            building: true,
          }
        }
      }
    })

    if (!applicant) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      applicant,
    })

  } catch (error) {
    console.error('Error checking result:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
