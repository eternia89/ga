#!/usr/bin/env tsx

/**
 * Wipe all operational data from the database.
 * Keeps: companies, divisions, locations, categories, user_profiles, auth.users, company_settings
 * Wipes: requests, jobs, job_comments, job_requests, inventory_items, inventory_movements,
 *        maintenance_templates, maintenance_schedules, notifications, media_attachments,
 *        audit_logs, id_counters
 *
 * Run before seed:ops to start from a clean slate.
 * Usage: npm run wipe:ops
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function wipeTable(supabase: SupabaseClient, table: string): Promise<void> {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .not('id', 'is', null);
  if (error) throw new Error(`Failed to wipe ${table}: ${error.message}`);
  console.log(`  ✓ ${table.padEnd(30)} ${count ?? 0} rows deleted`);
}

async function main() {
  const supabase = createAdminClient();
  console.log('\nWiping operational data...\n');

  // Step 1: audit_logs, notifications, media_attachments (no FK to operational tables)
  await wipeTable(supabase, 'audit_logs');
  await wipeTable(supabase, 'notifications');
  await wipeTable(supabase, 'media_attachments');

  // Step 2: job_comments and job_requests (FK to jobs/requests)
  await wipeTable(supabase, 'job_comments');
  await wipeTable(supabase, 'job_requests');

  // Step 3: Nullify jobs.maintenance_schedule_id before deleting maintenance_schedules
  //         (jobs FK references maintenance_schedules, so we must break the cycle first)
  const { error: nullErr } = await supabase
    .from('jobs')
    .update({ maintenance_schedule_id: null })
    .not('id', 'is', null);
  if (nullErr) throw new Error(`Failed to nullify maintenance_schedule_id: ${nullErr.message}`);

  await wipeTable(supabase, 'maintenance_schedules');
  await wipeTable(supabase, 'jobs');
  await wipeTable(supabase, 'requests');

  // Step 4: inventory_movements before inventory_items (FK dependency)
  await wipeTable(supabase, 'inventory_movements');
  await wipeTable(supabase, 'inventory_items');

  // Step 5: maintenance_templates (after schedules are gone)
  await wipeTable(supabase, 'maintenance_templates');

  // Step 6: Reset id_counters so display IDs start fresh from 001
  const { error: ctrErr, count: ctrCount } = await supabase
    .from('id_counters')
    .delete({ count: 'exact' })
    .not('id', 'is', null);
  if (ctrErr) throw new Error(`Failed to reset id_counters: ${ctrErr.message}`);
  console.log(`  ✓ ${'id_counters'.padEnd(30)} ${ctrCount ?? 0} rows deleted`);

  console.log('\n✅ Done. Run `npm run seed:ops` to re-seed mock data.\n');
}

main().catch((err) => {
  console.error('\n❌ Wipe failed:', err.message);
  process.exit(1);
});
