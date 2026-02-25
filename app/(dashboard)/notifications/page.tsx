import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NotificationCenter } from '@/components/notifications/notification-center';
import type { Notification } from '@/lib/notifications/actions';

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Server-side fetch of initial 20 notifications (most recent, all types)
  const LIMIT = 20;
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(LIMIT + 1);

  const rawNotifications = (data ?? []) as Notification[];
  const hasMore = rawNotifications.length > LIMIT;
  const initialNotifications = hasMore ? rawNotifications.slice(0, LIMIT) : rawNotifications;

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          All your notifications in one place
        </p>
      </div>

      <NotificationCenter
        initialNotifications={initialNotifications}
        initialHasMore={hasMore}
      />
    </div>
  );
}
