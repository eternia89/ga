'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FileText } from 'lucide-react';
import { assetCreateSchema, AssetCreateFormData } from '@/lib/validations/asset-schema';
import { createAsset } from '@/app/actions/asset-actions';
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
import { Combobox } from '@/components/combobox';
import { PhotoUpload } from '@/components/media/photo-upload';
import { InlineFeedback } from '@/components/inline-feedback';

interface Category {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface InvoiceFile {
  file: File;
  name: string;
}

interface AssetSubmitFormProps {
  categories: Category[];
  locations: Location[];
  onSuccess?: () => void;
  extraCompanies?: { id: string; name: string }[];
  allLocations?: { id: string; name: string; company_id: string }[];
  primaryCompanyName: string;
  primaryCompanyId: string;
}

const MAX_INVOICE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_INVOICE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_INVOICES = 5;

export function AssetSubmitForm({ categories, locations, onSuccess, extraCompanies, allLocations, primaryCompanyName, primaryCompanyId }: AssetSubmitFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<InvoiceFile[]>([]);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  // Use all locations filtered by selected company when multi-company mode, else primary locations
  const locationOptions = (selectedCompanyId && allLocations && allLocations.length > 0
    ? allLocations.filter(l => l.company_id === selectedCompanyId)
    : locations
  ).map((loc) => ({
    label: loc.name,
    value: loc.id,
  }));

  const form = useForm<AssetCreateFormData>({
    resolver: zodResolver(assetCreateSchema),
    defaultValues: {
      name: '',
      category_id: '',
      location_id: '',
      brand: '',
      model: '',
      serial_number: '',
      description: '',
      acquisition_date: new Date().toISOString().split('T')[0],
      warranty_expiry: '',
      company_id: primaryCompanyId,
    },
  });

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setInvoiceError(null);

    const valid: InvoiceFile[] = [];
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

    const available = MAX_INVOICES - invoiceFiles.length;
    const toAdd = valid.slice(0, available);
    setInvoiceFiles((prev) => [...prev, ...toAdd]);

    if (invoiceInputRef.current) {
      invoiceInputRef.current.value = '';
    }
  };

  const removeInvoice = (index: number) => {
    setInvoiceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AssetCreateFormData) => {
    // Validate condition photos
    if (photoFiles.length === 0) {
      setPhotoError('At least 1 condition photo is required');
      return;
    }
    setPhotoError(null);

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Create the asset (include selected company if multi-company mode)
      const effectiveCompanyId =
        extraCompanies && extraCompanies.length > 1 && selectedCompanyId
          ? selectedCompanyId
          : primaryCompanyId;
      const result = await createAsset({ ...data, company_id: effectiveCompanyId });

      if (result?.serverError) {
        setError(result.serverError);
        return;
      }

      if (!result?.data?.assetId) {
        setError('Failed to create asset. Please try again.');
        return;
      }

      const { assetId } = result.data;

      // Step 2: Upload condition photos
      const photoFormData = new FormData();
      photoFormData.append('asset_id', assetId);
      photoFormData.append('photo_type', 'creation');
      for (const file of photoFiles) {
        photoFormData.append('photos', file);
      }

      const photoUploadResponse = await fetch('/api/uploads/asset-photos', {
        method: 'POST',
        body: photoFormData,
      });

      if (!photoUploadResponse.ok) {
        // Photos failed but asset was created — show warning and continue
        if (onSuccess) {
          onSuccess();
        } else {
          setSuccess(
            `Asset created (${result.data.displayId}), but condition photo upload failed. You can add photos from the detail page.`
          );
          setTimeout(() => {
            router.push(`/inventory/${assetId}`);
          }, 2000);
        }
        return;
      }

      // Step 3: Upload invoice files (if any)
      if (invoiceFiles.length > 0) {
        const invoiceFormData = new FormData();
        invoiceFormData.append('asset_id', assetId);
        for (const { file } of invoiceFiles) {
          invoiceFormData.append('invoices', file);
        }

        const invoiceUploadResponse = await fetch('/api/uploads/asset-invoices', {
          method: 'POST',
          body: invoiceFormData,
        });

        if (!invoiceUploadResponse.ok) {
          // Invoice upload failed but asset and photos are fine
          if (onSuccess) {
            onSuccess();
          } else {
            setSuccess(
              `Asset created (${result.data.displayId}), but invoice upload failed. You can add invoices from the detail page.`
            );
            setTimeout(() => {
              router.push(`/inventory/${assetId}`);
            }, 2000);
          }
          return;
        }
      }

      // Reset company selection on success
      setSelectedCompanyId(null);

      // All done — close dialog or redirect to detail page
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/inventory/${assetId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Company field — always visible */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          {extraCompanies && extraCompanies.length > 1 ? (
            <Combobox
              options={extraCompanies.map(c => ({ label: c.name, value: c.id }))}
              value={selectedCompanyId ?? extraCompanies[0].id}
              onValueChange={(val) => {
                setSelectedCompanyId(val);
                form.setValue('company_id', val);
                form.setValue('location_id', '');
              }}
              placeholder="Select company"
              searchPlaceholder="Search companies..."
              emptyText="No companies found"
              disabled={isSubmitting}
            />
          ) : (
            <Input
              value={primaryCompanyName}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          )}
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
            name="location_id"
            render={({ field }) => (
              <FormItem>
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
                  <Input
                    type="date"
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
            name="warranty_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warranty Expiry</FormLabel>
                <FormControl>
                  <Input
                    type="date"
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Optional notes or description for this asset..."
                    className="min-h-24 resize-y"
                    maxLength={200}
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  {(field.value ?? '').length}/200 characters
                </p>
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

          {/* Condition Photos (required) */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Condition Photos <span className="text-destructive">*</span>
            </p>
            <p className="text-xs text-muted-foreground">
              At least 1 photo is required. Up to 5 photos. JPEG, PNG, or WebP. Max 5MB each.
            </p>

            <PhotoUpload
              onChange={setPhotoFiles}
              maxPhotos={5}
              required
              showCount
              disabled={isSubmitting}
              enableAnnotation={false}
            />

            {photoError && (
              <p className="text-sm text-destructive">{photoError}</p>
            )}
          </div>

          {/* Invoice Files (optional) */}
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium">Invoice Files</p>
            <p className="text-xs text-muted-foreground">
              Optional. Up to {MAX_INVOICES} files. PDF, JPEG, PNG, or WebP. Max 10MB each.
            </p>

            <div className="space-y-2">
              {invoiceFiles.length > 0 && (
                <div className="space-y-2">
                  {invoiceFiles.map((invoice, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{invoice.name}</span>
                      </div>
                      {!isSubmitting && (
                        <button
                          type="button"
                          onClick={() => removeInvoice(index)}
                          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${invoice.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {invoiceFiles.length < MAX_INVOICES && !isSubmitting && (
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
                {invoiceFiles.length} / {MAX_INVOICES} files
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
        {error && (
          <InlineFeedback
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}
        {success && (
          <InlineFeedback
            type="success"
            message={success}
            onDismiss={() => setSuccess(null)}
          />
        )}

        {/* Submit button */}
        <Button type="submit" disabled={isSubmitting} className="w-auto max-sm:w-full">
          {isSubmitting ? 'Creating Asset...' : 'Create Asset'}
        </Button>
      </form>
    </Form>
  );
}
