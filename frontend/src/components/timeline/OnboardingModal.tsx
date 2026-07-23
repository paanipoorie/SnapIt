"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Clock, FileCode, TrendingUp, X, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to SnapIt",
      icon: GitBranch,
      description: "An interactive visual time machine for software evolution. Travel through Git history commit by commit.",
      highlight: "Enter any public GitHub URL to begin exploring.",
    },
    {
      title: "Interactive Timeline & Submarine",
      icon: Clock,
      description: "Scroll through the vertical history timeline. As you travel deeper into history, the submarine tracks your depth in time.",
      highlight: "Use J/K keys or Arrow keys to quickly leap between commits.",
    },
    {
      title: "Commit Inspector & Tree Browsing",
      icon: FileCode,
      description: "Inspect every commit's modified files, full diffs, and exact file tree snapshot at that moment in time.",
      highlight: "Click any file to view highlighted source code.",
    },
    {
      title: "Repository Evolution & Code Intelligence",
      icon: TrendingUp,
      description: "Switch to Evolution mode to view repository growth and hotspot files. Use Code Intelligence to inspect module graphs and complexity risk scores.",
      highlight: "Press 1, 2, or 3 to toggle view modes instantly.",
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-8 bg-primary" : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="text-center py-4 space-y-4">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary w-fit mx-auto">
              <Icon className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{currentStep.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed px-4">
              {currentStep.description}
            </p>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50 text-xs font-medium text-foreground mx-4">
              ✨ {currentStep.highlight}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Skip Tour
            </button>
            <Button onClick={handleNext} className="gap-1.5 text-xs font-semibold">
              {step === steps.length - 1 ? (
                <>
                  Get Started <Check className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
