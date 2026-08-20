-- Parcours composable d'une formation : séquence ordonnée d'étapes
-- hétérogènes (présentiel / classe virtuelle LiveKit / auto-apprentissage /
-- évaluation / certification), réordonnable en drag & drop par l'équipe
-- pédagogique. Couche de syllabus déclaratif — décrit la structure *type*
-- d'une formation ("Jour 1 → Présentiel"), distincte du calendrier concret
-- d'une session (sessions/session_slots, déjà câblés LiveKit, non touchés
-- ici).

create type training_step_type as enum (
  'presentiel', 'livekit', 'autoapprentissage', 'evaluation', 'certification'
);

create table training_steps (
  id                uuid primary key default gen_random_uuid(),
  training_id       uuid not null references trainings(id) on delete cascade,
  type              training_step_type not null,
  title             text not null,
  description       text,
  position          int not null default 0,
  duration_minutes  int,
  -- Formation auto-apprentissage : module de contenu concerné (vidéos/
  -- documents/quiz déjà existants). Null = étape ne référence aucun module.
  module_id         uuid references modules(id) on delete set null,
  is_mandatory      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (module_id is null or type = 'autoapprentissage')
);

create index on training_steps (training_id, position);

alter table training_steps enable row level security;

-- Même schéma que les policies de "modules" : visible si formation publiée
-- (le parcours est un argument commercial), si inscrit à une session de la
-- formation, ou si formateur (consulte tout le catalogue) ; staff gère tout.
create policy "parcours visible si formation publiee" on training_steps
  for select to anon, authenticated using (
    exists (select 1 from trainings t where t.id = training_steps.training_id and t.status = 'publiee')
  );

create policy "parcours visible si inscrit ou formateur" on training_steps
  for select to authenticated using (
    has_role('formateur')
    or exists (
      select 1 from sessions s
      where s.training_id = training_steps.training_id
        and s.id in (select enrolled_session_ids())
    )
  );

create policy "staff gere le parcours" on training_steps
  for all to authenticated using (is_staff()) with check (is_staff());
