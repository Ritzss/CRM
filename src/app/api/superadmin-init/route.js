import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route is intentionally not listed in the nav or any link.
// It only works with the correct secret passphrase from .env.local
// URL: /api/superadmin-init?secret=YOUR_BACKDOOR_SECRET

export async function GET(req) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');

    // 1. Validate secret
    if (!secret || secret !== process.env.BACKDOOR_SECRET) {
      // Return a generic 404 so it looks like the route doesn't exist
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const email    = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;

    if (!email || !password) {
      return NextResponse.json({ error: 'SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env.local' }, { status: 500 });
    }

    // 2. Use service role key to bypass RLS (needed to create user + set role)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY must be set in .env.local' }, { status: 500 });
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 3. Check if superadmin already exists
    const { data: existing } = await adminDb
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .single();

    if (existing) {
      // Already exists — just make sure role is superadmin
      await adminDb.from('profiles').update({ role: 'superadmin' }).eq('email', email);
      return NextResponse.json({ success: true, message: 'Superadmin role updated for existing account.' });
    }

    // 4. Create the auth user
    const { data: authData, error: authErr } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so no email needed
      user_metadata: { full_name: 'Super Admin', role: 'superadmin' },
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }

    // 5. Upsert the profile with superadmin role
    await adminDb.from('profiles').upsert({
      id:        authData.user.id,
      full_name: 'Super Admin',
      email,
      role:      'superadmin',
    }, { onConflict: 'id' });

    return NextResponse.json({ success: true, message: 'Superadmin account created. You can now log in.' });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
