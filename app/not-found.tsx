import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* CTA */}
        <Button asChild>
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
