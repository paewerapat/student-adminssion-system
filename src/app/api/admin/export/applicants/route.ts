import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ExcelJS from 'exceljs'

// GET - Export applicants as Excel
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}
    if (courseId) where.courseId = courseId
    if (status) where.status = status

    const applicants = await prisma.applicant.findMany({
      where,
      include: {
        course: { select: { name: true, code: true } },
        examRoom: { select: { roomNumber: true, building: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: [
        { course: { name: 'asc' } },
        { applicationNumber: 'asc' }
      ]
    })

    // Status labels
    const statusLabels: Record<string, string> = {
      DRAFT: 'ร่าง',
      SUBMITTED: 'ยื่นสมัครแล้ว',
      DOCUMENT_REVIEW: 'ตรวจเอกสาร',
      APPROVED: 'มีสิทธิ์สอบ',
      REJECTED: 'ไม่ผ่าน',
      EXAM_PASSED: 'สอบผ่าน',
      EXAM_FAILED: 'สอบไม่ผ่าน',
      ENROLLED: 'ลงทะเบียนแล้ว',
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'ระบบรับสมัครนักเรียน'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('รายชื่อผู้สมัคร')

    // Define columns
    worksheet.columns = [
      { header: 'ลำดับ', key: 'no', width: 8 },
      { header: 'เลขที่ใบสมัคร', key: 'applicationNumber', width: 18 },
      { header: 'เลขบัตรประชาชน', key: 'nationalId', width: 18 },
      { header: 'คำนำหน้า', key: 'prefix', width: 12 },
      { header: 'ชื่อ', key: 'firstName', width: 15 },
      { header: 'นามสกุล', key: 'lastName', width: 15 },
      { header: 'หลักสูตร', key: 'course', width: 18 },
      { header: 'สถานะ', key: 'status', width: 15 },
      { header: 'ห้องสอบ', key: 'examRoom', width: 20 },
      { header: 'เลขที่นั่ง', key: 'seatNumber', width: 10 },
      { header: 'โทรศัพท์', key: 'phone', width: 15 },
      { header: 'อีเมล', key: 'email', width: 25 },
      { header: 'โรงเรียนเดิม', key: 'previousSchool', width: 25 },
      { header: 'เกรดเฉลี่ย', key: 'gpa', width: 12 },
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
    worksheet.getRow(1).alignment = { horizontal: 'center' }

    // Add data rows
    applicants.forEach((a, index) => {
      worksheet.addRow({
        no: index + 1,
        applicationNumber: a.applicationNumber,
        nationalId: a.nationalId,
        prefix: a.prefix,
        firstName: a.firstName,
        lastName: a.lastName,
        course: a.course.name,
        status: statusLabels[a.status] || a.status,
        examRoom: a.examRoom ? `${a.examRoom.building} ห้อง ${a.examRoom.roomNumber}` : '-',
        seatNumber: a.seatNumber || '-',
        phone: a.phone || '-',
        email: a.email || '-',
        previousSchool: a.previousSchool || '-',
        gpa: a.gpa || '-',
      })
    })

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const filename = `applicants_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Error exporting applicants:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
