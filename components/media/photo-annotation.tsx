'use client';

import { useRef, useState } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { Minus, Plus, RotateCcw, Trash2, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface PhotoAnnotationProps {
  imageUrl: string;
  onSave: (file: File) => void;
  onCancel: () => void;
  open: boolean;
}

const PRESET_COLORS = [
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
];

export function PhotoAnnotation({ imageUrl, onSave, onCancel, open }: PhotoAnnotationProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [saving, setSaving] = useState(false);

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await canvasRef.current.exportImage('png');
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'annotated.png', { type: 'image/png' });
      onSave(file);
    } catch (error) {
      console.error('Failed to export annotated image:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle>Annotate Photo</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 shrink-0 flex-wrap">
          {/* Color picker */}
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                title={color.label}
                onClick={() => setStrokeColor(color.value)}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: color.value,
                  borderColor: strokeColor === color.value ? '#6366f1' : 'transparent',
                  boxShadow: strokeColor === color.value ? '0 0 0 1px #6366f1' : 'none',
                }}
              />
            ))}
          </div>

          {/* Stroke width */}
          <div className="flex items-center gap-2 min-w-[140px]">
            <Minus className="w-3 h-3 text-muted-foreground shrink-0" />
            <Slider
              value={[strokeWidth]}
              min={2}
              max={8}
              step={1}
              onValueChange={([val]) => setStrokeWidth(val)}
              className="w-24"
            />
            <Plus className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-4 text-center">{strokeWidth}</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="outline" size="sm" onClick={handleUndo}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Undo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              <X className="w-3.5 h-3.5 mr-1.5" />
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="w-full h-full">
            <ReactSketchCanvas
              ref={canvasRef}
              backgroundImage={imageUrl}
              exportWithBackgroundImage={true}
              strokeWidth={strokeWidth}
              strokeColor={strokeColor}
              style={{ width: '100%', height: '100%', border: '1px solid hsl(var(--border))', borderRadius: '4px' }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
