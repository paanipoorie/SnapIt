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
	ErrCommitNotFound    = errors.New("commit not found")
	ErrFileNotFound      = errors.New("file not found")
)

type RepositoryService struct {
	gitService   *git.GitService
	storagePath  string
	repositories map[string]*models.Repository
	cache        *MemoryCache
	mu           sync.RWMutex
	logger       *zap.Logger
}

func NewRepositoryService(gitService *git.GitService, storagePath string, logger *zap.Logger) *RepositoryService {
	return &RepositoryService{
		gitService:   gitService,
		storagePath:  storagePath,
		repositories: make(map[string]*models.Repository),
		cache:        NewMemoryCache(),
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
	cacheKey := "timeline:" + repoID
	if cached, ok := s.cache.Get(cacheKey); ok {
		return cached.(models.TimelineResponse), nil
	}

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

	s.cache.Set(cacheKey, timeline, 15*time.Minute)
	return timeline, nil
}

func (s *RepositoryService) GetRepository(repoID string) (*models.Repository, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	repo, exists := s.repositories[repoID]
	return repo, exists
}

func (s *RepositoryService) GetCommitDetail(repoID, hash string) (*models.CommitDetailResponse, error) {
	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	commit, err := s.gitService.GetCommit(repo.LocalPath, hash)
	if err != nil {
		s.logger.Error("Failed to get commit", zap.Error(err), zap.String("hash", hash))
		return nil, ErrCommitNotFound
	}

	stats := models.CommitStats{}
	if commit.NumParents() > 0 {
		diff, err := s.gitService.GetCommitDiff(repo.LocalPath, hash)
		if err != nil {
			s.logger.Error("Failed to get commit diff", zap.Error(err), zap.String("hash", hash))
		} else {
			stats.Additions = diff.Additions
			stats.Deletions = diff.Deletions
			stats.Files = diff.FileCount
		}
	}

	parents := make([]string, commit.NumParents())
	for i := 0; i < commit.NumParents(); i++ {
		parent, err := commit.Parent(i)
		if err == nil {
			parents[i] = parent.Hash.String()
		}
	}

	return &models.CommitDetailResponse{
		Hash:    commit.Hash.String(),
		Author:  commit.Author.Name,
		Email:   commit.Author.Email,
		Date:    commit.Author.When,
		Message: commit.Message,
		Parents: parents,
		Stats:   stats,
	}, nil
}

func (s *RepositoryService) GetCommitTree(repoID, hash string) ([]models.TreeEntry, error) {
	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	nodes, err := s.gitService.GetCommitTree(repo.LocalPath, hash)
	if err != nil {
		s.logger.Error("Failed to get commit tree", zap.Error(err), zap.String("hash", hash))
		return nil, ErrCommitNotFound
	}

	var tree []models.TreeEntry
	for _, node := range nodes {
		tree = append(tree, treeNodeToTreeEntry(node))
	}

	return tree, nil
}

func treeNodeToTreeEntry(node git.TreeNode) models.TreeEntry {
	entry := models.TreeEntry{
		Type: node.Type,
		Name: node.Name,
		Path: node.Path,
	}
	if len(node.Children) > 0 {
		entry.Children = make([]models.TreeEntry, len(node.Children))
		for i, child := range node.Children {
			entry.Children[i] = treeNodeToTreeEntry(child)
		}
	}
	return entry
}

func (s *RepositoryService) GetFileContent(repoID, hash, filePath string) (*models.FileResponse, error) {
	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	content, err := s.gitService.GetFileContent(repo.LocalPath, hash, filePath)
	if err != nil {
		s.logger.Error("Failed to get file content", zap.Error(err), zap.String("path", filePath))
		return nil, ErrFileNotFound
	}

	return &models.FileResponse{
		Path:     content.Path,
		Size:     content.Size,
		Language: content.Language,
		Content:  content.Content,
		Binary:   content.IsBinary,
	}, nil
}

func (s *RepositoryService) GetCommitDiff(repoID, hash string) (*models.DiffResponse, error) {
	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	diff, err := s.gitService.GetCommitDiff(repo.LocalPath, hash)
	if err != nil {
		s.logger.Error("Failed to get commit diff", zap.Error(err), zap.String("hash", hash))
		return nil, ErrCommitNotFound
	}

	var diffFiles []models.DiffFile
	for _, df := range diff.Files {
		diffFiles = append(diffFiles, models.DiffFile{
			Path:      df.ToPath,
			OldPath:   df.FromPath,
			Additions: df.Additions,
			Deletions: df.Deletions,
			IsBinary:  false,
			IsRenamed: df.Action == "renamed",
			Patch:     df.Patch,
		})
	}

	return &models.DiffResponse{
		Files: diffFiles,
	}, nil
}

func (s *RepositoryService) GetEvolutionStats(repoID string) (*models.EvolutionStatsResponse, error) {
	cacheKey := "evolution:" + repoID
	if cached, ok := s.cache.Get(cacheKey); ok {
		return cached.(*models.EvolutionStatsResponse), nil
	}

	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	stats, _, _, err := s.gitService.GetEvolutionData(repo.LocalPath)
	if err != nil {
		s.logger.Error("Failed to get evolution stats", zap.Error(err), zap.String("repoID", repoID))
		return nil, err
	}

	s.cache.Set(cacheKey, stats, 15*time.Minute)
	return stats, nil
}

func (s *RepositoryService) GetContributors(repoID string) ([]models.ContributorStats, error) {
	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	_, contribs, _, err := s.gitService.GetEvolutionData(repo.LocalPath)
	if err != nil {
		s.logger.Error("Failed to get contributors", zap.Error(err), zap.String("repoID", repoID))
		return nil, err
	}

	return contribs, nil
}

func (s *RepositoryService) GetHotspots(repoID string) ([]models.HotspotFile, error) {
	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	_, _, hotspots, err := s.gitService.GetEvolutionData(repo.LocalPath)
	if err != nil {
		s.logger.Error("Failed to get hotspots", zap.Error(err), zap.String("repoID", repoID))
		return nil, err
	}

	return hotspots, nil
}

func (s *RepositoryService) GetMilestones(repoID string) ([]models.Milestone, error) {
	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	milestones, err := s.gitService.GetMilestones(repo.LocalPath)
	if err != nil {
		s.logger.Error("Failed to get milestones", zap.Error(err), zap.String("repoID", repoID))
		return nil, err
	}

	return milestones, nil
}

func (s *RepositoryService) GetFileHistory(repoID, filePath string) ([]models.FileHistoryEntry, error) {
	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	history, err := s.gitService.GetFileHistory(repo.LocalPath, filePath)
	if err != nil {
		s.logger.Error("Failed to get file history", zap.Error(err), zap.String("repoID", repoID), zap.String("path", filePath))
		return nil, err
	}

	return history, nil
}

func (s *RepositoryService) GetCodeIntelligence(repoID, commitHash string) (*models.CodeIntelligenceResponse, error) {
	cacheKey := "intel:" + repoID + ":" + commitHash
	if cached, ok := s.cache.Get(cacheKey); ok {
		return cached.(*models.CodeIntelligenceResponse), nil
	}

	s.mu.RLock()
	repo, exists := s.repositories[repoID]
	s.mu.RUnlock()

	if !exists {
		return nil, ErrRepositoryNotFound
	}

	intel, err := s.gitService.GetCodeIntelligence(repo.LocalPath, commitHash)
	if err != nil {
		s.logger.Error("Failed to get code intelligence", zap.Error(err), zap.String("repoID", repoID), zap.String("commit", commitHash))
		return nil, err
	}

	s.cache.Set(cacheKey, intel, 30*time.Minute)
	return intel, nil
}