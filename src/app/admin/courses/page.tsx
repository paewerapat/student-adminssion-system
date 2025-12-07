'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Modal, Badge, Select } from '@/components/ui'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'

interface Course {
  id: string
  code: string
  name: string
  description: string | null
  capacity: number
  registrationStart: string
  registrationEnd: string
  isOpen: boolean
  academicYearId: string
  academicYear: {
    id: string
    year: string
    name: string
  }
  _count: {
    applicants: number
  }
}

interface AcademicYear {
  id: string
  year: string
  name: string
  isActive: boolean
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    capacity: '',
    registrationStart: '',
    registrationEnd: '',
    isOpen: false,
    academicYearId: '',
  })

  useEffect(() => {
    fetchCourses()
    fetchAcademicYears()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses')
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch('/api/admin/academic-years')
      const data = await res.json()
      setAcademicYears(data)
      if (data.length > 0) {
        const activeYear = data.find((y: AcademicYear) => y.isActive) || data[0]
        setFormData(prev => ({ ...prev, academicYearId: activeYear.id }))
      }
    } catch (error) {
      console.error('Error fetching academic years:', error)
    }
  }

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        code: course.code,
        name: course.name,
        description: course.description || '',
        capacity: course.capacity.toString(),
        registrationStart: course.registrationStart.split('T')[0],
        registrationEnd: course.registrationEnd.split('T')[0],
        isOpen: course.isOpen,
        academicYearId: course.academicYearId,
      })
    } else {
      setEditingCourse(null)
      const activeYear = academicYears.find(y => y.isActive) || academicYears[0]
      setFormData({
        code: '',
        name: '',
        description: '',
        capacity: '',
        registrationStart: '',
        registrationEnd: '',
        isOpen: false,
        academicYearId: activeYear?.id || '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCourse(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCourse 
        ? `/api/admin/courses/${editingCourse.id}`
        : '/api/admin/courses'
      
      const res = await fetch(url, {
        method: editingCourse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error)
        return
      }

      handleCloseModal()
      fetchCourses()
    } catch (error) {
      console.error('Error saving course:', error)
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบหลักสูตรนี้?')) return

    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error)
        return
      }

      fetchCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('เกิดข้อผิดพลาด')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการหลักสูตร</h1>
          <p className="text-gray-500">เพิ่ม แก้ไข ลบ หลักสูตรที่เปิดรับสมัคร</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มหลักสูตร
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">ยังไม่มีหลักสูตร</p>
            <Button className="mt-4" onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มหลักสูตรแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {course.name}
                      </h3>
                      <Badge variant={course.isOpen ? 'success' : 'default'}>
                        {course.isOpen ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      รหัส: {course.code} | ปีการศึกษา: {course.academicYear.name}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">จำนวนรับ:</span>{' '}
                        <span className="font-medium">{course.capacity} คน</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ผู้สมัคร:</span>{' '}
                        <span className="font-medium">{course._count.applicants} คน</span>
                      </div>
                      <div>
                        <span className="text-gray-500">เริ่ม:</span>{' '}
                        <span className="font-medium">{formatDate(course.registrationStart)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">สิ้นสุด:</span>{' '}
                        <span className="font-medium">{formatDate(course.registrationEnd)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(course)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(course.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCourse ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตร'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="code"
              label="รหัสหลักสูตร"
              placeholder="SCI-MATH"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Select
              id="academicYearId"
              label="ปีการศึกษา"
              value={formData.academicYearId}
              onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
              options={academicYears.map(y => ({ value: y.id, label: y.name }))}
              required
            />
          </div>

          <Input
            id="name"
            label="ชื่อหลักสูตร"
            placeholder="วิทยาศาสตร์-คณิตศาสตร์"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            id="description"
            label="รายละเอียด"
            placeholder="รายละเอียดหลักสูตร (ไม่บังคับ)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            id="capacity"
            type="number"
            label="จำนวนที่เปิดรับ"
            placeholder="120"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="registrationStart"
              type="date"
              label="วันเริ่มรับสมัคร"
              value={formData.registrationStart}
              onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
              required
            />
            <Input
              id="registrationEnd"
              type="date"
              label="วันสิ้นสุดรับสมัคร"
              value={formData.registrationEnd}
              onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOpen"
              checked={formData.isOpen}
              onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isOpen" className="text-sm text-gray-700">
              เปิดรับสมัคร
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              ยกเลิก
            </Button>
            <Button type="submit">
              {editingCourse ? 'บันทึก' : 'เพิ่มหลักสูตร'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
