'use client';

export const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition';

export const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5';

export const btnPrimary =
  'px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 transition cursor-pointer border-0 disabled:opacity-50';

export const btnSecondary =
  'px-4 py-2 text-sm font-medium bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition cursor-pointer';

export const btnDanger =
  'px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition cursor-pointer border-0';

export function Modal({ onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl shadow-xl p-6 max-w-[92vw] ${wide ? 'w-[520px]' : 'w-[380px]'}`}>
        {children}
      </div>
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    lead:     'bg-blue-50 text-blue-700',
    customer: 'bg-emerald-50 text-emerald-700',
    cold:     'bg-gray-100 text-gray-500',
  };
  const labels = { lead: 'Lead', customer: 'Customer', cold: 'Cold' };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${map[status] || map.cold}`}>
      {labels[status] || status}
    </span>
  );
}

export function RoleBadge({ role }) {
  return role === 'admin'
    ? <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Admin</span>
    : <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Employee</span>;
}

export function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
