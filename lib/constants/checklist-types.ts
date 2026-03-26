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

// ============================================================================
// Checklist Item Type Badge Colors
// Maps DB type keys to Tailwind badge color classes
// ============================================================================

export const CHECKLIST_TYPE_COLORS: Record<ChecklistItemType, string> = {
  checkbox:  'bg-blue-100 text-blue-700',
  pass_fail: 'bg-green-100 text-green-700',
  numeric:   'bg-purple-100 text-purple-700',
  text:      'bg-orange-100 text-orange-700',
  photo:     'bg-pink-100 text-pink-700',
  dropdown:  'bg-yellow-100 text-yellow-700',
};
