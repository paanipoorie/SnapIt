"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GitCommit,
  Users,
  FileCode,
  TrendingUp,
  Flame,
  Award,
  Milestone as MilestoneIcon,
  Loader2,
  History,
} from "lucide-react";
import {
  getEvolutionStats,
  getContributors,
  getHotspots,
  getMilestones,
  EvolutionStatsResponse,
  ContributorStats,
  HotspotFile,
  Milestone,
} from "@/lib/api";
import { MilestoneBadge } from "@/components/timeline/MilestoneBadge";
import { Button } from "@/components/ui/button";

interface EvolutionViewProps {
  repositoryId: string;
  onOpenFileHistory?: (filePath: string) => void;
  onSelectCommit?: (hash: string) => void;
}

export function EvolutionView({ repositoryId, onOpenFileHistory, onSelectCommit }: EvolutionViewProps) {
  const [stats, setStats] = useState<EvolutionStatsResponse | null>(null);
  const [contributors, setContributors] = useState<ContributorStats[]>([]);
  const [hotspots, setHotspots] = useState<HotspotFile[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"growth" | "contributors" | "hotspots" | "milestones">("growth");
  const [hoveredGrowthIndex, setHoveredGrowthIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!repositoryId) return;

    Promise.resolve().then(() => {
      setIsLoading(true);
      setError(null);
    });

    Promise.all([
      getEvolutionStats(repositoryId),
      getContributors(repositoryId),
      getHotspots(repositoryId),
      getMilestones(repositoryId),
    ])
      .then(([statsData, contribsData, hotspotsData, milestonesData]) => {
        setStats(statsData);
        setContributors(contribsData);
        setHotspots(hotspotsData);
        setMilestones(milestonesData);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load evolution data");
        setIsLoading(false);
      });
  }, [repositoryId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Analyzing repository evolution...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive text-sm font-medium mb-2">Failed to load repository metrics</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Calculate chart metrics
  const growthPoints = stats.growthHistory || [];
  const maxCommits = Math.max(...growthPoints.map((p) => p.commits), 1);
  const maxLOC = Math.max(...growthPoints.map((p) => p.estimatedLoc), 1);

  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-full bg-background text-foreground">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Commits</span>
            <GitCommit className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{stats.totalCommits.toLocaleString()}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Snapshots in time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Contributors</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{stats.totalContributors}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Authors & maintainers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Files</span>
            <FileCode className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{stats.totalFiles.toLocaleString()}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Active files</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Estimated LOC</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{stats.totalLoc.toLocaleString()}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Net lines of code</p>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("growth")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "growth"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Growth & Activity
        </button>
        <button
          onClick={() => setActiveTab("hotspots")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "hotspots"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          File Hotspots ({hotspots.length})
        </button>
        <button
          onClick={() => setActiveTab("contributors")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "contributors"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          Contributors ({contributors.length})
        </button>
        <button
          onClick={() => setActiveTab("milestones")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "milestones"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <MilestoneIcon className="h-3.5 w-3.5" />
          Milestones ({milestones.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "growth" && (
        <div className="space-y-6">
          {/* Repository Growth SVG Chart */}
          <div className="p-5 rounded-xl border bg-card/40 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Repository Growth Over Time</h3>
                <p className="text-xs text-muted-foreground">Cumulative commits and estimated codebase growth</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
                  Commits
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400 inline-block" />
                  LOC
                </span>
              </div>
            </div>

            {growthPoints.length > 0 ? (
              <div className="relative h-64 w-full pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="0" x2="500" y2="0" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                  <line x1="0" y1="180" x2="500" y2="180" stroke="currentColor" className="text-border/40" />

                  {/* Commits Line */}
                  <polyline
                    fill="none"
                    stroke="var(--primary, #3b82f6)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={growthPoints
                      .map((p, i) => {
                        const x = (i / Math.max(growthPoints.length - 1, 1)) * 500;
                        const y = 180 - (p.commits / maxCommits) * 160;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {/* LOC Line */}
                  <polyline
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={growthPoints
                      .map((p, i) => {
                        const x = (i / Math.max(growthPoints.length - 1, 1)) * 500;
                        const y = 180 - (p.estimatedLoc / maxLOC) * 160;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {/* Hover Nodes */}
                  {growthPoints.map((p, i) => {
                    const x = (i / Math.max(growthPoints.length - 1, 1)) * 500;
                    const yCommits = 180 - (p.commits / maxCommits) * 160;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={yCommits}
                        r={hoveredGrowthIndex === i ? 6 : 3}
                        className="fill-primary transition-all cursor-pointer"
                        onMouseEnter={() => setHoveredGrowthIndex(i)}
                        onMouseLeave={() => setHoveredGrowthIndex(null)}
                      />
                    );
                  })}
                </svg>

                {/* Hover Tooltip */}
                {hoveredGrowthIndex !== null && growthPoints[hoveredGrowthIndex] && (
                  <div className="absolute top-2 right-2 p-2.5 rounded-lg bg-popover/90 backdrop-blur border text-xs shadow-xl space-y-1 z-10">
                    <p className="font-semibold">{growthPoints[hoveredGrowthIndex].date}</p>
                    <p className="text-primary font-mono">Commits: {growthPoints[hoveredGrowthIndex].commits}</p>
                    <p className="text-purple-400 font-mono">LOC: {growthPoints[hoveredGrowthIndex].estimatedLoc}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">Insufficient timeline data</div>
            )}
          </div>

          {/* Daily Activity Volume Bar Chart */}
          <div className="p-5 rounded-xl border bg-card/40 backdrop-blur-sm space-y-4">
            <h3 className="font-semibold text-sm">Activity Histogram</h3>
            <div className="flex items-end gap-1.5 h-36 w-full pt-4">
              {stats.activityHistory.slice(-40).map((act, i) => {
                const maxDailyCommits = Math.max(...stats.activityHistory.map((a) => a.commits), 1);
                const heightPct = Math.max((act.commits / maxDailyCommits) * 100, 8);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-primary/40 group-hover:bg-primary rounded-t transition-all"
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-popover text-[10px] p-1 rounded border shadow whitespace-nowrap z-20 pointer-events-none">
                      {act.date}: {act.commits} commits
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "hotspots" && (
        <div className="p-5 rounded-xl border bg-card/40 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Most Frequently Modified Files (Hotspots)</h3>
              <p className="text-xs text-muted-foreground">High code churn files requiring close attention</p>
            </div>
            <span className="text-xs text-muted-foreground">Top {hotspots.length} files</span>
          </div>

          <div className="divide-y divide-border/40">
            {hotspots.map((hs, idx) => {
              const maxChurn = Math.max(...hotspots.map((h) => h.commitCount), 1);
              const pct = (hs.commitCount / maxChurn) * 100;

              return (
                <div key={hs.path + idx} className="py-3 flex items-center justify-between gap-4 hover:bg-muted/20 px-2 rounded-lg transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-blue-400 shrink-0" />
                      <span className="font-mono text-xs font-medium truncate">{hs.path}</span>
                    </div>
                    <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                    <div className="text-right">
                      <div className="font-semibold">{hs.commitCount} changes</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span className="text-emerald-400">+{hs.additions}</span>
                        <span className="text-rose-400">-{hs.deletions}</span>
                      </div>
                    </div>

                    {onOpenFileHistory && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => onOpenFileHistory(hs.path)}
                      >
                        <History className="h-3.5 w-3.5" />
                        History
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "contributors" && (
        <div className="p-5 rounded-xl border bg-card/40 backdrop-blur-sm space-y-4">
          <div>
            <h3 className="font-semibold text-sm">Contributor Leaderboard</h3>
            <p className="text-xs text-muted-foreground">Authors sorted by total commit contributions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contributors.map((c, idx) => (
              <div key={c.email + idx} className="p-4 rounded-xl border bg-background/50 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 border border-primary/20">
                      {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate">{c.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded">
                    {c.sharePercentage.toFixed(1)}% share
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{c.commitCount} commits</span>
                    <span className="flex items-center gap-2">
                      <span className="text-emerald-400">+{c.additions}</span>
                      <span className="text-rose-400">-{c.deletions}</span>
                    </span>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${c.sharePercentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="p-5 rounded-xl border bg-card/40 backdrop-blur-sm space-y-4">
          <div>
            <h3 className="font-semibold text-sm">Key Repository Milestones & Releases</h3>
            <p className="text-xs text-muted-foreground">Tags, release points, and major merges</p>
          </div>

          <div className="space-y-3">
            {milestones.length > 0 ? (
              milestones.map((m, idx) => (
                <div key={m.commitHash + idx} className="p-3.5 rounded-lg border bg-background/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <MilestoneBadge milestone={m} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{m.message}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2 font-mono mt-0.5">
                        <span>{new Date(m.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{m.commitHash.substring(0, 7)}</span>
                      </p>
                    </div>
                  </div>

                  {onSelectCommit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => onSelectCommit(m.commitHash)}
                    >
                      Inspect Commit
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">No tags or milestone markers found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
