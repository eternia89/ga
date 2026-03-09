'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { TemplateBuilderItem } from './template-builder-item';
import { CHECKLIST_TYPE_ORDER, CHECKLIST_TYPES } from '@/lib/constants/checklist-types';
import type { ChecklistItem, ChecklistItemType } from '@/lib/types/maintenance';

interface TemplateBuilderProps {
  items: ChecklistItem[];
  onItemsChange: (items: ChecklistItem[]) => void;
}

function createItem(type: ChecklistItemType, sortOrder: number): ChecklistItem {
  const base = {
    id: crypto.randomUUID(),
    label: '',
    sort_order: sortOrder,
  };

  switch (type) {
    case 'checkbox':
      return { ...base, type: 'checkbox' };
    case 'pass_fail':
      return { ...base, type: 'pass_fail' };
    case 'numeric':
      return { ...base, type: 'numeric' };
    case 'text':
      return { ...base, type: 'text' };
    case 'photo':
      return { ...base, type: 'photo' };
    case 'dropdown':
      return { ...base, type: 'dropdown', options: [''] };
  }
}

export function TemplateBuilder({ items, onItemsChange }: TemplateBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    onItemsChange(reordered);
  }

  function handleAddItem(type: ChecklistItemType) {
    const newItem = createItem(type, items.length);
    onItemsChange([...items, newItem]);
  }

  function handleUpdateItem(updated: ChecklistItem) {
    onItemsChange(items.map((item) => (item.id === updated.id ? updated : item)));
  }

  function handleDeleteItem(id: string) {
    const filtered = items
      .filter((item) => item.id !== id)
      .map((item, index) => ({ ...item, sort_order: index }));
    onItemsChange(filtered);
  }

  return (
    <div className="space-y-4">
      {/* Type-specific add buttons */}
      <div className="flex flex-wrap gap-2">
        {CHECKLIST_TYPE_ORDER.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddItem(type)}
            className="h-8 text-xs"
          >
            + {CHECKLIST_TYPES[type]}
          </Button>
        ))}
      </div>

      {/* Item list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item) => (
              <TemplateBuilderItem
                key={item.id}
                item={item}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Item count / empty state */}
      <div className="text-sm text-muted-foreground">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-6 text-center">
            Add at least one checklist item using the buttons above.
          </p>
        ) : (
          <p>{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        )}
      </div>
    </div>
  );
}
