'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui'

interface Course {
  id: string
  code: string
  name: string
  capacity: number
  _count: { applicants: number }
  academicYear: { id: string; name: string }
}

const prefixOptions = [
  { value: '', label: 'เลือกคำนำหน้า' },
  { value: 'เด็กชาย', label: 'เด็กชาย' },
  { value: 'เด็กหญิง', label: 'เด็กหญิง' },
  { value: 'นาย', label: 'นาย' },
  { value: 'นางสาว', label: 'นางสาว' },
]

const genderOptions = [
  { value: '', label: 'เลือกเพศ' },
  { value: 'MALE', label: 'ชาย' },
  { value: 'FEMALE', label: 'หญิง' },
]

export default function ApplyPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasApplication, setHasApplication] = useState(false)
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    // Course
    courseId: '',
    // Personal Info
    nationalId: '',
    prefix: '',
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    nationality: 'ไทย',
    religion: '',
    // Contact
    phone: '',
    email: '',
    // Address
    address: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    // Parent Info
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherOccupation: '',
    // Education
    previousSchool: '',
    previousGrade: '',
    gpa: '',
  })

  useEffect(() => {
    checkExistingApplication()
    fetchCourses()
  }, [])

  const checkExistingApplication = async () => {
    try {
      const res = await fetch('/api/applicant/profile')
      if (res.ok) {
        const data = await res.json()
        if (data.applicant) {
          setHasApplication(true)
        }
      }
    } catch (error) {
      console.error('Error checking application:', error)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/public/courses')
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/applicant/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error)
        return
      }

      router.push('/applicant/status')
    } catch (error) {
      console.error('Error submitting:', error)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
  }

  if (hasApplication) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">คุณสมัครเรียนแล้ว</h3>
          <p className="text-gray-500 mb-4">ไม่สามารถสมัครซ้ำได้</p>
          <Button onClick={() => router.push('/applicant/status')}>
            ดูสถานะการสมัคร
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีหลักสูตรที่เปิดรับสมัคร</h3>
          <p className="text-gray-500">กรุณารอประกาศเปิดรับสมัคร</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">สมัครเรียน</h1>
        <p className="text-gray-500">กรอกข้อมูลให้ครบถ้วนเพื่อสมัครเรียน</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  step > s ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Course Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>เลือกหลักสูตร</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {courses.map((course) => {
                  const remaining = course.capacity - course._count.applicants
                  const isFull = remaining <= 0
                  return (
                    <label
                      key={course.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.courseId === course.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="courseId"
                        value={course.id}
                        checked={formData.courseId === course.id}
                        onChange={handleChange}
                        disabled={isFull}
                        className="w-4 h-4 text-primary-600"
                      />
                      <div className="ml-4 flex-1">
                        <p className="font-medium text-gray-900">{course.name}</p>
                        <p className="text-sm text-gray-500">
                          รหัส: {course.code} | {course.academicYear.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                          {isFull ? 'เต็มแล้ว' : `เหลือ ${remaining} ที่`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course._count.applicants}/{course.capacity} คน
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.courseId}
                >
                  ถัดไป
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลส่วนตัว</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="nationalId"
                  label="เลขบัตรประชาชน *"
                  placeholder="1234567890123"
                  maxLength={13}
                  value={formData.nationalId}
                  onChange={handleChange}
                  required
                />
                <Select
                  name="prefix"
                  label="คำนำหน้า *"
                  value={formData.prefix}
                  onChange={handleChange}
                  options={prefixOptions}
                  required
                />
                <Input
                  name="firstName"
                  label="ชื่อ *"
                  placeholder="ชื่อ"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="lastName"
                  label="นามสกุล *"
                  placeholder="นามสกุล"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                <Select
                  name="gender"
                  label="เพศ *"
                  value={formData.gender}
                  onChange={handleChange}
                  options={genderOptions}
                  required
                />
                <Input
                  name="birthDate"
                  type="date"
                  label="วันเกิด *"
                  value={formData.birthDate}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="nationality"
                  label="สัญชาติ"
                  value={formData.nationality}
                  onChange={handleChange}
                />
                <Input
                  name="religion"
                  label="ศาสนา"
                  placeholder="พุทธ"
                  value={formData.religion}
                  onChange={handleChange}
                />
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">ข้อมูลติดต่อ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="phone"
                    label="เบอร์โทรศัพท์"
                    placeholder="0812345678"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <Input
                    name="email"
                    type="email"
                    label="อีเมล"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">ที่อยู่</h4>
                <div className="space-y-4">
                  <Input
                    name="address"
                    label="ที่อยู่"
                    placeholder="บ้านเลขที่ ซอย ถนน"
                    value={formData.address}
                    onChange={handleChange}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      name="subDistrict"
                      label="ตำบล/แขวง"
                      value={formData.subDistrict}
                      onChange={handleChange}
                    />
                    <Input
                      name="district"
                      label="อำเภอ/เขต"
                      value={formData.district}
                      onChange={handleChange}
                    />
                    <Input
                      name="province"
                      label="จังหวัด"
                      value={formData.province}
                      onChange={handleChange}
                    />
                    <Input
                      name="postalCode"
                      label="รหัสไปรษณีย์"
                      maxLength={5}
                      value={formData.postalCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  ย้อนกลับ
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  ถัดไป
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Parent & Education */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลผู้ปกครองและการศึกษา</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Father */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">ข้อมูลบิดา</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    name="fatherName"
                    label="ชื่อ-นามสกุล"
                    value={formData.fatherName}
                    onChange={handleChange}
                  />
                  <Input
                    name="fatherPhone"
                    label="เบอร์โทร"
                    value={formData.fatherPhone}
                    onChange={handleChange}
                  />
                  <Input
                    name="fatherOccupation"
                    label="อาชีพ"
                    value={formData.fatherOccupation}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Mother */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">ข้อมูลมารดา</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    name="motherName"
                    label="ชื่อ-นามสกุล"
                    value={formData.motherName}
                    onChange={handleChange}
                  />
                  <Input
                    name="motherPhone"
                    label="เบอร์โทร"
                    value={formData.motherPhone}
                    onChange={handleChange}
                  />
                  <Input
                    name="motherOccupation"
                    label="อาชีพ"
                    value={formData.motherOccupation}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Education */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">ประวัติการศึกษา</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    name="previousSchool"
                    label="โรงเรียนเดิม"
                    value={formData.previousSchool}
                    onChange={handleChange}
                  />
                  <Input
                    name="previousGrade"
                    label="ระดับชั้น"
                    placeholder="ม.3"
                    value={formData.previousGrade}
                    onChange={handleChange}
                  />
                  <Input
                    name="gpa"
                    label="เกรดเฉลี่ย"
                    placeholder="3.50"
                    value={formData.gpa}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                  ย้อนกลับ
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  ยืนยันสมัครเรียน
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
