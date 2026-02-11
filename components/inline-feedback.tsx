"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InlineFeedbackProps {
  message: string | null;
  type: "success" | "error";
  className?: string;
}

export function InlineFeedback({ message, type, className }: InlineFeedbackProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [message]);

  if (!message || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "text-sm font-medium transition-opacity duration-300",
        type === "success" && "text-green-600 dark:text-green-400",
        type === "error" && "text-red-600 dark:text-red-400",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {message}
    </div>
  );
}
