"use client";

import React from "react";
import { RiskHotspot } from "@/lib/api";
import { AlertOctagon, ShieldAlert, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskIndicatorsProps {
  hotspots: RiskHotspot[];
  onSelectFile?: (path: string) => void;
}

export function RiskIndicators({ hotspots, onSelectFile }: RiskIndicatorsProps) {
  const getRiskBadge = (level: string) => {
    switch (level) {
      case "HIGH":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  const getRecommendation = (hotspot: RiskHotspot) => {
    if (hotspot.cyclomaticComplexity > 15 && hotspot.churnCount > 5) {
      return "High churn & complexity. Break into smaller modular components.";
    }
    if (hotspot.maintainabilityIndex < 50) {
      return "Low maintainability score. Simplify control flow and extract helper functions.";
    }
    if (hotspot.linesOfCode > 300) {
      return "Large file size. Split into separate focused sub-modules.";
    }
    return "Acceptable architectural stability. Monitor future modifications.";
  };

  return (
    <div className="w-full h-full flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-sm">Architectural Risk Indicators & Hotspots</h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {hotspots.length} Flagged High-Risk Files
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hotspots.map((hotspot, idx) => (
          <div
            key={hotspot.path}
            onClick={() => onSelectFile && onSelectFile(hotspot.path)}
            className="p-4 rounded-xl border bg-background/60 hover:bg-muted/40 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground/60">#{idx + 1}</span>
                <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {hotspot.path}
                </span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-mono font-semibold", getRiskBadge(hotspot.riskLevel))}>
                  {hotspot.riskLevel} RISK
                </span>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertOctagon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{getRecommendation(hotspot)}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">LOC</span>
                <span className="font-medium text-foreground">{hotspot.linesOfCode}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">Complexity</span>
                <span className={cn("font-medium", hotspot.cyclomaticComplexity > 10 ? "text-amber-400" : "text-foreground")}>
                  {hotspot.cyclomaticComplexity}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">Churn</span>
                <span className="font-medium text-foreground">{hotspot.churnCount}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">Risk Score</span>
                <span className="font-bold text-red-400">{hotspot.riskScore}</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
