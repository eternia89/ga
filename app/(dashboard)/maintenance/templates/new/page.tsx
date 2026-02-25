import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { TemplateCreateForm } from '@/components/maintenance/template-create-form';

export default async function NewTemplatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Only ga_lead and admin can create templates
  if (!['ga_lead', 'admin'].includes(profile.role)) {
    redirect('/maintenance/templates');
  }

  // Fetch asset-type categories only (maintenance templates link to asset categories)
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
            <BreadcrumbPage>New</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Maintenance Template</h1>
        <p className="text-muted-foreground mt-1">
          Define a reusable checklist template for asset maintenance
        </p>
      </div>

      <TemplateCreateForm categories={categories ?? []} />
    </div>
  );
}
