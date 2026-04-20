'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, FormField } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/PageHeader';

const EMPTY = { name:'', company:'', phone:'', email:'', status:'lead' };

export default function ContactsClient({ initial, isAdmin }) {
  const toast = useToast();
  const [contacts, setContacts] = useState(initial);
  const [search, setSearch]     = useState('');
  const [statusFilter, setFilter] = useState('all');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  const db = createClient();

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

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
    toast('Contact added successfully');
  }

  async function remove(id, name) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const { error } = await db.from('contacts').delete().eq('id', id);
    if (error) { toast(error.message, 'error'); return; }
    setContacts(prev => prev.filter(c => c.id !== id));
    toast(`${name} deleted`);
  }

  const filtered = useMemo(() => contacts.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || (c.company||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.phone||'').includes(q);
    const matchS = statusFilter === 'all' || c.status === statusFilter;
    return matchQ && matchS;
  }), [contacts, search, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${contacts.length} total contacts`}
        action={isAdmin && <Button onClick={() => { setModal(true); setForm(EMPTY); setErr(''); }}>+ Add Contact</Button>}
      />

      {/* Filters */}
      <div className="flex gap-2.5 mb-5 flex-wrap">
        <Input className="flex-1 min-w-[200px] max-w-sm" value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Search name, company, email, phone…" />
        <div className="flex gap-1.5">
          {['all','lead','customer','cold'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 text-xs rounded-lg border transition-all cursor-pointer capitalize font-medium
                ${statusFilter===s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {!isAdmin && (
        <div className="mb-4 px-4 py-2.5 bg-sky-50 border border-sky-100 rounded-lg text-xs text-sky-600">
          👁 Read-only access — contact an Admin to add or edit contacts.
        </div>
      )}

      <div className="text-xs text-gray-400 mb-2">{filtered.length} result{filtered.length!==1?'s':''}</div>

      {filtered.length === 0
        ? <EmptyState icon="👤" title="No contacts found" description="Try adjusting your search or filters." />
        : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name','Company','Phone','Email','Status','Added',...(isAdmin?['']:[''])].map(h => (
                    <th key={h+Math.random()} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-2.5 no-underline">
                        <Avatar name={c.name} size="sm" />
                        <span className="font-medium text-gray-800 group-hover:text-emerald-600 transition-colors">{c.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-[13px]">{c.company||'—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-[13px]">{c.phone||'—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-[13px]">{c.email||'—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-[12px]">{new Date(c.created_at).toLocaleDateString('en-IN',{dateStyle:'medium'})}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button onClick={() => remove(c.id, c.name)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-base leading-none border-0 bg-transparent cursor-pointer">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {modal && (
        <Modal title="Add Contact" onClose={() => setModal(false)}>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Full name *" className="col-span-2">
              <Input value={form.name} onChange={e => set('name',e.target.value)} placeholder="Riya Sharma" />
            </FormField>
            <FormField label="Company">
              <Input value={form.company} onChange={e => set('company',e.target.value)} placeholder="Acme Ltd." />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={e => set('status',e.target.value)}>
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
                <option value="cold">Cold</option>
              </Select>
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={e => set('phone',e.target.value)} placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={e => set('email',e.target.value)} placeholder="riya@acme.com" />
            </FormField>
          </div>
          {err && <p className="text-red-500 text-xs mt-1 mb-3">{err}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Contact'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
