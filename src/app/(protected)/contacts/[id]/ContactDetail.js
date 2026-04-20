'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea, FormField } from '@/components/ui/Input';
import { StatusBadge, StageBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { NOTE_TYPES, DEAL_STAGES } from '@/lib/constants';
import { timeAgo, formatCurrency, formatDateTime } from '@/lib/utils';

const NOTE_ICONS = { note:'📝', call:'📞', meeting:'🤝', email:'✉️', whatsapp:'💬' };

export default function ContactDetail({ contact, notes:initNotes, deals:initDeals, tasks:initTasks, reminders:initReminders, attachments:initAttachments, messages, isAdmin, userId, userName }) {
  const toast = useToast();
  const db    = createClient();

  const [notes, setNotes]           = useState(initNotes);
  const [deals, setDeals]           = useState(initDeals);
  const [reminders, setReminders]   = useState(initReminders);
  const [attachments, setAttachments] = useState(initAttachments);

  const [noteForm, setNoteForm]     = useState({ type:'note', body:'' });
  const [savingNote, setSavingNote] = useState(false);

  const [dealModal, setDealModal]   = useState(false);
  const [dealForm, setDealForm]     = useState({ title:'', value:'', stage:'prospect' });

  const [remModal, setRemModal]     = useState(false);
  const [remForm, setRemForm]       = useState({ note:'', remind_at:'' });

  const [editModal, setEditModal]   = useState(false);
  const [editForm, setEditForm]     = useState({ name:contact.name, company:contact.company||'', phone:contact.phone||'', email:contact.email||'', status:contact.status });

  const [uploading, setUploading]   = useState(false);
  const [activeTab, setActiveTab]   = useState('activity');

  async function addNote() {
    if (!noteForm.body.trim()) return;
    setSavingNote(true);
    const { data, error } = await db.from('notes').insert([{
      contact_id: contact.id, author_id: userId, author_name: userName,
      type: noteForm.type, body: noteForm.body,
    }]).select().single();
    if (error) { toast(error.message, 'error'); setSavingNote(false); return; }
    setNotes(p => [data, ...p]);
    setNoteForm({ type:'note', body:'' });
    toast('Activity logged');
    setSavingNote(false);
  }

  async function deleteNote(id) {
    await db.from('notes').delete().eq('id', id);
    setNotes(p => p.filter(n => n.id !== id));
    toast('Note deleted');
  }

  async function addDeal() {
    if (!dealForm.title.trim()) return;
    const { data, error } = await db.from('deals').insert([{
      title: dealForm.title, contact_id: contact.id,
      contact_name: contact.name, value: parseFloat(dealForm.value)||0, stage: dealForm.stage,
    }]).select().single();
    if (error) { toast(error.message, 'error'); return; }
    setDeals(p => [data, ...p]);
    setDealModal(false); setDealForm({ title:'', value:'', stage:'prospect' });
    toast('Deal added');
  }

  async function moveDeal(id, stage) {
    await db.from('deals').update({ stage }).eq('id', id);
    setDeals(p => p.map(d => d.id===id ? { ...d, stage } : d));
    toast('Deal stage updated');
  }

  async function addReminder() {
    if (!remForm.remind_at) return;
    const { data, error } = await db.from('reminders').insert([{
      contact_id: contact.id, user_id: userId,
      note: remForm.note, remind_at: remForm.remind_at,
    }]).select().single();
    if (error) { toast(error.message, 'error'); return; }
    setReminders(p => [...p, data]);
    setRemModal(false); setRemForm({ note:'', remind_at:'' });
    toast('Reminder set');
  }

  async function toggleReminder(id, done) {
    await db.from('reminders').update({ done }).eq('id', id);
    setReminders(p => p.map(r => r.id===id ? { ...r, done } : r));
  }

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${contact.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await db.storage.from('attachments').upload(path, file);
    if (upErr) { toast(upErr.message, 'error'); setUploading(false); return; }
    const { data } = await db.from('attachments').insert([{
      contact_id: contact.id, uploaded_by: userId,
      file_name: file.name, file_path: path, file_size: file.size,
    }]).select().single();
    if (data) setAttachments(p => [data, ...p]);
    toast(`${file.name} uploaded`);
    setUploading(false);
    e.target.value = '';
  }

  async function downloadFile(path) {
    const { data } = await db.storage.from('attachments').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function deleteFile(id, path) {
    await db.storage.from('attachments').remove([path]);
    await db.from('attachments').delete().eq('id', id);
    setAttachments(p => p.filter(a => a.id!==id));
    toast('File deleted');
  }

  async function saveEdit() {
    const { error } = await db.from('contacts').update(editForm).eq('id', contact.id);
    if (error) { toast(error.message, 'error'); return; }
    setEditModal(false);
    toast('Contact updated');
    window.location.reload();
  }

  const tabs = [
    { key:'activity', label:'Activity', count: notes.length },
    { key:'deals',    label:'Deals',    count: deals.length },
    { key:'tasks',    label:'Tasks',    count: initTasks.length },
    { key:'files',    label:'Files',    count: attachments.length },
    { key:'messages', label:'Messages', count: messages.length },
  ];

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <Link href="/contacts" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors no-underline mb-5">
        ← Back to Contacts
      </Link>

      {/* Contact header card */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-5">
        <div className="flex items-start gap-4">
          <Avatar name={contact.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-xl font-bold text-gray-900 m-0">{contact.name}</h2>
              <StatusBadge status={contact.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-400">
              {contact.company && <span>🏢 {contact.company}</span>}
              {contact.phone   && <span>📞 {contact.phone}</span>}
              {contact.email   && <span>✉️ {contact.email}</span>}
            </div>
          </div>
          {isAdmin && (
            <Button variant="secondary" size="sm" onClick={() => setEditModal(true)}>Edit</Button>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
          {[
            ['Deals', deals.length],
            ['Tasks', initTasks.length],
            ['Notes', notes.length],
            ['Messages', messages.length],
          ].map(([l,v]) => (
            <div key={l} className="text-center">
              <div className="text-xl font-bold text-gray-900">{v}</div>
              <div className="text-xs text-gray-400">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* Left — tabs */}
        <div>
          {/* Log activity */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
            <div className="text-sm font-semibold text-gray-800 mb-3">Log Activity</div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {NOTE_TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => setNoteForm(f => ({ ...f, type: t.key }))}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer
                    ${noteForm.type===t.key ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <Textarea rows={3} value={noteForm.body} onChange={e => setNoteForm(f => ({ ...f, body: e.target.value }))}
              placeholder={`Log a ${noteForm.type}…`} />
            <div className="flex justify-end mt-2">
              <Button onClick={addNote} disabled={savingNote} size="sm">{savingNote ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex border-b border-gray-100">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-xs font-medium transition-colors cursor-pointer border-0 bg-transparent flex items-center gap-1.5
                    ${activeTab===tab.key ? 'text-emerald-700 border-b-2 border-emerald-500 -mb-px' : 'text-gray-400 hover:text-gray-600'}`}>
                  {tab.label}
                  {tab.count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab===tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Activity tab */}
              {activeTab === 'activity' && (
                notes.length === 0
                  ? <p className="text-sm text-gray-300 text-center py-6">No activity logged yet.</p>
                  : notes.map(n => (
                    <div key={n.id} className="flex gap-3 mb-4 last:mb-0 group">
                      <div className="text-lg shrink-0 mt-0.5">{NOTE_ICONS[n.type]||'📝'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-600 capitalize">{n.type}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{n.author_name}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed m-0">{n.body}</p>
                      </div>
                      {isAdmin && (
                        <button onClick={() => deleteNote(n.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-sm border-0 bg-transparent cursor-pointer shrink-0">✕</button>
                      )}
                    </div>
                  ))
              )}

              {/* Deals tab */}
              {activeTab === 'deals' && (
                <div>
                  <div className="flex justify-end mb-3">
                    <Button size="sm" onClick={() => setDealModal(true)}>+ Add Deal</Button>
                  </div>
                  {deals.length === 0
                    ? <p className="text-sm text-gray-300 text-center py-4">No deals yet.</p>
                    : deals.map(d => (
                      <div key={d.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800">{d.title}</div>
                          {d.value > 0 && <div className="text-xs text-emerald-600 font-semibold">{formatCurrency(d.value)}</div>}
                        </div>
                        <select value={d.stage} onChange={e => moveDeal(d.id, e.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400">
                          {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* Tasks tab */}
              {activeTab === 'tasks' && (
                initTasks.length === 0
                  ? <p className="text-sm text-gray-300 text-center py-4">No tasks linked.</p>
                  : initTasks.map(t => (
                    <div key={t.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${t.status==='done'?'bg-emerald-400':t.status==='inprogress'?'bg-amber-400':'bg-gray-300'}`} />
                      <div>
                        <div className={`text-sm ${t.status==='done'?'line-through text-gray-300':'text-gray-700'}`}>{t.name}</div>
                        {t.due_date && <div className="text-xs text-gray-400 mt-0.5">Due: {t.due_date}</div>}
                      </div>
                    </div>
                  ))
              )}

              {/* Files tab */}
              {activeTab === 'files' && (
                <div>
                  <div className="flex justify-end mb-3">
                    <label className={`px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition ${uploading?'opacity-50':''}`}>
                      {uploading ? 'Uploading…' : '+ Upload File'}
                      <input type="file" className="hidden" onChange={uploadFile} disabled={uploading} />
                    </label>
                  </div>
                  {attachments.length === 0
                    ? <p className="text-sm text-gray-300 text-center py-4">No files attached.</p>
                    : attachments.map(a => (
                      <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 group">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">📄</div>
                        <div className="flex-1 min-w-0">
                          <button onClick={() => downloadFile(a.file_path)}
                            className="text-sm text-blue-600 hover:underline truncate block text-left border-0 bg-transparent cursor-pointer p-0 max-w-full">{a.file_name}</button>
                          {a.file_size && <div className="text-xs text-gray-400">{(a.file_size/1024).toFixed(1)} KB</div>}
                        </div>
                        {isAdmin && (
                          <button onClick={() => deleteFile(a.id, a.file_path)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-sm border-0 bg-transparent cursor-pointer">✕</button>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}

              {/* Messages tab */}
              {activeTab === 'messages' && (
                messages.length === 0
                  ? <p className="text-sm text-gray-300 text-center py-4">No messages sent yet.</p>
                  : messages.map(m => (
                    <div key={m.id} className="py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.channel==='sms'?'bg-amber-50 text-amber-600':'bg-blue-50 text-blue-600'}`}>{m.channel.toUpperCase()}</span>
                        <span className="text-xs text-gray-400">{timeAgo(m.sent_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 m-0">{m.body}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="flex flex-col gap-4">
          {/* Reminders */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-800">Reminders</div>
              <button onClick={() => setRemModal(true)} className="text-xs text-emerald-600 hover:underline cursor-pointer border-0 bg-transparent">+ Add</button>
            </div>
            {reminders.length === 0
              ? <p className="text-xs text-gray-300">No reminders set.</p>
              : reminders.map(r => (
                <div key={r.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                  <input type="checkbox" checked={r.done} onChange={e => toggleReminder(r.id, e.target.checked)} className="mt-1 cursor-pointer accent-emerald-600" />
                  <div>
                    <div className={`text-sm ${r.done?'line-through text-gray-300':'text-gray-700'}`}>{r.note||'Follow up'}</div>
                    <div className="text-xs text-gray-400">{formatDateTime(r.remind_at)}</div>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Deal summary */}
          {deals.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">Deal Summary</div>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(deals.reduce((a,b) => a+(Number(b.value)||0), 0))}</div>
              <div className="text-xs text-gray-400 mb-3">total across {deals.length} deal{deals.length!==1?'s':''}</div>
              {deals.map(d => (
                <div key={d.id} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-600 truncate max-w-[130px]">{d.title}</span>
                  <StageBadge stage={d.stage} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {dealModal && (
        <Modal title="Add Deal" onClose={() => setDealModal(false)}>
          <FormField label="Title *"><Input value={dealForm.title} onChange={e => setDealForm(f=>({...f,title:e.target.value}))} placeholder="Website redesign" /></FormField>
          <FormField label="Value (₹)"><Input type="number" value={dealForm.value} onChange={e => setDealForm(f=>({...f,value:e.target.value}))} placeholder="50000" /></FormField>
          <FormField label="Stage">
            <Select value={dealForm.stage} onChange={e => setDealForm(f=>({...f,stage:e.target.value}))}>
              {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
          </FormField>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setDealModal(false)}>Cancel</Button>
            <Button onClick={addDeal}>Save Deal</Button>
          </div>
        </Modal>
      )}

      {remModal && (
        <Modal title="Set Reminder" onClose={() => setRemModal(false)}>
          <FormField label="Note"><Input value={remForm.note} onChange={e => setRemForm(f=>({...f,note:e.target.value}))} placeholder="Follow up about proposal" /></FormField>
          <FormField label="Remind at *"><Input type="datetime-local" value={remForm.remind_at} onChange={e => setRemForm(f=>({...f,remind_at:e.target.value}))} /></FormField>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setRemModal(false)}>Cancel</Button>
            <Button onClick={addReminder}>Set Reminder</Button>
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal title="Edit Contact" onClose={() => setEditModal(false)}>
          <FormField label="Name"><Input value={editForm.name} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} /></FormField>
          <FormField label="Company"><Input value={editForm.company} onChange={e => setEditForm(f=>({...f,company:e.target.value}))} /></FormField>
          <FormField label="Phone"><Input value={editForm.phone} onChange={e => setEditForm(f=>({...f,phone:e.target.value}))} /></FormField>
          <FormField label="Email"><Input type="email" value={editForm.email} onChange={e => setEditForm(f=>({...f,email:e.target.value}))} /></FormField>
          <FormField label="Status">
            <Select value={editForm.status} onChange={e => setEditForm(f=>({...f,status:e.target.value}))}>
              <option value="lead">Lead</option><option value="customer">Customer</option><option value="cold">Cold</option>
            </Select>
          </FormField>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
