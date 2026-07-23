"use client";

import React, { useState, useEffect } from "react";
import { getCodeIntelligence, CodeIntelligenceResponse } from "@/lib/api";
import { DependencyGraph } from "./DependencyGraph";
import { ModuleExplorer } from "./ModuleExplorer";
import { ComplexityHeatmap } from "./ComplexityHeatmap";
import { RiskIndicators } from "./RiskIndicators";
import { Loader2, AlertCircle, Cpu, Network, Folder, Grid, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntelligenceViewProps {
  repositoryId: string;
  commitHash?: string;
  onSelectFile?: (path: string) => void;
}

export function IntelligenceView({ repositoryId, commitHash, onSelectFile }: IntelligenceViewProps) {
  const [data, setData] = useState<CodeIntelligenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"graph" | "modules" | "heatmap" | "risks">("graph");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const intel = await getCodeIntelligence(repositoryId, commitHash);
        if (isMounted) {
          setData(intel);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load code intelligence data");
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [repositoryId, commitHash]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <h3 className="text-lg font-semibold mb-1">Analyzing Code Structure & Architecture</h3>
        <p className="text-xs text-muted-foreground">Parsing AST, dependencies, complexity metrics, and hotspots...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md p-6 rounded-xl border bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <h4 className="font-semibold text-sm mb-1">Code Intelligence Unavailable</h4>
          <p className="text-xs text-muted-foreground">{error || "No data returned"}</p>
        </div>
      </div>
    );
  }

  const highRiskCount = data.hotspots.filter((h) => h.riskLevel === "HIGH").length;

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden p-4 space-y-4">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col">
          <span className="text-[10px] text-muted-foreground font-mono uppercase">Total Files</span>
          <span className="text-xl font-bold text-foreground mt-0.5">{data.totalFiles}</span>
        </div>

        <div className="p-3 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col">
          <span className="text-[10px] text-muted-foreground font-mono uppercase">Lines of Code</span>
          <span className="text-xl font-bold text-foreground mt-0.5">{data.totalLoc}</span>
        </div>

        <div className="p-3 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col">
          <span className="text-[10px] text-muted-foreground font-mono uppercase">Avg Complexity</span>
          <span className={cn("text-xl font-bold mt-0.5", data.avgComplexity > 10 ? "text-amber-400" : "text-emerald-400")}>
            {data.avgComplexity}
          </span>
        </div>

        <div className="p-3 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col">
          <span className="text-[10px] text-muted-foreground font-mono uppercase">Avg Maintainability</span>
          <span className={cn("text-xl font-bold mt-0.5", data.avgMaintainability < 60 ? "text-amber-400" : "text-emerald-400")}>
            {data.avgMaintainability} / 100
          </span>
        </div>

        <div className="p-3 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col">
          <span className="text-[10px] text-muted-foreground font-mono uppercase">High Risk Files</span>
          <span className={cn("text-xl font-bold mt-0.5", highRiskCount > 0 ? "text-red-500" : "text-emerald-400")}>
            {highRiskCount}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border text-xs font-medium gap-1">
          <button
            onClick={() => setActiveTab("graph")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
              activeTab === "graph"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Network className="h-3.5 w-3.5 text-indigo-400" />
            Dependency Graph
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
              activeTab === "modules"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Folder className="h-3.5 w-3.5 text-indigo-400" />
            Module Explorer
          </button>
          <button
            onClick={() => setActiveTab("heatmap")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
              activeTab === "heatmap"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid className="h-3.5 w-3.5 text-amber-400" />
            Complexity Heatmap
          </button>
          <button
            onClick={() => setActiveTab("risks")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
              activeTab === "risks"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
            Risk Indicators ({highRiskCount})
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span>Commit: {data.commitHash.substring(0, 7)}</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 min-h-[500px] overflow-hidden rounded-xl">
        {activeTab === "graph" && (
          <DependencyGraph nodes={data.nodes} edges={data.edges} onSelectFile={onSelectFile} />
        )}
        {activeTab === "modules" && (
          <ModuleExplorer modules={data.modules} nodes={data.nodes} onSelectFile={onSelectFile} />
        )}
        {activeTab === "heatmap" && (
          <ComplexityHeatmap nodes={data.nodes} onSelectFile={onSelectFile} />
        )}
        {activeTab === "risks" && (
          <RiskIndicators hotspots={data.hotspots} onSelectFile={onSelectFile} />
        )}
      </div>
    </div>
  );
}
