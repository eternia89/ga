import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get user profile
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, divisions(name), companies(name)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Format role display
  const roleDisplay = profile.role
    .split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Role badge color
  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    ga_lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ga_staff: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    finance_approver: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    general_user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  const roleColor = roleColors[profile.role] || roleColors.general_user;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {greeting}, {profile.full_name.split(' ')[0]}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back to your dashboard
        </p>
      </div>

      {/* User info card */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Profile
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">Email</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">Role</dt>
            <dd>
              <span className={`text-sm px-2 py-1 rounded ${roleColor} inline-block`}>
                {roleDisplay}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">Company</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white">
              {profile.companies?.name || 'N/A'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">Division</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white">
              {profile.divisions?.name || 'Not assigned'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Placeholder content */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Dashboard features will appear here as they are built. Navigation items marked as
          &quot;Coming soon&quot; in the sidebar are under development and will be available in
          upcoming phases.
        </p>
      </div>
    </div>
  );
}
