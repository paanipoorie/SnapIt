"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Moon, Layers, Eye } from "lucide-react";

export interface UserSettings {
  theme: "dark" | "light" | "system";
  density: "normal" | "compact";
  showSubmarine: boolean;
  autoScrollInspector: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  if (!isOpen) return null;

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
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">User Preferences</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Theme Preference */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5" /> Appearance Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["dark", "light", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdateSettings({ theme: t })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                      settings.theme === t
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                        : "bg-muted/30 border-border/60 hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Density */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Timeline Layout Density
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["normal", "compact"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => onUpdateSettings({ density: d })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                      settings.density === d
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                        : "bg-muted/30 border-border/60 hover:bg-muted"
                    }`}
                  >
                    {d === "normal" ? "Comfortable (Default)" : "Compact"}
                  </button>
                ))}
              </div>
            </div>

            {/* Submarine Visibility */}
            <div className="flex items-center justify-between py-2 border-t border-border/50">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Submarine Depth Indicator
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Show animated depth submarine along timeline
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showSubmarine}
                onChange={(e) => onUpdateSettings({ showSubmarine: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
