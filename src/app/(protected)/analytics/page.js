import { createClient } from '@/lib/supabase-server';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { StageBadge, StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import AnalyticsCharts from './AnalyticsCharts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [
    { data: contacts },
    { data: tasks },
    { data: deals },
    { data: messages },
    { data: notes },
  ] = await Promise.all([
    supabase.from('contacts').select('id, status, created_at').order('created_at', { ascending: false }),
    supabase.from('tasks').select('id, status, created_at'),
    supabase.from('deals').select('id, stage, value, title, contact_name, created_at').order('created_at', { ascending: false }),
    supabase.from('messages').select('id, channel, sent_at'),
    supabase.from('notes').select('id, type, body, author_name, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const c = contacts || [];
  const t = tasks || [];
  const d = deals || [];
  const m = messages || [];

  const pipeline = d.filter(x => !['closed_won','closed_lost'].includes(x.stage)).reduce((a, b) => a + (Number(b.value) || 0), 0);
  const won      = d.filter(x => x.stage === 'closed_won').reduce((a, b) => a + (Number(b.value) || 0), 0);
  const taskDone = t.filter(x => x.status === 'done').length;
  const openDeals = d.filter(x => !['closed_won','closed_lost'].includes(x.stage));
  const recentContacts = c.slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" description={`${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`} />

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Contacts" value={c.length} sub={`${c.filter(x => x.status === 'lead').length} leads`} color="#111" icon="👥" />
        <StatCard label="Open Deals" value={openDeals.length} sub={`${formatCurrency(pipeline)} pipeline`} color="#2563eb" icon="🤝" />
        <StatCard label="Revenue Won" value={formatCurrency(won)} sub={`${d.filter(x => x.stage === 'closed_won').length} deals closed`} color="#059669" icon="💰" />
        <StatCard label="Tasks Done" value={`${t.length ? Math.round(taskDone / t.length * 100) : 0}%`} sub={`${taskDone} of ${t.length} completed`} color="#d97706" icon="✅" />
      </div>

      {/* Charts */}
      <AnalyticsCharts contacts={c} tasks={t} deals={d} messages={m} />

      {/* Bottom panels */}
      <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Recent contacts */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">Recent Contacts</div>
          {recentContacts.length === 0
            ? <p className="text-[12px] text-gray-300">No contacts yet.</p>
            : recentContacts.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-[13px] text-gray-700">—</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  <span className="text-[11px] text-gray-400">{timeAgo(c.created_at)}</span>
                </div>
              </div>
            ))
          }
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">Recent Activity</div>
          {(notes || []).length === 0
            ? <p className="text-[12px] text-gray-300">No activity yet.</p>
            : (notes || []).map(n => (
              <div key={n.id} className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="text-base shrink-0">
                  {{ note:'📝', call:'📞', meeting:'🤝', email:'✉️', whatsapp:'💬' }[n.type] || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-700 truncate m-0">{n.body}</p>
                  <span className="text-[11px] text-gray-400">{n.author_name} · {timeAgo(n.created_at)}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Open deals */}
      {openDeals.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mt-4">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">Open Deals</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Deal','Contact','Value','Stage','Created'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openDeals.slice(0, 8).map(deal => (
                  <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{deal.title}</td>
                    <td className="px-3 py-2.5 text-gray-500">{deal.contact_name || '—'}</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-semibold">{formatCurrency(deal.value)}</td>
                    <td className="px-3 py-2.5"><StageBadge stage={deal.stage} /></td>
                    <td className="px-3 py-2.5 text-gray-400">{formatDate(deal.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
