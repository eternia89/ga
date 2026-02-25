'use client';

import { useState, useRef } from 'react';
import { X, Plus, Pencil } from 'lucide-react';
import { compressImage } from '@/lib/media/compression';
import { PhotoAnnotation } from '@/components/media/photo-annotation';

export interface ExistingPhoto {
  id: string;
  url: string;
  fileName: string;
}

interface PhotoPreview {
  url: string;
  file: File;
}

interface PhotoUploadProps {
  entityType: string;
  entityId: string;
  onChange: (files: File[]) => void;
  existingPhotos?: ExistingPhoto[];
  disabled?: boolean;
  maxPhotos?: number;
  enableAnnotation?: boolean;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB pre-compression guard

export function PhotoUpload({
  onChange,
  existingPhotos = [],
  disabled = false,
  maxPhotos = 10,
  enableAnnotation = true,
}: PhotoUploadProps) {
  const [previews, setPreviews] = useState<PhotoPreview[]>([]);
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null);
  const [compressing, setCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalPhotos = existingPhotos.length + previews.length;
  const remainingSlots = maxPhotos - totalPhotos;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);

    // Basic client-side validation before compression
    const valid = selected.filter((file) => {
      if (file.size > MAX_SIZE_BYTES) return false;
      if (!ALLOWED_MIME_TYPES.includes(file.type)) return false;
      return true;
    });

    const available = maxPhotos - existingPhotos.length - previews.length;
    const toProcess = valid.slice(0, available);

    if (toProcess.length === 0) {
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setCompressing(true);
    try {
      const compressed = await Promise.all(
        toProcess.map(async (file) => {
          const compressedFile = await compressImage(file);
          return {
            url: URL.createObjectURL(compressedFile),
            file: compressedFile,
          };
        })
      );

      const combined = [...previews, ...compressed].slice(
        0,
        maxPhotos - existingPhotos.length
      );
      setPreviews(combined);
      onChange(combined.map((p) => p.file));
    } catch (error) {
      console.error('Compression error:', error);
    } finally {
      setCompressing(false);
    }

    // Reset file input so same file can be re-selected after removal
    if (inputRef.current) inputRef.current.value = '';
  };

  const removePreview = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
  };

  const handleAnnotationSave = async (annotatedFile: File) => {
    if (annotatingIndex === null) return;

    // Compress the annotated image
    let finalFile: File;
    try {
      finalFile = await compressImage(annotatedFile);
    } catch {
      finalFile = annotatedFile;
    }

    // Revoke old URL and replace preview
    URL.revokeObjectURL(previews[annotatingIndex].url);
    const updated = previews.map((p, i) =>
      i === annotatingIndex
        ? { url: URL.createObjectURL(finalFile), file: finalFile }
        : p
    );
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
    setAnnotatingIndex(null);
  };

  const annotatingPreview =
    annotatingIndex !== null ? previews[annotatingIndex] : null;

  return (
    <>
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

      {/* New preview thumbnails (removable, annotatable) */}
      {previews.map((preview, index) => (
        <div key={index} className="relative w-20 h-20 shrink-0 group">
          <img
            src={preview.url}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover rounded border border-border"
          />
          {!disabled && (
            <>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removePreview(index)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm hover:opacity-90"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="w-3 h-3" />
              </button>

              {/* Annotate button */}
              {enableAnnotation && (
                <button
                  type="button"
                  onClick={() => setAnnotatingIndex(index)}
                  className="absolute bottom-0.5 left-0.5 bg-background/80 text-foreground rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  aria-label={`Annotate photo ${index + 1}`}
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      ))}

      {/* Compressing indicator */}
      {compressing && (
        <div className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground shrink-0">
          <span className="text-xs text-center leading-tight px-1">
            Compressing...
          </span>
        </div>
      )}

      {/* Add photo button — shown when slots remain */}
      {remainingSlots > 0 && !disabled && !compressing && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0 cursor-pointer"
          aria-label="Add photo"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        multiple
        disabled={disabled || compressing}
      />

      {/* Annotation dialog */}
      {annotatingPreview && (
        <PhotoAnnotation
          imageUrl={annotatingPreview.url}
          open={annotatingIndex !== null}
          onSave={handleAnnotationSave}
          onCancel={() => setAnnotatingIndex(null)}
        />
      )}
    </>
  );
}
