# Stage 1 — build frontend
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2 — production
FROM node:22-alpine AS runner

WORKDIR /app

# Copy only what's needed to run
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig*.json ./

ENV NODE_ENV=production
# PORT can be overridden via Coolify environment variables
ENV PORT=3001

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
