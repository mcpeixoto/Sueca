package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"sueca-backend/database"
	"sueca-backend/handlers"
	"sueca-backend/models"
)

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
			tg.GET("/:id", th.Get)
			tg.PUT("/:id", th.Update)
			tg.DELETE("/:id", th.Delete)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Sueca backend listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("run: %v", err)
	}
}
