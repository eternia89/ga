'use client';

import { useState, useCallback } from 'react';
import { Check, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
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
import type { ChecklistItem, ChecklistResponse } from '@/lib/types/maintenance';
import { DisplayId } from '@/components/display-id';

// ============================================================================
// Props
// ============================================================================

interface PMChecklistPreviewProps {
  templateName: string;
  checklist: ChecklistItem[];
  assetName: string;
  assetDisplayId: string;
  nextDueAt: string | null;
  assignedUserName: string | null;
}

// ============================================================================
// Convert ChecklistItem[] to ChecklistResponse-like shape for rendering
// ============================================================================

type PreviewItem = ChecklistResponse & { unit?: string; options?: string[] };

function toPreviewItems(items: ChecklistItem[]): PreviewItem[] {
  return items
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      item_id: item.id,
      type: item.type,
      label: item.label,
      value: null,
      ...(item.type === 'numeric' ? { unit: (item as { unit?: string }).unit } : {}),
      ...(item.type === 'dropdown' ? { options: (item as { options: string[] }).options } : {}),
    }));
}

// ============================================================================
// Main component
// ============================================================================

export function PMChecklistPreview({
  templateName,
  checklist,
  assetName,
  assetDisplayId,
  nextDueAt,
  assignedUserName,
}: PMChecklistPreviewProps) {
  const [items, setItems] = useState<PreviewItem[]>(() => toPreviewItems(checklist));

  const completedCount = items.filter(
    (r) => r.value !== null && r.value !== undefined
  ).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allComplete = completedCount === totalCount && totalCount > 0;

  const handleValueChange = useCallback((itemId: string, value: ChecklistResponse['value']) => {
    setItems((prev) =>
      prev.map((item) =>
        item.item_id === itemId
          ? { ...item, value, completed_at: value !== null ? new Date().toISOString() : undefined }
          : item
      )
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Info header card */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{templateName}</h2>

        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Asset</p>
            <p className="text-sm font-medium">
              {assetName}
              {assetDisplayId && (
                <span className="text-muted-foreground font-normal ml-1">(<DisplayId>{assetDisplayId}</DisplayId>)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Due Date</p>
            <p className="text-sm font-medium">
              {nextDueAt ? formatDate(nextDueAt) : 'Not scheduled'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Assigned To</p>
            <p className="text-sm font-medium">
              {assignedUserName ?? 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            This is a preview — values entered here are not saved.
          </p>
        </div>
      </div>

      {/* Checklist items section */}
      <div className="rounded-lg border p-6 space-y-5">
        {/* Progress header */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold">Checklist Items</h3>
          <div className="shrink-0 text-right">
            <span className="text-sm font-medium tabular-nums">
              {completedCount}/{totalCount}
            </span>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={[
                'h-full rounded-full transition-all duration-300',
                allComplete ? 'bg-green-500' : 'bg-primary',
              ].join(' ')}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{progressPct}%</p>
        </div>

        {/* All complete */}
        {allComplete && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-700">
              All {totalCount} checklist items completed
            </p>
          </div>
        )}

        {/* Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <PreviewChecklistItem
              key={item.item_id}
              item={item}
              onValueChange={handleValueChange}
            />
          ))}
        </div>

        {totalCount === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No checklist items found.
          </p>
        )}

        {/* End of checklist footer */}
        {totalCount > 0 && (
          <p className="text-sm text-muted-foreground text-center pt-2">
            End of checklist — {totalCount} {totalCount === 1 ? 'item' : 'items'} total
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PreviewChecklistItem — mirrors PMChecklistItem visuals, local state only
// ============================================================================

interface PreviewChecklistItemProps {
  item: PreviewItem;
  onValueChange: (itemId: string, value: ChecklistResponse['value']) => void;
}

function PreviewChecklistItem({ item, onValueChange }: PreviewChecklistItemProps) {
  const isCompleted = item.value !== null && item.value !== undefined;

  return (
    <div className="rounded-md border px-4 py-3 space-y-2">
      {/* Label row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
          )}
          <span className="text-sm font-medium leading-snug">{item.label}</span>
        </div>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
          {item.type.replace('_', '/')}
        </span>
      </div>

      {/* Input control */}
      <div className="pl-6">
        {item.type === 'checkbox' && (
          <PreviewCheckbox item={item} onValueChange={onValueChange} />
        )}
        {item.type === 'pass_fail' && (
          <PreviewPassFail item={item} onValueChange={onValueChange} />
        )}
        {item.type === 'numeric' && (
          <PreviewNumeric item={item} onValueChange={onValueChange} />
        )}
        {item.type === 'text' && (
          <PreviewText item={item} onValueChange={onValueChange} />
        )}
        {item.type === 'photo' && (
          <PreviewPhoto item={item} onValueChange={onValueChange} />
        )}
        {item.type === 'dropdown' && (
          <PreviewDropdown item={item} onValueChange={onValueChange} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Checkbox
// ============================================================================

function PreviewCheckbox({ item, onValueChange }: { item: PreviewItem; onValueChange: (id: string, v: ChecklistResponse['value']) => void }) {
  const checked = item.value === true;

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`preview-checkbox-${item.item_id}`}
        checked={checked}
        onCheckedChange={(val) => onValueChange(item.item_id, val === true)}
      />
      <label
        htmlFor={`preview-checkbox-${item.item_id}`}
        className="text-sm cursor-pointer select-none"
      >
        {checked ? 'Done' : 'Mark as done'}
      </label>
    </div>
  );
}

// ============================================================================
// Pass/Fail
// ============================================================================

function PreviewPassFail({ item, onValueChange }: { item: PreviewItem; onValueChange: (id: string, v: ChecklistResponse['value']) => void }) {
  const value = item.value as 'pass' | 'fail' | null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onValueChange(item.item_id, 'pass')}
        className={[
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'pass'
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ].join(' ')}
      >
        <Check className="h-3.5 w-3.5" />
        Pass
      </button>
      <button
        type="button"
        onClick={() => onValueChange(item.item_id, 'fail')}
        className={[
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'fail'
            ? 'bg-red-600 text-white hover:bg-red-700'
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
// Numeric
// ============================================================================

function PreviewNumeric({ item, onValueChange }: { item: PreviewItem; onValueChange: (id: string, v: ChecklistResponse['value']) => void }) {
  return (
    <div className="flex items-center gap-2 max-w-[200px]">
      <Input
        type="number"
        defaultValue=""
        onChange={(e) => {
          const val = e.target.value;
          onValueChange(item.item_id, val === '' ? null : parseFloat(val));
        }}
        className="h-8"
      />
      {item.unit && (
        <span className="text-sm text-muted-foreground shrink-0">{item.unit}</span>
      )}
    </div>
  );
}

// ============================================================================
// Text
// ============================================================================

function PreviewText({ item, onValueChange }: { item: PreviewItem; onValueChange: (id: string, v: ChecklistResponse['value']) => void }) {
  return (
    <Textarea
      defaultValue=""
      maxLength={1000}
      rows={3}
      placeholder="Enter notes..."
      onChange={(e) => {
        const val = e.target.value.trim();
        onValueChange(item.item_id, val === '' ? null : e.target.value);
      }}
      className="text-sm resize-none"
    />
  );
}

// ============================================================================
// Photo
// ============================================================================

function PreviewPhoto({ item, onValueChange }: { item: PreviewItem; onValueChange: (id: string, v: ChecklistResponse['value']) => void }) {
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      urls.push(URL.createObjectURL(files[i]));
    }
    setPreviews((prev) => [...prev, ...urls]);
    onValueChange(item.item_id, [...previews, ...urls]);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent cursor-pointer"
      />
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((url, i) => (
            <div
              key={i}
              className="h-16 w-16 rounded-md overflow-hidden border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Preview ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Dropdown
// ============================================================================

function PreviewDropdown({ item, onValueChange }: { item: PreviewItem; onValueChange: (id: string, v: ChecklistResponse['value']) => void }) {
  const options = item.options ?? [];
  const strValue = typeof item.value === 'string' ? item.value : '';

  return (
    <Select
      value={strValue}
      onValueChange={(val) => onValueChange(item.item_id, val)}
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
