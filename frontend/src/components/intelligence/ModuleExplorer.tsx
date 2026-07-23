"use client";

import React, { useState } from "react";
import { ModuleSummary, IntelligenceNode } from "@/lib/api";
import { Folder, FileCode, ChevronRight, ChevronDown, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleExplorerProps {
  modules: ModuleSummary[];
  nodes: IntelligenceNode[];
  onSelectFile?: (path: string) => void;
}

export function ModuleExplorer({ modules, nodes, onSelectFile }: ModuleExplorerProps) {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    root: true,
  });

  const toggleModule = (modPath: string) => {
    setExpandedModules((prev) => ({ ...prev, [modPath]: !prev[modPath] }));
  };

  const getModuleNodes = (modPath: string) => {
    return nodes.filter((n) => n.package === modPath);
  };

  return (
    <div className="w-full h-full flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-indigo-400" />
          <h3 className="font-semibold text-sm">Module Architecture Explorer</h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {modules.length} Packages / Modules
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {modules.map((mod) => {
          const isExpanded = !!expandedModules[mod.path];
          const moduleFiles = getModuleNodes(mod.path);
          const isHighRisk = mod.avgComplexity > 12 || mod.avgMaintainability < 60;

          return (
            <div key={mod.path} className="border rounded-lg overflow-hidden bg-background/50">
              <button
                onClick={() => toggleModule(mod.path)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <Folder className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="font-medium text-xs truncate">{mod.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                    {mod.fileCount} files
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] text-muted-foreground block">LOC</span>
                    <span className="text-foreground">{mod.totalLoc}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Avg Comp</span>
                    <span className={cn(mod.avgComplexity > 10 ? "text-amber-400" : "text-foreground")}>
                      {mod.avgComplexity}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Maint</span>
                    <span className={cn(mod.avgMaintainability < 60 ? "text-red-400" : "text-emerald-400")}>
                      {mod.avgMaintainability}
                    </span>
                  </div>

                  {isHighRisk ? (
                    <span title="High module complexity">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    </span>
                  ) : (
                    <span title="Optimal module health">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && moduleFiles.length > 0 && (
                <div className="border-t bg-muted/20 p-2 space-y-1">
                  {moduleFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => onSelectFile && onSelectFile(file.path)}
                      className="p-2 rounded-md hover:bg-muted/60 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono text-foreground truncate">{file.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {file.language}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground shrink-0">
                        <span>{file.linesOfCode} LOC</span>
                        <span className={file.cyclomaticComplexity > 10 ? "text-amber-400 font-medium" : ""}>
                          CC: {file.cyclomaticComplexity}
                        </span>
                        <span className={file.riskScore >= 50 ? "text-red-400 font-semibold" : ""}>
                          Risk: {file.riskScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
