import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.ac.th' },
    update: {},
    create: {
      email: 'admin@school.ac.th',
      name: 'ผู้ดูแลระบบ',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Created admin user:', admin.email)

  // Create academic year
  const academicYear = await prisma.academicYear.upsert({
    where: { year: '2567' },
    update: {},
    create: {
      year: '2567',
      name: 'ปีการศึกษา 2567',
      isActive: true,
      startDate: new Date('2024-05-16'),
      endDate: new Date('2025-03-31'),
    },
  })
  console.log('✅ Created academic year:', academicYear.name)

  // Create sample courses
  const courses = [
    {
      code: 'SCI-MATH',
      name: 'วิทย์-คณิต',
      capacity: 120,
      registrationStart: new Date('2024-12-01'),
      registrationEnd: new Date('2025-12-31'),
    },
    {
      code: 'LANG-MATH',
      name: 'ศิลป์-คำนวณ',
      capacity: 80,
      registrationStart: new Date('2024-12-01'),
      registrationEnd: new Date('2025-12-31'),
    },
    {
      code: 'LANG-LANG',
      name: 'ศิลป์-ภาษา',
      capacity: 80,
      registrationStart: new Date('2024-12-01'),
      registrationEnd: new Date('2025-12-31'),
    },
  ]

  for (const course of courses) {
    await prisma.course.upsert({
      where: {
        code_academicYearId: {
          code: course.code,
          academicYearId: academicYear.id,
        },
      },
      update: {
        registrationStart: course.registrationStart,
        registrationEnd: course.registrationEnd,
        isOpen: true,
      },
      create: {
        ...course,
        isOpen: true,
        academicYearId: academicYear.id,
      },
    })
    console.log('✅ Created course:', course.name)
  }

  // Create sample exam rooms
  const rooms = [
    { roomNumber: '101', building: 'อาคาร 1', floor: '1', capacity: 30 },
    { roomNumber: '102', building: 'อาคาร 1', floor: '1', capacity: 30 },
    { roomNumber: '103', building: 'อาคาร 1', floor: '1', capacity: 30 },
    { roomNumber: '201', building: 'อาคาร 1', floor: '2', capacity: 35 },
    { roomNumber: '202', building: 'อาคาร 1', floor: '2', capacity: 35 },
    { roomNumber: '301', building: 'อาคาร 2', floor: '3', capacity: 40 },
  ]

  for (const room of rooms) {
    await prisma.examRoom.upsert({
      where: {
        roomNumber_building: {
          roomNumber: room.roomNumber,
          building: room.building!,
        },
      },
      update: {},
      create: room,
    })
    console.log('✅ Created exam room:', `${room.building} ห้อง ${room.roomNumber}`)
  }

  // Create terms and conditions
  await prisma.termsCondition.upsert({
    where: { id: 'default-terms' },
    update: {},
    create: {
      id: 'default-terms',
      title: 'ข้อตกลงและเงื่อนไขการสมัคร',
      version: '1.0',
      isActive: true,
      content: `
1. ผู้สมัครต้องกรอกข้อมูลตามความเป็นจริง
2. เอกสารที่แนบต้องเป็นเอกสารจริงและชัดเจน
3. ผู้สมัครต้องมาสอบตามวันและเวลาที่กำหนด
4. การพิจารณาของคณะกรรมการถือเป็นที่สิ้นสุด
5. โรงเรียนขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขโดยไม่แจ้งล่วงหน้า
      `.trim(),
    },
  })
  console.log('✅ Created terms and conditions')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
