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

type CommitDetailResponse struct {
	Hash    string    `json:"hash"`
	Author  string    `json:"author"`
	Email   string    `json:"email"`
	Date    time.Time `json:"date"`
	Message string    `json:"message"`
	Parents []string  `json:"parents"`
	Stats   CommitStats `json:"stats"`
}

type CommitStats struct {
	Additions int `json:"additions"`
	Deletions int `json:"deletions"`
	Files     int `json:"files"`
}

type TreeEntry struct {
	Type     string       `json:"type"`
	Name     string       `json:"name"`
	Path     string       `json:"path"`
	Children []TreeEntry  `json:"children,omitempty"`
}

type FileResponse struct {
	Path     string `json:"path"`
	Size     int64  `json:"size"`
	Language string `json:"language"`
	Content  string `json:"content"`
	Binary   bool   `json:"binary"`
}

type DiffResponse struct {
	Files []DiffFile `json:"files"`
}

type DiffFile struct {
	Path        string `json:"path"`
	OldPath     string `json:"oldPath,omitempty"`
	Additions   int    `json:"additions"`
	Deletions   int    `json:"deletions"`
	IsBinary    bool   `json:"isBinary"`
	IsRenamed   bool   `json:"isRenamed"`
	Patch       string `json:"patch"`
}

type GrowthPoint struct {
	Date         string `json:"date"`
	Commits      int    `json:"commits"`
	FileCount    int    `json:"fileCount"`
	EstimatedLOC int    `json:"estimatedLoc"`
}

type ActivityPoint struct {
	Date      string `json:"date"`
	Commits   int    `json:"commits"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
}

type EvolutionStatsResponse struct {
	TotalCommits      int             `json:"totalCommits"`
	TotalContributors int             `json:"totalContributors"`
	TotalFiles        int             `json:"totalFiles"`
	TotalLOC          int             `json:"totalLoc"`
	GrowthHistory     []GrowthPoint   `json:"growthHistory"`
	ActivityHistory   []ActivityPoint `json:"activityHistory"`
}

type ContributorStats struct {
	Name            string    `json:"name"`
	Email           string    `json:"email"`
	CommitCount     int       `json:"commitCount"`
	Additions       int       `json:"additions"`
	Deletions       int       `json:"deletions"`
	FirstCommit     time.Time `json:"firstCommit"`
	LastCommit      time.Time `json:"lastCommit"`
	SharePercentage float64   `json:"sharePercentage"`
}

type HotspotFile struct {
	Path         string    `json:"path"`
	CommitCount  int       `json:"commitCount"`
	Additions    int       `json:"additions"`
	Deletions    int       `json:"deletions"`
	LastModified time.Time `json:"lastModified"`
}

type Milestone struct {
	Name       string    `json:"name"`
	CommitHash string    `json:"commitHash"`
	Date       time.Time `json:"date"`
	Type       string    `json:"type"`
	Message    string    `json:"message"`
}

type FileHistoryEntry struct {
	CommitHash string    `json:"commitHash"`
	Author     string    `json:"author"`
	Email      string    `json:"email"`
	Date       time.Time `json:"date"`
	Message    string    `json:"message"`
	Action     string    `json:"action"`
	Additions  int       `json:"additions"`
	Deletions  int       `json:"deletions"`
}