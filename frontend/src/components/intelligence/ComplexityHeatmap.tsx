"use client";

import React, { useState } from "react";
import { IntelligenceNode } from "@/lib/api";
import { Grid, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplexityHeatmapProps {
  nodes: IntelligenceNode[];
  onSelectFile?: (path: string) => void;
}

export function ComplexityHeatmap({ nodes, onSelectFile }: ComplexityHeatmapProps) {
  const [hoveredNode, setHoveredNode] = useState<IntelligenceNode | null>(null);

  const getComplexityColor = (comp: number, maint: number) => {
    if (comp > 20 || maint < 40) return "bg-red-500/80 hover:bg-red-500 text-white border-red-600";
    if (comp > 10 || maint < 65) return "bg-amber-500/80 hover:bg-amber-500 text-white border-amber-600";
    if (comp > 5) return "bg-yellow-500/70 hover:bg-yellow-500 text-black border-yellow-600";
    return "bg-emerald-500/60 hover:bg-emerald-500 text-white border-emerald-600";
  };

  const maxLOC = Math.max(...nodes.map((n) => n.linesOfCode), 1);

  return (
    <div className="w-full h-full flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid className="h-5 w-5 text-amber-400" />
          <h3 className="font-semibold text-sm">Code Complexity Heatmap</h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span>Optimal (&le;5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span>Moderate (6-15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Complex (&gt;15)</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {nodes.map((node) => {
            const sizeWeight = Math.max(1, Math.round((node.linesOfCode / maxLOC) * 4));
            const colSpan = sizeWeight > 2 ? "col-span-2" : "col-span-1";

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectFile && onSelectFile(node.path)}
                className={cn(
                  "p-3 rounded-lg border flex flex-col justify-between transition-all transform hover:scale-[1.03] cursor-pointer min-h-[90px]",
                  colSpan,
                  getComplexityColor(node.cyclomaticComplexity, node.maintainabilityIndex)
                )}
              >
                <div>
                  <div className="font-semibold text-xs truncate" title={node.label}>
                    {node.label}
                  </div>
                  <div className="text-[10px] opacity-80 truncate">{node.package}</div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono mt-2 pt-1 border-t border-white/20">
                  <span>{node.linesOfCode} LOC</span>
                  <span className="font-bold">CC: {node.cyclomaticComplexity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Information Banner */}
      {hoveredNode && (
        <div className="p-3 border-t bg-muted/90 backdrop-blur-md flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{hoveredNode.path}</span>
            <span className="px-2 py-0.5 rounded bg-background border text-[10px]">
              {hoveredNode.language}
            </span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>LOC: <strong className="text-foreground">{hoveredNode.linesOfCode}</strong></span>
            <span>Complexity: <strong className="text-amber-400">{hoveredNode.cyclomaticComplexity}</strong></span>
            <span>Maintainability: <strong className="text-emerald-400">{hoveredNode.maintainabilityIndex}</strong></span>
            <span>Risk Score: <strong className="text-red-400">{hoveredNode.riskScore}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
