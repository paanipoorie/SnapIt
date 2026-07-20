package models

import (
	"time"

	"github.com/google/uuid"
)

type Repository struct {
	ID           uuid.UUID `json:"repositoryId" gorm:"type:uuid;primaryKey"`
	URL          string    `json:"url" gorm:"not null"`
	LocalPath    string    `json:"-" gorm:"not null"`
	TotalCommits int       `json:"totalCommits" gorm:"default:0"`
	CreatedAt    time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

type Commit struct {
	Hash    string    `json:"hash" gorm:"type:char(40);primaryKey"`
	RepoID  uuid.UUID `json:"repositoryId" gorm:"type:uuid;index;not null"`
	Author  string    `json:"author" gorm:"not null"`
	Email   string    `json:"email" gorm:"not null"`
	Message string    `json:"message" gorm:"type:text;not null"`
	Date    time.Time `json:"date" gorm:"not null;index"`
}

type LoadRepositoryRequest struct {
	URL string `json:"url" validate:"required,url"`
}

type LoadRepositoryResponse struct {
	RepositoryID string `json:"repositoryId"`
	TotalCommits int    `json:"totalCommits"`
}

type CommitResponse struct {
	Hash    string    `json:"hash"`
	Author  string    `json:"author"`
	Email   string    `json:"email"`
	Message string    `json:"message"`
	Date    time.Time `json:"date"`
}

type TimelineResponse []CommitResponse

type ErrorResponse struct {
	Error string `json:"error"`
}

type HealthResponse struct {
	Status string `json:"status"`
}