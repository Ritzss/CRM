'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Select, Textarea, FormField } from '@/components/ui/Input';
import { PageHeader } from '@/components/PageHeader';
import { MSG_TEMPLATES } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';

export default function MessagesClient({ initialContacts, initialHistory }) {
  const toast = useToast();
  const [contacts]            = useState(initialContacts);
  const [history, setHistory] = useState(initialHistory);
  const [form, setForm]       = useState({ contactId:'', channel:'email', body:'' });
  const [activeTpl, setActiveTpl] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab]         = useState('compose');

  const db = createClient();

  function applyTemplate(key) {
    setActiveTpl(key);
    const contact = contacts.find(c => c.id===form.contactId);
    const first = contact ? contact.name.split(' ')[0] : '[Name]';
    setForm(f => ({ ...f, body: MSG_TEMPLATES[key].body(first) }));
  }

  async function send() {
    if (!form.contactId || !form.body.trim()) {
      toast('Please select a contact and write a message.', 'error'); return;
    }
    const contact = contacts.find(c => c.id===form.contactId);
    if (form.channel==='sms' && !contact.phone) { toast('This contact has no phone number.', 'error'); return; }
    if (form.channel==='email' && !contact.email) { toast('This contact has no email address.', 'error'); return; }

    setSending(true);
    try {
      const res = await fetch(`/api/${form.channel==='sms'?'send-sms':'send-email'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          form.channel==='sms'
            ? { to: contact.phone, body: form.body }
            : { to: contact.email, subject: 'Delivery Update', body: form.body }
        ),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Send failed');

      const { data } = await db.from('messages').insert([{
        contact_name: contact.name, channel: form.channel, body: form.body,
      }]).select().single();

      if (data) setHistory(prev => [data, ...prev]);
      toast(`${form.channel==='sms'?'SMS':'Email'} sent to ${contact.name}`);
      setForm(f => ({ ...f, body:'' }));
      setActiveTpl('');
      setTab('history');
    } catch (err) {
      toast(err.message, 'error');
    }
    setSending(false);
  }

  return (
    <div>
      <PageHeader title="Delivery Messages" description="Send SMS and email updates to contacts" />

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 360px' }}>
        {/* Compose */}
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-5">Compose Message</h3>

          <FormField label="Recipient">
            <Select value={form.contactId} onChange={e=>setForm(f=>({...f,contactId:e.target.value}))}>
              <option value="">Select a contact…</option>
              {contacts.map(c=>(
                <option key={c.id} value={c.id}>
                  {c.name}{c.email?` · ${c.email}`:''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Channel">
            <div className="grid grid-cols-2 gap-2">
              {[['email','✉️ Email (SendGrid)'],['sms','💬 SMS (Twilio)']].map(([ch,lbl])=>(
                <button key={ch} type="button" onClick={()=>setForm(f=>({...f,channel:ch}))}
                  className={`py-2.5 text-sm rounded-lg border transition-all cursor-pointer font-medium
                    ${form.channel===ch ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Quick templates">
            <div className="flex flex-wrap gap-2">
              {Object.entries(MSG_TEMPLATES).map(([key,t])=>(
                <button key={key} type="button" onClick={()=>applyTemplate(key)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer font-medium
                    ${activeTpl===key ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Message">
            <Textarea value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}
              rows={5} placeholder="Write your message or pick a template above…" style={{ lineHeight:1.7 }} />
          </FormField>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{form.body.length} characters</span>
            <Button onClick={send} disabled={sending} size="lg">
              {sending ? 'Sending…' : `Send ${form.channel==='sms'?'SMS':'Email'}`}
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Message History</h3>
            <span className="text-xs text-gray-400">{history.length} sent</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
            {history.length === 0
              ? <div className="p-8 text-center text-sm text-gray-300">No messages sent yet.</div>
              : history.map(m=>(
                <div key={m.id} className="px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm text-gray-800">{m.contact_name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                        ${m.channel==='sms'?'bg-amber-50 text-amber-600':'bg-blue-50 text-blue-600'}`}>
                        {m.channel.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-gray-400">{timeAgo(m.sent_at)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 m-0">{m.body}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
