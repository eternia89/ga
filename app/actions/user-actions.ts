'use server';

import { adminActionClient } from '@/lib/safe-action';
import { createAdminClient } from '@/lib/supabase/admin';
import { createUserSchema, updateUserSchema } from '@/lib/validations/user-schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertCompanyAccess } from '@/lib/auth/company-access';
import type { ActionOk, ActionResponse } from '@/lib/types/action-responses';

// Get users with joined data
export const getUsers = adminActionClient
  .action(async ({ ctx }): Promise<{ users: Array<Record<string, unknown>> }> => {
    const adminSupabase = createAdminClient();

    // Fetch all user profiles with joined division and company names
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('user_profiles')
      .select('*, division:divisions(name), company:companies(name), location:locations(name)')
      .order('full_name');

    if (profilesError) {
      throw new Error(`Failed to fetch users: ${profilesError.message}`);
    }

    // Fetch auth users to get last_sign_in_at
    const { data: { users: authUsers }, error: authError } = await adminSupabase.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    // Create a map of auth user data by id
    const authUserMap = new Map(
      authUsers.map(u => [u.id, { last_sign_in_at: u.last_sign_in_at }])
    );

    // Merge last_sign_in_at into profiles
    const usersWithAuth = profiles.map(profile => ({
      ...profile,
      last_sign_in_at: authUserMap.get(profile.id)?.last_sign_in_at || null,
    }));

    return { users: usersWithAuth };
  });

// Create user
export const createUser = adminActionClient
  .schema(createUserSchema)
  .action(async ({ parsedInput, ctx }): Promise<ActionResponse<{ user: { id: string; email: string; full_name: string; role: string } }>> => {
    const adminSupabase = createAdminClient();

    // Validate admin has access to the target company
    const { profile } = ctx;
    await assertCompanyAccess(adminSupabase, profile.id, parsedInput.company_id, profile.company_id);

    try {
      // 1. Create auth user with Supabase Admin API
      const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
        email: parsedInput.email,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      if (!authUser.user) {
        throw new Error('Auth user creation returned no user');
      }

      try {
        // 2. Insert user_profiles row
        const { error: profileError } = await adminSupabase
          .from('user_profiles')
          .insert({
            id: authUser.user.id,
            email: parsedInput.email,
            full_name: parsedInput.full_name,
            role: parsedInput.role,
            company_id: parsedInput.company_id,
            division_id: parsedInput.division_id || null,
            location_id: parsedInput.location_id || null,
            is_active: true,
          });

        if (profileError) {
          // Rollback: delete auth user
          await adminSupabase.auth.admin.deleteUser(authUser.user.id);
          throw new Error(`Failed to create user profile: ${profileError.message}`);
        }

        // 3. Set app_metadata on auth user (for RLS helper functions)
        const { error: metadataError } = await adminSupabase.auth.admin.updateUserById(
          authUser.user.id,
          {
            app_metadata: {
              role: parsedInput.role,
              company_id: parsedInput.company_id,
              division_id: parsedInput.division_id || null,
            },
          }
        );

        if (metadataError) {
          // Don't rollback for metadata error, just log it
          console.error('Failed to set app_metadata:', metadataError);
        }

        revalidatePath('/admin/users');

        return {
          success: true,
          user: {
            id: authUser.user.id,
            email: parsedInput.email,
            full_name: parsedInput.full_name,
            role: parsedInput.role,
          },
        };
      } catch (error) {
        // If anything fails after auth user creation, try to delete it
        await adminSupabase.auth.admin.deleteUser(authUser.user.id);
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to create user');
    }
  });

// Update user
export const updateUser = adminActionClient
  .schema(z.object({ id: z.string().uuid() }).merge(updateUserSchema))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const adminSupabase = createAdminClient();

    // Verify admin has access to the target company
    await assertCompanyAccess(adminSupabase, ctx.profile.id, parsedInput.company_id, ctx.profile.company_id);

    // 1. Update user_profiles row
    const { error: profileError } = await adminSupabase
      .from('user_profiles')
      .update({
        full_name: parsedInput.full_name,
        role: parsedInput.role,
        company_id: parsedInput.company_id,
        division_id: parsedInput.division_id || null,
        location_id: parsedInput.location_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.id);

    if (profileError) {
      throw new Error(`Failed to update user profile: ${profileError.message}`);
    }

    // 2. Update auth user app_metadata
    const { error: metadataError } = await adminSupabase.auth.admin.updateUserById(
      parsedInput.id,
      {
        app_metadata: {
          role: parsedInput.role,
          company_id: parsedInput.company_id,
          division_id: parsedInput.division_id || null,
        },
      }
    );

    if (metadataError) {
      console.error('Failed to update app_metadata:', metadataError);
      // Don't fail the entire operation for metadata error
    }

    revalidatePath('/admin/users');

    return { success: true };
  });

// Deactivate user
export const deactivateUser = adminActionClient
  .schema(z.object({
    id: z.string().uuid(),
    reason: z.string().max(200).optional(),
  }))
  .action(async ({ parsedInput }): Promise<ActionOk> => {
    const adminSupabase = createAdminClient();

    // Set deleted_at to deactivate the user
    const { error } = await adminSupabase
      .from('user_profiles')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }

    revalidatePath('/admin/users');

    return { success: true };
  });

// Reactivate user
export const reactivateUser = adminActionClient
  .schema(z.object({ id: z.string().uuid(), reason: z.string().max(200).optional() }))
  .action(async ({ parsedInput }): Promise<ActionOk> => {
    const adminSupabase = createAdminClient();

    // Fetch the user being reactivated to get their email
    const { data: userToReactivate, error: fetchError } = await adminSupabase
      .from('user_profiles')
      .select('id, email')
      .eq('id', parsedInput.id)
      .single();

    if (fetchError || !userToReactivate) {
      throw new Error('User not found');
    }

    // Check for duplicate email among active users
    const { data: duplicateEmail } = await adminSupabase
      .from('user_profiles')
      .select('id')
      .eq('email', userToReactivate.email)
      .is('deleted_at', null)
      .neq('id', parsedInput.id)
      .maybeSingle();

    if (duplicateEmail) {
      throw new Error('Cannot reactivate: another active user already has this email address.');
    }

    // Clear deleted_at and ensure is_active is true
    const { error } = await adminSupabase
      .from('user_profiles')
      .update({
        deleted_at: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(`Failed to reactivate user: ${error.message}`);
    }

    revalidatePath('/admin/users');

    return { success: true };
  });
