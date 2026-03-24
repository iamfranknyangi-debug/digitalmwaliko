import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface InvitationRow {
  id: string;
  status: string;
  rsvp_status: string;
  sent_via: string;
  attendee_count: number;
  sent_at: string | null;
  contacts: { name: string; phone: string } | null;
  events: { title: string } | null;
}

export default function Reports() {
  const { user } = useAuth();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['reports-invitations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, status, rsvp_status, sent_via, attendee_count, sent_at, contacts(name, phone), events(title)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as InvitationRow[]) ?? [];
    },
    enabled: !!user,
  });

  const stats = {
    total: invitations.length,
    delivered: invitations.filter((i) => i.status === 'delivered').length,
    confirmed: invitations.filter((i) => i.rsvp_status === 'confirmed').length,
    declined: invitations.filter((i) => i.rsvp_status === 'declined').length,
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">View detailed reports and export data.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4" /> Export PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Sent', value: stats.total, variant: 'default' as const },
            { label: 'Delivered', value: stats.delivered, variant: 'secondary' as const },
            { label: 'Confirmed', value: stats.confirmed, variant: 'default' as const },
            { label: 'Declined', value: stats.declined, variant: 'destructive' as const },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Invitation Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No invitations sent yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Sent Via</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>RSVP</TableHead>
                    <TableHead>Attendees</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.contacts?.name ?? '—'}</TableCell>
                      <TableCell>{inv.events?.title ?? '—'}</TableCell>
                      <TableCell className="font-mono text-sm">{inv.contacts?.phone ?? '—'}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{inv.sent_via}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">{inv.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.rsvp_status === 'confirmed' ? 'default' : inv.rsvp_status === 'declined' ? 'destructive' : 'secondary'} className="capitalize">{inv.rsvp_status}</Badge>
                      </TableCell>
                      <TableCell>{inv.attendee_count || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
