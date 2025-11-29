import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import prisma from '@/lib/prisma'
import { Users, BookOpen, DoorOpen, CheckCircle } from 'lucide-react'

async function getStats() {
  const [
    totalApplicants,
    approvedApplicants,
    totalCourses,
    totalRooms,
  ] = await Promise.all([
    prisma.applicant.count(),
    prisma.applicant.count({ where: { status: 'APPROVED' } }),
    prisma.course.count(),
    prisma.examRoom.count(),
  ])

  return {
    totalApplicants,
    approvedApplicants,
    totalCourses,
    totalRooms,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const statCards = [
    {
      title: 'ผู้สมัครทั้งหมด',
      value: stats.totalApplicants,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'มีสิทธิ์สอบ',
      value: stats.approvedApplicants,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'หลักสูตร',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-purple-500',
    },
    {
      title: 'ห้องสอบ',
      value: stats.totalRooms,
      icon: DoorOpen,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">ภาพรวมระบบรับสมัครนักเรียน</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/applicants"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Users className="w-8 h-8 mx-auto mb-2 text-primary-600" />
              <p className="text-sm font-medium">ดูผู้สมัคร</p>
            </a>
            <a
              href="/admin/exam-assignment"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <DoorOpen className="w-8 h-8 mx-auto mb-2 text-primary-600" />
              <p className="text-sm font-medium">จัดห้องสอบ</p>
            </a>
            <a
              href="/admin/courses"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary-600" />
              <p className="text-sm font-medium">จัดการหลักสูตร</p>
            </a>
            <a
              href="/admin/export"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary-600" />
              <p className="text-sm font-medium">ส่งออกข้อมูล</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
