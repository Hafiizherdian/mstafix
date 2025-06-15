FROM node:18-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN apt-get update && apt-get install -y openssl postgresql-client netcat-openbsd

COPY tsconfig.json ./
COPY prisma ./prisma

RUN npx prisma generate

COPY src ./src
RUN npm run build

EXPOSE 3001

RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Waiting for PostgreSQL..."\n\
until pg_isready -h auth-db -p 5432 -U user; do\n\
  echo "PostgreSQL is unavailable - sleeping"\n\
  sleep 1\n\
done\n\
\n\
echo "PostgreSQL is up - executing command"\n\
\n\
echo "Setting up database schema..."\n\
npx prisma db push --accept-data-loss\n\
\n\
echo "Starting auth service..."\n\
node dist/index.js\n\
' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]