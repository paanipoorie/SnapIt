"use client";

import { useState } from "react";
import { Search, X, Filter, User, Calendar, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export interface FilterState {
  searchQuery: string;
  author: string;
  since: string;
  until: string;
}

interface SearchFilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  authors: string[];
  totalCommits: number;
  filteredCount: number;
}

export function SearchFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  authors,
  totalCommits,
  filteredCount,
}: SearchFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    Boolean(filters.searchQuery.trim()) ||
    Boolean(filters.author) ||
    Boolean(filters.since) ||
    Boolean(filters.until);

  return (
    <div className="border-b bg-card/60 backdrop-blur-md px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search commits, authors, hashes... (Cmd+K)"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="pl-9 pr-9 h-9 text-sm bg-background/80"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-9 gap-1.5 text-xs font-medium"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-foreground text-primary text-[10px] font-bold">
              !
            </span>
          )}
        </Button>

        {/* Reset button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}

        {/* Commit count indicator */}
        <div className="ml-auto text-xs text-muted-foreground font-mono">
          Showing <span className="font-semibold text-foreground">{filteredCount}</span> / {totalCommits} commits
        </div>
      </div>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pt-2 border-t border-border/50"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Author Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Author
                </label>
                <select
                  value={filters.author}
                  onChange={(e) => onFilterChange({ author: e.target.value })}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Authors ({authors.length})</option>
                  {authors.map((author) => (
                    <option key={author} value={author}>
                      {author}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> From Date
                </label>
                <Input
                  type="date"
                  value={filters.since}
                  onChange={(e) => onFilterChange({ since: e.target.value })}
                  className="h-8 text-xs bg-background"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> To Date
                </label>
                <Input
                  type="date"
                  value={filters.until}
                  onChange={(e) => onFilterChange({ until: e.target.value })}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
