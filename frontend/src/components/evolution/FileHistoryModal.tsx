"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, History, Calendar, User, FileCode, Plus, Minus, Loader2, ArrowRight } from "lucide-react";
import { getFileHistory, FileHistoryEntry } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface FileHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryId: string;
  filePath: string | null;
  onSelectCommit?: (hash: string) => void;
}

export function FileHistoryModal({
  isOpen,
  onClose,
  repositoryId,
  filePath,
  onSelectCommit,
}: FileHistoryModalProps) {
  const [history, setHistory] = useState<FileHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && repositoryId && filePath) {
      Promise.resolve().then(() => {
        setIsLoading(true);
        setError(null);
      });
      getFileHistory(repositoryId, filePath)
        .then((data) => {
          setHistory(data);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load file history");
          setIsLoading(false);
        });
    }
  }, [isOpen, repositoryId, filePath]);

  if (!isOpen || !filePath) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-muted/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{filePath}</span>
                </h3>
                <p className="text-xs text-muted-foreground">Revision history across commits</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading && (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm">Fetching file history...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {!isLoading && !error && history.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No history records found for this file.
              </div>
            )}

            {!isLoading &&
              !error &&
              history.map((entry, idx) => {
                const getActionColor = (action: string) => {
                  switch (action.toLowerCase()) {
                    case "added":
                      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    case "deleted":
                      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
                    case "renamed":
                      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    default:
                      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  }
                };

                return (
                  <motion.div
                    key={entry.commitHash + idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-3.5 rounded-lg border bg-background/50 hover:bg-muted/30 transition-all flex flex-col gap-2 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getActionColor(
                            entry.action
                          )}`}
                        >
                          {entry.action}
                        </span>
                        <code className="text-xs text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                          {entry.commitHash.substring(0, 7)}
                        </code>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400 font-mono flex items-center gap-0.5">
                          <Plus className="h-3 w-3" />
                          {entry.additions}
                        </span>
                        <span className="text-rose-400 font-mono flex items-center gap-0.5">
                          <Minus className="h-3 w-3" />
                          {entry.deletions}
                        </span>
                        {onSelectCommit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs opacity-80 group-hover:opacity-100"
                            onClick={() => {
                              onSelectCommit(entry.commitHash);
                              onClose();
                            }}
                          >
                            Jump to commit <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-medium line-clamp-2">{entry.message || "No commit message"}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span>{entry.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(entry.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
