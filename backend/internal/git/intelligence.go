package git

import (
	"bufio"
	"fmt"
	"math"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	gogit "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/paanipoorie/SnapIt/backend/internal/models"
	"go.uber.org/zap"
)

var (
	goImportRegex     = regexp.MustCompile(`(?m)^\s*import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")`)
	jsImportRegex     = regexp.MustCompile(`(?m)(?:import\s+.*?from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))`)
	pyImportRegex     = regexp.MustCompile(`(?m)^\s*(?:from\s+([a-zA-Z0-9_\.]+)\s+import|import\s+([a-zA-Z0-9_\.]+))`)
	
	controlFlowRegex  = regexp.MustCompile(`\b(if|else\s+if|for|while|switch|case|catch|except|elif)\b|&&|\|\||\?`)
	functionDefRegex  = regexp.MustCompile(`\b(func|function|def|class)\b|=>|\b(?:const|let|var)\s+[a-zA-Z0-9_]+\s*=\s*(?:async\s*)?\(`)
)

func (s *GitService) GetCodeIntelligence(localPath string, commitHash string) (*models.CodeIntelligenceResponse, error) {
	repo, err := gogit.PlainOpen(localPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	var commit *object.Commit
	if commitHash == "" {
		ref, err := repo.Head()
		if err != nil {
			return nil, fmt.Errorf("failed to get HEAD: %w", err)
		}
		commit, err = repo.CommitObject(ref.Hash())
		if err != nil {
			return nil, fmt.Errorf("failed to get HEAD commit: %w", err)
		}
	} else {
		hash := plumbing.NewHash(commitHash)
		commit, err = repo.CommitObject(hash)
		if err != nil {
			return nil, fmt.Errorf("commit not found: %w", err)
		}
	}

	tree, err := commit.Tree()
	if err != nil {
		return nil, fmt.Errorf("failed to get tree: %w", err)
	}

	// Step 1: Calculate churn map for all files across history up to this commit
	churnMap := make(map[string]int)
	cIter, err := repo.Log(&gogit.LogOptions{From: commit.Hash})
	if err == nil {
		_ = cIter.ForEach(func(c *object.Commit) error {
			if len(c.ParentHashes) == 0 {
				stats, err := c.Stats()
				if err == nil {
					for _, stat := range stats {
						churnMap[stat.Name]++
					}
				}
				return nil
			}
			parent, err := c.Parent(0)
			if err != nil {
				return nil
			}
			patch, err := parent.Patch(c)
			if err != nil {
				return nil
			}
			for _, filePatch := range patch.FilePatches() {
				from, to := filePatch.Files()
				if to != nil {
					churnMap[to.Path()]++
				} else if from != nil {
					churnMap[from.Path()]++
				}
			}
			return nil
		})
	}

	// Step 2: Iterate tree files and parse intelligence metrics
	var nodes []models.IntelligenceNode
	var edges []models.IntelligenceEdge
	pathSet := make(map[string]bool)
	moduleMap := make(map[string]*models.ModuleSummary)

	totalLOC := 0
	totalComplexity := 0.0
	totalMaintainability := 0.0

	var rawFileImports []struct {
		sourcePath string
		imports    []string
	}

	err = tree.Files().ForEach(func(f *object.File) error {
		if shouldIgnoreFile(f.Name) {
			return nil
		}

		lang := detectCodeLanguage(f.Name)
		if lang == "Unknown" || f.Size > 500*1024 { // Ignore unknown or huge files > 500KB
			return nil
		}

		content, err := f.Contents()
		if err != nil {
			return nil
		}

		loc, complexity, functionsCount, importsCount, rawImports := analyzeCode(content, lang)
		churn := churnMap[f.Name]
		if churn == 0 {
			churn = 1
		}

		riskScore := float64(complexity * churn)
		maintainability := math.Max(0.0, math.Min(100.0, 100.0-(float64(complexity)*2.5+float64(loc)*0.08)))

		pkg := filepath.Dir(f.Name)
		if pkg == "." {
			pkg = "root"
		}

		node := models.IntelligenceNode{
			ID:                   f.Name,
			Label:                filepath.Base(f.Name),
			Path:                 f.Name,
			Package:              pkg,
			Type:                 "file",
			Language:             lang,
			LinesOfCode:          loc,
			CyclomaticComplexity: complexity,
			MaintainabilityIndex: math.Round(maintainability*10) / 10,
			FunctionsCount:       functionsCount,
			ImportsCount:         importsCount,
			ChurnCount:           churn,
			RiskScore:            math.Round(riskScore*10) / 10,
		}

		nodes = append(nodes, node)
		pathSet[f.Name] = true
		totalLOC += loc
		totalComplexity += float64(complexity)
		totalMaintainability += maintainability

		if len(rawImports) > 0 {
			rawFileImports = append(rawFileImports, struct {
				sourcePath string
				imports    []string
			}{sourcePath: f.Name, imports: rawImports})
		}

		// Aggregate module summary
		mod, exists := moduleMap[pkg]
		if !exists {
			mod = &models.ModuleSummary{
				Name: pkg,
				Path: pkg,
			}
			moduleMap[pkg] = mod
		}
		mod.FileCount++
		mod.TotalLOC += loc
		mod.AvgComplexity += float64(complexity)
		mod.AvgMaintainability += maintainability

		return nil
	})

	if err != nil {
		s.logger.Error("Failed iterating files for intelligence", zap.Error(err))
	}

	// Step 3: Resolve edges based on import statements
	edgeSet := make(map[string]bool)
	for _, fi := range rawFileImports {
		srcDir := filepath.Dir(fi.sourcePath)
		for _, imp := range fi.imports {
			targetPath := resolveImportPath(srcDir, imp, pathSet)
			if targetPath != "" && targetPath != fi.sourcePath {
				edgeKey := fi.sourcePath + "->" + targetPath
				if !edgeSet[edgeKey] {
					edgeSet[edgeKey] = true
					edges = append(edges, models.IntelligenceEdge{
						Source: fi.sourcePath,
						Target: targetPath,
						Type:   "import",
					})
				}
			}
		}
	}

	// Step 4: Finalize Module Summaries
	var modules []models.ModuleSummary
	for _, mod := range moduleMap {
		if mod.FileCount > 0 {
			mod.AvgComplexity = math.Round((mod.AvgComplexity/float64(mod.FileCount))*10) / 10
			mod.AvgMaintainability = math.Round((mod.AvgMaintainability/float64(mod.FileCount))*10) / 10
		}
		modules = append(modules, *mod)
	}
	sort.Slice(modules, func(i, j int) bool {
		return modules[i].TotalLOC > modules[j].TotalLOC
	})

	// Step 5: Identify Top Risk Hotspots
	var hotspots []models.RiskHotspot
	for _, n := range nodes {
		level := "LOW"
		if n.RiskScore >= 50 || (n.CyclomaticComplexity > 15 && n.ChurnCount > 5) {
			level = "HIGH"
		} else if n.RiskScore >= 20 || n.CyclomaticComplexity > 8 {
			level = "MEDIUM"
		}

		hotspots = append(hotspots, models.RiskHotspot{
			Path:                 n.Path,
			Language:             n.Language,
			LinesOfCode:          n.LinesOfCode,
			CyclomaticComplexity: n.CyclomaticComplexity,
			ChurnCount:           n.ChurnCount,
			MaintainabilityIndex: n.MaintainabilityIndex,
			RiskScore:            n.RiskScore,
			RiskLevel:            level,
		})
	}

	sort.Slice(hotspots, func(i, j int) bool {
		return hotspots[i].RiskScore > hotspots[j].RiskScore
	})

	if len(hotspots) > 20 {
		hotspots = hotspots[:20]
	}

	avgComp := 0.0
	avgMaint := 0.0
	if len(nodes) > 0 {
		avgComp = math.Round((totalComplexity/float64(len(nodes)))*10) / 10
		avgMaint = math.Round((totalMaintainability/float64(len(nodes)))*10) / 10
	}

	return &models.CodeIntelligenceResponse{
		CommitHash:         commit.Hash.String(),
		TotalFiles:         len(nodes),
		TotalLOC:           totalLOC,
		AvgComplexity:      avgComp,
		AvgMaintainability: avgMaint,
		Nodes:              nodes,
		Edges:              edges,
		Hotspots:           hotspots,
		Modules:            modules,
	}, nil
}

func shouldIgnoreFile(path string) bool {
	lower := strings.ToLower(path)
	ignoredDirs := []string{"node_modules/", "vendor/", ".git/", "dist/", "build/", ".next/"}
	for _, dir := range ignoredDirs {
		if strings.Contains(lower, dir) {
			return true
		}
	}
	ignoredExts := []string{".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".pdf", ".zip", ".tar", ".gz", ".mp4", ".woff", ".woff2", ".ttf", ".eot", ".lock", ".json"}
	for _, ext := range ignoredExts {
		if strings.HasSuffix(lower, ext) {
			return true
		}
	}
	return false
}

func detectCodeLanguage(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".go":
		return "Go"
	case ".ts", ".tsx":
		return "TypeScript"
	case ".js", ".jsx", ".mjs", ".cjs":
		return "JavaScript"
	case ".py":
		return "Python"
	case ".java":
		return "Java"
	case ".cpp", ".cc", ".cxx", ".hpp", ".h":
		return "C++"
	case ".c":
		return "C"
	case ".rs":
		return "Rust"
	case ".rb":
		return "Ruby"
	case ".php":
		return "PHP"
	case ".cs":
		return "C#"
	case ".css", ".scss":
		return "CSS"
	case ".html":
		return "HTML"
	default:
		return "Unknown"
	}
}

func analyzeCode(content string, lang string) (loc int, complexity int, functionsCount int, importsCount int, rawImports []string) {
	scanner := bufio.NewScanner(strings.NewReader(content))
	complexity = 1

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "//") || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "/*") || strings.HasPrefix(line, "*") {
			continue
		}
		loc++

		matches := controlFlowRegex.FindAllString(line, -1)
		complexity += len(matches)

		if functionDefRegex.MatchString(line) {
			functionsCount++
		}
	}

	switch lang {
	case "Go":
		matches := goImportRegex.FindAllStringSubmatch(content, -1)
		for _, m := range matches {
			if m[2] != "" {
				rawImports = append(rawImports, m[2])
			} else if m[1] != "" {
				lines := strings.Split(m[1], "\n")
				for _, l := range lines {
					cleaned := strings.Trim(strings.TrimSpace(l), `"`)
					if cleaned != "" {
						rawImports = append(rawImports, cleaned)
					}
				}
			}
		}
	case "TypeScript", "JavaScript":
		matches := jsImportRegex.FindAllStringSubmatch(content, -1)
		for _, m := range matches {
			imp := m[1]
			if imp == "" {
				imp = m[2]
			}
			if imp != "" {
				rawImports = append(rawImports, imp)
			}
		}
	case "Python":
		matches := pyImportRegex.FindAllStringSubmatch(content, -1)
		for _, m := range matches {
			imp := m[1]
			if imp == "" {
				imp = m[2]
			}
			if imp != "" {
				rawImports = append(rawImports, imp)
			}
		}
	}

	importsCount = len(rawImports)
	return
}

func resolveImportPath(srcDir string, importStr string, pathSet map[string]bool) string {
	// 1. Check relative imports (e.g. ./utils, ../components/button)
	if strings.HasPrefix(importStr, ".") {
		relPath := filepath.Clean(filepath.Join(srcDir, importStr))
		extensions := []string{"", ".ts", ".tsx", ".js", ".jsx", ".go", "/index.ts", "/index.tsx", "/index.js"}
		for _, ext := range extensions {
			candidate := relPath + ext
			if pathSet[candidate] {
				return candidate
			}
		}
	}

	// 2. Check exact matches in repository pathSet
	for p := range pathSet {
		if strings.HasSuffix(p, importStr) || strings.Contains(p, importStr) {
			return p
		}
	}

	return ""
}
