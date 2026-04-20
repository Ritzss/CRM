'use client';
import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PIE_COLORS  = ['#2563eb','#059669','#9ca3af'];
const BAR_COLORS  = ['#9ca3af','#2563eb','#d97706','#059669','#ef4444'];

export default function AnalyticsCharts({ contacts, tasks, deals, messages }) {
  const { activity, contactPie, dealsByStage, emailCount, smsCount } = useMemo(() => {
    const activity = Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const key = format(day, 'yyyy-MM-dd');
      return {
        day: format(day, 'MMM d'),
        contacts: contacts.filter(x => (x.created_at||'').startsWith(key)).length,
        tasks:    tasks.filter(x => (x.created_at||'').startsWith(key)).length,
        messages: messages.filter(x => (x.sent_at||'').startsWith(key)).length,
      };
    });

    const contactPie = ['lead','customer','cold']
      .map(s => ({ name: s.charAt(0).toUpperCase()+s.slice(1), value: contacts.filter(x => x.status===s).length }))
      .filter(x => x.value > 0);

    const stages = ['prospect','proposal','negotiation','closed_won','closed_lost'];
    const dealsByStage = stages
      .map((s,i) => ({ stage: s.replace('_',' '), count: deals.filter(x => x.stage===s).length, fill: BAR_COLORS[i] }))
      .filter(x => x.count > 0);

    return {
      activity,
      contactPie,
      dealsByStage,
      emailCount: messages.filter(x => x.channel==='email').length,
      smsCount:   messages.filter(x => x.channel==='sms').length,
    };
  }, [contacts, tasks, deals, messages]);

  const tip = { contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } };

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
      {/* Activity area chart */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="text-[13px] font-semibold text-gray-800 mb-4">14-day activity</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={activity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
              <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.1}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" tick={{ fontSize:10, fill:'#d1d5db' }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fontSize:10, fill:'#d1d5db' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip {...tip} />
            <Area type="monotone" dataKey="contacts" stroke="#2563eb" fill="url(#gC)" strokeWidth={2} dot={false} name="Contacts" />
            <Area type="monotone" dataKey="messages" stroke="#059669" fill="url(#gM)" strokeWidth={2} dot={false} name="Messages" />
            <Area type="monotone" dataKey="tasks"    stroke="#d97706" fill="none"      strokeWidth={2} dot={false} name="Tasks" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3">
          {[['#2563eb','Contacts'],['#059669','Messages'],['#d97706','Tasks']].map(([col,lbl]) => (
            <div key={lbl} className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <div className="w-2 h-2 rounded-full" style={{ background: col }} />{lbl}
            </div>
          ))}
        </div>
      </div>

      {/* Right column: pie + message split */}
      <div className="flex flex-col gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 flex-1">
          <div className="text-[13px] font-semibold text-gray-800 mb-3">Contact status</div>
          {contactPie.length === 0
            ? <p className="text-[12px] text-gray-300">No contacts yet.</p>
            : <>
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie data={contactPie} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                    {contactPie.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {contactPie.map((e,i) => (
                  <div key={e.name} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i%PIE_COLORS.length] }} />
                    {e.name} ({e.value})
                  </div>
                ))}
              </div>
            </>
          }
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-[13px] font-semibold text-gray-800 mb-1">Messages</div>
          <div className="text-2xl font-bold text-gray-900 mb-3">{messages.length}</div>
          {[['Email', emailCount, '#2563eb'], ['SMS', smsCount, '#d97706']].map(([lbl,val,col]) => (
            <div key={lbl} className="mb-2.5">
              <div className="flex justify-between text-[12px] text-gray-600 mb-1"><span>{lbl}</span><span className="font-semibold" style={{ color: col }}>{val}</span></div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ background: col, width: `${messages.length ? Math.round(val/messages.length*100) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deals bar chart */}
      {dealsByStage.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 col-span-2">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">Deals by stage</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dealsByStage} margin={{ top:4, right:4, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize:10, fill:'#d1d5db' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#d1d5db' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip {...tip} />
              <Bar dataKey="count" radius={[4,4,0,0]} name="Deals">
                {dealsByStage.map((d,i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
