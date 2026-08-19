-- Bucket privé pour la GED (documents.storage_path). La table `documents`
-- et sa RLS existent déjà depuis l'annexe A (staff : tout ; apprenant : ses
-- documents ; responsable : ceux de son entreprise) — il ne manquait que le
-- bucket Storage correspondant. Convention de chemin :
-- enrollments/{enrollment_id}/{type}-{timestamp}-{filename}

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

create policy "staff gere les documents (storage)" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents' and is_staff())
  with check (bucket_id = 'documents' and is_staff());

create policy "lecture des documents lies (storage)" on storage.objects
  for select to authenticated using (
    bucket_id = 'documents'
    and exists (
      select 1 from documents d
      where d.storage_path = name
        and (
          exists (
            select 1 from enrollments e
            where e.id = d.enrollment_id and e.learner_id = (select auth.uid())
          )
          or d.company_id in (select managed_company_ids())
          or exists (
            select 1 from enrollments e
            where e.id = d.enrollment_id and e.company_id in (select managed_company_ids())
          )
        )
    )
  );
