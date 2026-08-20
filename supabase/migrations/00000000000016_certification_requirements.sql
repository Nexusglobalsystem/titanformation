-- Moteur de conditions de certification : jusqu'ici une formation certifiante
-- (trainings.is_certifying) débloquait le certificat uniquement sur "100% des
-- leçons terminées", sans aucune autre vérification. L'équipe pédagogique
-- peut désormais configurer : assiduité minimale, modules obligatoires, note
-- minimale, examen final, validation pédagogique manuelle.

create table certification_requirements (
  id                            uuid primary key default gen_random_uuid(),
  training_id                   uuid not null unique references trainings(id) on delete cascade,
  min_attendance_pct            numeric(5,2) check (min_attendance_pct is null or (min_attendance_pct >= 0 and min_attendance_pct <= 100)),
  min_grade                     numeric(5,2) check (min_grade is null or (min_grade >= 0 and min_grade <= 100)),
  requires_final_exam           boolean not null default false,
  final_exam_lesson_id          uuid references lessons(id) on delete set null,
  requires_pedagogical_signoff  boolean not null default false,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

-- Modules dont TOUTES les leçons obligatoires (lessons.is_mandatory, colonne
-- déjà existante mais jusqu'ici jamais exploitée) doivent être terminées.
-- Vide = s'applique à toutes les leçons obligatoires de la formation.
create table certification_required_modules (
  requirement_id  uuid not null references certification_requirements(id) on delete cascade,
  module_id       uuid not null references modules(id) on delete cascade,
  primary key (requirement_id, module_id)
);

-- Validation pédagogique manuelle par apprenant : un membre du staff atteste
-- que l'apprenant a satisfait aux exigences non automatisables.
create table certification_signoffs (
  id             uuid primary key default gen_random_uuid(),
  enrollment_id  uuid not null unique references enrollments(id) on delete cascade,
  signed_by      uuid not null references profiles(id),
  signed_at      timestamptz not null default now(),
  comment        text
);

alter table certification_requirements enable row level security;
alter table certification_required_modules enable row level security;
alter table certification_signoffs enable row level security;

-- Même visibilité que training_steps : formation publiée, inscrit, ou
-- formateur peuvent consulter les conditions (transparence pédagogique) ;
-- staff gère tout.
create policy "conditions visibles si formation publiee" on certification_requirements
  for select to anon, authenticated using (
    exists (select 1 from trainings t where t.id = certification_requirements.training_id and t.status = 'publiee')
  );

create policy "conditions visibles si inscrit ou formateur" on certification_requirements
  for select to authenticated using (
    has_role('formateur')
    or exists (
      select 1 from sessions s
      where s.training_id = certification_requirements.training_id
        and s.id in (select enrolled_session_ids())
    )
  );

create policy "staff gere les conditions de certification" on certification_requirements
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "modules obligatoires visibles si conditions visibles" on certification_required_modules
  for select to authenticated using (
    exists (
      select 1 from certification_requirements cr
      join trainings t on t.id = cr.training_id
      where cr.id = certification_required_modules.requirement_id
        and (
          t.status = 'publiee'
          or has_role('formateur')
          or exists (select 1 from sessions s where s.training_id = t.id and s.id in (select enrolled_session_ids()))
        )
    )
  );

create policy "staff gere les modules obligatoires" on certification_required_modules
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "apprenant voit sa propre validation pedagogique" on certification_signoffs
  for select to authenticated using (
    exists (
      select 1 from enrollments e
      where e.id = certification_signoffs.enrollment_id and e.learner_id = (select auth.uid())
    )
  );

create policy "staff gere les validations pedagogiques" on certification_signoffs
  for all to authenticated using (is_staff()) with check (is_staff());
