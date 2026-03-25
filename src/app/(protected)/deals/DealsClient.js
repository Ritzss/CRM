'use client';
import { useState } from 'react';
import { createClient } from '../../../lib/supabase-browser';
import { Modal, inputCls, labelCls, btnPrimary, btnSecondary } from '../../../lib/ui';

const STAGES = [
  { key: 'prospect',    label: 'Prospect',    cls: 'text-gray-600 bg-gray-100' },
  { key: 'proposal',   label: 'Proposal',    cls: 'text-blue-700 bg-blue-50' },
  { key: 'negotiation',label: 'Negotiation', cls: 'text-amber-700 bg-amber-50' },
  { key: 'closed_won', label: 'Won',         cls: 'text-emerald-700 bg-emerald-50' },
  { key: 'closed_lost',label: 'Lost',        cls: 'text-red-600 bg-red-50' },
];

const EMPTY = { title: '', contact_name: '', value: '', stage: 'prospect' };

export default function DealsClient({ initialDeals, initialContacts, isAdmin }) {
  const [deals, setDeals]     = useState(initialDeals);
  const [contacts]            = useState(initialContacts);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const db = createClient();

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    const { data } = await db.from('deals').insert([{
      title: form.title, contact_name: form.contact_name,
      value: parseFloat(form.value) || 0, stage: form.stage,
      contact_id: contacts.find(c => c.name === form.contact_name)?.id || null,
    }]).select().single();
    if (data) setDeals(prev => [data, ...prev]);
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

  const totalPipeline = deals
    .filter(d => !['closed_won','closed_lost'].includes(d.stage))
    .reduce((a, b) => a + (Number(b.value) || 0), 0);

  const totalWon = deals
    .filter(d => d.stage === 'closed_won')
    .reduce((a, b) => a + (Number(b.value) || 0), 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          ['Total deals', deals.length, '#111'],
          ['Pipeline value', `₹${totalPipeline.toLocaleString()}`, '#2563eb'],
          ['Revenue won', `₹${totalWon.toLocaleString()}`, '#059669'],
        ].map(([l, v, c]) => (
          <div key={l} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">{l}</div>
            <div className="text-[22px] font-bold" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button className={btnPrimary} onClick={() => { setModal(true); setForm(EMPTY); }}>+ Add Deal</button>
      </div>

      {/* Kanban board */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
        {STAGES.map(stage => {
          const items = deals.filter(d => d.stage === stage.key);
          const stageValue = items.reduce((a, b) => a + (Number(b.value) || 0), 0);
          return (
            <div key={stage.key}>
              <div className="mb-2.5">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${stage.cls}`}>{stage.label}</span>
                <div className="text-[11px] text-gray-400 mt-1 pl-1">{items.length} deal{items.length !== 1 ? 's' : ''} {stageValue > 0 ? `· ₹${stageValue.toLocaleString()}` : ''}</div>
              </div>
              <div className="space-y-2">
                {items.map(d => (
                  <div key={d.id} className="bg-white border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
                    <div className="font-medium text-[13px] text-gray-800 mb-1 leading-snug">{d.title}</div>
                    {d.contact_name && <div className="text-[11px] text-gray-400 mb-2">{d.contact_name}</div>}
                    {d.value > 0 && <div className="text-[12px] font-semibold text-emerald-600 mb-2">₹{Number(d.value).toLocaleString()}</div>}
                    <div className="flex flex-col gap-1">
                      {STAGES.filter(s => s.key !== stage.key).slice(0, 2).map(s => (
                        <button key={s.key} onClick={() => moveStage(d.id, s.key)}
                          className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 cursor-pointer text-left">
                          → {s.label}
                        </button>
                      ))}
                    </div>
                    {isAdmin && (
                      <button onClick={() => remove(d.id)} className="mt-2 text-[10px] text-gray-300 hover:text-red-400 border-0 bg-transparent cursor-pointer">Delete</button>
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
          <div className="flex gap-2 justify-end">
            <button className={btnSecondary} onClick={() => setModal(false)}>Cancel</button>
            <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Deal'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
