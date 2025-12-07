import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isOpen: true,
        registrationEnd: { gte: new Date() }
      },
      include: {
        academicYear: true,
        _count: {
          select: { applicants: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(courses)

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
