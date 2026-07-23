"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, FolderOpen, Folder, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeEntry {
  type: string;
  name: string;
  path: string;
  children?: TreeEntry[];
}

interface FileTreeProps {
  tree: TreeEntry[];
  selectedPath?: string;
  onFileSelect: (path: string) => void;
  onFolderToggle?: (path: string) => void;
}

interface TreeNodeProps {
  entry: TreeEntry;
  depth: number;
  selectedPath?: string;
  onFileSelect: (path: string) => void;
  expandedFolders: Set<string>;
  onFolderToggle: (path: string) => void;
}

function TreeNode({ entry, depth, selectedPath, onFileSelect, expandedFolders, onFolderToggle }: TreeNodeProps) {
  const isFolder = entry.type === "directory";
  const isSelected = entry.path === selectedPath;
  const isExpanded = expandedFolders.has(entry.path);
  const hasChildren = isFolder && entry.children && entry.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      onFolderToggle(entry.path);
    } else {
      onFileSelect(entry.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
    if (isFolder && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      onFolderToggle(entry.path);
    }
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors",
          "hover:bg-muted",
          isSelected && "bg-primary/10 text-primary",
          `pl-${depth * 4 + 2}`
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role={isFolder ? "treeitem" : "treeitem"}
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-selected={isSelected}
      >
        {isFolder && hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFolderToggle(entry.path);
            }}
            className={cn(
              "p-0.5 flex items-center justify-center text-muted-foreground hover:text-foreground",
              "transition-transform duration-150",
              isExpanded && "rotate-90"
            )}
            aria-label={isExpanded ? `Collapse ${entry.name}` : `Expand ${entry.name}`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
        {!isFolder && (
          <span className="w-5 flex items-center justify-center">
            <ChevronRight className="h-3.5 w-3.5 opacity-0" />
          </span>
        )}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className={cn("h-4 w-4 flex-shrink-0", isSelected && "text-primary")} />
          ) : (
            <Folder className={cn("h-4 w-4 flex-shrink-0", isSelected && "text-primary")} />
          )
        ) : (
          <File className={cn("h-4 w-4 flex-shrink-0 text-muted-foreground", isSelected && "text-primary")} />
        )}
        <span className="text-sm truncate font-mono">{entry.name}</span>
      </div>
      {isFolder && hasChildren && isExpanded && (
        <div className="border-l border-border/50 ml-3 pl-2" role="group" aria-label={`${entry.name} contents`}>
          {entry.children!.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onFileSelect={onFileSelect}
              expandedFolders={expandedFolders}
              onFolderToggle={onFolderToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ tree, selectedPath, onFileSelect, onFolderToggle }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleFolderToggle = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
    onFolderToggle?.(path);
  }, [onFolderToggle]);

  // Auto-expand folders leading to selected file
  useEffect(() => {
    if (!selectedPath) return;
    const parts = selectedPath.split("/");
    let currentPath = "";
    Promise.resolve().then(() => {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          next.add(currentPath);
        }
        return next;
      });
    });
  }, [selectedPath]);

  return (
    <div className="flex-1 overflow-y-auto p-2" role="tree" aria-label="Repository files">
      {tree.map((entry) => (
        <TreeNode
          key={entry.path}
          entry={entry}
          depth={0}
          selectedPath={selectedPath}
          onFileSelect={onFileSelect}
          expandedFolders={expandedFolders}
          onFolderToggle={handleFolderToggle}
        />
      ))}
    </div>
  );
}