#!/usr/bin/env tsx

/**
 * Add a user with a specific role to an existing company.
 *
 * Usage:
 *   npx tsx scripts/seed-user.ts \
 *     --email user@example.com \
 *     --password SecurePass123! \
 *     --name "Test User" \
 *     --role general_user \
 *     --company-id <uuid>
 *
 * Roles: general_user, ga_staff, ga_lead, finance_approver, admin
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const VALID_ROLES = ['general_user', 'ga_staff', 'ga_lead', 'finance_approver', 'admin'];

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    if (value) parsed[key] = value;
  }
  return parsed;
}

async function seedUser() {
  const args = parseArgs();

  const email = args.email;
  const password = args.password;
  const name = args.name;
  const role = args.role;
  const companyId = args['company-id'];

  if (!email || !password || !name || !role || !companyId) {
    console.error('Error: Missing required arguments\n');
    console.log('Usage:');
    console.log('  npx tsx scripts/seed-user.ts \\');
    console.log('    --email user@example.com \\');
    console.log('    --password SecurePass123! \\');
    console.log('    --name "Test User" \\');
    console.log('    --role general_user \\');
    console.log('    --company-id <uuid>');
    console.log(`\nValid roles: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role)) {
    console.error(`Error: Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error(`Error: Company with ID "${companyId}" not found`);
      process.exit(1);
    }

    console.log(`Company: ${company.name}\n`);

    // Create auth user
    console.log(`Creating user: ${email} (${role})...`);
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError);
      process.exit(1);
    }

    // Set app_metadata
    await supabase.auth.admin.updateUserById(authUser.user.id, {
      app_metadata: { role, company_id: companyId, division_id: null },
    });

    // Create profile
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: authUser.user.id,
      company_id: companyId,
      division_id: null,
      email,
      full_name: name,
      role,
      is_active: true,
      notification_preferences: {},
    });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      process.exit(1);
    }

    console.log('\n========================================');
    console.log('USER CREATED');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${role}`);
    console.log(`Company: ${company.name}`);
    console.log(`User ID: ${authUser.user.id}`);
    console.log('========================================');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

seedUser();
