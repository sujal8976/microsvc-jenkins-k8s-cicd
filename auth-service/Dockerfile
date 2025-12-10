FROM node:22.12.0-alpine3.20 AS builder
WORKDIR /auth-service/app
COPY auth-service/package*.json ./
RUN npm ci
COPY auth-service/ ./
RUN npm run build

FROM node:22.12.0-alpine3.20
WORKDIR /auth-service
# Copy built assets and runtime dependencies from builder
COPY --from=builder /auth-service/app/dist ./dist
EXPOSE 3001

CMD [ "node", "dist/index.js"]