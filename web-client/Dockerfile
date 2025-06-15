# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy lockfile & install deps
COPY package*.json ./
RUN npm install

# Copy semua kode & build
COPY . .
RUN npm run build

# 2) Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Hanya salin file yang dibutuhkan
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

EXPOSE 3000
CMD ["npm","start"] 