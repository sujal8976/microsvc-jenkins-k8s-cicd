# AWS & Kubernetes Setup Guide

Complete guide for setting up AWS infrastructure and EKS cluster for production deployment of the Multi-Resolution Image Generator.

---

## Table of Contents

1. [AWS Account Setup](#aws-account-setup)
2. [VPC Creation with CloudFormation](#vpc-creation-with-cloudformation)
3. [IAM Users & Permissions](#iam-users--permissions)
4. [EKS Cluster Setup](#eks-cluster-setup)
5. [Node Groups & Auto-scaling](#node-groups--auto-scaling)
6. [Cluster Access Configuration](#cluster-access-configuration)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)

---

## AWS Account Setup

### Prerequisites

1. **AWS Account**: Create at [https://aws.amazon.com/](https://aws.amazon.com/)
2. **AWS CLI**: Install from [AWS CLI Documentation](https://aws.amazon.com/cli/)
3. **eksctl**: Install from [eksctl Documentation](https://eksctl.io/)
4. **kubectl**: Install from [kubectl Documentation](https://kubernetes.io/docs/tasks/tools/)
5. **Configured AWS Credentials**: Run `aws configure`

### Install Required Tools

#### AWS CLI

```bash
# Check if installed
aws --version

# If not installed, download and install
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### eksctl

```bash
# Check if installed
eksctl version

# If not installed
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

#### kubectl

```bash
# Check if installed
kubectl version

# If not installed
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

#### Helm

```bash
# Check if installed
helm version

# If not installed
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Configure AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure

# Enter when prompted:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: [us-west-2]
# Default output format: json
```

### Verify Setup

```bash
# Test AWS CLI
aws sts get-caller-identity

# Test kubectl
kubectl version --client

# Test eksctl
eksctl version

# Test Helm
helm version
```

---

## VPC Creation with CloudFormation

### Overview

AWS EKS requires a VPC (Virtual Private Cloud) with proper subnets and security groups. We'll use the official AWS CloudFormation template for optimal configuration.

### CloudFormation Template

**Source**: https://s3.us-west-2.amazonaws.com/amazon-eks/cloudformation/2020-10-29/amazon-eks-vpc-private-subnets.yaml

### Create VPC Stack

#### Using AWS CLI

```bash
# Set variables
AWS_REGION="us-west-2"
STACK_NAME="eks-vpc-stack"
TEMPLATE_URL="https://s3.us-west-2.amazonaws.com/amazon-eks/cloudformation/2020-10-29/amazon-eks-vpc-private-subnets.yaml"

# Create CloudFormation stack
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-url $TEMPLATE_URL \
  --region $AWS_REGION

# Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --region $AWS_REGION

# View stack outputs (you'll need these later)
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs' \
  --region $AWS_REGION
```

#### Using AWS Console

1. Go to [CloudFormation Console](https://console.aws.amazon.com/cloudformation)
2. Click "Create Stack"
3. Select "Template is ready"
4. Enter template URL: `https://s3.us-west-2.amazonaws.com/amazon-eks/cloudformation/2020-10-29/amazon-eks-vpc-private-subnets.yaml`
5. Click "Next"
6. Leave default parameters, click "Next"
7. Review and click "Create stack"
8. Wait for stack creation to complete

### VPC Stack Outputs

The CloudFormation stack will output:

- **VpcId**: VPC identifier
- **SubnetIds**: List of subnets for EKS cluster
- **SecurityGroups**: Security group IDs

Save these values for next steps.

---

## IAM Users & Permissions

### Overview

Create separate IAM users for:

1. **EKS Admin**: Full EKS cluster management
2. **Worker Nodes**: EC2 instances running pods
3. **Jenkins**: CI/CD pipeline automation

### 1. Create EKS Admin User

This user will manage the EKS cluster.

#### Using AWS CLI

```bash
# Create user
aws iam create-user --user-name eks-admin

# Create access keys
aws iam create-access-key --user-name eks-admin

# Attach administrator policy (for full access)
aws iam attach-user-policy \
  --user-name eks-admin \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

#### Using AWS Console

1. Go to [IAM Users Console](https://console.aws.amazon.com/iam/home#/users)
2. Click "Create user"
3. Username: `eks-admin`
4. Click "Create user"
5. Go to user details
6. Click "Create access key" (select "Command line interface")
7. Copy Access Key ID and Secret Access Key
8. Click "Attach policies directly"
9. Search for and select "AdministratorAccess"

### 2. Create Worker Nodes Role

This role will be attached to EC2 instances that run as worker nodes.

#### Using AWS CLI

```bash
# Create trust policy file
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name eks-worker-nodes-role \
  --assume-role-policy-document file://trust-policy.json

# Attach required policies
aws iam attach-role-policy \
  --role-name eks-worker-nodes-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy

aws iam attach-role-policy \
  --role-name eks-worker-nodes-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy

aws iam attach-role-policy \
  --role-name eks-worker-nodes-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
```

#### Using AWS Console

1. Go to [IAM Roles Console](https://console.aws.amazon.com/iam/home#/roles)
2. Click "Create role"
3. Select "EC2" as trusted entity
4. Click "Next"
5. Search for and select:
   - `AmazonEKSWorkerNodePolicy`
   - `AmazonEKS_CNI_Policy`
   - `AmazonEC2ContainerRegistryReadOnly`
6. Click "Next"
7. Role name: `eks-worker-nodes-role`
8. Click "Create role"

### 3. Create Jenkins User

This user will deploy to EKS from Jenkins pipeline.

#### Using AWS CLI

```bash
# Create user
aws iam create-user --user-name jenkins-eks-deployer

# Create access keys
aws iam create-access-key --user-name jenkins-eks-deployer

# Create inline policy for Jenkins
cat > jenkins-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters",
        "ecr:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": "arn:aws:s3:::*"
    }
  ]
}
EOF

# Attach policy
aws iam put-user-policy \
  --user-name jenkins-eks-deployer \
  --policy-name jenkins-eks-deploy-policy \
  --policy-document file://jenkins-policy.json
```

#### Using AWS Console

1. Go to [IAM Users Console](https://console.aws.amazon.com/iam/home#/users)
2. Click "Create user"
3. Username: `jenkins-eks-deployer`
4. Click "Next"
5. Click "Create user"
6. Go to user details
7. Click "Add permissions" → "Create inline policy"
8. Paste the policy JSON above
9. Review and create

---

## EKS Cluster Setup

### Overview

AWS EKS is a managed Kubernetes service. We'll create the cluster using `eksctl` which automates most configuration.

### Create EKS Cluster

#### Using eksctl (Recommended)

```bash
# Set variables
CLUSTER_NAME="image-processor-cluster"
AWS_REGION="us-west-2"
NODE_GROUP_NAME="primary-nodes"

# Create cluster
eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $AWS_REGION \
  --nodegroup-name $NODE_GROUP_NAME \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 4 \
  --with-oidc \
  --ssh-access \
  --ssh-public-key ~/.ssh/id_rsa.pub

# This will take 15-20 minutes
```

#### Parameters Explained

- `--name`: Cluster name
- `--region`: AWS region (us-west-2)
- `--nodegroup-name`: Name for worker node group
- `--node-type`: EC2 instance type (t3.medium = 2 CPU, 4GB RAM)
- `--nodes`: Initial number of worker nodes
- `--nodes-min`: Minimum nodes for auto-scaling
- `--nodes-max`: Maximum nodes for auto-scaling
- `--with-oidc`: Enable OIDC provider (for pod permissions)
- `--ssh-access`: Enable SSH access to nodes
- `--ssh-public-key`: SSH key for node access

### Verify Cluster Creation

```bash
# Check cluster status
eksctl get cluster --name $CLUSTER_NAME --region $AWS_REGION

# View nodes
kubectl get nodes

# View pods in all namespaces
kubectl get pods -A

# Check cluster info
kubectl cluster-info
```

---

## Node Groups & Auto-scaling

### Overview

Node Groups are collections of EC2 instances. Auto-scaling adjusts the number based on demand.

### Create Additional Node Group

If you want different node types (e.g., compute-optimized):

```bash
# Create new node group
eksctl create nodegroup \
  --cluster=$CLUSTER_NAME \
  --region=$AWS_REGION \
  --name=compute-nodes \
  --node-type=c5.large \
  --nodes=1 \
  --nodes-min=1 \
  --nodes-max=3

# Wait for node group to be ready
eksctl get nodegroup --cluster=$CLUSTER_NAME --region=$AWS_REGION
```

### Configure Cluster Autoscaler

The Cluster Autoscaler automatically scales nodes based on resource requests.

#### Install Cluster Autoscaler

```bash
# 1. Create IAM policy for autoscaler
cat > cluster-autoscaler-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "ec2:DescribeLaunchTemplateVersions"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# 2. Create IAM role and attach policy
aws iam create-role \
  --role-name cluster-autoscaler \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/oidc.eks.us-west-2.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "oidc.eks.us-west-2.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:sub": "system:serviceaccount:kube-system:cluster-autoscaler"
          }
        }
      }
    ]
  }'

# 3. Attach policy to role
aws iam put-role-policy \
  --role-name cluster-autoscaler \
  --policy-name cluster-autoscaler-policy \
  --policy-document file://cluster-autoscaler-policy.json

# 4. Install using Helm
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set autoDiscovery.clusterName=$CLUSTER_NAME \
  --set awsRegion=$AWS_REGION
```

### Verify Autoscaler Installation

```bash
# Check autoscaler pod
kubectl get pods -n kube-system | grep cluster-autoscaler

# View autoscaler logs
kubectl logs -n kube-system deployment.apps/cluster-autoscaler
```

---

## Cluster Access Configuration

### Overview

Control who can access the cluster and what they can do.

### Add Jenkins User to Cluster

#### 1. Create RBAC Role

```bash
# Create ClusterRole for Jenkins deployments
kubectl create clusterrolebinding jenkins-deployer-binding \
  --clusterrole=edit \
  --serviceaccount=default:jenkins-deployer

# Create service account
kubectl create serviceaccount jenkins-deployer

# Get service account token
kubectl get secret $(kubectl get secret -o name | grep jenkins-deployer) \
  -o jsonpath='{.data.token}' | base64 -d
```

#### 2. Update Access Entries (AWS Console Method)

For newer EKS clusters, use Access Entries:

```bash
# Create access entry for Jenkins user
aws eks create-access-entry \
  --cluster-name $CLUSTER_NAME \
  --principal-arn arn:aws:iam::ACCOUNT_ID:user/jenkins-eks-deployer \
  --type STANDARD

# Create access policy association
aws eks associate-access-policy \
  --cluster-name $CLUSTER_NAME \
  --principal-arn arn:aws:iam::ACCOUNT_ID:user/jenkins-eks-deployer \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy

# For limited access, use other policies:
# - AmazonEKSViewPolicy (read-only)
# - AmazonEKSEditPolicy (edit deployments)
```

### Update kubeconfig

```bash
# Update kubeconfig for cluster access
aws eks update-kubeconfig \
  --name $CLUSTER_NAME \
  --region $AWS_REGION

# Verify access
kubectl auth can-i get pods --all-namespaces
kubectl auth can-i create deployments
```

### Enable Jenkins User Access

For Jenkins to deploy, it needs kubeconfig:

```bash
# 1. Create kubeconfig for Jenkins user
aws eks update-kubeconfig \
  --name $CLUSTER_NAME \
  --region $AWS_REGION \
  --kubeconfig=/tmp/jenkins-kubeconfig

# 2. Copy to Jenkins server (after Jenkins setup)
# Will be handled in JENKINS_PIPELINE_SETUP.md

# 3. Test with Jenkins credentials
export KUBECONFIG=/tmp/jenkins-kubeconfig
kubectl get nodes
```

---

## Verification & Testing

### Cluster Health Checks

```bash
# Check cluster status
eksctl get cluster --name $CLUSTER_NAME

# View all nodes
kubectl get nodes

# Check node resources
kubectl top nodes

# Check all pods
kubectl get pods -A

# Check persistent volumes
kubectl get pv

# Check namespaces
kubectl get namespaces
```

### Test Cluster Connectivity

```bash
# Deploy test pod
kubectl run test-pod --image=nginx:latest

# Check pod status
kubectl get pods

# Access pod
kubectl port-forward pod/test-pod 8080:80

# In another terminal, test
curl http://localhost:8080

# Clean up
kubectl delete pod test-pod
```

### Test Auto-scaling

```bash
# Create deployment with requests
cat > test-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-deploy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test
  template:
    metadata:
      labels:
        app: test
    spec:
      containers:
      - name: test
        image: nginx
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
EOF

kubectl apply -f test-deployment.yaml

# Monitor node count
watch kubectl get nodes

# Scale to trigger node scaling
kubectl scale deployment test-deploy --replicas=5

# Watch as new nodes are created
watch kubectl get nodes

# Clean up
kubectl delete deployment test-deploy
rm test-deployment.yaml
```

---

## Troubleshooting

### Cluster Creation Issues

**Problem**: `eksctl create cluster` fails

**Solutions**:

```bash
# 1. Check AWS credentials
aws sts get-caller-identity

# 2. Verify IAM permissions
# Ensure user has EKS, EC2, VPC, IAM permissions

# 3. Check region
aws ec2 describe-regions

# 4. Check for existing resources
eksctl get cluster --all-regions

# 5. View CloudFormation events for details
aws cloudformation describe-stack-events \
  --stack-name $CLUSTER_NAME

# 6. Delete and retry
eksctl delete cluster --name $CLUSTER_NAME --region $AWS_REGION
```

### Node Issues

**Problem**: Nodes not joining cluster

**Solutions**:

```bash
# Check node status
kubectl get nodes

# Describe nodes for issues
kubectl describe nodes

# Check node logs (SSH into node)
# SSH to node using EC2 instance ID
aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,PrivateIpAddress]'

# Check kubelet logs
sudo journalctl -u kubelet

# Check node resources
kubectl top nodes
```

### Access Issues

**Problem**: "Unauthorized" when accessing cluster

**Solutions**:

```bash
# Verify kubeconfig
cat ~/.kube/config

# Check current context
kubectl config current-context

# List available contexts
kubectl config get-contexts

# Switch context if needed
kubectl config use-context $CLUSTER_NAME

# Verify IAM user/role has access
aws eks describe-access-entries \
  --cluster-name $CLUSTER_NAME

# Check RBAC roles
kubectl get rolebindings -A
kubectl get clusterrolebindings -A
```

### Auto-scaler Not Working

**Problem**: Cluster Autoscaler not scaling nodes

**Solutions**:

```bash
# Check autoscaler is running
kubectl get deployment -n kube-system cluster-autoscaler

# View autoscaler logs
kubectl logs -n kube-system -l app=cluster-autoscaler

# Check IAM role has correct permissions
aws iam get-role --role-name cluster-autoscaler

# Verify auto scaling group tags
aws autoscaling describe-auto-scaling-groups

# Force scale test
kubectl set resources deployment nginx --limits=cpu=500m,memory=256Mi
kubectl scale deployment nginx --replicas=10
```

### Network Issues

**Problem**: Pods can't communicate or reach outside world

**Solutions**:

```bash
# Check pod network
kubectl get pods -A

# Test DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup kubernetes.default

# Check service network
kubectl get svc -A

# View network policies
kubectl get networkpolicies -A

# Check security groups
aws ec2 describe-security-groups
```

---

## Cost Optimization

### Monitor Costs

```bash
# View cluster autoscaling group
aws autoscaling describe-auto-scaling-groups \
  --region $AWS_REGION

# Check node utilization
kubectl top nodes

# View unused resources
kubectl get nodes
kubectl top pods -A
```

### Reduce Costs

1. **Right-size instances**: Use smaller instance types if possible
2. **Reduce node group size**: Lower `--nodes-max` parameter
3. **Use spot instances**: For non-critical workloads
4. **Enable pod disruption budgets**: Safer cost reduction
5. **Monitor regularly**: Set up AWS Cost Explorer alerts

---

## Security Best Practices

### Cluster Security

```bash
# 1. Disable public access (if using private endpoint)
aws eks update-cluster-config \
  --name $CLUSTER_NAME \
  --resources-vpc-config \
    endpointPublicAccess=false \
    endpointPrivateAccess=true

# 2. Enable logging
aws eks update-cluster-logging \
  --cluster-name $CLUSTER_NAME \
  --logging config=[{enabled=true,types=["api","audit","authenticator"]}]

# 3. Use network policies
kubectl apply -f network-policy.yaml

# 4. Enable pod security policies
kubectl label namespace default pod-security.kubernetes.io/enforce=baseline
```

### IAM Security

- Regularly rotate access keys
- Use temporary credentials for CI/CD
- Follow principle of least privilege
- Audit IAM permissions regularly
- Enable CloudTrail for audit logs

---

## Next Steps

After EKS cluster is ready:

1. **Install Helm Charts**: See [HELM_KUBERNETES_DEPLOYMENT.md](./HELM_KUBERNETES_DEPLOYMENT.md)
2. **Set Up Jenkins**: See [JENKINS_PIPELINE_SETUP.md](./JENKINS_PIPELINE_SETUP.md)
3. **Configure Monitoring**: Set up CloudWatch monitoring
4. **Plan Backup Strategy**: Configure cluster backup

---

## Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [eksctl Documentation](https://eksctl.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/iam/latest/userguide/best-practices.html)
- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)

---

**Last Updated**: January 2026  
**Version**: 1.0.0

---

### Navigation

- ← Back to [README.md](./README.md)
- ← Previous [APPLICATION_SETUP.md](./APPLICATION_SETUP.md)
- Next → [HELM_KUBERNETES_DEPLOYMENT.md](./HELM_KUBERNETES_DEPLOYMENT.md)
