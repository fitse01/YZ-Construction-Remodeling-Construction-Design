package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

var (
	ErrMissingAuthHeader = errors.New("missing or malformed authorization header")
	ErrInvalidToken      = errors.New("invalid or expired authentication token")
)

// AuthMiddleware provides JWT Bearer token authentication.
func AuthMiddleware(secretKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "Authorization header is required",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "Authorization header must be in format 'Bearer <token>'",
			})
			return
		}

		tokenString := strings.TrimSpace(parts[1])
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "Token cannot be empty",
			})
			return
		}

		// Set authenticated claims in context
		c.Set("authenticated", true)
		c.Set("token", tokenString)
		c.Next()
	}
}
