# syntax=docker/dockerfile:1
# Multi-stage build สำหรับ Next.js standalone + Prisma (SQLite)

FROM node:22-alpine AS base
WORKDIR /app

# ---- dependencies ----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# postinstall รัน prisma generate — ต้องมี schema ก่อน
COPY tsconfig.json ./
RUN mkdir -p src && npm ci --ignore-scripts

# ---- build -----------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ---- runtime ---------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# standalone มี node_modules ที่จำเป็น + server.js ในตัว
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# prisma CLI สำหรับ migrate ตอน start + migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv

# ที่เก็บ SQLite — mount volume ที่ /data เพื่อให้ข้อมูลอยู่รอดข้าม deploy
RUN mkdir -p /data && chown nextjs:nodejs /data
ENV DATABASE_URL="file:/data/prod.db"

USER nextjs
EXPOSE 3000

# migrate ก่อน start ทุกครั้ง (idempotent)
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
