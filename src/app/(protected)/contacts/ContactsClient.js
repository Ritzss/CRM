'use client';
import { useState } from 'react';
import { createClient } from '../../../lib/supabase-browser';
import { Modal, Badge, initials, inputCls, labelCls, btnPrimary, btnSecondary } from '../../../lib/ui';

const EMPTY = { name: '', company: '', phone: '', email: '', status: 'lead' };

export default function ContactsClient({ initial, isAdmin }) {
  const [contacts, setContacts] = useState(initial);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  const db = createClient();

  async function reload() {
    const { data } = await db.from('contacts').select('*').order('created_at', { ascending: false });
    setContacts(data || []);
  }

  async function save() {
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    setSaving(true); setErr('');
    const { error } = await db.from('contacts').insert([form]);
    if (error) { setErr(error.message); setSaving(false); return; }
    await reload();
    setModal(false); setForm(EMPTY); setSaving(false);
  }

  async function remove(id) {
    if (!confirm('Delete this contact?')) return;
    await db.from('contacts').delete().eq('id', id);
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex gap-2.5 mb-4">
        <input className={inputCls + ' flex-1'} value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Search by name or company…" />
        {isAdmin && (
          <button className={btnPrimary} onClick={() => { setModal(true); setForm(EMPTY); setErr(''); }}>
            + Add Contact
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[12px] text-blue-600">
          You have read-only access. Contact an admin to add or remove contacts.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              {['Name', 'Company', 'Phone', 'Email', 'Status', ...(isAdmin ? [''] : [])].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {initials(c.name)}
                    </div>
                    <span className="font-medium text-gray-800">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.company || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                <td className="px-4 py-3"><Badge status={c.status} /></td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <button onClick={() => remove(c.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none border-0 bg-transparent cursor-pointer">✕</button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-300 text-[13px]">No contacts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)}>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-5">Add Contact</h3>
          {[['name', 'Name *'], ['company', 'Company'], ['phone', 'Phone'], ['email', 'Email']].map(([k, l]) => (
            <div key={k} className="mb-3">
              <label className={labelCls}>{l}</label>
              <input className={inputCls} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div className="mb-5">
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="lead">Lead</option>
              <option value="customer">Customer</option>
              <option value="cold">Cold</option>
            </select>
          </div>
          {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
          <div className="flex gap-2 justify-end">
            <button className={btnSecondary} onClick={() => setModal(false)}>Cancel</button>
            <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
