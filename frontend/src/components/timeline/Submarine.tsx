"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubmarineProps {
  selectedIndex: number;
  totalCommits: number;
  containerHeight: number;
}

export function Submarine({
  selectedIndex,
  totalCommits,
  containerHeight,
}: SubmarineProps) {
  const progress = totalCommits > 1 ? selectedIndex / (totalCommits - 1) : 0;
  const offset = progress * containerHeight;

  return (
    <motion.div
      className={cn(
        "absolute left-0 w-0.5 pointer-events-none transition-all duration-500 ease-out",
        "bg-primary/60"
      )}
      style={{ height: containerHeight, top: 0 }}
      initial={false}
      animate={{ height: containerHeight }}
    >
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-primary/20 shadow-lg shadow-primary/30"
        style={{ top: offset }}
        initial={false}
        animate={{ top: offset }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.div>

      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-px h-full bg-primary/20"
        style={{ top: 0 }}
      />
    </motion.div>
  );
}