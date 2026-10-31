create table if not exists public.app_area_maintenance (
  area_key text primary key,
  enabled boolean not null default false,
  message text not null default 'Esta seção está passando por uma manutenção temporária. Voltaremos em breve.',
  expected_return_at timestamptz,
  internal_note text,
  updated_by text,
  updated_at timestamptz not null default now(),
  constraint app_area_maintenance_area_key_check check (
    area_key in ('social','review','library','study','duels','challenges','rank','achievements','shop','inventory','enemies','news','profile','forge','settings')
  )
);

alter table public.app_area_maintenance enable row level security;

drop policy if exists "Authenticated users can read area maintenance" on public.app_area_maintenance;
create policy "Authenticated users can read area maintenance"
  on public.app_area_maintenance for select to authenticated using (true);

insert into public.app_area_maintenance (area_key, enabled, message)
select area_key, false, 'Esta seção está passando por uma manutenção temporária. Voltaremos em breve.'
from unnest(array[
  'social','review','library','study','duels','challenges','rank','achievements',
  'shop','inventory','enemies','news','profile','forge','settings'
]) as area_key
on conflict (area_key) do nothing;

-- Permite receber mudanças de disponibilidade em tempo real.
do $$
begin
  alter publication supabase_realtime add table public.app_area_maintenance;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
