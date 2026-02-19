'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { triageSchema, TriageFormData } from '@/lib/validations/request-schema';
import { RequestWithRelations } from '@/lib/types/database';
import { triageRequest } from '@/app/actions/request-actions';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import { PhotoLightbox } from './request-photo-lightbox';
import { RequestEditForm } from './request-edit-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PRIORITY_LABELS } from '@/lib/constants/request-status';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

interface RequestDetailInfoProps {
  request: RequestWithRelations;
  photoUrls: PhotoItem[];
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onTriageSuccess: () => void;
}

export function RequestDetailInfo({
  request,
  photoUrls,
  categories,
  users,
  locations,
  currentUserId,
  currentUserRole,
  isEditing,
  onEditToggle,
  onTriageSuccess,
}: RequestDetailInfoProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [triageSubmitting, setTriageSubmitting] = useState(false);
  const [triageFeedback, setTriageFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const isRequester = request.requester_id === currentUserId;
  const isEditable = isRequester && request.status === 'submitted';
  const canTriage = isGaLeadOrAdmin && request.status === 'submitted';

  const triageForm = useForm<TriageFormData>({
    resolver: zodResolver(triageSchema),
    defaultValues: {
      category_id: request.category_id ?? '',
      priority: request.priority ?? undefined,
      assigned_to: request.assigned_to ?? '',
    },
  });

  const handleTriageSubmit = async (data: TriageFormData) => {
    setTriageSubmitting(true);
    setTriageFeedback(null);

    try {
      const result = await triageRequest({ id: request.id, data });
      if (result?.serverError) {
        setTriageFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setTriageFeedback({ type: 'success', message: 'Request triaged successfully' });
      onTriageSuccess();
    } catch (err) {
      setTriageFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to triage',
      });
    } finally {
      setTriageSubmitting(false);
    }
  };

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const userOptions = users.map((u) => ({ label: u.name, value: u.id }));

  // Show edit form when requester is editing a submitted request
  if (isEditing && isEditable) {
    return (
      <>
        <RequestEditForm
          request={request}
          locations={locations}
          existingPhotos={photoUrls}
          onCancel={onEditToggle}
          onSuccess={onEditToggle}
        />
        {lightboxSrc && (
          <PhotoLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Description
          </h3>
          <p className="text-sm whitespace-pre-wrap">
            {request.description ?? '—'}
          </p>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Location
          </h3>
          <p className="text-sm">
            {request.location?.name ?? <span className="text-muted-foreground">—</span>}
          </p>
        </div>

        {/* Photos */}
        {photoUrls.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Photos
            </h3>
            <div className="flex flex-wrap gap-2">
              {photoUrls.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxSrc(photo.url)}
                  className="w-20 h-20 shrink-0 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity"
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
          </div>
        )}

        {/* Triage fields — shown for GA Lead/Admin (editable on submitted, read-only otherwise) */}
        {(canTriage || request.category_id || request.priority || request.assigned_to) && (
          <div id="triage-section">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Triage Details
            </h3>

            {canTriage ? (
              /* Inline triage form for GA Lead/Admin on submitted requests */
              <Form {...triageForm}>
                <form
                  onSubmit={triageForm.handleSubmit(handleTriageSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={triageForm.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Category <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Combobox
                            options={categoryOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select category..."
                            searchPlaceholder="Search categories..."
                            emptyText="No categories found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={triageForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Priority <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={triageForm.control}
                    name="assigned_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          PIC <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Combobox
                            options={userOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select PIC..."
                            searchPlaceholder="Search users..."
                            emptyText="No users found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {triageFeedback && (
                    <InlineFeedback
                      type={triageFeedback.type}
                      message={triageFeedback.message}
                      onDismiss={() => setTriageFeedback(null)}
                    />
                  )}

                  <Button type="submit" disabled={triageSubmitting}>
                    {triageSubmitting ? 'Triaging...' : 'Save Triage'}
                  </Button>
                </form>
              </Form>
            ) : (
              /* Read-only triage fields for other roles or after triage */
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Category</dt>
                  <dd className="text-sm mt-0.5">
                    {request.category?.name ?? <span className="text-muted-foreground">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Priority</dt>
                  <dd className="text-sm mt-0.5">
                    {request.priority
                      ? (PRIORITY_LABELS[request.priority] ?? request.priority)
                      : <span className="text-muted-foreground">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Person in Charge (PIC)</dt>
                  <dd className="text-sm mt-0.5">
                    {request.assigned_user?.name ?? <span className="text-muted-foreground">—</span>}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </div>

      {lightboxSrc && (
        <PhotoLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}
