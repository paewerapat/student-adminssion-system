# วิธีติดตั้งและรันระบบรับสมัครนักเรียน

## ขั้นตอนที่ 1: ติดตั้ง Software ที่จำเป็น

### 1.1 ติดตั้ง Node.js
1. ไปที่ https://nodejs.org
2. ดาวน์โหลด LTS version (แนะนำ 20.x หรือใหม่กว่า)
3. รัน installer และกด Next ไปเรื่อยๆ จนเสร็จ
4. เปิด Command Prompt หรือ PowerShell ทดสอบ:
   ```
   node -v
   npm -v
   ```

### 1.2 ติดตั้ง Docker Desktop
1. ไปที่ https://www.docker.com/products/docker-desktop
2. ดาวน์โหลด Docker Desktop for Windows
3. รัน installer (อาจต้อง restart เครื่อง)
4. เปิด Docker Desktop รอจนสถานะเป็น "Running"
5. ทดสอบ:
   ```
   docker -v
   ```

### 1.3 ติดตั้ง Git (ถ้ายังไม่มี)
1. ไปที่ https://git-scm.com/download/win
2. ดาวน์โหลดและติดตั้ง

---

## ขั้นตอนที่ 2: ตั้งค่าโปรเจค

### 2.1 แตกไฟล์โปรเจค
แตก zip ไปยังโฟลเดอร์ที่ต้องการ เช่น `C:\Projects\school-admission-system`

### 2.2 เปิด Terminal ที่โฟลเดอร์โปรเจค
```bash
cd C:\Projects\school-admission-system
```

### 2.3 ติดตั้ง Dependencies
```bash
npm install
```

### 2.4 สร้างไฟล์ .env
สร้างไฟล์ `.env` ที่ root ของโปรเจค:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/school_admission"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

---

## ขั้นตอนที่ 3: รัน Database

### 3.1 Start PostgreSQL ด้วย Docker
```bash
docker-compose up -d
```
รอสักครู่ให้ database พร้อม

### 3.2 สร้างตารางใน Database
```bash
npm run db:generate
npm run db:push
```

### 3.3 ใส่ข้อมูลเริ่มต้น (Seed)
```bash
npm run db:seed
```

---

## ขั้นตอนที่ 4: รันโปรเจค

```bash
npm run dev
```

เปิด Browser ไปที่ http://localhost:3000

---

## ข้อมูล Login

### Admin
- URL: http://localhost:3000/login
- Email: `admin@school.ac.th`
- Password: `admin123`

### ผู้สมัคร
- สมัครสมาชิกใหม่ที่ http://localhost:3000/register

---

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ใช้ทำอะไร |
|--------|-----------|
| `npm run dev` | รันโปรเจค (development) |
| `npm run build` | Build สำหรับ production |
| `npm run start` | รัน production build |
| `docker-compose up -d` | Start database |
| `docker-compose down` | Stop database |
| `npm run db:seed` | ใส่ข้อมูลเริ่มต้น |
| `npx prisma studio` | เปิด GUI จัดการ database |

---

## หน้าหลักในระบบ

| หน้า | URL | ใช้ทำอะไร |
|------|-----|-----------|
| หน้าแรก | `/` | Landing page |
| สมัครสมาชิก | `/register` | สร้างบัญชีผู้สมัคร |
| เข้าสู่ระบบ | `/login` | Login |
| ตรวจผลการสมัคร | `/check-result` | ตรวจสอบสถานะ (ไม่ต้อง login) |
| **ผู้สมัคร** | | |
| Dashboard | `/applicant` | หน้าหลักผู้สมัคร |
| สมัครเรียน | `/applicant/apply` | กรอกใบสมัคร |
| ดูสถานะ | `/applicant/status` | ดูสถานะการสมัคร |
| **Admin** | | |
| Dashboard | `/admin` | ภาพรวมระบบ |
| หลักสูตร | `/admin/courses` | จัดการหลักสูตร |
| ห้องสอบ | `/admin/exam-rooms` | จัดการห้องสอบ |
| ผู้สมัคร | `/admin/applicants` | จัดการผู้สมัคร |
| จัดห้องสอบ | `/admin/exam-assignment` | จัดห้องสอบอัตโนมัติ |
| Export | `/admin/export` | ส่งออก Excel |

---

## แก้ปัญหาเบื้องต้น

### Docker ไม่ทำงาน
- ตรวจสอบว่า Docker Desktop เปิดอยู่และสถานะเป็น "Running"
- ลอง restart Docker Desktop

### Database connection error
- ตรวจสอบว่า Docker container รันอยู่: `docker ps`
- ตรวจสอบ DATABASE_URL ใน .env

### Port 3000 ถูกใช้งานอยู่
- ปิดโปรแกรมที่ใช้ port 3000
- หรือเปลี่ยน port: `npm run dev -- -p 3001`

### ไม่มีหลักสูตรให้สมัคร
- รัน seed ใหม่: `npm run db:seed`
- หรือไปแก้วันที่ปิดรับสมัครที่ `/admin/courses`
