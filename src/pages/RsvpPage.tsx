import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Calendar, MapPin, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InvitationData {
  id: string;
  rsvp_status: string;
  attendee_count: number;
  event: {
    title: string;
    host: string;
    venue: string;
    date: string;
    time: string;
    description: string | null;
    image_url: string | null;
    template_id: string | null;
  };
  contact: {
    name: string;
  };
}

export default function RsvpPage() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responded, setResponded] = useState(false);
  const [attendees, setAttendees] = useState('1');

  useEffect(() => {
    if (!invitationId) return;
    const fetchInvitation = async () => {
      setLoading(true);

      const { data, error: fetchError } = await supabase.functions.invoke('rsvp', {
        method: 'GET',
        body: undefined,
        headers: { 'Content-Type': 'application/json' },
      });

      // Use manual fetch since supabase.functions.invoke doesn't support GET with query params well
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/rsvp?id=${encodeURIComponent(invitationId)}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!res.ok) {
        setError('Invitation not found. Please check your link.');
        setLoading(false);
        return;
      }

      const invData = await res.json();

      if (!invData || !invData.event || !invData.contact) {
        setError('Event details not found.');
        setLoading(false);
        return;
      }

      const inv: InvitationData = {
        id: invData.id,
        rsvp_status: invData.rsvp_status,
        attendee_count: invData.attendee_count,
        event: invData.event,
        contact: invData.contact,
      };

      setInvitation(inv);
      setAttendees(String(inv.attendee_count || 1));

      if (inv.rsvp_status === 'confirmed' || inv.rsvp_status === 'declined') {
        setResponded(true);
      }

      setLoading(false);
    };
    fetchInvitation();
  }, [invitationId]);

  const handleRsvp = async (answer: 'confirmed' | 'declined') => {
    if (!invitation) return;
    setSubmitting(true);

    const count = answer === 'confirmed' ? Math.min(Math.max(parseInt(attendees) || 1, 1), 20) : 0;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/rsvp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: invitation.id,
          rsvp_status: answer,
          attendee_count: count,
        }),
      }
    );

    setSubmitting(false);

    if (!res.ok) {
      toast.error('Failed to submit response. Please try again.');
      return;
    }

    setInvitation({ ...invitation, rsvp_status: answer, attendee_count: count });
    setResponded(true);
    toast.success(answer === 'confirmed' ? 'Asante! We look forward to seeing you!' : 'Thank you for letting us know.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-hero)' }}>
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Oops!</h2>
            <p className="text-muted-foreground">{error || 'Something went wrong.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { event, contact } = invitation;
  const formattedDate = new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-hero)' }}>
      <Card className="w-full max-w-md shadow-2xl overflow-hidden">
        {event.image_url && (
          <div className="relative h-40 overflow-hidden">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
          </div>
        )}

        <div className="p-8 text-center text-white" style={{ background: 'linear-gradient(135deg, #D4A574, #1a1a2e)' }}>
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-white/80" />
          <p className="text-xs uppercase tracking-[0.3em] opacity-70 mb-4">You Are Invited</p>
          <h1 className="font-display text-2xl font-bold mb-1">{event.title}</h1>
          <p className="text-sm opacity-80">Hosted by {event.host}</p>
        </div>

        <CardContent className="p-6 space-y-4">
          <p className="text-center text-muted-foreground">
            Dear <span className="font-semibold text-foreground">{contact.name}</span>,
          </p>

          {event.description && (
            <p className="text-sm text-center text-muted-foreground italic">"{event.description}"</p>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formattedDate}</p>
            <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {event.time}</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.venue}</p>
          </div>

          {!responded ? (
            <div className="space-y-4 pt-4">
              <p className="font-display text-lg font-semibold text-center">Will you attend?</p>
              <div className="space-y-2">
                <Label>Number of Attendees</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 gap-2"
                  size="lg"
                  onClick={() => handleRsvp('confirmed')}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Yes, I'll Attend
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  size="lg"
                  onClick={() => handleRsvp('declined')}
                  disabled={submitting}
                >
                  <XCircle className="w-5 h-5" /> Can't Make It
                </Button>
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-xl text-center ${invitation.rsvp_status === 'confirmed' ? 'bg-success/10' : 'bg-muted'}`}>
              {invitation.rsvp_status === 'confirmed' ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
                  <p className="font-display text-lg font-bold">Asante! See You There!</p>
                  <p className="text-sm text-muted-foreground mt-1">{invitation.attendee_count} attendee(s) confirmed</p>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="font-display text-lg font-bold">Thank You</p>
                  <p className="text-sm text-muted-foreground mt-1">We'll miss you!</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
