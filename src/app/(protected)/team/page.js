import { createClient } from '../../../lib/supabase-server';
import { redirect } from 'next/navigation';
import TeamClient from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (profile?.role !== 'admin') redirect('/contacts');

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: true });

  return <TeamClient members={members || []} currentUserId={user.id} />;
}
