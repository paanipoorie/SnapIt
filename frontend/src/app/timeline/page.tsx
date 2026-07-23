"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, GitBranch, ExternalLink, Clock, TrendingUp, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Timeline } from "@/components/timeline/Timeline";
import { Inspector } from "@/components/timeline/Inspector";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { FileHistoryModal } from "@/components/evolution/FileHistoryModal";

const EvolutionView = dynamic(() => import("@/components/evolution/EvolutionView").then((mod) => mod.EvolutionView), {
  loading: () => <div className="p-8"><Skeleton className="h-96 w-full" /></div>,
});

const IntelligenceView = dynamic(() => import("@/components/intelligence/IntelligenceView").then((mod) => mod.IntelligenceView), {
  loading: () => <div className="p-8"><Skeleton className="h-96 w-full" /></div>,
});
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
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "evolution" | "intelligence">("timeline");
  const [fileHistoryPath, setFileHistoryPath] = useState<string | null>(null);

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
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load repository");
      setIsLoading(false);
    }
  };

  const handleLoadTimeline = async () => {
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
  };

  useEffect(() => {
    if (repositoryId && commits.length === 0) {
      handleLoadTimeline();
    }
  }, [repositoryId]);

  const handleSelectCommitByHash = (hash: string) => {
    const idx = commits.findIndex((c) => c.hash.toLowerCase() === hash.toLowerCase());
    if (idx !== -1) {
      setSelectedIndex(idx);
      setViewMode("timeline");
    }
  };

  const selectedCommit = selectedIndex !== null ? commits[selectedIndex] : null;

  if (!repositoryId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold">SnapIt</h1>
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
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-2xl font-semibold mb-2">Load a Repository</h2>
              <p className="text-muted-foreground">
                Enter a GitHub repository URL to explore its history
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
                    className="pr-10"
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Public GitHub repositories only (https://github.com/owner/repo)
                </p>
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
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cloning & Analyzing...
                  </>
                ) : (
                  <>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Load Repository
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
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                >
                  paanipoorie/SnapIt
                </button>
                <button
                  type="button"
                  onClick={() => setRepositoryUrl("https://github.com/vercel/next.js")}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                >
                  vercel/next.js
                </button>
                <button
                  type="button"
                  onClick={() => setRepositoryUrl("https://github.com/facebook/react")}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                >
                  facebook/react
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-semibold"
            >
              SnapIt
            </motion.span>
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted text-sm text-muted-foreground"
            >
              <GitBranch className="h-3 w-3" />
              <span>{commits.length} commits</span>
            </motion.div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border text-xs font-medium">
              <button
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all",
                  viewMode === "timeline"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                Timeline
              </button>
              <button
                onClick={() => setViewMode("evolution")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all",
                  viewMode === "evolution"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Evolution
              </button>
              <button
                onClick={() => setViewMode("intelligence")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all",
                  viewMode === "intelligence"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                Code Intelligence
              </button>
            </div>
          </div>

          <a
            href={`https://github.com/${repositoryId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View on GitHub
          </a>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {viewMode === "timeline" ? (
          <>
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
                commits={commits}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                isLoading={isLoadingTimeline}
                milestones={milestones}
              />
            </div>

            <div className="hidden lg:block lg:w-2/5 border-l flex flex-col min-w-0">
              <Inspector
                commit={selectedCommit}
                repositoryId={repositoryId}
              />
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

      {/* File History Modal */}
      <FileHistoryModal
        isOpen={Boolean(fileHistoryPath)}
        onClose={() => setFileHistoryPath(null)}
        repositoryId={repositoryId}
        filePath={fileHistoryPath}
        onSelectCommit={handleSelectCommitByHash}
      />
    </div>
  );
}