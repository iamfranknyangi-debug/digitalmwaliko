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

  // List controls
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'today' | 'past'>('all');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'title' | 'invited'>('date-asc');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

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
        <EventsContent
          loading={loading}
          events={events}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          view={view}
          setView={setView}
          page={page}
          setPage={setPage}
          pageSize={PAGE_SIZE}
          openCreate={openCreate}
          openEdit={openEdit}
          handleDelete={handleDelete}
        />

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
