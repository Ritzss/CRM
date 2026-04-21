export const CONTACT_STATUSES = [
  { key: 'lead',     label: 'Lead',     cls: 'bg-blue-50 text-blue-700',     dot: '#2563eb' },
  { key: 'customer', label: 'Customer', cls: 'bg-emerald-50 text-emerald-700', dot: '#059669' },
  { key: 'cold',     label: 'Cold',     cls: 'bg-gray-100 text-gray-500',     dot: '#9ca3af' },
];

export const DEAL_STAGES = [
  { key: 'prospect',    label: 'Prospect',    cls: 'bg-gray-100 text-gray-600',    dot: '#9ca3af' },
  { key: 'proposal',   label: 'Proposal',    cls: 'bg-blue-50 text-blue-700',     dot: '#2563eb' },
  { key: 'negotiation',label: 'Negotiation', cls: 'bg-amber-50 text-amber-700',   dot: '#d97706' },
  { key: 'closed_won', label: 'Won',         cls: 'bg-emerald-50 text-emerald-700', dot: '#059669' },
  { key: 'closed_lost',label: 'Lost',        cls: 'bg-red-50 text-red-600',       dot: '#dc2626' },
];

export const TASK_STATUSES = [
  { key: 'todo',       label: 'To Do',       cls: 'bg-blue-50 text-blue-700',   dot: '#2563eb' },
  { key: 'inprogress', label: 'In Progress', cls: 'bg-amber-50 text-amber-700', dot: '#d97706' },
  { key: 'done',       label: 'Done',        cls: 'bg-emerald-50 text-emerald-700', dot: '#059669' },
];

export const NOTE_TYPES = [
  { key: 'note',      label: 'Note',     icon: '📝' },
  { key: 'call',      label: 'Call',     icon: '📞' },
  { key: 'meeting',   label: 'Meeting',  icon: '🤝' },
  { key: 'email',     label: 'Email',    icon: '✉️' },
  { key: 'whatsapp',  label: 'WhatsApp', icon: '💬' },
];

export const NAV_ITEMS = [
  { href: '/analytics', label: 'Dashboard',         icon: '▦', adminOnly: false },
  { href: '/contacts',  label: 'Contacts',           icon: '◉', adminOnly: false },
  { href: '/deals',     label: 'Deals',              icon: '◈', adminOnly: false },
  { href: '/tasks',     label: 'Tasks',              icon: '✓', adminOnly: false },
  { href: '/messages',  label: 'Messages',           icon: '✉', adminOnly: false },
  { href: '/team',      label: 'Team',               icon: '⊞', adminOnly: true  },
  { href: '/superadmin', label: 'Super Admin',        icon: '👑', superAdminOnly: true },
  { href: '/settings',  label: 'Settings',           icon: '⚙', adminOnly: false },
];

export const MSG_TEMPLATES = {
  shipped:   { label: 'Shipped',       body: n => `Hi ${n}, your order has been shipped and is on its way. Expected delivery in 2–4 business days.` },
  out:       { label: 'Out for Delivery', body: n => `Hi ${n}, your order is out for delivery today. Please ensure someone is available to receive it.` },
  delivered: { label: 'Delivered',     body: n => `Hi ${n}, your order has been delivered! We hope you love it. Reach out if you need help.` },
  delayed:   { label: 'Delayed',       body: n => `Hi ${n}, your delivery has been slightly delayed. We'll notify you once it ships.` },
  pickup:    { label: 'Ready for Pickup', body: n => `Hi ${n}, your order is ready for pickup. Please bring your order ID when you collect it.` },
};
