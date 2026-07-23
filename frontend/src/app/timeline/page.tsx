"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  GitBranch,
  ExternalLink,
  Clock,
  TrendingUp,
  Cpu,
  Command,
  HelpCircle,
  Download,
  Share2,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Timeline } from "@/components/timeline/Timeline";
import { Inspector } from "@/components/timeline/Inspector";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { FileHistoryModal } from "@/components/evolution/FileHistoryModal";
import { SearchFilterBar, FilterState } from "@/components/timeline/SearchFilterBar";
import { CommandPalette } from "@/components/timeline/CommandPalette";
import { KeyboardShortcutsModal } from "@/components/timeline/KeyboardShortcutsModal";
import { ExportModal } from "@/components/timeline/ExportModal";
import { SettingsModal, UserSettings } from "@/components/timeline/SettingsModal";
import { OnboardingModal } from "@/components/timeline/OnboardingModal";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

const EvolutionView = dynamic(
  () => import("@/components/evolution/EvolutionView").then((mod) => mod.EvolutionView),
  {
    loading: () => (
      <div className="p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    ),
  }
);

const IntelligenceView = dynamic(
  () => import("@/components/intelligence/IntelligenceView").then((mod) => mod.IntelligenceView),
  {
    loading: () => (
      <div className="p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    ),
  }
);

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadRepository, getTimeline, getMilestones, Commit, Milestone } from "@/lib/api";

export default function TimelinePage() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repositoryId, setRepositoryId] = useState<string | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "evolution" | "intelligence">("timeline");
  const [fileHistoryPath, setFileHistoryPath] = useState<string | null>(null);

  // Phase 7 Modals & Controls State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // User Settings State
  const [settings, setSettings] = useState<UserSettings>({
    theme: "dark",
    density: "normal",
    showSubmarine: true,
    autoScrollInspector: true,
  });

  // Search & Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    author: "",
    since: "",
    until: "",
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ searchQuery: "", author: "", since: "", until: "" });
  };

  // Check Onboarding status on load
  useEffect(() => {
    const hasSeen = localStorage.getItem("snapit_onboarding_seen");
    if (!hasSeen) {
      Promise.resolve().then(() => {
        setIsOnboardingOpen(true);
        localStorage.setItem("snapit_onboarding_seen", "true");
      });
    }
  }, []);

  const handleLoadRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repositoryUrl.trim()) return;

    setIsLoading(true);
    setLoadError(null);
    setError(null);

    try {
      const response = await loadRepository(repositoryUrl.trim());
      setRepositoryId(response.repositoryId);
      setIsLoading(false);
      addToast("Repository loaded successfully", `Indexed ${response.totalCommits} commits.`);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load repository");
      setIsLoading(false);
    }
  };

  const handleLoadTimeline = useCallback(async () => {
    if (!repositoryId) return;

    setIsLoadingTimeline(true);
    setError(null);

    try {
      const [timeline, ms] = await Promise.all([
        getTimeline(repositoryId),
        getMilestones(repositoryId).catch(() => []),
      ]);
      setCommits(timeline);
      setMilestones(ms);
      if (timeline.length > 0) {
        setSelectedIndex(timeline.length - 1);
      }
      setIsLoadingTimeline(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repository data");
      setIsLoadingTimeline(false);
    }
  }, [repositoryId]);

  useEffect(() => {
    if (repositoryId && commits.length === 0) {
      Promise.resolve().then(() => {
        handleLoadTimeline();
      });
    }
  }, [repositoryId, commits.length, handleLoadTimeline]);

  // Authors list for filter dropdown
  const authors = useMemo(() => {
    const set = new Set<string>();
    commits.forEach((c) => set.add(c.author));
    return Array.from(set).sort();
  }, [commits]);

  // Filtered commits
  const filteredCommits = useMemo(() => {
    return commits.filter((c) => {
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchMsg = c.message.toLowerCase().includes(q);
        const matchAuthor = c.author.toLowerCase().includes(q);
        const matchHash = c.hash.toLowerCase().includes(q);
        if (!matchMsg && !matchAuthor && !matchHash) return false;
      }

      if (filters.author && c.author !== filters.author) {
        return false;
      }

      if (filters.since) {
        const sinceDate = new Date(filters.since).getTime();
        const commitDate = new Date(c.date).getTime();
        if (commitDate < sinceDate) return false;
      }

      if (filters.until) {
        const untilDate = new Date(filters.until).getTime() + 86400000;
        const commitDate = new Date(c.date).getTime();
        if (commitDate > untilDate) return false;
      }

      return true;
    });
  }, [commits, filters]);

  const handleSelectCommitByHash = (hash: string) => {
    const idx = filteredCommits.findIndex((c) => c.hash.toLowerCase() === hash.toLowerCase());
    if (idx !== -1) {
      setSelectedIndex(idx);
      setViewMode("timeline");
    } else {
      const fullIdx = commits.findIndex((c) => c.hash.toLowerCase() === hash.toLowerCase());
      if (fullIdx !== -1) {
        handleResetFilters();
        setSelectedIndex(fullIdx);
        setViewMode("timeline");
      }
    }
  };

  const selectedCommit =
    selectedIndex !== null && filteredCommits[selectedIndex] ? filteredCommits[selectedIndex] : null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast("Share URL copied to clipboard", "You can now share this repository view with others.");
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is inside input/textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === "1") {
        setViewMode("timeline");
      } else if (e.key === "2") {
        setViewMode("evolution");
      } else if (e.key === "3") {
        setViewMode("intelligence");
      } else if (e.key === "j" || e.key === "ArrowDown") {
        if (filteredCommits.length > 0 && viewMode === "timeline") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev !== null ? Math.min(filteredCommits.length - 1, prev + 1) : 0));
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        if (filteredCommits.length > 0 && viewMode === "timeline") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev !== null ? Math.max(0, prev - 1) : 0));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredCommits.length, viewMode]);

  if (!repositoryId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              SnapIt
            </h1>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOnboardingOpen(true)}
                className="gap-1 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Guide
              </Button>
              <a
                href="https://github.com/paanipoorie/SnapIt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <div className="p-4 rounded-2xl bg-primary/10 text-primary w-fit mx-auto mb-4">
                <GitBranch className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Load a Repository</h2>
              <p className="text-muted-foreground text-sm">
                Enter a public GitHub repository URL to explore its complete historical evolution.
              </p>
            </div>

            <form onSubmit={handleLoadRepository} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="repo-url" className="text-sm font-medium">
                  Repository URL
                </label>
                <div className="relative">
                  <Input
                    id="repo-url"
                    type="url"
                    placeholder="https://github.com/owner/repo"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    disabled={isLoading}
                    className="pr-10 h-11"
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {loadError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loadError}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !repositoryUrl.trim()}
                className="w-full h-11 font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingesting Repository...
                  </>
                ) : (
                  <>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Explore History
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>Example repositories to try:</p>
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setRepositoryUrl("https://github.com/paanipoorie/SnapIt")}
                  className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors font-mono"
                >
                  paanipoorie/SnapIt
                </button>
                <button
                  type="button"
                  onClick={() => setRepositoryUrl("https://github.com/vercel/next.js")}
                  className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors font-mono"
                >
                  vercel/next.js
                </button>
                <button
                  type="button"
                  onClick={() => setRepositoryUrl("https://github.com/facebook/react")}
                  className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors font-mono"
                >
                  facebook/react
                </button>
              </div>
            </div>
          </motion.div>
        </main>

        <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* App Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent"
            >
              SnapIt
            </motion.span>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50 text-xs font-medium">
              <button
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all",
                  viewMode === "timeline"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                Timeline (1)
              </button>
              <button
                onClick={() => setViewMode("evolution")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all",
                  viewMode === "evolution"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Evolution (2)
              </button>
              <button
                onClick={() => setViewMode("intelligence")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all",
                  viewMode === "intelligence"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                Intelligence (3)
              </button>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Command className="h-3.5 w-3.5" />
              Palette
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border">
                ⌘K
              </kbd>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              title="Share URL"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExportOpen(true)}
              title="Export Data"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsShortcutsOpen(true)}
              title="Keyboard Shortcuts (?)"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {viewMode === "timeline" ? (
          <>
            <SearchFilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              authors={authors}
              totalCommits={commits.length}
              filteredCount={filteredCommits.length}
            />

            <div className="flex-1 flex overflow-hidden">
              <div className="w-full lg:w-3/5 flex flex-col min-w-0">
                {isLoadingTimeline && (
                  <div className="border-b bg-background/50 backdrop-blur-sm px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading timeline...</span>
                    </div>
                  </div>
                )}

                {error && !isLoadingTimeline && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b bg-destructive/10 border-destructive/20 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>Failed to load timeline</span>
                      </div>
                      <button
                        onClick={handleLoadTimeline}
                        className="text-sm text-destructive hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  </motion.div>
                )}

                <Timeline
                  repositoryId={repositoryId}
                  commits={filteredCommits}
                  selectedIndex={selectedIndex}
                  onSelect={setSelectedIndex}
                  isLoading={isLoadingTimeline}
                  milestones={milestones}
                  showSubmarine={settings.showSubmarine}
                />
              </div>

              <div className="hidden lg:block lg:w-2/5 border-l flex flex-col min-w-0 bg-card/20">
                <Inspector commit={selectedCommit} repositoryId={repositoryId} />
              </div>
            </div>
          </>
        ) : viewMode === "evolution" ? (
          <div className="w-full h-full overflow-y-auto">
            <ErrorBoundary fallbackTitle="Evolution View Error">
              <EvolutionView
                repositoryId={repositoryId}
                onOpenFileHistory={(filePath) => setFileHistoryPath(filePath)}
                onSelectCommit={handleSelectCommitByHash}
              />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="w-full h-full overflow-hidden">
            <ErrorBoundary fallbackTitle="Code Intelligence Error">
              <IntelligenceView
                repositoryId={repositoryId}
                commitHash={selectedCommit?.hash}
                onSelectFile={(filePath) => setFileHistoryPath(filePath)}
              />
            </ErrorBoundary>
          </div>
        )}
      </main>

      {/* Modals & Dialogs */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commits={commits}
        onSelectCommit={handleSelectCommitByHash}
        onSelectView={setViewMode}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onShare={handleShare}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        repositoryId={repositoryId}
        commits={commits}
        milestones={milestones}
        selectedCommit={selectedCommit}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
      />

      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />

      <FileHistoryModal
        isOpen={Boolean(fileHistoryPath)}
        onClose={() => setFileHistoryPath(null)}
        repositoryId={repositoryId}
        filePath={fileHistoryPath}
        onSelectCommit={handleSelectCommitByHash}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}