import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Clock, Plus, Pencil, Trash2, Loader2, Search, LayoutGrid, List, Users, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface EventWithStats {
  id: string;
  title: string;
  host: string;
  venue: string;
  date: string;
  time: string;
  description: string | null;
  image_url: string | null;
  totalInvited: number;
  confirmed: number;
  pending: number;
  declined: number;
}

interface EventForm {
  title: string;
  host: string;
  venue: string;
  date: string;
  time: string;
  description: string;
}

const emptyForm: EventForm = { title: '', host: '', venue: '', date: '', time: '18:00', description: '' };

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data: eventsData, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      toast.error('Failed to load events');
      setLoading(false);
      return;
    }

    // Fetch invitation stats for all events
    const { data: invitations } = await supabase
      .from('invitations')
      .select('event_id, rsvp_status')
      .eq('user_id', user.id);

    const statsMap: Record<string, { total: number; confirmed: number; pending: number; declined: number }> = {};
    (invitations || []).forEach((inv) => {
      if (!statsMap[inv.event_id]) statsMap[inv.event_id] = { total: 0, confirmed: 0, pending: 0, declined: 0 };
      statsMap[inv.event_id].total++;
      if (inv.rsvp_status === 'confirmed') statsMap[inv.event_id].confirmed++;
      else if (inv.rsvp_status === 'declined') statsMap[inv.event_id].declined++;
      else statsMap[inv.event_id].pending++;
    });

    setEvents(
      (eventsData || []).map((e) => ({
        id: e.id,
        title: e.title,
        host: e.host,
        venue: e.venue,
        date: e.date,
        time: e.time,
        description: e.description,
        image_url: e.image_url,
        totalInvited: statsMap[e.id]?.total || 0,
        confirmed: statsMap[e.id]?.confirmed || 0,
        pending: statsMap[e.id]?.pending || 0,
        declined: statsMap[e.id]?.declined || 0,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (event: EventWithStats) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      host: event.host,
      venue: event.venue,
      date: event.date,
      time: event.time,
      description: event.description || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('events')
        .update({ title: form.title, host: form.host, venue: form.venue, date: form.date, time: form.time, description: form.description, updated_at: new Date().toISOString() })
        .eq('id', editingId)
        .eq('user_id', user.id);
      if (error) toast.error('Failed to update event');
      else toast.success('Event updated!');
    } else {
      const { error } = await supabase
        .from('events')
        .insert({ title: form.title, host: form.host, venue: form.venue, date: form.date, time: form.time, description: form.description, user_id: user.id });
      if (error) toast.error('Failed to create event');
      else toast.success('Event created!');
    }

    setSaving(false);
    setDialogOpen(false);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast.error('Failed to delete event');
    else {
      toast.success('Event deleted');
      fetchEvents();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground mt-1">Manage all your events in one place.</p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> New Event
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">No events yet. Create your first event!</p>
            <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Create Event</Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, i) => {
              const confirmRate = event.totalInvited > 0 ? Math.round((event.confirmed / event.totalInvited) * 100) : 0;
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="h-32 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center relative">
                      <h3 className="font-display text-xl font-bold text-primary-foreground text-center px-4 drop-shadow">{event.title}</h3>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/20 hover:bg-background/40 text-primary-foreground" onClick={() => openEdit(event)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/20 hover:bg-destructive/80 text-primary-foreground">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone. All invitations for this event will also be removed.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardContent className="p-5 space-y-4">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {event.time}</p>
                        <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.venue || 'No venue set'}</p>
                      </div>

                      {event.totalInvited > 0 && (
                        <>
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">RSVP Progress</span>
                              <span className="font-semibold text-foreground">{confirmRate}%</span>
                            </div>
                            <Progress value={confirmRate} className="h-2" />
                          </div>
                          <div className="flex justify-between text-center">
                            <div>
                              <p className="text-lg font-bold text-foreground">{event.totalInvited}</p>
                              <p className="text-xs text-muted-foreground">Invited</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-success">{event.confirmed}</p>
                              <p className="text-xs text-success">Confirmed</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-warning">{event.pending}</p>
                              <p className="text-xs text-warning">Pending</p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Harusi ya Juma & Amina" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input id="host" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="e.g. Familia ya Juma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Serena Hotel, Dar es Salaam" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event details..." rows={3} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
