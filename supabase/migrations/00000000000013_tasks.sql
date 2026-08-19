-- Dispatch de tâches administratives (section 5 de la spec complète).
-- Portée volontairement resserrée par rapport au modèle de données complet
-- de la section 32 : organization_tasks + task_assignees + task_comments.
-- Pas de table task_history séparée — un audit_log générique existe déjà
-- dans le schéma annexe A pour cet usage si besoin plus tard ; dupliquer un
-- flux d'historique dédié pour ce lot aurait ajouté une UI entière pour un
-- bénéfice marginal au vu du reste du périmètre demandé dans ce tour.

create type task_status as enum ('todo', 'in_progress', 'blocked', 'review', 'completed', 'cancelled');
create type task_priority as enum ('low', 'normal', 'high', 'urgent');

create table organization_tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  domain        text,
  priority      task_priority not null default 'normal',
  status        task_status not null default 'todo',
  created_by    uuid not null references profiles(id),
  assigned_to   uuid references profiles(id),
  due_date      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on organization_tasks (assigned_to);
create index on organization_tasks (status);

create table task_assignees (
  task_id     uuid not null references organization_tasks(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

create table task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references organization_tasks(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index on task_comments (task_id, created_at);

-- Un collaborateur voit une tâche s'il est le responsable principal ou
-- listé parmi les collaborateurs assignés.
create or replace function public.can_see_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    is_staff()
    or exists (
      select 1 from organization_tasks t
      where t.id = p_task_id and t.assigned_to = (select auth.uid())
    )
    or exists (
      select 1 from task_assignees ta
      where ta.task_id = p_task_id and ta.user_id = (select auth.uid())
    );
$$;

alter table organization_tasks enable row level security;
alter table task_assignees enable row level security;
alter table task_comments enable row level security;

create policy "staff gere toutes les taches" on organization_tasks
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "on voit et met a jour ses taches assignees" on organization_tasks
  for select to authenticated using (can_see_task(id));

create policy "un assigne met a jour le statut de sa tache" on organization_tasks
  for update to authenticated
  using (can_see_task(id) and not is_staff())
  with check (can_see_task(id) and not is_staff());

create policy "staff gere les collaborateurs assignes" on task_assignees
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "on voit ses propres affectations" on task_assignees
  for select to authenticated using (user_id = (select auth.uid()));

create policy "on voit les commentaires des taches visibles" on task_comments
  for select to authenticated using (can_see_task(task_id));

create policy "on commente une tache visible" on task_comments
  for insert to authenticated
  with check (can_see_task(task_id) and author_id = (select auth.uid()));
