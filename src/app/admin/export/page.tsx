'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui'
import { FileSpreadsheet, Download, Users, DoorOpen, BarChart3, Printer } from 'lucide-react'

interface Course {
  id: string
  name: string
  code: string
}

interface ExamRoom {
  id: string
  roomNumber: string
  building: string
  _count: { applicants: number }
}

interface Stats {
  totalApplicants: number
  totalApproved: number
  totalRooms: number
  totalAssigned: number
}

const statusOptions = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'SUBMITTED', label: 'ยื่นสมัครแล้ว' },
  { value: 'DOCUMENT_REVIEW', label: 'ตรวจเอกสาร' },
  { value: 'APPROVED', label: 'มีสิทธิ์สอบ' },
  { value: 'REJECTED', label: 'ไม่ผ่าน' },
  { value: 'EXAM_PASSED', label: 'สอบผ่าน' },
  { value: 'EXAM_FAILED', label: 'สอบไม่ผ่าน' },
]

export default function ExportPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [rooms, setRooms] = useState<ExamRoom[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Export filters
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [coursesRes, roomsRes, statsRes] = await Promise.all([
        fetch('/api/admin/courses'),
        fetch('/api/admin/exam-rooms'),
        fetch('/api/admin/exam-assignment'),
      ])

      const coursesData = await coursesRes.json()
      const roomsData = await roomsRes.json()
      const statsData = await statsRes.json()

      setCourses(coursesData)
      setRooms(roomsData)
      setStats({
        totalApplicants: statsData.summary?.totalApproved || 0,
        totalApproved: statsData.summary?.totalAssigned || 0,
        totalRooms: roomsData.length,
        totalAssigned: statsData.summary?.totalAssigned || 0,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportApplicants = () => {
    const params = new URLSearchParams()
    if (selectedCourse) params.append('courseId', selectedCourse)
    if (selectedStatus) params.append('status', selectedStatus)
    
    window.open(`/api/admin/export/applicants?${params}`, '_blank')
  }

  const handleExportExamSheet = (roomId?: string) => {
    const params = new URLSearchParams()
    if (roomId) {
      params.append('roomId', roomId)
    } else {
      params.append('allRooms', 'true')
    }
    
    window.open(`/api/admin/export/exam-sheet?${params}`, '_blank')
  }

  const handleExportSummary = () => {
    window.open('/api/admin/export/summary', '_blank')
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ส่งออกข้อมูล</h1>
        <p className="text-gray-500">Export รายงานและใบเซ็นชื่อในรูปแบบ Excel (.xlsx)</p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplicants}</p>
              <p className="text-sm text-gray-500">มีสิทธิ์สอบ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssigned}</p>
              <p className="text-sm text-gray-500">จัดห้องแล้ว</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
              <p className="text-sm text-gray-500">ห้องสอบ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-sm text-gray-500">หลักสูตร</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6">
        {/* Export Applicants List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              รายชื่อผู้สมัคร
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Export รายชื่อผู้สมัครพร้อมข้อมูลส่วนตัว สถานะ และห้องสอบ
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Select
                label="หลักสูตร"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                options={[
                  { value: '', label: 'ทุกหลักสูตร' },
                  ...courses.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
              <Select
                label="สถานะ"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={statusOptions}
              />
              <div className="flex items-end">
                <Button onClick={handleExportApplicants} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              ไฟล์ที่ได้: เลขที่ใบสมัคร, เลขบัตรประชาชน, ชื่อ-นามสกุล, หลักสูตร, สถานะ, ห้องสอบ, เลขที่นั่ง, โทรศัพท์, อีเมล
            </div>
          </CardContent>
        </Card>

        {/* Export Exam Sign-in Sheet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-green-600" />
              ใบเซ็นชื่อเข้าห้องสอบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Export ใบเซ็นชื่อสำหรับพิมพ์ติดหน้าห้องสอบ พร้อมช่องลายเซ็นและหมายเหตุ
            </p>
            
            <div className="space-y-4">
              {/* Export all rooms */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">ทุกห้องสอบ</p>
                  <p className="text-sm text-gray-500">Export ใบเซ็นชื่อทุกห้องในไฟล์เดียว</p>
                </div>
                <Button onClick={() => handleExportExamSheet()}>
                  <Download className="w-4 h-4 mr-2" />
                  Export ทั้งหมด
                </Button>
              </div>

              {/* Export by room */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">เลือกห้องสอบ:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleExportExamSheet(room.id)}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {room.building} ห้อง {room.roomNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {room._count.applicants} คน
                        </p>
                      </div>
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Summary Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              รายงานสรุปสถิติ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Export รายงานสรุปจำนวนผู้สมัครตามหลักสูตรและสถานะ พร้อมสรุปห้องสอบ
            </p>
            <Button onClick={handleExportSummary}>
              <Download className="w-4 h-4 mr-2" />
              Export รายงานสรุป
            </Button>
            <div className="mt-3 text-xs text-gray-400">
              ไฟล์ที่ได้: สถิติผู้สมัครแยกตามหลักสูตร, สถิติห้องสอบ, จำนวนผู้สมัครแต่ละสถานะ
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips การใช้งาน</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• ไฟล์ Excel (.xlsx) สามารถเปิดด้วย Microsoft Excel, Google Sheets หรือ LibreOffice ได้</li>
              <li>• ใบเซ็นชื่อแต่ละห้องจะอยู่คนละ Sheet สามารถพิมพ์แยกห้องได้</li>
              <li>• รายงานสรุปมี 2 Sheet: สถิติตามหลักสูตร และ สถิติห้องสอบ</li>
              <li>• ไฟล์มีการจัดรูปแบบ สี และเส้นขอบพร้อมใช้งาน</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
