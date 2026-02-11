'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/lib/auth/hooks';
import { updateProfile } from '@/app/actions/profile-actions';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InlineFeedback } from '@/components/inline-feedback';
import { PasswordChangeDialog } from './password-change-dialog';

type ProfileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { profile } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
    },
    values: {
      full_name: profile?.full_name || '',
    },
  });

  if (!profile) return null;

  // Get user initials for avatar
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format role display name
  const roleDisplay = profile.role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Get company and division names from joined data
  const companyName = (profile as any).company?.name || 'Not assigned';
  const divisionName = (profile as any).division?.name || 'Not assigned';

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await updateProfile(data);
      if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Profile updated successfully' });
      } else {
        setFeedback({ type: 'error', message: result?.serverError || 'Failed to update profile' });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Profile</SheetTitle>
            <SheetDescription>
              Update your personal information and change your password.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-xl">
                {initials}
              </div>
            </div>

            {/* Editable Name Field */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>

            {feedback && (
              <InlineFeedback type={feedback.type} message={feedback.message} />
            )}

            {/* Read-only Fields */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {profile.email}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Role
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {roleDisplay}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Division
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {divisionName}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Company
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {companyName}
                </p>
              </div>
            </div>

            {/* Password Change Link */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPasswordDialogOpen(true)}
              >
                Change Password
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </>
  );
}
