-- Certificat de fin de formation (cf. plateforme-formation-specifications.md,
-- section 28). Un certificat par inscription, généré à la demande de
-- l'apprenant une fois toutes les leçons terminées.
create table certificates (
  id                 uuid primary key default gen_random_uuid(),
  enrollment_id      uuid not null references enrollments(id) on delete cascade unique,
  certificate_number text not null unique,
  issued_at          timestamptz not null default now()
);

alter table certificates enable row level security;

create policy "apprenant gere son certificat" on certificates
  for all to authenticated
  using (exists (select 1 from enrollments e where e.id = certificates.enrollment_id and e.learner_id = (select auth.uid())))
  with check (exists (select 1 from enrollments e where e.id = certificates.enrollment_id and e.learner_id = (select auth.uid())));

create policy "staff voit les certificats" on certificates
  for select to authenticated using (is_staff());

create policy "formateur voit les certificats de ses sessions" on certificates
  for select to authenticated using (
    exists (select 1 from enrollments e
            where e.id = certificates.enrollment_id
              and e.session_id in (select trained_session_ids()))
  );
