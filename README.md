# Multi-Resolution Image Generator - Microservices Architecture

A complete microservices-based image processing system with multi-resolution output support. Users can upload images and get optimized versions in multiple resolutions (thumbnail, small, medium, large, original) stored on AWS S3.

## 🏗️ Architecture Overview

```
┌─────────────┐
│  Frontend   │  (React)
│  (React)    │
└──────┬──────┘
       │
┌──────▼────────────────────┐
│  Gateway Service (Gin)    │  (Port 8080)
│  - CORS, Rate Limiting    │
│  - Request Routing        │
└──────┬────────┬───────────┘
       │        │
   ┌───▼──┐ ┌──▼────────┐
   │Auth  │ │App Service│  (Port 3002)
   │Svc   │ │- Upload   │
   │      │ │- Fetch    │
   │3001  │ │- Serve UI │
   └────┬─┘ └──┬────────┘
        │      │
        └──────┼───────────┬──────────┐
               │           │          │
        ┌──────▼──┐  ┌─────▼──┐ ┌───▼──┐
        │ MongoDB  │  │ Redis  │ │ S3   │
        │(Users,   │  │(Queue) │ │(Imgs)│
        │Metadata) │  └────────┘ └──────┘
        └──────────┘
               ▲
               │
        ┌──────┴──────┐
        │   Worker    │
        │   Service   │
        │- Resize     │
        │- Upload S3  │
        │- Update DB  │
        └─────────────┘
```

## 📦 Services

### 1. **Gateway Service** (Go/Gin)

- Entry point for all requests
- Routes to Auth Service and App Service
- CORS handling
- Rate limiting support
- **Port**: 8080

### 2. **Auth Service** (TypeScript/Node.js)

- User registration and login
- JWT token generation (access + refresh tokens)
- Token verification
- **Port**: 3001
- **Database**: MongoDB (auth_db)

### 3. **App Service** (TypeScript/Node.js)

- Image upload handling
- Frontend serving
- JWT validation
- Redis job queue integration
- Image metadata retrieval
- **Port**: 3002
- **Database**: MongoDB (app_db)
- **Storage**: AWS S3

### 4. **Worker Service** (TypeScript/Node.js)

- Consumes jobs from Redis queue
- Resizes images using Sharp
- Uploads all resolutions to S3
- Updates metadata in MongoDB
- Scales independently

### 5. **Frontend** (React)

- User authentication (login/register)
- Image upload interface
- Gallery view
- Resolution selector
- Polling for job status

## 🔧 Technology Stack

| Component        | Technology                    |
| ---------------- | ----------------------------- |
| Gateway          | Go (Gin)                      |
| Services         | TypeScript/Node.js            |
| Frontend         | React 18                      |
| Database         | MongoDB                       |
| Queue            | Redis                         |
| Storage          | AWS S3                        |
| Authentication   | JWT (Access + Refresh Tokens) |
| Image Processing | Sharp (Node.js)               |

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- AWS S3 credentials
- Node.js 18+ (for local development)
- Go 1.21+ (for gateway local development)

### Environment Setup

1. **Create `.env` file in root directory:**

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
```

2. **Or use example env files:**

```bash
cp auth-service/.env.example auth-service/.env
cp app-service/.env.example app-service/.env
cp worker-service/.env.example worker-service/.env
cp gateway-service/.env.example gateway-service/.env
```

### Running with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

**Access Points:**

- **Frontend/App Service**: http://localhost:3002
- **Gateway**: http://localhost:8080
- **API Endpoints**: http://localhost:8080/api/\*
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379

### Local Development

#### Auth Service

```bash
cd auth-service
npm install
npm run dev
```

#### App Service

```bash
cd app-service
npm install
npm run dev
```

#### Worker Service

```bash
cd worker-service
npm install
npm run dev
```

#### Gateway Service

```bash
cd gateway-service
go mod download
go run main.go
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## 📋 API Endpoints

### Authentication

**Register User**

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "User registered successfully",
  "userId": "user_id",
  "email": "user@example.com",
  "accessToken": "token",
  "refreshToken": "refresh_token"
}
```

**Login**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "userId": "user_id",
  "email": "user@example.com",
  "accessToken": "token",
  "refreshToken": "refresh_token"
}
```

**Refresh Token**

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}

