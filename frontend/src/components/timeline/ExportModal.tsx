"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Printer, X } from "lucide-react";
import { Commit, Milestone } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryId: string;
  commits: Commit[];
  milestones?: Milestone[];
  selectedCommit?: Commit | null;
}

export function ExportModal({
  isOpen,
  onClose,
  repositoryId,
  commits,
  milestones = [],
  selectedCommit,
}: ExportModalProps) {
  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(commits, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `snapit-repository-${repositoryId.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportMarkdown = () => {
    let md = `# SnapIt Evolution & Timeline Report\n\n`;
    md += `**Repository ID:** \`${repositoryId}\`\n`;
    md += `**Total Commits:** ${commits.length}\n`;
    md += `**Report Generated:** ${new Date().toLocaleString()}\n\n`;

    if (selectedCommit) {
      md += `## Selected Commit\n\n`;
      md += `- **Hash:** \`${selectedCommit.hash}\`\n`;
      md += `- **Author:** ${selectedCommit.author} (<${selectedCommit.email}>)\n`;
      md += `- **Date:** ${new Date(selectedCommit.date).toLocaleString()}\n`;
      md += `- **Message:** ${selectedCommit.message}\n\n`;
    }

    if (milestones.length > 0) {
      md += `## Key Milestones\n\n`;
      milestones.forEach((m) => {
        md += `- **[${m.type.toUpperCase()}] ${m.name}**: ${m.message} (\`${m.commitHash.slice(0, 7)}\`)\n`;
      });
      md += `\n`;
    }

    md += `## Complete Commit History\n\n`;
    commits.forEach((c, idx) => {
      md += `${idx + 1}. \`${c.hash.slice(0, 7)}\` | **${c.author}** | ${new Date(c.date).toLocaleDateString()} | ${c.message}\n`;
    });

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `snapit-report-${repositoryId.slice(0, 8)}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Export Repository Data</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Export JSON */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  JSON Dataset
                </p>
                <p className="text-xs text-muted-foreground">
                  Export complete commit timeline as structured JSON
                </p>
              </div>
              <Button size="sm" onClick={handleExportJSON} className="text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>

            {/* Export Markdown */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  Markdown Report
                </p>
                <p className="text-xs text-muted-foreground">
                  Generate human-readable Markdown summary document
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleExportMarkdown} className="text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>

            {/* Print / Save PDF */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Printer className="h-4 w-4 text-purple-500" />
                  Print / Save PDF
                </p>
                <p className="text-xs text-muted-foreground">
                  Print or save formatted PDF report of current view
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={handlePrintPDF} className="text-xs gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
