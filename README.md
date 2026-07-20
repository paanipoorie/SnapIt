# SnapIt

Interactive time machine for software evolution. Explore the complete history of any Git repository.

## Current Phase: Phase 1 — Repository Ingestion ✓

**Completed:**
- Fiber HTTP server
- Configuration loading (`.env`)
- Health endpoint (`GET /health`)
- Repository loading (`POST /api/v1/repositories`)
- Git clone using go-git
- Commit history extraction
- Timeline API (`GET /api/v1/repositories/:id/timeline`) — oldest → newest
- In-memory storage (no database persistence)

**Not Implemented (Future Phases):**
- Frontend (Next.js + submarine UI)
- Interactive timeline / commit navigation
- File tree / diff viewer
- Evolution visualizations
- AI summaries

## Tech Stack

### Backend
- Go 1.26 + Fiber
- go-git
- Zap Logger

### Frontend (Planned)
- Next.js + TypeScript
- Tailwind CSS
- Framer Motion

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