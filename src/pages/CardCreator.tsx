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
import { mockTemplates } from '@/lib/mock-data';
import { CardTemplate } from '@/lib/types';
import { Calendar, MapPin, Clock, User, Type, Eye, Loader2, Upload, ImageIcon, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TemplatePreview } from '@/components/cards/TemplatePreview';

interface EventOption {
  id: string;
  title: string;
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
                <div
                  className="p-8 text-center text-white min-h-[350px] flex flex-col items-center justify-center"
                  style={{
                    background: selectedTemplate
                      ? `linear-gradient(135deg, ${selectedTemplate.colors[0]}, ${selectedTemplate.colors[1]})`
                      : 'var(--gradient-primary)',
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.3em] opacity-70 mb-6">You are cordially invited</p>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 drop-shadow-md">
                    {eventTitle || 'Your Event Title'}
                  </h2>
                  <p className="text-sm opacity-80 mb-6">Hosted by {hostName || 'Host Name'}</p>
                  <div className="w-16 h-px bg-white/40 mb-6" />
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center justify-center gap-2"><MapPin className="w-4 h-4" /> {venue || 'Venue'}</p>
                    <p className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /> {date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date'}</p>
                    <p className="flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> {time || 'Time'}</p>
                  </div>
                  {description && (
                    <p className="mt-6 text-sm opacity-90 max-w-sm italic">"{description}"</p>
                  )}
                  {selectedTemplate && (
                    <p className="mt-4 text-xs opacity-50">Template: {selectedTemplate.name}</p>
                  )}
                </div>
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
