'use client';

import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CHECKLIST_TYPES } from '@/lib/constants/checklist-types';
import type { ChecklistItem } from '@/lib/types/maintenance';

interface TemplateBuilderItemProps {
  item: ChecklistItem;
  onUpdate: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
}

const TYPE_COLORS: Record<ChecklistItem['type'], string> = {
  checkbox:  'bg-blue-100 text-blue-700',
  pass_fail: 'bg-green-100 text-green-700',
  numeric:   'bg-purple-100 text-purple-700',
  text:      'bg-orange-100 text-orange-700',
  photo:     'bg-pink-100 text-pink-700',
  dropdown:  'bg-yellow-100 text-yellow-700',
};

export function TemplateBuilderItem({ item, onUpdate, onDelete }: TemplateBuilderItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Local state for dropdown new option input
  const [newOption, setNewOption] = useState('');
  const newOptionInputRef = useRef<HTMLInputElement>(null);

  function handleLabelChange(value: string) {
    onUpdate({ ...item, label: value });
  }

  function handleUnitChange(value: string) {
    if (item.type !== 'numeric') return;
    onUpdate({ ...item, unit: value });
  }

  function handleAddOption() {
    if (item.type !== 'dropdown') return;
    const trimmed = newOption.trim();
    if (!trimmed) return;
    if (item.options.length >= 20) return;
    onUpdate({ ...item, options: [...item.options, trimmed] });
    setNewOption('');
    newOptionInputRef.current?.focus();
  }

  function handleRemoveOption(index: number) {
    if (item.type !== 'dropdown') return;
    onUpdate({ ...item, options: item.options.filter((_, i) => i !== index) });
  }

  function handleOptionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption();
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-start gap-3 rounded-lg border border-border bg-background p-3
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
      `}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="mt-1.5 shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Type badge */}
      <span
        className={`
          mt-1 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
          ${TYPE_COLORS[item.type]}
        `}
      >
        {CHECKLIST_TYPES[item.type]}
      </span>

      {/* Main content */}
      <div
        className={`flex-1 min-w-0 space-y-2 ${isDragging ? 'pointer-events-none' : ''}`}
      >
        {/* Label input */}
        <Input
          value={item.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Item label..."
          maxLength={200}
          className="h-8"
        />

        {/* Type-specific configuration */}
        {item.type === 'numeric' && (
          <Input
            value={item.unit ?? ''}
            onChange={(e) => handleUnitChange(e.target.value)}
            placeholder="Unit (e.g., PSI, °C, kg)"
            maxLength={20}
            className="h-8 max-w-[200px]"
          />
        )}

        {item.type === 'dropdown' && (
          <div className="space-y-2">
            {/* Existing options as chips */}
            {item.options.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.options.map((option, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium"
                  >
                    {option}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="ml-0.5 rounded-full text-muted-foreground hover:text-foreground"
                      aria-label={`Remove option: ${option}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add new option */}
            <div className="flex items-center gap-2">
              <Input
                ref={newOptionInputRef}
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={handleOptionKeyDown}
                placeholder="Add option..."
                maxLength={100}
                className="h-8 max-w-[240px]"
                disabled={item.options.length >= 20}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                disabled={!newOption.trim() || item.options.length >= 20}
                className="h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {item.options.length >= 20 && (
              <p className="text-xs text-muted-foreground">Maximum 20 options reached.</p>
            )}
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="mt-1 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Delete item"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
