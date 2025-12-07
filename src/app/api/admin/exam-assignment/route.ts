import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Auto assign exam rooms
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, sortBy = 'nationalId' } = body // sortBy: 'nationalId' | 'applicationNumber'

    // Get approved applicants without exam room
    const whereClause: any = {
      status: 'APPROVED',
      examRoomId: null,
    }
    
    if (courseId && courseId !== 'all') {
      whereClause.courseId = courseId
    }

    const applicants = await prisma.applicant.findMany({
      where: whereClause,
      orderBy: sortBy === 'nationalId' 
        ? { nationalId: 'asc' }
        : { applicationNumber: 'asc' }
    })

    if (applicants.length === 0) {
      return NextResponse.json({ 
        message: 'ไม่มีผู้สมัครที่ต้องจัดห้องสอบ',
        assigned: 0 
      })
    }

    // Get available exam rooms
    const rooms = await prisma.examRoom.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { applicants: true } }
      },
      orderBy: [
        { building: 'asc' },
        { roomNumber: 'asc' }
      ]
    })

    if (rooms.length === 0) {
      return NextResponse.json({ error: 'ไม่มีห้องสอบที่เปิดใช้งาน' }, { status: 400 })
    }

    // Calculate available seats per room
    const roomsWithSeats = rooms.map(room => ({
      ...room,
      currentCount: room._count.applicants,
      availableSeats: room.capacity - room._count.applicants
    })).filter(room => room.availableSeats > 0)

    if (roomsWithSeats.length === 0) {
      return NextResponse.json({ error: 'ห้องสอบทั้งหมดเต็มแล้ว' }, { status: 400 })
    }

    // Assignment logic
    let currentRoomIndex = 0
    let assignedCount = 0
    const assignments: { applicantId: string; roomId: string; seatNumber: number }[] = []

    for (const applicant of applicants) {
      // Find room with available seats
      while (currentRoomIndex < roomsWithSeats.length) {
        const room = roomsWithSeats[currentRoomIndex]
        
        if (room.availableSeats > 0) {
          // Calculate seat number (next available seat in this room)
          const seatNumber = room.currentCount + 1
          
          assignments.push({
            applicantId: applicant.id,
            roomId: room.id,
            seatNumber
          })

          // Update room tracking
          room.currentCount++
          room.availableSeats--
          assignedCount++
          break
        } else {
          // Room is full, move to next room
          currentRoomIndex++
        }
      }

      // No more rooms available
      if (currentRoomIndex >= roomsWithSeats.length) {
        break
      }
    }

    // Batch update applicants
    for (const assignment of assignments) {
      await prisma.applicant.update({
        where: { id: assignment.applicantId },
        data: {
          examRoomId: assignment.roomId,
          seatNumber: assignment.seatNumber
        }
      })
    }

    // Update room currentCount
    const roomCounts = assignments.reduce((acc, a) => {
      acc[a.roomId] = (acc[a.roomId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    for (const [roomId, count] of Object.entries(roomCounts)) {
      await prisma.examRoom.update({
        where: { id: roomId },
        data: {
          currentCount: { increment: count }
        }
      })
    }

    const notAssigned = applicants.length - assignedCount

    return NextResponse.json({
      message: 'จัดห้องสอบสำเร็จ',
      assigned: assignedCount,
      notAssigned,
      totalApplicants: applicants.length
    })

  } catch (error) {
    console.error('Error assigning exam rooms:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// GET - Get assignment summary
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalApproved,
      totalAssigned,
      totalUnassigned,
      rooms
    ] = await Promise.all([
      prisma.applicant.count({ where: { status: 'APPROVED' } }),
      prisma.applicant.count({ where: { status: 'APPROVED', examRoomId: { not: null } } }),
      prisma.applicant.count({ where: { status: 'APPROVED', examRoomId: null } }),
      prisma.examRoom.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { applicants: true } },
          applicants: {
            select: {
              id: true,
              applicationNumber: true,
              firstName: true,
              lastName: true,
              seatNumber: true,
            },
            orderBy: { seatNumber: 'asc' }
          }
        },
        orderBy: [
          { building: 'asc' },
          { roomNumber: 'asc' }
        ]
      })
    ])

    return NextResponse.json({
      summary: {
        totalApproved,
        totalAssigned,
        totalUnassigned
      },
      rooms: rooms.map(room => ({
        ...room,
        currentCount: room._count.applicants,
        availableSeats: room.capacity - room._count.applicants
      }))
    })

  } catch (error) {
    console.error('Error fetching assignment summary:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
