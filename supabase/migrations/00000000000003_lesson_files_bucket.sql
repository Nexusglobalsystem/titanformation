-- Bucket privé pour les fichiers audio/document des leçons (pas la vidéo :
-- cf. commentaire sur lessons.video_provider, jamais Supabase Storage pour
-- la vidéo — coûts de sortie, pas de transcodage/HLS ici).
-- Convention de chemin : lessons/{lesson_id}/{filename}
insert into storage.buckets (id, name, public)
values ('lesson-files', 'lesson-files', false);

create policy "staff gere les fichiers de lecon" on storage.objects
  for all to authenticated
  using (bucket_id = 'lesson-files' and is_staff())
  with check (bucket_id = 'lesson-files' and is_staff());

create policy "lecture des fichiers de lecon si inscrit ou formateur" on storage.objects
  for select to authenticated using (
    bucket_id = 'lesson-files'
    and exists (
      select 1 from lessons l
      join modules m on m.id = l.module_id
      join sessions s on s.training_id = m.training_id
      where l.id::text = (storage.foldername(name))[2]
        and (has_role('formateur') or s.id in (select enrolled_session_ids()))
    )
  );
