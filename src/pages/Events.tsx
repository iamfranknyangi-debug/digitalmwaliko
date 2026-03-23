import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEvents } from '@/lib/mock-data';
import { Calendar, MapPin, Clock, Users, CheckCircle2, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

export default function Events() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground mt-1">Manage all your events in one place.</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> New Event</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockEvents.map((event, i) => {
            const confirmRate = Math.round((event.confirmed / event.totalInvited) * 100);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="h-32 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                    <h3 className="font-display text-xl font-bold text-primary-foreground text-center px-4 drop-shadow">{event.title}</h3>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {event.time}</p>
                      <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.venue}</p>
                    </div>

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

                    <Button variant="outline" className="w-full" size="sm">View Details</Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
