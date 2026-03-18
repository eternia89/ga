'use server';

import { authActionClient } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionOk } from '@/lib/types/action-responses';

// Update profile (name only)
export const updateProfile = authActionClient
  .schema(z.object({
    full_name: z.string().min(1, "Name is required").max(60),
  }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, user } = ctx;

    // Update user_profiles where id = current user
    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: parsedInput.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    // Revalidate layout to refresh sidebar/user menu
    revalidatePath('/', 'layout');

    return { success: true };
  });

// Change password
export const changePassword = authActionClient
  .schema(z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: parsedInput.currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsedInput.newPassword,
    });

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    return { success: true };
  });
