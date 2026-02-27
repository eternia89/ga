import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { TemplateList } from '@/components/maintenance/template-list';
import type { MaintenanceTemplate } from '@/lib/types/maintenance';

export default async function MaintenanceTemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Fetch all templates for this company with category join
  const { data: templates } = await supabase
    .from('maintenance_templates')
    .select(`
      id,
      company_id,
      category_id,
      name,
      description,
      checklist,
      is_active,
      deleted_at,
      created_at,
      updated_at,
      category:categories(name, type)
    `)
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  // Normalize: compute item_count, flatten category (Supabase returns as array)
  const templateList: MaintenanceTemplate[] = (templates ?? []).map((t) => ({
    ...t,
    checklist: (Array.isArray(t.checklist) ? t.checklist : []) as MaintenanceTemplate['checklist'],
    item_count: Array.isArray(t.checklist) ? t.checklist.length : 0,
    category: Array.isArray(t.category) ? t.category[0] ?? null : t.category ?? null,
  }));

  return (
    <div className="space-y-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/maintenance/templates">Maintenance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Templates</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Templates</h1>
          <p className="text-muted-foreground mt-1">
            Define reusable maintenance checklists for assets
          </p>
        </div>
        {['ga_lead', 'admin'].includes(profile.role) && (
          <Button asChild size="sm">
            <Link href="/maintenance/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        )}
      </div>

      <TemplateList templates={templateList} userRole={profile.role} />
    </div>
  );
}
