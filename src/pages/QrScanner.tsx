import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { mockInvitations } from '@/lib/mock-data';
import { QrCode, Search, CheckCircle2, XCircle, AlertTriangle, Scan } from 'lucide-react';
import { toast } from 'sonner';

export default function QrScanner() {
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<null | { status: 'valid' | 'used' | 'invalid'; guest?: string; event?: string }>(null);

  const handleScan = () => {
    if (!scanInput.trim()) return;
    const inv = mockInvitations.find((i) => i.qrCode === scanInput.trim());
    if (inv) {
      setScanResult({ status: 'valid', guest: inv.contactName, event: 'Harusi ya Juma & Amina' });
      toast.success(`Guest verified: ${inv.contactName}`);
    } else {
      setScanResult({ status: 'invalid' });
      toast.error('Invalid QR code');
    }
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
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><Scan className="w-5 h-5" /> Scan QR Code</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter QR code (e.g., INV-001)" value={scanInput} onChange={(e) => setScanInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleScan()} />
                <Button onClick={handleScan} className="gap-2"><Search className="w-4 h-4" /> Verify</Button>
              </div>

              {scanResult && (
                <div className={`p-6 rounded-xl text-center space-y-2 ${
                  scanResult.status === 'valid' ? 'bg-success/10 border border-success/30' :
                  scanResult.status === 'used' ? 'bg-warning/10 border border-warning/30' :
                  'bg-destructive/10 border border-destructive/30'
                }`}>
                  {scanResult.status === 'valid' && <CheckCircle2 className="w-16 h-16 text-success mx-auto" />}
                  {scanResult.status === 'used' && <AlertTriangle className="w-16 h-16 text-warning mx-auto" />}
                  {scanResult.status === 'invalid' && <XCircle className="w-16 h-16 text-destructive mx-auto" />}
                  <p className="text-xl font-bold font-display capitalize">{scanResult.status}</p>
                  {scanResult.guest && <p className="text-muted-foreground">Guest: {scanResult.guest}</p>}
                  {scanResult.event && <p className="text-muted-foreground">Event: {scanResult.event}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Codes */}
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Invitation QR Codes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {mockInvitations.slice(0, 4).map((inv) => (
                  <div key={inv.id} className="p-4 rounded-lg border border-border text-center space-y-2">
                    <QRCodeSVG value={inv.qrCode} size={100} className="mx-auto" />
                    <p className="font-medium text-sm">{inv.contactName}</p>
                    <p className="text-xs font-mono text-muted-foreground">{inv.qrCode}</p>
                    <Badge variant={inv.rsvpStatus === 'confirmed' ? 'default' : inv.rsvpStatus === 'declined' ? 'destructive' : 'secondary'} className="capitalize">
                      {inv.rsvpStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
