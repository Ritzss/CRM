# CRM Portal — Next.js 16 + Supabase Auth

Internal CRM with **Admin / Employee** roles, built on Next.js 16 App Router, React 19, Supabase Auth, Twilio, and SendGrid.

---

## Features

| Feature | Admin | Employee |
|---|---|---|
| View contacts | ✅ | ✅ |
| Add / delete contacts | ✅ | ❌ |
| Manage tasks (all) | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |
| Send delivery messages | ✅ | ✅ |
| Analytics dashboard | ✅ | ✅ |
| Team management | ✅ | ❌ |
| Change member roles | ✅ | ❌ |

---

## Quick start

### 1. Install
```bash
npm install
```

### 2. Environment variables
```bash
cp .env.local.example .env.local
```

Fill in `.env.local` — see comments in that file for where to find each value.

### 3. Supabase database setup

Go to your Supabase project → SQL Editor → run this:

```sql
-- Profiles table (links to Supabase Auth users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text check (role in ('admin', 'employee')) default 'employee',
  created_at timestamptz default now()
);

-- CRM tables
create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  email text,
  status text check (status in ('lead','customer','cold')) default 'lead',
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  due_date date,
  status text check (status in ('todo','inprogress','done')) default 'todo',
  created_at timestamptz default now()
);

create table deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  contact_name text,
  value numeric default 0,
  stage text check (stage in ('prospect','proposal','negotiation','closed_won','closed_lost')) default 'prospect',
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  contact_name text,
  channel text check (channel in ('email','sms')),
  body text,
  sent_at timestamptz default now()
);

-- Enable RLS
alter table profiles  enable row level security;
alter table contacts  enable row level security;
alter table tasks     enable row level security;
alter table deals     enable row level security;
alter table messages  enable row level security;

-- Policies: authenticated users can access all data
create policy "auth users" on profiles  for all to authenticated using (true);
create policy "auth users" on contacts  for all to authenticated using (true);
create policy "auth users" on tasks     for all to authenticated using (true);
create policy "auth users" on deals     for all to authenticated using (true);
create policy "auth users" on messages  for all to authenticated using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 4. Run
```bash
npm run dev
# → http://localhost:3000
```

Register your first account and select **Admin** role — you'll have full access to all features including the Team page.

---

## Project structure

```
src/
├── app/
│   ├── layout.js                    # Root layout (DM Sans, globals)
│   ├── page.js                      # Redirects / → /contacts
│   ├── auth/
│   │   ├── login/                   # Login page
│   │   └── register/                # Register with Admin/Employee role select
│   ├── (protected)/                 # Route group — all require auth
│   │   ├── layout.js                # Fetches user/profile, renders Shell
│   │   ├── analytics/               # Dashboard charts
│   │   ├── contacts/                # Contacts CRUD (admin write, employee read)
│   │   ├── tasks/                   # Kanban board
│   │   ├── messages/                # Delivery messaging
│   │   └── team/                    # Admin-only team management
│   └── api/
│       ├── send-sms/route.js        # Twilio (server-side)
│       └── send-email/route.js      # SendGrid (server-side)
├── components/
│   └── Shell.js                     # Sidebar + header with role-aware nav
├── lib/
│   ├── supabase-browser.js          # Browser client (@supabase/ssr)
│   ├── supabase-server.js           # Server client (@supabase/ssr)
│   └── ui.js                        # Shared styles, Modal, Badge
└── middleware.js                    # Auth guard + session refresh
```

## Deploy to Vercel
```bash
npx vercel
```
Add all `.env.local` variables in Vercel → Project Settings → Environment Variables.

## Tech stack
| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Auth | Supabase Auth + @supabase/ssr 0.9 |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS 3.4 |
| Charts | Recharts 2.15 |
| SMS | Twilio 5.5 |
| Email | SendGrid 8.1 |
| Font | DM Sans (next/font) |
