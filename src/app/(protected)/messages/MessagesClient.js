'use client';
import { useState } from 'react';
import { createClient } from '../../../lib/supabase-browser';
import { inputCls, labelCls, btnPrimary } from '../../../lib/ui';

const TEMPLATES = {
  shipped:   { label: 'Order Shipped',    body: n => `Hi ${n}, your order has been shipped and is on its way. Expected delivery in 2-4 business days.` },
  out:       { label: 'Out for Delivery', body: n => `Hi ${n}, your order is out for delivery today. Please ensure someone is available to receive it.` },
  delivered: { label: 'Delivered',        body: n => `Hi ${n}, your order has been delivered! We hope you love it. Reach out if you need help.` },
  delayed:   { label: 'Delayed',          body: n => `Hi ${n}, we are sorry your delivery has been slightly delayed. We will notify you as soon as it ships.` },
  pickup:    { label: 'Ready for Pickup', body: n => `Hi ${n}, your order is ready for pickup. Please bring your order ID when you collect it.` },
};

const CHANNELS = [
  { key: 'sms',   label: 'SMS (Fast2SMS)', icon: '📱' },
  { key: 'email', label: 'Email (SendGrid)', icon: '✉️' },
];

export default function MessagesClient({ initialContacts, initialHistory }) {
  const [contacts]            = useState(initialContacts);
  const [history, setHistory] = useState(initialHistory);
  const [form, setForm]       = useState({ contactId: '', channel: 'sms', body: '' });
  const [activeTpl, setActiveTpl] = useState('');
  const [alert, setAlert]     = useState({ type: '', msg: '' });
  const [sending, setSending] = useState(false);

  const db = createClient();

  async function reloadHistory() {
    const { data } = await db.from('messages').select('*').order('sent_at', { ascending: false }).limit(20);
    setHistory(data || []);
  }

  function applyTemplate(key) {
    setActiveTpl(key);
    const contact = contacts.find(c => c.id === form.contactId);
    const first = contact ? contact.name.split(' ')[0] : '[Name]';
    setForm(f => ({ ...f, body: TEMPLATES[key].body(first) }));
  }

  async function send() {
    if (!form.contactId || !form.body.trim()) {
      setAlert({ type: 'error', msg: 'Please select a contact and write a message.' });
      return;
    }
    const contact = contacts.find(c => c.id === form.contactId);
    setSending(true); setAlert({ type: '', msg: '' });

    try {
      if (form.channel === 'sms') {
        if (!contact.phone) throw new Error('This contact has no phone number.');
        const res = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: contact.phone, body: form.body }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'SMS send failed');
      } else {
        if (!contact.email) throw new Error('This contact has no email address.');
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: contact.email, subject: 'Delivery Update', body: form.body }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Email send failed');
      }

      await db.from('messages').insert([{
        contact_name: contact.name,
        channel: form.channel,
        body: form.body,
      }]);

      setAlert({ type: 'ok', msg: `${form.channel === 'sms' ? 'SMS' : 'Email'} sent to ${contact.name}.` });
      setForm(f => ({ ...f, body: '' }));
      setActiveTpl('');
      reloadHistory();
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    }
    setSending(false);
  }

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
      {/* Compose */}
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-5">Send Delivery Message</h3>

        <div className="mb-4">
          <label className={labelCls}>Recipient</label>
          <select className={inputCls} value={form.contactId}
            onChange={e => setForm({ ...form, contactId: e.target.value })}>
            <option value="">Select contact…</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className={labelCls}>Channel</label>
          <div className="flex gap-2">
            {CHANNELS.map(({ key, label, icon }) => (
              <button key={key} type="button" onClick={() => setForm({ ...form, channel: key })}
                className={`flex items-center gap-2 px-4 py-2 text-[13px] rounded-lg border transition-all cursor-pointer
                  ${form.channel === key
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>
          {form.channel === 'sms' && (
            <p className="text-[11px] text-blue-600 mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              Using Fast2SMS. Enter contact phone as a 10-digit Indian number (e.g. 9876543210) or with +91 prefix.
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className={labelCls}>Quick templates</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button key={key} type="button" onClick={() => applyTemplate(key)}
                className={`px-3 py-1 text-[12px] rounded-full border transition-all cursor-pointer
                  ${activeTpl === key
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className={labelCls}>Message</label>
          <textarea className={inputCls} value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            rows={4} style={{ resize: 'vertical', lineHeight: 1.6 }}
            placeholder="Write a message or pick a template above…" />
        </div>

        {alert.msg && (
          <div className={`px-4 py-2.5 rounded-lg text-[13px] mb-4 border
            ${alert.type === 'ok'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-600 border-red-200'}`}>
            {alert.msg}
          </div>
        )}

        <button className={btnPrimary} onClick={send} disabled={sending}>
          {sending ? 'Sending…' : `Send ${form.channel === 'sms' ? 'SMS' : 'Email'}`}
        </button>
      </div>

      {/* History */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-[13px] font-semibold text-gray-900 mb-4">Recent Messages</h3>
        {history.length === 0
          ? <p className="text-[12px] text-gray-300">No messages yet.</p>
          : history.map(m => (
            <div key={m.id} className="border-b border-gray-50 pb-3 mb-3 last:border-0 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-[13px] text-gray-800">{m.contact_name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                  ${m.channel === 'sms'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-blue-50 text-blue-600'}`}>
                  {m.channel === 'sms' ? '📱 SMS' : '✉ EMAIL'}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 leading-relaxed mb-1 line-clamp-2">{m.body}</p>
              <span className="text-[11px] text-gray-300">{new Date(m.sent_at).toLocaleString()}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
