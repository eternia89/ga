'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

// Single-photo mode (backward compatible)
interface SinglePhotoProps {
  src: string;
  alt?: string;
  photos?: never;
  initialIndex?: never;
  onClose: () => void;
}

// Multi-photo mode
interface MultiPhotoProps {
  photos: PhotoItem[];
  initialIndex?: number;
  src?: never;
  alt?: never;
  onClose: () => void;
}

type PhotoLightboxProps = SinglePhotoProps | MultiPhotoProps;

export function PhotoLightbox(props: PhotoLightboxProps) {
  const { onClose } = props;

  // Normalize to array
  const photos: PhotoItem[] = props.photos
    ? props.photos
    : [{ id: 'single', url: props.src, fileName: props.alt ?? 'Photo' }];

  const [currentIndex, setCurrentIndex] = useState(props.initialIndex ?? 0);

  const isMulti = photos.length > 1;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && isMulti) {
        goNext();
      } else if (e.key === 'ArrowLeft' && isMulti) {
        goPrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMulti, goNext, goPrev]);

  const current = photos[currentIndex];

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] bg-black border-black/80 p-0 gap-0 flex flex-col items-center justify-center overflow-hidden"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">
          Photo {currentIndex + 1} of {photos.length}
        </DialogTitle>

        {/* Image with side navigation */}
        <div className="flex items-center w-full flex-1 min-h-0">
          {/* Previous button */}
          {isMulti && (
            <button
              type="button"
              onClick={goPrev}
              className="shrink-0 flex items-center justify-center w-12 h-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Image */}
          <div className="flex-1 min-w-0 flex items-center justify-center h-full p-2">
            <img
              src={current.url}
              alt={current.fileName}
              className="max-h-[85vh] max-w-full object-contain"
              style={{ touchAction: 'pinch-zoom' }}
            />
          </div>

          {/* Next button */}
          {isMulti && (
            <button
              type="button"
              onClick={goNext}
              className="shrink-0 flex items-center justify-center w-12 h-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </div>

        {/* Counter */}
        {isMulti && (
          <div className="shrink-0 py-2 text-sm text-white/70">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
