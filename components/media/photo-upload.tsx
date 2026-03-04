'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
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
  onChange: (files: File[]) => void;
  value?: File[];
  existingPhotos?: ExistingPhoto[];
  onRemoveExisting?: (id: string) => void;
  disabled?: boolean;
  maxPhotos?: number;
  enableCompression?: boolean;
  enableAnnotation?: boolean;
  enableMobileCapture?: boolean;
  showCount?: boolean;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export function PhotoUpload({
  onChange,
  value,
  existingPhotos = [],
  onRemoveExisting,
  disabled = false,
  maxPhotos = 10,
  enableCompression = true,
  enableAnnotation = true,
  enableMobileCapture = false,
  showCount = false,
  required = false,
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 5,
}: PhotoUploadProps) {
  const isControlled = value !== undefined;

  // Internal state for uncontrolled mode
  const [internalPreviews, setInternalPreviews] = useState<PhotoPreview[]>([]);

  // Controlled mode: derive previews from value prop
  const controlledPreviews = useMemo(() => {
    if (!isControlled) return [];
    return value.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
  }, [isControlled, value]);

  // Cleanup controlled preview URLs when they change
  useEffect(() => {
    if (!isControlled) return;
    return () => {
      controlledPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [isControlled, controlledPreviews]);

  const previews = isControlled ? controlledPreviews : internalPreviews;
  const setPreviews = isControlled
    ? () => {} // no-op in controlled mode — parent drives state via onChange
    : setInternalPreviews;

  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null);
  const [compressing, setCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Mobile input (with camera capture) — only used when enableMobileCapture is true
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const allowedMimeTypes = accept.split(',').map((t) => t.trim());

  const totalPhotos = existingPhotos.length + previews.length;
  const remainingSlots = maxPhotos - totalPhotos;

  const processFiles = async (selected: File[]) => {
    // Basic client-side validation before processing
    const valid = selected.filter((file) => {
      if (file.size > maxSizeBytes) return false;
      if (!allowedMimeTypes.includes(file.type)) return false;
      return true;
    });

    const available = maxPhotos - existingPhotos.length - previews.length;
    const toProcess = valid.slice(0, available);

    if (toProcess.length === 0) return;

    if (enableCompression) {
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
    } else {
      const newPreviews = toProcess.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));

      const combined = [...previews, ...newPreviews].slice(
        0,
        maxPhotos - existingPhotos.length
      );
      setPreviews(combined);
      onChange(combined.map((p) => p.file));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    await processFiles(selected);

    // Reset file inputs so same file can be re-selected after removal
    if (inputRef.current) inputRef.current.value = '';
    if (mobileInputRef.current) mobileInputRef.current.value = '';
  };

  const removePreview = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
  };

  const handleAnnotationSave = async (annotatedFile: File) => {
    if (annotatingIndex === null) return;

    // Compress the annotated image if compression is enabled
    let finalFile: File;
    if (enableCompression) {
      try {
        finalFile = await compressImage(annotatedFile);
      } catch {
        finalFile = annotatedFile;
      }
    } else {
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

  const renderContent = () => (
    <>
      {/* Existing photos (with optional remove button) */}
      {existingPhotos.map((photo) => (
        <div key={photo.id} className="relative w-20 h-20 shrink-0">
          <img
            src={photo.url}
            alt={photo.fileName}
            className="w-full h-full object-cover rounded border border-border"
          />
          {!disabled && onRemoveExisting && (
            <button
              type="button"
              onClick={() => onRemoveExisting(photo.id)}
              className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 shadow-sm hover:opacity-90"
              aria-label={`Remove ${photo.fileName}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {/* New preview thumbnails (removable, optionally annotatable) */}
      {previews.map((preview, index) => (
        <div key={`${preview.file.name}-${preview.file.size}-${preview.file.lastModified}`} className="relative w-20 h-20 shrink-0 group">
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
                className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 shadow-sm hover:opacity-90"
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

      {/* Add photo button(s) — shown when slots remain */}
      {remainingSlots > 0 && !disabled && !compressing && (
        enableMobileCapture ? (
          <>
            {/* Desktop button (no camera capture) */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0 cursor-pointer max-md:hidden"
              aria-label="Add photo"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Mobile button (triggers camera capture) */}
            <button
              type="button"
              onClick={() => mobileInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-border rounded items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0 cursor-pointer hidden max-md:flex"
              aria-label="Add photo"
            >
              <Plus className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0 cursor-pointer"
            aria-label="Add photo"
          >
            <Plus className="w-5 h-5" />
          </button>
        )
      )}
    </>
  );

  return (
    <>
      {showCount ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {renderContent()}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalPhotos} / {maxPhotos} photos
            {required && totalPhotos === 0 && (
              <span className="text-destructive ml-1">(at least 1 required)</span>
            )}
          </p>
        </div>
      ) : (
        renderContent()
      )}

      {/* Desktop file input — no capture attribute */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleFileChange}
        multiple
        disabled={disabled || compressing}
      />

      {/* Mobile file input — with camera capture (only rendered when enabled) */}
      {enableMobileCapture && (
        <input
          ref={mobileInputRef}
          type="file"
          accept={accept}
          capture="environment"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled || compressing}
        />
      )}

      {/* Annotation dialog */}
      {enableAnnotation && annotatingPreview && (
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
