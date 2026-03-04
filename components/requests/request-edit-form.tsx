'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestEditSchema, RequestEditFormData } from '@/lib/validations/request-schema';
import { RequestWithRelations } from '@/lib/types/database';
import { updateRequest, deleteMediaAttachment } from '@/app/actions/request-actions';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import { PhotoUpload } from '@/components/media/photo-upload';
import { PhotoLightbox } from '@/components/requests/request-photo-lightbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ExistingPhoto {
  id: string;
  url: string;
  fileName: string;
}

interface RequestEditFormProps {
  request: RequestWithRelations;
  locations: { id: string; name: string }[];
  existingPhotos: ExistingPhoto[];
  onSuccess: () => void;
}

export function RequestEditForm({
  request,
  locations,
  existingPhotos: initialPhotos,
  onSuccess,
}: RequestEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(initialPhotos);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const form = useForm<RequestEditFormData>({
    resolver: zodResolver(requestEditSchema),
    defaultValues: {
      description: request.description ?? '',
      location_id: request.location_id ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      description: request.description ?? '',
      location_id: request.location_id ?? '',
    });
    setExistingPhotos(initialPhotos);
    setNewFiles([]);
    setFeedback(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id, initialPhotos, form]);

  const locationOptions = locations.map((l) => ({ label: l.name, value: l.id }));

  const handleRemoveExistingPhoto = async (photo: ExistingPhoto) => {
    try {
      const result = await deleteMediaAttachment({ attachmentId: photo.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to remove photo',
      });
    }
  };

  const onSubmit = async (data: RequestEditFormData) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Step 1: Update description and location
      const result = await updateRequest({ id: request.id, data });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }

      // Step 2: Upload new photos if any
      if (newFiles.length > 0) {
        const formData = new FormData();
        formData.append('request_id', request.id);
        newFiles.forEach((file) => formData.append('photos', file));

        const uploadRes = await fetch('/api/uploads/request-photos', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          setFeedback({
            type: 'error',
            message: uploadData.error ?? 'Failed to upload photos',
          });
          return;
        }
      }

      onSuccess();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save changes',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPhotos = existingPhotos.length + newFiles.length;
  const maxPhotos = 3;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the issue..."
                    maxLength={1000}
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location_id"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>
                  Location <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={locationOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select location..."
                    searchPlaceholder="Search locations..."
                    emptyText="No locations found."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Photo management */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Photos</p>

            <div className="flex flex-wrap gap-2">
              {/* Existing photos with remove option */}
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="relative w-20 h-20 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(photo.url)}
                    className="w-full h-full"
                    aria-label={`View ${photo.fileName}`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.fileName}
                      className="w-full h-full object-cover rounded border border-border hover:opacity-80 transition-opacity"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingPhoto(photo)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 shadow-sm hover:opacity-90"
                    aria-label={`Remove ${photo.fileName}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* New photo upload placeholder */}
              {totalPhotos < maxPhotos && (
                <PhotoUpload
                  onChange={setNewFiles}
                  value={newFiles}
                  maxPhotos={maxPhotos - existingPhotos.length}
                  enableMobileCapture
                  enableCompression={false}
                  enableAnnotation={false}
                />
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {totalPhotos >= maxPhotos
                ? `Maximum ${maxPhotos} photos reached.`
                : `${totalPhotos}/${maxPhotos} photos. JPEG, PNG, or WebP. Max 5MB each.`}
            </p>
          </div>

          {feedback && (
            <InlineFeedback
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Form>

      {lightboxSrc && (
        <PhotoLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}
