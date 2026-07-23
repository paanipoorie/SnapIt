"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "j or ↓", description: "Select next (newer) commit in timeline" },
    { key: "k or ↑", description: "Select previous (older) commit in timeline" },
    { key: "1", description: "Switch to Timeline View" },
    { key: "2", description: "Switch to Repository Evolution View" },
    { key: "3", description: "Switch to Code Intelligence View" },
    { key: "Cmd + K / Ctrl + K", description: "Open Command Palette" },
    { key: "?", description: "Toggle Keyboard Shortcuts modal" },
    { key: "Esc", description: "Close active modal or palette" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {shortcuts.map((sc) => (
              <div
                key={sc.key}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/40 border border-border/50 text-xs"
              >
                <span className="text-muted-foreground font-medium">{sc.description}</span>
                <kbd className="px-2.5 py-1 text-[11px] font-mono rounded bg-background border border-border shadow-xs text-foreground font-bold">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-muted rounded border">Esc</kbd> anytime to close.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
