-- Regroupement pédagogique de haut niveau : un "Programme" peut contenir
-- plusieurs formations (ex. "Bootcamp Data" = Formation A + Formation B).
-- Distinct du "module" existant (structure de contenu interne à UNE
-- formation : vidéos/documents/quiz) — aucun renommage, purement additif.
-- Distinct aussi de enrollments.program_snapshot (copie d'audit figée au
-- moment de l'inscription, concept sans rapport, même mot par coïncidence).

create table programmes (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  summary     text,
  status      text not null default 'brouillon' check (status in ('brouillon','publiee','archivee')),
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table programme_trainings (
  programme_id  uuid not null references programmes(id) on delete cascade,
  training_id   uuid not null references trainings(id) on delete cascade,
  position      int not null default 0,
  primary key (programme_id, training_id)
);

create index on programme_trainings (training_id);

alter table programmes enable row level security;
alter table programme_trainings enable row level security;

-- Même schéma de policies que "trainings" (catalogue publié, formateur lit
-- tout, staff gère tout) — rien de neuf conceptuellement, juste appliqué au
-- nouveau niveau de regroupement.
create policy "programme publie lisible par tous" on programmes
  for select to anon, authenticated using (status = 'publiee');

create policy "formateur lit les programmes" on programmes
  for select to authenticated using (has_role('formateur'));

create policy "staff gere les programmes" on programmes
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "programme_trainings lisible si programme visible" on programme_trainings
  for select to anon, authenticated using (
    exists (select 1 from programmes p where p.id = programme_trainings.programme_id and p.status = 'publiee')
    or has_role('formateur')
  );

create policy "staff gere programme_trainings" on programme_trainings
  for all to authenticated using (is_staff()) with check (is_staff());

-- Nouvelles clés de permission, additif à 00000000000012_permissions.sql
-- (jamais modifié directement). Mêmes défauts que formations.* : admin et
-- gestionnaire ont tout par défaut, formateur/responsable rien de nouveau.
insert into permissions (key, label, category) values
  ('programmes.view', 'Voir les programmes', 'Programmes'),
  ('programmes.create', 'Créer un programme', 'Programmes'),
  ('programmes.edit', 'Modifier un programme', 'Programmes'),
  ('programmes.publish', 'Publier/dépublier un programme', 'Programmes'),
  ('programmes.delete', 'Supprimer un programme', 'Programmes');

insert into role_permissions (role, permission_key)
select 'admin', key from permissions where key like 'programmes.%';

insert into role_permissions (role, permission_key)
select 'gestionnaire', key from permissions where key like 'programmes.%';
