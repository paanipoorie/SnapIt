"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  TrendingUp,
  Cpu,
  Share2,
  Download,
  Settings,
  HelpCircle,
  Hash,
  X,
  Command,
} from "lucide-react";
import { Commit } from "@/lib/api";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commits: Commit[];
  onSelectCommit: (hash: string) => void;
  onSelectView: (view: "timeline" | "evolution" | "intelligence") => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onShare: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  commits,
  onSelectCommit,
  onSelectView,
  onOpenExport,
  onOpenSettings,
  onOpenShortcuts,
  onShare,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setQuery("");
        setSelectedIndex(0);
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCommits = useMemo(() => {
    return query.trim()
      ? commits
          .filter(
            (c) =>
              c.message.toLowerCase().includes(query.toLowerCase()) ||
              c.hash.toLowerCase().includes(query.toLowerCase()) ||
              c.author.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 8)
      : [];
  }, [commits, query]);

  const actions = useMemo(
    () => [
      {
        id: "view-timeline",
        label: "Go to Timeline View",
        category: "Navigation",
        icon: GitBranch,
        shortcut: "1",
        action: () => {
          onSelectView("timeline");
          onClose();
        },
      },
      {
        id: "view-evolution",
        label: "Go to Evolution View",
        category: "Navigation",
        icon: TrendingUp,
        shortcut: "2",
        action: () => {
          onSelectView("evolution");
          onClose();
        },
      },
      {
        id: "view-intelligence",
        label: "Go to Code Intelligence",
        category: "Navigation",
        icon: Cpu,
        shortcut: "3",
        action: () => {
          onSelectView("intelligence");
          onClose();
        },
      },
      {
        id: "action-share",
        label: "Share Repository URL",
        category: "Actions",
        icon: Share2,
        shortcut: "C",
        action: () => {
          onShare();
          onClose();
        },
      },
      {
        id: "action-export",
        label: "Export Repository Data (JSON/Markdown/PDF)",
        category: "Actions",
        icon: Download,
        shortcut: "E",
        action: () => {
          onOpenExport();
          onClose();
        },
      },
      {
        id: "action-settings",
        label: "Open Settings",
        category: "Preferences",
        icon: Settings,
        shortcut: "S",
        action: () => {
          onOpenSettings();
          onClose();
        },
      },
      {
        id: "action-shortcuts",
        label: "Keyboard Shortcuts Guide",
        category: "Help",
        icon: HelpCircle,
        shortcut: "?",
        action: () => {
          onOpenShortcuts();
          onClose();
        },
      },
    ],
    [onSelectView, onClose, onShare, onOpenExport, onOpenSettings, onOpenShortcuts]
  );

  const totalItems = actions.length + filteredCommits.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex < actions.length) {
          actions[selectedIndex].action();
        } else {
          const commit = filteredCommits[selectedIndex - actions.length];
          if (commit) {
            onSelectCommit(commit.hash);
            onClose();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, totalItems, actions, filteredCommits, onClose, onSelectCommit]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header Input */}
          <div className="flex items-center px-4 border-b border-border">
            <Command className="h-4 w-4 text-muted-foreground mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search commits..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="flex-1 py-4 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {/* Quick Actions */}
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </p>
              <div className="space-y-1 mt-1">
                {actions.map((act, idx) => {
                  const Icon = act.icon;
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={act.id}
                      onClick={act.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{act.label}</span>
                      </div>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono rounded bg-muted text-muted-foreground border border-border">
                        {act.shortcut}
                      </kbd>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Commit Search Results */}
            {query.trim() && (
              <div>
                <p className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Matching Commits ({filteredCommits.length})
                </p>
                <div className="space-y-1 mt-1">
                  {filteredCommits.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      No matching commits found for &quot;{query}&quot;
                    </p>
                  ) : (
                    filteredCommits.map((c, idx) => {
                      const itemIdx = actions.length + idx;
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <button
                          key={c.hash}
                          onClick={() => {
                            onSelectCommit(c.hash);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-foreground hover:bg-accent/50"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-mono text-muted-foreground text-[11px]">
                              {c.hash.slice(0, 7)}
                            </span>
                            <span className="truncate">{c.message}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                            {c.author}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <span>SnapIt Command Palette</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
