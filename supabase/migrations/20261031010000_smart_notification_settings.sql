-- Global control for smart progress notifications.
create table if not exists public.smart_notification_settings (
  id boolean primary key default true check (id = true),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.smart_notification_settings (id, enabled)
values (true, true)
on conflict (id) do nothing;

alter table public.smart_notification_settings enable row level security;

drop policy if exists "Authenticated users can read smart notification settings"
  on public.smart_notification_settings;
create policy "Authenticated users can read smart notification settings"
  on public.smart_notification_settings
  for select to authenticated
  using (true);
