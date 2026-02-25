'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetEditSchema, AssetEditFormData } from '@/lib/validations/asset-schema';
import type { InventoryItemWithRelations } from '@/lib/types/database';
import { updateAsset } from '@/app/actions/asset-actions';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
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

interface AssetEditFormProps {
  asset: InventoryItemWithRelations;
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  onCancel: () => void;
  onSuccess: () => void;
}

export function AssetEditForm({
  asset,
  categories,
  locations,
  onCancel,
  onSuccess,
}: AssetEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const locationOptions = locations.map((l) => ({ label: l.name, value: l.id }));

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

  const onSubmit = async (data: AssetEditFormData) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await updateAsset({ asset_id: asset.id, data });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
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
    }
  };

  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-sm font-semibold mb-4">Edit Asset</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
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
          </div>

          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
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
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <FormField
              control={form.control}
              name="acquisition_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acquisition Date</FormLabel>
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
          </div>

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

          {feedback && (
            <InlineFeedback
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
