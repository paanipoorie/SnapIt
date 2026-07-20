package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/paanipoorie/SnapIt/backend/internal/config"
	"github.com/paanipoorie/SnapIt/backend/internal/git"
	"github.com/paanipoorie/SnapIt/backend/internal/middleware"
	"github.com/paanipoorie/SnapIt/backend/internal/routes"
	"github.com/paanipoorie/SnapIt/backend/internal/services"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	cfg := config.Load()

	logger := initLogger(cfg.LogLevel)
	defer logger.Sync()

	gitService := git.NewGitService(cfg.GitStoragePath, logger)
	repoService := services.NewRepositoryService(gitService, cfg.GitStoragePath, logger)

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "SnapIt API",
	})

	app.Use(recover.New())

	routes.SetupRoutes(app, repoService, logger)

	go func() {
		addr := fmt.Sprintf(":%s", cfg.Port)
		logger.Info("Starting server", zap.String("address", addr))
		if err := app.Listen(addr); err != nil {
			logger.Fatal("Server failed to start", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")
	if err := app.Shutdown(); err != nil {
		logger.Error("Server shutdown error", zap.Error(err))
	}

	logger.Info("Server stopped")
}

func initLogger(level string) *zap.Logger {
	var zapLevel zapcore.Level
	switch level {
	case "debug":
		zapLevel = zapcore.DebugLevel
	case "info":
		zapLevel = zapcore.InfoLevel
	case "warn":
		zapLevel = zapcore.WarnLevel
	case "error":
		zapLevel = zapcore.ErrorLevel
	default:
		zapLevel = zapcore.InfoLevel
	}

	config := zap.NewProductionConfig()
	config.Level = zap.NewAtomicLevelAt(zapLevel)
	config.Encoding = "console"
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	logger, err := config.Build()
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err))
	}

	return logger
}