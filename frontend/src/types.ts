export type CustomerStatus = 'New Lead' | 'Engaged' | 'Negotiating' | 'Hot Lead' | 'Booked' | 'Lost';

export interface Message {
  id: string;
  sender: 'customer' | 'bot' | 'agent';
  text: string;
  timestamp: string;
  isPdf?: boolean;
  isVideo?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  leadScore: number;
  conversationHistory: Message[];
  firstContact: string;
  lastContact: string;
  preferredDates?: string;
  guestCount?: number;
  status: CustomerStatus;
  assignedTo: string; // 'Priya' | 'Rajesh' | 'Anita' | 'Unassigned'
  notes: string;
}

export interface Campaign {
  id: string;
  name: string;
  sentTo: number;
  opens: number;
  clicks: number;
  bookings: number;
  revenue: number;
  scheduleDate?: string;
  status: 'Draft' | 'Sent' | 'Scheduled';
  segmentTags: string[];
  segmentStatus: string;
  messageText: string;
}

export interface TeamMember {
  id: string;
  name: string;
  leads: number;
  bookings: number;
  conversionRate: number;
  revenue: number;
  avgReplyTime: string;
  rating: number;
  rank: number;
}

export interface SystemMetrics {
  botUptime: string;
  cpuUsage: number;
  ramUsage: number;
  phoneBattery: number;
  phoneCharging: boolean;
  tailscaleStatus: 'Connected' | 'Disconnected' | 'Warning';
  whatsappStatus: 'Running' | 'Stopped' | 'Error';
  apiErrors24h: number;
}

export interface SystemErrorLog {
  id: string;
  time: string;
  type: 'API Error' | 'Media Upload' | 'Phone Alert' | 'Connection';
  detail: string;
}

export interface FunnelData {
  stage: string;
  value: number;
  percentage: number;
}
