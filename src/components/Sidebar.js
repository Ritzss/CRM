'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { NAV_ITEMS } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/Badge';

export default function Sidebar({ profile, user }) {
  const path    = usePathname();
  const router  = useRouter();
  const [signing, setSigning] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const isSuperAdmin = profile?.role === 'superadmin';
  const nav     = NAV_ITEMS.filter(n => {
    if (n.superAdminOnly) return isSuperAdmin;
    if (n.adminOnly) return isAdmin || isSuperAdmin;
    return true;
  });

  async function signOut() {
    setSigning(true);
    const db = createClient();
    await db.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <aside className="w-[220px] shrink-0 bg-white border-r border-gray-100 flex flex-col fixed top-0 bottom-0 left-0 z-20 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="text-[15px] font-bold tracking-tight text-gray-900">
          <span className="text-emerald-600">CRM</span> Portal
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">Internal Tool</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2">
        {nav.map(n => {
          const active = path === n.href || path.startsWith(n.href + '/');
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all no-underline mb-0.5
                ${active
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}>
              <span className="w-4 text-center text-sm opacity-70">{n.icon}</span>
              {n.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <Avatar name={profile?.full_name || user?.email} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-gray-800 truncate">
              {profile?.full_name || 'User'}
            </div>
            <RoleBadge role={profile?.role} />
          </div>
        </div>
        <button onClick={signOut} disabled={signing}
          className="w-full text-[12px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition py-2 rounded-lg border-0 bg-transparent cursor-pointer">
          {signing ? 'Signing out…' : '↩ Sign out'}
        </button>
      </div>
    </aside>
  );
}
