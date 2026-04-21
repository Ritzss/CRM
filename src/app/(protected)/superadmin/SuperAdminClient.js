'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/StatCard';
import { formatDate } from '@/lib/utils';

const ROLES = ['employee', 'admin', 'superadmin'];

export default function SuperAdminClient({ members: initial, currentUserId, stats }) {
  const toast = useToast();
  const [members, setMembers]   = useState(initial);
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const db = createClient();

  async function changeRole(id, newRole) {
    setUpdating(id);
    const { error } = await db.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) { toast(error.message, 'error'); setUpdating(null); return; }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
    toast('Role updated to ' + newRole);
    setUpdating(null);
  }

  async function deleteUser(id, email) {
    if (!confirm('Permanently delete ' + email + '? This cannot be undone.')) return;
    setDeleting(id);
    // Delete from profiles (auth user stays but profile is gone)
    const { error } = await db.from('profiles').delete().eq('id', id);
    if (error) { toast(error.message, 'error'); setDeleting(null); return; }
    setMembers(prev => prev.filter(m => m.id !== id));
    toast(email + ' removed');
    setDeleting(null);
  }

  const adminCount = members.filter(m => m.role === 'admin').length;
  const superAdminCount = members.filter(m => m.role === 'superadmin').length;

  return (
    <div>
      <PageHeader
        title="👑 Super Admin"
        description="Full system control — unrestricted access"
      />

      {/* Warning banner */}
      <div className="mb-6 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
        <strong>⚠️ Super Admin panel.</strong> Changes here affect all users. Be careful.
      </div>

      {/* System stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users"    value={members.length}       icon="👥" color="#111" />
        <StatCard label="Contacts"       value={stats.contacts}       icon="📇" color="#2563eb" />
        <StatCard label="Deals"          value={stats.deals}          icon="🤝" color="#059669" />
        <StatCard label="Messages Sent"  value={stats.messages}       icon="✉️" color="#d97706" />
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          ['👑 Super Admins', superAdminCount, 'bg-yellow-50 border-yellow-200 text-yellow-800'],
          ['🛡️ Admins', adminCount, 'bg-violet-50 border-violet-200 text-violet-800'],
          ['👤 Employees', members.filter(m=>m.role==='employee').length, 'bg-sky-50 border-sky-200 text-sky-800'],
        ].map(([label, count, cls]) => (
          <div key={label} className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between ${cls}`}>
            <span>{label}</span>
            <span className="text-lg font-bold">{count}</span>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">All Users</h3>
          <span className="text-xs text-gray-400">{members.length} total</span>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Member','Email','Role','Joined','Change Role',''].map(h => (
                <th key={h+Math.random()} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const isMe = m.id === currentUserId;
              return (
                <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.full_name || m.email} size="sm" />
                      <div>
                        <div className="font-medium text-gray-800">{m.full_name || '—'}</div>
                        {isMe && <div className="text-[10px] text-yellow-600 font-semibold mt-0.5">👑 You</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-[13px]">{m.email}</td>
                  <td className="px-5 py-4"><RoleBadge role={m.role} /></td>
                  <td className="px-5 py-4 text-gray-400 text-[12px]">{formatDate(m.created_at)}</td>
                  <td className="px-5 py-4">
                    {!isMe ? (
                      <select
                        value={m.role}
                        disabled={updating === m.id}
                        onChange={e => changeRole(m.id, e.target.value)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400">
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {!isMe && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteUser(m.id, m.email)}
                        disabled={deleting === m.id}>
                        {deleting === m.id ? 'Deleting…' : 'Delete'}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
