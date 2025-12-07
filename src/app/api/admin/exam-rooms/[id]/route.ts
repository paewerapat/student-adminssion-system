import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get single exam room
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const room = await prisma.examRoom.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { applicants: true } }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'ไม่พบห้องสอบ' }, { status: 404 })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching exam room:', error)
    return NextResponse.json({ error: 'Failed to fetch exam room' }, { status: 500 })
  }
}

// PUT - Update exam room
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
    const { roomNumber, building, floor, capacity, isActive } = body

    const room = await prisma.examRoom.update({
      where: { id: params.id },
      data: {
        roomNumber,
        building,
        floor,
        capacity: parseInt(capacity),
        isActive,
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error updating exam room:', error)
    return NextResponse.json({ error: 'Failed to update exam room' }, { status: 500 })
  }
}

// DELETE - Delete exam room
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if room has applicants assigned
    const room = await prisma.examRoom.findUnique({
      where: { id: params.id },
      include: { _count: { select: { applicants: true } } }
    })

    if (room?._count.applicants && room._count.applicants > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบห้องสอบที่มีผู้สมัครได้' },
        { status: 400 }
      )
    }

    await prisma.examRoom.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'ลบห้องสอบสำเร็จ' })
  } catch (error) {
    console.error('Error deleting exam room:', error)
    return NextResponse.json({ error: 'Failed to delete exam room' }, { status: 500 })
  }
}
