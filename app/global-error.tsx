'use client';

import { useEffect } from 'react';
import { RefreshCw, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Global error boundary — catches errors thrown inside the root layout itself.
 * Must include its own <html> and <body> since the root layout is broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <ServerCrash className="h-12 w-12 text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Application error
            </h1>
            <p className="text-gray-500 mb-2">
              An unexpected error occurred while loading the application.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 font-mono mb-6">
                Error ID: {error.digest}
              </p>
            )}
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
