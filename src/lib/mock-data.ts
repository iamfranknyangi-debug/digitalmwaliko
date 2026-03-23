import { Event, Contact, Invitation, CardTemplate } from './types';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Harusi ya Juma & Amina',
    host: 'Familia ya Juma',
    venue: 'Julius Nyerere International Convention Centre, Dar es Salaam',
    date: '2026-05-15',
    time: '14:00',
    description: 'Tunakualika kwa furaha kubwa kwenye sherehe ya harusi yetu.',
    totalInvited: 350,
    confirmed: 220,
    pending: 95,
    declined: 35,
    createdAt: '2026-03-01',
  },
  {
    id: '2',
    title: 'Corporate Gala Night',
    host: 'Vodacom Tanzania',
    venue: 'Hyatt Regency, Dar es Salaam',
    date: '2026-04-20',
    time: '18:00',
    description: 'Annual corporate celebration and awards night.',
    totalInvited: 200,
    confirmed: 150,
    pending: 30,
    declined: 20,
    createdAt: '2026-02-15',
  },
  {
    id: '3',
    title: "Neema's Birthday Bash",
    host: 'Neema Family',
    venue: 'Serena Hotel, Arusha',
    date: '2026-06-10',
    time: '16:00',
    description: 'Come celebrate with us!',
    totalInvited: 80,
    confirmed: 45,
    pending: 25,
    declined: 10,
    createdAt: '2026-03-10',
  },
];

export const mockContacts: Contact[] = [
  { id: '1', name: 'Juma Hamisi', phone: '+255712345678', group: 'Family' },
  { id: '2', name: 'Fatma Ali', phone: '+255754321098', group: 'Family' },
  { id: '3', name: 'Hassan Mwalimu', phone: '+255689012345', group: 'Friends' },
  { id: '4', name: 'Grace Mkunde', phone: '+255767890123', group: 'VIP' },
  { id: '5', name: 'Peter Moshi', phone: '+255623456789', group: 'Work' },
  { id: '6', name: 'Saida Bakari', phone: '+255711223344', group: 'Friends' },
  { id: '7', name: 'Omari Rashid', phone: '+255755667788', group: 'Family' },
  { id: '8', name: 'Diana Mbeki', phone: '+255699887766', group: 'VIP' },
];

export const mockInvitations: Invitation[] = [
  { id: '1', eventId: '1', contactId: '1', contactName: 'Juma Hamisi', contactPhone: '+255712345678', status: 'delivered', rsvpStatus: 'confirmed', attendeeCount: 3, qrCode: 'INV-001', sentVia: 'whatsapp', sentAt: '2026-03-05' },
  { id: '2', eventId: '1', contactId: '2', contactName: 'Fatma Ali', contactPhone: '+255754321098', status: 'delivered', rsvpStatus: 'confirmed', attendeeCount: 2, qrCode: 'INV-002', sentVia: 'sms', sentAt: '2026-03-05' },
  { id: '3', eventId: '1', contactId: '3', contactName: 'Hassan Mwalimu', contactPhone: '+255689012345', status: 'sent', rsvpStatus: 'pending', attendeeCount: 0, qrCode: 'INV-003', sentVia: 'whatsapp', sentAt: '2026-03-06' },
  { id: '4', eventId: '1', contactId: '4', contactName: 'Grace Mkunde', contactPhone: '+255767890123', status: 'delivered', rsvpStatus: 'declined', attendeeCount: 0, qrCode: 'INV-004', sentVia: 'both', sentAt: '2026-03-05' },
];

export const mockTemplates: CardTemplate[] = [
  { id: '1', name: 'Royal Gold Wedding', category: 'wedding', thumbnail: '', colors: ['#D4A574', '#1a1a2e', '#f5f0e8'], font: 'Playfair Display' },
  { id: '2', name: 'Tropical Paradise', category: 'wedding', thumbnail: '', colors: ['#2d6a4f', '#d4a574', '#f5f0e8'], font: 'Playfair Display' },
  { id: '3', name: 'Confetti Celebration', category: 'birthday', thumbnail: '', colors: ['#e07c24', '#3498db', '#f39c12'], font: 'Inter' },
  { id: '4', name: 'Elegant Corporate', category: 'corporate', thumbnail: '', colors: ['#1a1a2e', '#3498db', '#ecf0f1'], font: 'Inter' },
  { id: '5', name: 'Pastel Dreams', category: 'baby-shower', thumbnail: '', colors: ['#f8b4c8', '#b8d4e3', '#f5f0e8'], font: 'Playfair Display' },
  { id: '6', name: 'Graduation Cap', category: 'graduation', thumbnail: '', colors: ['#1a1a2e', '#d4a574', '#ffffff'], font: 'Playfair Display' },
];

export const chartData = {
  invitationsOverTime: [
    { month: 'Jan', sent: 45 },
    { month: 'Feb', sent: 120 },
    { month: 'Mar', sent: 280 },
    { month: 'Apr', sent: 180 },
    { month: 'May', sent: 350 },
    { month: 'Jun', sent: 420 },
  ],
  rsvpRate: [
    { name: 'Confirmed', value: 415, fill: 'hsl(145, 65%, 42%)' },
    { name: 'Pending', value: 150, fill: 'hsl(38, 92%, 50%)' },
    { name: 'Declined', value: 65, fill: 'hsl(0, 72%, 51%)' },
  ],
};
