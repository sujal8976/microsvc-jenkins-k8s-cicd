# Helm & Kubernetes Deployment Guide

Complete guide for deploying the Multi-Resolution Image Generator to Kubernetes using Helm charts.

---

## Table of Contents

1. [Helm Overview](#helm-overview)
2. [Chart Structure](#chart-structure)
3. [Secrets & Configuration](#secrets--configuration)
4. [Deployment Process](#deployment-process)
5. [Scaling & Management](#scaling--management)
6. [Monitoring & Logging](#monitoring--logging)
7. [Updates & Rollbacks](#updates--rollbacks)
8. [Troubleshooting](#troubleshooting)

---

## Helm Overview

### What is Helm?

Helm is the "package manager for Kubernetes". It helps you:

- Define complex applications as reusable packages (Charts)
- Manage different environments (dev, staging, prod)
- Handle secrets and configurations securely
- Simplify deployments and upgrades

### Helm Concepts

| Concept        | Description                              |
| -------------- | ---------------------------------------- |
| **Chart**      | Package definition (like a recipe)       |
| **Release**    | Deployed instance of a chart             |
| **Values**     | Configuration for a specific release     |
| **Template**   | Kubernetes YAML templates with variables |
| **Repository** | Collection of charts                     |

### Chart Hierarchy in This Project

```
helm/
├── Chart.yaml              # Root chart (aggregates all services)
├── namespace.yaml          # Kubernetes namespace
├── initial_install_script.sh # Deployment automation
│
├── app-service/            # Service chart
│   ├── Chart.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── configmap.yaml
│       └── secret.yaml
│
├── auth-service/           # Service chart
├── gateway-service/        # Service chart
├── worker-service/         # Service chart
│
├── values/                 # Configuration files
│   ├── app-service.yaml
│   ├── auth-service.yaml
│   ├── gateway-service.yaml
│   ├── worker-service.yaml
│   ├── mongo.yaml
│   └── redis.yaml
│
└── secrets/                # Kubernetes secrets
    ├── app-service-secrets.yaml
    ├── auth-service-secrets.yaml
    ├── gateway-service-secrets.yaml
    ├── mongo-secrets.yaml
    └── redis-secrets.yaml
```

---

## Chart Structure

### App Service Chart Example

#### Chart.yaml

Defines the chart metadata:

```yaml
apiVersion: v2
name: app-service
description: Multi-resolution image application service
type: application
version: 1.0.0
appVersion: 1.0.0
```

#### templates/deployment.yaml

Kubernetes Deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-app-service
  namespace: {{ .Release.Namespace }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: app-service
  template:
    metadata:
      labels:
        app: app-service
    spec:
      containers:
      - name: app-service
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: {{ .Values.service.port }}
        env:
        - name: PORT
          value: "{{ .Values.service.port }}"
        - name: MONGODB_URI
          valueFrom:
            configMapKeyRef:
              name: {{ .Release.Name }}-config
              key: mongodb-uri
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: {{ .Release.Name }}-secrets
              key: aws-access-key-id
        # More environment variables...
        resources:
          requests:
            memory: "{{ .Values.resources.requests.memory }}"
            cpu: "{{ .Values.resources.requests.cpu }}"
          limits:
            memory: "{{ .Values.resources.limits.memory }}"
            cpu: "{{ .Values.resources.limits.cpu }}"
        livenessProbe:
          httpGet:
            path: /api/health
            port: {{ .Values.service.port }}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: {{ .Values.service.port }}
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### templates/service.yaml

Kubernetes Service for internal/external access:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-app-service
  namespace: {{ .Release.Namespace }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.port }}
    protocol: TCP
  selector:
    app: app-service
```

#### templates/configmap.yaml

Non-sensitive configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-config
  namespace: {{ .Release.Namespace }}
data:
  mongodb-uri: "{{ .Values.mongodb.uri }}"
  redis-host: "{{ .Values.redis.host }}"
  auth-service-url: "{{ .Values.authService.url }}"
```

#### templates/secret.yaml

Sensitive data (encrypted):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-secrets
  namespace: {{ .Release.Namespace }}
type: Opaque
data:
  aws-access-key-id: {{ .Values.aws.accessKeyId | b64enc }}
  aws-secret-access-key: {{ .Values.aws.secretAccessKey | b64enc }}
  jwt-secret: {{ .Values.jwt.secret | b64enc }}
```

---

## Secrets & Configuration

### Overview

Kubernetes differentiates between:

- **ConfigMaps**: Non-sensitive configuration
- **Secrets**: Sensitive data (encoded, not encrypted by default)

### values/ Files

Contains non-sensitive configuration:

**values/app-service.yaml**

```yaml
replicaCount: 2

image:
  repository: devsujal/app-service
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3002

resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

mongodb:
  uri: "mongodb://mongo:27017/app_db"

redis:
  host: redis
  port: 6379

authService:
  url: "http://auth-service:3001"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80
```

### secrets/ Files

Contains sensitive data (base64 encoded):

**secrets/app-service-secrets.yaml**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-service-secrets
  namespace: microservices
type: Opaque
data:
  AWS_ACCESS_KEY_ID: [base64-encoded-value]
  AWS_SECRET_ACCESS_KEY: [base64-encoded-value]
  JWT_SECRET: [base64-encoded-value]
```

### Creating Secrets

#### Option 1: Using kubectl (Quick)

```bash
# Create secret from literal values
kubectl create secret generic app-service-secrets \
  --from-literal=AWS_ACCESS_KEY_ID='your_access_key' \
  --from-literal=AWS_SECRET_ACCESS_KEY='your_secret_key' \
  -n microservices

# Verify secret
kubectl get secrets -n microservices
kubectl describe secret app-service-secrets -n microservices
```

#### Option 2: From YAML File

```bash
# Create secret file
cat > app-service-secrets.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: app-service-secrets
  namespace: microservices
type: Opaque
stringData:
  AWS_ACCESS_KEY_ID: "your_access_key"
  AWS_SECRET_ACCESS_KEY: "your_secret_key"
  JWT_SECRET: "your_jwt_secret"
EOF

# Apply to cluster
kubectl apply -f app-service-secrets.yaml

# Verify
kubectl get secret app-service-secrets -n microservices -o yaml
```

#### Option 3: From .env File

```bash
# Create secret from .env file
kubectl create secret generic app-service-secrets \
  --from-env-file=.env \
  -n microservices
```

### Managing Secrets Securely

```bash
# Never commit secrets to git
echo "secrets/" >> .gitignore

# View secret names (not values)
kubectl get secrets -n microservices

# Edit secret (encrypted in etcd)
kubectl edit secret app-service-secrets -n microservices

# Delete secret
kubectl delete secret app-service-secrets -n microservices
```

---

## Deployment Process

### Step-by-Step Deployment

#### 1. Create Namespace

```bash
# Apply namespace
kubectl apply -f helm/namespace.yaml

# Verify
kubectl get namespaces
kubectl get ns microservices
```

#### 2. Deploy Infrastructure (MongoDB & Redis)

```bash
# Add Bitnami Helm repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install MongoDB
helm install mongodb bitnami/mongodb \
  -f helm/values/mongo.yaml \
  -f helm/secrets/mongo-secrets.yaml \
  -n microservices

# Install Redis
helm install redis bitnami/redis \
  -f helm/values/redis.yaml \
  -f helm/secrets/redis-secrets.yaml \
  -n microservices

# Wait for ready (check status)
kubectl get pods -n microservices
kubectl wait --for=condition=ready pod -l app=mongodb -n microservices --timeout=300s
```

#### 3. Create Secrets for Services

```bash
# Create all service secrets
kubectl apply -f helm/secrets/app-service-secrets.yaml -n microservices
kubectl apply -f helm/secrets/auth-service-secrets.yaml -n microservices
kubectl apply -f helm/secrets/gateway-service-secrets.yaml -n microservices
kubectl apply -f helm/secrets/worker-service-secrets.yaml -n microservices

# Verify secrets created
kubectl get secrets -n microservices
```

#### 4. Deploy Services Using Helm

```bash
# Deploy Auth Service
helm install auth-service ./helm/auth-service \
  -f helm/values/auth-service.yaml \
  -n microservices

# Deploy App Service
helm install app-service ./helm/app-service \
  -f helm/values/app-service.yaml \
  -n microservices

# Deploy Worker Service (can be multiple instances)
helm install worker-service ./helm/worker-service \
  -f helm/values/worker-service.yaml \
  -n microservices

# Deploy Gateway Service
helm install gateway-service ./helm/gateway-service \
  -f helm/values/gateway-service.yaml \
  -n microservices
```

#### 5. Verify Deployments

```bash
# View all Helm releases
helm list -n microservices

# Check pod status
kubectl get pods -n microservices

# Check services
kubectl get svc -n microservices

# Check deployments
kubectl get deployments -n microservices

# Describe specific deployment
kubectl describe deployment app-service -n microservices
```

### Automated Deployment Script

The `initial_install_script.sh` automates the above steps:

```bash
#!/bin/bash

# Navigate to helm directory
cd helm

# Create namespace
kubectl apply -f namespace.yaml

# Deploy infrastructure
helm install mongodb bitnami/mongodb \
  -f values/mongo.yaml \
  -f secrets/mongo-secrets.yaml \
  -n microservices

helm install redis bitnami/redis \
  -f values/redis.yaml \
  -f secrets/redis-secrets.yaml \
  -n microservices

# Deploy services
helm install auth-service ./auth-service \
  -f values/auth-service.yaml \
  -f secrets/auth-service-secrets.yaml \
  -n microservices

helm install app-service ./app-service \
  -f values/app-service.yaml \
  -f secrets/app-service-secrets.yaml \
  -n microservices

helm install worker-service ./worker-service \
  -f values/worker-service.yaml \
  -f secrets/worker-service-secrets.yaml \
  -n microservices

helm install gateway-service ./gateway-service \
  -f values/gateway-service.yaml \
  -f secrets/gateway-service-secrets.yaml \
  -n microservices

echo "All services deployed successfully!"
```

To run:

```bash
bash helm/initial_install_script.sh
```

---

## Scaling & Management

### Horizontal Pod Auto-scaling

Kubernetes automatically scales pods based on CPU and memory usage.

#### Configure Auto-scaling

In `values/app-service.yaml`:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80
```

#### Manual Scaling

```bash
# Scale to specific number of replicas
kubectl scale deployment app-service \
  --replicas=4 \
  -n microservices

# Scale multiple services
kubectl scale deployment app-service worker-service \
  --replicas=3 \
  -n microservices

# Verify scaling
kubectl get replicas
kubectl get hpa -n microservices
```

#### Monitor Auto-scaling

```bash
# Watch HPA status
kubectl get hpa -n microservices --watch

# View HPA details
kubectl describe hpa app-service -n microservices

# View metrics
kubectl top pods -n microservices
kubectl top nodes
```

### Worker Service Scaling

Scale worker instances for image processing:

```bash
# Scale workers independently
kubectl scale deployment worker-service \
  --replicas=5 \
  -n microservices

# This increases image processing throughput
# Monitor with:
kubectl get pods -n microservices -l app=worker-service
```

### Helm Chart Upgrades

Update values and upgrade release:

```bash
# Update values file
# Edit helm/values/app-service.yaml

# Upgrade release
helm upgrade app-service ./helm/app-service \
  -f helm/values/app-service.yaml \
  -n microservices

# Verify update
helm status app-service -n microservices

# View history
helm history app-service -n microservices
```

---

## Monitoring & Logging

### Check Deployment Status

```bash
# Get all resources
kubectl get all -n microservices

# Get pods with details
kubectl get pods -n microservices -o wide

# Get pod logs
kubectl logs deployment/app-service -n microservices

# Follow logs in real-time
kubectl logs -f deployment/app-service -n microservices

# Get previous pod logs (if crashed)
kubectl logs deployment/app-service -n microservices --previous

# Get logs from multiple pods
kubectl logs -f -l app=app-service -n microservices --all-containers
```

### Pod Events and Debugging

```bash
# Describe pod for events
kubectl describe pod [pod-name] -n microservices

# Check pod readiness
kubectl wait --for=condition=ready pod -l app=app-service -n microservices --timeout=60s

# Execute command in pod
kubectl exec -it [pod-name] -n microservices -- /bin/sh

# Copy files from pod
kubectl cp microservices/[pod-name]:/path/to/file ./local/path
```

### Port Forwarding

Access services locally for testing:

```bash
# Forward app-service
kubectl port-forward svc/app-service 3002:3002 -n microservices

# Forward gateway
kubectl port-forward svc/gateway-service 8080:8080 -n microservices

# Forward MongoDB
kubectl port-forward svc/mongodb 27017:27017 -n microservices

# In another terminal, test
curl http://localhost:8080/health
```

### Monitoring Metrics

```bash
# Install metrics-server (if not present)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# View node metrics
kubectl top nodes

# View pod metrics
kubectl top pods -n microservices

# View container-level metrics
kubectl describe node [node-name]

# Create custom monitoring with Prometheus:
# See Kubernetes monitoring documentation
```

---

## Updates & Rollbacks

### Rolling Updates

Helm manages rolling updates automatically:

```bash
# Update image tag in values
sed -i 's/tag:.*/tag: "v2.0.0"/' helm/values/app-service.yaml

# Upgrade with new image
helm upgrade app-service ./helm/app-service \
  -f helm/values/app-service.yaml \
  -n microservices

# Monitor rollout
kubectl rollout status deployment/app-service -n microservices

# Watch rolling update
kubectl get pods -n microservices -w

# View rollout history
kubectl rollout history deployment/app-service -n microservices
```

### Rollback to Previous Version

```bash
# List release history
helm history app-service -n microservices

# Rollback to previous release
helm rollback app-service -n microservices

# Rollback to specific revision
helm rollback app-service 2 -n microservices

# Verify rollback
helm status app-service -n microservices
kubectl get pods -n microservices
```

### Version Control for Deployments

```bash
# Create snapshot of values
cp helm/values/app-service.yaml helm/values/app-service-v1.0.0.yaml

# Tag release
git tag app-service-v1.0.0
git push origin app-service-v1.0.0

# In case of issues, reference previous version
helm upgrade app-service ./helm/app-service \
  -f helm/values/app-service-v1.0.0.yaml \
  -n microservices
```

---

## Troubleshooting

### Deployment Failures

**Problem**: Pod fails to start

**Solutions**:

```bash
# 1. Check pod events
kubectl describe pod [pod-name] -n microservices

# 2. View pod logs
kubectl logs [pod-name] -n microservices

# 3. Check resource availability
kubectl describe node
kubectl top nodes

# 4. Check secrets exist
kubectl get secrets -n microservices

# 5. Verify image exists
kubectl get pods -n microservices -o jsonpath='{.items[*].spec.containers[*].image}'

# 6. Check docker image pulls
kubectl logs [pod-name] -n microservices --previous

# 7. Verify service connectivity
kubectl exec -it [pod-name] -n microservices -- curl http://mongodb:27017
```

### Service Communication Issues

**Problem**: Services can't reach each other

**Solutions**:

```bash
# 1. Check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup app-service

# 2. Check service exists
kubectl get svc -n microservices

# 3. Test connectivity
kubectl exec -it [pod-name] -n microservices -- curl http://auth-service:3001/health

# 4. Check network policies
kubectl get networkpolicies -n microservices

# 5. Check firewall rules
kubectl describe service app-service -n microservices
```

### Database Connection Issues

**Problem**: Services can't connect to MongoDB/Redis

**Solutions**:

```bash
# 1. Check MongoDB pod status
kubectl get pods -n microservices -l app=mongodb

# 2. Check MongoDB logs
kubectl logs -l app=mongodb -n microservices

# 3. Test MongoDB connection
kubectl run -it --rm mongo-client --image=mongo --restart=Never -- \
  mongosh mongodb://mongodb:27017

# 4. Check credentials in secrets
kubectl get secret mongo-secrets -n microservices -o yaml

# 5. Check Redis
kubectl exec -it redis-0 -n microservices -- redis-cli ping

# 6. Verify ports match service configuration
kubectl get svc mongodb -n microservices
```

### High Resource Usage

**Problem**: Pods consuming too much CPU/memory

**Solutions**:

```bash
# 1. Check resource usage
kubectl top pods -n microservices --sort-by=memory

# 2. View pod resource limits
kubectl describe pod [pod-name] -n microservices

# 3. Adjust resource limits in values
# Edit helm/values/app-service.yaml
# Increase limits:
#   limits:
#     memory: "1Gi"
#     cpu: "1000m"

# 4. Upgrade release
helm upgrade app-service ./helm/app-service \
  -f helm/values/app-service.yaml \
  -n microservices

# 5. Monitor improvement
kubectl top pods -n microservices --watch
```

### Helm Command Failures

**Problem**: Helm commands fail or timeout

**Solutions**:

```bash
# 1. Verify Helm release exists
helm list -n microservices

# 2. Get Helm release history
helm history app-service -n microservices

# 3. Check Helm values
helm values app-service -n microservices

# 4. Dry run to validate
helm upgrade app-service ./helm/app-service \
  -f helm/values/app-service.yaml \
  --dry-run --debug \
  -n microservices

# 5. Force upgrade if needed
helm upgrade app-service ./helm/app-service \
  -f helm/values/app-service.yaml \
  --force \
  -n microservices

# 6. Check release status
helm status app-service -n microservices

# 7. Uninstall and reinstall if corrupted
helm uninstall app-service -n microservices
helm install app-service ./helm/app-service \
  -f helm/values/app-service.yaml \
  -n microservices
```

### StatefulSet Issues (MongoDB)

**Problem**: MongoDB pod not ready

**Solutions**:

```bash
# 1. Check StatefulSet status
kubectl get statefulset -n microservices

# 2. Check MongoDB pods
kubectl get pods -n microservices -l app=mongodb

# 3. Check persistent volume claims
kubectl get pvc -n microservices

# 4. Check pod logs
kubectl logs mongodb-0 -n microservices

# 5. Describe pod for events
kubectl describe pod mongodb-0 -n microservices

# 6. Check storage class
kubectl get storageclass
```

---

## Best Practices

### Helm Best Practices

✅ **DO**:

- Use version control for all Helm charts
- Separate secrets from values files
- Use meaningful release names
- Document all custom values
- Test upgrades in staging first
- Use health checks in deployments
- Set resource requests and limits
- Enable auto-scaling for critical services

❌ **DON'T**:

- Commit secrets to git
- Use hardcoded values in templates
- Ignore resource limits
- Deploy without testing
- Skip backup before major changes
- Use latest tag in production

### Production Deployment Checklist

```
Security:
  ☐ Secrets properly encrypted
  ☐ RBAC policies configured
  ☐ Network policies enabled
  ☐ Pod security policies set

Performance:
  ☐ Resource requests/limits set
  ☐ Auto-scaling configured
  ☐ Database indices created
  ☐ Caching enabled

Reliability:
  ☐ Health checks configured
  ☐ Backup strategy in place
  ☐ Monitoring enabled
  ☐ Logging configured

Operations:
  ☐ Runbooks documented
  ☐ Alert thresholds set
  ☐ Disaster recovery plan
  ☐ Regular drills performed
```

---

## Next Steps

After successful deployment:

1. **Configure Monitoring**: Set up Prometheus/Grafana
2. **Enable Logging**: Configure ELK or CloudWatch
3. **Set up Backup**: Regular MongoDB backups
4. **Configure DNS**: Point domain to LoadBalancer
5. **Enable HTTPS**: Install cert-manager and TLS
6. **Set up CI/CD**: See [JENKINS_PIPELINE_SETUP.md](./JENKINS_PIPELINE_SETUP.md)

---

## Additional Resources

- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Bitnami Charts](https://github.com/bitnami/charts)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/)

---

**Last Updated**: January 2026  
**Version**: 1.0.0

---

### Navigation

- ← Back to [README.md](./README.md)
- ← Previous [AWS_KUBERNETES_SETUP.md](./AWS_KUBERNETES_SETUP.md)
- Next → [JENKINS_PIPELINE_SETUP.md](./JENKINS_PIPELINE_SETUP.md)
