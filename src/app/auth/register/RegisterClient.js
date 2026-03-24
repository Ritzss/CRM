'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';

export default function RegisterClient() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'employee' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, role: form.role },
      },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    // Insert profile row
    if (data.user) {
      await supabase.from('profiles').insert([{
        id: data.user.id,
        full_name: form.name,
        email: form.email,
        role: form.role,
      }]);
    }

    router.push('/contacts');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold tracking-tight mb-1">
            <span className="text-emerald-600">CRM</span> Portal
          </div>
          <p className="text-sm text-gray-400">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Full name</label>
              <input
                type="text" required
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition"
                placeholder="Riya Sharma"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                type="email" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition"
                placeholder="you@company.com"
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[['employee', '👤', 'Employee'], ['admin', '🛡️', 'Admin']].map(([val, icon, lbl]) => (
                  <button key={val} type="button" onClick={() => setForm({ ...form, role: val })}
                    className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-sm transition cursor-pointer
                      ${form.role === val
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                    <span className="text-lg">{icon}</span>
                    <span>{lbl}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input
                type="password" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirm password</label>
              <input
                type="password" required
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 active:scale-95 transition disabled:opacity-60 cursor-pointer border-0">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
