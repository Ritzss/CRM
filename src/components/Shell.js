'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase-browser';

const NAV = [
  { href: '/analytics', label: 'Dashboard',         icon: '▦', adminOnly: false },
  { href: '/contacts',  label: 'Contacts & Leads',   icon: '◉', adminOnly: false },
  { href: '/tasks',     label: 'Tasks & Follow-ups', icon: '✓', adminOnly: false },
  { href: '/messages',  label: 'Delivery Messages',  icon: '✉', adminOnly: false },
  { href: '/deals',    label: 'Deals Pipeline',      icon: '◈', adminOnly: false },
  { href: '/team',      label: 'Team',               icon: '⊞', adminOnly: true  },
];

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Shell({ user, profile, children }) {
  const path     = usePathname();
  const router   = useRouter();
  const [signing, setSigning] = useState(false);
  const isAdmin  = profile?.role === 'admin';
  const visibleNav = NAV.filter(n => !n.adminOnly || isAdmin);

  async function signOut() {
    setSigning(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-gray-100 flex flex-col fixed top-0 bottom-0 left-0 overflow-y-auto z-20">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="text-base font-bold tracking-tight">
            <span className="text-emerald-600">CRM</span> Portal
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Internal tool</div>
        </div>

        <nav className="flex-1 py-2">
          {visibleNav.map(n => {
            const active = path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] transition-all no-underline
                  ${active
                    ? 'text-emerald-700 font-semibold bg-emerald-50 border-l-2 border-emerald-500'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-l-2 border-transparent'
                  }`}>
                <span className="w-4 text-center text-sm">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* User card at bottom */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center justify-center shrink-0">
              {initials(profile?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-gray-800 truncate">{profile?.full_name || user?.email}</div>
              <div className={`text-[10px] font-semibold uppercase tracking-wide ${isAdmin ? 'text-emerald-600' : 'text-blue-500'}`}>
                {isAdmin ? '🛡 Admin' : '👤 Employee'}
              </div>
            </div>
          </div>
          <button onClick={signOut} disabled={signing}
            className="mt-3 w-full text-[12px] text-gray-400 hover:text-red-500 transition py-1.5 rounded-lg hover:bg-red-50 border-0 bg-transparent cursor-pointer">
            {signing ? 'Signing out…' : '↩ Sign out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-100 px-7 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-gray-900 m-0">
              {NAV.find(n => path.startsWith(n.href))?.label || 'CRM Portal'}
            </h1>
            {isAdmin && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                Admin
              </span>
            )}
          </div>
          <span className="text-[12px] text-gray-300">
            {new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
