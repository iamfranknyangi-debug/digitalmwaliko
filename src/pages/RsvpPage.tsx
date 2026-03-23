import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Calendar, MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RsvpPage() {
  const [responded, setResponded] = useState(false);
  const [response, setResponse] = useState<'yes' | 'no' | null>(null);
  const [attendees, setAttendees] = useState('1');

  const handleRsvp = (answer: 'yes' | 'no') => {
    setResponse(answer);
    setResponded(true);
    toast.success(answer === 'yes' ? 'Asante! We look forward to seeing you!' : 'Thank you for letting us know.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-hero)' }}>
      <Card className="w-full max-w-md shadow-2xl overflow-hidden">
        {/* Card Header */}
        <div className="p-8 text-center text-white" style={{ background: 'linear-gradient(135deg, #D4A574, #1a1a2e)' }}>
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-white/80" />
          <p className="text-xs uppercase tracking-[0.3em] opacity-70 mb-4">You Are Invited</p>
          <h1 className="font-display text-2xl font-bold mb-1">Harusi ya Juma & Amina</h1>
          <p className="text-sm opacity-80">Hosted by Familia ya Juma</p>
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> 15 May 2026</p>
            <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> 2:00 PM</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> JNICC, Dar es Salaam</p>
          </div>

          {!responded ? (
            <div className="space-y-4 pt-4">
              <p className="font-display text-lg font-semibold text-center">Will you attend?</p>
              <div className="space-y-2">
                <Label>Number of Attendees</Label>
                <Input type="number" min="1" max="10" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 gap-2" size="lg" onClick={() => handleRsvp('yes')}>
                  <CheckCircle2 className="w-5 h-5" /> Yes, I'll Attend
                </Button>
                <Button variant="outline" className="flex-1 gap-2" size="lg" onClick={() => handleRsvp('no')}>
                  <XCircle className="w-5 h-5" /> Can't Make It
                </Button>
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-xl text-center ${response === 'yes' ? 'bg-success/10' : 'bg-muted'}`}>
              {response === 'yes' ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
                  <p className="font-display text-lg font-bold">Asante! See You There!</p>
                  <p className="text-sm text-muted-foreground mt-1">{attendees} attendee(s) confirmed</p>
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
