'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { TemplateDetail } from './template-detail';
import type { MaintenanceTemplate } from '@/lib/types/maintenance';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface TemplateViewModalProps {
  templateId: string | null;
  onOpenChange: (open: boolean) => void;
  userRole: string;
  onActionSuccess?: () => void;
  /** Ordered list of template IDs for prev/next navigation */
  templateIds?: string[];
  /** Called when user navigates to a different template */
  onNavigate?: (templateId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function TemplateViewModal({
  templateId,
  onOpenChange,
  userRole,
  onActionSuccess,
  templateIds = [],
  onNavigate,
}: TemplateViewModalProps) {
  const router = useRouter();

  // Data states
  const [template, setTemplate] = useState<MaintenanceTemplate | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Navigation
  const currentIndex = templateId ? templateIds.indexOf(templateId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < templateIds.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      onNavigate?.(templateIds[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      onNavigate?.(templateIds[currentIndex + 1]);
    }
  };

  // URL sync
  useEffect(() => {
    if (templateId) {
      window.history.replaceState(null, '', '?view=' + templateId);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [templateId]);

  // Data fetching
  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch template with category join
      const [templateResult, categoriesResult] = await Promise.all([
        supabase
          .from('maintenance_templates')
          .select(`
            id, company_id, category_id, name, description,
            checklist, is_active, deleted_at, created_at, updated_at,
            category:categories(name, type)
          `)
          .eq('id', id)
          .is('deleted_at', null)
          .single(),
        supabase
          .from('categories')
          .select('id, name')
          .eq('type', 'asset')
          .is('deleted_at', null)
          .order('name'),
      ]);

      if (templateResult.error || !templateResult.data) {
        setError('Template not found');
        setLoading(false);
        return;
      }

      const rawTemplate = templateResult.data;

      // Normalize template
      const normalized: MaintenanceTemplate = {
        ...rawTemplate,
        checklist: (Array.isArray(rawTemplate.checklist) ? rawTemplate.checklist : []) as MaintenanceTemplate['checklist'],
        item_count: Array.isArray(rawTemplate.checklist) ? rawTemplate.checklist.length : 0,
        category: Array.isArray(rawTemplate.category)
          ? rawTemplate.category[0] ?? null
          : rawTemplate.category ?? null,
      };

      setTemplate(normalized);
      setCategories(categoriesResult.data ?? []);
    } catch {
      setError('Failed to load template details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (templateId) {
      fetchData(templateId);
    } else {
      setTemplate(null);
      setCategories([]);
      setError(null);
    }
  }, [templateId, refreshKey, fetchData]);

  // Action success handler
  const handleActionSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
    router.refresh();
    onActionSuccess?.();
  }, [router, onActionSuccess]);

  return (
    <Dialog open={!!templateId} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0 max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0"
        showCloseButton={true}
      >
        {/* Loading state */}
        {loading && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-32" />
            <div className="space-y-3 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              {templateId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(templateId)}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Retry
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {template && !loading && !error && (
          <>
            {/* Header (non-scrollable) */}
            <div className="px-6 pt-6 pb-4 border-b shrink-0 pr-12">
              <DialogTitle className="sr-only">
                Template: {template.name}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-3">
                {/* Prev/Next navigation */}
                {templateIds.length > 1 && (
                  <div className="flex items-center gap-1 mr-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!hasPrev}
                      onClick={goToPrev}
                      aria-label="Previous template"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!hasNext}
                      onClick={goToNext}
                      aria-label="Next template"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-1">
                      {currentIndex + 1}/{templateIds.length}
                    </span>
                  </div>
                )}

                <h2 className="text-xl font-bold tracking-tight truncate max-w-[400px]">
                  {template.name}
                </h2>
                {template.is_active ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {template.category?.name && `${template.category.name} \u00b7 `}
                {template.item_count ?? template.checklist.length} checklist item{(template.item_count ?? template.checklist.length) !== 1 ? 's' : ''}
                {' \u00b7 '}Created {format(new Date(template.created_at), 'dd-MM-yyyy')}
              </p>
            </div>

            {/* Body: TemplateDetail component (scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
              <TemplateDetail
                template={template}
                categories={categories}
                userRole={userRole}
              />
            </div>

            {/* Sticky action bar */}
            <div className="border-t px-6 py-3 flex items-center justify-end gap-2 shrink-0 bg-background">
              <span className="text-xs text-muted-foreground">
                {template.name}
              </span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
