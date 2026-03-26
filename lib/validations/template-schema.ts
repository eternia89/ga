import { z } from 'zod';
import { optionalUuid } from '@/lib/validations/helpers';

// ============================================================================
// Checklist Item Base — common fields for all 6 item types
// ============================================================================

const checklistItemBase = z.object({
  id:         z.string().uuid(),
  label:      z.string().min(1, 'Label is required').max(200),
  sort_order: z.number().int().min(0),
});

// ============================================================================
// 6 type-specific checklist item schemas (discriminated union)
// ============================================================================

const checkboxItem  = checklistItemBase.extend({ type: z.literal('checkbox') });
const passFailItem  = checklistItemBase.extend({ type: z.literal('pass_fail') });
const numericItem   = checklistItemBase.extend({
  type: z.literal('numeric'),
  unit: z.string().max(20).optional(),
});
const textItem      = checklistItemBase.extend({ type: z.literal('text') });
const photoItem     = checklistItemBase.extend({ type: z.literal('photo') });
const dropdownItem  = checklistItemBase.extend({
  type:    z.literal('dropdown'),
  options: z.array(z.string().max(100)).min(1, 'At least one option required').max(20),
});

// ============================================================================
// checklistItemSchema — discriminated union on 'type' field
// ============================================================================

export const checklistItemSchema = z.discriminatedUnion('type', [
  checkboxItem,
  passFailItem,
  numericItem,
  textItem,
  photoItem,
  dropdownItem,
]);

// ============================================================================
// templateCreateSchema — template creation / editing
// Templates can be edited freely per CONTEXT.md
// ============================================================================

export const templateCreateSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(60),
  description: z.string().max(200).optional(),
  category_id: optionalUuid(),
  checklist:   z.array(checklistItemSchema).min(1, 'At least one checklist item required').max(100, 'Maximum 100 checklist items'),
});

// Templates can be freely edited (same schema for create and edit)
export const templateEditSchema = templateCreateSchema;

// ============================================================================
// Exported types
// ============================================================================

export type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;
export type TemplateCreateFormData = z.input<typeof templateCreateSchema>;
export type TemplateEditFormData = z.input<typeof templateEditSchema>;
