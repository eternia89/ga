'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/lib/auth/hooks';
import { changePassword } from '@/app/actions/profile-actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InlineFeedback } from '@/components/inline-feedback';
import { Eye, EyeOff } from 'lucide-react';

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ga_lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ga_staff: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  finance_approver: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  general_user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const roleDisplay: Record<string, string> = {
  admin: 'Admin',
  ga_lead: 'GA Lead',
  ga_staff: 'GA Staff',
  finance_approver: 'Finance Approver',
  general_user: 'General User',
};

type ProfileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { profile } = useUser();
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
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

  // Get company and division names from joined data
  const companyName = (profile as any).company?.name || 'Not assigned';
  const divisionName = (profile as any).division?.name || 'Not assigned';

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsSubmittingPassword(true);
    setPasswordFeedback(null);

    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result?.data?.success) {
        setPasswordFeedback({ type: 'success', message: 'Password changed successfully' });
        passwordForm.reset();
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        setPasswordFeedback({ type: 'error', message: result?.serverError || 'Failed to change password' });
      }
    } catch (error) {
      setPasswordFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      passwordForm.reset();
      setPasswordFeedback(null);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px] max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            View your profile information and change your password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar + Name + Role */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-base">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{profile.full_name}</p>
                <Badge variant="secondary" className={roleColors[profile.role] || roleColors.general_user}>
                  {roleDisplay[profile.role] || profile.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          {/* Read-only Fields — 2 column grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Division</label>
              <p className="text-sm">{divisionName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Company</label>
              <p className="text-sm">{companyName}</p>
            </div>
          </div>

          {/* Password Change Section */}
          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Change Password</h3>

            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showCurrentPassword ? 'text' : 'password'} {...field} />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            tabIndex={-1}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showNewPassword ? 'text' : 'password'} {...field} />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            tabIndex={-1}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showConfirmPassword ? 'text' : 'password'} {...field} />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {passwordFeedback && (
                  <InlineFeedback type={passwordFeedback.type} message={passwordFeedback.message} onDismiss={() => setPasswordFeedback(null)} />
                )}

                <Button type="submit" disabled={isSubmittingPassword} className="w-full">
                  {isSubmittingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
