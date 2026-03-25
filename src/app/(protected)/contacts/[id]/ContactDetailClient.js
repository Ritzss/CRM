'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase-browser';
import { Badge, initials, inputCls, labelCls, btnPrimary, btnSecondary, Modal } from '../../../../lib/ui';

const NOTE_TYPES = ['note','call','meeting','email','whatsapp'];
const NOTE_ICONS = { note:'📝', call:'📞', meeting:'🤝', email:'✉️', whatsapp:'💬' };
const STAGE_COLORS = {
  prospect:    'bg-gray-100 text-gray-600',
  proposal:    'bg-blue-50 text-blue-700',
  negotiation: 'bg-amber-50 text-amber-700',
  closed_won:  'bg-emerald-50 text-emerald-700',
  closed_lost: 'bg-red-50 text-red-600',
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ContactDetailClient({
  contact, notes: initNotes, deals: initDeals, tasks: initTasks,
  reminders: initReminders, attachments: initAttachments, messages,
  isAdmin, userId, userName,
}) {
  const db = createClient();

  // Notes
  const [notes, setNotes]         = useState(initNotes);
  const [noteForm, setNoteForm]   = useState({ type: 'note', body: '' });
  const [savingNote, setSavingNote] = useState(false);

  // Deals
  const [deals, setDeals]         = useState(initDeals);
  const [dealModal, setDealModal] = useState(false);
  const [dealForm, setDealForm]   = useState({ title: '', value: '', stage: 'prospect' });

  // Reminders
  const [reminders, setReminders]     = useState(initReminders);
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderForm, setReminderForm]   = useState({ note: '', remind_at: '' });

  // Attachments
  const [attachments, setAttachments] = useState(initAttachments);
  const [uploading, setUploading]     = useState(false);

  // Edit contact
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm]   = useState({ name: contact.name, company: contact.company || '', phone: contact.phone || '', email: contact.email || '', status: contact.status });

  async function addNote() {
    if (!noteForm.body.trim()) return;
    setSavingNote(true);
    const { data } = await db.from('notes').insert([{
      contact_id: contact.id, author_id: userId, author_name: userName,
      type: noteForm.type, body: noteForm.body,
    }]).select().single();
    if (data) setNotes(prev => [data, ...prev]);
    setNoteForm({ type: 'note', body: '' });
    setSavingNote(false);
  }

  async function deleteNote(id) {
    await db.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  async function addDeal() {
    if (!dealForm.title.trim()) return;
    const { data } = await db.from('deals').insert([{
      title: dealForm.title, contact_id: contact.id,
      contact_name: contact.name, value: parseFloat(dealForm.value) || 0,
      stage: dealForm.stage,
    }]).select().single();
    if (data) setDeals(prev => [data, ...prev]);
    setDealModal(false);
    setDealForm({ title: '', value: '', stage: 'prospect' });
  }

  async function updateDealStage(id, stage) {
    await db.from('deals').update({ stage }).eq('id', id);
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d));
  }

  async function addReminder() {
    if (!reminderForm.remind_at) return;
    const { data } = await db.from('reminders').insert([{
      contact_id: contact.id, user_id: userId,
      note: reminderForm.note, remind_at: reminderForm.remind_at,
    }]).select().single();
    if (data) setReminders(prev => [...prev, data]);
    setReminderModal(false);
    setReminderForm({ note: '', remind_at: '' });
  }

  async function toggleReminder(id, done) {
    await db.from('reminders').update({ done }).eq('id', id);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done } : r));
  }

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${contact.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await db.storage.from('attachments').upload(path, file);
    if (!upErr) {
      const { data } = await db.from('attachments').insert([{
        contact_id: contact.id, uploaded_by: userId,
        file_name: file.name, file_path: path, file_size: file.size,
      }]).select().single();
      if (data) setAttachments(prev => [data, ...prev]);
    }
    setUploading(false);
    e.target.value = '';
  }

  async function downloadFile(path, name) {
    const { data } = await db.storage.from('attachments').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function deleteAttachment(id, path) {
    await db.storage.from('attachments').remove([path]);
    await db.from('attachments').delete().eq('id', id);
    setAttachments(prev => prev.filter(a => a.id !== id));
  }

  async function saveEdit() {
    await db.from('contacts').update(editForm).eq('id', contact.id);
    setEditModal(false);
    window.location.reload();
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/contacts" className="text-gray-400 hover:text-gray-600 transition-colors text-sm no-underline mt-1">← Back</Link>
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 text-[14px] font-bold flex items-center justify-center shrink-0">
          {initials(contact.name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 m-0">{contact.name}</h2>
            <Badge status={contact.status} />
          </div>
          <div className="text-[13px] text-gray-400 mt-1 flex gap-4 flex-wrap">
            {contact.company && <span>{contact.company}</span>}
            {contact.phone   && <span>{contact.phone}</span>}
            {contact.email   && <span>{contact.email}</span>}
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setEditModal(true)} className={btnSecondary + ' text-[12px] py-1.5'}>Edit</button>
        )}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* Left column */}
        <div className="flex flex-col gap-5">

          {/* Add note */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="text-[13px] font-semibold text-gray-800 mb-3">Log activity</div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {NOTE_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setNoteForm(f => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 text-[11px] rounded-lg border transition-all cursor-pointer capitalize
                    ${noteForm.type === t ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {NOTE_ICONS[t]} {t}
                </button>
              ))}
            </div>
            <textarea
              className={inputCls} rows={3} value={noteForm.body}
              onChange={e => setNoteForm(f => ({ ...f, body: e.target.value }))}
              placeholder={`Log a ${noteForm.type}…`}
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
            <div className="flex justify-end mt-2">
              <button className={btnPrimary} onClick={addNote} disabled={savingNote}>
                {savingNote ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="text-[13px] font-semibold text-gray-800 mb-4">Activity timeline</div>
            {notes.length === 0
              ? <p className="text-[12px] text-gray-300">No activity yet. Log your first note above.</p>
              : notes.map(n => (
                <div key={n.id} className="flex gap-3 mb-4 last:mb-0">
                  <div className="text-base mt-0.5 shrink-0">{NOTE_ICONS[n.type] || '📝'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-gray-600 capitalize">{n.type}</span>
                      <span className="text-[11px] text-gray-300">{timeAgo(n.created_at)}</span>
                      <span className="text-[11px] text-gray-300">· {n.author_name}</span>
                    </div>
                    <p className="text-[13px] text-gray-700 leading-relaxed m-0">{n.body}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => deleteNote(n.id)} className="text-gray-200 hover:text-red-400 transition-colors text-sm border-0 bg-transparent cursor-pointer shrink-0">✕</button>
                  )}
                </div>
              ))
            }
          </div>

          {/* Deals */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-semibold text-gray-800">Deals</div>
              <button className={btnPrimary + ' text-[12px] py-1.5'} onClick={() => setDealModal(true)}>+ Add Deal</button>
            </div>
            {deals.length === 0
              ? <p className="text-[12px] text-gray-300">No deals yet.</p>
              : deals.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-gray-800">{d.title}</div>
                    {d.value > 0 && <div className="text-[11px] text-gray-400">₹{Number(d.value).toLocaleString()}</div>}
                  </div>
                  <select
                    value={d.stage}
                    onChange={e => updateDealStage(d.id, e.target.value)}
                    className={`text-[11px] px-2 py-1 rounded-lg border-0 font-semibold cursor-pointer ${STAGE_COLORS[d.stage]}`}
                    style={{ outline: 'none' }}>
                    {['prospect','proposal','negotiation','closed_won','closed_lost'].map(s => (
                      <option key={s} value={s}>{s.replace('_',' ')}</option>
                    ))}
                  </select>
                </div>
              ))
            }
          </div>

          {/* Recent messages */}
          {messages.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="text-[13px] font-semibold text-gray-800 mb-4">Recent messages</div>
              {messages.map(m => (
                <div key={m.id} className="border-b border-gray-50 pb-3 mb-3 last:border-0 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.channel === 'sms' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{m.channel.toUpperCase()}</span>
                    <span className="text-[11px] text-gray-300">{timeAgo(m.sent_at)}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 line-clamp-2 m-0">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Tasks */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="text-[13px] font-semibold text-gray-800 mb-3">Tasks</div>
            {initTasks.length === 0
              ? <p className="text-[12px] text-gray-300">No tasks linked.</p>
              : initTasks.map(t => (
                <div key={t.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${t.status === 'done' ? 'bg-emerald-400' : t.status === 'inprogress' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                  <div>
                    <div className={`text-[13px] ${t.status === 'done' ? 'line-through text-gray-300' : 'text-gray-700'}`}>{t.name}</div>
                    {t.due_date && <div className="text-[11px] text-gray-400">{t.due_date}</div>}
                  </div>
                </div>
              ))
            }
          </div>

          {/* Reminders */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-gray-800">Reminders</div>
              <button className="text-[11px] text-emerald-600 hover:underline cursor-pointer border-0 bg-transparent" onClick={() => setReminderModal(true)}>+ Add</button>
            </div>
            {reminders.length === 0
              ? <p className="text-[12px] text-gray-300">No reminders set.</p>
              : reminders.map(r => (
                <div key={r.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                  <input type="checkbox" checked={r.done} onChange={e => toggleReminder(r.id, e.target.checked)} className="mt-1 cursor-pointer" />
                  <div className="flex-1">
                    <div className={`text-[13px] ${r.done ? 'line-through text-gray-300' : 'text-gray-700'}`}>{r.note || 'Follow up'}</div>
                    <div className="text-[11px] text-gray-400">{new Date(r.remind_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Attachments */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-gray-800">Files</div>
              <label className="text-[11px] text-emerald-600 hover:underline cursor-pointer">
                {uploading ? 'Uploading…' : '+ Upload'}
                <input type="file" className="hidden" onChange={uploadFile} disabled={uploading} />
              </label>
            </div>
            {attachments.length === 0
              ? <p className="text-[12px] text-gray-300">No files attached.</p>
              : attachments.map(a => (
                <div key={a.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs shrink-0">📄</div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => downloadFile(a.file_path, a.file_name)}
                      className="text-[12px] text-blue-600 hover:underline truncate block text-left border-0 bg-transparent cursor-pointer p-0 max-w-full">
                      {a.file_name}
                    </button>
                    {a.file_size && <div className="text-[10px] text-gray-400">{(a.file_size/1024).toFixed(1)} KB</div>}
                  </div>
                  {isAdmin && (
                    <button onClick={() => deleteAttachment(a.id, a.file_path)} className="text-gray-200 hover:text-red-400 transition-colors text-sm border-0 bg-transparent cursor-pointer shrink-0">✕</button>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Deal modal */}
      {dealModal && (
        <Modal onClose={() => setDealModal(false)}>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-5">Add Deal</h3>
          <div className="mb-3"><label className={labelCls}>Title *</label><input className={inputCls} value={dealForm.title} onChange={e => setDealForm({...dealForm,title:e.target.value})} placeholder="Website redesign project" /></div>
          <div className="mb-3"><label className={labelCls}>Value (₹)</label><input type="number" className={inputCls} value={dealForm.value} onChange={e => setDealForm({...dealForm,value:e.target.value})} placeholder="50000" /></div>
          <div className="mb-5">
            <label className={labelCls}>Stage</label>
            <select className={inputCls} value={dealForm.stage} onChange={e => setDealForm({...dealForm,stage:e.target.value})}>
              {['prospect','proposal','negotiation','closed_won','closed_lost'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button className={btnSecondary} onClick={() => setDealModal(false)}>Cancel</button>
            <button className={btnPrimary} onClick={addDeal}>Save Deal</button>
          </div>
        </Modal>
      )}

      {/* Reminder modal */}
      {reminderModal && (
        <Modal onClose={() => setReminderModal(false)}>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-5">Set Reminder</h3>
          <div className="mb-3"><label className={labelCls}>Note</label><input className={inputCls} value={reminderForm.note} onChange={e => setReminderForm({...reminderForm,note:e.target.value})} placeholder="Follow up about proposal" /></div>
          <div className="mb-5"><label className={labelCls}>Remind at *</label><input type="datetime-local" className={inputCls} value={reminderForm.remind_at} onChange={e => setReminderForm({...reminderForm,remind_at:e.target.value})} /></div>
          <div className="flex gap-2 justify-end">
            <button className={btnSecondary} onClick={() => setReminderModal(false)}>Cancel</button>
            <button className={btnPrimary} onClick={addReminder}>Set Reminder</button>
          </div>
        </Modal>
      )}

      {/* Edit contact modal */}
      {editModal && (
        <Modal onClose={() => setEditModal(false)}>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-5">Edit Contact</h3>
          {[['name','Name'],['company','Company'],['phone','Phone'],['email','Email']].map(([k,l]) => (
            <div key={k} className="mb-3"><label className={labelCls}>{l}</label><input className={inputCls} value={editForm[k]} onChange={e => setEditForm({...editForm,[k]:e.target.value})} /></div>
          ))}
          <div className="mb-5">
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={editForm.status} onChange={e => setEditForm({...editForm,status:e.target.value})}>
              <option value="lead">Lead</option><option value="customer">Customer</option><option value="cold">Cold</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button className={btnSecondary} onClick={() => setEditModal(false)}>Cancel</button>
            <button className={btnPrimary} onClick={saveEdit}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
