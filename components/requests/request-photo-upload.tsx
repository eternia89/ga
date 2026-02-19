'use client';

import { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ExistingPhoto {
  id: string;
  url: string;
  fileName: string;
}

interface RequestPhotoUploadProps {
  onChange: (files: File[]) => void;
  existingPhotos?: ExistingPhoto[];
  disabled?: boolean;
  maxPhotos?: number;
}

export function RequestPhotoUpload({
  onChange,
  existingPhotos = [],
  disabled = false,
  maxPhotos = 3,
}: RequestPhotoUploadProps) {
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalPhotos = existingPhotos.length + previews.length;
  const remainingSlots = maxPhotos - totalPhotos;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);

    const valid = selected.filter((file) => {
      if (file.size > MAX_SIZE_BYTES) {
        return false;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return false;
      }
      return true;
    });

    const available = maxPhotos - existingPhotos.length - previews.length;
    const toAdd = valid.slice(0, available);

    const newPreviews = toAdd.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));

    const combined = [...previews, ...newPreviews].slice(0, maxPhotos - existingPhotos.length);
    setPreviews(combined);
    onChange(combined.map((p) => p.file));

    // Reset file input so same file can be re-selected after removal
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removePreview = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* Existing photos (read-only, no remove button) */}
        {existingPhotos.map((photo) => (
          <div key={photo.id} className="relative w-20 h-20 shrink-0">
            <img
              src={photo.url}
              alt={photo.fileName}
              className="w-full h-full object-cover rounded border border-border"
            />
          </div>
        ))}

        {/* New preview thumbnails (removable) */}
        {previews.map((preview, index) => (
          <div key={index} className="relative w-20 h-20 shrink-0">
            <img
              src={preview.url}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover rounded border border-border"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removePreview(index)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm hover:opacity-90"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Add photo button — shown when slots remain */}
        {remainingSlots > 0 && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
            aria-label="Add photo"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {totalPhotos}/{maxPhotos} photos. JPEG, PNG, or WebP. Max 5MB each.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        multiple
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  );
}
