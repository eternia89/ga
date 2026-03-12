'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FileText } from 'lucide-react';
import { assetEditSchema, AssetEditFormData } from '@/lib/validations/asset-schema';
import type { InventoryItemWithRelations } from '@/lib/types/database';
import { updateAsset, deleteAssetPhotos } from '@/app/actions/asset-actions';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import { PhotoUpload } from '@/components/media/photo-upload';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ExistingPhoto {
  id: string;
  url: string;
  fileName: string;
}

interface ExistingInvoice {
  id: string;
  url: string;
  fileName: string;
}

interface NewInvoiceFile {
  file: File;
  name: string;
}

const MAX_INVOICE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_INVOICE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_INVOICES = 5;

interface AssetEditFormProps {
  asset: InventoryItemWithRelations;
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  existingPhotos?: ExistingPhoto[];
  existingInvoices?: ExistingInvoice[];
  onSuccess: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
  formId?: string;
  onDirtyChange?: (isDirty: boolean) => void;
  companyName?: string;
}

export function AssetEditForm({
  asset,
  categories,
  locations,
  existingPhotos = [],
  existingInvoices = [],
  onSuccess,
  onSubmittingChange,
  formId,
  onDirtyChange,
  companyName,
}: AssetEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Photo state
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [visibleExistingPhotos, setVisibleExistingPhotos] = useState(existingPhotos);

  // Invoice state
  const [newInvoices, setNewInvoices] = useState<NewInvoiceFile[]>([]);
  const [deletedInvoiceIds, setDeletedInvoiceIds] = useState<string[]>([]);
  const [visibleExistingInvoices, setVisibleExistingInvoices] = useState(existingInvoices);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  const form = useForm<AssetEditFormData>({
    resolver: zodResolver(assetEditSchema),
    defaultValues: {
      name: asset.name ?? '',
      category_id: asset.category_id ?? '',
      location_id: asset.location_id ?? '',
      brand: asset.brand ?? '',
      model: asset.model ?? '',
      serial_number: asset.serial_number ?? '',
      description: asset.description ?? '',
      acquisition_date: asset.acquisition_date ?? '',
      warranty_expiry: asset.warranty_expiry ?? '',
    },
  });

  const formIsDirty = form.formState.isDirty;
  useEffect(() => {
    onDirtyChange?.(formIsDirty);
  }, [formIsDirty, onDirtyChange]);

  const handleExistingPhotoRemove = (photoId: string) => {
    setDeletedPhotoIds((prev) => [...prev, photoId]);
    setVisibleExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleExistingInvoiceRemove = (invoiceId: string) => {
    setDeletedInvoiceIds((prev) => [...prev, invoiceId]);
    setVisibleExistingInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
  };

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setInvoiceError(null);

    const valid: NewInvoiceFile[] = [];
    for (const file of selected) {
      if (file.size > MAX_INVOICE_SIZE_BYTES) {
        setInvoiceError(`${file.name} exceeds 10MB limit`);
        continue;
      }
      if (!ALLOWED_INVOICE_TYPES.includes(file.type)) {
        setInvoiceError(`${file.name} is not a supported file type`);
        continue;
      }
      valid.push({ file, name: file.name });
    }

    const totalInvoices = visibleExistingInvoices.length + newInvoices.length;
    const available = MAX_INVOICES - totalInvoices;
    const toAdd = valid.slice(0, available);
    setNewInvoices((prev) => [...prev, ...toAdd]);

    if (invoiceInputRef.current) {
      invoiceInputRef.current.value = '';
    }
  };

  const removeNewInvoice = (index: number) => {
    setNewInvoices((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AssetEditFormData) => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setFeedback(null);

    try {
      // Step 1: Update asset fields
      const result = await updateAsset({ asset_id: asset.id, data });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }

      // Step 2: Delete removed condition photos (if any)
      if (deletedPhotoIds.length > 0) {
        const deleteResult = await deleteAssetPhotos({
          photo_ids: deletedPhotoIds,
          bucket: 'asset-photos',
        });
        if (deleteResult?.serverError) {
          setFeedback({ type: 'error', message: 'Asset saved but failed to delete photos. Try again.' });
          onSuccess();
          return;
        }
        setDeletedPhotoIds([]);
      }

      // Step 3: Delete removed invoices (if any)
      if (deletedInvoiceIds.length > 0) {
        const deleteResult = await deleteAssetPhotos({
          photo_ids: deletedInvoiceIds,
          bucket: 'asset-invoices',
        });
        if (deleteResult?.serverError) {
          setFeedback({ type: 'error', message: 'Asset saved but failed to delete invoices. Try again.' });
          onSuccess();
          return;
        }
        setDeletedInvoiceIds([]);
      }

      // Step 4: Upload new condition photos (if any)
      if (newPhotos.length > 0) {
        const photoFormData = new FormData();
        photoFormData.append('asset_id', asset.id);
        photoFormData.append('photo_type', 'creation');
        for (const file of newPhotos) {
          photoFormData.append('photos', file);
        }

        const photoRes = await fetch('/api/uploads/asset-photos', {
          method: 'POST',
          body: photoFormData,
        });

        if (!photoRes.ok) {
          setFeedback({ type: 'error', message: 'Asset saved but photo upload failed. Try again.' });
          onSuccess();
          return;
        }
        setNewPhotos([]);
      }

      // Step 5: Upload new invoices (if any)
      if (newInvoices.length > 0) {
        const invoiceFormData = new FormData();
        invoiceFormData.append('asset_id', asset.id);
        for (const { file } of newInvoices) {
          invoiceFormData.append('invoices', file);
        }

        const invoiceRes = await fetch('/api/uploads/asset-invoices', {
          method: 'POST',
          body: invoiceFormData,
        });

        if (!invoiceRes.ok) {
          setFeedback({ type: 'error', message: 'Asset saved but invoice upload failed. Try again.' });
          onSuccess();
          return;
        }
        setNewInvoices([]);
      }

      setFeedback({ type: 'success', message: 'Asset updated successfully' });
      onSuccess();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save changes',
      });
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  const totalInvoiceCount = visibleExistingInvoices.length + newInvoices.length;

  return (
    <Form {...form}>
      <form id={formId ?? 'asset-edit-form'} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company — always shown, always disabled */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Input
            value={companyName ?? ''}
            disabled
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
        </div>

        {/* Section 1: Asset Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Asset Details
          </h2>
          <Separator />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Air Conditioner Unit 1"
                  maxLength={100}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
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
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Daikin"
                  maxLength={100}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. FTV20AXV14"
                  maxLength={100}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serial_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. SN123456789"
                  maxLength={100}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acquisition_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Acquisition Date <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="date" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="warranty_expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warranty Expiry</FormLabel>
              <FormControl>
                <Input type="date" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional notes or description..."
                  className="min-h-20 resize-y"
                  maxLength={200}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>

        {/* Section 2: Attachments */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Attachments
          </h2>
          <Separator />

          {/* Condition Photos */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Condition Photos</p>
            <p className="text-xs text-muted-foreground">
              Up to 5 photos. JPEG, PNG, or WebP. Max 5MB each.
            </p>

            <PhotoUpload
              onChange={setNewPhotos}
              maxPhotos={5}
              existingPhotos={visibleExistingPhotos}
              onRemoveExisting={handleExistingPhotoRemove}
              disabled={isSubmitting}
              showCount
              enableAnnotation={false}
            />
          </div>

          {/* Invoice Files */}
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium">Invoice Files</p>
            <p className="text-xs text-muted-foreground">
              Up to {MAX_INVOICES} files. PDF, JPEG, PNG, or WebP. Max 10MB each.
            </p>

            <div className="space-y-2">
              {visibleExistingInvoices.map((invoice) => {
                const isImage = /\.(jpe?g|png|webp)$/i.test(invoice.fileName);
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <a
                      href={invoice.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      {isImage ? (
                        <img
                          src={invoice.url}
                          alt={invoice.fileName}
                          className="w-10 h-10 object-cover rounded shrink-0"
                        />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm truncate">{invoice.fileName}</span>
                    </a>
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => handleExistingInvoiceRemove(invoice.id)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${invoice.fileName}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {newInvoices.map((invoice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{invoice.name}</span>
                    <span className="text-xs text-blue-600 shrink-0">New</span>
                  </div>
                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={() => removeNewInvoice(index)}
                      className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${invoice.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {totalInvoiceCount < MAX_INVOICES && !isSubmitting && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => invoiceInputRef.current?.click()}
                >
                  Add Invoice File
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                {totalInvoiceCount} / {MAX_INVOICES} files
              </p>

              {invoiceError && (
                <p className="text-sm text-destructive">{invoiceError}</p>
              )}
            </div>
          </div>

          <input
            ref={invoiceInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            onChange={handleInvoiceFileChange}
            multiple
            disabled={isSubmitting}
          />
        </div>

        {/* Feedback */}
        {feedback && (
          <InlineFeedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

      </form>
    </Form>
  );
}
