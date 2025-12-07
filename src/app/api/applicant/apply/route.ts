import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Generate application number
function generateApplicationNumber(): string {
  const year = new Date().getFullYear() + 543 // Buddhist year
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `${year}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }

    // Check if user already has an application
    const existingApplication = await prisma.applicant.findFirst({
      where: { userId: session.user.id }
    })

    if (existingApplication) {
      return NextResponse.json({ error: 'คุณสมัครเรียนแล้ว' }, { status: 400 })
    }

    const body = await request.json()
    const {
      courseId,
      nationalId,
      prefix,
      firstName,
      lastName,
      gender,
      birthDate,
      nationality,
      religion,
      phone,
      email,
      address,
      subDistrict,
      district,
      province,
      postalCode,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
      previousSchool,
      previousGrade,
      gpa,
    } = body

    // Validate required fields
    if (!courseId || !nationalId || !prefix || !firstName || !lastName || !gender || !birthDate) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 })
    }

    // Validate national ID
    if (nationalId.length !== 13) {
      return NextResponse.json({ error: 'เลขบัตรประชาชนไม่ถูกต้อง' }, { status: 400 })
    }

    // Check course exists and is open
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: { select: { applicants: true } }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'ไม่พบหลักสูตร' }, { status: 400 })
    }

    if (!course.isOpen) {
      return NextResponse.json({ error: 'หลักสูตรนี้ปิดรับสมัครแล้ว' }, { status: 400 })
    }

    if (course._count.applicants >= course.capacity) {
      return NextResponse.json({ error: 'หลักสูตรนี้เต็มแล้ว' }, { status: 400 })
    }

    // Check duplicate national ID
    const duplicateNationalId = await prisma.applicant.findFirst({
      where: { 
        nationalId,
        academicYearId: course.academicYearId
      }
    })

    if (duplicateNationalId) {
      return NextResponse.json({ error: 'เลขบัตรประชาชนนี้สมัครแล้ว' }, { status: 400 })
    }

    // Create application
    const applicant = await prisma.applicant.create({
      data: {
        applicationNumber: generateApplicationNumber(),
        userId: session.user.id,
        courseId,
        academicYearId: course.academicYearId,
        nationalId,
        prefix,
        firstName,
        lastName,
        gender,
        birthDate: new Date(birthDate),
        nationality: nationality || 'ไทย',
        religion,
        phone,
        email,
        address,
        subDistrict,
        district,
        province,
        postalCode,
        fatherName,
        fatherPhone,
        fatherOccupation,
        motherName,
        motherPhone,
        motherOccupation,
        previousSchool,
        previousGrade,
        gpa: gpa ? parseFloat(gpa) : null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        course: true,
        academicYear: true,
      }
    })

    return NextResponse.json({
      message: 'สมัครเรียนสำเร็จ',
      applicant: {
        id: applicant.id,
        applicationNumber: applicant.applicationNumber,
        status: applicant.status,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
