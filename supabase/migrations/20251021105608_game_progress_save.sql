-- Create game_progress table (idempotent) and policies for storing completed task IDs

create table if not exists public.game_progress (
  user_id uuid references auth.users(id) on delete cascade,
  game_id text not null,
  completed_task_ids text[] not null default '{}',
  updated_at timestamptz default now(),
  primary key (user_id, game_id)
);

-- If the table previously existed with a different column, ensure our column is present
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'game_progress' and column_name = 'completed_task_ids'
  ) then
    alter table public.game_progress add column completed_task_ids text[] not null default '{}';
  end if;
end $$;

alter table public.game_progress enable row level security;

-- Policies (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'game_progress' and policyname = 'read own progress'
  ) then
    create policy "read own progress"
      on public.game_progress for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'game_progress' and policyname = 'insert own progress'
  ) then
    create policy "insert own progress"
      on public.game_progress for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'game_progress' and policyname = 'update own progress'
  ) then
    create policy "update own progress"
      on public.game_progress for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;


