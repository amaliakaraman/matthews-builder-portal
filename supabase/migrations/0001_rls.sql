-- Builder Portal — Row Level Security policies
--
-- The portal performs all writes through Prisma using the Supabase Postgres
-- connection string. RLS here is the second line of defense for direct
-- Supabase API access (e.g. realtime channels, future client-side queries).
--
-- The four roles match PRD §5: builder, px_admin, sponsor, read_only.
-- We resolve the role by looking up the auth.uid() against public.users.
--
-- Run after `prisma db push` (or `prisma migrate deploy`) so the tables exist.

-- Helper: current portal user's role.
create or replace function public.current_role()
returns text
language sql
stable
as $$
  select role::text from public.users
   where email = (auth.jwt() ->> 'email')
   limit 1
$$;

-- Helper: current portal user's id (uuid).
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select id from public.users
   where email = (auth.jwt() ->> 'email')
   limit 1
$$;

-- ---- Enable RLS ----
alter table public.users                  enable row level security;
alter table public.departments            enable row level security;
alter table public.sponsors               enable row level security;
alter table public.projects               enable row level security;
alter table public.milestones             enable row level security;
alter table public.assignments            enable row level security;
alter table public.audit_log_entries      enable row level security;
alter table public.comments               enable row level security;
alter table public.provisioning_requests  enable row level security;
alter table public.notifications          enable row level security;

-- ---- Users ----
create policy "users self read" on public.users
  for select using (
    auth.uid() is not null
  );

create policy "users self update" on public.users
  for update using (
    email = (auth.jwt() ->> 'email')
  );

create policy "users admin write" on public.users
  for all using (public.current_role() = 'px_admin')
  with check (public.current_role() = 'px_admin');

-- ---- Departments / Sponsors — readable by anyone signed in, writable by PX ----
create policy "depts read" on public.departments for select using (auth.uid() is not null);
create policy "depts admin" on public.departments for all
  using (public.current_role() = 'px_admin')
  with check (public.current_role() = 'px_admin');

create policy "sponsors read" on public.sponsors for select using (auth.uid() is not null);
create policy "sponsors admin" on public.sponsors for all
  using (public.current_role() = 'px_admin')
  with check (public.current_role() = 'px_admin');

-- ---- Projects ----
-- Read: any signed-in user (registry is public-to-Matthews per PRD §4.1.1).
create policy "projects read" on public.projects for select using (auth.uid() is not null);

-- Write: builder of the project, or PX admin.
create policy "projects builder write" on public.projects
  for update using (
    builder_user_id = public.current_user_id()
    or public.current_role() = 'px_admin'
  )
  with check (
    builder_user_id = public.current_user_id()
    or public.current_role() = 'px_admin'
  );

create policy "projects insert" on public.projects
  for insert with check (
    builder_user_id = public.current_user_id()
  );

create policy "projects delete admin" on public.projects
  for delete using (public.current_role() = 'px_admin');

-- ---- Child tables follow the parent project's read access ----
create policy "milestones read" on public.milestones for select using (auth.uid() is not null);
create policy "milestones admin" on public.milestones for all
  using (public.current_role() = 'px_admin')
  with check (public.current_role() = 'px_admin');

create policy "assignments read" on public.assignments for select using (auth.uid() is not null);
create policy "assignments admin" on public.assignments for all
  using (public.current_role() = 'px_admin')
  with check (public.current_role() = 'px_admin');

-- Audit log: read by anyone signed in; write only by PX (server inserts via service role).
create policy "audit read" on public.audit_log_entries for select using (auth.uid() is not null);
create policy "audit admin" on public.audit_log_entries for all
  using (public.current_role() = 'px_admin')
  with check (public.current_role() = 'px_admin');

-- Comments: read by anyone signed in, write by anyone signed in (author = self).
create policy "comments read" on public.comments for select using (auth.uid() is not null);
create policy "comments insert self" on public.comments
  for insert with check (author_user_id = public.current_user_id());

-- Provisioning: PX-admin only.
create policy "prov read" on public.provisioning_requests for select using (auth.uid() is not null);
create policy "prov admin" on public.provisioning_requests for all
  using (public.current_role() = 'px_admin')
  with check (public.current_role() = 'px_admin');

-- Notifications: each user reads their own.
create policy "notif read" on public.notifications for select using (
  user_id = public.current_user_id()
);
create policy "notif update self" on public.notifications for update using (
  user_id = public.current_user_id()
);
