import { Customer, Campaign, TeamMember, SystemMetrics, SystemErrorLog } from './types';

export const initialCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    tags: ['📄 Brochure', '💰 Price Inquiry', '🌴 Monsoon Offer'],
    leadScore: 85,
    firstContact: '2026-06-15',
    lastContact: 'Today, 2:15 PM',
    preferredDates: '15-18 Aug 2026',
    guestCount: 2,
    status: 'Negotiating',
    assignedTo: 'Priya Sharma',
    notes: 'Interested in pool-facing premium room. Budget ~₹8,000/night. Prefers high floor, requested a quiet spot near the spa.',
    conversationHistory: [
      { id: 'm1', sender: 'customer', text: 'Hi', timestamp: '2:10 PM' },
      { id: 'm2', sender: 'bot', text: '🌴 Welcome to MGH Resort!\n\n1️⃣ Brochure\n2️⃣ Videos\n3️⃣ Both\n\nReply with a number.', timestamp: '2:10 PM' },
      { id: 'm3', sender: 'customer', text: '1', timestamp: '2:11 PM' },
      { id: 'm4', sender: 'bot', text: '📄 Here\'s our digital brochure! (File attached below)\n\nWould you also like:\n4️⃣ Talk to our sales team\n5️⃣ Check availability & pricing', timestamp: '2:11 PM', isPdf: true },
      { id: 'm5', sender: 'customer', text: '5', timestamp: '2:12 PM' },
      { id: 'm6', sender: 'bot', text: 'Great! To help you better, may I know your full name?', timestamp: '2:12 PM' },
      { id: 'm7', sender: 'customer', text: 'Rahul Sharma', timestamp: '2:13 PM' },
      { id: 'm8', sender: 'bot', text: 'Thanks Rahul! What dates and how many guests are you looking at?', timestamp: '2:13 PM' },
      { id: 'm9', sender: 'customer', text: '15-18 August, 2 adults', timestamp: '2:14 PM' },
      { id: 'm10', sender: 'bot', text: 'Perfect! Let me check availability. One moment... [Priya Sharma from sales is being connected]', timestamp: '2:14 PM' }
    ]
  },
  {
    id: 'c2',
    name: 'Anita Desai',
    phone: '+91 98765 43211',
    tags: ['🎥 Videos', '📄 Brochure', '💍 Wedding Enquiry'],
    leadScore: 95,
    firstContact: '2026-06-10',
    lastContact: 'Today, 1:12 PM',
    preferredDates: '12-14 Sep 2026',
    guestCount: 85,
    status: 'Booked',
    assignedTo: 'Priya Sharma',
    notes: 'Booked 15 deluxe garden cottages for destination pre-wedding family meet. Advance deposit of ₹50,000 received.',
    conversationHistory: [
      { id: 'ma1', sender: 'customer', text: 'Hello, looking for wedding cottages', timestamp: '11:00 AM' },
      { id: 'ma2', sender: 'bot', text: 'Namaste! 🌴 Welcome to MGH Resort.\n\nPlease select:\n1️⃣ Wedding Packages Brochure\n2️⃣ Tour Videos\n3️⃣ Direct to Wedding planner', timestamp: '11:00 AM' },
      { id: 'ma3', sender: 'customer', text: '3', timestamp: '11:01 AM' },
      { id: 'ma4', sender: 'agent', text: 'Hi Anita, I am Priya from MGH Wedding Desk. How can I help you?', timestamp: '11:03 AM' },
      { id: 'ma5', sender: 'customer', text: 'We need around 15 rooms for Sept 12-14. Do you have a lawn?', timestamp: '11:05 AM' },
      { id: 'ma6', sender: 'agent', text: 'Yes! We have our magnificent Golden Palms Lawn which accommodates up to 250 guests. Sending you video links.', timestamp: '11:06 AM', isVideo: true },
      { id: 'ma7', sender: 'customer', text: 'This looks stunning! Let\'s lock the rooms.', timestamp: '1:10 PM' },
      { id: 'ma8', sender: 'agent', text: 'Wonderful! Booking is secured. Invoice sent to your email.', timestamp: '1:12 PM' }
    ]
  },
  {
    id: 'c3',
    name: 'Vikram Patel',
    phone: '+91 98765 43212',
    tags: ['🎥 Videos', '🏊 Pool Access'],
    leadScore: 60,
    firstContact: '2026-07-01',
    lastContact: 'Today, 11:45 AM',
    preferredDates: 'Weekend 25-27 Jul',
    guestCount: 4,
    status: 'Engaged',
    assignedTo: 'Unassigned',
    notes: 'Vikram watched our videos and specifically asked about the infinity pool rules and whether kids are allowed in the pool.',
    conversationHistory: [
      { id: 'mv1', sender: 'customer', text: 'Is pool open late night?', timestamp: '11:40 AM' },
      { id: 'mv2', sender: 'bot', text: 'Yes, our infinity pool is open from 7:00 AM to 10:00 PM! 🏊\n\nWould you like our weekend packages brochure?\n1️⃣ Yes\n2️⃣ No, talk to human', timestamp: '11:41 AM' },
      { id: 'mv3', sender: 'customer', text: '2', timestamp: '11:45 AM' },
      { id: 'mv4', sender: 'bot', text: 'Connecting you to our team. Please wait...', timestamp: '11:45 AM' }
    ]
  },
  {
    id: 'c4',
    name: 'Sunita Rao',
    phone: '+91 98765 43213',
    tags: ['📄 Brochure'],
    leadScore: 20,
    firstContact: '2026-07-09',
    lastContact: 'Today, 9:30 AM',
    preferredDates: 'Oct 2026',
    guestCount: 2,
    status: 'New Lead',
    assignedTo: 'Unassigned',
    notes: 'Requested brochure and read it. Standard bot flow.',
    conversationHistory: [
      { id: 'ms1', sender: 'customer', text: 'Hey, send brochure', timestamp: '9:28 AM' },
      { id: 'ms2', sender: 'bot', text: '📄 Here is our brochure! Enjoy reading.', timestamp: '9:30 AM', isPdf: true }
    ]
  },
  {
    id: 'c5',
    name: 'Kabir Mehta',
    phone: '+91 91234 56789',
    tags: ['💼 Corporate', '🍽️ Multi-cuisine'],
    leadScore: 78,
    firstContact: '2026-06-20',
    lastContact: 'Yesterday, 5:40 PM',
    preferredDates: '05-08 Sep 2026',
    guestCount: 25,
    status: 'Negotiating',
    assignedTo: 'Rajesh Kumar',
    notes: 'Corporate retreat for software firm. Needs high-speed WiFi, conference hall, and projector. Food preference is purely vegetarian buffet.',
    conversationHistory: [
      { id: 'mk1', sender: 'customer', text: 'Do you offer corporate discounts?', timestamp: '5:30 PM' },
      { id: 'mk2', sender: 'agent', text: 'Hello Kabir, absolutely! For groups above 20 guests, we offer free buffet upgrades and access to our executive board rooms. Let me send a quotation.', timestamp: '5:40 PM' }
    ]
  },
  {
    id: 'c6',
    name: 'Pooja Hegde',
    phone: '+91 99887 76655',
    tags: ['💆 Spa', '🧘 Yoga'],
    leadScore: 40,
    firstContact: '2026-07-05',
    lastContact: 'Yesterday, 3:15 PM',
    preferredDates: '30-31 Aug 2026',
    guestCount: 1,
    status: 'Engaged',
    assignedTo: 'Anita Verma',
    notes: 'Single traveler looking for therapeutic spa retreat packages. Looking for our wellness package detail.',
    conversationHistory: [
      { id: 'mp1', sender: 'customer', text: 'Hi, I need relaxation packages', timestamp: '3:10 PM' },
      { id: 'mp2', sender: 'agent', text: 'Namaste Pooja, we have our signature 2-Day Rejuvenation Spa Package including full body Ayurvedic massage, organic food, and sunrise yoga sessions. Sending brochure!', timestamp: '3:15 PM', isPdf: true }
    ]
  },
  {
    id: 'c7',
    name: 'Rajesh Kulkarni',
    phone: '+91 88776 65544',
    tags: ['👶 Family-friendly'],
    leadScore: 15,
    firstContact: '2026-07-02',
    lastContact: '2 days ago',
    preferredDates: 'TBD',
    guestCount: 4,
    status: 'Lost',
    assignedTo: 'Rajesh Kumar',
    notes: 'Budget constraints. Wanted a room for 4 adults under ₹3000/night. Politely informed him of our rates (~₹6000 base).',
    conversationHistory: [
      { id: 'mr1', sender: 'customer', text: 'Rooms under 3000 available next week?', timestamp: '2:15 PM' },
      { id: 'mr2', sender: 'agent', text: 'Hello Rajesh, our tariff starts at ₹6,000 for standard deluxe rooms. We do offer discount codes on multi-night stays but ₹3,000 is unfortunately below our minimum room rate.', timestamp: '2:25 PM' }
    ]
  },
  {
    id: 'c8',
    name: 'Siddharth Roy',
    phone: '+91 77665 54433',
    tags: ['🥩 BBQ Dinner', '🌌 Honeymoon'],
    leadScore: 90,
    firstContact: '2026-06-18',
    lastContact: 'Today, 10:05 AM',
    preferredDates: '01-05 Sep 2026',
    guestCount: 2,
    status: 'Hot Lead',
    assignedTo: 'Anita Verma',
    notes: 'Honeymoon couple. Demanding rose petal decoration, candle-light dinner setup, and lake-view pool cottage.',
    conversationHistory: [
      { id: 'my1', sender: 'customer', text: 'Can we arrange a private candle-light dinner on the lake side?', timestamp: '9:55 AM' },
      { id: 'my2', sender: 'agent', text: 'Hi Siddharth, congratulations on your wedding! Yes, we have a private floating gazebo deck specifically for lakeside couple dinners. We can set up BBQ, personal butler, and custom violin music.', timestamp: '10:05 AM' }
    ]
  }
];

