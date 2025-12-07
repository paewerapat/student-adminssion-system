import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, Badge } from '@/components/ui'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; icon: any }> = {
  DRAFT: { label: 'ร่าง', variant: 'default', icon: FileText },
  SUBMITTED: { label: 'ยื่นสมัครแล้ว', variant: 'info', icon: Clock },
  DOCUMENT_REVIEW: { label: 'ตรวจเอกสาร', variant: 'warning', icon: Clock },
  APPROVED: { label: 'มีสิทธิ์สอบ', variant: 'success', icon: CheckCircle },
  REJECTED: { label: 'ไม่ผ่าน', variant: 'danger', icon: AlertCircle },
  EXAM_PASSED: { label: 'สอบผ่าน', variant: 'success', icon: CheckCircle },
  EXAM_FAILED: { label: 'สอบไม่ผ่าน', variant: 'danger', icon: AlertCircle },
  ENROLLED: { label: 'ลงทะเบียนแล้ว', variant: 'success', icon: CheckCircle },
}

export default async function ApplicantDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get user's application
  const applicant = await prisma.applicant.findFirst({
    where: { userId: session.user.id },
    include: {
      course: true,
      examRoom: true,
      academicYear: true,
    }
  })

  // Get open courses count
  const openCourses = await prisma.course.count({
    where: {
      isOpen: true,
      registrationEnd: { gte: new Date() }
    }
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          สวัสดี, {session.user.name || 'ผู้สมัคร'}
        </h1>
        <p className="text-gray-500">ยินดีต้อนรับสู่ระบบรับสมัครนักเรียน</p>
      </div>

      {applicant ? (
        // Has application
        <div className="space-y-6">
          {/* Application Status Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">สถานะการสมัคร</p>
                  <Badge variant={statusConfig[applicant.status]?.variant || 'default'} className="text-sm px-3 py-1">
                    {statusConfig[applicant.status]?.label || applicant.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">เลขที่ใบสมัคร</p>
                  <p className="text-lg font-semibold text-gray-900">{applicant.applicationNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">ข้อมูลการสมัคร</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">ชื่อ-นามสกุล:</span>
                  <p className="font-medium">{applicant.prefix}{applicant.firstName} {applicant.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">หลักสูตร:</span>
                  <p className="font-medium">{applicant.course.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">ปีการศึกษา:</span>
                  <p className="font-medium">{applicant.academicYear.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">วันที่สมัคร:</span>
                  <p className="font-medium">
                    {applicant.submittedAt 
                      ? new Date(applicant.submittedAt).toLocaleDateString('th-TH')
                      : '-'
                    }
                  </p>
                </div>
              </div>

              {/* Exam Info */}
              {applicant.status === 'APPROVED' && applicant.examRoom && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">ข้อมูลการสอบ</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">ห้องสอบ:</span>
                      <p className="font-medium text-green-900">
                        {applicant.examRoom.building} ห้อง {applicant.examRoom.roomNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-700">เลขที่นั่ง:</span>
                      <p className="font-medium text-green-900">{applicant.seatNumber}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Link 
              href="/applicant/status"
              className="text-primary-600 hover:underline text-sm"
            >
              ดูรายละเอียดเพิ่มเติม →
            </Link>
          </div>
        </div>
      ) : (
        // No application yet
        <div className="space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                คุณยังไม่ได้สมัครเรียน
              </h3>
              <p className="text-gray-500 mb-6">
                ขณะนี้มี {openCourses} หลักสูตรที่เปิดรับสมัคร
              </p>
              <Link
                href="/applicant/apply"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                สมัครเรียนเลย
              </Link>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-900">เลือกหลักสูตร</h4>
                <p className="text-sm text-gray-500">เลือกหลักสูตรที่ต้องการ</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-900">กรอกข้อมูล</h4>
                <p className="text-sm text-gray-500">กรอกข้อมูลส่วนตัว</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-900">รอตรวจสอบ</h4>
                <p className="text-sm text-gray-500">รอเจ้าหน้าที่ตรวจสอบ</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
