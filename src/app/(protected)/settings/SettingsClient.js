'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input, FormField } from '@/components/ui/Input';
import { PageHeader } from '@/components/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/Badge';

export default function SettingsClient({ profile, userId, email }) {
  const toast = useToast();
  const [name, setName]         = useState(profile.full_name||'');
  const [saving, setSaving]     = useState(false);
  const [pwForm, setPwForm]     = useState({ current:'', next:'', confirm:'' });
  const [pwSaving, setPwSaving] = useState(false);
  const db = createClient();

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await db.from('profiles').update({ full_name: name.trim() }).eq('id', userId);
    if (error) { toast(error.message, 'error'); } else { toast('Name updated'); }
    setSaving(false);
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { toast('Passwords do not match.', 'error'); return; }
    if (pwForm.next.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
    setPwSaving(true);
    const { error } = await db.auth.updateUser({ password: pwForm.next });
    if (error) { toast(error.message, 'error'); } else {
      toast('Password changed successfully');
      setPwForm({ current:'', next:'', confirm:'' });
    }
    setPwSaving(false);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and account settings" />

      {/* Profile */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-5">Profile</h3>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <Avatar name={profile.full_name||email} size="lg" />
          <div>
            <div className="font-semibold text-gray-900 text-[15px]">{profile.full_name||'—'}</div>
            <div className="text-sm text-gray-400 mt-0.5">{email}</div>
            <div className="mt-1.5"><RoleBadge role={profile.role} /></div>
          </div>
        </div>
        <FormField label="Full name">
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
        </FormField>
        <FormField label="Email">
          <Input value={email} disabled className="opacity-50 cursor-not-allowed" />
        </FormField>
        <Button onClick={saveName} disabled={saving}>{saving?'Saving…':'Save Profile'}</Button>
      </div>

      {/* Password */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-5">Change Password</h3>
        <FormField label="New password">
          <Input type="password" value={pwForm.next} onChange={e=>setPwForm(f=>({...f,next:e.target.value}))} placeholder="Min. 6 characters" />
        </FormField>
        <FormField label="Confirm new password">
          <Input type="password" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} placeholder="Repeat new password" />
        </FormField>
        <Button onClick={changePassword} disabled={pwSaving}>{pwSaving?'Updating…':'Change Password'}</Button>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-100 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-xs text-gray-400 mb-4">These actions are permanent and cannot be undone.</p>
        <Button variant="danger" onClick={async () => {
          if (!confirm('Are you sure you want to sign out of all devices?')) return;
          const db2 = createClient();
          await db2.auth.signOut({ scope: 'global' });
          window.location.href = '/auth/login';
        }}>
          Sign out of all devices
        </Button>
      </div>
    </div>
  );
}