export const initialCampaigns: Campaign[] = [
  {
    id: 'cp1',
    name: 'Monsoon 30% Off',
    sentTo: 87,
    opens: 72,
    clicks: 41,
    bookings: 8,
    revenue: 96000,
    status: 'Sent',
    segmentTags: ['📄 Brochure'],
    segmentStatus: 'Engaged',
    messageText: '🏖️ Escape to MGH Resort!\n\nHi {{name}},\n\nMonsoon season is here — enjoy 30% off on all luxury pool-facing rooms! 🌧️\nUse code MONSOON30 when booking.\n\nDates: 1 July - 31 August\n\n[Book Now]  [Talk to Us]'
  },
  {
    id: 'cp2',
    name: 'Summer Getaway',
    sentTo: 54,
    opens: 48,
    clicks: 28,
    bookings: 11,
    revenue: 142000,
    status: 'Sent',
    segmentTags: ['🎥 Videos', '🏊 Pool Access'],
    segmentStatus: 'All',
    messageText: '☀️ High Summer Special at MGH!\n\nDear {{name}},\n\nCool off in our pristine infinity pool. Book 2 nights and get your 3rd night FREE! 🏊\nIncludes buffet breakfast and dinner.\n\n[Grab Coupon]  [Check Cottages]'
  },
  {
    id: 'cp3',
    name: 'Diwali Special Preview',
    sentTo: 32,
    opens: 30,
    clicks: 19,
    bookings: 6,
    revenue: 78000,
    status: 'Sent',
    segmentTags: ['💍 Wedding Enquiry'],
    segmentStatus: 'Hot Lead',
    messageText: '🪔 Sparkling Diwali Deals!\n\nDear {{name}},\n\nBe the first to secure our cottage clusters for family festive reunions at special pre-booking rates.\n\n[Enquire Price]'
  },
  {
    id: 'cp4',
    name: 'Christmas Package Cluster',
    sentTo: 43,
    opens: 0,
    clicks: 0,
    bookings: 0,
    revenue: 0,
    status: 'Scheduled',
    scheduleDate: '2026-12-01',
    segmentTags: ['📄 Brochure'],
    segmentStatus: 'All',
    messageText: '❄️ Magical Winter Holidays at MGH!\n\nHello {{name}},\n\nCelebrate the Christmas cheer with snow-themed gala dinners, campfire acoustic nights, and special presents for the kids!\n\n[Reserve Early]'
  }
];

