import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Phone, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

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
  const [sendMethod, setSendMethod] = useState<'whatsapp' | 'sms' | 'both'>('whatsapp');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [message, setMessage] = useState('Habari! Unaalikwa kwenye sherehe yetu. Tunaomba uthibitishe uwepo wako. Karibu sana! 🎉');
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
    setSelectedContacts((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedContacts(selectedContacts.length === contacts.length ? [] : contacts.map((c) => c.id));
  };

  const handleSend = async () => {
    if (!user) return;
    if (!selectedEvent) return toast.error('Please select an event');
    if (selectedContacts.length === 0) return toast.error('Please select at least one contact');

    setSending(true);

    // Create invitation records with unique QR codes
    const invitations = selectedContacts.map((contactId) => ({
      event_id: selectedEvent,
      contact_id: contactId,
      user_id: user.id,
      sent_via: sendMethod,
      status: 'sent' as const,
      qr_code: `QR-${uuidv4().slice(0, 8).toUpperCase()}`,
      sent_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('invitations').insert(invitations);

    setSending(false);

    if (error) {
      toast.error('Failed to create invitations');
      return;
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'invitations_sent',
      details: {
        event_id: selectedEvent,
        count: selectedContacts.length,
        method: sendMethod,
      },
    });

    toast.success(`${selectedContacts.length} invitations created! Unique RSVP links generated.`);
    setSelectedContacts([]);
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
          <h1 className="font-display text-3xl font-bold">Send Invitations</h1>
          <p className="text-muted-foreground mt-1">Send invitations via WhatsApp or SMS to your contacts.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="font-display text-lg">Event</CardTitle></CardHeader>
              <CardContent>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>
                    {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                {events.length === 0 && <p className="text-xs text-muted-foreground mt-2">Create an event first.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-display text-lg">Delivery Method</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(['whatsapp', 'sms', 'both'] as const).map((method) => (
                  <Button
                    key={method}
                    variant={sendMethod === method ? 'default' : 'outline'}
                    className="w-full justify-start gap-2 capitalize"
                    onClick={() => setSendMethod(method)}
                  >
                    {method === 'whatsapp' && <MessageSquare className="w-4 h-4" />}
                    {method === 'sms' && <Phone className="w-4 h-4" />}
                    {method === 'both' && <Send className="w-4 h-4" />}
                    {method === 'both' ? 'Both WhatsApp & SMS' : method}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-display text-lg">Message</CardTitle></CardHeader>
              <CardContent>
                <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
                <p className="text-xs text-muted-foreground mt-2">Each guest gets a unique RSVP link with their invitation.</p>
              </CardContent>
            </Card>

            <Button className="w-full gap-2" size="lg" onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Send to {selectedContacts.length} contacts
            </Button>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-display text-lg">Select Contacts</CardTitle>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedContacts.length === contacts.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]" />
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Group</TableHead>
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
                        <TableCell><Badge variant="secondary">{c.group}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {contacts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No contacts yet. Add contacts first.</TableCell>
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
