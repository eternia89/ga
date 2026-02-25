import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { TemplateDetail } from '@/components/maintenance/template-detail';
import type { MaintenanceTemplate } from '@/lib/types/maintenance';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { id } = await params;
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

  // Fetch template with category join
  const { data: templateData } = await supabase
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
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .single();

  if (!templateData) {
    notFound();
  }

  // Normalize template
  const template: MaintenanceTemplate = {
    ...templateData,
    checklist: (Array.isArray(templateData.checklist) ? templateData.checklist : []) as MaintenanceTemplate['checklist'],
    item_count: Array.isArray(templateData.checklist) ? templateData.checklist.length : 0,
    category: Array.isArray(templateData.category)
      ? templateData.category[0] ?? null
      : templateData.category ?? null,
  };

  // Fetch asset-type categories for edit form
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'asset')
    .is('deleted_at', null)
    .order('name');

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/maintenance/templates">Maintenance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/maintenance/templates">Templates</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{template.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold tracking-tight truncate">{template.name}</h1>
        {template.category?.name && (
          <p className="text-muted-foreground mt-1">
            {template.category.name}
          </p>
        )}
      </div>

      <TemplateDetail
        template={template}
        categories={categories ?? []}
        userRole={profile.role}
      />
    </div>
  );
}
