import { createClient } from '@/lib/supabase-server';
import ContactsClient from './ContactsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contacts' };

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const { data: contacts } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
  return <ContactsClient initial={contacts||[]} isAdmin={profile?.role==='admin'} />;
}
