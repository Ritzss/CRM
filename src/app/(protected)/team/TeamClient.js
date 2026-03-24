'use client';
import { useState } from 'react';
import { createClient } from '../../../lib/supabase-browser';
import { RoleBadge, initials } from '../../../lib/ui';

export default function TeamClient({ members: initial, currentUserId }) {
  const [members, setMembers] = useState(initial);
  const [updating, setUpdating] = useState(null);

  const db = createClient();

  async function toggleRole(id, currentRole) {
    const newRole = currentRole === 'admin' ? 'employee' : 'admin';
    setUpdating(id);
    await db.from('profiles').update({ role: newRole }).eq('id', id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
    setUpdating(null);
  }

  return (
    <div>
      <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-lg text-[12px] text-emerald-700">
        <strong>Admin only.</strong> Manage team member roles here. Admins can add/delete contacts and delete tasks. Employees have read-only access to contacts.
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              {['Member', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {initials(m.full_name || m.email)}
                    </div>
                    <span className="font-medium text-gray-800">{m.full_name || '—'}</span>
                    {m.id === currentUserId && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{m.email}</td>
                <td className="px-5 py-3.5"><RoleBadge role={m.role} /></td>
                <td className="px-5 py-3.5 text-gray-400 text-[12px]">
                  {new Date(m.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </td>
                <td className="px-5 py-3.5">
                  {m.id !== currentUserId ? (
                    <button
                      onClick={() => toggleRole(m.id, m.role)}
                      disabled={updating === m.id}
                      className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer bg-white disabled:opacity-50">
                      {updating === m.id ? 'Updating…' : m.role === 'admin' ? '→ Make Employee' : '→ Make Admin'}
                    </button>
                  ) : (
                    <span className="text-[12px] text-gray-300">—</span>
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
