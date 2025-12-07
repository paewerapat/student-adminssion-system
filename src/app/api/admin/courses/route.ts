import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List all courses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const academicYearId = searchParams.get('academicYearId')

    const courses = await prisma.course.findMany({
      where: academicYearId ? { academicYearId } : undefined,
      include: {
        academicYear: true,
        _count: {
          select: { applicants: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

// POST - Create new course
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, description, capacity, registrationStart, registrationEnd, isOpen, academicYearId } = body

    if (!code || !name || !capacity || !academicYearId) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
    }

    // Check duplicate code
    const existing = await prisma.course.findFirst({
      where: { code, academicYearId }
    })

    if (existing) {
      return NextResponse.json({ error: 'รหัสหลักสูตรนี้มีอยู่แล้ว' }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
        description,
        capacity: parseInt(capacity),
        registrationStart: new Date(registrationStart),
        registrationEnd: new Date(registrationEnd),
        isOpen: isOpen ?? false,
        academicYearId,
      },
      include: { academicYear: true }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}