Response:
{
  "message": "Tokens refreshed",
  "accessToken": "new_token",
  "refreshToken": "new_refresh_token"
}
```

### Image Operations

**Upload Image**

```http
POST /api/images/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Form Data:
- image: <file>

Response:
{
  "message": "Image upload accepted for processing",
  "imageId": "image_id",
  "jobId": "job_id",
  "status": "pending"
}
```

**List User Images**

```http
GET /api/images
Authorization: Bearer <accessToken>

Response:
{
  "images": [
    {
      "id": "image_id",
      "originalName": "photo.jpg",
      "status": "complete",
      "uploadedAt": "2025-12-09T10:30:00Z",
      "processedAt": "2025-12-09T10:30:15Z"
    }
  ]
}
```

**Get Image Details**

```http
GET /api/images/:id
Authorization: Bearer <accessToken>

Response:
{
  "id": "image_id",
  "originalName": "photo.jpg",
  "status": "complete",
  "sizes": {
    "thumbnail": {
      "url": "https://s3.amazonaws.com/...",
      "width": 150,
      "height": 150,
      "size": "15KB"
    },
    "small": {
      "url": "https://s3.amazonaws.com/...",
      "width": 480,
      "height": 480,
      "size": "85KB"
    },
    "medium": {
      "url": "https://s3.amazonaws.com/...",
      "width": 1024,
      "height": 1024,
      "size": "350KB"
    },
    "large": {
      "url": "https://s3.amazonaws.com/...",
      "width": 1920,
      "height": 1920,
      "size": "1.2MB"
    },
    "original": {
      "url": "https://s3.amazonaws.com/...",
      "width": 4032,
      "height": 3024,
      "size": "3.5MB"
    }
  },
  "uploadedAt": "2025-12-09T10:30:00Z",
  "processedAt": "2025-12-09T10:30:15Z"
}
```

**Check Image Processing Status**

```http
GET /api/images/:id/status
Authorization: Bearer <accessToken>

Response:
{
  "id": "image_id",
  "status": "complete",
  "errorMessage": null
}
```

## 🔐 Authentication Flow

1. **User Registration/Login**

   - User provides email and password
   - Auth Service validates and returns `accessToken` and `refreshToken`

2. **Token Storage**

   - Frontend stores tokens in localStorage (header-based, no cookies)
   - `Authorization: Bearer <accessToken>` sent with each request

3. **Token Refresh**

   - Access token expires in 15 minutes
   - When expired, frontend uses refresh token to get new access token
   - Refresh token expires in 7 days

4. **Verification**
   - App Service verifies token with Auth Service for each request
   - Invalid/expired tokens return 401 Unauthorized

## 📸 Image Processing Flow

1. **Upload**

   - Frontend sends image to App Service with JWT
   - App Service saves original to S3
   - Creates MongoDB metadata document with `status: pending`
   - Pushes job to Redis queue
   - Returns immediately with `jobId`

2. **Processing**

   - Worker Service polls Redis queue
   - Downloads original from S3
   - Resizes to 5 resolutions using Sharp
   - Uploads all versions to S3
   - Updates MongoDB with all URLs and metadata
   - Sets job status to `complete`

3. **Retrieval**
   - Frontend polls image status endpoint
   - When complete, fetches full image metadata
   - Displays gallery with resolution selector
   - User can view any resolution

## 📁 Directory Structure

```
microsvc-jenkins-k8s-cicd/
├── auth-service/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── app-service/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── worker-service/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── utils/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── gateway-service/
│   ├── main.go
│   ├── go.mod
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
├── shared/
│   └── types.ts
├── docker-compose.yml
└── README.md
```

## 🔄 Data Models

### User (MongoDB - auth_db)

```json
{
  "_id": ObjectId,
  "email": "string (unique)",
  "password": "string (hashed)",
  "createdAt": "Date"
}
```

### ImageMetadata (MongoDB - app_db)

```json
{
  "_id": "string (UUID)",
  "userId": "string",
  "originalName": "string",
  "status": "pending|processing|complete|failed",
  "sizes": {
    "thumbnail": {
      "url": "string",
      "width": number,
      "height": number,
      "size": "string"
    },
    "small": {...},
    "medium": {...},
    "large": {...},
    "original": {...}
  },
  "uploadedAt": "Date",
  "processedAt": "Date",
  "errorMessage": "string (optional)"
}
```

### ResizeJob (Redis Queue)

```json
{
  "jobId": "string (UUID)",
  "imageId": "string",
  "userId": "string",
  "originalPath": "string (S3 key)",
  "originalName": "string",
  "timestamp": "number"
}
```

## 🎯 Image Resolutions

| Resolution    | Dimensions | Use Case          |
| ------------- | ---------- | ----------------- |
| **Thumbnail** | 150x150    | Gallery preview   |
| **Small**     | 480x480    | Mobile view       |
| **Medium**    | 1024x1024  | Web view          |
| **Large**     | 1920x1920  | High-res display  |
| **Original**  | As-is      | Download full res |

## 🔍 Monitoring & Debugging

### View Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f worker-service

# Last 100 lines
docker-compose logs --tail=100 auth-service
```

