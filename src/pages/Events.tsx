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

interface EventsContentProps {
  loading: boolean;
  events: EventWithStats[];
  search: string;
  setSearch: (v: string) => void;
  statusFilter: 'all' | 'upcoming' | 'today' | 'past';
  setStatusFilter: (v: 'all' | 'upcoming' | 'today' | 'past') => void;
  sortBy: 'date-asc' | 'date-desc' | 'title' | 'invited';
  setSortBy: (v: 'date-asc' | 'date-desc' | 'title' | 'invited') => void;
  view: 'grid' | 'list';
  setView: (v: 'grid' | 'list') => void;
  page: number;
  setPage: (v: number | ((p: number) => number)) => void;
  pageSize: number;
  openCreate: () => void;
  openEdit: (e: EventWithStats) => void;
  handleDelete: (id: string) => void;
}

function EventsContent({
  loading, events, search, setSearch, statusFilter, setStatusFilter,
  sortBy, setSortBy, view, setView, page, setPage, pageSize,
  openCreate, openEdit, handleDelete,
}: EventsContentProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const filtered = events.filter((e) => {
    const q = search.trim().toLowerCase();
    if (q && !`${e.title} ${e.host} ${e.venue}`.toLowerCase().includes(q)) return false;
    const d = new Date(e.date); d.setHours(0, 0, 0, 0);
    if (statusFilter === 'upcoming' && d < today) return false;
    if (statusFilter === 'past' && d >= today) return false;
    if (statusFilter === 'today' && d.getTime() !== today.getTime()) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'invited') return b.totalInvited - a.totalInvited;
    const da = new Date(a.date).getTime(), db = new Date(b.date).getTime();
    return sortBy === 'date-asc' ? da - db : db - da;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const upcomingCount = events.filter((e) => { const d = new Date(e.date); d.setHours(0,0,0,0); return d >= today; }).length;
  const todayCount = events.filter((e) => { const d = new Date(e.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); }).length;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {events.length} total · {upcomingCount} upcoming{todayCount > 0 ? ` · ${todayCount} today` : ''}
          </p>
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
        <>
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by title, host, or venue…"
                  className="pl-9 pr-9"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {(['all', 'upcoming', 'today', 'past'] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? 'default' : 'outline'}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className="capitalize"
                  >
                    {s}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-asc">Date ↑</SelectItem>
                    <SelectItem value="date-desc">Date ↓</SelectItem>
                    <SelectItem value="title">Title A–Z</SelectItem>
                    <SelectItem value="invited">Most invited</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-md overflow-hidden">
                  <Button size="icon" variant={view === 'grid' ? 'default' : 'ghost'} className="rounded-none h-9 w-9" onClick={() => setView('grid')} aria-label="Grid view">
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant={view === 'list' ? 'default' : 'ghost'} className="rounded-none h-9 w-9" onClick={() => setView('list')} aria-label="List view">
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No events match your filters.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear filters</Button>
            </Card>
          ) : (
            <>
              <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3' : 'flex flex-col gap-3'}>
                {paged.map((event, i) => {
                  const confirmRate = event.totalInvited > 0 ? Math.round((event.confirmed / event.totalInvited) * 100) : 0;
                  const eventDate = new Date(event.date); eventDate.setHours(0, 0, 0, 0);
                  const isPast = eventDate < today;
                  const isToday = eventDate.getTime() === today.getTime();
                  const statusBadge = isToday
                    ? <Badge className="bg-primary text-primary-foreground">Today</Badge>
                    : isPast
                      ? <Badge variant="secondary">Past</Badge>
                      : <Badge className="bg-success text-success-foreground">Upcoming</Badge>;

                  if (view === 'list') {
                    return (
                      <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <Card className="hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
                            <div className="flex items-center justify-center md:w-20 h-16 md:h-20 rounded-lg bg-gradient-to-br from-primary/80 to-primary text-primary-foreground flex-shrink-0">
                              <div className="text-center">
                                <p className="text-xs uppercase tracking-wide opacity-90">{eventDate.toLocaleString('en-GB', { month: 'short' })}</p>
                                <p className="text-2xl font-bold leading-none">{eventDate.getDate()}</p>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 flex-wrap">
                                <h3 className="font-display text-lg font-semibold truncate">{event.title}</h3>
                                {statusBadge}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.time}</span>
                                <span className="flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5" /> {event.venue || '—'}</span>
                                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.totalInvited} invited</span>
                              </div>
                            </div>
                            {event.totalInvited > 0 && (
                              <div className="md:w-40">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">RSVP</span>
                                  <span className="font-semibold">{confirmRate}%</span>
                                </div>
                                <Progress value={confirmRate} className="h-2" />
                              </div>
                            )}
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(event)} aria-label="Edit">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Delete">
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
                        </Card>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card className="hover:shadow-md hover:border-primary/40 transition-all group">
                        <div className="flex items-center gap-3 p-3">
                          {/* Preview thumbnail */}
                          <div className="flex items-center justify-center w-14 h-14 rounded-md bg-gradient-to-br from-primary/80 to-primary text-primary-foreground flex-shrink-0 shadow-sm">
                            <div className="text-center leading-tight">
                              <p className="text-[10px] uppercase tracking-wide opacity-90">{eventDate.toLocaleString('en-GB', { month: 'short' })}</p>
                              <p className="text-lg font-bold leading-none">{eventDate.getDate()}</p>
                            </div>
                          </div>

                          {/* Name + status */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-sm font-semibold truncate" title={event.title}>{event.title}</h3>
                            <div className="mt-0.5">{statusBadge}</div>
                          </div>

                          {/* Hover actions */}
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(event)} aria-label="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" aria-label="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
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
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1">
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <span className="text-sm font-medium px-2">Page {safePage} / {totalPages}</span>
                    <Button size="sm" variant="outline" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="gap-1">
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
