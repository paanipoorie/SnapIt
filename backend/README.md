# SnapIt Backend

## Requirements
- Go 1.26+

## Setup
```bash
cd backend
cp .env.example .env
go mod tidy
go run main.go
```

## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8080 |
| GIT_STORAGE_PATH | Local git repositories storage | ./data/repos |
| LOG_LEVEL | Log level (debug, info, warn, error) | info |

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/v1/repositories | Load a GitHub repository |
| GET | /api/v1/repositories/:repositoryId | Get repository info |
| GET | /api/v1/repositories/:repositoryId/timeline | Get commit timeline |

## Example Usage
```bash
# Load a repository
curl -X POST http://localhost:8080/api/v1/repositories \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/paanipoorie/SnapIt"}'

# Get timeline (sorted oldest → newest)
curl http://localhost:8080/api/v1/repositories/{repositoryId}/timeline
```

## Current Implementation (Phase 1 - Repository Ingestion)
✅ Fiber server  
✅ Configuration loading  
✅ Health endpoint  
✅ Clone repository  
✅ Read commit history using go-git  
✅ Timeline API  

All data stored in memory. No database persistence yet.

## Future Phases
- Phase 2: Interactive timeline, commit navigation, submarine movement, commit inspector
- Phase 3: Repository explorer, file tree, commit details, changed files, diff summary
- Phase 4: Evolution visualization, repository growth, contributor activity, file history
- Phase 5: Code intelligence, dependency graph, architecture evolution, hotspots, complexity
- Phase 6: AI explanations, evolution summaries, architecture insights
- Phase 7: Performance, polish, search, filters, export, mobile responsiveness