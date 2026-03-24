import { createClient } from '../../../lib/supabase-server';
import MessagesClient from './MessagesClient';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const supabase = await createClient();
  const [{ data: contacts }, { data: history }] = await Promise.all([
    supabase.from('contacts').select('id, name, phone, email').order('name'),
    supabase.from('messages').select('*').order('sent_at', { ascending: false }).limit(20),
  ]);
  return <MessagesClient initialContacts={contacts || []} initialHistory={history || []} />;
}
