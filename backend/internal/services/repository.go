package services

import (
	"errors"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	gogit "github.com/go-git/go-git/v5"
	"github.com/google/uuid"
	"github.com/paanipoorie/SnapIt/backend/internal/git"
	"github.com/paanipoorie/SnapIt/backend/internal/models"
	"go.uber.org/zap"
)

var (
	ErrInvalidURL        = errors.New("invalid repository URL")
	ErrCloneFailed       = errors.New("failed to clone repository")
	ErrExtractFailed     = errors.New("failed to extract commits")
	ErrRepositoryNotFound = errors.New("repository not found")
)

type RepositoryService struct {
	gitService   *git.GitService
	storagePath  string
	repositories map[string]*models.Repository
	mu           sync.RWMutex
	logger       *zap.Logger
}

func NewRepositoryService(gitService *git.GitService, storagePath string, logger *zap.Logger) *RepositoryService {
	return &RepositoryService{
		gitService:   gitService,
		storagePath:  storagePath,
		repositories: make(map[string]*models.Repository),
		logger:       logger,
	}
}

func (s *RepositoryService) LoadRepository(url string) (*models.LoadRepositoryResponse, error) {
	url = strings.TrimSpace(url)
	if !git.IsValidGitHubURL(url) {
		s.logger.Warn("Invalid GitHub URL", zap.String("url", url))
		return nil, ErrInvalidURL
	}

	repoID := uuid.New().String()
	localPath := filepath.Join(s.storagePath, repoID)

	if _, err := gogit.PlainOpen(localPath); err != nil {
		localPath, err = s.gitService.CloneRepository(url)
		if err != nil {
			s.logger.Error("Failed to clone repository", zap.Error(err), zap.String("url", url))
			return nil, ErrCloneFailed
		}
	}

	commits, err := s.gitService.ExtractCommits(localPath)
	if err != nil {
		s.logger.Error("Failed to extract commits", zap.Error(err), zap.String("path", localPath))
		return nil, ErrExtractFailed
	}

	repo := &models.Repository{
		ID:           uuid.New(),
		URL:          url,
		LocalPath:    localPath,
		TotalCommits: len(commits),
		CreatedAt:    time.Now(),
	}

	s.mu.Lock()
	s.repositories[repoID] = repo
	s.mu.Unlock()

	s.logger.Info("Repository loaded",
		zap.String("repositoryId", repoID),
		zap.Int("totalCommits", len(commits)))

	return &models.LoadRepositoryResponse{
		RepositoryID: repoID,
		TotalCommits: len(commits),
	}, nil
}

func (s *RepositoryService) GetTimeline(repoID string) (models.TimelineResponse, error) {
	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	commits, err := s.gitService.ExtractCommits(repo.LocalPath)
	if err != nil {
		s.logger.Error("Failed to extract commits for timeline", zap.Error(err))
		return nil, ErrExtractFailed
	}

	timeline := make(models.TimelineResponse, len(commits))
	for i, c := range commits {
		timeline[i] = models.CommitResponse{
			Hash:    c.Hash.String(),
			Author:  c.Author.Name,
			Email:   c.Author.Email,
			Message: strings.TrimSpace(c.Message),
			Date:    c.Author.When,
		}
	}

	sort.Slice(timeline, func(i, j int) bool {
		return timeline[i].Date.Before(timeline[j].Date)
	})

	return timeline, nil
}

func (s *RepositoryService) GetRepository(repoID string) (*models.Repository, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	repo, exists := s.repositories[repoID]
	return repo, exists
}