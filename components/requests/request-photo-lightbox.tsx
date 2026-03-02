'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
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
          className="absolute left-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
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
          className="absolute right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
          aria-label="Next photo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={current.url}
        alt={current.fileName}
        className="max-h-screen max-w-screen object-contain"
        style={{ touchAction: 'pinch-zoom' }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Counter */}
      {isMulti && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {currentIndex + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}
