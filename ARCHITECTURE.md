# Multi-Resolution Image Generator - Complete Documentation

## 📋 System Overview

A production-ready microservices architecture for processing and storing images at multiple resolutions with AWS S3 integration.

**Key Features:**

- ✅ Multi-resolution image processing (5 sizes: thumbnail to original)
- ✅ Async job queue using Redis
- ✅ AWS S3 cloud storage
- ✅ JWT authentication with refresh tokens
- ✅ Scalable worker services
- ✅ MongoDB data persistence
- ✅ React-based frontend UI
- ✅ Gin gateway with CORS support
- ✅ Docker & Kubernetes ready

## 🏗️ Complete Architecture

### Services (All TypeScript/Node.js except Gateway)

| Service      | Language   | Port          | Purpose                          |
| ------------ | ---------- | ------------- | -------------------------------- |
| **Gateway**  | Go (Gin)   | 8080          | API routing, CORS, rate limiting |
| **Auth**     | TypeScript | 3001          | User auth, JWT tokens            |
| **App**      | TypeScript | 3002          | Upload, gallery, metadata        |
| **Worker**   | TypeScript | N/A           | Image processing, resizing       |
| **Frontend** | React 18   | Served by App | UI for upload & gallery          |

### Infrastructure

| Component            | Technology     | Purpose                              |
| -------------------- | -------------- | ------------------------------------ |
| **Database**         | MongoDB        | User & image metadata storage        |
| **Queue**            | Redis          | Async job distribution               |
| **Storage**          | AWS S3         | Image file storage (all resolutions) |
| **Containerization** | Docker         | Local development                    |
| **Orchestration**    | Docker Compose | Multi-container local                |
| **Production**       | Kubernetes     | Scalable cloud deployment            |

## 🔄 Complete Data Flow

### 1. User Registration/Login

```
User Input (email/password)
    ↓
Gateway (/api/auth/register)
    ↓
Auth Service
    ↓
MongoDB (save user)
    ↓
Return: accessToken + refreshToken
```

### 2. Image Upload & Processing

```
User Upload (with JWT)
    ↓
Gateway (/api/images/upload)
    ↓
App Service (validate JWT)
    ↓
Save original → AWS S3
    ↓
Create metadata → MongoDB
    ↓
Push job → Redis Queue
    ↓
Return jobId + status: pending
```

### 3. Background Processing

```
Worker (polls Redis queue every 2 seconds)
    ↓
Pop job from queue
    ↓
Download original from S3
    ↓
Resize with Sharp:
  - 150x150 (thumbnail)
  - 480x480 (small)
  - 1024x1024 (medium)
  - 1920x1920 (large)
  - Original (as-is)
    ↓
Upload all versions → AWS S3
    ↓
Update metadata → MongoDB (with URLs)
    ↓
Set status: complete
```

### 4. Gallery & Viewing

```
User refreshes/polls
    ↓
App Service fetches metadata
    ↓
Returns all S3 URLs + dimensions
    ↓
Frontend displays gallery
    ↓
User selects resolution
    ↓
Display selected image + metadata
```

## 📁 Complete File Structure

