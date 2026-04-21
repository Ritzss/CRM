import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SuperAdminClient from './SuperAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Super Admin' };

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase.from('profiles').select('role').eq('id', user.id).single();

  // Only superadmin can access this page
  if (profile?.role !== 'superadmin') redirect('/analytics');

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  const { data: contacts } = await supabase.from('contacts').select('id', { count: 'exact' });
  const { data: deals }    = await supabase.from('deals').select('id', { count: 'exact' });
  const { data: tasks }    = await supabase.from('tasks').select('id', { count: 'exact' });
  const { data: messages } = await supabase.from('messages').select('id', { count: 'exact' });

  return (
    <SuperAdminClient
      members={members || []}
      currentUserId={user.id}
      stats={{
        contacts: contacts?.length || 0,
        deals:    deals?.length    || 0,
        tasks:    tasks?.length    || 0,
        messages: messages?.length || 0,
      }}
    />
  );
}
