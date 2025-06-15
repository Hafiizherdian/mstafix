# — Stage 1: build
FROM node:18-bullseye AS builder
WORKDIR /app

# Salin file package.json dan package-lock.json
COPY package*.json ./

# Instal semua dependensi
RUN npm ci

# Salin file konfigurasi dan source code
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client dan build TypeScript
RUN npx prisma generate && npm run build

# — Stage 2: production
FROM node:18-bullseye AS runner
WORKDIR /app

# Set environment ke production
ENV NODE_ENV=production

# Salin file package.json, prisma schema, dan dependensi
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Instal hanya dependensi production dan generate Prisma Client
RUN npm ci --production && \
    npx prisma generate

# Salin hasil build
COPY --from=builder /app/dist ./dist

# Expose port aplikasi
EXPOSE 3003

# Jalankan aplikasi dengan prisma migrate
CMD npx prisma migrate deploy && node dist/index.js