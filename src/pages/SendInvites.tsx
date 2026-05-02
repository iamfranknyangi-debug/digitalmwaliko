import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Phone, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ContactRow {
  id: string;
  name: string;
  phone: string;
  group: string;
}

interface EventRow {
  id: string;
  title: string;
}

export default function SendInvites() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [sendMethod, setSendMethod] = useState<'sms'>('sms');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [message, setMessage] = useState(
    'Habari {name}! Unaalikwa kwenye sherehe yetu. Tafadhali thibitisha uwepo wako kupitia link hii: {rsvp_link} Karibu sana! 🎉'
  );
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [evRes, coRes] = await Promise.all([
        supabase.from('events').select('id, title').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('contacts').select('id, name, phone, group').eq('user_id', user.id).order('name'),
      ]);
      setEvents(evRes.data || []);
      setContacts(coRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const selectAll = () => {
    setSelectedContacts(selectedContacts.length === contacts.length ? [] : contacts.map((c) => c.id));
  };

  const handleSend = async () => {
    if (!user) return;
    if (!selectedEvent) return toast.error('Tafadhali chagua tukio');
    if (selectedContacts.length === 0) return toast.error('Tafadhali chagua angalau mtu mmoja');

    setSending(true);

    try {
      // 1. Create invitation records with unique QR codes
      const invitations = selectedContacts.map((contactId) => ({
        event_id: selectedEvent,
        contact_id: contactId,
        user_id: user.id,
        sent_via: sendMethod,
        status: 'sent' as const,
        qr_code: `QR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        sent_at: new Date().toISOString(),
      }));

      const { data: insertedInvitations, error: insertError } = await supabase
        .from('invitations')
        .insert(invitations)
        .select('id, contact_id');

      if (insertError) throw insertError;

      // 2. Build recipients list with invitation IDs
      const selectedContactsData = contacts.filter((c) => selectedContacts.includes(c.id));
      const recipients = selectedContactsData.map((c) => {
        const inv = insertedInvitations?.find((i) => i.contact_id === c.id);
        return { contact_id: c.id, invitation_id: inv?.id || '' };
      });

      // 3. Send SMS via edge function
      const { data: smsResult, error: smsError } = await supabase.functions.invoke('send-sms', {
        body: { recipients, message, app_origin: window.location.origin },
      });

      if (smsError) throw smsError;

      // 4. Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'invitations_sent',
        details: {
          event_id: selectedEvent,
          count: selectedContacts.length,
          method: sendMethod,
          sent: smsResult?.sent || 0,
          failed: smsResult?.failed || 0,
        },
      });

      if (smsResult?.failed > 0) {
        toast.warning(
          `SMS ${smsResult.sent} zimetumwa, ${smsResult.failed} zimeshindwa. Angalia nambari za simu.`
        );
      } else {
        toast.success(`SMS ${smsResult?.sent || selectedContacts.length} zimetumwa kwa mafanikio! 🎉`);
      }

      setSelectedContacts([]);
    } catch (err: unknown) {
      console.error('Send error:', err);
      toast.error('Imeshindwa kutuma. Tafadhali jaribu tena.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Tuma Mialiko</h1>
          <p className="text-muted-foreground mt-1">Tuma mialiko kupitia SMS kwa wageni wako.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Tukio</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chagua tukio" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {events.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Unda tukio kwanza.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Njia ya Kutuma</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="default" className="w-full justify-start gap-2">
                  <Phone className="w-4 h-4" />
                  SMS (Sprint Tanzania)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Sender ID: <span className="font-mono font-semibold">Harusi</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Ujumbe</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
                <p className="text-xs text-muted-foreground mt-2">
                  Tumia <code className="bg-muted px-1 rounded">{'{name}'}</code> kwa jina na{' '}
                  <code className="bg-muted px-1 rounded">{'{rsvp_link}'}</code> kwa link ya RSVP.
                </p>
              </CardContent>
            </Card>

            <Button className="w-full gap-2" size="lg" onClick={handleSend} disabled={sending || selectedContacts.length === 0}>
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Tuma kwa wageni {selectedContacts.length}
            </Button>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-display text-lg">Chagua Wageni</CardTitle>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedContacts.length === contacts.length ? 'Ondoa Wote' : 'Chagua Wote'}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]" />
                      <TableHead>Jina</TableHead>
                      <TableHead>Simu</TableHead>
                      <TableHead>Kundi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => toggleContact(c.id)}>
                        <TableCell>
                          <Checkbox checked={selectedContacts.includes(c.id)} />
                        </TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{c.group}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {contacts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Hakuna wageni bado. Ongeza wageni kwanza.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
