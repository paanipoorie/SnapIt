"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitBranch, Calendar, Mail, Hash, Copy, ExternalLink,
  FileText, Folder, ChevronRight, ChevronDown, Loader2, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getCommitDetail, 
  getCommitTree, 
  getFileContent, 
  getCommitDiff,
  type CommitDetailResponse,
  type TreeEntry,
  type FileResponse,
  type DiffResponse
} from "@/lib/api";
import { FileTree } from "./FileTree";
import { FileViewer } from "./FileViewer";
import { DiffViewer } from "./DiffViewer";

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

type Tab = "details" | "files" | "diff";

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

  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [detail, setDetail] = useState<CommitDetailResponse | null>(null);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileResponse | null>(null);
  const [diff, setDiff] = useState<DiffResponse | null>(null);
  const [loading, setLoading] = useState<Record<Tab, boolean>>({
    details: false,
    files: false,
    diff: false,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Load commit detail when commit changes
  useEffect(() => {
    if (!commit) return;
    
    const loadDetail = async () => {
      setLoading(prev => ({ ...prev, details: true }));
      try {
        const data = await getCommitDetail(repositoryId, commit.hash);
        setDetail(data);
      } catch (err) {
        console.error("Failed to load commit detail:", err);
      } finally {
        setLoading(prev => ({ ...prev, details: false }));
      }
    };
    
    loadDetail();
  }, [commit, repositoryId]);

  // Load tree and diff when tab is activated
  const loadTabData = useCallback(async (tab: Tab) => {
    if (!commit) return;
    
    if (tab === "files") {
      setLoading(prev => ({ ...prev, files: true }));
      try {
        const data = await getCommitTree(repositoryId, commit.hash);
        setTree(data);
      } catch (err) {
        console.error("Failed to load tree:", err);
      } finally {
        setLoading(prev => ({ ...prev, files: false }));
      }
    } else if (tab === "diff") {
      setLoading(prev => ({ ...prev, diff: true }));
      try {
        const data = await getCommitDiff(repositoryId, commit.hash);
        setDiff(data);
      } catch (err) {
        console.error("Failed to load diff:", err);
      } finally {
        setLoading(prev => ({ ...prev, diff: false }));
      }
    }
  }, [commit, repositoryId]);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  const handleFileSelect = async (path: string) => {
    if (!commit) return;
    
    try {
      const data = await getFileContent(repositoryId, commit.hash, path);
      setSelectedFile(data);
    } catch (err) {
      console.error("Failed to load file:", err);
    }
  };

  const handleCloseFile = () => {
    setSelectedFile(null);
  };

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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "details", label: "Details", icon: <GitBranch className="h-4 w-4" /> },
    { id: "files", label: "Files", icon: <Folder className="h-4 w-4" /> },
    { id: "diff", label: "Diff", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tab Bar */}
      <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <nav className="flex px-4" aria-label="Commit inspector tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all",
                "rounded-t-lg border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                loading[tab.id] && "opacity-70 cursor-wait"
              )}
              disabled={loading[tab.id]}
              aria-selected={activeTab === tab.id}
              role="tab"
              aria-controls={`panel-${tab.id}`}
            >
              {tab.icon}
              {tab.label}
              {loading[tab.id] && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === "details" && (
            <DetailsPanel 
              commit={commit} 
              detail={detail}
              repositoryId={repositoryId}
              shortHash={shortHash}
              fullHash={fullHash}
              date={date}
              copyToClipboard={copyToClipboard}
            />
          )}
          {activeTab === "files" && (
            <FilesPanel
              tree={tree}
              loading={loading.files}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onCloseFile={handleCloseFile}
            />
          )}
          {activeTab === "diff" && (
            <DiffPanel diff={diff} loading={loading.diff} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* View on GitHub Link */}
      <div className="border-t p-4 bg-background/50 backdrop-blur-sm">
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

function DetailsPanel({ 
  commit, 
  detail, 
  shortHash, 
  fullHash, 
  date, 
  copyToClipboard,
  repositoryId 
}: { 
  commit: Commit; 
  detail: CommitDetailResponse | null; 
  shortHash: string; 
  fullHash: string; 
  date: string; 
  copyToClipboard: (text: string) => void;
  repositoryId: string;
}) {
  const parents = detail?.parents || [];
  const stats = detail?.stats || { additions: 0, deletions: 0, files: 0 };

  return (
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

      {parents.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Parent Commits
          </h3>
          <div className="space-y-1">
            {parents.map((parent, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{parent.slice(0, 7)}</code>
                <button
                  onClick={() => copyToClipboard(parent)}
                  className="p-1 hover:text-foreground transition-colors"
                  aria-label={`Copy parent hash ${i + 1}`}
                >
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-4 border-t">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Stats
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{stats.additions}
            </p>
            <p className="text-xs text-muted-foreground">Additions</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              -{stats.deletions}
            </p>
            <p className="text-xs text-muted-foreground">Deletions</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">{stats.files}</p>
            <p className="text-xs text-muted-foreground">Files</p>
          </div>
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
  );
}

function FilesPanel({ 
  tree, 
  loading, 
  selectedFile, 
  onFileSelect, 
  onCloseFile 
}: { 
  tree: TreeEntry[]; 
  loading: boolean; 
  selectedFile: FileResponse | null; 
  onFileSelect: (path: string) => void; 
  onCloseFile: () => void; 
}) {
  return (
    <div className="h-full flex flex-col">
      {!selectedFile ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b bg-background/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Folder className="h-4 w-4" />
              <span>Repository Files</span>
              {tree.length > 0 && (
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                  {countTreeEntries(tree)} item{countTreeEntries(tree) !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <FileTree
            tree={tree}
            onFileSelect={onFileSelect}
          />
        </div>
      ) : (
        <div className="flex h-full">
          <div className="w-96 max-w-[45%] border-r flex flex-col min-w-0 hidden lg:block">
            <div className="px-4 py-3 border-b bg-background/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Folder className="h-4 w-4" />
                <span>Repository Files</span>
              </div>
            </div>
            <FileTree
              tree={tree}
              selectedPath={selectedFile.path}
              onFileSelect={onFileSelect}
            />
          </div>
          <div className="flex-1 min-w-0 lg:min-w-0">
            <FileViewer
              file={selectedFile}
              onClose={onCloseFile}
            />
          </div>
        </div>
      )}
      
      {loading && !selectedFile && (
        <div className="border-t px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground bg-background/50">
          <span className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
          <span>Loading repository...</span>
        </div>
      )}
    </div>
  );
}

function DiffPanel({ diff, loading }: { diff: DiffResponse | null; loading: boolean }) {
  return (
    <div className="h-full flex flex-col relative">
      <DiffViewer diff={diff} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-5 w-5 animate-spin border-2 border-primary border-t-transparent rounded-full" />
            <span>Loading diff...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to count tree entries
function countTreeEntries(entries: TreeEntry[]): number {
  let count = 0;
  for (const entry of entries) {
    count++;
    if (entry.children) {
      count += countTreeEntries(entry.children);
    }
  }
  return count;
}