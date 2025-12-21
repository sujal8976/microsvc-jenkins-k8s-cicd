# Environment Configuration Comparison

## Three Environments: Same Pattern, Different Hosts

### **Local Development (localhost)**

```bash
# .env file
PORT=8080
AUTH_SERVICE_URL=http://localhost:3001
APP_SERVICE_URL=http://localhost:3002
MONGODB_URI=mongodb://localhost:27017/image-gallery
REDIS_URL=redis://localhost:6379
```

**Why localhost:**

- All services run on single machine
- Default ports don't conflict

---

### **Docker Compose (service names)**

```yaml
# docker-compose.yml
services:
  gateway:
    environment:
      - PORT=8080
      - AUTH_SERVICE_URL=http://auth-service:3001
      - APP_SERVICE_URL=http://app-service:3002
      - MONGODB_URI=mongodb://mongo:27017/image-gallery
      - REDIS_URL=redis://redis:6379
```

**Why service names:**

- Docker Compose creates virtual network
- Service names resolve via internal DNS (provided by Docker)
- No `localhost` because services are isolated containers

---

### **Kubernetes (service names - SAME AS DOCKER COMPOSE!)**

```yaml
# helm/gateway-service/values.yaml
serviceUrls:
  authService: "http://auth-service:3001"
  appService: "http://app-service:3002"
```

```yaml
# helm/app-service/values.yaml
mongodb:
  host: "mongodb" # Resolves to mongodb:27017
  port: 27017
redis:
  host: "redis" # Resolves to redis:6379
  port: 6379
```

**Why service names:**

- Kubernetes creates virtual overlay network
- Services have internal DNS records automatically
- Same as Docker Compose!

---

## Key Difference: DNS Resolution

| Environment        | Host Lookup                                  | Provider         |
| ------------------ | -------------------------------------------- | ---------------- |
| **localhost**      | OS localhost lookup (127.0.0.1)              | Operating System |
| **Docker Compose** | Docker's embedded DNS server (127.0.0.11:53) | Docker daemon    |
| **Kubernetes**     | CoreDNS cluster service (10.x.x.x:53)        | Kubernetes       |

---

## Service Discovery Mechanism

### **Local Development**

```
Gateway Process
  ↓
localhost:3002
  ↓
OS hosts file / loop back (127.0.0.1)
  ↓
App-service Process on same machine
```

### **Docker Compose**

```
Gateway Container
  ↓
auth-service:3001
  ↓
Docker Embedded DNS
  ↓
Docker virtual network
  ↓
Auth-service Container
```

### **Kubernetes**

```
Gateway Pod
  ↓
auth-service:3001
  ↓
CoreDNS (Kubernetes DNS server)
  ↓
Kubernetes virtual network overlay
  ↓
Auth-service Pod
```

---

## Complete Environment Variables By Service

### **Local Development Setup**

**gateway-service/.env**

```bash
PORT=8080
AUTH_SERVICE_URL=http://localhost:3001
APP_SERVICE_URL=http://localhost:3002
```

**auth-service/.env**

```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/image-gallery
MONGODB_USER=admin
MONGODB_PASSWORD=password
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-min-32-chars
```

**app-service/.env**

```bash
PORT=3002
MONGODB_URI=mongodb://localhost:27017/image-gallery
MONGODB_USER=gallery-user
MONGODB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=image-gallery-raw
AWS_S3_PROCESSED_BUCKET=image-gallery-processed
```

**worker-service/.env**

```bash
PORT=3003
MONGODB_URI=mongodb://localhost:27017/image-gallery
REDIS_URL=redis://localhost:6379
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=image-gallery-raw
AWS_S3_PROCESSED_BUCKET=image-gallery-processed
```

---

### **Docker Compose Setup (docker-compose.yml)**

```yaml
services:
  gateway:
    environment:
      - PORT=8080
      - AUTH_SERVICE_URL=http://auth-service:3001
      - APP_SERVICE_URL=http://app-service:3002

  auth-service:
    environment:
      - PORT=3001
      - MONGODB_URI=mongodb://mongo:27017/image-gallery
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key

  app-service:
    environment:
      - PORT=3002
      - MONGODB_URI=mongodb://mongo:27017/image-gallery
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

  worker-service:
    environment:
      - PORT=3003
      - MONGODB_URI=mongodb://mongo:27017/image-gallery
      - REDIS_URL=redis://redis:6379
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

  mongo:
    environment:
      - MONGO_INITDB_DATABASE=image-gallery

  redis:
    # No special env needed
```

---

### **Kubernetes Setup (Helm values)**

**helm/values.yaml (parent umbrella chart)**

```yaml
# All services get these via their subcharts
mongodb:
  auth:
    database: "image-gallery"
    username: "gallery-user"
    password: "gallery-user-password"

redis:
  auth:
    password: "redis-secure-password"

gateway-service:
  serviceUrls:
    authService: "http://auth-service:3001"
    appService: "http://app-service:3002"

auth-service:
  env:
    MONGODB_HOST: "mongodb"
    REDIS_HOST: "redis"
    JWT_SECRET: "your-jwt-secret"

app-service:
  env:
    MONGODB_HOST: "mongodb"
    REDIS_HOST: "redis"
    AWS_REGION: "us-east-1"

worker-service:
  env:
    MONGODB_HOST: "mongodb"
    REDIS_HOST: "redis"
```

---

## Migration Path

```
Local Development (localhost)
            ↓
      Add support for env vars
            ↓
Docker Compose (service names)
            ↓
      Helm chart with ConfigMaps
            ↓
Kubernetes (same service names!)
```

---

## Testing Service Communication

### **Local Development**

```bash
curl http://localhost:3002/api/health
```

### **Docker Compose**

```bash
docker-compose exec app-service curl http://app-service:3002/api/health
```

### **Kubernetes**

```bash
# From gateway pod
kubectl exec -it <gateway-pod> -- curl http://app-service:3002/api/health

# From local machine (port-forward)
kubectl port-forward svc/app-service 3002:3002
curl http://localhost:3002/api/health
```

---

## DNS Resolution Verification

### **Docker Compose**

```bash
docker-compose exec gateway nslookup app-service
# Returns Docker's embedded DNS resolution
```

### **Kubernetes**

```bash
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup app-service
# Returns: Server: 10.x.x.x (CoreDNS)
#          Address: 10.x.x.x#53
#          Name: app-service
#          Address: 10.x.x.x
```
