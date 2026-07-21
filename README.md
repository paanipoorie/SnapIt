# SnapIt

Interactive time machine for software evolution. Explore the complete history of any Git repository.

## Current Status: Phase 4 — Repository Evolution Completed ✓

### Implemented Capabilities:
- **Phase 1 — Ingestion**: Fiber server, GitHub repo cloning with `go-git`, in-memory timeline indexing.
- **Phase 2 — Timeline Experience**: Interactive vertical timeline, animated submarine navigation, commit details inspector.
- **Phase 3 — Repository Explorer**: Commit tree browsing, syntax-highlighted file viewer, unified diff view.
- **Phase 4 — Repository Evolution**:
  - Growth Engine (commits & estimated LOC cumulative history).
  - Activity Histogram (daily commit volume tracking).
  - File Hotspots (most churned files & addition/deletion stats).
  - Contributor Leaderboard (author commit shares & line stats).
  - Milestones & Tag Markers (glowing badges on vertical timeline & milestone list).
  - Revision File History Explorer (interactive modal for file commit history).

## Tech Stack

### Backend
- Go 1.26 + Fiber
- go-git
- Zap Logger

### Frontend (Planned)
- Next.js 16 (Turbopack) + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- Zustand & TanStack Query

## Project Structure
```
SnapIt/
├── backend/          # Go API server
│   ├── internal/
│   │   ├── config/   # Configuration
│   │   ├── git/      # Git operations (clone, log)
│   │   ├── handlers/ # HTTP handlers
│   │   ├── middleware/ # HTTP middleware
│   │   ├── models/   # Data models
│   │   ├── routes/   # Route definitions
│   │   └── services/ # Business logic
│   └── main.go
└── frontend/         # Next.js app (not yet implemented)
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
go mod tidy
go run main.go
```

Server starts at `http://localhost:8080`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/v1/repositories | Load GitHub repository |
| GET | /api/v1/repositories/:id | Get repository info |
| GET | /api/v1/repositories/:id/timeline | Get commit timeline |
| GET | /api/v1/repositories/:id/commits/:hash | Get commit details & stats |
| GET | /api/v1/repositories/:id/commits/:hash/tree | Get snapshot file tree |
| GET | /api/v1/repositories/:id/commits/:hash/file | Get snapshot file content |
| GET | /api/v1/repositories/:id/commits/:hash/diff | Get commit unified diff |
| GET | /api/v1/repositories/:id/evolution | Get repository evolution metrics |
| GET | /api/v1/repositories/:id/contributors | Get contributor leaderboard |
| GET | /api/v1/repositories/:id/hotspots | Get top churned hotspot files |
| GET | /api/v1/repositories/:id/milestones | Get tags, releases, and milestones |
| GET | /api/v1/repositories/:id/file-history | Get revision history for a file |

### Example Usage
```bash
# Load a repository
curl -X POST http://localhost:8080/api/v1/repositories \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/paanipoorie/SnapIt"}'

# Response: {"repositoryId":"...","totalCommits":123}

# Get timeline
curl http://localhost:8080/api/v1/repositories/{repositoryId}/timeline

# Response: [{"hash":"...","author":"...","email":"...","message":"...","date":"..."}]
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8080 |
| GIT_STORAGE_PATH | Local git repositories storage | ./data/repos |
| LOG_LEVEL | Log level (debug, info, warn, error) | info |

## License
MIT