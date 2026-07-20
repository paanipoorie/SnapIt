package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	DBPath         string
	GitStoragePath string
	LogLevel       string
	GinMode        string
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		Port:           getEnv("PORT", "8080"),
		DBPath:         getEnv("DB_PATH", "./data/snapit.db"),
		GitStoragePath: getEnv("GIT_STORAGE_PATH", "./data/repos"),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		GinMode:        getEnv("GIN_MODE", "release"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}