import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Send, Users, CheckCircle2, Clock, TrendingUp, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subMonths, startOfMonth } from 'date-fns';

const barChartConfig = {
  sent: { label: 'Invitations Sent', color: 'hsl(25, 85%, 55%)' },
};

const pieChartConfig = {
  confirmed: { label: 'Confirmed', color: 'hsl(145, 65%, 42%)' },
  pending: { label: 'Pending', color: 'hsl(38, 92%, 50%)' },
  declined: { label: 'Declined', color: 'hsl(0, 72%, 51%)' },
};

interface DashboardStats {
  totalInvitations: number;
  confirmedRsvps: number;
  pendingResponses: number;
  activeEvents: number;
  declinedRsvps: number;
}

interface EventWithStats {
  id: string;
  title: string;
  venue: string;
  date: string;
  confirmed: number;
  pending: number;
  totalInvited: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvitations: 0, confirmedRsvps: 0, pendingResponses: 0, activeEvents: 0, declinedRsvps: 0,
  });
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; sent: number }[]>([]);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [eventsRes, invitationsRes, profileRes] = await Promise.all([
        supabase.from('events').select('*').eq('user_id', user!.id),
        supabase.from('invitations').select('*, events(title, venue, date)').eq('user_id', user!.id),
        supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
      ]);

      if (profileRes.data) setProfileName(profileRes.data.full_name);

      const allEvents = eventsRes.data || [];
      const allInvitations = invitationsRes.data || [];

      // Stats
      const confirmed = allInvitations.filter(i => i.rsvp_status === 'confirmed').length;
      const pending = allInvitations.filter(i => i.rsvp_status === 'pending').length;
      const declined = allInvitations.filter(i => i.rsvp_status === 'declined').length;

      setStats({
        totalInvitations: allInvitations.length,
        confirmedRsvps: confirmed,
        pendingResponses: pending,
        activeEvents: allEvents.length,
        declinedRsvps: declined,
      });

      // Events with invitation stats
      const eventsWithStats: EventWithStats[] = allEvents.map(event => {
        const eventInvitations = allInvitations.filter(i => i.event_id === event.id);
        return {
          id: event.id,
          title: event.title,
          venue: event.venue,
          date: event.date,
          confirmed: eventInvitations.filter(i => i.rsvp_status === 'confirmed').length,
          pending: eventInvitations.filter(i => i.rsvp_status === 'pending').length,
          totalInvited: eventInvitations.length,
        };
      });
      setEvents(eventsWithStats);

      // Monthly chart data (last 6 months)
      const months: { month: string; sent: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = startOfMonth(subMonths(new Date(), i - 1));
        const count = allInvitations.filter(inv => {
          const created = new Date(inv.created_at);
          return created >= monthStart && created < monthEnd;
        }).length;
        months.push({ month: format(monthStart, 'MMM'), sent: count });
      }
      setMonthlyData(months);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'confirmed', value: stats.confirmedRsvps, fill: 'hsl(145, 65%, 42%)' },
    { name: 'pending', value: stats.pendingResponses, fill: 'hsl(38, 92%, 50%)' },
    { name: 'declined', value: stats.declinedRsvps, fill: 'hsl(0, 72%, 51%)' },
  ].filter(d => d.value > 0);

  const statCards = [
    { label: 'Total Invitations', value: stats.totalInvitations, icon: Send, color: 'text-primary' },
    { label: 'Confirmed RSVPs', value: stats.confirmedRsvps, icon: CheckCircle2, color: 'text-success' },
    { label: 'Pending Responses', value: stats.pendingResponses, icon: Clock, color: 'text-warning' },
    { label: 'Active Events', value: stats.activeEvents, icon: Calendar, color: 'text-info' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {profileName ? `Karibu, ${profileName}!` : 'Welcome back!'} Here's your event overview.
            </p>
          </div>
          <Link to="/cards">
            <Button className="gap-2">
              Create Card <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold font-body">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Invitations Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.some(d => d.sent > 0) ? (
                <ChartContainer config={barChartConfig} className="h-[280px]">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sent" fill="hsl(25, 85%, 55%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  <p>No invitations sent yet. Start by creating an event!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">RSVP Response Rate</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {pieData.length > 0 ? (
                <ChartContainer config={pieChartConfig} className="h-[280px]">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  <p>No RSVP data yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Active Events</CardTitle>
            <Link to="/events">
              <Button variant="ghost" size="sm" className="gap-1">View All <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold font-display">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.venue}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-foreground">{event.confirmed}</p>
                        <p className="text-xs text-success">Confirmed</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground">{event.pending}</p>
                        <p className="text-xs text-warning">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground">{event.totalInvited}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No events yet</p>
                <p className="text-sm mt-1">Create your first event to get started!</p>
                <Link to="/events">
                  <Button variant="outline" size="sm" className="mt-4">Create Event</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
