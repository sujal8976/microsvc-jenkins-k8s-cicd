# Multi-Resolution Image Generator - Microservices Platform

> **A complete DevOps learning platform** demonstrating modern cloud-native application architecture with AWS, Kubernetes, Jenkins, Docker, and Helm.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green) ![License](https://img.shields.io/badge/License-MIT-blue) ![Version](https://img.shields.io/badge/Version-1.0.0-blue)

---

## 📌 Project Overview

This is a **complete end-to-end microservices application** that showcases:

- ✅ **Multi-Resolution Image Processing**: Upload once, automatically generate 5 optimized resolutions
- ✅ **Microservices Architecture**: 5 independent services with clear separation of concerns
- ✅ **DevOps Practices**: Jenkins CI/CD, Kubernetes orchestration, Helm package management
- ✅ **Cloud Integration**: AWS S3 storage, AWS EKS, IAM security
- ✅ **Containerization**: Docker for local development, multi-stage builds
- ✅ **Production-Ready**: Auto-scaling, health checks, error handling

The project is **designed specifically for learning DevOps, AWS, and Kubernetes** while building a real, functional application.

---

## 🏗️ Architecture Overview

### Microservices Architecture

```
[PLACEHOLDER: Insert Microservices Architecture Diagram]
- Visual text flow showing Frontend → Gateway → Services → Databases
```

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│                  http://localhost:8080                       │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │   GATEWAY SERVICE (Go/Gin)    │
         │  Port 8080 - API Routing      │
         └──────┬──────────────┬──────────┘
                │              │
    ┌───────────▼────┐  ┌─────▼──────────────┐
    │ AUTH SERVICE   │  │  APP SERVICE       │
    │ Port 3001      │  │  Port 3002         │
    │ • Register     │  │  • Upload          │
    │ • Login        │  │  • Gallery         │
    │ • JWT Tokens   │  │  • Metadata        │
    └────────┬───────┘  └────────┬───────────┘
             │                   │
      ┌──────┴────────┬──────────┴──────────┐
      │               │                     │
    ┌─▼────────┐  ┌──▼────┐  ┌────────────▼──┐
    │ MongoDB  │  │ Redis │  │   AWS S3       │
    │(Users)   │  │(Queue)│  │  (Images)      │
    └──────────┘  └───┬───┘  └────────────────┘
                      │
             ┌────────▼─────────┐
             │ WORKER SERVICE   │
             │ • Resize Images  │
             │ • Upload to S3   │
             │ • Update DB      │
             └──────────────────┘
```

### DevOps Architecture

```
[PLACEHOLDER: Insert DevOps Architecture Diagram]
- Visual showing Local → Jenkins → EKS Cluster → Production
```

```
┌──────────────────────────────────────────────────────────────┐
│                      GIT REPOSITORY                           │
│                   (GitHub/GitLab)                             │
└──────────────────────┬───────────────────────────────────────┘
                       │ (Webhook Trigger)
                       │
         ┌─────────────▼──────────────┐
         │   JENKINS SERVER (EC2)     │
         │ • Build Docker Images      │
         │ • Run Tests                │
         │ • Push to Registry         │
         │ • Deploy to EKS            │
         └──────────┬──────────────────┘
                    │
    ┌───────────────┴────────────────┐
    │      AWS REGION (us-west-2)    │
    │                                │
    │  ┌────────────────────────┐   │
    │  │  VPC (Private Subnets) │   │
    │  │                        │   │
    │  │  ┌──────────────────┐  │   │
    │  │  │   EKS CLUSTER    │  │   │
    │  │  │ • Master Nodes   │  │   │
    │  │  │ • Worker Nodes   │  │   │
    │  │  │ • Auto-scaling   │  │   │
    │  │  └──────────────────┘  │   │
    │  │                        │   │
    │  └────────────────────────┘   │
    │                                │
    │  ┌──────────────┐              │
    │  │  S3 Buckets  │              │
    │  │  (Images)    │              │
    │  └──────────────┘              │
    │                                │
    └────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend Services

| Technology             | Usage                       | Version |
| ---------------------- | --------------------------- | ------- |
| **TypeScript/Node.js** | Auth, App, Worker Services  | 18+     |
| **Go (Gin)**           | Gateway Service             | 1.21+   |
| **Express.js**         | REST API Framework          | 4.x     |
| **MongoDB**            | User & Image Metadata       | 5.0+    |
| **Redis**              | Async Job Queue             | 7.0+    |
| **Sharp**              | Image Processing & Resizing | Latest  |
| **JWT**                | Authentication Tokens       | -       |
| **Bcryptjs**           | Password Hashing            | -       |

### DevOps & Infrastructure

| Technology             | Usage                         | Purpose                |
| ---------------------- | ----------------------------- | ---------------------- |
| **Docker**             | Container Runtime             | Local Development      |
| **Docker Compose**     | Multi-container Orchestration | Local/Staging          |
| **Kubernetes (EKS)**   | Container Orchestration       | Production             |
| **Helm**               | Kubernetes Package Manager    | Deployment Management  |
| **Jenkins**            | CI/CD Pipeline                | Automated Deployments  |
| **AWS EKS**            | Managed Kubernetes            | Production Cluster     |
| **AWS EC2**            | Jenkins Server                | Pipeline Execution     |
| **AWS S3**             | Object Storage                | Image Storage          |
| **AWS IAM**            | Access Control                | Security & Permissions |
| **AWS CloudFormation** | Infrastructure as Code        | VPC & Network Setup    |
| **AWS Autoscaling**    | Dynamic Scaling               | Node & Pod Scaling     |

### Frontend

| Technology     | Usage                | Version |
| -------------- | -------------------- | ------- |
| **React**      | UI Framework         | 18+     |
| **TypeScript** | Type-safe JavaScript | -       |
| **Axios**      | HTTP Client          | Latest  |
| **CSS3**       | Styling              | -       |

---

## 📚 Documentation Structure

### 1. **README.md** (You are here)

- Project overview
- Architecture diagrams
- Technology stack
- Quick navigation
- Links to all documentation

### 2. **[APPLICATION_SETUP.md](./APPLICATION_SETUP.md)**

- Local development environment setup
- Docker & Docker Compose
- Environment configuration
- Running services locally
- Testing the application
- Troubleshooting

### 3. **[AWS_KUBERNETES_SETUP.md](./AWS_KUBERNETES_SETUP.md)**

- AWS VPC creation using CloudFormation
- IAM user creation (EKS, Worker, Jenkins)
- EKS cluster setup with eksctl
- Node groups and auto-scaling configuration
- Cluster security and access management
- Jenkins user access entries
- Monitoring and cluster management

### 4. **[HELM_KUBERNETES_DEPLOYMENT.md](./HELM_KUBERNETES_DEPLOYMENT.md)**

- Helm charts overview
- Secrets and values files
- Deploying to Kubernetes cluster
- Managing application releases
- Scaling and updates
- Health checks and monitoring
- Troubleshooting deployments

### 5. **[JENKINS_PIPELINE_SETUP.md](./JENKINS_PIPELINE_SETUP.md)**

- Jenkins server installation (EC2)
- Required tools setup (kubectl, Helm, Docker, AWS CLI)
- Jenkinsfile configuration
- Credentials management
- Pipeline stages and flow
- CI/CD best practices
- Troubleshooting pipeline issues

---

## 🚀 Quick Start

### For Local Development

```bash
# 1. Clone and configure
git clone <repository-url>
cd microsvc-jenkins-k8s-cicd
cp .env.example .env

# 2. Start with Docker Compose
docker-compose up -d

# 3. Access the application
open http://localhost:8080
```

**→ See [APPLICATION_SETUP.md](./APPLICATION_SETUP.md) for detailed setup instructions**

### For Production Deployment on AWS EKS

```bash
# 1. Set up AWS Infrastructure
# See [AWS_KUBERNETES_SETUP.md](./AWS_KUBERNETES_SETUP.md)

# 2. Deploy with Helm
helm install app ./helm/app-service -f helm/values/app-service.yaml

# 3. Access via LoadBalancer
kubectl get svc -n microservices
```

**→ See [HELM_KUBERNETES_DEPLOYMENT.md](./HELM_KUBERNETES_DEPLOYMENT.md) for full deployment guide**

### For CI/CD with Jenkins

```bash
# 1. Set up Jenkins on EC2
# See [JENKINS_PIPELINE_SETUP.md](./JENKINS_PIPELINE_SETUP.md)

# 2. Configure pipeline
# Create Jenkins credentials and pipeline job

# 3. Trigger deployments
# Push to repository → Webhook → Jenkins → EKS
```

**→ See [JENKINS_PIPELINE_SETUP.md](./JENKINS_PIPELINE_SETUP.md) for complete setup**

---

## 📦 Services Overview

### 1. **Gateway Service** (Go/Gin)

- **Purpose**: API Gateway & Request Router
- **Port**: 8080
- **Responsibilities**:
  - Route requests to Auth & App services
  - CORS handling
  - Rate limiting
  - Frontend serving fallthrough

### 2. **Auth Service** (TypeScript/Node.js)

- **Purpose**: User Authentication & JWT Management
- **Port**: 3001
- **Responsibilities**:
  - User registration with password hashing
  - Login with access/refresh tokens
  - Token verification
  - JWT token generation and validation

### 3. **App Service** (TypeScript/Node.js)

- **Purpose**: Image Upload & Gallery Management
- **Port**: 3002
- **Responsibilities**:
  - Image upload handling
  - Image metadata storage
  - Gallery listing and filtering
  - Redis job queue integration
  - Frontend hosting
  - Status polling

### 4. **Worker Service** (TypeScript/Node.js)

- **Purpose**: Background Image Processing
- **No exposed port** (internal service)
- **Responsibilities**:
  - Consume Redis queue jobs
  - Resize images with Sharp (5 resolutions)
  - Upload to AWS S3
  - Update metadata in MongoDB
  - Error handling & retry logic

### 5. **Frontend** (React)

- **Purpose**: User Interface
- **Served by**: App Service on port 3002
- **Features**:
  - User authentication (login/register)
  - Image upload with drag-and-drop
  - Gallery with grid view
  - Resolution selector
  - Real-time status polling

---

## 🔐 Image Processing Flow

```
1. USER UPLOADS IMAGE
   ↓
2. FRONTEND SENDS TO APP SERVICE (with JWT)
   ↓
3. APP SERVICE VALIDATES JWT
   ↓
4. SAVE ORIGINAL TO AWS S3
   ↓
5. CREATE METADATA IN MONGODB (status: pending)
   ↓
6. PUSH JOB TO REDIS QUEUE
   ↓
7. RETURN JOB ID TO FRONTEND (status: pending)
   ↓
8. WORKER SERVICE POLLS QUEUE
   ↓
9. RESIZE TO 5 RESOLUTIONS USING SHARP
   - Thumbnail (150x150)
   - Small (480x480)
   - Medium (1024x1024)
   - Large (1920x1920)
   - Original (as-is)
   ↓
10. UPLOAD ALL RESOLUTIONS TO S3
    ↓
11. UPDATE MONGODB WITH URLS (status: complete)
    ↓
12. FRONTEND POLLS & DISPLAYS GALLERY
    ↓
13. USER SELECTS RESOLUTION TO VIEW
```

---

## 📊 Key Features

### ✨ Application Features

- **Multi-Resolution Processing**: Automatic generation of 5 image sizes
- **Async Processing**: Non-blocking image processing with job queue
- **Real-time Status**: Live status updates as images are processed
- **User Authentication**: Secure JWT-based authentication
- **Image Gallery**: Responsive gallery with resolution selector
- **Cloud Storage**: AWS S3 integration for scalable storage

### 🔧 DevOps Features

- **Containerization**: Docker multi-stage builds for optimization
- **Orchestration**: Kubernetes for production deployments
- **Infrastructure as Code**: CloudFormation for VPC setup
- **CI/CD Pipeline**: Jenkins automated deployments
- **Package Management**: Helm charts for Kubernetes
- **Auto-scaling**: Horizontal pod and node auto-scaling
- **Security**: IAM policies, secrets management
- **Monitoring**: Health checks and logging

---

## 🗂️ Project Structure

```
microsvc-jenkins-k8s-cicd/
│
├── README.md                          # Main documentation (you are here)
├── APPLICATION_SETUP.md               # Local development guide
├── AWS_KUBERNETES_SETUP.md            # AWS & EKS setup guide
├── HELM_KUBERNETES_DEPLOYMENT.md      # Helm deployment guide
├── JENKINS_PIPELINE_SETUP.md          # Jenkins CI/CD guide
│
├── 🔐 auth-service/                   # Authentication service
│   ├── src/
│   │   ├── config/database.ts
│   │   ├── models/User.ts
│   │   ├── routes/auth.ts
│   │   ├── utils/jwt.ts
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── 📸 app-service/                    # Main application service
│   ├── src/
│   │   ├── config/database.ts
│   │   ├── models/ImageMetadata.ts
│   │   ├── routes/images.ts
│   │   ├── middleware/auth.ts
│   │   ├── utils/
│   │   │   ├── s3.ts
│   │   │   ├── redis.ts
│   │   │   └── auth.ts
│   │   ├── public/ (frontend build)
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── ⚙️ worker-service/                 # Image processing worker
│   ├── src/
│   │   ├── config/database.ts
│   │   ├── models/ImageMetadata.ts
│   │   ├── utils/
│   │   │   ├── s3.ts
│   │   │   ├── redis.ts
│   │   │   └── imageProcessor.ts
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── 🌐 gateway-service/                # API Gateway (Go)
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile
│
├── 🎨 frontend/                       # React application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   └── ImageGallery.tsx
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── styles/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── 📦 shared/                         # Shared types
│   └── types.ts
│
├── ⚙️ helm/                           # Kubernetes Helm charts
│   ├── Chart.yaml
│   ├── namespace.yaml
│   ├── initial_install_script.sh
│   ├── app-service/Chart.yaml
│   ├── auth-service/Chart.yaml
│   ├── gateway-service/Chart.yaml
│   ├── worker-service/Chart.yaml
│   ├── values/
│   │   ├── app-service.yaml
│   │   ├── auth-service.yaml
│   │   ├── gateway-service.yaml
│   │   ├── worker-service.yaml
│   │   ├── mongo.yaml
│   │   └── redis.yaml
│   └── secrets/
│       ├── app-service-secrets.yaml
│       ├── auth-service-secrets.yaml
│       ├── gateway-service-secrets.yaml
│       ├── mongo-secrets.yaml
│       └── redis-secrets.yaml
│
├── docker-compose.yml                 # Local development orchestration
└── Jenkinsfile                        # CI/CD pipeline definition
```

---

## 🔑 Key Concepts Demonstrated

### DevOps

- **Infrastructure as Code**: CloudFormation for VPC setup
- **Configuration Management**: Helm values and secrets
- **Continuous Integration**: Jenkins automated builds
- **Continuous Deployment**: Auto-deployment to EKS
- **Container Orchestration**: Kubernetes for scalability
- **Monitoring & Logging**: Health checks and logs

### AWS Services

- **EKS**: Managed Kubernetes cluster
- **EC2**: Jenkins server
- **S3**: Image storage
- **IAM**: User and role management
- **CloudFormation**: Infrastructure setup
- **VPC**: Private network with security groups
- **Auto Scaling Groups**: Dynamic node scaling

### Microservices Patterns

- **API Gateway Pattern**: Gateway service for routing
- **Service-to-Service Communication**: Internal service mesh
- **Async Processing**: Job queue with workers
- **Database per Service**: Separate MongoDB collections
- **Health Checks**: Readiness and liveness probes
- **Circuit Breaker**: Error handling strategies

---

## 📖 Documentation Navigation

| Document                          | Purpose                         | For              |
| --------------------------------- | ------------------------------- | ---------------- |
| **README.md**                     | Project overview & architecture | Everyone         |
| **APPLICATION_SETUP.md**          | Local development               | Developers       |
| **AWS_KUBERNETES_SETUP.md**       | Cloud infrastructure            | DevOps Engineers |
| **HELM_KUBERNETES_DEPLOYMENT.md** | Production deployment           | DevOps Engineers |
| **JENKINS_PIPELINE_SETUP.md**     | CI/CD automation                | DevOps Engineers |

---

## 🎯 Learning Path

### Beginner: Understanding the Application

1. Read this README
2. Follow [APPLICATION_SETUP.md](./APPLICATION_SETUP.md)
3. Run application locally with Docker Compose
4. Test API endpoints
5. Explore the codebase

### Intermediate: Cloud & Kubernetes

1. Read [AWS_KUBERNETES_SETUP.md](./AWS_KUBERNETES_SETUP.md)
2. Create AWS account and infrastructure
3. Read [HELM_KUBERNETES_DEPLOYMENT.md](./HELM_KUBERNETES_DEPLOYMENT.md)
4. Deploy to EKS cluster
5. Monitor and manage deployments

### Advanced: CI/CD & Automation

1. Read [JENKINS_PIPELINE_SETUP.md](./JENKINS_PIPELINE_SETUP.md)
2. Set up Jenkins on EC2
3. Configure pipeline and credentials
4. Implement automated deployments
5. Optimize and monitor pipeline

---

## 🌟 Real-World Use Cases

This project demonstrates:

✅ **Multi-tier Microservices**: Authentication, API, Worker services  
✅ **Async Job Processing**: Image resizing with queue  
✅ **Cloud Integration**: AWS S3 storage  
✅ **Container Orchestration**: Kubernetes deployments  
✅ **CI/CD Automation**: Jenkins pipeline  
✅ **Infrastructure as Code**: CloudFormation & Helm  
✅ **Security**: IAM, secrets, authentication  
✅ **Scalability**: Auto-scaling pods and nodes

---

## 🐛 Troubleshooting Quick Guide

### Docker issues?

→ See [APPLICATION_SETUP.md - Troubleshooting](./APPLICATION_SETUP.md#troubleshooting)

### AWS/EKS issues?

→ See [AWS_KUBERNETES_SETUP.md - Troubleshooting](./AWS_KUBERNETES_SETUP.md#troubleshooting)

### Deployment issues?

→ See [HELM_KUBERNETES_DEPLOYMENT.md - Troubleshooting](./HELM_KUBERNETES_DEPLOYMENT.md#troubleshooting)

### Pipeline issues?

→ See [JENKINS_PIPELINE_SETUP.md - Troubleshooting](./JENKINS_PIPELINE_SETUP.md#troubleshooting)

---

## 📝 Environment Variables

Each service requires environment configuration. See respective setup guides:

- **Local Development**: [APPLICATION_SETUP.md](./APPLICATION_SETUP.md)
- **Kubernetes Secrets**: [HELM_KUBERNETES_DEPLOYMENT.md](./HELM_KUBERNETES_DEPLOYMENT.md)

Key variables:

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (AWS credentials)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (Authentication)
- `MONGODB_URI` (Database connection)
- `REDIS_HOST`, `REDIS_PORT` (Queue service)

---

## 🔒 Security Considerations

- ✅ JWT tokens for stateless authentication
- ✅ Password hashing with bcrypt
- ✅ IAM policies for AWS access control
- ✅ Kubernetes secrets for sensitive data
- ✅ Network policies for service isolation
- ✅ HTTPS/TLS ready configuration
- ✅ Environment-based configuration

---

## 📊 API Endpoints

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT tokens

### Image Endpoints

- `POST /api/images/upload` - Upload image
- `GET /api/images` - List user images
- `GET /api/images/:id` - Get image details
- `GET /api/images/:id/status` - Check processing status

---

## 🤝 Contributing

1. Create feature branches
2. Follow TypeScript/Go best practices
3. Add appropriate tests
4. Submit pull requests

---

## 📄 License

MIT License - See LICENSE file for details

---

## 📞 Support & Questions

- Review relevant documentation guide
- Check troubleshooting sections
- Examine logs and error messages
- Verify configuration files

---

**Project Status**: ✅ Production Ready  
**Last Updated**: January 2026  
**Version**: 1.0.0

---

### 🗺️ Next Steps

Choose your path:

- 👨‍💻 **Developer?** → Go to [APPLICATION_SETUP.md](./APPLICATION_SETUP.md)
- 🚀 **DevOps Engineer?** → Go to [AWS_KUBERNETES_SETUP.md](./AWS_KUBERNETES_SETUP.md)
- 🔄 **Setting up CI/CD?** → Go to [JENKINS_PIPELINE_SETUP.md](./JENKINS_PIPELINE_SETUP.md)
- 📦 **Managing production?** → Go to [HELM_KUBERNETES_DEPLOYMENT.md](./HELM_KUBERNETES_DEPLOYMENT.md)
