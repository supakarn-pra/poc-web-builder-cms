# การ Deploy

POC นี้ deploy ได้ 2 แนวทางหลัก เลือกตามความสะดวก

---

## ทางที่ 1: Docker / VPS (แนะนำสำหรับ POC)

ใช้ SQLite ในตัว ไม่ต้องมี database แยก — เหมาะกับ DigitalOcean, Railway,
Render, Fly.io หรือเซิร์ฟเวอร์ในองค์กร

```bash
# build image
docker build -t poc-web-builder .

# รัน — mount volume เพื่อให้ข้อมูล SQLite อยู่รอดข้าม deploy
docker run -d \
  -p 3000:3000 \
  -v webbuilder-data:/data \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  --name web-builder \
  poc-web-builder
```

- Container จะรัน `prisma migrate deploy` อัตโนมัติก่อน start
- ข้อมูลอยู่ที่ volume `webbuilder-data` (path `/data/prod.db`)
- Seed ข้อมูลเริ่มต้น (admin + เว็บ demo):
  `docker exec web-builder npx prisma db seed`
- **รูปที่อัปโหลด** เก็บที่ `public/uploads` — บน Docker ต้อง mount volume เพิ่ม:
  `-v webbuilder-uploads:/app/public/uploads` ไม่งั้นรูปหายตอน redeploy
  (บน serverless/Vercel ให้สลับเป็น S3/R2 — DB เก็บแค่ URL สลับได้ที่ `/api/media`)

### รันบน VPS ตรง ๆ (ไม่ใช้ Docker)

```bash
npm ci
cp .env.example .env         # แก้ AUTH_SECRET + DATABASE_URL
npx prisma migrate deploy
npm run build
npm start                    # หรือใช้ pm2 / systemd
```

### Reverse proxy + subdomain (สำหรับ Sprint 5)

ระบบ publish ใช้ wildcard subdomain — ตั้ง DNS `*.yourplatform.com`
ชี้มาที่เซิร์ฟเวอร์ แล้วให้ nginx/Caddy ส่ง Host header เข้ามา
(proxy.ts จะ rewrite เป็น `/sites/[subdomain]` ให้เอง — งานใน Sprint 5)

---

## ทางที่ 2: Vercel

ข้อจำกัด: filesystem บน serverless ไม่ persist → **ใช้ SQLite ไม่ได้**
ต้องใช้ Postgres (แนะนำ Neon หรือ Supabase — ฟรี tier พอสำหรับ POC)

ขั้นตอนเปลี่ยนเป็น Postgres:

1. แก้ `prisma/schema.prisma`
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
2. เปลี่ยน adapter ใน `src/lib/db.ts` และ `prisma/seed.ts`
   ```bash
   npm i @prisma/adapter-pg
   ```
   ```ts
   import { PrismaPg } from "@prisma/adapter-pg";
   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
   ```
3. ลบ `prisma/migrations` เดิม (สร้างกับ SQLite) แล้ว
   `npx prisma migrate dev --name init` ใหม่กับ Postgres
4. ตั้ง env บน Vercel: `DATABASE_URL`, `AUTH_SECRET`
5. Build command บน Vercel ใช้ค่า default ได้เลย (`next build` +
   postinstall รัน `prisma generate` ให้แล้ว)

หมายเหตุ: ฟีเจอร์อัปโหลดรูป (Sprint 4) บน Vercel ต้องใช้ S3/R2/Blob storage
— โค้ดจะเตรียม interface ให้สลับได้

---

## Checklist ก่อนขึ้น Production จริง

- [ ] เปลี่ยน `AUTH_SECRET` (ห้ามใช้ค่า default — session ปลอมได้)
- [ ] เปลี่ยนรหัส admin ที่ seed ไว้ (`admin@example.com / admin1234`)
- [ ] ปิด open registration ถ้าต้องการ invite-only (แก้ `register` action)
- [ ] ตั้ง HTTPS (Caddy จัดให้อัตโนมัติ / Cloudflare / certbot)
- [ ] Backup volume `/data` (SQLite = ไฟล์เดียว copy ได้ตรง ๆ)
