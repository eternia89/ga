'use client';

import { useState, useRef, useCallback } from 'react';
import { Check, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { savePMChecklistItem } from '@/app/actions/pm-job-actions';
import type { ChecklistResponse } from '@/lib/types/maintenance';

interface PMChecklistItemProps {
  item: ChecklistResponse;
  jobId: string;
  canEdit: boolean;
  onSaved: (itemId: string, value: ChecklistResponse['value']) => void;
}

/**
 * Renders a single PM checklist item with type-appropriate input controls.
 * Supports 6 types: checkbox, pass_fail, numeric, text, photo, dropdown.
 *
 * Save behavior:
 * - checkbox, pass_fail, dropdown: immediate save on change
 * - text, numeric: debounced 500ms save on change
 *
 * Read-only mode (canEdit=false): renders values as static text/badges.
 */
export function PMChecklistItem({ item, jobId, canEdit, onSaved }: PMChecklistItemProps) {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { execute: executeSave, isPending: isSaving } = useAction(savePMChecklistItem, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        setSavedAt(new Date());
        setLocalError(null);
        setTimeout(() => setSavedAt(null), 2000);
      }
    },
    onError: ({ error }) => {
      setLocalError(error.serverError ?? 'Failed to save');
    },
  });

  const saveItem = useCallback(
    (value: ChecklistResponse['value']) => {
      setLocalError(null);
      executeSave({ jobId, itemId: item.item_id, value: value as boolean | string | number | null });
      onSaved(item.item_id, value);
    },
    [executeSave, jobId, item.item_id, onSaved]
  );

  const debouncedSave = useCallback(
    (value: ChecklistResponse['value']) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveItem(value), 500);
    },
    [saveItem]
  );

  // Save indicator
  const SaveIndicator = () => {
    if (isSaving) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </span>
      );
    }
    if (savedAt) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Saved
        </span>
      );
    }
    if (localError) {
      return (
        <span className="text-xs text-destructive">{localError}</span>
      );
    }
    return null;
  };

  // Completed indicator for read-only
  const isCompleted = item.value !== null && item.value !== undefined;

  return (
    <div className="rounded-md border px-4 py-3 space-y-2">
      {/* Label row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {isCompleted && (
            <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
          )}
          {!isCompleted && (
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
          )}
          <span className="text-sm font-medium leading-snug">{item.label}</span>
        </div>
        <div className="shrink-0">
          <SaveIndicator />
        </div>
      </div>

      {/* Input control — type-specific */}
      <div className="pl-6">
        {item.type === 'checkbox' && (
          <CheckboxControl item={item} canEdit={canEdit} onSave={saveItem} />
        )}
        {item.type === 'pass_fail' && (
          <PassFailControl item={item} canEdit={canEdit} onSave={saveItem} />
        )}
        {item.type === 'numeric' && (
          <NumericControl item={item} canEdit={canEdit} onSave={debouncedSave} />
        )}
        {item.type === 'text' && (
          <TextControl item={item} canEdit={canEdit} onSave={debouncedSave} />
        )}
        {item.type === 'photo' && (
          <PhotoReadOnlyControl item={item} />
        )}
        {item.type === 'dropdown' && (
          <DropdownControl item={item} canEdit={canEdit} onSave={saveItem} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Checkbox Control
// ============================================================================
function CheckboxControl({
  item,
  canEdit,
  onSave,
}: {
  item: ChecklistResponse;
  canEdit: boolean;
  onSave: (value: ChecklistResponse['value']) => void;
}) {
  const checked = item.value === true;

  if (!canEdit) {
    return (
      <div className="flex items-center gap-2">
        {checked ? (
          <span className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
            <Check className="h-4 w-4" />
            Done
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <X className="h-4 w-4" />
            Not done
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`checkbox-${item.item_id}`}
        checked={checked}
        onCheckedChange={(val) => onSave(val === true)}
      />
      <label
        htmlFor={`checkbox-${item.item_id}`}
        className="text-sm cursor-pointer select-none"
      >
        {checked ? 'Done' : 'Mark as done'}
      </label>
    </div>
  );
}

// ============================================================================
// Pass/Fail Control
// ============================================================================
function PassFailControl({
  item,
  canEdit,
  onSave,
}: {
  item: ChecklistResponse;
  canEdit: boolean;
  onSave: (value: ChecklistResponse['value']) => void;
}) {
  const value = item.value as 'pass' | 'fail' | null;

  if (!canEdit) {
    if (value === 'pass') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Pass
        </span>
      );
    }
    if (value === 'fail') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Fail
        </span>
      );
    }
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onSave('pass')}
        className={[
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'pass'
            ? 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
            : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ].join(' ')}
      >
        <Check className="h-3.5 w-3.5" />
        Pass
      </button>
      <button
        type="button"
        onClick={() => onSave('fail')}
        className={[
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'fail'
            ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
            : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ].join(' ')}
      >
        <X className="h-3.5 w-3.5" />
        Fail
      </button>
    </div>
  );
}

