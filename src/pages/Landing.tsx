import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, QrCode, BarChart3, Users, CreditCard, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  { icon: CreditCard, title: 'Beautiful Card Creator', desc: 'Design stunning invitation cards with pre-made templates for weddings, birthdays, and corporate events.' },
  { icon: Send, title: 'WhatsApp & SMS Delivery', desc: 'Send invitations via WhatsApp or local Tanzanian telcos — Vodacom, Airtel, Tigo, and Halotel.' },
  { icon: QrCode, title: 'QR Code Verification', desc: 'Generate unique QR codes for each guest. Scan at the door for seamless check-in.' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track RSVPs, delivery status, and attendance with beautiful dashboards and reports.' },
  { icon: Users, title: 'Bulk Contact Management', desc: 'Import contacts via CSV/Excel. Organize into groups like Family, Friends, VIP.' },
  { icon: CheckCircle2, title: 'RSVP Confirmation', desc: 'Guests confirm attendance via unique links. See responses update in real-time.' },
];

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">FN's Digital Cards</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gap-1">Get Started <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(25 85% 55% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(200 65% 45% / 0.2) 0%, transparent 50%)' }} />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/20 text-primary mb-6">
                🇹🇿 Made for Tanzania
              </span>
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Digital Invitations,{' '}
                <span className="text-gradient">Simplified</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto font-body">
                Create beautiful invitation cards, send via WhatsApp & SMS, track RSVPs, and verify guests with QR codes — all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="text-base px-8 gap-2 glow">
                    Start Creating <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="text-base px-8 border-white/20 text-white hover:bg-white/10">
                    View Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From card design to guest verification — manage your entire event invitation workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Ready to Elevate Your Events?</h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">Join thousands of event planners across Tanzania using FN's Digital Cards.</p>
          <Link to="/register">
            <Button size="lg" className="text-base px-8 gap-2 glow">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-display font-bold">FN's Digital Cards</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 FN's Digital Cards. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