export const initialTeam: TeamMember[] = [
  {
    id: 't1',
    name: 'Priya Sharma',
    leads: 34,
    bookings: 12,
    conversionRate: 35.3,
    revenue: 142000,
    avgReplyTime: '1.2 min',
    rating: 4.8,
    rank: 1
  },
  {
    id: 't2',
    name: 'Rajesh Kumar',
    leads: 28,
    bookings: 9,
    conversionRate: 32.1,
    revenue: 98000,
    avgReplyTime: '2.1 min',
    rating: 4.6,
    rank: 2
  },
  {
    id: 't3',
    name: 'Anita Verma',
    leads: 41,
    bookings: 11,
    conversionRate: 26.8,
    revenue: 105000,
    avgReplyTime: '3.4 min',
    rating: 4.3,
    rank: 3
  },
  {
    id: 't4',
    name: 'Unassigned Queue',
    leads: 21,
    bookings: 0,
    conversionRate: 0,
    revenue: 0,
    avgReplyTime: 'N/A',
    rating: 0,
    rank: 4
  }
];

export const initialErrors: SystemErrorLog[] = [
  {
    id: 'e1',
    time: 'Today, 2:23 PM',
    type: 'API Error',
    detail: 'WhatsApp client disconnected briefly — auto-reconnected via Shizuku ADB bridge in 12s'
  },
  {
    id: 'e2',
    time: 'Today, 11:15 AM',
    type: 'Media Upload',
    detail: 'video-resort-tour.mp4 failed checksum validation — auto-retrying upload with chunking'
  },
  {
    id: 'e3',
    time: 'Yesterday, 8:40 PM',
    type: 'Phone Alert',
    detail: 'Android phone battery dropped to 5% (charging cable unplugged check) — automated power alert sent to group'
  },
  {
    id: 'e4',
    time: 'Yesterday, 4:10 PM',
    type: 'Connection',
    detail: 'Tailscale secure overlay tunnel re-routed through backup relay nodes'
  }
];

export const initialMetrics: SystemMetrics = {
  botUptime: '99.8%',
  cpuUsage: 34,
  ramUsage: 42,
  phoneBattery: 89,
  phoneCharging: true,
  tailscaleStatus: 'Connected',
  whatsappStatus: 'Running',
  apiErrors24h: 2
};