// ============================================================================
// Numeric Control
// ============================================================================
function NumericControl({
  item,
  canEdit,
  onSave,
}: {
  item: ChecklistResponse;
  canEdit: boolean;
  onSave: (value: ChecklistResponse['value']) => void;
}) {
  // item.label may include unit info from the parent; the unit is in the checklist definition
  // but ChecklistResponse snapshots the label only. We look at value type.
  const unit = (item as ChecklistResponse & { unit?: string }).unit;
  const numValue = typeof item.value === 'number' ? item.value : '';

  if (!canEdit) {
    return (
      <span className="text-sm">
        {item.value !== null && item.value !== undefined ? (
          <>
            {item.value}
            {unit && <span className="text-muted-foreground ml-1">{unit}</span>}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 max-w-[200px]">
      <Input
        type="number"
        defaultValue={numValue}
        onChange={(e) => {
          const val = e.target.value;
          onSave(val === '' ? null : parseFloat(val));
        }}
        className="h-8"
      />
      {unit && (
        <span className="text-sm text-muted-foreground shrink-0">{unit}</span>
      )}
    </div>
  );
}

// ============================================================================
// Text Control
// ============================================================================
function TextControl({
  item,
  canEdit,
  onSave,
}: {
  item: ChecklistResponse;
  canEdit: boolean;
  onSave: (value: ChecklistResponse['value']) => void;
}) {
  const textValue = typeof item.value === 'string' ? item.value : '';

  if (!canEdit) {
    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {textValue || <span className="text-muted-foreground">—</span>}
      </p>
    );
  }

  return (
    <Textarea
      defaultValue={textValue}
      maxLength={1000}
      rows={3}
      placeholder="Enter notes..."
      onChange={(e) => {
        const val = e.target.value.trim();
        onSave(val === '' ? null : e.target.value);
      }}
      className="text-sm resize-none"
    />
  );
}

// ============================================================================
// Photo Control — read-only display only (upload is separate flow via job photos API)
// ============================================================================
function PhotoReadOnlyControl({ item }: { item: ChecklistResponse }) {
  const urls = item.photo_urls ?? (Array.isArray(item.value) ? (item.value as string[]) : []);

  if (urls.length === 0) {
    return <span className="text-sm text-muted-foreground">No photos uploaded</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-16 w-16 rounded-md overflow-hidden border hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Photo ${i + 1}`}
            className="h-full w-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}

// ============================================================================
// Dropdown Control
// ============================================================================
function DropdownControl({
  item,
  canEdit,
  onSave,
}: {
  item: ChecklistResponse;
  canEdit: boolean;
  onSave: (value: ChecklistResponse['value']) => void;
}) {
  // options are stored in the ChecklistResponse via extended type shape
  const options = (item as ChecklistResponse & { options?: string[] }).options ?? [];
  const strValue = typeof item.value === 'string' ? item.value : '';

  if (!canEdit) {
    return (
      <span className="text-sm">
        {strValue || <span className="text-muted-foreground">—</span>}
      </span>
    );
  }

  return (
    <Select
      value={strValue}
      onValueChange={(val) => onSave(val)}
    >
      <SelectTrigger className="h-8 w-[200px]">
        <SelectValue placeholder="Select option..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
