package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/paanipoorie/SnapIt/backend/internal/handlers"
	"github.com/paanipoorie/SnapIt/backend/internal/middleware"
	"github.com/paanipoorie/SnapIt/backend/internal/services"
	"go.uber.org/zap"
)

func SetupRoutes(app *fiber.App, repoService *services.RepositoryService, logger *zap.Logger) {
	app.Use(middleware.Logger(logger))
	app.Use(middleware.CORS())
	app.Use(middleware.ValidateContentType)

	healthHandler := handlers.NewHealthHandler()
	app.Get("/health", healthHandler.Health)

	api := app.Group("/api/v1")

	repoHandler := handlers.NewRepositoryHandler(repoService, logger)
	api.Post("/repositories", repoHandler.LoadRepository)
	api.Get("/repositories/:repositoryId", repoHandler.GetRepository)
	api.Get("/repositories/:repositoryId/timeline", repoHandler.GetTimeline)
}