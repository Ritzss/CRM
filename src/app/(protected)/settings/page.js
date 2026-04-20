import { createClient } from '@/lib/supabase-server';
import SettingsClient from './SettingsClient';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings' };
export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return <SettingsClient profile={profile||{}} userId={user.id} email={user.email} />;
}
