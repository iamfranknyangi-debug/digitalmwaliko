import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Search, CheckCircle2, XCircle, AlertTriangle, Scan, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InvitationWithContact {
  id: string;
  qr_code: string | null;
  rsvp_status: string;
  attendee_count: number;
  status: string;
  contact_name: string;
  event_title: string;
  event_id: string;
  checked_in: boolean;
}

interface ScanResult {
  status: 'valid' | 'already_checked_in' | 'invalid';
  guest?: string;
  event?: string;
  attendees?: number;
}

export default function QrScanner() {
  const { user } = useAuth();
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [invitations, setInvitations] = useState<InvitationWithContact[]>([]);
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);

      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      setEvents(eventsData || []);

      const { data: invData } = await supabase
        .from('invitations')
        .select('id, qr_code, rsvp_status, attendee_count, status, contact_id, event_id')
        .eq('user_id', user.id);

      if (invData && invData.length > 0) {
        // Fetch contact names and event titles
        const contactIds = [...new Set(invData.map((i) => i.contact_id))];
        const eventIds = [...new Set(invData.map((i) => i.event_id))];

        const [contactsRes, eventsRes] = await Promise.all([
          supabase.from('contacts').select('id, name').in('id', contactIds),
          supabase.from('events').select('id, title').in('id', eventIds),
        ]);

        const contactMap = Object.fromEntries((contactsRes.data || []).map((c) => [c.id, c.name]));
        const eventMap = Object.fromEntries((eventsRes.data || []).map((e) => [e.id, e.title]));

        setInvitations(
          invData.map((inv) => ({
            id: inv.id,
            qr_code: inv.qr_code,
            rsvp_status: inv.rsvp_status,
            attendee_count: inv.attendee_count,
            status: inv.status,
            contact_name: contactMap[inv.contact_id] || 'Unknown',
            event_title: eventMap[inv.event_id] || 'Unknown',
            event_id: inv.event_id,
            checked_in: inv.status === 'checked_in',
          }))
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleScan = async () => {
    if (!scanInput.trim() || !user) return;
    setScanning(true);

    // Search by QR code or invitation ID
    const query = scanInput.trim();
    const { data: inv } = await supabase
      .from('invitations')
      .select('id, qr_code, rsvp_status, attendee_count, status, contact_id, event_id')
      .eq('user_id', user.id)
      .or(`qr_code.eq.${query},id.eq.${query}`)
      .single();

    if (!inv) {
      setScanResult({ status: 'invalid' });
      toast.error('Invalid QR code — guest not found');
      setScanning(false);
      return;
    }

    if (inv.status === 'checked_in') {
      const { data: contact } = await supabase.from('contacts').select('name').eq('id', inv.contact_id).single();
      const { data: event } = await supabase.from('events').select('title').eq('id', inv.event_id).single();
      setScanResult({
        status: 'already_checked_in',
        guest: contact?.name,
        event: event?.title,
        attendees: inv.attendee_count,
      });
      toast.warning('Guest already checked in!');
      setScanning(false);
      return;
    }

    // Mark as checked in
    await supabase
      .from('invitations')
      .update({ status: 'checked_in' })
      .eq('id', inv.id)
      .eq('user_id', user.id);

    const { data: contact } = await supabase.from('contacts').select('name').eq('id', inv.contact_id).single();
    const { data: event } = await supabase.from('events').select('title').eq('id', inv.event_id).single();

    setScanResult({
      status: 'valid',
      guest: contact?.name,
      event: event?.title,
      attendees: inv.attendee_count,
    });

    // Update local state
    setInvitations((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, status: 'checked_in', checked_in: true } : i))
    );

    toast.success(`✅ Guest verified: ${contact?.name}`);
    setScanning(false);
    setScanInput('');
  };

  const filteredInvitations = selectedEvent === 'all'
    ? invitations
    : invitations.filter((i) => i.event_id === selectedEvent);

  const rsvpVariant = (status: string) => {
    if (status === 'confirmed') return 'default';
    if (status === 'declined') return 'destructive';
    return 'secondary';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">QR Verification</h1>
          <p className="text-muted-foreground mt-1">Scan or enter QR codes to verify guests at the event.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Scan className="w-5 h-5" /> Scan QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter QR code or invitation ID"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                />
                <Button onClick={handleScan} className="gap-2" disabled={scanning}>
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Verify
                </Button>
              </div>

              {scanResult && (
                <div className={`p-6 rounded-xl text-center space-y-2 ${
                  scanResult.status === 'valid' ? 'bg-success/10 border border-success/30' :
                  scanResult.status === 'already_checked_in' ? 'bg-warning/10 border border-warning/30' :
                  'bg-destructive/10 border border-destructive/30'
                }`}>
                  {scanResult.status === 'valid' && <CheckCircle2 className="w-16 h-16 text-success mx-auto" />}
                  {scanResult.status === 'already_checked_in' && <AlertTriangle className="w-16 h-16 text-warning mx-auto" />}
                  {scanResult.status === 'invalid' && <XCircle className="w-16 h-16 text-destructive mx-auto" />}

                  <p className="text-xl font-bold font-display capitalize">
                    {scanResult.status === 'valid' ? 'Verified ✅' : scanResult.status === 'already_checked_in' ? 'Already Checked In' : 'Invalid'}
                  </p>
                  {scanResult.guest && <p className="text-muted-foreground">Guest: <span className="font-semibold text-foreground">{scanResult.guest}</span></p>}
                  {scanResult.event && <p className="text-muted-foreground">Event: {scanResult.event}</p>}
                  {scanResult.attendees !== undefined && scanResult.status !== 'invalid' && (
                    <p className="text-muted-foreground flex items-center justify-center gap-1">
                      <Users className="w-4 h-4" /> {scanResult.attendees} attendee(s)
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Codes List */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <CardTitle className="font-display text-lg">Invitation QR Codes</CardTitle>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredInvitations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No invitations found. Send some invitations first!</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                  {filteredInvitations.map((inv) => (
                    <div key={inv.id} className={`p-4 rounded-lg border text-center space-y-2 ${inv.checked_in ? 'border-success/30 bg-success/5' : 'border-border'}`}>
                      <QRCodeSVG value={inv.qr_code || inv.id} size={90} className="mx-auto" />
                      <p className="font-medium text-sm truncate">{inv.contact_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.event_title}</p>
                      <div className="flex gap-1 justify-center flex-wrap">
                        <Badge variant={rsvpVariant(inv.rsvp_status)} className="capitalize text-xs">
                          {inv.rsvp_status}
                        </Badge>
                        {inv.checked_in && (
                          <Badge className="bg-success text-success-foreground text-xs">Checked In</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
