import { createClient } from '../../../lib/supabase-server';
import TasksClient from './TasksClient';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase.from('profiles').select('role').eq('id', user.id).single();

  const [{ data: tasks }, { data: contacts }] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('contacts').select('id, name').order('name'),
  ]);

  return (
    <TasksClient
      initialTasks={tasks || []}
      initialContacts={contacts || []}
      isAdmin={profile?.role === 'admin'}
    />
  );
}
