# Inter-Service Communication in Kubernetes

## Quick Answer

**In Kubernetes, services communicate using Kubernetes DNS.**

Instead of:

```bash
http://localhost:3002      # Local development
http://app-service:3002    # Docker Compose
```

You use the **same as Docker Compose in Kubernetes**:

```bash
http://app-service:3002    # Kubernetes (same!)
http://auth-service:3001   # Kubernetes (same!)
```

---

## How It Works

### **Kubernetes Service Discovery (Automatic DNS)**

When you create a Service in Kubernetes, it automatically gets an internal DNS record:

```
http://SERVICE-NAME:PORT
```

**Example:**

- Service `app-service` on port `3002` → `http://app-service:3002`
- Service `auth-service` on port `3001` → `http://auth-service:3001`
- Service `mongodb` on port `27017` → `http://mongodb:27017`

Any pod in the cluster can resolve these DNS names automatically (no configuration needed).

---

## Your Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌──────────────────┐           │
│  │  Gateway Pod    │────────→│  App-Service Pod  │           │
│  │ (port 8080)     │         │ (port 3002)      │           │
│  └─────────────────┘         └──────────────────┘           │
│         │                              │                     │
│         │                    ┌─────────────────────┐         │
│         └───────────────────→│ MongoDB Pod         │         │
│         │                    │ (port 27017)        │         │
│         │                    └─────────────────────┘         │
│         │                                                    │
│  ┌──────┴──────┐              ┌──────────────────┐          │
│  │ Service DNS │              │  Redis Pod       │          │
│  │ Records:    │──────────────→│ (port 6379)      │          │
│  │ • auth-service:3001         └──────────────────┘          │
│  │ • app-service:3002                                        │
│  │ • mongodb:27017                                           │
│  │ • redis:6379                                              │
│  └─────────────┘                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### **Step 1: Create Kubernetes Services**

Each deployment needs a corresponding Service that exposes it:

**app-service Service:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: app-service
  ports:
    - port: 3002
      targetPort: 3002
  type: ClusterIP
```

**auth-service Service:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
```

**gateway-service Service:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: gateway-service
spec:
  selector:
    app: gateway-service
  ports:
    - port: 8080
      targetPort: 8080
  type: LoadBalancer # External access
```

✅ **Your Helm charts already have these!**

---

### **Step 2: Pass Service URLs via ConfigMap**

Create a ConfigMap with service URLs:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gateway-service-config
data:
  AUTH_SERVICE_URL: "http://auth-service:3001"
  APP_SERVICE_URL: "http://app-service:3002"
```

✅ **Done! Configured in gateway-service values.yaml:**

```yaml
serviceUrls:
  authService: "http://auth-service:3001"
  appService: "http://app-service:3002"
```

---

### **Step 3: Inject into Pod Environment**

Your deployment loads ConfigMap via `envFrom`:

```yaml
envFrom:
  - configMapRef:
      name: gateway-service-config
```

This sets:

```bash
AUTH_SERVICE_URL=http://auth-service:3001
APP_SERVICE_URL=http://app-service:3002
```

✅ **Done! Your gateway pods now have these environment variables!**

---

## Your Gateway Code (Already Handles This)

Your Go code already reads these environment variables:

```go
// gateway-service/main.go
authServiceURL := os.Getenv("AUTH_SERVICE_URL")
if authServiceURL == "" {
    authServiceURL = "http://localhost:3001"
}

appServiceURL := os.Getenv("APP_SERVICE_URL")
if appServiceURL == "" {
    appServiceURL = "http://localhost:3002"
}
```

✅ **No code changes needed!**

---

## Complete Communication Flow

```
1. User requests: http://gateway-service:8080/api/images/upload

2. Gateway pod receives request
   ↓
3. Gateway reads env: APP_SERVICE_URL=http://app-service:3002
   ↓
4. Kubernetes DNS resolves: app-service:3002 → 10.x.x.x:3002
   ↓
5. Request proxied to: 10.x.x.x:3002/api/images/upload
   ↓
6. App-service pod receives request
   ↓
7. App-service reads env: MONGODB_HOST=mongodb
   ↓
8. Kubernetes DNS resolves: mongodb:27017 → 10.x.x.x:27017
   ↓
9. App-service connects to MongoDB
   ↓
10. Response sent back through gateway to user
```

---

## Quick Reference: Service Names

### **For Your Microservices:**

| Service             | Kubernetes DNS                | Port  | Used By         |
| ------------------- | ----------------------------- | ----- | --------------- |
| **app-service**     | `http://app-service:3002`     | 3002  | gateway, worker |
| **auth-service**    | `http://auth-service:3001`    | 3001  | gateway         |
| **gateway-service** | `http://gateway-service:8080` | 8080  | external users  |
| **worker-service**  | `http://worker-service:3003`  | 3003  | internal        |
| **mongodb**         | `http://mongodb:27017`        | 27017 | all services    |
| **redis**           | `http://redis:6379`           | 6379  | all services    |

---

## Deployment Commands

```bash
# Deploy everything
helm install gallery ./helm

# Verify services are created
kubectl get svc

# Check DNS from inside a pod
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
  nslookup app-service
  nslookup auth-service
  curl http://app-service:3002/api/health

# View gateway logs
kubectl logs -l app=gateway-service

# Port-forward to test locally
kubectl port-forward svc/gateway-service 8080:8080
# Now visit: http://localhost:8080
```

---

## Common Issues & Solutions

| Issue                     | Cause                          | Solution                                       |
| ------------------------- | ------------------------------ | ---------------------------------------------- |
| **Connection refused**    | Service not running            | `kubectl get pods`, check pod status           |
| **DNS resolution failed** | Wrong service name             | Check ConfigMap, verify service exists         |
| **503 Bad Gateway**       | Upstream service down          | Check app-service/auth-service logs            |
| **Connection timeout**    | Service on different namespace | Use `service-name.namespace.svc.cluster.local` |

---

## Summary

✅ **No special configuration needed!**

1. Kubernetes Services provide automatic DNS
2. ConfigMap passes service URLs to pods
3. Your code already handles environment variables
4. Services communicate: `http://service-name:port`

**Same pattern as Docker Compose, but Kubernetes DNS is automatic!**
