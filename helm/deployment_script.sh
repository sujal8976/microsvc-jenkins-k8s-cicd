#! /bin/bash

kubectl apply -f namespace.yaml

helm install mongodb bitnami/mongodb -f values/mongo.yaml -n image-app --create-namespace

helm install redis bitnami/redis -f values/redis.yaml -n image-app

helm install auth-service ./auth-service -f values/auth-service.yaml -n image-app

helm install app-service ./app-service -f values/app-service.yaml -n image-app

helm install worker-service ./worker-service -f values/worker-service.yaml -n image-app

helm install gateway-service ./gateway-service -f values/gateway-service.yaml -n image-app

