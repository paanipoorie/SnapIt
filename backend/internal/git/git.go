package git

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/filemode"
	"github.com/go-git/go-git/v5/plumbing/format/diff"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/google/uuid"
	"github.com/paanipoorie/SnapIt/backend/internal/models"
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

func (s *GitService) GetCommit(localPath, hash string) (*object.Commit, error) {
	repo, err := git.PlainOpen(localPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	commitHash := plumbing.NewHash(hash)
	commit, err := repo.CommitObject(commitHash)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit: %w", err)
	}

	return commit, nil
}

func (s *GitService) GetCommitTree(localPath, hash string) ([]TreeNode, error) {
	repo, err := git.PlainOpen(localPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	commitHash := plumbing.NewHash(hash)
	commit, err := repo.CommitObject(commitHash)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit: %w", err)
	}

	tree, err := commit.Tree()
	if err != nil {
		return nil, fmt.Errorf("failed to get tree: %w", err)
	}

	return s.buildTree(tree, ""), nil
}

func (s *GitService) buildTree(tree *object.Tree, pathPrefix string) []TreeNode {
	var nodes []TreeNode

	for _, entry := range tree.Entries {
		fullPath := filepath.Join(pathPrefix, entry.Name)
		if pathPrefix != "" {
			fullPath = filepath.ToSlash(fullPath)
		} else {
			fullPath = entry.Name
		}

		if entry.Mode == filemode.Dir {
			subTree, err := tree.Tree(entry.Name)
			if err != nil {
				s.logger.Warn("Failed to get subtree", zap.String("name", entry.Name), zap.Error(err))
				continue
			}
			children := s.buildTree(subTree, fullPath)
			nodes = append(nodes, TreeNode{
				Type:     "directory",
				Name:     entry.Name,
				Path:     fullPath,
				Children: children,
			})
		} else {
			nodes = append(nodes, TreeNode{
				Type: "file",
				Name: entry.Name,
				Path: fullPath,
			})
		}
	}

	sort.Slice(nodes, func(i, j int) bool {
		if nodes[i].Type != nodes[j].Type {
			return nodes[i].Type == "directory"
		}
		return strings.ToLower(nodes[i].Name) < strings.ToLower(nodes[j].Name)
	})

	return nodes
}

