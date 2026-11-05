package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"sueca-backend/database"
	"sueca-backend/handlers"
	"sueca-backend/models"
)

const defaultRetentionDays = 365

func startCleanupLoop(db *gorm.DB) {
	days := defaultRetentionDays
	if raw := os.Getenv("TOURNAMENT_RETENTION_DAYS"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			days = n
		}
	}
	if days <= 0 {
		log.Printf("[cleanup] disabled (TOURNAMENT_RETENTION_DAYS=%d)", days)
		return
	}
	log.Printf("[cleanup] retention enabled: %d days", days)
	go func() {
		runCleanup(db, days)
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			runCleanup(db, days)
		}
	}()
}

func runCleanup(db *gorm.DB, days int) {
	cutoff := time.Now().Add(-time.Duration(days) * 24 * time.Hour)
	res := db.Where("updated_at < ?", cutoff).Delete(&models.Tournament{})
	if res.Error != nil {
		log.Printf("[cleanup] error: %v", res.Error)
		return
	}
	if res.RowsAffected > 0 {
		log.Printf("[cleanup] removed %d tournaments older than %d days", res.RowsAffected, days)
	}
}

func main() {
	_ = godotenv.Load()

	db, err := database.Connect()
	if err != nil {
		log.Fatalf("database connect: %v", err)
	}
	if err := db.AutoMigrate(&models.Tournament{}, &models.Team{}, &models.Match{}); err != nil {
		log.Fatalf("automigrate: %v", err)
	}

	r := gin.Default()

	origins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if origins == "" {
		origins = "https://sueca.peixotolabs.com"
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(origins, ","),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	th := handlers.NewTournamentHandler(db)
	api := r.Group("/api")
	{
		tg := api.Group("/tournaments")
		{
			tg.GET("", th.List)
			tg.POST("", th.Create)
			tg.GET("/by-code/:code", th.GetByCode)
			tg.GET("/by-admin/:code", th.GetByAdminCode)
			tg.GET("/:id", th.Get)
			tg.PUT("/:id", th.Update)
			tg.DELETE("/:id", th.Delete)
		}
	}

	startCleanupLoop(db)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Sueca backend listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("run: %v", err)
	}
}
