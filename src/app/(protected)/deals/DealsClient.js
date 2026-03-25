'use client';
import { useState } from 'react';
import { createClient } from '../../../lib/supabase-browser';
import { Modal, inputCls, labelCls, btnPrimary, btnSecondary } from '../../../lib/ui';

const STAGES = [
  { key: 'prospect',    label: 'Prospect',    cls: 'text-gray-600 bg-gray-100',    dot: '#9ca3af' },
  { key: 'proposal',   label: 'Proposal',    cls: 'text-blue-700 bg-blue-50',     dot: '#2563eb' },
  { key: 'negotiation',label: 'Negotiation', cls: 'text-amber-700 bg-amber-50',   dot: '#d97706' },
  { key: 'closed_won', label: 'Won ✓',       cls: 'text-emerald-700 bg-emerald-50', dot: '#059669' },
  { key: 'closed_lost',label: 'Lost ✕',      cls: 'text-red-600 bg-red-50',       dot: '#dc2626' },
];

const EMPTY = { title: '', contact_name: '', value: '', stage: 'prospect' };

function StageDropdown({ deal, onMove }) {
  const [open, setOpen] = useState(false);
  const current = STAGES.find(s => s.key === deal.stage);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer border-0 w-full text-left flex items-center justify-between gap-1 ${current.cls}`}>
        <span>{current.label}</span>
        <span style={{ fontSize: 8 }}>▼</span>
      </button>
      {open && (
        <>
          {/* backdrop */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4, minWidth: 150, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {STAGES.map(s => (
              <button key={s.key} onClick={() => { onMove(deal.id, s.key); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: 12, background: s.key === deal.stage ? 'var(--color-background-secondary)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text-primary)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
                {s.label}
                {s.key === deal.stage && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-secondary)' }}>current</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DealsClient({ initialDeals, initialContacts, isAdmin }) {
  const [deals, setDeals]     = useState(initialDeals);
  const [contacts]            = useState(initialContacts);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const db = createClient();

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true); setSaveErr('');
    const { error } = await db.from('deals').insert([{
      title: form.title,
      contact_name: form.contact_name || null,
      value: parseFloat(form.value) || 0,
      stage: form.stage,
      contact_id: contacts.find(c => c.name === form.contact_name)?.id || null,
    }]);
    if (error) { setSaveErr(error.message); setSaving(false); return; }
    const { data: fresh } = await db.from('deals').select('*').order('created_at', { ascending: false });
    setDeals(fresh || []);
    setModal(false); setForm(EMPTY); setSaving(false);
  }

  async function moveStage(id, stage) {
    await db.from('deals').update({ stage }).eq('id', id);
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d));
  }

  async function remove(id) {
    if (!confirm('Delete this deal?')) return;
    await db.from('deals').delete().eq('id', id);
    setDeals(prev => prev.filter(d => d.id !== id));
  }

  const totalPipeline = deals.filter(d => !['closed_won','closed_lost'].includes(d.stage)).reduce((a, b) => a + (Number(b.value) || 0), 0);
  const totalWon      = deals.filter(d => d.stage === 'closed_won').reduce((a, b) => a + (Number(b.value) || 0), 0);

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[['Total deals', deals.length, '#111'], ['Pipeline value', `₹${totalPipeline.toLocaleString()}`, '#2563eb'], ['Revenue won', `₹${totalWon.toLocaleString()}`, '#059669']].map(([l, v, c]) => (
          <div key={l} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">{l}</div>
            <div className="text-[22px] font-bold" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button className={btnPrimary} onClick={() => { setModal(true); setForm(EMPTY); setSaveErr(''); }}>+ Add Deal</button>
      </div>

      {/* Kanban */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
        {STAGES.map(stage => {
          const items = deals.filter(d => d.stage === stage.key);
          const stageValue = items.reduce((a, b) => a + (Number(b.value) || 0), 0);
          return (
            <div key={stage.key}>
              <div className="mb-2.5">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${stage.cls}`}>{stage.label}</span>
                <div className="text-[11px] text-gray-400 mt-1 pl-1">
                  {items.length} deal{items.length !== 1 ? 's' : ''}
                  {stageValue > 0 ? ` · ₹${stageValue.toLocaleString()}` : ''}
                </div>
              </div>
              <div className="space-y-2">
                {items.map(d => (
                  <div key={d.id} className="bg-white border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
                    <div className="font-medium text-[13px] text-gray-800 mb-1 leading-snug">{d.title}</div>
                    {d.contact_name && <div className="text-[11px] text-gray-400 mb-1.5">{d.contact_name}</div>}
                    {Number(d.value) > 0 && <div className="text-[12px] font-semibold text-emerald-600 mb-2">₹{Number(d.value).toLocaleString()}</div>}

                    {/* Stage dropdown — shows ALL stages */}
                    <StageDropdown deal={d} onMove={moveStage} />

                    {isAdmin && (
                      <button onClick={() => remove(d.id)} className="mt-2 text-[10px] text-gray-300 hover:text-red-400 border-0 bg-transparent cursor-pointer block">
                        Delete
                      </button>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-[11px] text-gray-300">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)} wide>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-5">Add Deal</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className={labelCls}>Title *</label><input className={inputCls} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="Website redesign" /></div>
            <div><label className={labelCls}>Value (₹)</label><input type="number" className={inputCls} value={form.value} onChange={e => setForm({...form,value:e.target.value})} placeholder="50000" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className={labelCls}>Contact</label>
              <select className={inputCls} value={form.contact_name} onChange={e => setForm({...form,contact_name:e.target.value})}>
                <option value="">None</option>
                {contacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Stage</label>
              <select className={inputCls} value={form.stage} onChange={e => setForm({...form,stage:e.target.value})}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {saveErr && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-[12px] text-red-600">{saveErr}</div>}
          <div className="flex gap-2 justify-end">
            <button className={btnSecondary} onClick={() => setModal(false)}>Cancel</button>
            <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Deal'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
