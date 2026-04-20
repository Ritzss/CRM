import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
