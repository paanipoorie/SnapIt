"use client";

import { motion } from "framer-motion";
import { GitBranch, Calendar, Mail, Hash, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Commit {
  hash: string;
  author: string;
  email: string;
  message: string;
  date: string;
}

interface InspectorProps {
  commit: Commit | null;
  repositoryId: string;
}

export function Inspector({ commit, repositoryId }: InspectorProps) {
  const shortHash = commit?.hash.slice(0, 7) ?? "";
  const fullHash = commit?.hash ?? "";
  const date = commit ? new Date(commit.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) : "";

  if (!commit) {
    return (
      <motion.div
        className="flex flex-col h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <GitBranch className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Select a commit
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Click on a commit in the timeline to see details
          </p>
        </div>
      </motion.div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            {commit.message.split("\n")[0]}
          </h2>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="h-4 w-4 shrink-0" />
            <code className="font-mono bg-muted px-2 py-1 rounded">{shortHash}</code>
            <button
              onClick={() => copyToClipboard(fullHash)}
              className="p-1 hover:text-foreground transition-colors"
              aria-label="Copy full hash"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium text-sm">
                {commit.author.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">{commit.author}</p>
              <p className="text-muted-foreground">{commit.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{date}</span>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Full Message
          </h3>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg">
            {commit.message}
          </pre>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Commit Hash
          </h3>
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm bg-muted px-3 py-2 rounded flex-1 break-all">
              {fullHash}
            </code>
            <button
              onClick={() => copyToClipboard(fullHash)}
              className={cn(
                "p-2 rounded-lg bg-muted hover:bg-muted-foreground/10",
                "text-muted-foreground hover:text-foreground transition-colors"
              )}
              aria-label="Copy commit hash"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t p-4">
        <a
          href={`https://github.com/${repositoryId}/commit/${fullHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center justify-center gap-2 w-full px-4 py-2",
            "rounded-lg border border-border bg-background",
            "hover:bg-muted hover:border-primary/50 transition-all",
            "text-sm font-medium text-foreground"
          )}
        >
          <ExternalLink className="h-4 w-4" />
          View on GitHub
        </a>
      </div>
    </motion.div>
  );
}