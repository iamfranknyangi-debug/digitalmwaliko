import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, FileSpreadsheet, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Contact {
  id: string;
  name: string;
  phone: string;
  group: string;
  email?: string | null;
}

const GROUPS = ['Family', 'Friends', 'VIP', 'Work', 'General', 'Imported'];

export default function Contacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGroup, setNewGroup] = useState('Friends');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGroup, setEditGroup] = useState('Friends');

  const fetchContacts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (error) toast.error('Failed to load contacts');
    else setContacts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [user]);

  const groups = [...new Set([...GROUPS, ...contacts.map((c) => c.group)])];
  const filtered = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesGroup = filterGroup === 'all' || c.group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const validateTzPhone = (phone: string) => /^\+255\d{9}$/.test(phone.replace(/\s/g, ''));

  const handleAdd = async () => {
    if (!user) return;
    if (!newName.trim() || !newPhone.trim()) return toast.error('Name and phone are required');
    if (!validateTzPhone(newPhone)) return toast.error('Invalid TZ phone. Use +255XXXXXXXXX format.');

    setSaving(true);
    const { error } = await supabase.from('contacts').insert({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || null,
      group: newGroup,
      user_id: user.id,
    });
    setSaving(false);

    if (error) return toast.error('Failed to add contact');
    setNewName(''); setNewPhone(''); setNewEmail(''); setNewGroup('Friends');
    setDialogOpen(false);
    toast.success('Contact added!');
    fetchContacts();
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: async (results) => {
        const normalizePhone = (raw: string) => {
          let p = String(raw).replace(/[\s\-()]/g, '').trim();
          if (!p) return '';
          if (p.startsWith('+')) return p;
          if (p.startsWith('255')) return '+' + p;
          if (p.startsWith('0') && p.length === 10) return '+255' + p.slice(1);
          if (/^\d{9}$/.test(p)) return '+255' + p;
          return p;
        };

        const data = results.data as any[];
        const rows: any[] = [];
        const skipped: string[] = [];

        data.forEach((row, idx) => {
          const name = row.name || row.Name || row.fullname || row['full name'];
          const phoneRaw = row.phone || row.Phone || row.mobile || row.number || row['phone number'];
          if (!name || !phoneRaw) {
            skipped.push(`Row ${idx + 2}: missing name or phone`);
            return;
          }
          const phone = normalizePhone(phoneRaw);
          if (!validateTzPhone(phone)) {
            skipped.push(`Row ${idx + 2}: invalid phone "${phoneRaw}"`);
            return;
          }
          rows.push({
            name: String(name).trim().slice(0, 100),
            phone,
            email: row.email ? String(row.email).trim() : null,
            group: row.group ? String(row.group).trim() : 'Imported',
            user_id: user.id,
          });
        });

        if (rows.length === 0) {
          console.warn('CSV import skipped rows:', skipped, 'parsed headers:', results.meta.fields);
          return toast.error(
            `No valid contacts found. Headers detected: ${results.meta.fields?.join(', ') || 'none'}. Required: name, phone (TZ format).`
          );
        }

        setSaving(true);
        const { error } = await supabase.from('contacts').insert(rows);
        setSaving(false);

        if (error) return toast.error('Failed to import contacts');
        toast.success(
          skipped.length
            ? `${rows.length} imported, ${skipped.length} skipped (invalid phone/missing fields)`
            : `${rows.length} contacts imported!`
        );
        fetchContacts();
      },
      error: (err) => {
        toast.error(`CSV parse error: ${err.message}`);
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('contacts').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast.error('Failed to delete contact');
    else {
      toast.success('Contact removed');
      fetchContacts();
    }
  };

  const openEdit = (c: Contact) => {
    setEditContact(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditEmail(c.email || '');
    setEditGroup(c.group);
  };

  const handleEditSave = async () => {
    if (!user || !editContact) return;
    if (!editName.trim() || !editPhone.trim()) return toast.error('Name and phone are required');
    if (!validateTzPhone(editPhone)) return toast.error('Invalid TZ phone. Use +255XXXXXXXXX format.');

    setSaving(true);
    const { error } = await supabase
      .from('contacts')
      .update({
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        group: editGroup,
      })
      .eq('id', editContact.id)
      .eq('user_id', user.id);
    setSaving(false);

    if (error) return toast.error('Failed to update contact');
    setEditContact(null);
    toast.success('Contact updated!');
    fetchContacts();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Contacts</h1>
            <p className="text-muted-foreground mt-1">{contacts.length} contacts in your list</p>
          </div>
          <div className="flex gap-2">
            <label>
              <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
              <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                <span><FileSpreadsheet className="w-4 h-4" /> Import CSV</span>
              </Button>
            </label>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Contact</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Add New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input placeholder="+255712345678" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Tanzania format: +255XXXXXXXXX</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input placeholder="email@example.com" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Group</Label>
                    <Select value={newGroup} onValueChange={setNewGroup}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GROUPS.filter(g => g !== 'Imported').map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleAdd} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Add Contact
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Groups" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                      <TableCell><Badge variant="secondary">{c.group}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{c.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>This contact will be permanently removed.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {contacts.length === 0 ? 'No contacts yet. Add your first contact!' : 'No contacts match your search.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!editContact} onOpenChange={(o) => !o && setEditContact(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Edit Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="Full name" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input placeholder="+255712345678" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                <p className="text-xs text-muted-foreground">Tanzania format: +255XXXXXXXXX</p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="email@example.com" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Select value={editGroup} onValueChange={setEditGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleEditSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
