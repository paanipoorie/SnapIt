"use client";

import { useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2, X, Copy, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface FileViewerProps {
  file: {
    path: string;
    size: number;
    language: string;
    content: string;
    binary: boolean;
  } | null;
  onClose?: () => void;
}

const languageMap: Record<string, string> = {
  go: "go",
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  rust: "rust",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  scala: "scala",
  bash: "bash",
  html: "html",
  css: "css",
  json: "json",
  xml: "xml",
  yaml: "yaml",
  markdown: "markdown",
  sql: "sql",
  dockerfile: "dockerfile",
  toml: "toml",
  protobuf: "protobuf",
  vue: "vue",
  svelte: "svelte",
  astro: "astro",
  plaintext: "plaintext",
};

function highlightCode(code: string, _language: string): string {
  if (!code) return "";
  
  const escaped = code
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"")
    .replace(/'/g, "&#039;");
  
  const lines = escaped.split("\n");
  return lines.map((line, i) => 
    `<span class="line" data-line="${i + 1}">${line || " "}</span>`
  ).join("\n");
}

export function FileViewer({ file, onClose }: FileViewerProps) {
  const preRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<string>("");

  const language = useMemo(() => {
    if (!file) return "plaintext";
    return languageMap[file.language] || "plaintext";
  }, [file?.language]);

  const content = useMemo(() => {
    if (!file) return "";
    if (file.binary) {
      return "[Binary file - cannot display]";
    }
    return file.content;
  }, [file]);

  const lineCount = useMemo(() => {
    if (!content) return 0;
    return content.split("\n").length;
  }, [content]);

  // Apply syntax highlighting
  useEffect(() => {
    if (!file || file.binary) {
      highlightedRef.current = content;
      return;
    }
    
    highlightedRef.current = highlightCode(content, language);
    if (preRef.current) {
      preRef.current.innerHTML = highlightedRef.current;
    }
  }, [content, language]);

  if (!file) {
    return (
      <motion.div
        className="flex flex-col h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Select a file
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Click on a file in the tree to view its contents
          </p>
        </div>
      </motion.div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm text-foreground truncate">{file.path}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(file.size)} \u2022 {file.language}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className={cn(
              "p-2 rounded-lg bg-muted hover:bg-muted-foreground/10",
              "text-muted-foreground hover:text-foreground transition-colors"
            )}
            aria-label="Copy file contents"
            title="Copy file contents"
          >
            <Copy className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg bg-muted hover:bg-muted-foreground/10",
                "text-muted-foreground hover:text-foreground transition-colors"
              )}
              aria-label="Close file"
              title="Close file"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {file.binary ? (
        <motion.div
          className="flex-1 flex items-center justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Binary File
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              This file cannot be displayed as text
            </p>
            <p className="text-xs text-muted-foreground/50 mt-2 font-mono">
              {formatSize(file.size)}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 overflow-auto p-4" ref={preRef}>
          <pre
            className={cn(
              "font-mono text-sm line-numbers",
              "tab-size-4"
            )}
            style={{
              counterReset: "line",
            }}
          >
            <code className={language} dangerouslySetInnerHTML={{ __html: highlightedRef.current }} />
          </pre>
        </div>
      )}
    </motion.div>
  );
}