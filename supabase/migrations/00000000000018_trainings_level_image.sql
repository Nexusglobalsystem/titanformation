-- Enrichissement du catalogue public (inspiré des principes UX d'un site
-- concurrent, sans copier son identité visuelle) : niveau et image de
-- formation. Vocabulaire fermé à 3 valeurs pour "level" (comme status),
-- contrairement à "category" qui reste volontairement libre.

alter table trainings add column level text check (level in ('debutant','intermediaire','avance'));
alter table trainings add column image_path text;

-- Bucket public dédié aux images de formation — jamais d'assouplissement
-- des buckets privés existants (lesson-files, documents). La lecture est
-- publique (contenu marketing), l'écriture reste réservée au staff.
insert into storage.buckets (id, name, public) values ('training-images', 'training-images', true);

create policy "images de formation lisibles par tous" on storage.objects
  for select to anon, authenticated using (bucket_id = 'training-images');

create policy "staff gere les images de formation" on storage.objects
  for all to authenticated
  using (bucket_id = 'training-images' and is_staff())
  with check (bucket_id = 'training-images' and is_staff());
