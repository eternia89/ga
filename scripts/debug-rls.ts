import { createClient } from '@supabase/supabase-js';

const url = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = createClient(url, anonKey);

async function main() {
  // Clean old test users
  const { data: oldUsers } = await admin.auth.admin.listUsers();
  for (const u of oldUsers?.users || []) {
    if (u.email?.endsWith('@test.local')) {
      await admin.auth.admin.deleteUser(u.id);
    }
  }

  // Create user
  const { data: authData } = await admin.auth.admin.createUser({
    email: 'rls@test.local', password: 'Test1234!', email_confirm: true,
  });
  const userId = authData?.user?.id;
  console.log('Expected auth.uid():', userId);

  // Sign in
  await anon.auth.signInWithPassword({ email: 'rls@test.local', password: 'Test1234!' });

  // Call debug function
  const { data: debug, error } = await anon.rpc('debug_auth_uid');
  console.log('debug_auth_uid():', JSON.stringify(debug, null, 2));
  if (error) console.log('Error:', error.message);

  // Cleanup
  if (userId) await admin.auth.admin.deleteUser(userId);
}

main().catch(console.error);
