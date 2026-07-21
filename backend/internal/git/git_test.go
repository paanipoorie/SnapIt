package git

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	gogit "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"go.uber.org/zap"
)

func createTestRepo(t *testing.T) (string, []string) {
	dir, err := os.MkdirTemp("", "snapit-test-repo-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	repo, err := gogit.PlainInit(dir, false)
	if err != nil {
		t.Fatalf("failed to init repo: %v", err)
	}

	w, err := repo.Worktree()
	if err != nil {
		t.Fatalf("failed to get worktree: %v", err)
	}

	var commitHashes []string

	// Commit 1: Initial commit with README.md
	readmePath := filepath.Join(dir, "README.md")
	if err := os.WriteFile(readmePath, []byte("# Test Repo\nInitial content\n"), 0644); err != nil {
		t.Fatalf("failed to write file: %v", err)
	}
	if _, err := w.Add("README.md"); err != nil {
		t.Fatalf("failed to add file: %v", err)
	}
	c1, err := w.Commit("Initial commit", &gogit.CommitOptions{
		Author: &object.Signature{
			Name:  "Test Author",
			Email: "test@example.com",
			When:  time.Now(),
		},
	})
	if err != nil {
		t.Fatalf("failed to commit: %v", err)
	}
	commitHashes = append(commitHashes, c1.String())

	// Commit 2: Update README.md and add main.go
	if err := os.WriteFile(readmePath, []byte("# Test Repo\nInitial content\nUpdated line\n"), 0644); err != nil {
		t.Fatalf("failed to write file: %v", err)
	}
	mainPath := filepath.Join(dir, "main.go")
	if err := os.WriteFile(mainPath, []byte("package main\n\nfunc main() {}\n"), 0644); err != nil {
		t.Fatalf("failed to write file: %v", err)
	}
	if _, err := w.Add("README.md"); err != nil {
		t.Fatalf("failed to add file: %v", err)
	}
	if _, err := w.Add("main.go"); err != nil {
		t.Fatalf("failed to add file: %v", err)
	}
	c2, err := w.Commit("Second commit: update README and add main.go", &gogit.CommitOptions{
		Author: &object.Signature{
			Name:  "Test Author",
			Email: "test@example.com",
			When:  time.Now(),
		},
	})
	if err != nil {
		t.Fatalf("failed to commit: %v", err)
	}
	commitHashes = append(commitHashes, c2.String())

	return dir, commitHashes
}

func TestGitService(t *testing.T) {
	repoDir, hashes := createTestRepo(t)
	defer os.RemoveAll(repoDir)

	logger, _ := zap.NewDevelopment()
	service := NewGitService(filepath.Dir(repoDir), logger)

	// Test ExtractCommits
	commits, err := service.ExtractCommits(repoDir)
	if err != nil {
		t.Fatalf("ExtractCommits failed: %v", err)
	}
	if len(commits) != 2 {
		t.Errorf("expected 2 commits, got %d", len(commits))
	}

	// Test GetCommit for initial commit (no parent)
	c1, err := service.GetCommit(repoDir, hashes[0])
	if err != nil {
		t.Fatalf("GetCommit c1 failed: %v", err)
	}
	if c1.Message != "Initial commit" {
		t.Errorf("expected 'Initial commit', got '%s'", c1.Message)
	}
	if c1.NumParents() != 0 {
		t.Errorf("expected 0 parents for initial commit, got %d", c1.NumParents())
	}

	// Test GetCommit for second commit (has parent)
	c2, err := service.GetCommit(repoDir, hashes[1])
	if err != nil {
		t.Fatalf("GetCommit c2 failed: %v", err)
	}
	if c2.NumParents() != 1 {
		t.Errorf("expected 1 parent for second commit, got %d", c2.NumParents())
	}

	// Test GetCommitTree
	tree, err := service.GetCommitTree(repoDir, hashes[1])
	if err != nil {
		t.Fatalf("GetCommitTree failed: %v", err)
	}
	if len(tree) != 2 {
		t.Errorf("expected 2 tree entries, got %d", len(tree))
	}

	// Test GetFileContent
	fileContent, err := service.GetFileContent(repoDir, hashes[1], "README.md")
	if err != nil {
		t.Fatalf("GetFileContent failed: %v", err)
	}
	if fileContent.Language != "markdown" {
		t.Errorf("expected language 'markdown', got '%s'", fileContent.Language)
	}

	// Test GetCommitDiff for initial commit (no parent)
	diff1, err := service.GetCommitDiff(repoDir, hashes[0])
	if err != nil {
		t.Fatalf("GetCommitDiff initial commit failed: %v", err)
	}
	if diff1.FileCount != 1 {
		t.Errorf("expected 1 file in initial commit diff, got %d", diff1.FileCount)
	}

	// Test GetCommitDiff for second commit (has parent)
	diff2, err := service.GetCommitDiff(repoDir, hashes[1])
	if err != nil {
		t.Fatalf("GetCommitDiff second commit failed: %v", err)
	}
	if diff2.FileCount != 2 {
		t.Errorf("expected 2 files in second commit diff, got %d", diff2.FileCount)
	}
}
