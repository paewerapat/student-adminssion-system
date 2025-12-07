import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ExcelJS from 'exceljs'

// GET - Export exam sign-in sheet as Excel
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const roomId = searchParams.get('roomId')
    const allRooms = searchParams.get('allRooms') === 'true'

    if (!roomId && !allRooms) {
      return NextResponse.json({ error: 'กรุณาระบุห้องสอบ' }, { status: 400 })
    }

    // Get rooms
    const roomWhere: any = { isActive: true }
    if (roomId) roomWhere.id = roomId

    const rooms = await prisma.examRoom.findMany({
      where: roomWhere,
      include: {
        applicants: {
          where: { status: 'APPROVED' },
          orderBy: { seatNumber: 'asc' },
          select: {
            applicationNumber: true,
            nationalId: true,
            prefix: true,
            firstName: true,
            lastName: true,
            seatNumber: true,
            course: { select: { name: true } },
          }
        }
      },
      orderBy: [
        { building: 'asc' },
        { roomNumber: 'asc' }
      ]
    })

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'ระบบรับสมัครนักเรียน'
    workbook.created = new Date()

    for (const room of rooms) {
      const sheetName = `${room.building}-${room.roomNumber}`.substring(0, 31) // Excel max sheet name 31 chars
      const worksheet = workbook.addWorksheet(sheetName)

      // Title
      worksheet.mergeCells('A1:G1')
      worksheet.getCell('A1').value = 'ใบเซ็นชื่อเข้าห้องสอบ'
      worksheet.getCell('A1').font = { bold: true, size: 16 }
      worksheet.getCell('A1').alignment = { horizontal: 'center' }

      worksheet.mergeCells('A2:G2')
      worksheet.getCell('A2').value = `${room.building} ห้อง ${room.roomNumber}`
      worksheet.getCell('A2').font = { bold: true, size: 14 }
      worksheet.getCell('A2').alignment = { horizontal: 'center' }

      worksheet.mergeCells('A3:G3')
      worksheet.getCell('A3').value = `ชั้น ${room.floor || '-'} | จำนวนผู้เข้าสอบ: ${room.applicants.length} / ${room.capacity} คน`
      worksheet.getCell('A3').alignment = { horizontal: 'center' }

      // Empty row
      worksheet.getRow(4).height = 10

      // Header row
      const headerRow = worksheet.getRow(5)
      headerRow.values = ['ลำดับ', 'เลขที่นั่ง', 'เลขที่ใบสมัคร', 'ชื่อ-นามสกุล', 'หลักสูตร', 'ลายเซ็น', 'หมายเหตุ']
      headerRow.font = { bold: true }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      }
      headerRow.alignment = { horizontal: 'center' }

      // Set column widths
      worksheet.columns = [
        { width: 8 },   // ลำดับ
        { width: 10 },  // เลขที่นั่ง
        { width: 18 },  // เลขที่ใบสมัคร
        { width: 30 },  // ชื่อ-นามสกุล
        { width: 18 },  // หลักสูตร
        { width: 20 },  // ลายเซ็น
        { width: 15 },  // หมายเหตุ
      ]

      // Data rows
      room.applicants.forEach((applicant, index) => {
        const row = worksheet.getRow(6 + index)
        row.values = [
          index + 1,
          applicant.seatNumber,
          applicant.applicationNumber,
          `${applicant.prefix}${applicant.firstName} ${applicant.lastName}`,
          applicant.course.name,
          '', // ลายเซ็น (empty for print)
          '', // หมายเหตุ
        ]
        row.alignment = { vertical: 'middle' }
        row.height = 25 // Taller rows for signatures
      })

      // Add 3 spare rows
      const spareStartRow = 6 + room.applicants.length
      for (let i = 0; i < 3; i++) {
        const row = worksheet.getRow(spareStartRow + i)
        row.values = [i === 0 ? 'สำรอง' : '', '', '', '', '', '', '']
        row.height = 25
      }

      // Add borders to table
      const lastDataRow = spareStartRow + 2
      for (let rowNum = 5; rowNum <= lastDataRow; rowNum++) {
        const row = worksheet.getRow(rowNum)
        for (let colNum = 1; colNum <= 7; colNum++) {
          const cell = row.getCell(colNum)
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }

      // Footer - signature area
      const footerRow = lastDataRow + 2
      worksheet.mergeCells(`A${footerRow}:G${footerRow}`)
      worksheet.getCell(`A${footerRow}`).value = 'ลงชื่อ _________________________ ผู้คุมสอบ          วันที่ _________________________'
      worksheet.getCell(`A${footerRow}`).alignment = { horizontal: 'center' }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const filename = roomId 
      ? `exam_sheet_room_${rooms[0]?.roomNumber || 'unknown'}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `exam_sheet_all_rooms_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Error exporting exam sheet:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
