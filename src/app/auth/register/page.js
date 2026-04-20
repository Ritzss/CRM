'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/Button';
import { Input, FormField } from '@/components/ui/Input';

const MAX_ADMINS = 2;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]         = useState({ name:'', email:'', password:'', confirm:'', role:'employee' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [adminCount, setAdminCount] = useState(null); // null = not checked yet

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  // Check admin count when user clicks Admin button
  async function handleRoleSelect(role) {
    set('role', role);
    if (role === 'admin') {
      const db = createClient();
      const { count } = await db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      setAdminCount(count || 0);
    } else {
      setAdminCount(null);
    }
  }

  const adminLimitReached = form.role === 'admin' && adminCount !== null && adminCount >= MAX_ADMINS;

  async function handleRegister(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters.'); return; }

    // Final server-side check before submitting
    if (form.role === 'admin') {
      const db = createClient();
      const { count } = await db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      if ((count || 0) >= MAX_ADMINS) {
        setError(`Maximum of ${MAX_ADMINS} admins allowed. Please register as an Employee.`);
        return;
      }
    }

    setLoading(true); setError('');
    const db = createClient();

    const { data, error: signUpErr } = await db.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, role: form.role } },
    });

    if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }

    if (!data.user) {
      setError('Account created — please check your email to confirm before logging in.');
      setLoading(false);
      return;
    }

    const { error: profileErr } = await db.from('profiles').upsert({
      id: data.user.id, full_name: form.name, email: form.email, role: form.role,
    }, { onConflict: 'id' });

    if (profileErr) console.error('Profile upsert failed:', profileErr.message);

    if (data.session) {
      router.push('/analytics');
      router.refresh();
    } else {
      router.push('/auth/login?registered=1');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-4">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-400 mt-1">Join CRM Portal</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <FormField label="Full name">
              <Input required placeholder="Riya Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
            </FormField>

            <FormField label="Email">
              <Input type="email" required placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </FormField>

            <FormField label="Role">
              <div className="grid grid-cols-2 gap-2">
                {[['employee','👤','Employee'],['admin','🛡️','Admin']].map(([val, icon, lbl]) => (
                  <button key={val} type="button" onClick={() => handleRoleSelect(val)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm transition cursor-pointer
                      ${form.role === val
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                    <span className="text-xl">{icon}</span>
                    <span>{lbl}</span>
                  </button>
                ))}
              </div>

              {/* Admin limit warning */}
              {adminLimitReached && (
                <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                  ⚠️ Maximum of {MAX_ADMINS} admins already exist. Please register as an Employee.
                </div>
              )}

              {/* Admin count indicator */}
              {form.role === 'admin' && adminCount !== null && !adminLimitReached && (
                <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                  {adminCount} of {MAX_ADMINS} admin slot{MAX_ADMINS !== 1 ? 's' : ''} used.
                </div>
              )}

              <p className="text-[11px] text-gray-400 mt-1.5">
                Admins can add/delete contacts and manage the team. Max {MAX_ADMINS} admins allowed.
              </p>
            </FormField>

            <FormField label="Password">
              <Input type="password" required placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
            </FormField>

            <FormField label="Confirm password">
              <Input type="password" required placeholder="••••••••" value={form.confirm} onChange={e => set('confirm', e.target.value)} />
            </FormField>

            {error && (
              <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">{error}</div>
            )}

            <Button
              type="submit"
              disabled={loading || adminLimitReached}
              className="w-full justify-center py-2.5">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-emerald-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
