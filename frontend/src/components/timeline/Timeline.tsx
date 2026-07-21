"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, GitBranch, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommitMarker } from "./CommitMarker";
import { Submarine } from "./Submarine";

import { Milestone } from "@/lib/api";

interface Commit {
  hash: string;
  author: string;
  email: string;
  message: string;
  date: string;
}

interface TimelineProps {
  repositoryId: string;
  commits: Commit[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  isLoading?: boolean;
  milestones?: Milestone[];
}

export function Timeline({
  repositoryId,
  commits,
  selectedIndex,
  onSelect,
  isLoading,
  milestones = [],
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (timelineRef.current) {
      setContainerHeight(timelineRef.current.scrollHeight);
    }
  }, [commits.length]);

  const handleMarkerClick = (index: number) => {
    onSelect(index);
    scrollToMarker(index);
  };

  const scrollToMarker = (index: number) => {
    if (!scrollContainerRef.current || !timelineRef.current) return;

    const markers = timelineRef.current.querySelectorAll('[data-marker-index]');
    const marker = markers[index] as HTMLElement;
    if (!marker) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();

    const markerCenter = markerRect.top + markerRect.height / 2;
    const containerCenter = containerRect.top + containerRect.height / 2;
    const offset = markerCenter - containerCenter;

    container.scrollBy({
      top: offset,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!timelineRef.current || !scrollContainerRef.current) return;

    const markers = timelineRef.current.querySelectorAll('[data-marker-index]');
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    markers.forEach((marker, index) => {
      const markerRect = marker.getBoundingClientRect();
      const markerCenter = markerRect.top + markerRect.height / 2;
      const distance = Math.abs(markerCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== selectedIndex) {
      onSelect(closestIndex);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedIndex, commits.length, onSelect]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    scrollContainerRef.current?.scrollTo({ top: containerHeight, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <GitBranch className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No commits found in this repository</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      <div
        ref={scrollContainerRef}
        className="relative flex-1 overflow-y-auto pr-2"
      >
        <div
          ref={timelineRef}
          className="relative w-full"
          style={{ minHeight: containerHeight || "auto" }}
        >
          <Submarine
            selectedIndex={selectedIndex ?? commits.length - 1}
            totalCommits={commits.length}
            containerHeight={containerHeight || commits.length * 120}
          />

          <div className="relative z-10 px-4">
            {commits.map((commit, index) => (
              <motion.div
                key={commit.hash}
                data-marker-index={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              >
                <CommitMarker
                  commit={commit}
                  index={index}
                  isSelected={selectedIndex === index}
                  onClick={() => handleMarkerClick(index)}
                  isLast={index === commits.length - 1}
                  milestone={milestones.find((m) => m.commitHash === commit.hash)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={scrollToTop}
            className={cn(
              "p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border",
              "hover:bg-background hover:border-primary/50 transition-all",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-4 w-4" />
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={scrollToBottom}
            className={cn(
              "p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border",
              "hover:bg-background hover:border-primary/50 transition-all",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        </div>
      </AnimatePresence>
    </div>
  );
}