import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockTemplates } from '@/lib/mock-data';
import { CardTemplate } from '@/lib/types';
import { Calendar, MapPin, Clock, User, Type, Palette, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CardCreator() {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [hostName, setHostName] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const categories = ['all', 'wedding', 'birthday', 'corporate', 'baby-shower', 'graduation'] as const;
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredTemplates = activeCategory === 'all'
    ? mockTemplates
    : mockTemplates.filter((t) => t.category === activeCategory);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Card Creator</h1>
          <p className="text-muted-foreground mt-1">Design beautiful invitation cards for your events.</p>
        </div>

        <Tabs defaultValue="template" className="space-y-6">
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
                      <div
                        className="w-full h-40 rounded-lg mb-3 flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})`,
                        }}
                      >
                        <div className="text-center text-white">
                          <p className="font-display text-xl font-bold drop-shadow-md">{template.name}</p>
                          <p className="text-xs opacity-80 mt-1 capitalize">{template.category.replace('-', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{template.name}</p>
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
                    <Label htmlFor="title" className="flex items-center gap-2"><Type className="w-4 h-4" /> Event Title</Label>
                    <Input id="title" placeholder="e.g., Harusi ya Juma & Amina" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="host" className="flex items-center gap-2"><User className="w-4 h-4" /> Host Name</Label>
                    <Input id="host" placeholder="e.g., Familia ya Juma" value={hostName} onChange={(e) => setHostName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Venue</Label>
                    <Input id="venue" placeholder="e.g., Serena Hotel, Dar es Salaam" value={venue} onChange={(e) => setVenue(e.target.value)} />
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
                  <Textarea id="desc" placeholder="Write a beautiful invitation message..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview">
            <div className="max-w-lg mx-auto">
              <Card className="overflow-hidden shadow-2xl">
                <div
                  className="p-8 text-center text-white min-h-[400px] flex flex-col items-center justify-center"
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
                </div>
              </Card>
              <div className="flex gap-3 mt-6 justify-center">
                <Button size="lg" className="gap-2">Save Card</Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" /> Send Preview
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
