import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockContacts } from '@/lib/mock-data';
import { Contact } from '@/lib/types';
import { Upload, Plus, Search, Users, Phone, Trash2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGroup, setNewGroup] = useState('Friends');
  const [dialogOpen, setDialogOpen] = useState(false);

  const groups = [...new Set(contacts.map((c) => c.group))];
  const filtered = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesGroup = filterGroup === 'all' || c.group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const validateTzPhone = (phone: string) => /^\+255\d{9}$/.test(phone.replace(/\s/g, ''));

  const handleAdd = () => {
    if (!newName || !newPhone) return toast.error('Please fill all fields');
    if (!validateTzPhone(newPhone)) return toast.error('Invalid TZ phone. Use +255XXXXXXXXX format.');
    const contact: Contact = { id: Date.now().toString(), name: newName, phone: newPhone, group: newGroup };
    setContacts((prev) => [...prev, contact]);
    setNewName(''); setNewPhone(''); setNewGroup('Friends');
    setDialogOpen(false);
    toast.success('Contact added!');
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const imported = results.data
          .filter((row: any) => row.name && row.phone)
          .map((row: any, i: number) => ({
            id: `imp-${Date.now()}-${i}`,
            name: row.name,
            phone: row.phone,
            group: row.group || 'Imported',
          }));
        setContacts((prev) => [...prev, ...imported]);
        toast.success(`${imported.length} contacts imported!`);
      },
    });
  };

  const handleDelete = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success('Contact removed');
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
              <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleCSV} />
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
                    <Label>Name</Label>
                    <Input placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="+255712345678" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Tanzania format: +255XXXXXXXXX</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Group</Label>
                    <Select value={newGroup} onValueChange={setNewGroup}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Friends">Friends</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="Work">Work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleAdd}>Add Contact</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
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

        {/* Table */}
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
                    <TableCell>
                      <Badge variant="secondary">{c.group}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No contacts found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
