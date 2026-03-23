import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Shield, Palette } from 'lucide-react';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><User className="w-5 h-5" /> Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input defaultValue="Admin User" /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue="admin@fndigitalcards.co.tz" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+255712345678" /></div>
              <div className="space-y-2"><Label>Company</Label><Input defaultValue="FN's Digital Cards" /></div>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="font-medium">Email Notifications</p><p className="text-sm text-muted-foreground">Receive RSVP confirmations via email</p></div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="font-medium">SMS Reminders</p><p className="text-sm text-muted-foreground">Send automatic reminders before events</p></div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Shield className="w-5 h-5" /> Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Current Password</Label><Input type="password" /></div>
            <div className="space-y-2"><Label>New Password</Label><Input type="password" /></div>
            <Button variant="outline">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
