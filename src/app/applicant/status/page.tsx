import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { CheckCircle, Clock, XCircle, FileText, User, MapPin, GraduationCap } from 'lucide-react'

const statusSteps = [
  { key: 'SUBMITTED', label: 'ยื่นใบสมัคร' },
  { key: 'DOCUMENT_REVIEW', label: 'ตรวจเอกสาร' },
  { key: 'APPROVED', label: 'มีสิทธิ์สอบ' },
  { key: 'EXAM_PASSED', label: 'ประกาศผล' },
]

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  DRAFT: { label: 'ร่าง', variant: 'default' },
  SUBMITTED: { label: 'ยื่นสมัครแล้ว', variant: 'info' },
  DOCUMENT_REVIEW: { label: 'กำลังตรวจเอกสาร', variant: 'warning' },
  APPROVED: { label: 'มีสิทธิ์สอบ', variant: 'success' },
  REJECTED: { label: 'ไม่ผ่านการคัดเลือก', variant: 'danger' },
  EXAM_PASSED: { label: 'สอบผ่าน', variant: 'success' },
  EXAM_FAILED: { label: 'สอบไม่ผ่าน', variant: 'danger' },
  ENROLLED: { label: 'ลงทะเบียนเรียนแล้ว', variant: 'success' },
}

function getStepStatus(currentStatus: string, stepKey: string): 'completed' | 'current' | 'pending' {
  const order = ['SUBMITTED', 'DOCUMENT_REVIEW', 'APPROVED', 'EXAM_PASSED', 'ENROLLED']
  const currentIndex = order.indexOf(currentStatus)
  const stepIndex = order.indexOf(stepKey)
  
  if (currentStatus === 'REJECTED' || currentStatus === 'EXAM_FAILED') {
    return stepIndex <= order.indexOf('DOCUMENT_REVIEW') ? 'completed' : 'pending'
  }
  
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'pending'
}

export default async function StatusPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const applicant = await prisma.applicant.findFirst({
    where: { userId: session.user.id },
    include: {
      course: true,
      examRoom: true,
      academicYear: true,
    }
  })

  if (!applicant) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีข้อมูลการสมัคร</h3>
          <p className="text-gray-500 mb-4">กรุณาสมัครเรียนก่อน</p>
          <Link
            href="/applicant/apply"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            สมัครเรียน
          </Link>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบสถานะ</h1>
        <p className="text-gray-500">ติดตามสถานะการสมัครเรียนของคุณ</p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">เลขที่ใบสมัคร</p>
              <p className="text-2xl font-bold text-gray-900">{applicant.applicationNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">สถานะปัจจุบัน</p>
              <Badge 
                variant={statusConfig[applicant.status]?.variant || 'default'}
                className="text-sm px-4 py-1"
              >
                {statusConfig[applicant.status]?.label || applicant.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle>ขั้นตอนการสมัคร</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const status = getStepStatus(applicant.status, step.key)
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        status === 'completed'
                          ? 'bg-green-500 text-white'
                          : status === 'current'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : status === 'current' ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <span className="text-sm">{index + 1}</span>
                      )}
                    </div>
                    <p className={`text-xs mt-2 text-center ${
                      status === 'pending' ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Status Messages */}
          {applicant.status === 'REJECTED' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <p className="font-medium">ไม่ผ่านการคัดเลือก</p>
              </div>
              <p className="text-sm text-red-600 mt-1">กรุณาติดต่อโรงเรียนเพื่อสอบถามรายละเอียดเพิ่มเติม</p>
            </div>
          )}

          {applicant.status === 'APPROVED' && applicant.examRoom && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-3">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">มีสิทธิ์สอบ</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700">ห้องสอบ</p>
                  <p className="font-semibold text-green-900">
                    {applicant.examRoom.building} ห้อง {applicant.examRoom.roomNumber}
                  </p>
                </div>
                <div>
                  <p className="text-green-700">เลขที่นั่งสอบ</p>
                  <p className="font-semibold text-green-900">{applicant.seatNumber}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              ข้อมูลส่วนตัว
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ชื่อ-นามสกุล</span>
              <span className="font-medium">{applicant.prefix}{applicant.firstName} {applicant.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">เลขบัตรประชาชน</span>
              <span className="font-medium">{applicant.nationalId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">วันเกิด</span>
              <span className="font-medium">{formatDate(applicant.birthDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">เพศ</span>
              <span className="font-medium">{applicant.gender === 'MALE' ? 'ชาย' : 'หญิง'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">โทรศัพท์</span>
              <span className="font-medium">{applicant.phone || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Course Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              ข้อมูลการสมัคร
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">หลักสูตร</span>
              <span className="font-medium">{applicant.course.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ปีการศึกษา</span>
              <span className="font-medium">{applicant.academicYear.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">วันที่สมัคร</span>
              <span className="font-medium">{formatDate(applicant.submittedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">โรงเรียนเดิม</span>
              <span className="font-medium">{applicant.previousSchool || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">เกรดเฉลี่ย</span>
              <span className="font-medium">{applicant.gpa || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
