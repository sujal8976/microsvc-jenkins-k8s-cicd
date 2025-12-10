# Quick Start Guide

Get the Multi-Resolution Image Gallery running in minutes!

## 🏃 30-Second Start

```bash
# 1. Clone and enter directory
git clone <repo-url>
cd microsvc-jenkins-k8s-cicd

# 2. Set AWS credentials
cat > .env << EOF
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1
EOF

# 3. Start everything
docker-compose up -d

# 4. Wait ~30 seconds for services to initialize
sleep 30

# 5. Open browser
open http://localhost:3002
# or
open http://localhost:8080
```

## ✅ Verify Installation

```bash
# Check all services are running
docker-compose ps

# Test gateway
curl http://localhost:8080/health

# Expected: {"status":"Gateway is running"}
```

## 🎯 First Steps

### 1. Create Account

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123456"
  }'

# Save the accessToken from response
export TOKEN="eyJhbGc..."
```

### 2. Upload Image

```bash
curl -X POST http://localhost:8080/api/images/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@./test-image.jpg"

# Save imageId and jobId from response
export IMAGE_ID="uuid..."
```

### 3. Wait for Processing

```bash
# Check status (repeat every 5 seconds)
curl http://localhost:8080/api/images/$IMAGE_ID/status \
  -H "Authorization: Bearer $TOKEN"

# Wait for status: "complete"
```

### 4. View Results

```bash
# Get all resolutions
curl http://localhost:8080/api/images/$IMAGE_ID \
  -H "Authorization: Bearer $TOKEN"

# View in browser - navigate to gallery tab
open http://localhost:3002
```

## 📂 Project Structure

```
├── auth-service/          # Login/Register API
├── app-service/           # Upload & Frontend
├── worker-service/        # Image Processing
├── gateway-service/       # API Gateway (Go)
├── frontend/              # React UI
├── docker-compose.yml     # All services
├── k8s-deployment.yaml    # Kubernetes config
├── README.md              # Full documentation
└── SETUP.md               # Detailed setup
```

## 🔧 Troubleshooting

### Services not starting?

```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### S3 upload failing?

```bash
# Verify credentials
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Test S3 access
aws s3 ls s3://your-bucket
```

### Image not processing?

```bash
# Check worker logs
docker-compose logs worker-service

# Check Redis queue
docker-compose exec redis redis-cli LLEN resize-queue
```

## 📊 Architecture at a Glance

```
Browser ──→ Gateway (port 8080)
              ├─→ Auth Service (3001) ────→ MongoDB
              └─→ App Service (3002)
                   ├─→ Redis Queue
                   ├─→ MongoDB
                   └─→ AWS S3

              ↓ Job Processing
          Worker Service
              ├─→ Sharp (resize)
              ├─→ AWS S3 (upload)
              └─→ MongoDB (metadata)
```

## 🎨 Features

✅ **User Authentication**

- Register & Login
- JWT tokens (Access + Refresh)
- Header-based authentication

✅ **Image Upload**

- Drag & drop support
- Real-time feedback
- Progress tracking

✅ **Image Processing**

- 5 resolutions (thumbnail → original)
- Async processing with queue
- Scalable workers

✅ **Gallery**

- Browse all uploads
- Select resolution
- View details
- Download links

## 🚀 Next Steps

1. **Customize** - Update colors/UI in `frontend/src/styles/`
2. **Scale** - Run multiple workers: `docker-compose up -d --scale worker-service=5`
3. **Deploy** - Use `k8s-deployment.yaml` for Kubernetes
4. **Secure** - Change JWT secrets and AWS credentials
5. **Monitor** - Check logs and metrics regularly

## 📚 Documentation

- **Full Setup Guide**: See `SETUP.md`
- **Architecture Details**: See `README.md`
- **API Documentation**: See `README.md` - API Endpoints section
- **Troubleshooting**: See `SETUP.md` - Troubleshooting section

## 🆘 Need Help?

```bash
# View service logs
docker-compose logs -f [service-name]

# Check service status
docker-compose ps

# Get service health
curl http://localhost:[PORT]/health

# Enter service container
docker-compose exec [service] sh
```

## 🔐 Important Security Notes

⚠️ **Before Production:**

1. Change JWT secrets (currently example values)
2. Set strong MongoDB passwords
3. Configure Redis AUTH
4. Enable HTTPS/TLS
5. Restrict AWS IAM permissions
6. Enable proper CORS
7. Implement rate limiting
8. Add request validation

## 📈 Performance Tips

- **Scale workers** for more parallel processing
- **Use CloudFront** for S3 image CDN
- **Enable MongoDB sharding** for large datasets
- **Configure Redis persistence** for reliability
- **Use Kubernetes HPA** for auto-scaling

## 📞 Support

- Check Docker containers: `docker ps`
- View full logs: `docker-compose logs`
- Inspect MongoDB: `docker-compose exec mongo mongosh`
- Test Redis: `docker-compose exec redis redis-cli`

---

**Ready to go?** Run `docker-compose up -d` and visit http://localhost:3002!
