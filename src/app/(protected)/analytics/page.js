import { createClient } from '../../../lib/supabase-server';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const [
    { data: contacts },
    { data: tasks },
    { data: deals },
    { data: messages },
  ] = await Promise.all([
    supabase.from('contacts').select('id, status, created_at'),
    supabase.from('tasks').select('id, status, created_at'),
    supabase.from('deals').select('id, stage, value, created_at'),
    supabase.from('messages').select('id, channel, sent_at'),
  ]);

  return (
    <AnalyticsClient
      contacts={contacts || []}
      tasks={tasks || []}
      deals={deals || []}
      messages={messages || []}
    />
  );
}
