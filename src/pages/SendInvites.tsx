import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockContacts, mockEvents } from '@/lib/mock-data';
import { MessageSquare, Phone, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SendInvites() {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [sendMethod, setSendMethod] = useState<'whatsapp' | 'sms' | 'both'>('whatsapp');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [message, setMessage] = useState('Habari! Unaalikwa kwenye sherehe yetu. Tunaomba uthibitishe uwepo wako. Karibu sana! 🎉');

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedContacts(selectedContacts.length === mockContacts.length ? [] : mockContacts.map((c) => c.id));
  };

  const handleSend = () => {
    if (!selectedEvent) return toast.error('Please select an event');
    if (selectedContacts.length === 0) return toast.error('Please select at least one contact');
    toast.success(`Invitations sent to ${selectedContacts.length} contacts via ${sendMethod}!`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Send Invitations</h1>
          <p className="text-muted-foreground mt-1">Send invitations via WhatsApp or SMS to your contacts.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="font-display text-lg">Event</CardTitle></CardHeader>
              <CardContent>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>
                    {mockEvents.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-2">This message will be personalized with each guest's name.</p>
              </CardContent>
            </Card>

            <Button className="w-full gap-2" size="lg" onClick={handleSend}>
              <Send className="w-5 h-5" /> Send to {selectedContacts.length} contacts
            </Button>
          </div>

          {/* Contact Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-display text-lg">Select Contacts</CardTitle>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedContacts.length === mockContacts.length ? 'Deselect All' : 'Select All'}
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
                    {mockContacts.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => toggleContact(c.id)}>
                        <TableCell>
                          <Checkbox checked={selectedContacts.includes(c.id)} />
                        </TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                        <TableCell><Badge variant="secondary">{c.group}</Badge></TableCell>
                      </TableRow>
                    ))}
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
