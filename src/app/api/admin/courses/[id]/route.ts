import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get single course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        academicYear: true,
        _count: { select: { applicants: true } }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'ไม่พบหลักสูตร' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

// PUT - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, description, capacity, registrationStart, registrationEnd, isOpen } = body

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        code,
        name,
        description,
        capacity: parseInt(capacity),
        registrationStart: new Date(registrationStart),
        registrationEnd: new Date(registrationEnd),
        isOpen,
      },
      include: { academicYear: true }
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

// DELETE - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if course has applicants
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: { _count: { select: { applicants: true } } }
    })

    if (course?._count.applicants && course._count.applicants > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบหลักสูตรที่มีผู้สมัครได้' },
        { status: 400 }
      )
    }

    await prisma.course.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'ลบหลักสูตรสำเร็จ' })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
