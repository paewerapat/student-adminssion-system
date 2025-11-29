import Link from 'next/link'
import { Button } from '@/components/ui'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container-app py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              บ
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">โรงเรียนบวรมินทราชินูทิศฯ</h1>
              <p className="text-sm text-gray-500">ระบบรับสมัครนักเรียนออนไลน์</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/register">
              <Button>สมัครสมาชิก</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container-app py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ระบบรับสมัครนักเรียน
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            โรงเรียนบวรมินทราชินูทิศเตรียมอุดมศึกษาน้อมเกล้า
          </p>
          <p className="text-gray-500 mb-8">
            สมัครเรียนออนไลน์ได้ง่ายๆ ตรวจสอบสถานะ และดูผลสอบได้ทันที
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">เริ่มสมัครเรียน</Button>
            </Link>
            <Link href="/check-result">
              <Button size="lg" variant="outline">ตรวจสอบผลสอบ</Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">สมัครออนไลน์</h3>
            <p className="text-gray-500">กรอกใบสมัครและแนบเอกสารได้สะดวกผ่านระบบออนไลน์</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ตรวจสอบสถานะ</h3>
            <p className="text-gray-500">ติดตามสถานะการสมัครได้ทุกขั้นตอนแบบ Real-time</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ดูผลสอบ</h3>
            <p className="text-gray-500">ประกาศผลสอบและตรวจสอบคะแนนได้ทันทีหลังประกาศ</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="container-app py-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2567 โรงเรียนบวรมินทราชินูทิศเตรียมอุดมศึกษาน้อมเกล้า
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
