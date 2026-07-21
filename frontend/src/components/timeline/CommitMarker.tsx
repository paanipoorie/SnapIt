"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MilestoneBadge } from "./MilestoneBadge";
import { Milestone } from "@/lib/api";

interface CommitMarkerProps {
  commit: Commit;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  isLast?: boolean;
  milestone?: Milestone;
}

interface Commit {
  hash: string;
  author: string;
  email: string;
  message: string;
  date: string;
}

export function CommitMarker({
  commit,
  index,
  isSelected,
  onClick,
  isLast,
  milestone,
}: CommitMarkerProps) {
  const shortHash = commit.hash.slice(0, 7);
  const shortMessage = commit.message.split("\n")[0];
  const date = new Date(commit.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      key={commit.hash}
      className={cn(
        "relative flex gap-4 w-full",
        isLast && "pb-16"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="relative flex h-full w-0.5 flex-col items-center">
        <div
          className={cn(
            "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
            isSelected
              ? "border-primary bg-primary scale-125 shadow-lg shadow-primary/30"
              : "border-border bg-background hover:border-primary/50 hover:scale-110"
          )}
          onClick={onClick}
        >
          {isSelected && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              isSelected ? "bg-primary w-3 h-3" : "bg-muted-foreground/50"
            )}
          />
        </div>
        {!isLast && (
          <div
            className={cn(
              "flex-1 w-0.5 transition-colors duration-300",
              isSelected ? "bg-primary/30" : "bg-border"
            )}
          />
        )}
      </div>

      <motion.div
        className="flex-1 min-w-0"
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 + 0.1 }}
      >
        <div
          className={cn(
            "rounded-lg border p-4 transition-all duration-300 cursor-pointer hover:border-primary/50",
            isSelected
              ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
              : "border-border bg-card hover:shadow-sm"
          )}
          onClick={onClick}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {shortHash}
              </span>
              <span className="text-xs text-muted-foreground">{date}</span>
            </div>
            {milestone && <MilestoneBadge milestone={milestone} />}
          </div>
          <h4 className="font-medium text-foreground truncate">
            {shortMessage}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {commit.author} {"<"}{commit.email}{">"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}