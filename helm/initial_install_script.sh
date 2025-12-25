#! /bin/bash

kubectl apply -f namespace.yaml

helm install mongodb bitnami/mongodb -f values/mongo.yaml -f secrets/mongo-secrets.yaml -n image-app
 
helm install redis bitnami/redis -f values/redis.yaml -f secrets/redis-secrets.yaml -n image-app 

helm install auth-service ./auth-service -f values/auth-service.yaml -f secrets/auth-service-secrets.yaml -n image-app

helm install app-service ./app-service -f values/app-service.yaml -f secrets/app-service-secrets.yaml -n image-app

helm install worker-service ./worker-service -f values/worker-service.yaml -f secrets/worker-service-secrets.yaml -n image-app

helm install gateway-service ./gateway-service -f values/gateway-service.yaml -f secrets/gateway-service-secrets.yaml -n image-app

