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
	api.Get("/repositories/:repositoryId/commits/:hash", repoHandler.GetCommitDetail)
	api.Get("/repositories/:repositoryId/commits/:hash/tree", repoHandler.GetCommitTree)
	api.Get("/repositories/:repositoryId/commits/:hash/file", repoHandler.GetFileContent)
	api.Get("/repositories/:repositoryId/commits/:hash/diff", repoHandler.GetCommitDiff)
	api.Get("/repositories/:repositoryId/evolution", repoHandler.GetEvolutionStats)
	api.Get("/repositories/:repositoryId/contributors", repoHandler.GetContributors)
	api.Get("/repositories/:repositoryId/hotspots", repoHandler.GetHotspots)
	api.Get("/repositories/:repositoryId/milestones", repoHandler.GetMilestones)
	api.Get("/repositories/:repositoryId/file-history", repoHandler.GetFileHistory)
}