### Check Service Health

```bash
# Auth Service
curl http://localhost:3001/health

# App Service
curl http://localhost:3002/api/health

# Gateway
curl http://localhost:8080/health
```

### MongoDB Queries

```bash
docker-compose exec mongo mongosh

# Switch database
use auth_db
use app_db

# List collections
show collections

# Find users
db.users.find()

# Find images
db.imagemetadatas.find()
```

### Redis Inspection

```bash
docker-compose exec redis redis-cli

# Check queue
LLEN resize-queue

# View job
GET job:<jobId>
```

## 🚀 Scaling Considerations

1. **Multiple Workers**

   - Run multiple worker instances for parallel processing
   - Redis queue automatically distributes jobs

2. **Load Balancing**

   - Use nginx or AWS ALB in front of Gateway
   - Distribute traffic across multiple Gateway instances

3. **Database**

   - Use MongoDB Atlas for cloud hosting
   - Add indices for frequently queried fields

4. **S3**

   - Use CloudFront for CDN caching
   - Enable S3 transfer acceleration

5. **Kubernetes Deployment**
   - Services ready for K8s deployment
   - StatefulSet for MongoDB
   - Deployment for microservices

## 🐛 Troubleshooting

### Images not processing

1. Check Worker logs: `docker-compose logs worker-service`
2. Verify Redis connection: `docker-compose exec redis redis-cli ping`
3. Check job in queue: `docker-compose exec redis redis-cli LLEN resize-queue`

### S3 upload failures

1. Verify AWS credentials in `.env`
2. Check S3 bucket exists and is accessible
3. Verify IAM permissions for S3 access

### Auth failures

1. Check MongoDB connection
2. Verify JWT secrets are set correctly
3. Check token expiration times

## 📝 Environment Variables

### Auth Service

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Access token signing key (min 32 chars)
- `JWT_REFRESH_SECRET` - Refresh token signing key (min 32 chars)
- `JWT_ACCESS_EXPIRE` - Access token expiration (default: 15m)
- `JWT_REFRESH_EXPIRE` - Refresh token expiration (default: 7d)

### App Service

- `MONGODB_URI` - MongoDB connection string
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `AUTH_SERVICE_URL` - Auth Service URL
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_S3_BUCKET` - S3 bucket name
- `AWS_S3_REGION` - AWS region

### Worker Service

- Same as App Service (MongoDB, Redis, AWS)

### Gateway Service

- `AUTH_SERVICE_URL` - Auth Service URL
- `APP_SERVICE_URL` - App Service URL

## 📚 API Response Codes

| Code | Meaning                     |
| ---- | --------------------------- |
| 200  | Success                     |
| 201  | Created                     |
| 202  | Accepted (async processing) |
| 400  | Bad Request                 |
| 401  | Unauthorized                |
| 409  | Conflict (user exists)      |
| 500  | Server Error                |

## 🔐 Security Notes

1. Change all default JWT secrets in production
2. Use environment variables for sensitive data
3. Enable HTTPS/TLS for all services
4. Implement rate limiting properly
5. Add request validation on all endpoints
6. Use AWS S3 bucket policies to restrict access
7. Enable MongoDB authentication
8. Use Redis AUTH in production

## 📄 License

MIT

## 🤝 Contributing

1. Create feature branches
2. Follow TypeScript best practices
3. Add unit tests
4. Submit pull requests

## 📞 Support

For issues and questions, please open an issue on the repository.
