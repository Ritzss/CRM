'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export default function TeamClient({ members: initial, currentUserId }) {
  const toast = useToast();
  const [members, setMembers] = useState(initial);
  const [updating, setUpdating] = useState(null);
  const db = createClient();

  async function toggleRole(id, currentRole) {
    const newRole = currentRole==='admin' ? 'employee' : 'admin';
    setUpdating(id);
    const { error } = await db.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) { toast(error.message, 'error'); setUpdating(null); return; }
    setMembers(prev => prev.map(m => m.id===id ? {...m, role:newRole} : m));
    toast(`Role updated to ${newRole}`);
    setUpdating(null);
  }

  const admins    = members.filter(m => m.role==='admin');
  const employees = members.filter(m => m.role==='employee');

  return (
    <div>
      <PageHeader title="Team" description={`${members.length} members · ${admins.length} admin${admins.length!==1?'s':''}`} />

      <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
        <strong>Admin access:</strong> Admins can add/delete contacts, delete tasks, and manage team roles. Employees have read-only access to contacts.
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Member','Email','Role','Joined','Actions'].map(h=>(
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m=>(
              <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.full_name||m.email} size="sm" />
                    <div>
                      <div className="font-medium text-gray-800">{m.full_name||'—'}</div>
                      {m.id===currentUserId && <div className="text-[10px] text-gray-400 mt-0.5">You</div>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500 text-[13px]">{m.email}</td>
                <td className="px-5 py-4"><RoleBadge role={m.role} /></td>
                <td className="px-5 py-4 text-gray-400 text-[12px]">{formatDate(m.created_at)}</td>
                <td className="px-5 py-4">
                  {m.id !== currentUserId ? (
                    <Button variant="secondary" size="sm" onClick={()=>toggleRole(m.id, m.role)} disabled={updating===m.id}>
                      {updating===m.id ? 'Updating…' : m.role==='admin' ? '→ Make Employee' : '→ Make Admin'}
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
