'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { Search, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'

interface SearchResult {
  found: boolean
  applicant?: {
    applicationNumber: string
    prefix: string
    firstName: string
    lastName: string
    status: string
    course: { name: string }
    academicYear: { name: string }
    examRoom?: { roomNumber: string; building: string } | null
    seatNumber?: number | null
  }
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; icon: any }> = {
  DRAFT: { label: 'ร่าง', variant: 'default', icon: Clock },
  SUBMITTED: { label: 'ยื่นสมัครแล้ว', variant: 'info', icon: Clock },
  DOCUMENT_REVIEW: { label: 'กำลังตรวจเอกสาร', variant: 'warning', icon: Clock },
  APPROVED: { label: 'มีสิทธิ์สอบ', variant: 'success', icon: CheckCircle },
  REJECTED: { label: 'ไม่ผ่านการคัดเลือก', variant: 'danger', icon: XCircle },
  EXAM_PASSED: { label: 'สอบผ่าน', variant: 'success', icon: CheckCircle },
  EXAM_FAILED: { label: 'สอบไม่ผ่าน', variant: 'danger', icon: XCircle },
  ENROLLED: { label: 'ลงทะเบียนเรียนแล้ว', variant: 'success', icon: CheckCircle },
}

export default function CheckResultPage() {
  const [nationalId, setNationalId] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!nationalId || !birthDate) {
      setError('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    if (nationalId.length !== 13) {
      setError('เลขบัตรประชาชนต้องมี 13 หลัก')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/public/check-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId, birthDate }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setResult(data)
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setIsLoading(false)
    }
  }

  const StatusIcon = result?.applicant ? statusConfig[result.applicant.status]?.icon : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ตรวจสอบผลการสมัคร</h1>
          <p className="text-gray-500">กรอกเลขบัตรประชาชนและวันเกิดเพื่อตรวจสอบสถานะ</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input
                id="nationalId"
                label="เลขบัตรประชาชน"
                placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                maxLength={13}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                required
              />

              <Input
                id="birthDate"
                type="date"
                label="วันเกิด"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                ค้นหา
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>ผลการค้นหา</CardTitle>
            </CardHeader>
            <CardContent>
              {result.found && result.applicant ? (
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-center">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-lg ${
                      statusConfig[result.applicant.status]?.variant === 'success'
                        ? 'bg-green-50'
                        : statusConfig[result.applicant.status]?.variant === 'danger'
                        ? 'bg-red-50'
                        : statusConfig[result.applicant.status]?.variant === 'warning'
                        ? 'bg-yellow-50'
                        : 'bg-gray-50'
                    }`}>
                      {StatusIcon && (
                        <StatusIcon className={`w-8 h-8 ${
                          statusConfig[result.applicant.status]?.variant === 'success'
                            ? 'text-green-600'
                            : statusConfig[result.applicant.status]?.variant === 'danger'
                            ? 'text-red-600'
                            : statusConfig[result.applicant.status]?.variant === 'warning'
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }`} />
                      )}
                      <div>
                        <p className="text-sm text-gray-500">สถานะ</p>
                        <p className="text-lg font-semibold">
                          {statusConfig[result.applicant.status]?.label || result.applicant.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">เลขที่ใบสมัคร</p>
                      <p className="font-semibold">{result.applicant.applicationNumber}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">ชื่อ-นามสกุล</p>
                      <p className="font-semibold">
                        {result.applicant.prefix}{result.applicant.firstName} {result.applicant.lastName}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">หลักสูตร</p>
                      <p className="font-semibold">{result.applicant.course.name}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">ปีการศึกษา</p>
                      <p className="font-semibold">{result.applicant.academicYear.name}</p>
                    </div>
                  </div>

                  {/* Exam Room Info */}
                  {result.applicant.status === 'APPROVED' && result.applicant.examRoom && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-3">ข้อมูลห้องสอบ</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-green-700">ห้องสอบ</p>
                          <p className="font-semibold text-green-900">
                            {result.applicant.examRoom.building} ห้อง {result.applicant.examRoom.roomNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-green-700">เลขที่นั่งสอบ</p>
                          <p className="font-semibold text-green-900">{result.applicant.seatNumber}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exam Result */}
                  {result.applicant.status === 'EXAM_PASSED' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold text-green-800">ยินดีด้วย! คุณสอบผ่าน</p>
                      <p className="text-sm text-green-600">กรุณาติดต่อโรงเรียนเพื่อลงทะเบียนเรียน</p>
                    </div>
                  )}

                  {result.applicant.status === 'EXAM_FAILED' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                      <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold text-red-800">ไม่ผ่านการสอบ</p>
                      <p className="text-sm text-red-600">ขอบคุณที่ให้ความสนใจ</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">ไม่พบข้อมูลการสมัคร</p>
                  <p className="text-sm text-gray-400 mt-1">กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
