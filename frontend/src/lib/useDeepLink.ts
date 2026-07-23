"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface DeepLinkState {
  repositoryId?: string | null;
  commitHash?: string | null;
  viewMode?: "timeline" | "evolution" | "intelligence";
  searchQuery?: string;
  author?: string;
}

export function useDeepLink() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getInitialState = useCallback((): DeepLinkState => {
    const rawView = searchParams.get("view");
    const viewMode = rawView === "evolution" || rawView === "intelligence" ? rawView : "timeline";
    return {
      repositoryId: searchParams.get("repo") || null,
      commitHash: searchParams.get("commit") || null,
      viewMode,
      searchQuery: searchParams.get("q") || "",
      author: searchParams.get("author") || "",
    };
  }, [searchParams]);

  const updateURL = useCallback(
    (state: DeepLinkState) => {
      const params = new URLSearchParams(searchParams.toString());

      if (state.repositoryId) params.set("repo", state.repositoryId);
      else params.delete("repo");

      if (state.commitHash) params.set("commit", state.commitHash);
      else params.delete("commit");

      if (state.viewMode) params.set("view", state.viewMode);
      else params.delete("view");

      if (state.searchQuery) params.set("q", state.searchQuery);
      else params.delete("q");

      if (state.author) params.set("author", state.author);
      else params.delete("author");

      const newUrl = `${pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  return { getInitialState, updateURL };
}
