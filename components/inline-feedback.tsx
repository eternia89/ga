"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineFeedbackProps {
  message: string | null;
  type: "success" | "error";
  className?: string;
  onDismiss?: () => void;
}

export function InlineFeedback({ message, type, className, onDismiss }: InlineFeedbackProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium",
        type === "success" && "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
        type === "error" && "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
        className
      )}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 hover:opacity-70"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
