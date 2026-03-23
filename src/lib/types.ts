export interface Event {
  id: string;
  title: string;
  host: string;
  venue: string;
  date: string;
  time: string;
  description: string;
  imageUrl?: string;
  templateId?: string;
  totalInvited: number;
  confirmed: number;
  pending: number;
  declined: number;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  group: string;
  email?: string;
}

export interface Invitation {
  id: string;
  eventId: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  attendeeCount: number;
  qrCode: string;
  sentVia: 'whatsapp' | 'sms' | 'both';
  sentAt?: string;
  respondedAt?: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  category: 'wedding' | 'birthday' | 'corporate' | 'baby-shower' | 'graduation' | 'other';
  thumbnail: string;
  colors: string[];
  font: string;
}

export type UserRole = 'admin' | 'event_manager';
