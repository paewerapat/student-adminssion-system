import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Reset all exam room assignments
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    // Build where clause
    const whereClause: any = {
      examRoomId: { not: null }
    }

    if (courseId && courseId !== 'all') {
      whereClause.courseId = courseId
    }

    // Reset applicants' exam room assignments
    const result = await prisma.applicant.updateMany({
      where: whereClause,
      data: {
        examRoomId: null,
        seatNumber: null
      }
    })

    // Reset room current counts
    await prisma.examRoom.updateMany({
      data: {
        currentCount: 0,
        isFull: false
      }
    })

    // Recalculate room counts based on remaining assignments
    const roomCounts = await prisma.applicant.groupBy({
      by: ['examRoomId'],
      where: { examRoomId: { not: null } },
      _count: true
    })

    for (const rc of roomCounts) {
      if (rc.examRoomId) {
        await prisma.examRoom.update({
          where: { id: rc.examRoomId },
          data: { currentCount: rc._count }
        })
      }
    }

    return NextResponse.json({
      message: 'รีเซ็ตห้องสอบสำเร็จ',
      resetCount: result.count
    })

  } catch (error) {
    console.error('Error resetting exam rooms:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
