# Application Setup Guide - Local Development

This guide covers setting up and running the Multi-Resolution Image Generator application locally using Docker and Docker Compose.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Compose Setup](#docker-compose-setup)
4. [Local Development](#local-development)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Docker** (v20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v1.29+) - [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Git** - For cloning the repository
- **curl** or **Postman** - For testing API endpoints

### Optional (for local service development)

- **Node.js 18+** - [Install Node.js](https://nodejs.org/)
- **Go 1.21+** - [Install Go](https://golang.org/dl/)
- **MongoDB** - For local database testing
- **Redis** - For local queue testing

### System Requirements

- **Disk Space**: Minimum 5GB free
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Ports Available**:
  - `3001` (Auth Service)
  - `3002` (App Service)
  - `8080` (Gateway)
  - `27017` (MongoDB)
  - `6379` (Redis)

---

## Environment Configuration

### 1. Clone the Repository

```bash
git clone <repository-url>
cd microsvc-jenkins-k8s-cicd
```

### 2. Create Root `.env` File

```bash
cat > .env << 'EOF'
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1

# Environment
NODE_ENV=development
EOF
```

### 3. Create Service Environment Files

**auth-service/.env**

```bash
cat > auth-service/.env << 'EOF'
PORT=3001
MONGODB_URI=mongodb://mongo:27017/auth_db
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_characters_long_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
NODE_ENV=development
EOF
```

**app-service/.env**

```bash
cat > app-service/.env << 'EOF'
PORT=3002
MONGODB_URI=mongodb://mongo:27017/app_db
REDIS_HOST=redis
REDIS_PORT=6379
AUTH_SERVICE_URL=http://auth-service:3001
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
NODE_ENV=development
EOF
```

**worker-service/.env**

```bash
cat > worker-service/.env << 'EOF'
MONGODB_URI=mongodb://mongo:27017/app_db
REDIS_HOST=redis
REDIS_PORT=6379
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
NODE_ENV=development
EOF
```

**gateway-service/.env**

```bash
cat > gateway-service/.env << 'EOF'
PORT=8080
AUTH_SERVICE_URL=http://auth-service:3001
APP_SERVICE_URL=http://app-service:3002
NODE_ENV=development
EOF
```

### 4. AWS S3 Setup (Required)

If you don't have an AWS account, create one at [AWS Console](https://aws.amazon.com/console/).

#### Create S3 Bucket and IAM User

The `docker-compose.yml` file contains detailed comments on setting up AWS credentials. In summary:

1. Create an S3 bucket in your AWS account
2. Create an IAM user with S3 permissions
3. Generate access keys
4. Add credentials to `.env` files above

---

## Docker Compose Setup

### 1. Build and Start Services

```bash
# Build all Docker images and start services
docker-compose up -d

# Or rebuild from scratch if needed
docker-compose up -d --build
```

### 2. Verify Services Are Running

```bash
# Check all services
docker-compose ps

# Expected output:
# NAME              STATUS         PORTS
# mongo             Up (healthy)   27017/tcp
# redis             Up (healthy)   6379/tcp
# auth-service      Up             3001/tcp
# app-service       Up             3002/tcp
# worker-service    Up
# gateway-service   Up             8080/tcp
```

### 3. View Service Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service (replace 'auth-service' with any service name)
docker-compose logs -f auth-service

# View last 100 lines
docker-compose logs --tail=100 auth-service

# View logs from last 10 minutes
docker-compose logs --since 10m auth-service
```

### 4. Check Service Health

```bash
# Gateway health check
curl http://localhost:8080/health

# Auth service health check
curl http://localhost:3001/health

# App service health check
curl http://localhost:3002/api/health

# Expected response: {"status":"ok"} or similar
```

---

## Local Development

### Option 1: Full Docker Compose (Recommended for beginners)

Everything runs in Docker. Best for quick testing and learning.

```bash
# Start all services
docker-compose up -d

# Access the application
open http://localhost:8080
# or
open http://localhost:3002
```

### Option 2: Hybrid Development (Services + Docker infrastructure)

Run services locally for development while keeping MongoDB and Redis in Docker.

```bash
# Start only infrastructure services
docker-compose up -d mongo redis

# In separate terminals, start each service:

# Terminal 1 - Auth Service
cd auth-service
npm install
npm run dev

# Terminal 2 - App Service
cd app-service
npm install
npm run dev

# Terminal 3 - Worker Service
cd worker-service
npm install
npm run dev

# Terminal 4 - Gateway Service
cd gateway-service
go mod download
go run main.go

# Terminal 5 - Frontend (if developing frontend)
cd frontend
npm install
npm start
```

### Option 3: Full Local Development

Run everything locally without Docker (requires local MongoDB and Redis).

```bash
# Start MongoDB locally (if installed)
mongod --dbpath /path/to/data

# Start Redis locally (if installed)
redis-server

# Then follow Terminal instructions from Option 2
```

---

## Testing & Verification

### Health Check Endpoints

```bash
# Gateway health
curl -X GET http://localhost:8080/health

# Auth service health
curl -X GET http://localhost:3001/health

# App service health
curl -X GET http://localhost:3002/api/health
```

### Test User Registration

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }'

# Expected response:
# {
#   "message": "User registered successfully",
#   "userId": "user_id_here",
#   "email": "testuser@example.com",
#   "accessToken": "eyJ...",
#   "refreshToken": "eyJ..."
# }
```

### Test User Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!"
  }'

# Save the accessToken from response for next steps
export TOKEN="eyJ..."
```

### Test Image Upload

```bash
# Create a test image file
# (You can use any image file you have, or a sample from the internet)

curl -X POST http://localhost:8080/api/images/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/your/image.jpg"

# Expected response:
# {
#   "message": "Image upload accepted for processing",
#   "imageId": "image_id_here",
#   "jobId": "job_id_here",
#   "status": "pending"
# }
```

### Test Gallery List

```bash
curl -X GET http://localhost:8080/api/images \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "images": [
#     {
#       "id": "image_id",
#       "originalName": "image.jpg",
#       "status": "pending",
#       "uploadedAt": "2024-01-04T10:30:00Z"
#     }
#   ]
# }
```

### Test Image Details

```bash
# Wait a few seconds for processing, then:
curl -X GET http://localhost:8080/api/images/image_id \
  -H "Authorization: Bearer $TOKEN"

# Expected response (when status is complete):
# {
#   "id": "image_id",
#   "status": "complete",
#   "sizes": {
#     "thumbnail": { "url": "https://s3.amazonaws.com/...", ... },
#     "small": { ... },
#     "medium": { ... },
#     "large": { ... },
#     "original": { ... }
#   }
# }
```

### Frontend Testing

Open browser to:

- **Gateway Frontend**: http://localhost:8080
- **App Service Frontend**: http://localhost:3002

Test flow:

1. Register new account
2. Login with credentials
3. Upload an image
4. Watch as image processes
5. View gallery with multiple resolutions

---

## Database Access

### MongoDB

```bash
# Access MongoDB shell
docker-compose exec mongo mongosh

# Switch to auth database
use auth_db

# View users
db.users.find()

# Switch to app database
use app_db

# View images
db.imagemetadatas.find()

# Count images
db.imagemetadatas.countDocuments()

# Exit
exit
```

### Redis

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Check queue length
LLEN resize-queue

# View a specific job
GET job:job_id_here

# View all keys
KEYS *

# Monitor redis operations in real-time
MONITOR

# Exit
exit
```

---

## Stopping and Cleanup

### Stop Services (Keep Data)

```bash
# Stop all running services
docker-compose stop

# View stopped containers
docker-compose ps

# Restart services
docker-compose start
```

### Stop and Remove Services (Keep Data)

```bash
# Stop and remove containers
docker-compose down

# Data in volumes is preserved
```

### Complete Cleanup (Delete All Data)

```bash
# Stop, remove containers, networks, and volumes
docker-compose down -v

# WARNING: This deletes all data in MongoDB and Redis
# Only use if you want a fresh start
```

### Remove Images

```bash
# Remove all images built by docker-compose
docker-compose down --rmi all

# Or remove specific image
docker rmi devsujal/auth-service:latest
```

---

## Troubleshooting

### Services Won't Start

**Problem**: `docker-compose up` fails or services crash

**Solutions**:

```bash
# 1. Check logs for errors
docker-compose logs auth-service

# 2. Ensure ports aren't in use
lsof -i :3001  # Check port 3001
lsof -i :3002  # Check port 3002
lsof -i :8080  # Check port 8080

# 3. If port in use, stop the process
kill -9 <PID>

# 4. Rebuild from scratch
docker-compose down -v
docker-compose up --build

# 5. Check Docker daemon is running
docker ps  # Should list containers
```

### MongoDB Connection Issues

**Problem**: Services can't connect to MongoDB

```bash
# 1. Check MongoDB logs
docker-compose logs mongo

# 2. Check MongoDB is healthy
docker-compose ps mongo

# 3. Test connection from MongoDB container
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# 4. Reset MongoDB
docker-compose down -v
docker-compose up mongo
```

### Redis Connection Issues

**Problem**: Worker service can't connect to Redis

```bash
# 1. Check Redis logs
docker-compose logs redis

# 2. Test Redis connection
docker-compose exec redis redis-cli ping

# 3. Check if queue has jobs
docker-compose exec redis redis-cli LLEN resize-queue

# 4. Reset Redis
docker-compose down -v
docker-compose up redis
```

### Images Not Processing

**Problem**: Images stuck in "pending" status

**Solutions**:

```bash
# 1. Check worker logs
docker-compose logs worker-service

# 2. Check if jobs are in queue
docker-compose exec redis redis-cli LLEN resize-queue

# 3. Check for error messages in MongoDB
docker-compose exec mongo mongosh
use app_db
db.imagemetadatas.find({status: "failed"})

# 4. Verify AWS credentials are correct
# Check .env files have correct AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

# 5. Check S3 bucket exists and is accessible
# Verify AWS_S3_BUCKET name is correct
```

### S3 Upload Failures

**Problem**: "Access Denied" or "NoSuchBucket" errors

**Solutions**:

```bash
# 1. Verify AWS credentials format
# AWS_ACCESS_KEY_ID should start with AKIA...
# AWS_SECRET_ACCESS_KEY should be a long string

# 2. Test AWS CLI (if installed locally)
aws configure
aws s3 ls  # Should list your buckets

# 3. Check IAM user has S3 permissions
# Required permissions:
# - s3:PutObject
# - s3:GetObject
# - s3:DeleteObject
# - s3:ListBucket

# 4. Check bucket name is correct
# Review AWS_S3_BUCKET in .env files

# 5. Verify bucket exists in correct region
# Check AWS_S3_REGION matches bucket region
```

### Frontend Can't Connect to Backend

**Problem**: Frontend shows "Cannot reach server" or similar errors

**Solutions**:

```bash
# 1. Check gateway is running
curl http://localhost:8080/health

# 2. Check CORS configuration
# Gateway should have CORS headers enabled
curl -v http://localhost:8080/health

# 3. Check service URLs in gateway
# APP_SERVICE_URL should be http://app-service:3002
# AUTH_SERVICE_URL should be http://auth-service:3001

# 4. Check network connectivity between services
docker-compose exec gateway-service ping app-service

# 5. View gateway logs for errors
docker-compose logs gateway-service
```

### Port Already in Use

**Problem**: `Error: bind: address already in use`

**Solutions**:

```bash
# Find process using port (example: 8080)
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different ports
# Edit docker-compose.yml ports section

# Or stop conflicting Docker containers
docker ps
docker stop <container_name>
```

### Out of Disk Space

**Problem**: Docker images or containers fill up disk

**Solutions**:

```bash
# Clean up unused Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df

# Remove specific image
docker rmi <image_id>
```

### Memory/Performance Issues

**Problem**: Services running slowly or crashing

**Solutions**:

```bash
# Check Docker resource limits
docker stats

# Increase Docker memory allocation
# On Mac: Docker Desktop → Preferences → Resources → Memory
# On Windows: Docker Desktop → Settings → Resources → Memory

# Stop less critical services
docker-compose stop worker-service  # If not processing

# Reduce log verbosity
# Edit service environment variables
```

### Authentication Token Expired

**Problem**: "Unauthorized" or "Token expired" errors

**Solutions**:

```bash
# 1. Register and login again
# Get new tokens

# 2. Refresh the token
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token"}'

# 3. Check JWT_SECRET is set correctly
# Both in auth-service/.env

# 4. Verify token hasn't actually expired
# Access tokens expire in 15 minutes by default
```

### Git Issues

**Problem**: Cannot push/pull or permission denied

**Solutions**:

```bash
# Set git config
git config user.name "Your Name"
git config user.email "your@email.com"

# If using SSH, add key
ssh-keygen -t ed25519
cat ~/.ssh/id_ed25519.pub  # Add to GitHub SSH keys

# Or use HTTPS instead
git remote set-url origin https://github.com/username/repo.git
```

---

## Performance Optimization

### For Local Development

```bash
# 1. Disable logging in development
# Set LOG_LEVEL=error in .env files

# 2. Use 1 worker service instance
# Edit docker-compose.yml, remove service replicas

# 3. Increase MongoDB cache
# Edit docker-compose.yml MongoDB environment

# 4. Monitor resource usage
docker stats --no-stream
```

### For Image Processing

```bash
# 1. Adjust Sharp quality settings
# Edit worker-service/src/utils/imageProcessor.ts
# Quality: 80 for JPEG, 9 for PNG

# 2. Increase worker instances
docker-compose up -d --scale worker-service=3

# 3. Check Redis memory
docker-compose exec redis redis-cli INFO memory
```

---

## Advanced Configuration

### Custom Ports

Edit `docker-compose.yml`:

```yaml
services:
  auth-service:
    ports:
      - "3001:3001" # Change first number to different port
```

### Custom Database Names

Edit service `.env` files:

```bash
MONGODB_URI=mongodb://mongo:27017/custom_db_name
```

### Environment Variables

Add to `.env` files:

```bash
# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Performance
MAX_UPLOAD_SIZE=50mb
IMAGE_QUEUE_CONCURRENCY=5

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Next Steps

After successful local setup:

1. **Explore the Code**: Review service implementations
2. **Test All Features**: Follow testing section above
3. **Modify & Extend**: Build on top of the foundation
4. **Deploy to Cloud**: See [AWS_KUBERNETES_SETUP.md](./AWS_KUBERNETES_SETUP.md)
5. **Set Up CI/CD**: See [JENKINS_PIPELINE_SETUP.md](./JENKINS_PIPELINE_SETUP.md)

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Redis Documentation](https://redis.io/documentation)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Go Documentation](https://golang.org/doc/)

---

**Last Updated**: January 2026  
**Version**: 1.0.0

---

### Navigation

- ← Back to [README.md](./README.md)
- Next → [AWS_KUBERNETES_SETUP.md](./AWS_KUBERNETES_SETUP.md)
