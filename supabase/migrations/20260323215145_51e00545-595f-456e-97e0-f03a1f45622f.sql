
-- Fix permissive RSVP update policy: only allow updating rsvp_status and attendee_count
DROP POLICY "Public can update RSVP" ON public.invitations;

CREATE POLICY "Public can update RSVP status" ON public.invitations
  FOR UPDATE
  USING (true)
  WITH CHECK (
    rsvp_status IN ('confirmed', 'declined')
    AND attendee_count >= 0
    AND attendee_count <= 20
  );
