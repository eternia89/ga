'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestSubmitSchema, RequestSubmitFormData } from '@/lib/validations/request-schema';
import { createRequest } from '@/app/actions/request-actions';
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
import { Combobox } from '@/components/combobox';
import { RequestPhotoUpload } from '@/components/requests/request-photo-upload';
import { InlineFeedback } from '@/components/inline-feedback';

interface Location {
  id: string;
  name: string;
}

interface RequestSubmitFormProps {
  locations: Location[];
}

export function RequestSubmitForm({ locations }: RequestSubmitFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const locationOptions = locations.map((loc) => ({
    label: loc.name,
    value: loc.id,
  }));

  const form = useForm<RequestSubmitFormData>({
    resolver: zodResolver(requestSubmitSchema),
    defaultValues: {
      description: '',
      location_id: '',
    },
  });

  const onSubmit = async (data: RequestSubmitFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create the request
      const result = await createRequest(data);

      if (result?.serverError) {
        setError(result.serverError);
        return;
      }

      if (!result?.data?.requestId) {
        setError('Failed to create request. Please try again.');
        return;
      }

      const { requestId } = result.data;

      // Step 2: Upload photos if any were selected
      if (photoFiles.length > 0) {
        const formData = new FormData();
        formData.append('request_id', requestId);
        for (const file of photoFiles) {
          formData.append('photos', file);
        }

        const uploadResponse = await fetch('/api/uploads/request-photos', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          // Photo upload failed — request is still saved, just without photos
          // Don't block the user from continuing; they can add photos by editing the request
          console.warn('Photo upload failed:', await uploadResponse.text());
        }
      }

      // Redirect to request list
      router.push('/requests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Description */}
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
                  placeholder="Describe the maintenance issue in detail..."
                  className="min-h-32 resize-y"
                  maxLength={1000}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                {field.value.length}/1000 characters (minimum 10)
              </p>
            </FormItem>
          )}
        />

        {/* Location */}
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
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photos */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Photos (optional)</p>
          <div className="flex flex-wrap gap-2">
            <RequestPhotoUpload
              onChange={setPhotoFiles}
              disabled={isSubmitting}
              maxPhotos={3}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Up to 3 photos. JPEG, PNG, or WebP. Max 5MB each.
          </p>
        </div>

        {/* Error feedback */}
        {error && (
          <InlineFeedback
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Submit button */}
        <Button type="submit" disabled={isSubmitting} className="w-auto max-sm:w-full">
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </Form>
  );
}
