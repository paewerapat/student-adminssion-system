import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List all exam rooms
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rooms = await prisma.examRoom.findMany({
      include: {
        _count: {
          select: { applicants: true }
        }
      },
      orderBy: [
        { building: 'asc' },
        { roomNumber: 'asc' }
      ]
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching exam rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch exam rooms' }, { status: 500 })
  }
}

// POST - Create new exam room
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { roomNumber, building, floor, capacity } = body

    if (!roomNumber || !capacity) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
    }

    // Check duplicate room
    const existing = await prisma.examRoom.findFirst({
      where: { roomNumber, building: building || '' }
    })

    if (existing) {
      return NextResponse.json({ error: 'ห้องสอบนี้มีอยู่แล้ว' }, { status: 400 })
    }

    const room = await prisma.examRoom.create({
      data: {
        roomNumber,
        building: building || '',
        floor: floor || '',
        capacity: parseInt(capacity),
        isActive: true,
      }
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating exam room:', error)
    return NextResponse.json({ error: 'Failed to create exam room' }, { status: 500 })
  }
}
