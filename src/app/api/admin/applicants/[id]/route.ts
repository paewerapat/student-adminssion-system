import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get single applicant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: params.id },
      include: {
        course: true,
        examRoom: true,
        academicYear: true,
      }
    })

    if (!applicant) {
      return NextResponse.json({ error: 'ไม่พบผู้สมัคร' }, { status: 404 })
    }

    return NextResponse.json(applicant)

  } catch (error) {
    console.error('Error fetching applicant:', error)
    return NextResponse.json({ error: 'Failed to fetch applicant' }, { status: 500 })
  }
}

// PUT - Update applicant
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
    const { status, examRoomId, seatNumber, ...otherData } = body

    const updateData: any = { ...otherData }

    if (status) {
      updateData.status = status
      if (status === 'APPROVED') {
        updateData.approvedAt = new Date()
        updateData.approvedBy = session.user.id
      }
    }

    if (examRoomId !== undefined) {
      updateData.examRoomId = examRoomId
    }

    if (seatNumber !== undefined) {
      updateData.seatNumber = seatNumber
    }

    const applicant = await prisma.applicant.update({
      where: { id: params.id },
      data: updateData,
      include: {
        course: true,
        examRoom: true,
      }
    })

    return NextResponse.json(applicant)

  } catch (error) {
    console.error('Error updating applicant:', error)
    return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 })
  }
}

// DELETE - Delete applicant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get applicant to check exam room
    const applicant = await prisma.applicant.findUnique({
      where: { id: params.id }
    })

    if (!applicant) {
      return NextResponse.json({ error: 'ไม่พบผู้สมัคร' }, { status: 404 })
    }

    // If assigned to room, decrement count
    if (applicant.examRoomId) {
      await prisma.examRoom.update({
        where: { id: applicant.examRoomId },
        data: { currentCount: { decrement: 1 } }
      })
    }

    await prisma.applicant.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'ลบผู้สมัครสำเร็จ' })

  } catch (error) {
    console.error('Error deleting applicant:', error)
    return NextResponse.json({ error: 'Failed to delete applicant' }, { status: 500 })
  }
}
