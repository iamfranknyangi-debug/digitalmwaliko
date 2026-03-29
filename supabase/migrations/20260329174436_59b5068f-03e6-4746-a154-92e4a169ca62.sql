
-- Drop overly permissive public policies on invitations
DROP POLICY IF EXISTS "Public can view invitation for RSVP" ON public.invitations;
DROP POLICY IF EXISTS "Public can update RSVP status" ON public.invitations;

-- Fix card-images storage INSERT policy to enforce per-user path
DROP POLICY IF EXISTS "Authenticated users can upload card images" ON storage.objects;

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'card-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
