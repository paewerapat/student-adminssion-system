import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ExcelJS from 'exceljs'

// GET - Export summary statistics as Excel
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get statistics by course
    const courses = await prisma.course.findMany({
      include: {
        academicYear: true,
        _count: { select: { applicants: true } },
        applicants: {
          select: { status: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get statistics by status for each course
    const courseStats = courses.map(course => {
      const statusCounts = course.applicants.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        courseName: course.name,
        courseCode: course.code,
        academicYear: course.academicYear.name,
        capacity: course.capacity,
        total: course._count.applicants,
        submitted: statusCounts['SUBMITTED'] || 0,
        documentReview: statusCounts['DOCUMENT_REVIEW'] || 0,
        approved: statusCounts['APPROVED'] || 0,
        rejected: statusCounts['REJECTED'] || 0,
        examPassed: statusCounts['EXAM_PASSED'] || 0,
        examFailed: statusCounts['EXAM_FAILED'] || 0,
        enrolled: statusCounts['ENROLLED'] || 0,
      }
    })

    // Get room statistics
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

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'ระบบรับสมัครนักเรียน'
    workbook.created = new Date()

    // ========== Sheet 1: Course Summary ==========
    const courseSheet = workbook.addWorksheet('สถิติตามหลักสูตร')

    // Title
    courseSheet.mergeCells('A1:L1')
    courseSheet.getCell('A1').value = 'สรุปสถิติผู้สมัครตามหลักสูตร'
    courseSheet.getCell('A1').font = { bold: true, size: 16 }
    courseSheet.getCell('A1').alignment = { horizontal: 'center' }

    courseSheet.mergeCells('A2:L2')
    courseSheet.getCell('A2').value = `วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })}`
    courseSheet.getCell('A2').alignment = { horizontal: 'center' }

    // Header row
    const courseHeaderRow = courseSheet.getRow(4)
    courseHeaderRow.values = [
      'หลักสูตร', 'รหัส', 'ปีการศึกษา', 'จำนวนรับ', 'สมัครทั้งหมด',
      'ยื่นสมัคร', 'ตรวจเอกสาร', 'มีสิทธิ์สอบ', 'ไม่ผ่าน',
      'สอบผ่าน', 'สอบไม่ผ่าน', 'ลงทะเบียน'
    ]
    courseHeaderRow.font = { bold: true }
    courseHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    courseHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    courseHeaderRow.alignment = { horizontal: 'center' }

    // Set column widths
    courseSheet.columns = [
      { width: 18 }, { width: 12 }, { width: 15 }, { width: 12 }, { width: 14 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 10 },
      { width: 10 }, { width: 12 }, { width: 12 }
    ]

    // Data rows
    courseStats.forEach((stat, index) => {
      const row = courseSheet.getRow(5 + index)
      row.values = [
        stat.courseName, stat.courseCode, stat.academicYear, stat.capacity, stat.total,
        stat.submitted, stat.documentReview, stat.approved, stat.rejected,
        stat.examPassed, stat.examFailed, stat.enrolled
      ]
      row.alignment = { horizontal: 'center' }
    })

    // Totals row
    const totals = courseStats.reduce((acc, stat) => {
      acc.capacity += stat.capacity
      acc.total += stat.total
      acc.submitted += stat.submitted
      acc.documentReview += stat.documentReview
      acc.approved += stat.approved
      acc.rejected += stat.rejected
      acc.examPassed += stat.examPassed
      acc.examFailed += stat.examFailed
      acc.enrolled += stat.enrolled
      return acc
    }, {
      capacity: 0, total: 0, submitted: 0, documentReview: 0,
      approved: 0, rejected: 0, examPassed: 0, examFailed: 0, enrolled: 0
    })

    const totalRow = courseSheet.getRow(5 + courseStats.length)
    totalRow.values = [
      'รวมทั้งหมด', '', '', totals.capacity, totals.total,
      totals.submitted, totals.documentReview, totals.approved, totals.rejected,
      totals.examPassed, totals.examFailed, totals.enrolled
    ]
    totalRow.font = { bold: true }
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE699' }
    }
    totalRow.alignment = { horizontal: 'center' }

    // Add borders
    for (let rowNum = 4; rowNum <= 5 + courseStats.length; rowNum++) {
      const row = courseSheet.getRow(rowNum)
      for (let colNum = 1; colNum <= 12; colNum++) {
        const cell = row.getCell(colNum)
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    }

    // ========== Sheet 2: Room Summary ==========
    const roomSheet = workbook.addWorksheet('สถิติห้องสอบ')

    // Title
    roomSheet.mergeCells('A1:G1')
    roomSheet.getCell('A1').value = 'สรุปห้องสอบ'
    roomSheet.getCell('A1').font = { bold: true, size: 16 }
    roomSheet.getCell('A1').alignment = { horizontal: 'center' }

    // Header row
    const roomHeaderRow = roomSheet.getRow(3)
    roomHeaderRow.values = ['อาคาร', 'ห้อง', 'ชั้น', 'ความจุ', 'จำนวนผู้สอบ', 'เหลือที่ว่าง', 'สถานะ']
    roomHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    roomHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    }
    roomHeaderRow.alignment = { horizontal: 'center' }

    // Set column widths
    roomSheet.columns = [
      { width: 15 }, { width: 10 }, { width: 10 }, { width: 12 },
      { width: 14 }, { width: 14 }, { width: 12 }
    ]

    // Data rows
    rooms.forEach((room, index) => {
      const available = room.capacity - room._count.applicants
      const status = available <= 0 ? 'เต็ม' : available < 5 ? 'ใกล้เต็ม' : 'ว่าง'
      const row = roomSheet.getRow(4 + index)
      row.values = [
        room.building,
        room.roomNumber,
        room.floor || '-',
        room.capacity,
        room._count.applicants,
        available,
        status,
      ]
      row.alignment = { horizontal: 'center' }

      // Color code status
      const statusCell = row.getCell(7)
      if (status === 'เต็ม') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } }
      } else if (status === 'ใกล้เต็ม') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD93D' } }
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6BCB77' } }
      }
    })

    // Room totals
    const roomTotals = rooms.reduce((acc, room) => {
      acc.capacity += room.capacity
      acc.assigned += room._count.applicants
      return acc
    }, { capacity: 0, assigned: 0 })

    const roomTotalRow = roomSheet.getRow(4 + rooms.length)
    roomTotalRow.values = [
      'รวม', '', '', roomTotals.capacity, roomTotals.assigned,
      roomTotals.capacity - roomTotals.assigned, ''
    ]
    roomTotalRow.font = { bold: true }
    roomTotalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE699' }
    }
    roomTotalRow.alignment = { horizontal: 'center' }

    // Add borders
    for (let rowNum = 3; rowNum <= 4 + rooms.length; rowNum++) {
      const row = roomSheet.getRow(rowNum)
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

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const filename = `summary_report_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Error exporting summary:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
