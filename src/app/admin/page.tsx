import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { 
  Users, 
  GraduationCap, 
  DoorOpen, 
  FileSpreadsheet,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Fetch all statistics
  const [
    totalApplicants,
    submittedCount,
    approvedCount,
    rejectedCount,
    examPassedCount,
    totalCourses,
    totalRooms,
    assignedToRoom,
    recentApplicants,
    courseStats,
  ] = await Promise.all([
    prisma.applicant.count(),
    prisma.applicant.count({ where: { status: 'SUBMITTED' } }),
    prisma.applicant.count({ where: { status: 'APPROVED' } }),
    prisma.applicant.count({ where: { status: 'REJECTED' } }),
    prisma.applicant.count({ where: { status: 'EXAM_PASSED' } }),
    prisma.course.count({ where: { isOpen: true } }),
    prisma.examRoom.count({ where: { isActive: true } }),
    prisma.applicant.count({ where: { examRoomId: { not: null } } }),
    prisma.applicant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { name: true } }
      }
    }),
    prisma.course.findMany({
      where: { isOpen: true },
      include: {
        _count: { select: { applicants: true } }
      }
    })
  ])

  const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
    SUBMITTED: { label: 'ยื่นสมัคร', variant: 'info' },
    DOCUMENT_REVIEW: { label: 'ตรวจเอกสาร', variant: 'warning' },
    APPROVED: { label: 'มีสิทธิ์สอบ', variant: 'success' },
    REJECTED: { label: 'ไม่ผ่าน', variant: 'danger' },
    EXAM_PASSED: { label: 'สอบผ่าน', variant: 'success' },
    EXAM_FAILED: { label: 'สอบไม่ผ่าน', variant: 'danger' },
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-500">ภาพรวมระบบรับสมัครนักเรียน</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalApplicants}</p>
                <p className="text-sm text-gray-500">ผู้สมัครทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{submittedCount}</p>
                <p className="text-sm text-gray-500">รอตรวจสอบ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                <p className="text-sm text-gray-500">มีสิทธิ์สอบ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{examPassedCount}</p>
                <p className="text-sm text-gray-500">สอบผ่าน</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Course Stats */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              สถิติหลักสูตร
            </CardTitle>
            <Link href="/admin/courses" className="text-sm text-primary-600 hover:underline">
              ดูทั้งหมด
            </Link>
          </CardHeader>
          <CardContent>
            {courseStats.length === 0 ? (
              <p className="text-center py-8 text-gray-500">ไม่มีหลักสูตรที่เปิดรับสมัคร</p>
            ) : (
              <div className="space-y-4">
                {courseStats.map((course) => {
                  const percent = Math.round((course._count.applicants / course.capacity) * 100)
                  return (
                    <div key={course.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{course.name}</span>
                        <span className="text-sm text-gray-500">
                          {course._count.applicants}/{course.capacity} คน
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5" />
              ห้องสอบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">ห้องสอบทั้งหมด</span>
                <span className="font-semibold text-gray-900">{totalRooms} ห้อง</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">จัดห้องแล้ว</span>
                <span className="font-semibold text-gray-900">{assignedToRoom} คน</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">ยังไม่จัดห้อง</span>
                <span className="font-semibold text-gray-900">{approvedCount - assignedToRoom} คน</span>
              </div>
              <Link
                href="/admin/exam-assignment"
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                จัดห้องสอบอัตโนมัติ
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applicants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ผู้สมัครล่าสุด</CardTitle>
          <Link href="/admin/applicants" className="text-sm text-primary-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </CardHeader>
        <CardContent>
          {recentApplicants.length === 0 ? (
            <p className="text-center py-8 text-gray-500">ยังไม่มีผู้สมัคร</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">เลขที่</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">ชื่อ-นามสกุล</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">หลักสูตร</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentApplicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {applicant.applicationNumber}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {applicant.prefix}{applicant.firstName} {applicant.lastName}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {applicant.course.name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusConfig[applicant.status]?.variant || 'default'}>
                          {statusConfig[applicant.status]?.label || applicant.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(applicant.createdAt).toLocaleDateString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Link
          href="/admin/applicants"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">จัดการผู้สมัคร</p>
            <p className="text-xs text-gray-500">ดู แก้ไข อนุมัติ</p>
          </div>
        </Link>

        <Link
          href="/admin/exam-assignment"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <div className="p-2 bg-green-100 rounded-lg">
            <DoorOpen className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">จัดห้องสอบ</p>
            <p className="text-xs text-gray-500">จัดอัตโนมัติ</p>
          </div>
        </Link>

        <Link
          href="/admin/export"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <div className="p-2 bg-purple-100 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Export ข้อมูล</p>
            <p className="text-xs text-gray-500">รายงาน ใบเซ็นชื่อ</p>
          </div>
        </Link>

        <Link
          href="/admin/courses"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <div className="p-2 bg-yellow-100 rounded-lg">
            <GraduationCap className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">จัดการหลักสูตร</p>
            <p className="text-xs text-gray-500">เพิ่ม แก้ไข</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
