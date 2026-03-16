import { z } from 'zod';
import { ASSET_STATUSES } from '@/lib/constants/asset-status';
import { isoDateString } from '@/lib/validations/helpers';

// Asset create/edit schema — all text fields capped per CLAUDE.md rules
export const assetCreateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be under 100 characters'),
  category_id: z.string().uuid({ message: 'Category is required' }),
  location_id: z.string().uuid({ message: 'Location is required' }),
  brand: z.string().max(100, 'Brand must be under 100 characters').optional(),
  model: z.string().max(100, 'Model must be under 100 characters').optional(),
  serial_number: z.string().max(100, 'Serial number must be under 100 characters').optional(),
  description: z.string().max(200, 'Description must be under 200 characters').optional(),
  acquisition_date: isoDateString('Acquisition date must be YYYY-MM-DD'),
  warranty_expiry: isoDateString().optional(),
  company_id: z.string().uuid({ message: 'Company is required' }),
});

export type AssetCreateFormData = z.infer<typeof assetCreateSchema>;

// Asset edit schema — same shape as create
export const assetEditSchema = assetCreateSchema;
export type AssetEditFormData = z.infer<typeof assetEditSchema>;

// Status change schema
export const assetStatusChangeSchema = z.object({
  asset_id: z.string().uuid({ message: 'Asset ID is required' }),
  new_status: z.enum(ASSET_STATUSES, { message: 'Invalid status' }),
  note: z.string().max(1000, 'Note must be under 1000 characters').optional(),
});

export type AssetStatusChangeFormData = z.infer<typeof assetStatusChangeSchema>;

// Transfer initiation schema — receiver_id optional to support location-only transfers
export const assetTransferSchema = z.object({
  asset_id: z.string().uuid({ message: 'Asset ID is required' }),
  to_location_id: z.string().uuid({ message: 'Destination location is required' }),
  receiver_id: z.string().uuid().optional(),
  notes: z.string().max(200, 'Notes must be under 200 characters').optional(),
});

export type AssetTransferFormData = z.infer<typeof assetTransferSchema>;

// Transfer acceptance schema
export const transferAcceptSchema = z.object({
  movement_id: z.string().uuid({ message: 'Movement ID is required' }),
});

export type TransferAcceptFormData = z.infer<typeof transferAcceptSchema>;

// Transfer rejection schema — reason required
export const transferRejectSchema = z.object({
  movement_id: z.string().uuid({ message: 'Movement ID is required' }),
  reason: z.string()
    .min(1, 'Reason is required')
    .max(1000, 'Reason must be under 1000 characters'),
});

export type TransferRejectFormData = z.infer<typeof transferRejectSchema>;

// Transfer cancellation schema
export const transferCancelSchema = z.object({
  movement_id: z.string().uuid({ message: 'Movement ID is required' }),
});

export type TransferCancelFormData = z.infer<typeof transferCancelSchema>;
