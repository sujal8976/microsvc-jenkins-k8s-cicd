pipeline {
  agent any

  environment {
    DOCKER_REGISTRY = "docker.io"
    DOCKER_REPO     = "devsujal"
    KUBE_NAMESPACE  = "microservices"
    HELM_BASE_PATH  = "helm"
  }

  stages {

    stage('Detect Changed Services') {
      steps {
        script {
          def changedFiles = sh(
            script: "git diff --name-only HEAD~1 HEAD",
            returnStdout: true
          ).trim().split("\n")

          SERVICES = detectServices(changedFiles)

          if (SERVICES.isEmpty()) {
            echo "No service changes detected. Skipping pipeline."
            currentBuild.result = 'SUCCESS'
            return
          }

          echo "Services to deploy: ${SERVICES}"
        }
      }
    }

    stage('Build & Deploy') {
      steps {
        script {
          SERVICES.each { svc ->
            deployService(svc)
          }
        }
      }
    }
  }
}

def detectServices(files) {
  def services = []

  files.each { file ->
    if (file.startsWith("app-service/")) services << "app-service"
    if (file.startsWith("auth-service/")) services << "auth-service"
    if (file.startsWith("gateway-service/")) services << "gateway-service"
    if (file.startsWith("worker-service/")) services << "worker-service"
    if (file.startsWith("helm/")) services << "helm"
  }

  return services.unique()
}


def deployService(serviceName) {

  def imageName = "${DOCKER_REPO}/${serviceName}"
  def imageTag  = env.BUILD_NUMBER
  def chartPath = "${HELM_BASE_PATH}/${serviceName}"
  def valuesFile = "${HELM_BASE_PATH}/values/${serviceName}.yaml"

  def SERVICE_SECRET_CREDENTIALS = [
    'app-service'    : 'app-service-secrets',
    'auth-service'   : 'auth-service-secrets',
    'gateway-service': 'gateway-service-secrets',
    'worker-service' : 'worker-service-secrets'
  ]

  stage("Deploy ${serviceName}") {

    stage("${serviceName} - Test") {
      echo "Running tests for ${serviceName}"
      sh "echo test"
    }

    stage("${serviceName} - Build Docker") {
      sh """
        docker build -f ${serviceName}/Dockerfile -t ${imageName}:${imageTag} .
        docker tag ${imageName}:${imageTag} ${imageName}:latest
      """
    }

    stage("${serviceName} - Push Docker") {
      withCredentials([usernamePassword(
        credentialsId: 'dockerhub-creds',
        usernameVariable: 'DOCKER_USER',
        passwordVariable: 'DOCKER_PASS'
      )]) {
        sh """
          echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
          docker push ${imageName}:${imageTag}
          docker push ${imageName}:latest
        """
      }
    }

    stage("${serviceName} - Helm Deploy") {
      withCredentials([file(
        credentialsId: 'kubeconfig',
        variable: 'KUBECONFIG_FILE'
      ), file(
        credentialsId: SERVICE_SECRET_CREDENTIALS[serviceName],
        variable: 'SECRETS_FILE'
      )]) {
        sh """
          export KUBECONFIG=\$KUBECONFIG_FILE

          helm upgrade --install ${serviceName} ${chartPath} \
            --namespace ${KUBE_NAMESPACE} \
            --create-namespace \
            -f ${valuesFile} \
            -f ${SECRETS_FILE}
        """
      }
    }
  }
}
