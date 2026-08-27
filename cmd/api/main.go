package main

import (
	"database/sql"
	"log"
	"os"

	_ "doki/docs"
	internalHttp "doki/internal/adapter/http"
	v1 "doki/internal/adapter/http/v1"
	"doki/internal/adapter/repository/memory"
	"doki/internal/adapter/repository/postgres"
	"doki/internal/domain/billing"
	"doki/internal/domain/reservation"

	_ "github.com/lib/pq"
)

// @title                      DOKI Direct Banking & Billing Engine API
// @version                    1.0
// @description                Direct Host-to-Host Bank Payment Initiation, Webhook Ingestion, and Atomic Ledger Reconciliation Engine for DOKI.
// @contact.name               DOKI Fintech Engineering Team
// @contact.email              fintech@doki.travel
// @host                       localhost:8080
// @BasePath                   /
// @securityDefinitions.apikey BearerAuth
// @in                         header
// @name                       Authorization
// @description                Type "Bearer" followed by a space and JWT token.
func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "doki-super-secret-jwt-key"
	}

	var (
		resRepo   reservation.Repository
		orderRepo billing.PaymentOrderRepository
		bankTxRepo billing.BankTransactionRepository
		txManager billing.TransactionManager
	)

	if dbURL != "" {
		db, err := sql.Open("postgres", dbURL)
		if err != nil {
			log.Fatalf("Failed to open postgres connection: %v", err)
		}
		defer db.Close()

		if err := db.Ping(); err != nil {
			log.Fatalf("Failed to ping database: %v", err)
		}
		log.Println("Connected to PostgreSQL database successfully.")

		pgResRepo := postgres.NewReservationRepo(db)
		pgBillingRepo := postgres.NewBillingRepo(db)

		resRepo = pgResRepo
		orderRepo = pgBillingRepo
		bankTxRepo = pgBillingRepo
		txManager = pgBillingRepo
	} else {
		log.Println("DATABASE_URL not set. Initializing in-memory thread-safe repository store...")
		memResRepo := memory.NewReservationRepo()
		memBillingRepo := memory.NewBillingRepo()

		resRepo = memResRepo
		orderRepo = memBillingRepo
		bankTxRepo = memBillingRepo
		txManager = memBillingRepo
	}

	billingService := billing.NewService(orderRepo, bankTxRepo, resRepo, txManager)
	paymentHandler := v1.NewPaymentHandler(billingService, resRepo)

	router := internalHttp.SetupRouter(internalHttp.RouterConfig{
		PaymentHandler: paymentHandler,
		JWTSecret:      jwtSecret,
	})

	log.Printf("🚀 DOKI Billing Engine running on port :%s\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Server exited with error: %v", err)
	}
}
