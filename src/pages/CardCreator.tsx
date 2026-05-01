import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { mockTemplates } from '@/lib/mock-data';
import { CardTemplate } from '@/lib/types';
import { Calendar, MapPin, Clock, User, Type, Eye, Loader2, Upload, ImageIcon, Save, LayoutGrid, Search, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TemplatePreview } from '@/components/cards/TemplatePreview';

interface EventOption {
  id: string;
  title: string;
}

interface SavedCard {
  id: string;
  title: string;
  host: string;
  venue: string;
  date: string;
  time: string;
  description: string | null;
  image_url: string | null;
  template_id: string | null;
  updated_at: string;
}

export default function CardCreator() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [hostName, setHostName] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('template');

  // Link to existing event
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('new');

  // Saved cards side panel
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [cardSearch, setCardSearch] = useState('');
  const [cardFilter, setCardFilter] = useState<string>('all');
  const [loadingCards, setLoadingCards] = useState(false);

  const categories = ['all', 'wedding', 'birthday', 'corporate', 'baby-shower', 'graduation'] as const;
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredTemplates = activeCategory === 'all'
    ? mockTemplates
    : mockTemplates.filter((t) => t.category === activeCategory);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('events')
      .select('id, title')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setEvents(data || []));
  }, [user]);

  const fetchSavedCards = async () => {
    if (!user) return;
    setLoadingCards(true);
    const { data } = await supabase
      .from('events')
      .select('id, title, host, venue, date, time, description, image_url, template_id, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setSavedCards((data as SavedCard[]) || []);
    setLoadingCards(false);
  };

  useEffect(() => {
    if (cardsOpen) fetchSavedCards();
  }, [cardsOpen, user]);

  const cardCategories = ['all', 'wedding', 'birthday', 'corporate', 'baby-shower', 'graduation', 'other'] as const;

  const filteredSavedCards = savedCards.filter((c) => {
    const tmpl = mockTemplates.find((t) => t.id === c.template_id);
    const cat = tmpl?.category || 'other';
    const matchesCat = cardFilter === 'all' || cat === cardFilter;
    const q = cardSearch.trim().toLowerCase();
    const matchesSearch = !q ||
      c.title.toLowerCase().includes(q) ||
      (c.host || '').toLowerCase().includes(q) ||
      (c.venue || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const openSavedCard = async (id: string) => {
    await handleEventSelect(id);
    setCardsOpen(false);
    setActiveTab('preview');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    setUploading(true);
    const ext = imageFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('card-images').upload(path, imageFile, {
      cacheControl: '3600',
      upsert: false,
    });
    setUploading(false);
    if (error) {
      toast.error('Image upload failed');
      return null;
    }
    const { data: urlData } = supabase.storage.from('card-images').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!eventTitle.trim()) {
      toast.error('Event title is required');
      return;
    }

    setSaving(true);

    // Upload image if selected
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage();
    }

    if (selectedEventId !== 'new') {
      // Update existing event with card details
      const updateData: Record<string, any> = {
        title: eventTitle.trim(),
        host: hostName.trim(),
        venue: venue.trim(),
        date: date || new Date().toISOString().split('T')[0],
        time: time || '18:00',
        description: description.trim(),
        template_id: selectedTemplate?.id || null,
        updated_at: new Date().toISOString(),
      };
      if (imageUrl) updateData.image_url = imageUrl;

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', selectedEventId)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to save card');
        setSaving(false);
        return;
      }
      toast.success('Card saved to existing event!');
    } else {
      // Create new event with card
      const { error } = await supabase.from('events').insert({
        title: eventTitle.trim(),
        host: hostName.trim(),
        venue: venue.trim(),
        date: date || new Date().toISOString().split('T')[0],
        time: time || '18:00',
        description: description.trim(),
        template_id: selectedTemplate?.id || null,
        image_url: imageUrl,
        user_id: user.id,
      });

      if (error) {
        toast.error('Failed to create event with card');
        setSaving(false);
        return;
      }
      toast.success('Card created with new event!');
    }

    setSaving(false);
    // Reset form
    setEventTitle(''); setHostName(''); setVenue(''); setDate(''); setTime('');
    setDescription(''); setImageFile(null); setImagePreview(null);
    setSelectedTemplate(null); setSelectedEventId('new');
    setActiveTab('template');

    // Refresh events list
    const { data } = await supabase
      .from('events')
      .select('id, title')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setEvents(data || []);
  };

  // Load event details when selecting an existing event
  const handleEventSelect = async (eventId: string) => {
    setSelectedEventId(eventId);
    if (eventId === 'new') {
      setEventTitle(''); setHostName(''); setVenue(''); setDate(''); setTime('');
      setDescription(''); setImagePreview(null); setSelectedTemplate(null);
      return;
    }
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    if (data) {
      setEventTitle(data.title);
      setHostName(data.host);
      setVenue(data.venue);
      setDate(data.date);
      setTime(data.time);
      setDescription(data.description || '');
      if (data.image_url) setImagePreview(data.image_url);
      if (data.template_id) {
        const tmpl = mockTemplates.find((t) => t.id === data.template_id);
        if (tmpl) setSelectedTemplate(tmpl);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Card Creator</h1>
            <p className="text-muted-foreground mt-1">Design beautiful invitation cards for your events.</p>
          </div>
          <div className="flex items-center gap-3">
            <Sheet open={cardsOpen} onOpenChange={setCardsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <LayoutGrid className="w-4 h-4" /> My Cards
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0">
                <SheetHeader className="p-5 border-b border-border">
                  <SheetTitle className="font-display flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" /> My Cards
                  </SheetTitle>
                  <SheetDescription>Browse and reopen any card you've created.</SheetDescription>
                </SheetHeader>

                <div className="p-4 space-y-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title, host, venue..."
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cardCategories.map((cat) => (
                      <Badge
                        key={cat}
                        variant={cardFilter === cat ? 'default' : 'secondary'}
                        className="cursor-pointer capitalize text-xs"
                        onClick={() => setCardFilter(cat)}
                      >
                        {cat === 'all' ? 'All' : cat.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingCards ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filteredSavedCards.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 text-sm">
                      No cards match your filters.
                    </div>
                  ) : (
                    filteredSavedCards.map((c) => {
                      const tmpl = mockTemplates.find((t) => t.id === c.template_id);
                      const cat = tmpl?.category || 'other';
                      return (
                        <button
                          key={c.id}
                          onClick={() => openSavedCard(c.id)}
                          className="w-full text-left rounded-lg border border-border hover:border-primary hover:shadow-md transition-all overflow-hidden bg-card group"
                        >
                          <div className="flex gap-3 p-3">
                            <div className="w-20 h-20 rounded-md overflow-hidden shrink-0 border border-border">
                              {tmpl ? (
                                <TemplatePreview
                                  template={tmpl}
                                  title={c.title}
                                  host={c.host}
                                  variant="thumb"
                                />
                              ) : c.image_url ? (
                                <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                {c.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {c.host || 'No host'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">
                                  {cat.replace('-', ' ')}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {c.date ? new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Select value={selectedEventId} onValueChange={handleEventSelect}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Link to event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">+ Create New Event</SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="template">1. Template</TabsTrigger>
            <TabsTrigger value="details">2. Details</TabsTrigger>
            <TabsTrigger value="preview">3. Preview</TabsTrigger>
          </TabsList>

          {/* Template Selection */}
          <TabsContent value="template" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'secondary'}
                  className="cursor-pointer capitalize"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? 'All Templates' : cat.replace('-', ' ')}
                </Badge>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <motion.div key={template.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={`cursor-pointer transition-all ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <TemplatePreview
                          template={template}
                          title={template.name}
                          host={template.category === 'wedding' ? '& Family' : ''}
                          variant="thumb"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{template.category.replace('-', ' ')}</p>
                        </div>
                        <div className="flex gap-1">
                          {template.colors.map((c, i) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setActiveTab('details')} disabled={!selectedTemplate}>
                Next: Add Details →
              </Button>
            </div>
          </TabsContent>

          {/* Event Details */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2"><Type className="w-4 h-4" /> Event Title *</Label>
                    <Input id="title" placeholder="e.g., Harusi ya Juma & Amina" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="host" className="flex items-center gap-2"><User className="w-4 h-4" /> Host Name</Label>
                    <Input id="host" placeholder="e.g., Familia ya Juma" value={hostName} onChange={(e) => setHostName(e.target.value)} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Venue</Label>
                    <Input id="venue" placeholder="e.g., Serena Hotel, Dar es Salaam" value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2"><Clock className="w-4 h-4" /> Time</Label>
                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description / Message</Label>
                  <Textarea id="desc" placeholder="Write a beautiful invitation message..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Card Image (optional)</Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img src={imagePreview} alt="Card preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                        <p className="text-xs text-muted-foreground">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload an image (max 10MB)</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WebP supported</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('template')}>← Back</Button>
                  <Button onClick={() => setActiveTab('preview')}>Preview Card →</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview">
            <div className="max-w-lg mx-auto">
              <Card className="overflow-hidden shadow-2xl">
                {imagePreview && (
                  <div className="relative h-48 overflow-hidden">
                    <img src={imagePreview} alt="Card" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                  </div>
                )}
                {selectedTemplate ? (
                  <TemplatePreview
                    template={selectedTemplate}
                    title={eventTitle || 'Your Event Title'}
                    host={hostName || 'Host Name'}
                    venue={venue || 'Venue'}
                    date={date}
                    time={time || 'Time'}
                    description={description}
                    variant="full"
                  />
                ) : (
                  <div className="p-8 text-center text-muted-foreground min-h-[350px] flex items-center justify-center">
                    Select a template to preview
                  </div>
                )}
                {selectedTemplate && (
                  <p className="text-center text-xs text-muted-foreground mt-3">Template: {selectedTemplate.name}</p>
                )}
              </Card>

              <div className="flex gap-3 mt-6 justify-center">
                <Button variant="outline" onClick={() => setActiveTab('details')}>← Edit Details</Button>
                <Button size="lg" className="gap-2" onClick={handleSave} disabled={saving || uploading}>
                  {(saving || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  {selectedEventId !== 'new' ? 'Update Card' : 'Save Card'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
