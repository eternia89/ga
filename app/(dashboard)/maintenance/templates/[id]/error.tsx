'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TemplateDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TemplateDetailError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <ClipboardList className="h-10 w-10 text-amber-400 mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Could not load template
      </h2>
      <p className="text-sm text-muted-foreground mb-1 max-w-sm">
        There was a problem fetching this maintenance template. This may be a
        temporary connectivity issue — try again or go back to the list.
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
          <Link href="/maintenance/templates">Back to Templates</Link>
        </Button>
      </div>
    </div>
  );
}
