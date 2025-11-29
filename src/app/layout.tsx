import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/auth-provider'

export const metadata: Metadata = {
  title: 'ระบบรับสมัครนักเรียน | โรงเรียนบวรมินทราชินูทิศเตรียมอุดมศึกษาน้อมเกล้า',
  description: 'ระบบรับสมัครนักเรียนออนไลน์',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
