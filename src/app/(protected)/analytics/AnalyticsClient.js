'use client';
import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const PIE_COLORS = ['#2563eb', '#059669', '#9ca3af'];
const BAR_COLORS = ['#2563eb', '#d97706', '#6ee7b7', '#059669', '#ef4444'];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">{label}</div>
      <div className="text-[28px] font-bold tracking-tight" style={{ color: color || '#111' }}>{value}</div>
      {sub && <div className="text-[11px] text-gray-300 mt-1">{sub}</div>}
    </div>
  );
}

export default function AnalyticsClient({ contacts, tasks, deals, messages }) {
  const s = useMemo(() => {
    const contactPie = ['lead', 'customer', 'cold']
      .map(st => ({ name: st.charAt(0).toUpperCase() + st.slice(1), value: contacts.filter(x => x.status === st).length }))
      .filter(x => x.value > 0);

    const stages = ['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const dealsByStage = stages
      .map(st => ({ stage: st.replace('_', ' '), count: deals.filter(x => x.stage === st).length }))
      .filter(x => x.count > 0);

    const pipeline = deals.filter(x => !['closed_won','closed_lost'].includes(x.stage)).reduce((a, b) => a + (b.value || 0), 0);
    const won      = deals.filter(x => x.stage === 'closed_won').reduce((a, b) => a + (b.value || 0), 0);

    const activity = Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const key = format(day, 'yyyy-MM-dd');
      return {
        day: format(day, 'MMM d'),
        contacts: contacts.filter(x => (x.created_at || '').startsWith(key)).length,
        tasks:    tasks.filter(x => (x.created_at || '').startsWith(key)).length,
        messages: messages.filter(x => (x.sent_at || '').startsWith(key)).length,
      };
    });

    const emailCount = messages.filter(x => x.channel === 'email').length;
    const smsCount   = messages.filter(x => x.channel === 'sms').length;
    const tasksDone  = tasks.filter(x => x.status === 'done').length;
    const taskPct    = tasks.length ? Math.round(tasksDone / tasks.length * 100) : 0;

    return { contactPie, dealsByStage, pipeline, won, activity, emailCount, smsCount, tasksDone, taskPct };
  }, [contacts, tasks, deals, messages]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Contacts" value={contacts.length} sub={`${contacts.filter(x => x.status === 'lead').length} leads`} />
        <StatCard label="Open Deals" value={deals.filter(x => !['closed_won','closed_lost'].includes(x.stage)).length} sub={`₹${s.pipeline.toLocaleString()} pipeline`} color="#2563eb" />
        <StatCard label="Revenue Won" value={`₹${s.won.toLocaleString()}`} sub={`${deals.filter(x => x.stage === 'closed_won').length} deals`} color="#059669" />
        <StatCard label="Tasks Complete" value={`${s.taskPct}%`} sub={`${s.tasksDone} of ${tasks.length}`} color="#d97706" />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">14-day activity</div>
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={s.activity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.1}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#d1d5db' }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6' }} />
              <Area type="monotone" dataKey="contacts" stroke="#2563eb" fill="url(#gC)" strokeWidth={2} dot={false} name="Contacts" />
              <Area type="monotone" dataKey="messages" stroke="#059669" fill="url(#gM)" strokeWidth={2} dot={false} name="Messages" />
              <Area type="monotone" dataKey="tasks"    stroke="#d97706" fill="none"      strokeWidth={2} dot={false} name="Tasks" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            {[['#2563eb','Contacts'],['#059669','Messages'],['#d97706','Tasks']].map(([col, lbl]) => (
              <div key={lbl} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <div className="w-2 h-2 rounded-full" style={{ background: col }} />{lbl}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">Contact status</div>
          {s.contactPie.length === 0 ? <p className="text-[12px] text-gray-300">No contacts yet.</p> : (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={s.contactPie} cx="50%" cy="50%" innerRadius={34} outerRadius={56} paddingAngle={3} dataKey="value">
                    {s.contactPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {s.contactPie.map((e, i) => (
                  <div key={e.name} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {e.name} ({e.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">Deals by stage</div>
          {s.dealsByStage.length === 0 ? <p className="text-[12px] text-gray-300">No deals yet.</p> : (
            <ResponsiveContainer width="100%" height={155}>
              <BarChart data={s.dealsByStage} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#d1d5db' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6' }} />
                <Bar dataKey="count" radius={[4,4,0,0]} name="Deals">
                  {s.dealsByStage.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-[13px] font-semibold text-gray-800 mb-1">Messages sent</div>
          <div className="text-[30px] font-bold text-gray-900 tracking-tight">{messages.length}</div>
          <div className="text-[11px] text-gray-300 mb-5">total</div>
          {[['Email', s.emailCount, '#2563eb'], ['SMS', s.smsCount, '#d97706']].map(([lbl, val, col]) => (
            <div key={lbl} className="mb-3">
              <div className="flex justify-between text-[12px] text-gray-600 mb-1.5">
                <span>{lbl}</span><span className="font-semibold" style={{ color: col }}>{val}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ background: col, width: `${messages.length ? Math.round(val / messages.length * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
