'use client';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, FormField } from '@/components/ui/Input';
import { StageBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DEAL_STAGES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

const EMPTY = { title:'', contact_name:'', value:'', stage:'prospect' };

function StageDropdown({ deal, onMove }) {
  const [open, setOpen] = useState(false);
  const current = DEAL_STAGES.find(s => s.key === deal.stage) || DEAL_STAGES[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o=>!o)}
        className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer border-0 flex items-center gap-1.5 w-full ${current.cls}`}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: current.dot }} />
        {current.label}
        <span className="ml-auto text-[8px]">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
            {DEAL_STAGES.map(s => (
              <button key={s.key} onClick={() => { onMove(deal.id, s.key); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-left border-0 cursor-pointer transition-colors
                  ${s.key===deal.stage ? 'bg-gray-50 font-semibold' : 'bg-white hover:bg-gray-50'} text-gray-700`}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
                {s.label}
                {s.key===deal.stage && <span className="ml-auto text-gray-400 text-[10px]">current</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DealsClient({ initialDeals, initialContacts, isAdmin }) {
  const toast = useToast();
  const [deals, setDeals]   = useState(initialDeals);
  const [contacts]          = useState(initialContacts);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const db = createClient();

  const stats = useMemo(() => ({
    pipeline: deals.filter(d=>!['closed_won','closed_lost'].includes(d.stage)).reduce((a,b)=>a+(Number(b.value)||0),0),
    won:      deals.filter(d=>d.stage==='closed_won').reduce((a,b)=>a+(Number(b.value)||0),0),
    open:     deals.filter(d=>!['closed_won','closed_lost'].includes(d.stage)).length,
  }), [deals]);

  async function save() {
    if (!form.title.trim()) { setErr('Title is required.'); return; }
    setSaving(true); setErr('');
    const { error } = await db.from('deals').insert([{
      title: form.title, contact_name: form.contact_name||null,
      value: parseFloat(form.value)||0, stage: form.stage,
      contact_id: contacts.find(c=>c.name===form.contact_name)?.id||null,
    }]);
    if (error) { setErr(error.message); setSaving(false); return; }
    const { data: fresh } = await db.from('deals').select('*').order('created_at', { ascending: false });
    setDeals(fresh||[]);
    setModal(false); setForm(EMPTY); setSaving(false);
    toast('Deal added');
  }

  async function moveStage(id, stage) {
    await db.from('deals').update({ stage }).eq('id', id);
    setDeals(prev => prev.map(d => d.id===id ? {...d, stage} : d));
    toast('Stage updated');
  }

  async function remove(id, title) {
    if (!confirm(`Delete "${title}"?`)) return;
    await db.from('deals').delete().eq('id', id);
    setDeals(prev => prev.filter(d => d.id!==id));
    toast('Deal deleted');
  }

  return (
    <div>
      <PageHeader title="Deals Pipeline" description={`${deals.length} deals total`}
        action={<Button onClick={() => { setModal(true); setForm(EMPTY); setErr(''); }}>+ Add Deal</Button>} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Open Deals"    value={stats.open}                   icon="🤝" color="#2563eb" />
        <StatCard label="Pipeline"      value={formatCurrency(stats.pipeline)} icon="📈" color="#d97706" />
        <StatCard label="Revenue Won"   value={formatCurrency(stats.won)}     icon="💰" color="#059669" />
      </div>

      {deals.length === 0
        ? <EmptyState icon="🤝" title="No deals yet" description="Add your first deal to start tracking your pipeline." action={<Button onClick={() => setModal(true)}>+ Add Deal</Button>} />
        : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
            {DEAL_STAGES.map(stage => {
              const items = deals.filter(d => d.stage===stage.key);
              const val   = items.reduce((a,b) => a+(Number(b.value)||0), 0);
              return (
                <div key={stage.key}>
                  <div className="mb-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${stage.cls}`}>{stage.label}</span>
                    <div className="text-[11px] text-gray-400 mt-1.5 pl-1">
                      {items.length} deal{items.length!==1?'s':''}
                      {val>0 ? ` · ${formatCurrency(val)}` : ''}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {items.map(d => (
                      <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 hover:shadow-sm transition-all">
                        <div className="font-medium text-[13px] text-gray-800 mb-1 leading-snug">{d.title}</div>
                        {d.contact_name && <div className="text-[11px] text-gray-400 mb-2">👤 {d.contact_name}</div>}
                        {Number(d.value)>0 && <div className="text-[13px] font-bold text-emerald-600 mb-2.5">{formatCurrency(d.value)}</div>}
                        <StageDropdown deal={d} onMove={moveStage} />
                        {isAdmin && (
                          <button onClick={() => remove(d.id, d.title)}
                            className="mt-2 text-[11px] text-gray-300 hover:text-red-400 transition-colors border-0 bg-transparent cursor-pointer block">
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {items.length===0 && (
                      <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center text-[11px] text-gray-300">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {modal && (
        <Modal title="Add Deal" onClose={() => setModal(false)} wide>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Deal title *" className="col-span-2">
              <Input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Website redesign project" autoFocus />
            </FormField>
            <FormField label="Value (₹)">
              <Input type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} placeholder="50000" min="0" />
            </FormField>
            <FormField label="Stage">
              <Select value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))}>
                {DEAL_STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Contact" className="col-span-2">
              <Select value={form.contact_name} onChange={e=>setForm(f=>({...f,contact_name:e.target.value}))}>
                <option value="">None</option>
                {contacts.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
              </Select>
            </FormField>
          </div>
          {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Deal'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
