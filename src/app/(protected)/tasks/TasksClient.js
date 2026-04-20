'use client';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, FormField } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { TASK_STATUSES } from '@/lib/constants';

const TODAY = new Date().toISOString().split('T')[0];
const EMPTY = { name:'', contact_name:'', due_date:'', status:'todo' };

function dueLabel(date) {
  if (!date) return null;
  if (date < TODAY) return { text: 'Overdue', cls: 'text-red-500 font-semibold' };
  if (date === TODAY) return { text: 'Due today', cls: 'text-amber-500 font-semibold' };
  return { text: `Due ${date}`, cls: 'text-gray-400' };
}

export default function TasksClient({ initialTasks, initialContacts, isAdmin }) {
  const toast = useToast();
  const [tasks, setTasks]   = useState(initialTasks);
  const [contacts]          = useState(initialContacts);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const db = createClient();

  const counts = useMemo(() => ({
    all:        tasks.length,
    todo:       tasks.filter(t=>t.status==='todo').length,
    inprogress: tasks.filter(t=>t.status==='inprogress').length,
    done:       tasks.filter(t=>t.status==='done').length,
    overdue:    tasks.filter(t=>t.due_date && t.due_date<TODAY && t.status!=='done').length,
  }), [tasks]);

  const filtered = useMemo(() => {
    if (filter === 'overdue') return tasks.filter(t=>t.due_date&&t.due_date<TODAY&&t.status!=='done');
    if (filter === 'all') return tasks;
    return tasks.filter(t=>t.status===filter);
  }, [tasks, filter]);

  async function reload() {
    const { data } = await db.from('tasks').select('*').order('created_at', { ascending: false });
    setTasks(data||[]);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await db.from('tasks').insert([form]);
    if (error) { toast(error.message, 'error'); setSaving(false); return; }
    await reload();
    setModal(false); setForm(EMPTY); setSaving(false);
    toast('Task added');
  }

  async function move(id, status) {
    await db.from('tasks').update({ status }).eq('id', id);
    setTasks(prev => prev.map(t => t.id===id ? {...t, status} : t));
    toast('Task updated');
  }

  async function remove(id) {
    if (!isAdmin) return;
    await db.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id!==id));
    toast('Task deleted');
  }

  const FILTERS = [
    { key:'all', label:'All', count: counts.all },
    { key:'todo', label:'To Do', count: counts.todo },
    { key:'inprogress', label:'In Progress', count: counts.inprogress },
    { key:'done', label:'Done', count: counts.done },
    { key:'overdue', label:'Overdue', count: counts.overdue },
  ];

  return (
    <div>
      <PageHeader title="Tasks & Follow-ups" description={`${counts.all} tasks · ${counts.overdue} overdue`}
        action={<Button onClick={() => { setModal(true); setForm(EMPTY); }}>+ Add Task</Button>} />

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 font-medium
              ${filter===f.key
                ? f.key==='overdue' ? 'bg-red-500 text-white border-red-500' : 'bg-emerald-600 text-white border-emerald-600'
                : f.key==='overdue' && f.count>0 ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            {f.label}
            {f.count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter===f.key?'bg-white/20 text-white':'bg-gray-100 text-gray-500'}`}>{f.count}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <EmptyState icon="✅" title="No tasks here" description={filter==='all'?"Add your first task to get started.":"No tasks match this filter."} />
        : (
          <div className="grid grid-cols-3 gap-4">
            {TASK_STATUSES.map(col => {
              const colTasks = filtered.filter(t => t.status===col.key);
              if (filter !== 'all' && filter !== col.key && filter !== 'overdue') return null;
              if (colTasks.length === 0 && filter !== 'all') return null;
              return (
                <div key={col.key}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${col.cls}`}>{col.label}</span>
                    <span className="text-xs text-gray-400">{colTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map(t => {
                      const due = dueLabel(t.due_date);
                      return (
                        <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 hover:shadow-sm transition-all group">
                          <div className="font-medium text-[13px] text-gray-800 mb-1">{t.name}</div>
                          {t.contact_name && <div className="text-[11px] text-gray-400 mb-1">👤 {t.contact_name}</div>}
                          {due && <div className={`text-[11px] mb-2 ${due.cls}`}>{due.text}</div>}
                          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                            {TASK_STATUSES.filter(s=>s.key!==col.key).map(s => (
                              <button key={s.key} onClick={() => move(t.id, s.key)}
                                className="text-[10px] px-2 py-0.5 rounded-full border cursor-pointer bg-transparent hover:opacity-70 transition-opacity font-medium"
                                style={{ color: s.dot, borderColor: s.dot }}>
                                → {s.label}
                              </button>
                            ))}
                            {isAdmin && (
                              <button onClick={() => remove(t.id)}
                                className="ml-auto opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-sm border-0 bg-transparent cursor-pointer">✕</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {colTasks.length===0 && (
                      <div className="border border-dashed border-gray-200 rounded-xl p-5 text-center text-[11px] text-gray-300">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {modal && (
        <Modal title="Add Task" onClose={() => setModal(false)}>
          <FormField label="Task name *">
            <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Follow up call" autoFocus />
          </FormField>
          <FormField label="Contact">
            <Select value={form.contact_name} onChange={e=>setForm(f=>({...f,contact_name:e.target.value}))}>
              <option value="">None</option>
              {contacts.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Due date">
              <Input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                {TASK_STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving?'Saving…':'Save Task'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
