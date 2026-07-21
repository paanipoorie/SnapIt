# SnapIt - Complete Project Context

## Vision

SnapIt is an interactive time machine for software evolution.

Every Git commit is a snapshot in time.

Instead of reading commits as a list, SnapIt allows developers to travel through the complete history of a repository and understand how the software evolved.

The goal is NOT to replace GitHub.

The goal is NOT to become another Git analytics dashboard.

The goal is to tell the story of software evolution.

A developer should be able to answer questions like:

- How did this project evolve?
- When was this feature introduced?
- Which files changed the most?
- How did the architecture evolve?
- Which commits were turning points?
- Which contributors shaped the repository?
- Why is the project structured like this today?

Eventually SnapIt should feel like exploring a software documentary instead of reading Git history.

---

# UI Vision

The UI should remain clean and minimal.

Dark theme.

A vertical timeline represents the repository history.

A small submarine moves as the user scrolls through commits.

The submarine simply represents travelling deeper into history.

The right side updates with information related to the currently selected commit.

Professional.

Minimal.

Smooth.

Not gamified.

The submarine is a navigation metaphor only.

---

# Engineering Philosophy

Always keep the project simple.

Do NOT over-engineer.

Never build infrastructure for future features.

Never create abstractions "just in case."

Avoid:

- unnecessary interfaces
- repository pattern
- generic services
- dependency injection
- CQRS
- event buses
- background workers
- caching before needed
- premature optimization

Prefer:

- idiomatic Go
- modern React
- modular architecture
- readable code
- composition
- small packages
- simple APIs

If a feature belongs to a future phase,

DO NOT IMPLEMENT IT.

---

# Tech Stack

Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React Flow
- Zustand
- TanStack Query

Backend

- Go
- Fiber
- go-git
- SQLite (only when needed)
- UUID
- godotenv

---

# Development Rules

Each phase must be independently complete.

Never implement future phases early.

After every phase:

- build
- test
- clean imports
- remove dead code
- update README
- verify functionality

Only then move forward.

---

# Phase 1 — Repository Ingestion

## Goal

Load any public Git repository.

## Backend

- Fiber server
- Config
- Health endpoint
- Clone repository
- Validate repository
- Read commit history
- Timeline API
- Repository metadata
- In-memory storage

## Frontend

None.

## Deliverable

Repository can be loaded.

Timeline API works.

---

# Phase 2 — Timeline Experience

## Goal

Visualize repository history.

## Frontend

Repository Loader

- URL input
- Loading state
- Clone progress
- Error handling

Timeline

- Vertical timeline
- Commit markers
- Scroll navigation
- Smooth animations

Navigation

- Submarine
- Current commit tracking
- Scroll synchronization

Inspector

- Commit details
- Author
- Date
- Message
- Hash
- Copy hash
- Open on GitHub

## Backend

Use timeline API created in Phase 1.

No additional analytics.

## Deliverable

Interactive repository timeline.

---

# Phase 3 — Repository Explorer

## Goal

Explore the repository exactly as it existed at any commit.

## Backend

Commit API

- commit metadata
- parents
- statistics

Repository Tree

- recursive folders
- recursive files

File API

- retrieve file
- detect language
- binary detection

Diff API

- changed files
- additions
- deletions
- unified patch

## Frontend

Tabbed Inspector

- Details
- Files
- Diff

Repository Explorer

- collapsible folders
- recursive tree
- file icons

File Viewer

- syntax highlighting
- line numbers
- read only

Diff Viewer

- unified diff
- changed file list

## Deliverable

Users can browse any repository snapshot.

---

# Phase 4 — Repository Evolution

## Goal

Understand how the repository changed over time.

## Backend

Growth Engine

- commits over time
- files over time
- LOC over time

File History

- create
- rename
- delete

Contributor Analytics

- activity
- timeline
- ownership

Hotspots

- churn
- modified files

Milestones

- releases
- tags
- merges

## Frontend

Charts

- repository growth
- commit activity
- contributors

Timeline Badges

- milestones
- releases
- important commits

History Explorer

- file history
- hotspot browser

## Deliverable

Developers understand repository evolution.

---

# Phase 5 — Code Intelligence

## Goal

Understand repository structure.

## Backend

Tree-sitter

- parse source code
- language detection

Dependency Analysis

- import graph
- package graph
- module graph

Architecture

- dependency graph
- module evolution

Metrics

- complexity
- maintainability
- file metrics

Hotspots

- churn × complexity

## Frontend

Dependency Graph

- React Flow

Architecture View

- graph evolution
- compare commits

Complexity Heatmap

Module Explorer

Risk Indicators

## Deliverable

Developers understand architecture.

---

# Phase 6 — AI Insights

## Goal

Explain repository evolution.

## Backend

LLM integration

Repository Summary

Commit Explanation

Milestone Detection

Architecture Explanation

Repository Story

Caching

## Frontend

AI Panel

Repository Chat

Explain Commit

Explain Diff

Repository Story Timeline

Natural Language Search

## Deliverable

Repository becomes self-explanatory.

---

# Phase 7 — Performance & Polish

## Goal

Production-ready experience.

## Backend

Caching

Performance optimization

Streaming

Pagination

Better logging

## Frontend

Virtualized timeline

Lazy loading

Search

Filters

Keyboard shortcuts

Command palette

Dark/light theme

Responsive layout

Error boundaries

Loading skeletons

Sharing

Export

Accessibility

## Deliverable

Production-quality application.

---

# Future Ideas (Post-MVP)

These are intentionally out of scope until the MVP is complete.

- Compare repositories
- Compare branches
- GitHub App
- GitLab support
- Bitbucket support
- Live repository updates
- VS Code extension
- Browser extension
- Team collaboration
- Repository annotations
- AI onboarding assistant
- Interactive architecture playback

---

# General Rules

Always:

- Read the existing code first.
- Continue from the current implementation.
- Keep functions small.
- Keep files focused.
- Keep APIs simple.
- Keep components reusable.
- Prefer readability over cleverness.
- Never over-engineer.

If a feature belongs to another phase, document it as a TODO and continue with the current phase only.

This roadmap is the single source of truth for SnapIt's development.