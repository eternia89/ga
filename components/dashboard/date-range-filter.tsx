'use client';

import { useState } from 'react';
import { useQueryStates, parseAsString } from 'nuqs';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  format,
  parseISO,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Preset = 'today' | 'week' | 'month' | 'quarter' | 'custom';

const presets: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'custom', label: 'Custom' },
];

function getPresetRange(preset: Exclude<Preset, 'custom'>): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'quarter':
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
  }
}

function detectActivePreset(from: string | null, to: string | null): Preset {
  if (!from || !to) return 'month';

  // Check each preset to see if it matches the current from/to
  const presetsToCheck: Exclude<Preset, 'custom'>[] = ['today', 'week', 'month', 'quarter'];
  for (const preset of presetsToCheck) {
    const range = getPresetRange(preset);
    if (
      format(range.from, 'yyyy-MM-dd') === from &&
      format(range.to, 'yyyy-MM-dd') === to
    ) {
      return preset;
    }
  }
  return 'custom';
}

export function DateRangeFilter() {
  const [params, setParams] = useQueryStates(
    { from: parseAsString, to: parseAsString },
    { shallow: false }
  );

  // Determine active preset
  const activePreset = detectActivePreset(params.from, params.to);

  // Custom range local state (only used when preset = 'custom')
  const [customFrom, setCustomFrom] = useState(params.from ?? '');
  const [customTo, setCustomTo] = useState(params.to ?? '');

  const handlePresetClick = (preset: Preset) => {
    if (preset === 'custom') {
      // Entering custom mode — keep existing range but allow editing
      void setParams({
        from: customFrom || params.from,
        to: customTo || params.to,
      });
      return;
    }
    const range = getPresetRange(preset);
    const fromStr = format(range.from, 'yyyy-MM-dd');
    const toStr = format(range.to, 'yyyy-MM-dd');
    setCustomFrom(fromStr);
    setCustomTo(toStr);
    void setParams({ from: fromStr, to: toStr });
  };

  const handleCustomFromChange = (value: string) => {
    setCustomFrom(value);
    if (value && customTo) {
      void setParams({ from: value, to: customTo });
    }
  };

  const handleCustomToChange = (value: string) => {
    setCustomTo(value);
    if (customFrom && value) {
      void setParams({ from: customFrom, to: value });
    }
  };

  // Display range text
  const displayFrom = params.from
    ? format(parseISO(params.from), 'dd-MM-yyyy')
    : format(startOfMonth(new Date()), 'dd-MM-yyyy');
  const displayTo = params.to
    ? format(parseISO(params.to), 'dd-MM-yyyy')
    : format(endOfMonth(new Date()), 'dd-MM-yyyy');

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Range display */}
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {displayFrom} &ndash; {displayTo}
      </span>

      {/* Preset buttons */}
      <div className="flex items-center gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant={activePreset === preset.id ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 px-2.5 text-xs',
              activePreset === preset.id && 'font-semibold'
            )}
            onClick={() => handlePresetClick(preset.id)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom date inputs — only visible when custom is active */}
      {activePreset === 'custom' && (
        <div className="flex items-center gap-1">
          <div className="flex flex-col gap-0.5">
            <Label className="text-xs text-muted-foreground sr-only">From</Label>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => handleCustomFromChange(e.target.value)}
              className="h-7 w-[140px] text-xs"
              aria-label="From date"
            />
          </div>
          <span className="text-muted-foreground text-sm">–</span>
          <div className="flex flex-col gap-0.5">
            <Label className="text-xs text-muted-foreground sr-only">To</Label>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => handleCustomToChange(e.target.value)}
              className="h-7 w-[140px] text-xs"
              aria-label="To date"
            />
          </div>
        </div>
      )}
    </div>
  );
}
