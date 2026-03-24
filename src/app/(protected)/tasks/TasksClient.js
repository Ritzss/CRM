'use client';
import { useState } from 'react';
import { createClient } from '../../../lib/supabase-browser';
import { Modal, inputCls, labelCls, btnPrimary, btnSecondary } from '../../../lib/ui';

const COLS = [
  { key: 'todo',       label: 'To Do',       cls: 'text-blue-600 bg-blue-50',   dot: '#2563eb' },
  { key: 'inprogress', label: 'In Progress',  cls: 'text-amber-600 bg-amber-50', dot: '#d97706' },
  { key: 'done',       label: 'Done',         cls: 'text-emerald-600 bg-emerald-50', dot: '#059669' },
];

const TODAY = new Date().toISOString().split('T')[0];

function dueClass(date) {
  if (!date) return 'text-gray-400';
  if (date < TODAY) return 'text-red-500 font-medium';
  if (date === TODAY) return 'text-amber-500 font-medium';
  return 'text-gray-400';
}

const EMPTY = { name: '', contact_name: '', due_date: '', status: 'todo' };

export default function TasksClient({ initialTasks, initialContacts, isAdmin }) {
  const [tasks, setTasks]   = useState(initialTasks);
  const [contacts]          = useState(initialContacts);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const db = createClient();

  async function reload() {
    const { data } = await db.from('tasks').select('*').order('created_at', { ascending: false });
    setTasks(data || []);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    await db.from('tasks').insert([form]);
    await reload();
    setModal(false); setForm(EMPTY); setSaving(false);
  }

  async function move(id, status) {
    await db.from('tasks').update({ status }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }

  async function remove(id) {
    await db.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className={btnPrimary} onClick={() => { setModal(true); setForm(EMPTY); }}>+ Add Task</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLS.map(col => {
          const items = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${col.cls}`}>
                  {col.label}
                </span>
                <span className="text-[11px] text-gray-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(t => (
                  <div key={t.id} className="bg-white border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
                    <div className="font-medium text-[13px] text-gray-800 mb-1">{t.name}</div>
                    {t.contact_name && <div className="text-[11px] text-gray-400 mb-1.5">{t.contact_name}</div>}
                    {t.due_date && (
                      <div className={`text-[11px] ${dueClass(t.due_date)}`}>
                        {t.due_date === TODAY ? 'Due today'
                          : t.due_date < TODAY ? `Overdue · ${t.due_date}`
                          : `Due · ${t.due_date}`}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      {COLS.filter(c => c.key !== col.key).map(c => (
                        <button key={c.key} onClick={() => move(t.id, c.key)}
                          className="text-[10px] px-2 py-0.5 rounded-full border cursor-pointer bg-transparent hover:opacity-70 transition-opacity"
                          style={{ color: c.dot, borderColor: c.dot }}>
                          → {c.label}
                        </button>
                      ))}
                      {isAdmin && (
                        <button onClick={() => remove(t.id)}
                          className="ml-auto text-gray-200 hover:text-red-400 transition-colors text-sm leading-none border-0 bg-transparent cursor-pointer">✕</button>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="border border-dashed border-gray-200 rounded-lg p-5 text-center text-[12px] text-gray-300">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)}>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-5">Add Task</h3>
          <div className="mb-3">
            <label className={labelCls}>Task name *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Follow up call" />
          </div>
          <div className="mb-3">
            <label className={labelCls}>Contact</label>
            <select className={inputCls} value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })}>
              <option value="">None</option>
              {contacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className={labelCls}>Due date</label>
            <input type="date" className={inputCls} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="mb-5">
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button className={btnSecondary} onClick={() => setModal(false)}>Cancel</button>
            <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
