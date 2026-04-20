import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import ContactDetail from './ContactDetail';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('contacts').select('name').eq('id', id).single();
  return { title: data?.name || 'Contact' };
}

export default async function ContactDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  const { data: contact }  = await supabase.from('contacts').select('*').eq('id', id).single();
  if (!contact) notFound();

  const [
    { data: notes }, { data: deals }, { data: tasks },
    { data: reminders }, { data: attachments }, { data: messages },
  ] = await Promise.all([
    supabase.from('notes').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    supabase.from('deals').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*').eq('contact_name', contact.name).order('created_at', { ascending: false }),
    supabase.from('reminders').select('*').eq('contact_id', id).order('remind_at', { ascending: true }),
    supabase.from('attachments').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    supabase.from('messages').select('*').eq('contact_name', contact.name).order('sent_at', { ascending: false }).limit(10),
  ]);

  return (
    <ContactDetail
      contact={contact}
      notes={notes||[]} deals={deals||[]} tasks={tasks||[]}
      reminders={reminders||[]} attachments={attachments||[]} messages={messages||[]}
      isAdmin={profile?.role==='admin'} userId={user.id} userName={profile?.full_name||user.email}
    />
  );
}
