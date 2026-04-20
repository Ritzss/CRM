import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import TeamClient from './TeamClient';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team' };
export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/analytics');
  const { data: members } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  return <TeamClient members={members||[]} currentUserId={user.id} />;
}
