import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Bulk approve applicants
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { applicantIds, courseId, status = 'APPROVED' } = body

    let whereClause: any = {}

    if (applicantIds && Array.isArray(applicantIds) && applicantIds.length > 0) {
      // Approve specific applicants
      whereClause.id = { in: applicantIds }
    } else if (courseId) {
      // Approve all submitted applicants in a course
      whereClause = {
        courseId,
        status: 'SUBMITTED'
      }
    } else {
      return NextResponse.json({ error: 'กรุณาระบุผู้สมัครหรือหลักสูตร' }, { status: 400 })
    }

    const result = await prisma.applicant.updateMany({
      where: whereClause,
      data: {
        status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedBy: status === 'APPROVED' ? session.user.id : null,
      }
    })

    return NextResponse.json({
      message: `อัพเดทสถานะสำเร็จ`,
      updatedCount: result.count
    })

  } catch (error) {
    console.error('Error approving applicants:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
