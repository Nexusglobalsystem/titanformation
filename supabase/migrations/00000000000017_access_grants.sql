-- Accès granulaire : un droit d'accès explicite à un programme/formation/
-- module/session, indépendant du rôle ET de l'inscription. Additif au
-- modèle d'accès existant (enrollments) — ne le remplace jamais, ne le
-- restreint jamais. Un accès accordé sans inscription donne uniquement une
-- LECTURE du contenu catalogue/module/leçon/session : enregistrer une
-- progression, tenter un quiz, signer une présence ou devenir éligible à
-- un certificat restent strictement conditionnés à une vraie ligne
-- enrollments, exactement comme aujourd'hui (aucune policy sur
-- enrollments/attendances/learner_progress/quiz_attempts/certificates
-- n'est touchée par cette migration).

create table access_grants (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  company_id    uuid references companies(id) on delete cascade,
  programme_id  uuid references programmes(id) on delete cascade,
  training_id   uuid references trainings(id) on delete cascade,
  module_id     uuid references modules(id) on delete cascade,
  session_id    uuid references sessions(id) on delete cascade,
  granted_by    uuid references profiles(id),
  granted_at    timestamptz not null default now(),
  expires_at    timestamptz,
  note          text,
  check ((user_id is not null)::int + (company_id is not null)::int = 1),
  check (
    (programme_id is not null)::int + (training_id is not null)::int
    + (module_id is not null)::int + (session_id is not null)::int = 1
  )
);

create index on access_grants (user_id);
create index on access_grants (company_id);
create index on access_grants (programme_id);
create index on access_grants (training_id);
create index on access_grants (module_id);
create index on access_grants (session_id);

alter table access_grants enable row level security;

create policy "staff gere les acces" on access_grants
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "utilisateur voit ses propres acces" on access_grants
  for select to authenticated using (
    user_id = (select auth.uid())
    or company_id in (select cm.company_id from company_members cm where cm.user_id = (select auth.uid()))
  );

-- Fonctions security definer, même idiome que enrolled_session_ids() /
-- trained_session_ids() : résolvent un accès direct (user_id ou, via
-- company_members, company_id) ET un accès hérité d'une portée plus large
-- (programme -> formation, formation -> session/module). expires_at
-- optionnel ignoré si non expiré.
create or replace function public.granted_training_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id from trainings t
  where exists (
    select 1 from access_grants ag
    where ag.training_id = t.id
      and (ag.user_id = (select auth.uid())
           or ag.company_id in (select cm.company_id from company_members cm where cm.user_id = (select auth.uid())))
      and (ag.expires_at is null or ag.expires_at > now())
  )
  or exists (
    select 1 from access_grants ag
    join programme_trainings pt on pt.programme_id = ag.programme_id
    where pt.training_id = t.id
      and (ag.user_id = (select auth.uid())
           or ag.company_id in (select cm.company_id from company_members cm where cm.user_id = (select auth.uid())))
      and (ag.expires_at is null or ag.expires_at > now())
  );
$$;

create or replace function public.granted_module_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.id from modules m
  where exists (
    select 1 from access_grants ag
    where ag.module_id = m.id
      and (ag.user_id = (select auth.uid())
           or ag.company_id in (select cm.company_id from company_members cm where cm.user_id = (select auth.uid())))
      and (ag.expires_at is null or ag.expires_at > now())
  )
  or m.training_id in (select granted_training_ids());
$$;

create or replace function public.granted_session_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id from sessions s
  where exists (
    select 1 from access_grants ag
    where ag.session_id = s.id
      and (ag.user_id = (select auth.uid())
           or ag.company_id in (select cm.company_id from company_members cm where cm.user_id = (select auth.uid())))
      and (ag.expires_at is null or ag.expires_at > now())
  )
  or s.training_id in (select granted_training_ids());
$$;

-- ALTER POLICY (jamais DROP+CREATE) : remplace l'expression USING en place,
-- sans jamais de fenêtre où la table serait temporairement sans policy.
-- Chaque clause ajoutée est un pur OR — rien de ce qui fonctionne
-- aujourd'hui par inscription ne change.

alter policy "modules visibles si inscrit ou formateur" on modules
  using (
    has_role('formateur')
    or exists (
      select 1 from sessions s
      where s.training_id = modules.training_id
        and s.id in (select enrolled_session_ids())
    )
    or modules.id in (select granted_module_ids())
    or modules.training_id in (select granted_training_ids())
  );

alter policy "lecons visibles si module visible" on lessons
  using (
    has_role('formateur')
    or exists (
      select 1 from modules m
      join sessions s on s.training_id = m.training_id
      where m.id = lessons.module_id and s.id in (select enrolled_session_ids())
    )
    or lessons.module_id in (select granted_module_ids())
    or exists (
      select 1 from modules m
      where m.id = lessons.module_id and m.training_id in (select granted_training_ids())
    )
  );

alter policy "quiz lisible si inscrit" on quizzes
  using (
    exists (
      select 1 from lessons l join modules m on m.id = l.module_id
      join sessions s on s.training_id = m.training_id
      where l.id = quizzes.lesson_id and s.id in (select enrolled_session_ids())
    )
    or exists (
      select 1 from lessons l join modules m on m.id = l.module_id
      where l.id = quizzes.lesson_id
        and (m.id in (select granted_module_ids()) or m.training_id in (select granted_training_ids()))
    )
  );

alter policy "apprenant voit ses sessions" on sessions
  using (
    id in (select enrolled_session_ids())
    or id in (select granted_session_ids())
  );

alter policy "creneaux visibles aux participants" on session_slots
  using (
    session_id in (select trained_session_ids())
    or session_id in (select enrolled_session_ids())
    or session_id in (select granted_session_ids())
  );

-- Policy neuve (pas une modification) sur trainings.
create policy "formation visible si acces accorde" on trainings
  for select to authenticated using (
    id in (select granted_training_ids())
  );

-- Nouvelles clés de permission, additif à 00000000000012_permissions.sql
-- (jamais modifié directement).
insert into permissions (key, label, category) values
  ('modules.view', 'Voir les modules', 'Formations'),
  ('modules.create', 'Créer un module', 'Formations'),
  ('modules.edit', 'Modifier un module', 'Formations'),
  ('sessions.join', 'Rejoindre une session', 'Sessions'),
  ('planning.view', 'Voir la planification', 'Planification'),
  ('planning.create', 'Créer un planning', 'Planification'),
  ('planning.edit', 'Modifier un planning', 'Planification'),
  ('access.view', 'Voir les accès accordés', 'Accès'),
  ('access.manage', 'Gérer les accès accordés', 'Accès');

insert into role_permissions (role, permission_key)
select 'admin', key from permissions
where key in (
  'modules.view','modules.create','modules.edit','sessions.join',
  'planning.view','planning.create','planning.edit','access.view','access.manage'
);

insert into role_permissions (role, permission_key)
select 'gestionnaire', key from permissions
where key in (
  'modules.view','modules.create','modules.edit','sessions.join',
  'planning.view','planning.create','planning.edit','access.view','access.manage'
);
