FROM node:22-alpine AS builder
WORKDIR /app/backend

RUN apk add --no-cache python3 make g++

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/. .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

RUN apk del python3 make g++

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/generated ./generated
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/prisma.config.ts ./prisma.config.ts

# Templates/catalog live one level up from backend/ in the repo; mirror that layout here
# so backend code can resolve them the same way (path.resolve(process.cwd(), "..", ...))
# whether running in Docker or locally via `npm run start:dev` from backend/.
COPY templates /app/templates
COPY catalog.json /app/catalog.json

EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --force-reset --accept-data-loss && node dist/src/main.js"]
