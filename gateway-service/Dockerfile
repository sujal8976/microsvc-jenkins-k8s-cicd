FROM golang:1.22-alpine AS builder

ENV CGO_ENABLED=0 \
	GOOS=linux \
	GOARCH=amd64

WORKDIR /app/gateway

# Copy module files for the gateway service (repo-root context)
COPY gateway-service/go.mod gateway-service/go.sum ./
RUN go mod download

# Copy gateway service sources
COPY gateway-service/. ./

# Build a small, stripped binary.
RUN go build -v -trimpath -ldflags="-s -w" -o /gateway ./

FROM alpine:3.22 AS runtime
RUN addgroup -S app && adduser -S -G app app \
	&& apk add --no-cache ca-certificates \
	&& update-ca-certificates || true

COPY --from=builder /gateway /usr/local/bin/gateway

USER app

EXPOSE 8080

ENV GIN_MODE=release

ENTRYPOINT ["/usr/local/bin/gateway"]
