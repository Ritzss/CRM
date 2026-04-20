import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Shell from '@/components/Shell';

export default async function ProtectedLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role, email').eq('id', user.id).single();

  return <Shell user={user} profile={profile}>{children}</Shell>;
}
