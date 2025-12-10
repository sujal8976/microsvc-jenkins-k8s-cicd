# Setup & Installation Guide

## 📋 Prerequisites

Before starting, ensure you have:

- **Docker** (v20.10+)
- **Docker Compose** (v1.29+)
- **AWS Account** with S3 access
- **Git**
- Optional: Node.js 18+, Go 1.21+ (for local development)

## 🔐 AWS S3 Setup

### 1. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://your-bucket-name --region us-east-1

# Create folder structure
aws s3api put-object --bucket your-bucket-name --key originals/
aws s3api put-object --bucket your-bucket-name --key thumbnail/
aws s3api put-object --bucket your-bucket-name --key small/
aws s3api put-object --bucket your-bucket-name --key medium/
aws s3api put-object --bucket your-bucket-name --key large/
```

### 2. Create IAM User (Recommended)

```bash
# Create IAM user
aws iam create-user --user-name image-processor

# Create access keys
aws iam create-access-key --user-name image-processor

# Attach policy
aws iam put-user-policy --user-name image-processor \
  --policy-name S3ImageProcessing \
  --policy-document file://s3-policy.json
```

### 3. S3 Policy (s3-policy.json)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

### 4. Enable Public Access (Optional)

To make images publicly accessible:

```bash
# Update bucket policy
aws s3api put-bucket-policy --bucket your-bucket-name \
  --policy file://bucket-policy.json
```

**bucket-policy.json:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## 🚀 Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd microsvc-jenkins-k8s-cicd
```

### 2. Configure Environment

```bash
# Copy example files
cp auth-service/.env.example auth-service/.env
cp app-service/.env.example app-service/.env
cp worker-service/.env.example worker-service/.env
cp gateway-service/.env.example gateway-service/.env

# Create root .env file
cat > .env << EOF
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
EOF
```

### 3. Update Environment Files

Edit `.env` files with your AWS credentials:

**auth-service/.env:**

```
PORT=3001
MONGODB_URI=mongodb://mongo:27017/auth_db
JWT_SECRET=generate_a_random_32_char_string_here
JWT_REFRESH_SECRET=generate_another_random_32_char_string_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
NODE_ENV=production
```

**app-service/.env:**

```
PORT=3002
MONGODB_URI=mongodb://mongo:27017/app_db
REDIS_HOST=redis
REDIS_PORT=6379
AUTH_SERVICE_URL=http://auth-service:3001
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
NODE_ENV=production
```

**worker-service/.env:**

```
MONGODB_URI=mongodb://mongo:27017/app_db
REDIS_HOST=redis
REDIS_PORT=6379
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
NODE_ENV=production
```

**gateway-service/.env:**

```
PORT=8080
AUTH_SERVICE_URL=http://auth-service:3001
APP_SERVICE_URL=http://app-service:3002
NODE_ENV=production
```

### 4. Start Services

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f worker-service
```

### 5. Verify Installation

```bash
# Check gateway health
curl http://localhost:8080/health

# Check auth service health
curl http://localhost:3001/health

# Check app service health
curl http://localhost:3002/api/health

# Check MongoDB
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Check Redis
docker-compose exec redis redis-cli ping
```

## 🧪 Testing the System

### 1. Register User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Response:
# {
#   "message": "User registered successfully",
#   "userId": "...",
#   "email": "test@example.com",
#   "accessToken": "...",
#   "refreshToken": "..."
# }
```

### 2. Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Save the accessToken for next requests
```

### 3. Upload Image

```bash
curl -X POST http://localhost:8080/api/images/upload \
  -H "Authorization: Bearer <accessToken>" \
  -F "image=@/path/to/image.jpg"

# Response:
# {
#   "message": "Image upload accepted for processing",
#   "imageId": "...",
#   "jobId": "...",
#   "status": "pending"
# }
```

### 4. Check Status

```bash
curl -X GET "http://localhost:8080/api/images/<imageId>/status" \
  -H "Authorization: Bearer <accessToken>"
```

### 5. Fetch Image Details

Wait for processing to complete, then:

```bash
curl -X GET "http://localhost:8080/api/images/<imageId>" \
  -H "Authorization: Bearer <accessToken>"

# Response includes all resolutions with S3 URLs
```

## 🔧 Local Development Setup

### Auth Service

```bash
cd auth-service
npm install
npm run dev
# Runs on http://localhost:3001
```

### App Service

```bash
cd app-service
npm install
npm run dev
# Runs on http://localhost:3002
```

### Worker Service

```bash
cd worker-service
npm install
npm run dev
```

### Gateway Service

```bash
cd gateway-service
go mod download
go run main.go
# Runs on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

## 🐛 Troubleshooting

### Services won't start

```bash
# Check Docker status
docker ps -a

# View full logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### MongoDB connection error

```bash
# Check MongoDB container
docker-compose logs mongo

# Verify connection
docker-compose exec mongo mongosh

# Check users
use auth_db
show collections
```

### Redis connection error

```bash
# Check Redis container
docker-compose logs redis

# Test connection
docker-compose exec redis redis-cli ping
```

### S3 upload failures

```bash
# Verify credentials
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Check bucket exists
aws s3 ls s3://your-bucket-name

# Check IAM permissions
aws iam list-user-policies --user-name image-processor
```

### Port already in use

```bash
# Find process using port
lsof -i :8080
lsof -i :3001
lsof -i :3002

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

## 📊 Monitoring

### Check Service Logs

```bash
# Real-time logs
docker-compose logs -f [service-name]

# Last N lines
docker-compose logs --tail=100 [service-name]

# Specific time range
docker-compose logs --since 10m [service-name]
```

### Monitor Resources

```bash
# Docker stats
docker stats

# Check memory usage
docker-compose exec [service] free -h

# Check disk space
docker-compose exec [service] df -h
```

## 🧹 Cleanup

```bash
# Stop services
docker-compose down

# Remove volumes (delete data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean up everything
docker system prune -a
```

## 📈 Performance Tuning

### MongoDB Optimization

```bash
# Create indices
docker-compose exec mongo mongosh
use app_db
db.imagemetadatas.createIndex({ "userId": 1 })
db.imagemetadatas.createIndex({ "status": 1 })
```

### Redis Optimization

```bash
# Configure persistence
docker-compose exec redis redis-cli CONFIG SET save "900 1 300 10 60 10000"

# Check memory
docker-compose exec redis redis-cli INFO memory
```

### Worker Scaling

```bash
# Run multiple workers
docker-compose up -d --scale worker-service=3
```

## 🔐 Security Checklist

- [ ] Change JWT secrets to strong random values
- [ ] Update AWS IAM policies to least privilege
- [ ] Enable HTTPS/TLS for all endpoints
- [ ] Set strong MongoDB passwords
- [ ] Enable Redis authentication
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Add request validation

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Gin Framework](https://gin-gonic.com/)
- [Mongoose ODM](https://mongoosejs.com/)

## 🆘 Getting Help

1. Check logs first: `docker-compose logs [service]`
2. Verify environment variables are set
3. Check service connectivity: `docker-compose exec [service] ping [other-service]`
4. Review README.md for architecture details
5. Check GitHub issues for known problems
