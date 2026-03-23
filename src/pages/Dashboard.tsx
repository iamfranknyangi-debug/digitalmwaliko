import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Send, Users, CheckCircle2, Clock, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { mockEvents, chartData } from '@/lib/mock-data';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Total Invitations', value: '1,395', icon: Send, change: '+12%', color: 'text-primary' },
  { label: 'Confirmed RSVPs', value: '415', icon: CheckCircle2, change: '+8%', color: 'text-success' },
  { label: 'Pending Responses', value: '150', icon: Clock, change: '-3%', color: 'text-warning' },
  { label: 'Active Events', value: '3', icon: Calendar, change: '+1', color: 'text-info' },
];

const barChartConfig = {
  sent: { label: 'Invitations Sent', color: 'hsl(25, 85%, 55%)' },
};

const pieChartConfig = {
  confirmed: { label: 'Confirmed', color: 'hsl(145, 65%, 42%)' },
  pending: { label: 'Pending', color: 'hsl(38, 92%, 50%)' },
  declined: { label: 'Declined', color: 'hsl(0, 72%, 51%)' },
};

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your event overview.</p>
          </div>
          <Link to="/cards">
            <Button className="gap-2">
              Create Card <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
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
                    <Badge variant="secondary" className="text-xs font-medium">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold font-body">{stat.value}</p>
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
              <ChartContainer config={barChartConfig} className="h-[280px]">
                <BarChart data={chartData.invitationsOverTime}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sent" fill="hsl(25, 85%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">RSVP Response Rate</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ChartContainer config={pieChartConfig} className="h-[280px]">
                <PieChart>
                  <Pie data={chartData.rsvpRate} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {chartData.rsvpRate.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
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
            <div className="space-y-4">
              {mockEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold font-display">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
