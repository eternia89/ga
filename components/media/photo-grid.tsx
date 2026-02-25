'use client';

import { useState } from 'react';
import { PhotoLightbox } from '@/components/media/photo-lightbox';

export type { PhotoItem } from '@/components/media/photo-lightbox';
import type { PhotoItem } from '@/components/media/photo-lightbox';

interface PhotoGridProps {
  photos: PhotoItem[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-5 max-lg:grid-cols-4 max-md:grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="relative w-full aspect-square rounded border border-border overflow-hidden hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`View photo: ${photo.fileName}`}
          >
            <img
              src={photo.url}
              alt={photo.fileName}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
