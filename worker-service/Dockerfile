FROM node:22.12.0-alpine3.20 AS builder
WORKDIR /worker-service/app
COPY worker-service/package*.json ./
RUN npm ci
COPY worker-service/ ./
RUN npm run build

FROM node:22.12.0-alpine3.20
WORKDIR /worker-service
# Copy built assets and the node_modules from the builder stage so native
# modules like sharp are available at runtime without re-installing.
COPY --from=builder /worker-service/app/dist ./dist
RUN npm i sharp

CMD [ "node", "dist/index.js"]