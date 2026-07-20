package git

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type GitService struct {
	storagePath string
	logger      *zap.Logger
}

func NewGitService(storagePath string, logger *zap.Logger) *GitService {
	return &GitService{
		storagePath: storagePath,
		logger:      logger,
	}
}

func (s *GitService) CloneRepository(repoURL string) (string, error) {
	repoID := uuid.New().String()
	localPath := filepath.Join(s.storagePath, repoID)

	if _, err := os.Stat(localPath); err == nil {
		s.logger.Info("Repository already exists", zap.String("path", localPath))
		return localPath, nil
	}

	s.logger.Info("Cloning repository", zap.String("url", repoURL), zap.String("path", localPath))

	start := time.Now()
	_, err := git.PlainClone(localPath, false, &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
	})
	duration := time.Since(start)

	if err != nil {
		s.logger.Error("Failed to clone repository", zap.Error(err), zap.String("url", repoURL))
		return "", fmt.Errorf("failed to clone repository: %w", err)
	}

	s.logger.Info("Repository cloned successfully",
		zap.String("path", localPath),
		zap.Duration("duration", duration))

	return localPath, nil
}

func (s *GitService) ExtractCommits(localPath string) ([]object.Commit, error) {
	repo, err := git.PlainOpen(localPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	ref, err := repo.Head()
	if err != nil {
		return nil, fmt.Errorf("failed to get HEAD: %w", err)
	}

	iter, err := repo.Log(&git.LogOptions{From: ref.Hash()})
	if err != nil {
		return nil, fmt.Errorf("failed to get commit log: %w", err)
	}

	var commits []object.Commit
	start := time.Now()

	err = iter.ForEach(func(c *object.Commit) error {
		commits = append(commits, *c)
		return nil
	})

	duration := time.Since(start)

	if err != nil {
		return nil, fmt.Errorf("failed to iterate commits: %w", err)
	}

	s.logger.Info("Commit extraction completed",
		zap.Int("count", len(commits)),
		zap.Duration("duration", duration))

	return commits, nil
}

func IsValidGitHubURL(url string) bool {
	url = strings.TrimSpace(url)
	if url == "" {
		return false
	}

	prefixes := []string{
		"https://github.com/",
		"http://github.com/",
		"git@github.com:",
	}

	for _, prefix := range prefixes {
		if strings.HasPrefix(url, prefix) {
			parts := strings.Split(strings.TrimPrefix(url, prefix), "/")
			return len(parts) >= 2 && parts[0] != "" && strings.TrimSuffix(parts[1], ".git") != ""
		}
	}

	return false
}