package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/paanipoorie/SnapIt/backend/internal/models"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Health(c *fiber.Ctx) error {
	return c.JSON(models.HealthResponse{Status: "ok"})
}