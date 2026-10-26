# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Install client dependencies and build SPA
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# Install server dependencies and build TypeScript
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma/
RUN cd server && npm install && npx prisma generate

COPY server/ ./server/
RUN cd server && npm run build

# Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy built server and dependencies
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/src/knowledge ./dist/knowledge

# Copy built client frontend (served statically by Express)
COPY --from=builder /app/client/dist /app/client/dist

# Copy sample data for seed
COPY bookleaf_sample_data.json /app/bookleaf_sample_data.json

EXPOSE 5000

# Push schema, seed DB if empty, and start
CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && node dist/index.js"]