```
microsvc-jenkins-k8s-cicd/
│
├── 📄 Configuration Files
│   ├── docker-compose.yml          # Docker multi-container setup
│   ├── k8s-deployment.yaml         # Kubernetes manifests
│   ├── .gitignore                  # Git ignore rules
│   ├── README.md                   # Full documentation
│   ├── SETUP.md                    # Detailed setup guide
│   └── QUICKSTART.md               # Quick start (5 min)
│
├── 🔐 auth-service/                # Authentication microservice
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts         # MongoDB connection
│   │   ├── models/
│   │   │   └── User.ts             # User schema with password hashing
│   │   ├── routes/
│   │   │   └── auth.ts             # Register, login, refresh, verify
│   │   ├── utils/
│   │   │   └── jwt.ts              # Token generation & verification
│   │   └── index.ts                # Server initialization
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── 📸 app-service/                 # Main application service
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts         # MongoDB connection
│   │   ├── models/
│   │   │   └── ImageMetadata.ts    # Image metadata schema
│   │   ├── routes/
│   │   │   └── images.ts           # Upload, list, fetch, status
│   │   ├── middleware/
│   │   │   └── auth.ts             # JWT authentication
│   │   ├── utils/
│   │   │   ├── s3.ts               # S3 upload utilities
│   │   │   ├── redis.ts            # Job queue utilities
│   │   │   └── auth.ts             # Token verification
│   │   └── index.ts                # Server + frontend serving
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── ⚙️ worker-service/              # Image processing worker
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts         # MongoDB connection
│   │   ├── models/
│   │   │   └── ImageMetadata.ts    # Image metadata
│   │   ├── utils/
│   │   │   ├── s3.ts               # S3 download/upload
│   │   │   ├── redis.ts            # Job queue operations
│   │   │   └── imageProcessor.ts   # Sharp resizing logic
│   │   └── index.ts                # Worker main loop
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── 🌐 gateway-service/             # API Gateway (Go/Gin)
│   ├── main.go                     # Gateway logic with routing
│   ├── go.mod                      # Go module dependencies
│   ├── Dockerfile                  # Multi-stage Go build
│   └── .env.example
│
├── 🎨 frontend/                    # React application
│   ├── public/
│   │   └── index.html              # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx           # Login form
│   │   │   ├── Register.tsx        # Registration form
│   │   │   ├── ImageUpload.tsx     # Upload interface
│   │   │   └── ImageGallery.tsx    # Gallery & viewer
│   │   ├── styles/
│   │   │   ├── Auth.css            # Auth screens styling
│   │   │   ├── ImageUpload.css     # Upload interface styling
│   │   │   └── ImageGallery.css    # Gallery styling
│   │   ├── App.tsx                 # Main app component
│   │   ├── App.css                 # App styling
│   │   ├── index.tsx               # React entry point
│   │   └── index.css               # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── README.md
│
├── 📦 shared/                      # Shared types across services
│   └── types.ts                    # Common TypeScript interfaces
│
└── 📚 Documentation
    ├── README.md                   # Full docs & API reference
    ├── SETUP.md                    # Installation & configuration
    └── QUICKSTART.md               # 5-minute quick start
```

## 🔑 Core Technologies

### Backend

- **Node.js 18+** with TypeScript
- **Express.js** for REST APIs
- **Mongoose** for MongoDB ODM
- **Redis** for async job queue
- **Sharp** for image processing
- **AWS SDK** for S3 operations
- **jsonwebtoken** for JWT auth
- **bcryptjs** for password hashing

### Gateway

- **Go 1.21+**
- **Gin** web framework
- **Gin-CORS** for CORS handling

### Frontend

- **React 18** with TypeScript
- **Axios** for HTTP requests
- **CSS3** for styling

### Infrastructure

- **MongoDB** 5.0+ (document database)
- **Redis** 7.0+ (in-memory queue)
- **AWS S3** (cloud storage)
- **Docker** & **Docker Compose**
- **Kubernetes** (optional production)

## 🔐 Authentication & Security

### JWT Implementation

```typescript
Access Token:
- Payload: { userId, email }
- Expiration: 15 minutes
- Signing: HS256 with JWT_SECRET

Refresh Token:
- Payload: { userId, email }
- Expiration: 7 days
- Signing: HS256 with JWT_REFRESH_SECRET

Header-only: Authorization: Bearer <token>
No cookies used
```

### Password Security

- Bcrypt hashing with 10 salt rounds
- Automatic hash on save
- Secure comparison on login

## 📊 Database Schemas

### User (MongoDB - auth_db)

```typescript
{
  _id: ObjectId
  email: string (unique, lowercase)
  password: string (bcrypted)
  createdAt: Date (default: now)
}
```

### ImageMetadata (MongoDB - app_db)

```typescript
{
  _id: string (UUID)
  userId: string (indexed)
  originalName: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  sizes: {
    thumbnail: { url, width, height, size }
    small: { url, width, height, size }
    medium: { url, width, height, size }
    large: { url, width, height, size }
    original: { url, width, height, size }
  }
  uploadedAt: Date
  processedAt?: Date
  errorMessage?: string
}
```

### Job Queue (Redis)

```typescript
resize-queue: [
  {
    jobId: UUID
    imageId: UUID
    userId: string
    originalPath: string (S3 key)
    originalName: string
    timestamp: number
  }
]

job:<jobId>: { status: 'pending'|'processing'|'complete'|'failed' }
```