func (s *GitService) GetFileContent(localPath, hash, filePath string) (*FileContent, error) {
	repo, err := git.PlainOpen(localPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	commitHash := plumbing.NewHash(hash)
	commit, err := repo.CommitObject(commitHash)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit: %w", err)
	}

	tree, err := commit.Tree()
	if err != nil {
		return nil, fmt.Errorf("failed to get tree: %w", err)
	}

	file, err := tree.File(filePath)
	if err != nil {
		if err == object.ErrFileNotFound {
			return nil, fmt.Errorf("file not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	if !file.Mode.IsFile() {
		return nil, fmt.Errorf("not a file: %s", filePath)
	}

	size := file.Size
	isBinary, err := file.IsBinary()
	if err != nil {
		return nil, fmt.Errorf("failed to check if binary: %w", err)
	}

	content := &FileContent{
		Path:     filePath,
		Size:     size,
		Language: detectLanguage(filePath),
	}

	if isBinary {
		content.Content = "[Binary file - cannot display]"
		content.IsBinary = true
		return content, nil
	}

	contents, err := file.Contents()
	if err != nil {
		return nil, fmt.Errorf("failed to read file contents: %w", err)
	}

	content.Content = contents
	content.IsBinary = false
	return content, nil
}

func (s *GitService) GetCommitDiff(localPath, hash string) (*CommitDiff, error) {
	repo, err := git.PlainOpen(localPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	commitHash := plumbing.NewHash(hash)
	commit, err := repo.CommitObject(commitHash)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit: %w", err)
	}

	var parent *object.Commit
	if commit.NumParents() > 0 {
		parent, err = commit.Parent(0)
		if err != nil {
			return nil, fmt.Errorf("failed to get parent commit: %w", err)
		}
	}

	tree, err := commit.Tree()
	if err != nil {
		return nil, fmt.Errorf("failed to get tree: %w", err)
	}

	var parentTree *object.Tree
	if parent != nil {
		parentTree, err = parent.Tree()
		if err != nil {
			return nil, fmt.Errorf("failed to get parent tree: %w", err)
		}
	}

	changes := object.Changes{}
	if parentTree != nil {
		s.logger.Debug("Diffing parent tree with commit tree", zap.String("hash", hash))
		changes, err = parentTree.DiffContext(context.Background(), tree)
	} else {
		s.logger.Debug("Diffing with empty tree (initial commit)", zap.String("hash", hash))
		changes, err = object.DiffTreeContext(context.Background(), nil, tree)
	}
	if err != nil {
		s.logger.Error("Failed to diff trees", zap.Error(err), zap.String("hash", hash))
		return nil, fmt.Errorf("failed to diff trees: %w", err)
	}

	patch, err := changes.Patch()
	if err != nil {
		s.logger.Error("Failed to create patch", zap.Error(err), zap.String("hash", hash))
		return nil, fmt.Errorf("failed to create patch: %w", err)
	}

	s.logger.Debug("Patch created successfully", zap.Int("filePatches", len(patch.FilePatches())))

	var diffFiles []DiffFile
	for i, filePatch := range patch.FilePatches() {
		s.logger.Debug("Processing file patch", zap.Int("index", i))
		from, to := filePatch.Files()
		fromPath := ""
		toPath := ""

		if from != nil {
			fromPath = from.Path()
		}
		if to != nil {
			toPath = to.Path()
		}

		action := "modified"
		if fromPath == "" {
			action = "added"
		} else if toPath == "" {
			action = "deleted"
		} else if fromPath != toPath {
			action = "renamed"
		}

		var additions, deletions int
		for _, chunk := range filePatch.Chunks() {
			content := chunk.Content()
			lines := strings.Split(content, "\n")
			for _, line := range lines {
				if strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") {
					additions++
				} else if strings.HasPrefix(line, "-") && !strings.HasPrefix(line, "---") {
					deletions++
				}
			}
		}

		// Encode individual file patch using wrapper
		var patchBuf bytes.Buffer
		patchEncoder := diff.NewUnifiedEncoder(&patchBuf, diff.DefaultContextLines)
		if err := patchEncoder.Encode(&singleFilePatchWrapper{fp: filePatch}); err != nil {
			s.logger.Warn("Failed to encode file patch", zap.Error(err), zap.String("path", toPath))
			patchBuf.WriteString("[Failed to encode patch]")
		}
		patchStr := patchBuf.String()

		diffFiles = append(diffFiles, DiffFile{
			FromPath:  fromPath,
			ToPath:    toPath,
			Action:    action,
			Additions: additions,
			Deletions: deletions,
			Patch:     patchStr,
		})
	}

	var totalAdditions, totalDeletions int
	for _, df := range diffFiles {
		totalAdditions += df.Additions
		totalDeletions += df.Deletions
	}

	return &CommitDiff{
		Files:       diffFiles,
		Additions:   totalAdditions,
		Deletions:   totalDeletions,
		FileCount:   len(diffFiles),
	}, nil
}

func detectLanguage(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".go":
		return "go"
	case ".ts", ".tsx":
		return "typescript"
	case ".js", ".jsx":
		return "javascript"
	case ".py":
		return "python"
	case ".rs":
		return "rust"
	case ".java":
		return "java"
	case ".c", ".h":
		return "c"
	case ".cpp", ".cc", ".hpp", ".hxx":
		return "cpp"
	case ".cs":
		return "csharp"
	case ".rb":
		return "ruby"
	case ".php":
		return "php"
	case ".swift":
		return "swift"
	case ".kt", ".kts":
		return "kotlin"
	case ".scala":
		return "scala"
	case ".sh", ".bash", ".zsh":
		return "bash"
	case ".html", ".htm":
		return "html"
	case ".css", ".scss", ".sass":
		return "css"
	case ".json":
		return "json"
	case ".xml":
		return "xml"
	case ".yaml", ".yml":
		return "yaml"
	case ".md", ".markdown":
		return "markdown"
	case ".sql":
		return "sql"
	case ".dockerfile", ".dockerignore":
		return "dockerfile"
	case ".toml":
		return "toml"
	case ".proto":
		return "protobuf"
	case ".vue":
		return "vue"
	case ".svelte":
		return "svelte"
	case ".astro":
		return "astro"
	default:
		return "plaintext"
	}
}

type TreeNode struct {
	Type     string     `json:"type"`
	Name     string     `json:"name"`
	Path     string     `json:"path"`
	Children []TreeNode `json:"children,omitempty"`
}

type FileContent struct {
	Path     string `json:"path"`
	Size     int64  `json:"size"`
	Language string `json:"language"`
	Content  string `json:"content"`
	IsBinary bool   `json:"isBinary"`
}

