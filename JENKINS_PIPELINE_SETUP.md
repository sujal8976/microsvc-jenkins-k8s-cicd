# Jenkins CI/CD Pipeline Setup Guide

Complete guide for setting up Jenkins server and configuring automated CI/CD pipeline for Kubernetes deployments.

---

## Table of Contents

1. [Overview](#overview)
2. [Jenkins Server Setup](#jenkins-server-setup)
3. [Required Tools Installation](#required-tools-installation)
4. [Jenkins Configuration](#jenkins-configuration)
5. [Pipeline Setup](#pipeline-setup)
6. [Credentials Management](#credentials-management)
7. [Pipeline Stages](#pipeline-stages)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### CI/CD Architecture

```
┌─────────────────┐
│  Git Repository │
│   (GitHub/Lab)  │
└────────┬────────┘
         │ Webhook Trigger
         │
┌────────▼─────────────────────┐
│   Jenkins Server (EC2)       │
│   ┌─────────────────────┐    │
│   │  Jenkins Pipeline   │    │
│   │ ┌───────────────┐   │    │
│   │ │ 1. Detect     │   │    │
│   │ │ 2. Build      │   │    │
│   │ │ 3. Test       │   │    │
│   │ │ 4. Push Image │   │    │
│   │ │ 5. Deploy     │   │    │
│   │ └───────────────┘   │    │
│   └─────────────────────┘    │
└────────┬──────────────────────┘
         │ Docker Build & Push
         │ Helm Deploy
         │
┌────────▼──────────────────────┐
│  AWS EKS Cluster              │
│  (Production Environment)      │
│  ┌──────────────────────┐     │
│  │ Kubernetes Namespace │     │
│  │ - Pods              │     │
│  │ - Services          │     │
│  │ - Ingress           │     │
│  └──────────────────────┘     │
└───────────────────────────────┘
```

### Pipeline Flow

```
Git Commit/Push
    ↓
Webhook → Jenkins (triggered)
    ↓
Stage 1: Detect Changes
    └─> Which services changed?
    ↓
Stage 2: Build Docker Images
    └─> Build changed services only
    ↓
Stage 3: Run Tests
    └─> Unit & Integration tests
    ↓
Stage 4: Push to Registry
    └─> Push images to Docker Hub
    ↓
Stage 5: Deploy to EKS
    └─> Update Helm releases
    ↓
Deployment Complete ✓
```

---

## Jenkins Server Setup

### Step 1: Create EC2 Instance

The Jenkins server runs on an EC2 instance. This guide covers the setup process (without specific commands as requested).

#### Instance Configuration

**Instance Type Selection**:

- Minimum: `t3.medium` (2 vCPU, 4GB RAM)
- Recommended: `t3.large` (2 vCPU, 8GB RAM) for production
- For high-volume pipelines: `t3.xlarge` (4 vCPU, 16GB RAM)

**Storage Configuration**:

- Root volume: 30GB minimum (SSD recommended)
- Additional volume: 100GB+ for builds and artifacts

**Security Group Rules**:

- Inbound Port 8080: Jenkins web interface (restrict to your IP)
- Inbound Port 22: SSH access for administration
- Outbound: All traffic to Git, Docker Hub, and AWS services

**Network Configuration**:

- Place in public subnet for GitHub webhooks
- Or use NAT gateway for private subnet
- Attach Elastic IP for stable address

**IAM Role**:

- Attach IAM role with permissions for:
  - EKS cluster access
  - ECR (Elastic Container Registry) for Docker images
  - S3 for artifacts
  - CloudFormation for infrastructure (optional)

**Key Pair**:

- Create or use existing EC2 key pair for SSH access
- Store securely, never commit to repository

#### EC2 Optimization

- Enable detailed monitoring for better insights
- Set up auto-scaling policies if running many pipelines
- Configure CloudWatch alarms for instance health
- Enable termination protection to prevent accidental deletion
- Set up proper backup strategy

### Step 2: Jenkins Installation

After EC2 instance is running and accessible:

#### Java Runtime

Jenkins requires Java. The installation process includes:

- Installing Java Development Kit (JDK)
- Setting JAVA_HOME environment variable
- Verifying Java version

#### Jenkins Installation Process

The process involves:

- Adding Jenkins repository
- Installing Jenkins package
- Starting Jenkins service
- Enabling Jenkins to start on boot
- Accessing Jenkins web interface (default port 8080)

#### Initial Setup Wizard

When Jenkins starts, an initial setup wizard guides:

- Unlocking Jenkins (retrieve password from server)
- Installing suggested plugins
- Creating first admin user
- Configuring Jenkins URL

#### Plugin Installation

Essential plugins needed:

- **Git**: Source code management
- **GitHub/GitLab**: Repository integration
- **Docker**: Docker build and push
- **Kubernetes**: Kubernetes deployment
- **Helm**: Helm chart deployment
- **Pipeline**: Jenkins declarative/scripted pipelines
- **Credentials**: Secure credential management
- **AWS**: AWS service integration
- **CloudBees Docker Build and Publish**: Docker operations
- **Email Extension**: Email notifications
- **Slack**: Slack notifications (optional)

---

## Required Tools Installation

### Overview

Jenkins needs several command-line tools to build and deploy the application.

### Tool 1: Docker

**Purpose**: Build and manage container images

**Installation involves**:

- Installing Docker Engine
- Adding Jenkins user to Docker group (for permission)
- Verifying Docker installation
- Configuring Docker daemon for Jenkins access

**Why Needed**:

- Build Docker images for each service
- Run Docker containers for testing
- Push images to Docker Hub

**Verification**: Run docker version command and list images

### Tool 2: kubectl

**Purpose**: Manage Kubernetes cluster

**Installation involves**:

- Installing kubectl binary
- Setting up kubeconfig file from EKS cluster
- Testing cluster connectivity
- Configuring kubectl context for default cluster

**Why Needed**:

- Deploy to EKS cluster
- Check deployment status
- View logs and troubleshoot

**Verification**: Connect to EKS cluster and list nodes

### Tool 3: Helm

**Purpose**: Package manager for Kubernetes

**Installation involves**:

- Installing Helm 3
- Adding Helm repositories (Bitnami, etc.)
- Updating repository indices
- Verifying Helm can access repositories

**Why Needed**:

- Deploy Helm charts to EKS
- Manage releases and upgrades
- Handle values and secrets

**Verification**: List Helm repositories and releases

### Tool 4: AWS CLI

**Purpose**: Interact with AWS services

**Installation involves**:

- Installing AWS CLI v2
- Configuring credentials via IAM role or access keys
- Setting default region to match EKS cluster
- Configuring output format

**Why Needed**:

- Authenticate to EKS cluster
- Push to ECR (Elastic Container Registry)
- Access S3 for build artifacts
- Manage AWS infrastructure

**Verification**: Check AWS identity and list S3 buckets

### Installation Process

For each tool, the installation process includes:

1. **Downloading** the appropriate version for the OS
2. **Installing** into system path
3. **Verifying** installation with version commands
4. **Configuring** for Jenkins user (usually jenkins user)
5. **Testing** functionality with basic commands
6. **Documentation** of versions for reference

### Permissions Configuration

**Jenkins User Access**:

- Ensure jenkins system user can execute all tools
- Configure sudo permissions if needed for Docker
- Set proper file permissions for kubeconfig
- Store AWS credentials securely

**File Permissions**:

- kubeconfig: 600 permissions (read/write by owner only)
- Docker socket: jenkins user in docker group
- AWS credentials: stored in Jenkins Credentials store

---

## Jenkins Configuration

### Global Configuration

#### System Configuration Tasks

1. **Configure Jenkins URL**

   - Set Jenkins root URL (e.g., http://your-jenkins-server:8080/)
   - Used for webhooks and links

2. **Configure Executors**

   - Set number of concurrent builds (default: 2)
   - Increase for high-volume pipelines

3. **Configure System Log**

   - Set log level for troubleshooting
   - Configure log rotation

4. **Configure Tools**
   - Specify Docker installation path
   - Specify Git installation path
   - Specify Maven/Gradle if applicable

#### Email Configuration

For notifications:

- Configure SMTP server details
- Set sender email address
- Configure recipient addresses
- Test email functionality

#### Slack Configuration (Optional)

For Slack notifications:

- Install Slack plugin
- Generate Slack bot token
- Configure Slack workspace
- Test notification delivery

### GitHub Integration

#### Webhook Configuration

1. **In GitHub Repository Settings**:

   - Go to Settings → Webhooks
   - Add webhook with Jenkins URL
   - Select events to trigger (push, pull requests)
   - Configure secret token for security

2. **In Jenkins Configuration**:
   - Create GitHub credentials (personal access token)
   - Configure GitHub server connection
   - Link webhook to Jenkins job

#### Repository Permissions

- Ensure GitHub user/token has read access to repository
- Required permissions: Read code, webhook access
- Consider limiting webhook to specific branches

---

## Pipeline Setup

### Jenkinsfile Overview

The `Jenkinsfile` in the repository defines the CI/CD pipeline.

#### Pipeline Structure

```groovy
pipeline {
  agent any

  environment {
    DOCKER_REGISTRY = "docker.io"
    DOCKER_REPO = "devsujal"
    KUBE_NAMESPACE = "microservices"
    HELM_BASE_PATH = "helm"
  }

  stages {
    stage('Detect Changes') {
      // Analyze which services changed
    }

    stage('Build & Test') {
      // Build Docker images
      // Run tests
    }

    stage('Push Images') {
      // Push to Docker registry
    }

    stage('Deploy to EKS') {
      // Deploy using Helm
    }
  }

  post {
    // Notifications and cleanup
  }
}
```

### Creating Jenkins Job

#### Using Jenkins Web Interface

1. **Create New Job**:

   - Go to Jenkins home
   - Click "New Item"
   - Enter job name (e.g., "image-processor-pipeline")
   - Select "Pipeline" type
   - Click "OK"

2. **Configure General**:

   - Enable "GitHub project"
   - Enter repository URL
   - Enable concurrent builds (optional)

3. **Configure Build Triggers**:

   - Select "GitHub hook trigger for GITScm polling"
   - This enables automatic triggering on Git push

4. **Configure Pipeline**:

   - Definition: "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: Your Git URL
   - Credentials: GitHub credentials
   - Branch: \*/main (or your default branch)
   - Script Path: Jenkinsfile

5. **Save Job**:
   - Click "Save"
   - Job is now ready for execution

#### Using Jenkins Configuration as Code (JCasC)

For infrastructure-as-code approach:

Store Jenkins configuration in YAML file that:

- Defines jobs declaratively
- Manages credentials
- Configures global settings
- Version controlled and reproducible

### Pipeline Execution

#### Manual Trigger

1. Go to job in Jenkins UI
2. Click "Build Now"
3. Monitor build progress in "Build History"
4. View detailed logs for each stage

#### Automatic Trigger

1. Make change and push to Git
2. GitHub webhook sends request to Jenkins
3. Jenkins automatically starts pipeline
4. Monitor progress in Jenkins UI

#### Build Parameters

Job can accept parameters:

- Git branch to build
- Docker image tag
- Helm values override
- Environment selection (dev/staging/prod)

---

## Credentials Management

### Storing Credentials Securely

Jenkins Credentials Store manages sensitive data.

#### Credential Types Needed

1. **GitHub Credentials**

   - Type: Username with password or Personal Access Token
   - Used for: Cloning repository, webhook authentication
   - Scope: Global

2. **Docker Hub Credentials**

   - Type: Username with password
   - Used for: Pushing Docker images
   - Scope: Global
   - Username: Docker Hub username
   - Password: Docker Hub access token

3. **AWS Credentials**

   - Type: AWS Credentials
   - Used for: ECR access, EKS operations, S3
   - Scope: Global
   - Access Key ID: AWS IAM user key
   - Secret Access Key: AWS IAM user secret

4. **Kubernetes Kubeconfig**
   - Type: Secret file
   - Used for: kubectl access to EKS cluster
   - Scope: Global
   - Content: kubeconfig file from EKS cluster

#### Adding Credentials

1. **In Jenkins UI**:

   - Go to "Manage Jenkins" → "Manage Credentials"
   - Select appropriate store (usually "Jenkins")
   - Click "Add Credentials"
   - Select credential type
   - Enter credential details
   - Click "Create"

2. **Using Jenkins API**:
   - Create XML credential definitions
   - POST to Jenkins credentials API
   - Useful for automation

#### Credential IDs

When credentials are created, assign IDs:

- GitHub: `github-credentials`
- Docker Hub: `dockerhub-credentials`
- AWS: `aws-credentials`
- Kubeconfig: `kubeconfig-credentials`

These IDs are referenced in Jenkinsfile.

#### Security Best Practices

✅ **DO**:

- Use credential IDs, never hardcode secrets
- Use service accounts instead of personal credentials
- Rotate credentials regularly
- Limit credential scope to necessary jobs
- Audit credential usage

❌ **DON'T**:

- Commit credentials to repository
- Share credentials between teams
- Use personal credentials for automation
- Log sensitive data
- Store unencrypted credentials

---

## Pipeline Stages

### Stage 1: Detect Changes

**Purpose**: Identify which services have changed

**Process**:

- Get current commit hash and previous commit
- Compare files in current vs previous commit
- Identify changed service directories
- Set environment variables for changed services

**Output**: List of services to build (if any)

### Stage 2: Build Docker Images

**Purpose**: Build Docker containers for changed services

**Process for Each Changed Service**:

1. Navigate to service directory
2. Build Docker image with tag including build number
3. Also tag with "latest"
4. Verify build succeeds
5. Run basic tests if applicable

**Dockerfile Requirements**:

- Multi-stage builds for optimization
- Specific base image versions (not "latest")
- Layer caching for faster builds
- Non-root user execution for security

**Output**: Built Docker images ready for push

### Stage 3: Run Tests

**Purpose**: Validate changes before deployment

**Test Types**:

- **Unit Tests**: Individual function testing
- **Integration Tests**: Service interaction testing
- **Linting**: Code quality and style checks
- **Security Scanning**: Vulnerability checks
- **Build Verification**: Ensure builds are valid

**Test Execution**:

- Run tests in Docker container
- Fail pipeline if tests fail
- Generate test reports
- Archive test results

### Stage 4: Push Images to Registry

**Purpose**: Store Docker images in registry

**Process**:

1. Authenticate to Docker Hub with credentials
2. Push image with build number tag
3. Push image with "latest" tag
4. Verify push succeeds
5. Clean up local images

**Registry Considerations**:

- Use private registry for sensitive code
- ECR (AWS) for EKS integration
- Docker Hub for public images
- Consider image retention policies

### Stage 5: Deploy to EKS

**Purpose**: Update Kubernetes cluster with new images

**Deployment Process**:

1. **Prepare Deployment**:

   - Authenticate to EKS cluster
   - Verify cluster connectivity
   - Check target namespace exists

2. **Update Helm Values**:

   - Update image tags in values file
   - Set new image pull policy
   - Update other values if needed

3. **Perform Helm Upgrade**:

   - Run helm upgrade command
   - Wait for deployment to complete
   - Monitor pod rollout

4. **Verify Deployment**:

   - Check all pods are running
   - Verify services are accessible
   - Run health checks
   - Check logs for errors

5. **Rollback on Failure**:
   - If deployment fails, rollback
   - Return to previous stable version
   - Notify team of issue

### Post-Pipeline Actions

#### Success Actions

- Send success notification
- Archive build artifacts
- Update deployment tracking
- Trigger dependent jobs (if any)

#### Failure Actions

- Send failure notification with logs
- Trigger rollback if deployment
- Archive logs for investigation
- Slack notification with details

---

## Troubleshooting

### Pipeline Execution Issues

**Problem**: Pipeline fails at "Detect Changes" stage

**Solutions**:

The detection process involves:

- Checking git diff command
- Verifying git history available
- Ensuring proper branch checkout
- Handling initial pipeline runs

**Investigation**:

- View detailed logs for git commands
- Verify Jenkins has git installed
- Check git repository connectivity
- Review git diff output format

---

**Problem**: Docker build fails

**Solutions**:

The build process depends on:

- Docker daemon running
- Jenkins user can access Docker
- Dockerfile syntax correct
- Build context has required files
- Sufficient disk space for builds

**Investigation**:

- Check Docker daemon logs
- Verify Docker permissions
- Review Dockerfile for errors
- Check build context (COPY, ADD commands)
- Monitor disk usage during builds

---

**Problem**: Image push fails to Docker Hub

**Solutions**:

Pushing images requires:

- Docker Hub credentials configured
- Correct registry URL format
- Valid Docker Hub account
- Repository exists or auto-creation enabled
- Network connectivity to registry

**Investigation**:

- Verify Docker Hub credentials
- Test login manually
- Check repository access permissions
- Verify image name format
- Monitor network connectivity

---

**Problem**: Helm deployment fails

**Solutions**:

Helm deployment involves:

- EKS cluster connectivity
- Kubeconfig configured correctly
- Helm charts exist at path
- Values files are valid YAML
- Required Kubernetes permissions
- Sufficient cluster resources

**Investigation**:

- Verify kubectl connection to cluster
- Test helm commands manually
- Check values YAML syntax
- Review pod events and logs
- Check cluster resource availability

---

### Build Performance Issues

**Problem**: Builds taking too long

**Causes and Solutions**:

- **Docker layer caching**: Ensure optimal Dockerfile structure
- **Large dependencies**: Use Docker cache optimization
- **Network issues**: Verify connectivity to registries
- **Insufficient resources**: Increase Jenkins executor memory
- **Concurrent builds**: Reduce number of parallel builds

**Optimization**:

- Use multi-stage Docker builds
- Cache npm/maven dependencies
- Pre-pull base images
- Use Docker BuildKit for faster builds
- Scale Jenkins with multiple executors

---

### Integration Issues

**Problem**: Jenkins can't connect to GitHub

**Solutions**:

- Verify GitHub credentials in Jenkins
- Check GitHub personal access token scope
- Verify webhook is configured
- Check Jenkins URL is accessible from GitHub
- Verify network access between Jenkins and GitHub

**Investigation**:

- Test GitHub credentials manually
- Check GitHub webhook delivery logs
- Verify Jenkins URL in GitHub webhook settings
- Review Jenkins logs for connection errors
- Test git clone manually from Jenkins server

---

**Problem**: Jenkins can't access EKS cluster

**Solutions**:

Requires proper setup of:

- Kubeconfig file in Jenkins
- IAM permissions for Jenkins user
- EKS cluster access entries configured
- Network connectivity from Jenkins to cluster
- Proper role-based access control

**Investigation**:

- Test kubectl manually from Jenkins server
- Verify kubeconfig file path and permissions
- Check IAM user permissions for EKS
- Review EKS access entries
- Monitor network security groups

---

### Security Issues

**Problem**: Credentials exposed in logs

**Solutions**:

Jenkins should automatically mask:

- AWS credentials
- Docker Hub passwords
- GitHub tokens
- API keys and secrets

**Ensure**:

- Jenkins credentials plugin updated
- Credentials marked as sensitive
- Logs don't contain secrets
- Build output sanitized

---

**Problem**: Unauthorized access to Jenkins

**Solutions**:

Configure:

- Jenkins authentication (LDAP, GitHub OAuth, etc.)
- Authorization strategy (based on roles)
- Access control for jobs and builds
- Audit logging for security events

---

## Advanced Configuration

### Parallel Builds

Configure pipeline to build multiple services simultaneously:

```
Stage 1: Detect Changes
  ↓
Stage 2: Build Services (Parallel)
  ├─ Build auth-service
  ├─ Build app-service
  ├─ Build worker-service
  └─ Build gateway-service
  ↓
Stage 3: Push All Images
  ↓
Stage 4: Deploy All Services
```

### Multi-Environment Deployments

Configure separate deployments for:

- **Development**: Automatic on every commit
- **Staging**: Manual trigger or merge to develop branch
- **Production**: Manual approval required

### Automated Rollbacks

Configure automatic rollback if:

- Health checks fail
- Error rate exceeds threshold
- Custom business logic triggers rollback

---

## Monitoring and Alerts

### Jenkins Monitoring

Monitor:

- Build queue length
- Executor utilization
- Build success/failure rates
- Pipeline execution time
- Disk space usage

### Integration with Monitoring Tools

- Send metrics to CloudWatch
- Create Prometheus metrics
- Set up ELK for log aggregation
- Configure PagerDuty for critical failures

---

## Best Practices

✅ **DO**:

- Keep Jenkinsfile simple and maintainable
- Use declarative pipelines for complex flows
- Store credentials securely
- Version control all configuration
- Test pipeline changes before merging
- Monitor build performance
- Keep Jenkins updated
- Regular backups of Jenkins configuration
- Document custom plugins and configurations

❌ **DON'T**:

- Hardcode secrets in Jenkinsfile or code
- Use Jenkins for long-running jobs (use workers)
- Ignore build failures silently
- Skip testing before deployment
- Mix manual and automatic deployment
- Deploy without approval gates (production)
- Keep old builds and artifacts indefinitely
- Ignore pipeline performance degradation

---

## Next Steps

After Jenkins is fully configured:

1. **Test Pipeline**: Trigger test builds and verify all stages
2. **Configure Notifications**: Set up email/Slack alerts
3. **Document Process**: Create runbooks for team
4. **Automate Backups**: Regular Jenkins configuration backups
5. **Monitor Performance**: Set up monitoring and alerting
6. **Train Team**: Ensure team understands pipeline
7. **Plan Updates**: Schedule Jenkins version upgrades
8. **Security Review**: Conduct regular security audits

---

## Additional Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Jenkinsfile Best Practices](https://www.jenkins.io/doc/book/pipeline/)
- [Docker in Jenkins](https://docs.docker.com/build/ci/jenkins/)
- [Kubernetes Plugin](https://plugins.jenkins.io/kubernetes/)
- [Helm Plugin](https://plugins.jenkins.io/helm/)
- [AWS Plugin](https://plugins.jenkins.io/aws-credentials/)

---

**Last Updated**: January 2026  
**Version**: 1.0.0

---

### Navigation

- ← Back to [README.md](./README.md)
- ← Previous [HELM_KUBERNETES_DEPLOYMENT.md](./HELM_KUBERNETES_DEPLOYMENT.md)
