-- Create the review-images storage bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do nothing;

-- Policies: authenticated users upload into their own user-id folder
drop policy if exists "review_images_read" on storage.objects;
drop policy if exists "review_images_insert_self" on storage.objects;
drop policy if exists "review_images_update_self" on storage.objects;
drop policy if exists "review_images_delete_self" on storage.objects;

create policy review_images_read on storage.objects
for select using (bucket_id = 'review-images');

create policy review_images_insert_self on storage.objects
for insert to authenticated
with check (
  bucket_id = 'review-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy review_images_update_self on storage.objects
for update to authenticated
using (
  bucket_id = 'review-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy review_images_delete_self on storage.objects
for delete to authenticated
using (
  bucket_id = 'review-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
