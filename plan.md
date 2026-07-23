# SnapIt - Complete Project Context

## Vision

SnapIt is an interactive time machine for software evolution.

Every Git commit is a snapshot in time.

Instead of reading commits as a list, SnapIt allows developers to travel through the complete history of a repository and understand how the software evolved.

The goal is NOT to replace GitHub.

The goal is NOT to become another Git analytics dashboard.

The goal is to tell the story of software evolution visually.

A developer should be able to answer questions like:

- How did this project evolve?
- When was this feature introduced?
- Which files changed the most?
- How did the architecture evolve?
- Which commits were turning points?
- Which contributors shaped the repository?
- Why is the project structured like this today?

---

# UI Vision

The UI should remain clean and minimal.

Dark theme.

A vertical timeline represents the repository history.

A small submarine moves as the user scrolls through commits.

The submarine simply represents travelling deeper into history.

The right side updates with information related to the currently selected commit.

Professional. Minimal. Smooth. Not gamified.

---

# Engineering Philosophy

Always keep the project simple.

Do NOT over-engineer.

Never build infrastructure for future features.

Never create abstractions "just in case."

Prefer idiomatic Go, modern React, modular architecture, and simple APIs.

If a feature belongs to a future phase, DO NOT IMPLEMENT IT.

---

# Development Status & Roadmap

=========================================================
CURRENT PROJECT STATUS
=========================================================

✅ Phase 1 — Repository Ingestion (Completed)
- Repository cloning
- Commit extraction
- Timeline API
- Backend foundation

✅ Phase 2 — Timeline Experience (Completed)
- Interactive timeline
- Submarine navigation
- Commit inspector
- Timeline interactions

✅ Phase 3 — Repository Explorer (Completed)
- Commit explorer
- File tree
- File viewer
- Diff viewer
- Snapshot browsing

✅ Phase 4 — Repository Evolution (Completed)
- Repository growth
- Contributor activity
- File history
- Hotspots
- Evolution statistics

✅ Phase 5 — Code Intelligence (Completed)
- Tree-sitter parsing
- Language detection
- Dependency graph
- Module graph
- Architecture visualization
- Complexity metrics
- Risk indicators
- Churn × Complexity hotspots

✅ Phase 6 — Performance & Production Readiness (Completed)
- Memory caching layer for expensive computations
- Timeline API pagination & query optimization
- HTTP response timing headers & request logging
- Frontend skeleton loaders & Error Boundaries
- Dynamic code splitting & lazy loading for heavy bundles

=========================================================
NEXT PHASE
=========================================================

Phase 7 — Polish & Developer Experience

Goal:
Make SnapIt fast, scalable and production-ready.
Focus on optimization instead of adding new major features.

Backend:
- Optimize Git operations
- Cache expensive computations where appropriate
- Reduce duplicate parsing
- Pagination for large datasets
- Streaming for large repositories
- Better error handling
- Structured logging
- Request timing
- Better memory management
- Graceful failure handling

Frontend:
- Virtualized timeline
- Lazy loading
- Progressive rendering
- Suspense where appropriate
- Loading skeletons
- Better loading states
- Error boundaries
- Route optimization
- Performance profiling
- Remove unnecessary re-renders

General:
- Eliminate duplicated logic
- Improve code organization
- Improve responsiveness
- Optimize bundle size
- Review expensive operations

=========================================================
PHASE 7
=========================================================

Phase 7 — Polish & Developer Experience

Goal:
Prepare SnapIt for public release.

Features:
Search (commits, files, authors, messages)
Filtering (author, date, file path, branch, tags)
Navigation (keyboard shortcuts, command palette)
Sharing (deep links, share URLs, export JSON/Markdown/PDF)
User Experience (responsive design, animations, accessibility, settings, onboarding)
Final QA (clean dead code, cross-browser testing)

=========================================================
PHASE 8 (POST-MVP)
=========================================================

AI is intentionally NOT part of the MVP.
Do NOT implement any AI features.

Do NOT install:
- OpenAI SDK, Anthropic SDK, Gemini SDK, Ollama, LangChain, Vercel AI SDK, Any AI package

Do NOT create:
- AI endpoints, repository chat, commit/diff explanations, repository summaries, natural language search, AI architecture explanations.

These are future post-MVP expansion ideas only:
- Repository chat
- Explain commit / diff / story
- Architecture & milestone explanations
- Semantic search

Nothing from this phase should be implemented now.

=========================================================
IMPORTANT RULES
=========================================================

- Continue ONLY with Phase 6.
- Do not begin Phase 7 until Phase 6 is fully complete.
- Do not touch any AI-related functionality.
- Keep the project simple.
- Do not over-engineer.
- Build only what is required for the current phase.