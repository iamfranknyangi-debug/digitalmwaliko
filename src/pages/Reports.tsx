import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockInvitations } from '@/lib/mock-data';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function Reports() {
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
            { label: 'Total Sent', value: mockInvitations.length, variant: 'default' as const },
            { label: 'Delivered', value: mockInvitations.filter((i) => i.status === 'delivered').length, variant: 'secondary' as const },
            { label: 'Confirmed', value: mockInvitations.filter((i) => i.rsvpStatus === 'confirmed').length, variant: 'default' as const },
            { label: 'Declined', value: mockInvitations.filter((i) => i.rsvpStatus === 'declined').length, variant: 'destructive' as const },
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Sent Via</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>RSVP</TableHead>
                  <TableHead>Attendees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.contactName}</TableCell>
                    <TableCell className="font-mono text-sm">{inv.contactPhone}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{inv.sentVia}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">{inv.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.rsvpStatus === 'confirmed' ? 'default' : inv.rsvpStatus === 'declined' ? 'destructive' : 'secondary'} className="capitalize">{inv.rsvpStatus}</Badge>
                    </TableCell>
                    <TableCell>{inv.attendeeCount || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
