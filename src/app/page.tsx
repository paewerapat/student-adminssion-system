import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  GraduationCap, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle,
  Search,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                บ
              </div>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-gray-900 text-sm">ระบบรับสมัครนักเรียน</h1>
                <p className="text-xs text-gray-500">โรงเรียนบวรมินทราชินูทิศเตรียมอุดมศึกษาน้อมเกล้า</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {session ? (
                <>
                  {session.user.role === 'ADMIN' ? (
                    <Link
                      href="/admin"
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Admin Panel
                    </Link>
                  ) : (
                    <Link
                      href="/applicant"
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      เข้าสู่ระบบสมัคร
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    สมัครสมาชิก
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              ระบบรับสมัครนักเรียน
              <span className="block text-primary-600 mt-2">ปีการศึกษา 2567</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              โรงเรียนบวรมินทราชินูทิศเตรียมอุดมศึกษาน้อมเกล้า เปิดรับสมัครนักเรียนชั้นมัธยมศึกษาปีที่ 4
              ผ่านระบบออนไลน์ สะดวก รวดเร็ว ตรวจสอบสถานะได้ตลอด 24 ชั่วโมง
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={session ? "/applicant/apply" : "/register"}
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                สมัครเรียน
              </Link>
              <Link
                href="/check-result"
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-primary-600 bg-white border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                ตรวจสอบผลการสมัคร
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            ขั้นตอนการสมัคร
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. สมัครสมาชิก</h3>
              <p className="text-sm text-gray-500">ลงทะเบียนสร้างบัญชีผู้ใช้</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. กรอกใบสมัคร</h3>
              <p className="text-sm text-gray-500">เลือกหลักสูตรและกรอกข้อมูล</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. รอตรวจสอบ</h3>
              <p className="text-sm text-gray-500">รอเจ้าหน้าที่ตรวจสอบข้อมูล</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">4. รับผลการสมัคร</h3>
              <p className="text-sm text-gray-500">ตรวจสอบสิทธิ์และห้องสอบ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
            หลักสูตรที่เปิดรับสมัคร
          </h2>
          <p className="text-center text-gray-500 mb-12">
            ระดับชั้นมัธยมศึกษาปีที่ 4 ปีการศึกษา 2567
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">แผนการเรียนวิทย์-คณิต</h3>
              <p className="text-sm text-gray-500 mb-4">
                เน้นวิทยาศาสตร์และคณิตศาสตร์ เหมาะสำหรับผู้ที่ต้องการศึกษาต่อสายวิทยาศาสตร์
              </p>
              <p className="text-sm font-medium text-primary-600">รับ 120 คน</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">แผนการเรียนศิลป์-คำนวณ</h3>
              <p className="text-sm text-gray-500 mb-4">
                ผสมผสานศิลปศาสตร์และคณิตศาสตร์ เหมาะสำหรับผู้ที่สนใจสายบริหารธุรกิจ
              </p>
              <p className="text-sm font-medium text-primary-600">รับ 80 คน</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">แผนการเรียนศิลป์-ภาษา</h3>
              <p className="text-sm text-gray-500 mb-4">
                เน้นภาษาต่างประเทศ เหมาะสำหรับผู้ที่สนใจด้านภาษาและการสื่อสาร
              </p>
              <p className="text-sm font-medium text-primary-600">รับ 80 คน</p>
            </div>
          </div>
        </div>
      </section>

      {/* Check Result CTA */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            สมัครแล้ว? ตรวจสอบผลการสมัครได้ที่นี่
          </h2>
          <p className="text-primary-100 mb-8">
            กรอกเลขบัตรประชาชนและวันเกิดเพื่อตรวจสอบสถานะการสมัคร
          </p>
          <Link
            href="/check-result"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-primary-600 bg-white rounded-lg hover:bg-primary-50 transition-colors"
          >
            <Search className="w-5 h-5 mr-2" />
            ตรวจสอบผล
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            ติดต่อสอบถาม
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">โทรศัพท์</h3>
              <p className="text-gray-500">02-XXX-XXXX</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">อีเมล</h3>
              <p className="text-gray-500">admission@school.ac.th</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">ที่อยู่</h3>
              <p className="text-gray-500">กรุงเทพมหานคร</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-primary-600 font-bold text-sm">
                บ
              </div>
              <span className="text-sm text-gray-400">
                โรงเรียนบวรมินทราชินูทิศเตรียมอุดมศึกษาน้อมเกล้า
              </span>
            </div>
            <p className="text-sm text-gray-400">
              © 2567 ระบบรับสมัครนักเรียน
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
