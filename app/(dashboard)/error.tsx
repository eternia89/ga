'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ServerCrash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Dashboard-level error boundary.
 * Renders inside the dashboard layout so the sidebar stays visible.
 * Catches unhandled errors from any dashboard page or segment without
 * a more specific error.tsx.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <ServerCrash className="h-10 w-10 text-red-400 mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground mb-1 max-w-sm">
        An unexpected error occurred while loading this page.
        Your data is safe — this is a temporary issue.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono mb-4">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex gap-3 mt-2">
        <Button variant="outline" size="sm" onClick={reset} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
        <Button size="sm" asChild>
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
