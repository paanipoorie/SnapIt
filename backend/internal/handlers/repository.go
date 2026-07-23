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

	// Optional pagination support
	limitStr := c.Query("limit")
	if limitStr != "" {
		limit := c.QueryInt("limit", 50)
		page := c.QueryInt("page", 1)
		if page < 1 {
			page = 1
		}
		if limit < 1 {
			limit = 50
		}

		total := len(timeline)
		totalPages := (total + limit - 1) / limit

		start := (page - 1) * limit
		end := start + limit

		if start > total {
			start = total
		}
		if end > total {
			end = total
		}

		paginatedCommits := timeline[start:end]
		return c.JSON(models.PaginatedTimelineResponse{
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
			Commits:    paginatedCommits,
		})
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

func (h *RepositoryHandler) GetCommitDetail(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	hash := c.Params("hash")
	if repoID == "" || hash == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID and commit hash are required"})
	}

	detail, err := h.service.GetCommitDetail(repoID, hash)
	if err != nil {
		h.logger.Error("Failed to get commit detail", zap.Error(err), zap.String("repositoryId", repoID), zap.String("hash", hash))
		switch err {
		case services.ErrRepositoryNotFound:
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		case services.ErrCommitNotFound:
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Commit not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Internal server error"})
		}
	}

	return c.JSON(detail)
}

func (h *RepositoryHandler) GetCommitTree(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	hash := c.Params("hash")
	if repoID == "" || hash == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID and commit hash are required"})
	}

	tree, err := h.service.GetCommitTree(repoID, hash)
	if err != nil {
		h.logger.Error("Failed to get commit tree", zap.Error(err), zap.String("repositoryId", repoID), zap.String("hash", hash))
		switch err {
		case services.ErrRepositoryNotFound:
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		case services.ErrCommitNotFound:
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Commit not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Internal server error"})
		}
	}

	return c.JSON(tree)
}

func (h *RepositoryHandler) GetFileContent(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	hash := c.Params("hash")
	filePath := c.Query("path")
	if repoID == "" || hash == "" || filePath == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID, commit hash, and file path are required"})
	}

	content, err := h.service.GetFileContent(repoID, hash, filePath)
	if err != nil {
		h.logger.Error("Failed to get file content", zap.Error(err), zap.String("repositoryId", repoID), zap.String("hash", hash), zap.String("path", filePath))
		switch err {
		case services.ErrRepositoryNotFound:
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		case services.ErrFileNotFound:
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "File not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Internal server error"})
		}
	}

	return c.JSON(content)
}

func (h *RepositoryHandler) GetCommitDiff(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	hash := c.Params("hash")
	if repoID == "" || hash == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID and commit hash are required"})
	}

	diff, err := h.service.GetCommitDiff(repoID, hash)
	if err != nil {
		h.logger.Error("Failed to get commit diff", zap.Error(err), zap.String("repositoryId", repoID), zap.String("hash", hash))
		switch err {
		case services.ErrRepositoryNotFound:
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		case services.ErrCommitNotFound:
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Commit not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Internal server error"})
		}
	}

	return c.JSON(diff)
}

func (h *RepositoryHandler) GetEvolutionStats(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	if repoID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID is required"})
	}

	stats, err := h.service.GetEvolutionStats(repoID)
	if err != nil {
		if err == services.ErrRepositoryNotFound {
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Failed to get evolution stats"})
	}

	return c.JSON(stats)
}

func (h *RepositoryHandler) GetContributors(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	if repoID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID is required"})
	}

	contribs, err := h.service.GetContributors(repoID)
	if err != nil {
		if err == services.ErrRepositoryNotFound {
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Failed to get contributors"})
	}

	return c.JSON(contribs)
}

func (h *RepositoryHandler) GetHotspots(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	if repoID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID is required"})
	}

	hotspots, err := h.service.GetHotspots(repoID)
	if err != nil {
		if err == services.ErrRepositoryNotFound {
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Failed to get hotspots"})
	}

	return c.JSON(hotspots)
}

func (h *RepositoryHandler) GetMilestones(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	if repoID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID is required"})
	}

	milestones, err := h.service.GetMilestones(repoID)
	if err != nil {
		if err == services.ErrRepositoryNotFound {
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Failed to get milestones"})
	}

	return c.JSON(milestones)
}

func (h *RepositoryHandler) GetFileHistory(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	filePath := c.Query("path")
	if repoID == "" || filePath == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID and file path are required"})
	}

	history, err := h.service.GetFileHistory(repoID, filePath)
	if err != nil {
		if err == services.ErrRepositoryNotFound {
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Failed to get file history"})
	}

	return c.JSON(history)
}

func (h *RepositoryHandler) GetCodeIntelligence(c *fiber.Ctx) error {
	repoID := c.Params("repositoryId")
	if repoID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{Error: "Repository ID is required"})
	}

	commitHash := c.Query("commit")
	intel, err := h.service.GetCodeIntelligence(repoID, commitHash)
	if err != nil {
		if err == services.ErrRepositoryNotFound {
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Repository not found"})
		}
		if err == services.ErrCommitNotFound {
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{Error: "Commit not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{Error: "Failed to process code intelligence"})
	}

	return c.JSON(intel)
}