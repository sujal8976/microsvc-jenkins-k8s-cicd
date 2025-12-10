## Dockerfile for app-service
## Note: This Dockerfile expects the build context to be the repository root
## so that the `frontend/` directory is available. Build from the repo root:
##   docker build -f app-service/Dockerfile -t devsujal/app-service:latest .

FROM node:iron-alpine3.22 AS frontend-build
WORKDIR /app-service/frontend
# Copy frontend sources from repo-root `frontend/`
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:iron-alpine3.22 AS backend-build
WORKDIR /app-service/backend
# Copy backend package files (assumed to be inside app-service directory)
COPY app-service/package*.json ./
RUN npm ci
# Copy the backend source from the repo root app-service directory
COPY app-service/ ./
RUN npm run build

FROM node:iron-alpine3.22
WORKDIR /app-service
# Copy built frontend and backend from their build stages
COPY --from=frontend-build /app-service/frontend/build/ ./public
COPY --from=backend-build /app-service/backend/dist ./dist
EXPOSE 3002
CMD ["node", "dist/index.js"]