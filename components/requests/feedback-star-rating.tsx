'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackStarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function FeedbackStarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: FeedbackStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const activeValue = hoverValue ?? value;
  const iconSize = SIZE_CLASSES[size];

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= activeValue;

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            className={cn(
              'transition-colors',
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
              'disabled:cursor-default'
            )}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                iconSize,
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-muted-foreground/40'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
