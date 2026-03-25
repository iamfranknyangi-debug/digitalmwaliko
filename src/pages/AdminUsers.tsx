import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Loader2, Shield, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('event_manager');

  useEffect(() => {
    if (!user) return;
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user!.id).eq('role', 'admin').maybeSingle();
    if (!data) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    await loadUsers();
  };

  const loadUsers = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke('manage-users', {
      body: { action: 'list' },
    });
    if (res.error) {
      toast.error('Failed to load users');
    } else {
      setUsers(res.data.users || []);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newEmail || !newPassword || !newFullName) {
      toast.error('Please fill all fields');
      return;
    }
    setCreating(true);
    const res = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', email: newEmail, password: newPassword, full_name: newFullName, role: newRole },
    });
    setCreating(false);
    if (res.error || res.data?.error) {
      toast.error(res.data?.error || 'Failed to create user');
    } else {
      toast.success(`User ${newEmail} created successfully!`);
      setDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('event_manager');
      await loadUsers();
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;
    const res = await supabase.functions.invoke('manage-users', {
      body: { action: 'delete', user_id: userId },
    });
    if (res.error || res.data?.error) {
      toast.error(res.data?.error || 'Failed to delete user');
    } else {
      toast.success(`User ${email} deleted`);
      await loadUsers();
    }
  };

  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" /> User Management
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage system users. Only admins can access this page.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="w-4 h-4" /> Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={newFullName} onChange={e => setNewFullName(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_manager">Event Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Users className="w-5 h-5" /> All Users</CardTitle>
            <CardDescription>{users.length} registered user(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        {u.id !== user?.id && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.email)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
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
