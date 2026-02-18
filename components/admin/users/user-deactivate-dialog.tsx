'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type UserRow = {
  id: string;
  email: string;
  full_name: string;
};

type UserDeactivateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null;
  onConfirm: (reason?: string) => void;
  mode?: 'deactivate' | 'reactivate';
};

export function UserDeactivateDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  mode = 'deactivate',
}: UserDeactivateDialogProps) {
  const [reason, setReason] = useState('');

  const isDeactivate = mode === 'deactivate';
  const title = isDeactivate ? 'Deactivate User' : 'Reactivate User';
  const description = isDeactivate
    ? 'Are you sure you want to deactivate this user? They will no longer be able to access the system.'
    : 'Are you sure you want to reactivate this user? They will regain access to the system.';
  const buttonLabel = isDeactivate ? 'Deactivate' : 'Reactivate';
  const reasonPlaceholder = isDeactivate
    ? 'Enter a reason for deactivation (optional)'
    : 'Enter a reason for reactivation (optional)';

  const handleConfirm = () => {
    onConfirm(reason || undefined);
    setReason('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason('');
    }
    onOpenChange(newOpen);
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <div className="text-sm">
            <span className="font-medium">Name:</span> {user.full_name}
          </div>
          <div className="text-sm">
            <span className="font-medium">Email:</span> {user.email}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason" className="text-sm">
            Reason (Optional)
          </Label>
          <Textarea
            id="reason"
            placeholder={reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={isDeactivate
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
              : "bg-green-600 hover:bg-green-700 focus:ring-green-600"
            }
          >
            {buttonLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
