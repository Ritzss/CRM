'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

const MAX_ADMINS = 2;

export default function TeamClient({ members: initial, currentUserId }) {
  const toast = useToast();
  const [members, setMembers]   = useState(initial);
  const [updating, setUpdating] = useState(null);

  const db = createClient();
  const currentAdminCount = members.filter(m => m.role === 'admin').length;
  const slotsLeft = MAX_ADMINS - currentAdminCount;

  async function toggleRole(id, currentRole) {
    const newRole = currentRole === 'admin' ? 'employee' : 'admin';
    if (newRole === 'admin' && currentAdminCount >= MAX_ADMINS) {
      toast('Maximum of ' + MAX_ADMINS + ' admins allowed. Demote an existing admin first.', 'error');
      return;
    }
    setUpdating(id);
    const { error } = await db.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) { toast(error.message, 'error'); setUpdating(null); return; }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
    toast('Role updated to ' + newRole);
    setUpdating(null);
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description={members.length + ' members · ' + currentAdminCount + ' of ' + MAX_ADMINS + ' admin slots used'}
      />

      <div className={'mb-5 px-4 py-3 rounded-xl border text-sm flex items-center justify-between ' + (currentAdminCount >= MAX_ADMINS ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700')}>
        <span>
          <strong>Admin slots:</strong> {currentAdminCount} / {MAX_ADMINS} used.
          {currentAdminCount >= MAX_ADMINS
            ? ' Limit reached — demote an admin before promoting another.'
            : ' ' + slotsLeft + ' slot' + (slotsLeft !== 1 ? 's' : '') + ' remaining.'}
        </span>
        <div className="flex gap-1.5 ml-4 shrink-0">
          {Array.from({ length: MAX_ADMINS }).map((_, i) => (
            <div key={i} className={'w-3 h-3 rounded-full ' + (i < currentAdminCount ? 'bg-red-400' : 'bg-gray-200')} />
          ))}
        </div>
      </div>

      <div className="mb-5 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500">
        Admins can add/delete contacts, delete tasks, and manage team roles. Employees have read-only access.
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Member','Email','Role','Joined','Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const isCurrentUser = m.id === currentUserId;
              const wouldExceed   = m.role === 'employee' && currentAdminCount >= MAX_ADMINS;
              const isLastAdmin   = m.role === 'admin' && currentAdminCount === 1;
              return (
                <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.full_name || m.email} size="sm" />
                      <div>
                        <div className="font-medium text-gray-800">{m.full_name || '—'}</div>
                        {isCurrentUser && <div className="text-[10px] text-gray-400 mt-0.5">You</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-[13px]">{m.email}</td>
                  <td className="px-5 py-4"><RoleBadge role={m.role} /></td>
                  <td className="px-5 py-4 text-gray-400 text-[12px]">{formatDate(m.created_at)}</td>
                  <td className="px-5 py-4">
                    {isCurrentUser ? (
                      <span className="text-xs text-gray-300">—</span>
                    ) : isLastAdmin ? (
                      <span className="text-xs text-gray-400">Last admin</span>
                    ) : wouldExceed ? (
                      <span className="text-xs text-red-400">Admin limit reached</span>
                    ) : (
                      <Button variant="secondary" size="sm"
                        onClick={() => toggleRole(m.id, m.role)}
                        disabled={updating === m.id}>
                        {updating === m.id ? 'Updating…' : m.role === 'admin' ? '→ Make Employee' : '→ Make Admin'}
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
