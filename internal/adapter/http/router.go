package http

import (
	"doki/internal/adapter/http/middleware"
	v1 "doki/internal/adapter/http/v1"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type RouterConfig struct {
	PaymentHandler *v1.PaymentHandler
	JWTSecret      string
}

// SetupRouter initializes the Gin engine with complete RESTful payment, reservation, and admin billing routes.
func SetupRouter(cfg RouterConfig) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "doki-billing-engine"})
	})

	// Swagger documentation route
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1Group := r.Group("/v1")
	{
		// 1. Inbound Bank Webhook (Public Host-to-Host endpoint)
		webhooks := v1Group.Group("/webhooks")
		{
			webhooks.POST("/bank/credit", cfg.PaymentHandler.BankCallback)
		}

		// 2. Protected Routes (Requiring Bearer JWT Auth)
		jwtSecret := cfg.JWTSecret
		if jwtSecret == "" {
			jwtSecret = "doki-super-secret-jwt-key"
		}
		authMiddleware := middleware.AuthMiddleware(jwtSecret)

		// /v1/payments
		payments := v1Group.Group("/payments")
		payments.Use(authMiddleware)
		{
			payments.POST("/initiate", cfg.PaymentHandler.InitiatePayment)
			payments.GET("/:payment_id", cfg.PaymentHandler.GetPaymentByID)
			payments.POST("/:payment_id/void", cfg.PaymentHandler.VoidPayment)
			payments.POST("/:payment_id/refund", cfg.PaymentHandler.RefundPayment)
		}

		// /v1/reservations
		reservations := v1Group.Group("/reservations")
		reservations.Use(authMiddleware)
		{
			reservations.POST("/hold", cfg.PaymentHandler.HoldReservation)
			// Folio and payment polling routes
			reservations.GET("/:reservation_id/payments", cfg.PaymentHandler.GetReservationFolio)
			reservations.GET("/:reservation_id/payments/status", cfg.PaymentHandler.GetReservationPaymentStatus)
			reservations.GET("/:reservation_id/payment-status", cfg.PaymentHandler.GetReservationPaymentStatus)
		}

		// /v1/admin/properties/:property_id/payments
		admin := v1Group.Group("/admin")
		admin.Use(authMiddleware)
		{
			admin.GET("/properties/:property_id/payments", cfg.PaymentHandler.ListPropertyPayments)
			admin.POST("/properties/:property_id/payments/manual", cfg.PaymentHandler.RecordManualPayment)
		}
	}

	return r
}
