"use client";

import { Tag, GitMerge, Flag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Milestone } from "@/lib/api";

interface MilestoneBadgeProps {
  milestone: Milestone;
  className?: string;
  size?: "sm" | "md";
}

export function MilestoneBadge({ milestone, className, size = "sm" }: MilestoneBadgeProps) {
  const getBadgeConfig = () => {
    switch (milestone.type) {
      case "tag":
      case "release":
        return {
          icon: Tag,
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          dot: "bg-emerald-400",
        };
      case "merge":
        return {
          icon: GitMerge,
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          dot: "bg-purple-400",
        };
      case "initial":
        return {
          icon: Sparkles,
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          dot: "bg-amber-400",
        };
      default:
        return {
          icon: Flag,
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          dot: "bg-blue-400",
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border px-2.5 py-0.5 text-xs transition-colors",
        config.bg,
        size === "sm" ? "text-[11px] py-0.5 px-2" : "text-xs py-1 px-2.5",
        className
      )}
      title={milestone.message || milestone.name}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span className="truncate max-w-[120px]">{milestone.name}</span>
    </span>
  );
}
