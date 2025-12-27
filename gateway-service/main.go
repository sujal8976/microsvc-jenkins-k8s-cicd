package main

import (
	"log"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// CORS middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Content-Type", "Authorization"}
	router.Use(cors.New(config))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "Gateway is running"})
	})

	// Auth Service routes
	authServiceURL := os.Getenv("AUTH_SERVICE_URL")
	if authServiceURL == "" {
		authServiceURL = "http://localhost:3001"
	}

	router.POST("/api/auth/register", proxyRequest(authServiceURL))
	router.POST("/api/auth/login", proxyRequest(authServiceURL))
	router.POST("/api/auth/refresh", proxyRequest(authServiceURL))

	// App Service routes
	appServiceURL := os.Getenv("APP_SERVICE_URL")
	if appServiceURL == "" {
		appServiceURL = "http://localhost:3002"
	}

	router.POST("/api/images/upload", proxyRequest(appServiceURL))
	router.GET("/api/images", proxyRequest(appServiceURL))
	router.GET("/api/images/:id", proxyRequest(appServiceURL))
	router.GET("/api/images/:id/status", proxyRequest(appServiceURL))

	// Serve frontend from app service
	router.NoRoute(func(c *gin.Context) {
		target, _ := url.Parse(appServiceURL)
		proxy := httputil.NewSingleHostReverseProxy(target)
		proxy.ServeHTTP(c.Writer, c.Request)
	})

	log.Printf("Gateway listening on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func proxyRequest(serviceURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		target, err := url.Parse(serviceURL)
		if err != nil {
			c.JSON(500, gin.H{"error": "Invalid service URL"})
			return
		}

		proxy := httputil.NewSingleHostReverseProxy(target)
		// Preserve the full path (don't strip /api) since the app-service
		// routes are registered as /api/images/*, not /images/*
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

// test comment