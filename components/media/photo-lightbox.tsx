'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
  description?: string | null;
}

interface PhotoLightboxProps {
  photos: PhotoItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function PhotoLightbox({ photos, initialIndex = 0, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const isMulti = photos.length > 1;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && isMulti) {
        goNext();
      } else if (e.key === 'ArrowLeft' && isMulti) {
        goPrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isMulti, goNext, goPrev]);

  const current = photos[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Previous button */}
      {isMulti && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next button */}
      {isMulti && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
          aria-label="Next photo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={current.url}
        alt={current.fileName}
        className="max-h-[70vh] max-w-[90vw] object-contain"
        style={{ touchAction: 'pinch-zoom' }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* AI description panel — only shown if description is non-null */}
      {current.description && (
        <div
          className="mt-3 max-w-lg rounded bg-black/60 px-4 py-2 text-center text-sm text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {current.description}
        </div>
      )}

      {/* Counter */}
      {isMulti && (
        <div
          className="mt-3 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {currentIndex + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}
