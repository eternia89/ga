import type { ChecklistItemType } from '@/lib/types/maintenance';

// ============================================================================
// Checklist Item Type Labels
// Maps DB type keys to human-readable labels
// ============================================================================

export const CHECKLIST_TYPES: Record<ChecklistItemType, string> = {
  checkbox:  'Checkbox',
  pass_fail: 'Pass/Fail',
  numeric:   'Numeric',
  text:      'Text',
  photo:     'Photo',
  dropdown:  'Dropdown',
};

// ============================================================================
// Checklist Item Type Icons
// Maps DB type keys to icon identifiers for the template builder UI
// Using descriptive strings — actual icon components resolved in UI layer
// ============================================================================

export const CHECKLIST_TYPE_ICONS: Record<ChecklistItemType, string> = {
  checkbox:  'check-square',
  pass_fail: 'thumbs-up',
  numeric:   'hash',
  text:      'type',
  photo:     'camera',
  dropdown:  'list',
};

// ============================================================================
// Ordered list of checklist types for "Add item" buttons in template builder
// ============================================================================

export const CHECKLIST_TYPE_ORDER: ChecklistItemType[] = [
  'checkbox',
  'pass_fail',
  'numeric',
  'text',
  'photo',
  'dropdown',
];
