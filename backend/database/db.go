package database

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() (*gorm.DB, error) {
	host := envDefault("POSTGRES_HOST", "db")
	user := envDefault("POSTGRES_USER", "postgres")
	pass := os.Getenv("POSTGRES_PASSWORD")
	name := envDefault("POSTGRES_DB", "sueca")
	port := envDefault("POSTGRES_PORT", "5432")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Lisbon",
		host, user, pass, name, port,
	)
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

func envDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
