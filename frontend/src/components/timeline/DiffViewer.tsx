"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { FileText, X } from "lucide-react";
import { motion } from "framer-motion";

interface DiffFile {
  path: string;
  oldPath?: string;
  additions: number;
  deletions: number;
  isBinary: boolean;
  isRenamed: boolean;
  patch: string;
}

interface DiffResponse {
  files: DiffFile[];
}

function parsePatch(patch: string): { type: "header" | "add" | "remove" | "context"; content: string; lineNumber?: { old?: number; new?: number } }[] {
  if (!patch) return [];
  
  const lines = patch.split("\n");
  const result: { type: "header" | "add" | "remove" | "context"; content: string; lineNumber?: { old?: number; new?: number } }[] = [];
  
  let oldLineNum = 0;
  let newLineNum = 0;
  let inHunk = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith("diff --git")) {
      result.push({ type: "header", content: line });
      inHunk = false;
      continue;
    }
    
    if (line.startsWith("+++") || line.startsWith("---")) {
      result.push({ type: "header", content: line });
      continue;
    }
    
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (match) {
        oldLineNum = parseInt(match[1], 10) - 1;
        newLineNum = parseInt(match[2], 10) - 1;
      }
      result.push({ type: "header", content: line });
      inHunk = true;
      continue;
    }
    
    if (inHunk) {
      if (line.startsWith("+")) {
        newLineNum++;
        result.push({ 
          type: "add", 
          content: line.slice(1),
          lineNumber: { new: newLineNum }
        });
      } else if (line.startsWith("-")) {
        oldLineNum++;
        result.push({ 
          type: "remove", 
          content: line.slice(1),
          lineNumber: { old: oldLineNum }
        });
      } else {
        oldLineNum++;
        newLineNum++;
        result.push({ 
          type: "context", 
          content: line.slice(1) || " ",
          lineNumber: { old: oldLineNum, new: newLineNum }
        });
      }
    } else {
      result.push({ type: "header", content: line });
    }
  }
  
  return result;
}

function DiffFileViewer({ file }: { file: DiffFile }) {
  const parsedPatch = useMemo(() => parsePatch(file.patch), [file.patch]);
  
  if (file.isBinary || !file.patch) {
    return (
      <motion.div className="border-b last:border-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-mono text-sm font-medium">{file.path}</p>
              {file.oldPath && file.oldPath !== file.path && (
                <p className="text-xs text-muted-foreground">Renamed from {file.oldPath}</p>
              )}
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-muted-foreground/10 text-muted-foreground">
            Binary file
          </span>
        </div>
        <div className="p-4 text-center text-muted-foreground">
          Binary file - diff not available
        </div>
      </motion.div>
    );
  }
  
  const totalAdditions = file.additions;
  const totalDeletions = file.deletions;
  
  return (
    <motion.div className="border-b last:border-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="px-4 py-3 bg-muted/50 border-b flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium truncate">{file.path}</p>
            {file.oldPath && file.oldPath !== file.path && (
              <p className="text-xs text-muted-foreground">Renamed from {file.oldPath}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            +{totalAdditions}
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            -{totalDeletions}
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <pre className="font-mono text-sm p-4 m-0 select-all tab-size-4">
          {parsedPatch.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-2",
                line.type === "add" && "bg-green-500/10",
                line.type === "remove" && "bg-red-500/10",
                line.type === "header" && "bg-muted/50 text-muted-foreground",
                line.type === "context" && "text-foreground/70"
              )}
              style={{ padding: "1px 0" }}
            >
              {line.lineNumber?.old !== undefined && (
                <span className="w-10 text-right text-muted-foreground/50 select-none pr-2 border-r border-transparent">
                  {line.lineNumber.old}
                </span>
              )}
              {line.lineNumber?.old === undefined && <span className="w-10" />}
              
              {line.lineNumber?.new !== undefined && (
                <span className="w-10 text-right text-muted-foreground/50 select-none pr-2 border-r border-transparent">
                  {line.lineNumber.new}
                </span>
              )}
              {line.lineNumber?.new === undefined && <span className="w-10" />}
              
              <span className={cn(
                "flex-1 select-all",
                line.type === "add" && "text-green-600 dark:text-green-400",
                line.type === "remove" && "text-red-600 dark:text-red-400"
              )}>
                {line.type === "add" && "+"}
                {line.type === "remove" && "-"}
                {line.type === "context" && " "}
                {line.content || " "}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </motion.div>
  );
}

interface DiffViewerProps {
  diff: DiffResponse | null;
  onClose?: () => void;
}

export function DiffViewer({ diff, onClose }: DiffViewerProps) {
  if (!diff || diff.files.length === 0) {
    return (
      <motion.div
        className="flex flex-col h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-muted-foreground">
            No Changes
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            This commit has no file changes
          </p>
        </div>
      </motion.div>
    );
  }
  
  const totalAdditions = diff.files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = diff.files.reduce((sum, f) => sum + f.deletions, 0);
  const fileCount = diff.files.length;
  
  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">Changes</p>
            <p className="text-xs text-muted-foreground">
              {fileCount} file{fileCount !== 1 ? "s" : ""} changed
              {totalAdditions > 0 && `, +${totalAdditions}`}
              {totalDeletions > 0 && `, -${totalDeletions}`}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg bg-muted hover:bg-muted-foreground/10",
              "text-muted-foreground hover:text-foreground transition-colors"
            )}
            aria-label="Close diff"
            title="Close diff"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto">
        {diff.files.map((file) => (
          <DiffFileViewer key={file.path} file={file} />
        ))}
      </div>
    </motion.div>
  );
}