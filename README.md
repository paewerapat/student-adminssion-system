# ระบบรับสมัครนักเรียน

## Tech Stack
- Next.js 14 (App Router)
- PostgreSQL
- Prisma ORM
- NextAuth.js
- Tailwind CSS

## Quick Start

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Generate Prisma Client
npm run db:generate

# 4. Push schema to database
npm run db:push

# 5. Seed database
npm run db:seed

# 6. Start development server
npm run dev
```

## Default Admin Account
- Email: `admin@school.ac.th`
- Password: `admin123`

## Project Structure

```
src/
├── app/
│   ├── api/auth/        # Auth API routes
│   ├── admin/           # Admin pages
│   ├── applicant/       # Applicant pages
│   └── (auth)/          # Login/Register
├── components/
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   └── layouts/         # Layout components
├── lib/
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # NextAuth config
│   └── utils.ts         # Utility functions
└── types/               # TypeScript types
```