type DiffFile struct {
	FromPath  string `json:"fromPath"`
	ToPath    string `json:"toPath"`
	Action    string `json:"action"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
	Patch     string `json:"patch"`
}

type CommitDiff struct {
	Files      []DiffFile `json:"files"`
	Additions  int        `json:"additions"`
	Deletions  int        `json:"deletions"`
	FileCount  int        `json:"fileCount"`
}

type singleFilePatchWrapper struct {
	fp diff.FilePatch
}

func (s *singleFilePatchWrapper) FilePatches() []diff.FilePatch {
	return []diff.FilePatch{s.fp}
}

func (s *singleFilePatchWrapper) Message() string {
	return ""
}

func (s *GitService) GetMilestones(localPath string) ([]models.Milestone, error) {
	repo, err := git.PlainOpen(localPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	var milestones []models.Milestone
	milestonesMap := make(map[string]bool)

	tagRefs, err := repo.Tags()
	if err == nil {
		_ = tagRefs.ForEach(func(ref *plumbing.Reference) error {
			tagName := ref.Name().Short()
			commitHash := ref.Hash().String()
			tagDate := time.Now()
			msg := fmt.Sprintf("Release / Tag %s", tagName)

			if tagObj, err := repo.TagObject(ref.Hash()); err == nil {
				commitHash = tagObj.Target.String()
				tagDate = tagObj.Tagger.When
				if tagObj.Message != "" {
					msg = strings.TrimSpace(tagObj.Message)
				}
			} else if commitObj, err := repo.CommitObject(ref.Hash()); err == nil {
				tagDate = commitObj.Author.When
				msg = strings.TrimSpace(commitObj.Message)
			}

			milestones = append(milestones, models.Milestone{
				Name:       tagName,
				CommitHash: commitHash,
				Date:       tagDate,
				Type:       "tag",
				Message:    msg,
			})
			milestonesMap[commitHash] = true
			return nil
		})
	}

	commits, err := s.ExtractCommits(localPath)
	if err == nil && len(commits) > 0 {
		sort.Slice(commits, func(i, j int) bool {
			return commits[i].Author.When.Before(commits[j].Author.When)
		})

		firstCommit := commits[0]
		if !milestonesMap[firstCommit.Hash.String()] {
			milestones = append(milestones, models.Milestone{
				Name:       "Initial Commit",
				CommitHash: firstCommit.Hash.String(),
				Date:       firstCommit.Author.When,
				Type:       "initial",
				Message:    strings.TrimSpace(firstCommit.Message),
			})
			milestonesMap[firstCommit.Hash.String()] = true
		}

		for _, c := range commits {
			if c.NumParents() > 1 && !milestonesMap[c.Hash.String()] {
				milestones = append(milestones, models.Milestone{
					Name:       "Merge Commit",
					CommitHash: c.Hash.String(),
					Date:       c.Author.When,
					Type:       "merge",
					Message:    strings.TrimSpace(c.Message),
				})
			}
		}
	}

	sort.Slice(milestones, func(i, j int) bool {
		return milestones[i].Date.Before(milestones[j].Date)
	})

	return milestones, nil
}

func (s *GitService) GetEvolutionData(localPath string) (*models.EvolutionStatsResponse, []models.ContributorStats, []models.HotspotFile, error) {
	commits, err := s.ExtractCommits(localPath)
	if err != nil {
		return nil, nil, nil, err
	}

	if len(commits) == 0 {
		return &models.EvolutionStatsResponse{}, []models.ContributorStats{}, []models.HotspotFile{}, nil
	}

	sort.Slice(commits, func(i, j int) bool {
		return commits[i].Author.When.Before(commits[j].Author.When)
	})

	type contribData struct {
		name        string
		email       string
		commits     int
		additions   int
		deletions   int
		firstCommit time.Time
		lastCommit  time.Time
	}

	type hotspotData struct {
		path         string
		commits      int
		additions    int
		deletions    int
		lastModified time.Time
	}

	contributors := make(map[string]*contribData)
	hotspots := make(map[string]*hotspotData)

	type dailyStats struct {
		commits   int
		additions int
		deletions int
	}

	dailyMap := make(map[string]*dailyStats)
	var dateKeys []string

	totalAdditions := 0
	totalDeletions := 0

	for _, c := range commits {
		authorName := c.Author.Name
		authorEmail := c.Author.Email
		if authorName == "" {
			authorName = "Unknown"
		}
		key := strings.ToLower(authorEmail)
		if key == "" {
			key = strings.ToLower(authorName)
		}

		cTime := c.Author.When
		dateStr := cTime.Format("2006-01-02")

		if _, exists := dailyMap[dateStr]; !exists {
			dailyMap[dateStr] = &dailyStats{}
			dateKeys = append(dateKeys, dateStr)
		}
		dailyMap[dateStr].commits++

		if contrib, exists := contributors[key]; exists {
			contrib.commits++
			if cTime.Before(contrib.firstCommit) {
				contrib.firstCommit = cTime
			}
			if cTime.After(contrib.lastCommit) {
				contrib.lastCommit = cTime
			}
		} else {
			contributors[key] = &contribData{
				name:        authorName,
				email:       authorEmail,
				commits:     1,
				firstCommit: cTime,
				lastCommit:  cTime,
			}
		}

		diff, err := s.GetCommitDiff(localPath, c.Hash.String())
		if err == nil && diff != nil {
			totalAdditions += diff.Additions
			totalDeletions += diff.Deletions
			dailyMap[dateStr].additions += diff.Additions
			dailyMap[dateStr].deletions += diff.Deletions

			if contrib, exists := contributors[key]; exists {
				contrib.additions += diff.Additions
				contrib.deletions += diff.Deletions
			}

			for _, f := range diff.Files {
				filePath := f.ToPath
				if filePath == "" {
					filePath = f.FromPath
				}
				if filePath == "" {
					continue
				}

				if hs, exists := hotspots[filePath]; exists {
					hs.commits++
					hs.additions += f.Additions
					hs.deletions += f.Deletions
					if cTime.After(hs.lastModified) {
						hs.lastModified = cTime
					}
				} else {
					hotspots[filePath] = &hotspotData{
						path:         filePath,
						commits:      1,
						additions:    f.Additions,
						deletions:    f.Deletions,
						lastModified: cTime,
					}
				}
			}
		}
	}

	sort.Strings(dateKeys)

	growthHistory := make([]models.GrowthPoint, 0, len(dateKeys))
	activityHistory := make([]models.ActivityPoint, 0, len(dateKeys))

	cumCommits := 0
	cumLOC := 0

	for _, dStr := range dateKeys {
		ds := dailyMap[dStr]
		cumCommits += ds.commits
		cumLOC += (ds.additions - ds.deletions)
		if cumLOC < 0 {
			cumLOC = 0
		}

		growthHistory = append(growthHistory, models.GrowthPoint{
			Date:         dStr,
			Commits:      cumCommits,
			FileCount:    len(hotspots),
			EstimatedLOC: cumLOC,
		})

		activityHistory = append(activityHistory, models.ActivityPoint{
			Date:      dStr,
			Commits:   ds.commits,
			Additions: ds.additions,
			Deletions: ds.deletions,
		})
	}

	var contribList []models.ContributorStats
	for _, c := range contributors {
		share := 0.0
		if len(commits) > 0 {
			share = (float64(c.commits) / float64(len(commits))) * 100.0
		}
		contribList = append(contribList, models.ContributorStats{
			Name:            c.name,
			Email:           c.email,
			CommitCount:     c.commits,
			Additions:       c.additions,
			Deletions:       c.deletions,
			FirstCommit:     c.firstCommit,
			LastCommit:      c.lastCommit,
			SharePercentage: share,
		})
	}
	sort.Slice(contribList, func(i, j int) bool {
		return contribList[i].CommitCount > contribList[j].CommitCount
	})

	var hotspotList []models.HotspotFile
	for _, h := range hotspots {
		hotspotList = append(hotspotList, models.HotspotFile{
			Path:         h.path,
			CommitCount:  h.commits,
			Additions:    h.additions,
			Deletions:    h.deletions,
			LastModified: h.lastModified,
		})
	}
	sort.Slice(hotspotList, func(i, j int) bool {
		return hotspotList[i].CommitCount > hotspotList[j].CommitCount
	})
	if len(hotspotList) > 50 {
		hotspotList = hotspotList[:50]
	}

	totalLOC := totalAdditions - totalDeletions
	if totalLOC < 0 {
		totalLOC = 0
	}

	evolutionStats := &models.EvolutionStatsResponse{
		TotalCommits:      len(commits),
		TotalContributors: len(contribList),
		TotalFiles:        len(hotspots),
		TotalLOC:          totalLOC,
		GrowthHistory:     growthHistory,
		ActivityHistory:   activityHistory,
	}

	return evolutionStats, contribList, hotspotList, nil
}

func (s *GitService) GetFileHistory(localPath, filePath string) ([]models.FileHistoryEntry, error) {
	commits, err := s.ExtractCommits(localPath)
	if err != nil {
		return nil, err
	}

	var history []models.FileHistoryEntry

	for _, c := range commits {
		diff, err := s.GetCommitDiff(localPath, c.Hash.String())
		if err != nil || diff == nil {
			continue
		}

		for _, f := range diff.Files {
			if f.ToPath == filePath || f.FromPath == filePath {
				history = append(history, models.FileHistoryEntry{
					CommitHash: c.Hash.String(),
					Author:     c.Author.Name,
					Email:      c.Author.Email,
					Date:       c.Author.When,
					Message:    strings.TrimSpace(c.Message),
					Action:     f.Action,
					Additions:  f.Additions,
					Deletions:  f.Deletions,
				})
				break
			}
		}
	}

	sort.Slice(history, func(i, j int) bool {
		return history[i].Date.After(history[j].Date)
	})

	return history, nil
}