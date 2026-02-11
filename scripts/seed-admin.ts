#!/usr/bin/env tsx

/**
 * Bootstrap seed script: Create first admin user + company
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts \
 *     --company "PT Example Corp" \
 *     --email admin@example.com \
 *     --password SecurePass123! \
 *     --name "Admin User"
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (NOT the anon key - requires service_role for admin operations)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local (Next.js convention, not auto-loaded outside Next.js)
config({ path: '.env.local' });

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    if (value) {
      parsed[key] = value;
    }
  }

  return parsed;
}

async function seedAdmin() {
  const args = parseArgs();

  // Validate required arguments
  const companyName = args.company;
  const adminEmail = args.email;
  const adminPassword = args.password;
  const adminName = args.name;

  if (!companyName || !adminEmail || !adminPassword || !adminName) {
    console.error('Error: Missing required arguments');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/seed-admin.ts \\');
    console.log('    --company "Company Name" \\');
    console.log('    --email admin@example.com \\');
    console.log('    --password SecurePassword123! \\');
    console.log('    --name "Admin Full Name"');
    process.exit(1);
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing required environment variables');
    console.log('\nRequired:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)');
    process.exit(1);
  }

  // Create Supabase client with service_role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('Starting admin seed process...\n');

    // 1. Check if company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', companyName)
      .maybeSingle();

    if (existingCompany) {
      console.error(`Error: Company "${companyName}" already exists (ID: ${existingCompany.id})`);
      console.log('Tip: Use a different company name or manually update the existing company.');
      process.exit(1);
    }

    // 2. Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === adminEmail);

    if (userExists) {
      console.error(`Error: User with email "${adminEmail}" already exists`);
      console.log('Tip: Use a different email or delete the existing user from Supabase Dashboard → Authentication → Users');
      process.exit(1);
    }

    // 3. Create company
    console.log(`Creating company: ${companyName}...`);
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        is_active: true,
      })
      .select()
      .single();

    if (companyError || !company) {
      console.error('Error creating company:', companyError);
      process.exit(1);
    }

    console.log(`✓ Company created: ${company.name} (ID: ${company.id})\n`);

    // 4. Create admin user via Supabase Auth
    console.log(`Creating admin user: ${adminEmail}...`);
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
      },
    });

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError);
      // Rollback: delete company
      await supabase.from('companies').delete().eq('id', company.id);
      process.exit(1);
    }

    console.log(`✓ Auth user created: ${authUser.user.email} (ID: ${authUser.user.id})\n`);

    // 5. Update user app_metadata with role and company_id
    console.log('Setting user app_metadata (role, company_id, division_id)...');
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      authUser.user.id,
      {
        app_metadata: {
          role: 'admin',
          company_id: company.id,
          division_id: null,
        },
      }
    );

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Rollback: delete user and company
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('companies').delete().eq('id', company.id);
      process.exit(1);
    }

    console.log('✓ User app_metadata set\n');

    // 6. Create user_profiles entry
    console.log('Creating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        company_id: company.id,
        division_id: null,
        email: adminEmail,
        full_name: adminName,
        role: 'admin',
        is_active: true,
        notification_preferences: {},
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Rollback: delete user and company
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('companies').delete().eq('id', company.id);
      process.exit(1);
    }

    console.log('✓ User profile created\n');

    // Success summary
    console.log('========================================');
    console.log('ADMIN SEED COMPLETE');
    console.log('========================================');
    console.log(`Company: ${company.name}`);
    console.log(`Company ID: ${company.id}`);
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Admin ID: ${authUser.user.id}`);
    console.log(`Admin Name: ${adminName}`);
    console.log(`Role: admin`);
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Visit http://localhost:3000');
    console.log('3. Sign in with the admin credentials');
    console.log('4. Create divisions, locations, categories, and additional users via the admin UI (Phase 3)');
  } catch (error) {
    console.error('Unexpected error during seed:', error);
    process.exit(1);
  }
}

// Run the seed
seedAdmin();