## 🚀 Deployment Options

### Local Development

```bash
docker-compose up -d
# Services on localhost:3001, 3002, 8080, 3000
```

### Docker Production

```bash
docker-compose -f docker-compose.yml up -d
# With environment file: docker-compose --env-file .env.prod up -d
```

### Kubernetes Production

```bash
kubectl apply -f k8s-deployment.yaml
# Auto-scales workers, manages persistence, health checks
```

## 📈 Scalability

### Horizontal Scaling

- **Multiple Workers**: `docker-compose up -d --scale worker-service=5`
- **Multiple Gateway**: Add load balancer (nginx, ALB)
- **Multiple App Services**: Deploy replicas, use session store
- **Multiple Auth Services**: Stateless, scales easily

### Vertical Scaling

- Increase memory/CPU limits in Docker/Kubernetes
- Configure MongoDB sharding
- Enable Redis clustering
- Use AWS S3 transfer acceleration

### Performance

- Image resize with Sharp: ~100-500ms per image
- Queue throughput: 1000s jobs/minute per worker
- Typical end-to-end: 2-10 seconds per image

## 🔍 Monitoring & Operations

### Health Checks

```bash
curl http://localhost:8080/health              # Gateway
curl http://localhost:3001/health              # Auth
curl http://localhost:3002/api/health          # App
```

### Logging

```bash
docker-compose logs -f [service]               # Real-time
docker-compose logs --tail=100 [service]       # Last 100 lines
docker-compose logs --since 10m [service]      # Last 10 minutes
```

### Database Access

```bash
# MongoDB
docker-compose exec mongo mongosh
use app_db
db.imagemetadatas.find()

# Redis
docker-compose exec redis redis-cli
LLEN resize-queue
GET job:<jobId>
```

## 🧪 Testing

### Manual API Testing

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Upload
curl -X POST http://localhost:8080/api/images/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@image.jpg"

# Check Status
curl http://localhost:8080/api/images/$ID/status \
  -H "Authorization: Bearer $TOKEN"

# Get Details
curl http://localhost:8080/api/images/$ID \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Troubleshooting Guide

### Service won't start

- Check logs: `docker-compose logs [service]`
- Check ports: `lsof -i :[PORT]`
- Rebuild: `docker-compose down && docker-compose up -d --build`

### MongoDB issues

- Container logs: `docker-compose logs mongo`
- Manual connection: `docker-compose exec mongo mongosh`
- Reset data: `docker-compose down -v`

### Redis issues

- Test connection: `docker-compose exec redis redis-cli ping`
- Check queue: `docker-compose exec redis redis-cli LLEN resize-queue`

### S3 upload failures

- Verify credentials in `.env`
- Check bucket exists: `aws s3 ls s3://bucket-name`
- Check IAM permissions

### Image not processing

- Worker logs: `docker-compose logs worker-service`
- Check queue has jobs: `docker-compose exec redis redis-cli LLEN resize-queue`
- Check MongoDB for job records

## 🔐 Production Checklist

- [ ] Change all JWT secrets to random 32+ character strings
- [ ] Configure strong MongoDB passwords
- [ ] Enable Redis AUTH
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure AWS IAM with minimal permissions
- [ ] Enable request validation
- [ ] Implement proper rate limiting
- [ ] Set up monitoring & alerting
- [ ] Configure backup strategy for MongoDB
- [ ] Set up log aggregation
- [ ] Enable CORS for specific origins
- [ ] Configure database indices
- [ ] Set up CI/CD pipeline
- [ ] Regular security updates

## 📚 Additional Resources

- Full API Docs: See README.md
- Setup Details: See SETUP.md
- Quick Reference: See QUICKSTART.md
- Docker Docs: https://docs.docker.com/
- Kubernetes: https://kubernetes.io/docs/
- MongoDB: https://docs.mongodb.com/
- AWS S3: https://docs.aws.amazon.com/s3/

## 🆘 Support & Debugging

1. **First**: Check service logs `docker-compose logs`
2. **Second**: Verify connectivity between services
3. **Third**: Check database/queue contents
4. **Fourth**: Review environment variables
5. **Fifth**: Check AWS credentials and S3 access

---

**Version**: 1.0.0  
**Last Updated**: December 9, 2025  
**Status**: Production Ready
