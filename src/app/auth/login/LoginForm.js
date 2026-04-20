'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/Button';
import { Input, FormField } from '@/components/ui/Input';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Show success message if redirected from register
  const registered = params.get('registered');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const db = createClient();
    const { error } = await db.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(params.get('next') || '/analytics');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-4">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to CRM Portal</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {registered && (
            <div className="mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700">
              Account created! Sign in below.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <FormField label="Email">
              <Input type="email" required autoComplete="email" placeholder="you@company.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </FormField>
            <FormField label="Password">
              <Input type="password" required autoComplete="current-password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </FormField>

            {error && (
              <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full justify-center py-2.5">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            No account?{' '}
            <Link href="/auth/register" className="text-emerald-600 font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
