import { createClient } from '@/lib/supabase-server';
import DealsClient from './DealsClient';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Deals' };
export default async function DealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const [{ data: deals }, { data: contacts }] = await Promise.all([
    supabase.from('deals').select('*').order('created_at', { ascending: false }),
    supabase.from('contacts').select('id, name').order('name'),
  ]);
  return <DealsClient initialDeals={deals||[]} initialContacts={contacts||[]} isAdmin={profile?.role==='admin'} />;
}
