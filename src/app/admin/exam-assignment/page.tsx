'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Select } from '@/components/ui'
import { Users, DoorOpen, Play, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react'

interface Room {
  id: string
  roomNumber: string
  building: string
  floor: string
  capacity: number
  currentCount: number
  availableSeats: number
  applicants: {
    id: string
    applicationNumber: string
    firstName: string
    lastName: string
    seatNumber: number
  }[]
}

interface Summary {
  totalApproved: number
  totalAssigned: number
  totalUnassigned: number
}

interface Course {
  id: string
  name: string
  code: string
}

export default function ExamAssignmentPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [sortBy, setSortBy] = useState('nationalId')
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchData()
    fetchCourses()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/exam-assignment')
      const data = await res.json()
      setSummary(data.summary)
      setRooms(data.rooms)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses')
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleAssign = async () => {
    if (!confirm('ต้องการจัดห้องสอบอัตโนมัติ?')) return

    setIsAssigning(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/exam-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse, sortBy }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error })
        return
      }

      setResult({ 
        type: 'success', 
        message: `จัดห้องสอบสำเร็จ ${data.assigned} คน${data.notAssigned > 0 ? ` (ไม่สามารถจัด ${data.notAssigned} คน)` : ''}`
      })
      fetchData()
    } catch (error) {
      setResult({ type: 'error', message: 'เกิดข้อผิดพลาด' })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('ต้องการรีเซ็ตห้องสอบทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) return

    setIsResetting(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/exam-assignment/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error })
        return
      }

      setResult({ type: 'success', message: `รีเซ็ตสำเร็จ ${data.resetCount} คน` })
      fetchData()
    } catch (error) {
      setResult({ type: 'error', message: 'เกิดข้อผิดพลาด' })
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">จัดห้องสอบอัตโนมัติ</h1>
        <p className="text-gray-500">จัดห้องสอบให้ผู้สมัครที่มีสิทธิ์สอบ</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalApproved}</p>
                  <p className="text-sm text-gray-500">มีสิทธิ์สอบ</p>
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
                  <p className="text-2xl font-bold text-gray-900">{summary.totalAssigned}</p>
                  <p className="text-sm text-gray-500">จัดห้องแล้ว</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalUnassigned}</p>
                  <p className="text-sm text-gray-500">ยังไม่จัดห้อง</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg ${
          result.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {result.message}
        </div>
      )}

      {/* Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>ตั้งค่าการจัดห้องสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Select
              label="หลักสูตร"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={[
                { value: 'all', label: 'ทุกหลักสูตร' },
                ...courses.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
            <Select
              label="เรียงลำดับตาม"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'nationalId', label: 'เลขบัตรประชาชน' },
                { value: 'applicationNumber', label: 'เลขที่ใบสมัคร' },
              ]}
            />
            <div className="flex items-end gap-2">
              <Button
                onClick={handleAssign}
                isLoading={isAssigning}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                จัดห้องสอบ
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                isLoading={isResetting}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">วิธีการจัดห้องสอบ:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>เรียงลำดับผู้สมัครตามที่เลือก (เลขบัตร ปชช. หรือ เลขใบสมัคร)</li>
              <li>จัดคนเข้าห้องตามลำดับ จนกว่าห้องจะเต็ม</li>
              <li>เมื่อห้องเต็ม จะเปลี่ยนไปห้องถัดไปอัตโนมัติ</li>
              <li>บันทึกเลขที่นั่งสอบและห้องสอบ</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Room List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5" />
            ห้องสอบทั้งหมด
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-center py-8 text-gray-500">ไม่มีห้องสอบ</p>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => {
                const usagePercent = Math.round((room.currentCount / room.capacity) * 100)
                return (
                  <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {room.building} ห้อง {room.roomNumber}
                        </h4>
                        <p className="text-sm text-gray-500">ชั้น {room.floor}</p>
                      </div>
                      <Badge variant={usagePercent >= 100 ? 'danger' : usagePercent >= 80 ? 'warning' : 'success'}>
                        {room.currentCount}/{room.capacity} คน ({usagePercent}%)
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>

                    {/* Applicants in room */}
                    {room.applicants.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 mb-2">รายชื่อผู้สอบ:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
                          {room.applicants.slice(0, 12).map((applicant) => (
                            <div
                              key={applicant.id}
                              className="bg-gray-50 px-2 py-1 rounded text-center"
                            >
                              <span className="text-gray-500">#{applicant.seatNumber}</span>{' '}
                              <span className="font-medium">{applicant.firstName}</span>
                            </div>
                          ))}
                          {room.applicants.length > 12 && (
                            <div className="bg-gray-50 px-2 py-1 rounded text-center text-gray-500">
                              +{room.applicants.length - 12} คน
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
