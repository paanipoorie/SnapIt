package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/paanipoorie/SnapIt/backend/internal/models"
	"github.com/paanipoorie/SnapIt/backend/internal/services"
	"go.uber.org/zap"
)

type RepositoryHandler struct {
	service *services.RepositoryService
	logger  *zap.Logger
}

func NewRepositoryHandler(service *services.RepositoryService, logger *zap.Logger) *RepositoryHandler {
	return &RepositoryHandler{
		service: service,
		logger:  logger,
	}
}

func (h *RepositoryHandler) LoadRepository(c *fiber.Ctx) error {
	var req models.LoadRepositoryRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Warn("Invalid request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Invalid request body"})
	}

	if req.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository URL is required"})
	}

	resp, err := h.service.LoadRepository(req.URL)
	if err != nil {
		h.logger.Error("Failed to load repository", zap.Error(err), zap.String("url", req.URL))
		switch err {
		case services.ErrInvalidURL:
			return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Invalid GitHub repository URL"})
		case services.ErrCloneFailed:
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Failed to clone repository"})
		case services.ErrExtractFailed:
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Failed to extract commits"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Internal server error"})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(resp)
}

func (h *RepositoryHandler) GetTimeline(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	if repoID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID is required"})
	}

	timeline, err := h.service.GetTimeline(repoID)
	if err != nil {
		h.logger.Error("Failed to get timeline", zap.Error(err), zap.String("repositoryId", repoID))
		switch err {
		case services.ErrRepositoryNotFound:
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		case services.ErrExtractFailed:
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Failed to extract commits"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Internal server error"})
		}
	}

	return c.JSON(timeline)
}

func (h *RepositoryHandler) GetRepository(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	if repoID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID is required"})
	}

	repo, exists := h.service.GetRepository(repoID)
	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
	}

	return c.JSON(fiber.Map{
		"repositoryId":  repo.ID,
		"url":           repo.URL,
		"totalCommits":  repo.TotalCommits,
		"createdAt":     repo.CreatedAt,
	})
}