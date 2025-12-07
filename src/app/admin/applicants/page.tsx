'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Select, Modal } from '@/components/ui'
import { Search, Upload, CheckCircle, Users, FileSpreadsheet, Eye } from 'lucide-react'

interface Applicant {
  id: string
  applicationNumber: string
  nationalId: string
  prefix: string
  firstName: string
  lastName: string
  status: string
  seatNumber: number | null
  course: { name: string; code: string }
  examRoom: { roomNumber: string; building: string } | null
  academicYear: { name: string }
  createdAt: string
}

interface Course {
  id: string
  name: string
  code: string
  academicYearId: string
  academicYear: { id: string; name: string }
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

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  DRAFT: { label: 'ร่าง', variant: 'default' },
  SUBMITTED: { label: 'ยื่นสมัครแล้ว', variant: 'info' },
  DOCUMENT_REVIEW: { label: 'ตรวจเอกสาร', variant: 'warning' },
  APPROVED: { label: 'มีสิทธิ์สอบ', variant: 'success' },
  REJECTED: { label: 'ไม่ผ่าน', variant: 'danger' },
  EXAM_PASSED: { label: 'สอบผ่าน', variant: 'success' },
  EXAM_FAILED: { label: 'สอบไม่ผ่าน', variant: 'danger' },
}

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([])
  
  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importCourse, setImportCourse] = useState('')
  const [importAcademicYear, setImportAcademicYear] = useState('')
  const [setAsApproved, setSetAsApproved] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detail Modal
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)

  useEffect(() => {
    fetchApplicants()
    fetchCourses()
  }, [search, selectedCourse, selectedStatus])

  const fetchApplicants = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCourse) params.append('courseId', selectedCourse)
      if (selectedStatus) params.append('status', selectedStatus)

      const res = await fetch(`/api/admin/applicants?${params}`)
      const data = await res.json()
      setApplicants(data.applicants)
    } catch (error) {
      console.error('Error fetching applicants:', error)
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('ไฟล์ไม่มีข้อมูล')
        return
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim())
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = values[index]
        })
        return obj
      })

      setImportData(data)
      setIsImportModalOpen(true)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!importCourse || !importAcademicYear) {
      alert('กรุณาเลือกหลักสูตรและปีการศึกษา')
      return
    }

    setIsImporting(true)
    try {
      const res = await fetch('/api/admin/applicants/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: importData,
          courseId: importCourse,
          academicYearId: importAcademicYear,
          setAsApproved,
        }),
      })

      const result = await res.json()
      
      if (!res.ok) {
        alert(result.error)
        return
      }

      alert(`Import สำเร็จ: ${result.imported} คน, ข้าม: ${result.skipped} คน`)
      setIsImportModalOpen(false)
      setImportData([])
      fetchApplicants()
    } catch (error) {
      console.error('Error importing:', error)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setIsImporting(false)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedApplicants.length === 0) {
      alert('กรุณาเลือกผู้สมัคร')
      return
    }

    if (!confirm(`ต้องการอนุมัติ ${selectedApplicants.length} คน?`)) return

    try {
      const res = await fetch('/api/admin/applicants/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantIds: selectedApplicants }),
      })

      const result = await res.json()
      
      if (!res.ok) {
        alert(result.error)
        return
      }

      alert(`อนุมัติสำเร็จ ${result.updatedCount} คน`)
      setSelectedApplicants([])
      fetchApplicants()
    } catch (error) {
      console.error('Error approving:', error)
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/applicants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error)
        return
      }

      fetchApplicants()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const toggleSelectAll = () => {
    if (selectedApplicants.length === applicants.length) {
      setSelectedApplicants([])
    } else {
      setSelectedApplicants(applicants.map(a => a.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedApplicants(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  // Get unique academic years from courses
  const academicYears = Array.from(
    new Map(courses.map(c => [c.academicYear.id, c.academicYear])).values()
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้สมัคร</h1>
          <p className="text-gray-500">ดู แก้ไข อนุมัติ และ Import ผู้สมัคร</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          {selectedApplicants.length > 0 && (
            <Button onClick={handleBulkApprove}>
              <CheckCircle className="w-4 h-4 mr-2" />
              อนุมัติ ({selectedApplicants.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหาชื่อ, เลขบัตร, เลขใบสมัคร..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={[
                { value: '', label: 'ทุกหลักสูตร' },
                ...courses.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={statusOptions}
            />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              พบ {applicants.length} คน
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedApplicants.length === applicants.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เลขที่</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">หลักสูตร</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ห้องสอบ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedApplicants.includes(applicant.id)}
                          onChange={() => toggleSelect(applicant.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{applicant.applicationNumber}</p>
                        <p className="text-xs text-gray-500">{applicant.nationalId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{applicant.prefix}{applicant.firstName} {applicant.lastName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{applicant.course.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={applicant.status}
                          onChange={(e) => handleUpdateStatus(applicant.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          {statusOptions.slice(1).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {applicant.examRoom ? (
                          <p className="text-sm">
                            {applicant.examRoom.building} ห้อง {applicant.examRoom.roomNumber}
                            <span className="text-gray-500"> (ที่นั่ง {applicant.seatNumber})</span>
                          </p>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedApplicant(applicant)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import ผู้สมัคร"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-700 mb-2">พบข้อมูล {importData.length} รายการ</p>
            <p className="text-blue-600">
              ไฟล์ CSV ต้องมี column: เลขบัตรประชาชน, ชื่อ, นามสกุล, คำนำหน้า, เพศ, วันเกิด
            </p>
          </div>

          <Select
            label="ปีการศึกษา"
            value={importAcademicYear}
            onChange={(e) => {
              setImportAcademicYear(e.target.value)
              setImportCourse('')
            }}
            options={[
              { value: '', label: 'เลือกปีการศึกษา' },
              ...academicYears.map(y => ({ value: y.id, label: y.name }))
            ]}
          />

          <Select
            label="หลักสูตร"
            value={importCourse}
            onChange={(e) => setImportCourse(e.target.value)}
            options={[
              { value: '', label: 'เลือกหลักสูตร' },
              ...courses
                .filter(c => !importAcademicYear || c.academicYearId === importAcademicYear)
                .map(c => ({ value: c.id, label: c.name }))
            ]}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="setAsApproved"
              checked={setAsApproved}
              onChange={(e) => setSetAsApproved(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="setAsApproved" className="text-sm text-gray-700">
              ตั้งสถานะเป็น "มีสิทธิ์สอบ" ทันที
            </label>
          </div>

          {importData.length > 0 && (
            <div className="max-h-48 overflow-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">เลขบัตร</th>
                    <th className="px-3 py-2 text-left">ชื่อ</th>
                    <th className="px-3 py-2 text-left">นามสกุล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {importData.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{row.nationalId || row['เลขบัตรประชาชน'] || '-'}</td>
                      <td className="px-3 py-2">{row.firstName || row['ชื่อ'] || '-'}</td>
                      <td className="px-3 py-2">{row.lastName || row['นามสกุล'] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importData.length > 10 && (
                <p className="text-center py-2 text-gray-500 text-sm">
                  ...และอีก {importData.length - 10} รายการ
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleImport} isLoading={isImporting}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedApplicant}
        onClose={() => setSelectedApplicant(null)}
        title="รายละเอียดผู้สมัคร"
        size="lg"
      >
        {selectedApplicant && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">เลขที่ใบสมัคร</p>
                <p className="font-medium">{selectedApplicant.applicationNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">เลขบัตรประชาชน</p>
                <p className="font-medium">{selectedApplicant.nationalId}</p>
              </div>
              <div>
                <p className="text-gray-500">ชื่อ-นามสกุล</p>
                <p className="font-medium">
                  {selectedApplicant.prefix}{selectedApplicant.firstName} {selectedApplicant.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-500">หลักสูตร</p>
                <p className="font-medium">{selectedApplicant.course.name}</p>
              </div>
              <div>
                <p className="text-gray-500">สถานะ</p>
                <Badge variant={statusConfig[selectedApplicant.status]?.variant || 'default'}>
                  {statusConfig[selectedApplicant.status]?.label || selectedApplicant.status}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">ห้องสอบ</p>
                <p className="font-medium">
                  {selectedApplicant.examRoom 
                    ? `${selectedApplicant.examRoom.building} ห้อง ${selectedApplicant.examRoom.roomNumber} (ที่นั่ง ${selectedApplicant.seatNumber})`
                    : '-'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
