import React from 'react';
import {
  TrendingUp,
  Users,
  Coins,
  Percent,
  MessageCircle,
  Activity,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Customer } from '../types';

interface ExecutiveDashboardProps {
  customers: Customer[];
  setActiveTab: (tab: string) => void;
  setSelectedCustomerId: (id: string) => void;
}

export default function ExecutiveDashboard({
  customers,
  setActiveTab,
  setSelectedCustomerId
}: ExecutiveDashboardProps) {
  // KPI Data
  const kpis = [
    {
      title: 'New Leads Today',
      value: '47',
      change: '+14%',
      trend: 'up',
      icon: Users,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
    },
    {
      title: 'Bookings This Month',
      value: '23',
      change: '+4 new',
      trend: 'up',
      icon: Sparkles,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Revenue This Month',
      value: '₹2,15,000',
      change: '+₹42k/wk',
      trend: 'up',
      icon: Coins,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Conversion Rate',
      value: '18.7%',
      change: '+2.3%',
      trend: 'up',
      icon: Percent,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Active Conversations',
      value: '12',
      change: 'Live now',
      trend: 'stable',
      icon: MessageCircle,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Team Online',
      value: '3 / 4',
      change: 'Priya, Rajesh, Anita',
      trend: 'stable',
      icon: Activity,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
    }
  ];

  // Horizontal Funnel Data
  const funnelStages = [
    { label: 'Conversations Started', value: 247, percentage: 100, color: 'from-slate-800 to-slate-700 border-slate-700 text-slate-300' },
    { label: 'Menu Opened', value: 238, percentage: 96, color: 'from-teal-950/40 to-teal-900/40 border-teal-800/30 text-teal-300' },
    { label: 'Brochure Viewed', value: 112, percentage: 45, color: 'from-teal-900/60 to-teal-800/60 border-teal-700/50 text-teal-200' },
    { label: 'Videos Watched', value: 89, percentage: 36, color: 'from-cyan-900/60 to-cyan-800/60 border-cyan-700/50 text-cyan-200' },
    { label: 'Asked Human Question', value: 67, percentage: 27, color: 'from-indigo-900/60 to-indigo-800/60 border-indigo-700/50 text-indigo-200' },
    { label: 'Booking Intent', value: 34, percentage: 14, color: 'from-amber-950/70 to-amber-900/60 border-amber-800/50 text-amber-300' },
    { label: 'Booked Stay', value: 23, percentage: 9, color: 'from-emerald-950/80 to-emerald-900/70 border-emerald-800/60 text-emerald-300' }
  ];

  // Custom Chart Data: 7-day conversation trend (Line Chart values)
  const lineChartData = [
    { day: 'Mon', count: 18, details: '18 Started' },
    { day: 'Tue', count: 24, details: '24 Started' },
    { day: 'Wed', count: 21, details: '21 Started' },
    { day: 'Thu', count: 32, details: '32 Started' },
    { day: 'Fri', count: 48, details: '48 Started' },
    { day: 'Sat', count: 57, details: '57 Started' },
    { day: 'Sun', count: 47, details: '47 Started' }
  ];

  // Custom Chart Data: Revenue by Week (Bar Chart values)
  const barChartData = [
    { week: 'Wk 1', amount: 38000, color: 'bg-gradient-to-t from-teal-900 to-teal-500' },
    { week: 'Wk 2', amount: 52000, color: 'bg-gradient-to-t from-teal-900 to-teal-500' },
    { week: 'Wk 3', amount: 49000, color: 'bg-gradient-to-t from-teal-900 to-teal-400' },
    { week: 'Wk 4', amount: 76000, color: 'bg-gradient-to-t from-teal-900 to-amber-500' }
  ];

  // Feed Activity (realistic recent events based on mock database)
  const recentActivity = [
    {
      id: 'a1',
      title: 'Rahul Sharma booked stay',
      detail: '₹12,000 — Deluxe Cottage',
      time: '5 min ago',
      type: 'booking',
      customerId: 'c1'
    },
    {
      id: 'a2',
      title: 'New lead incoming',
      detail: '+91 98765 43213 (Sunita Rao)',
      time: '12 min ago',
      type: 'lead',
      customerId: 'c4'
    },
    {
      id: 'a3',
      title: 'Brochure successfully requested',
      detail: 'Priya requested wedding package details',
      time: '18 min ago',
      type: 'brochure',
      customerId: 'c2'
    },
    {
      id: 'a4',
      title: 'Videos watched, asking pool',
      detail: 'Vikram Patel — inquiring infinity pool rules',
      time: '25 min ago',
      type: 'engagement',
      customerId: 'c3'
    },
    {
      id: 'a5',
      title: 'Booking Confirmed (Priya)',
      detail: 'Anita Desai paid deposit — ₹50,000',
      time: '42 min ago',
      type: 'booking',
      customerId: 'c2'
    }
  ];

  const handleActivityClick = (act: typeof recentActivity[0]) => {
    setSelectedCustomerId(act.customerId);
    setActiveTab('simulator');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            Executive Overview <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full font-mono font-medium tracking-normal">Real-time DB Sync</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking WhatsApp Shizuku gateway performance, guest funnel conversions, and team sales pipelines.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
          <Clock size={14} className="text-teal-400" />
          <span>Local Time: 10 July 2026, 09:22 PM</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 rounded-2xl p-4.5 border border-slate-800 hover:border-slate-700 hover:scale-[1.01] transition-all duration-200 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 font-medium truncate">{kpi.title}</span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${kpi.color}`}>
                  <Icon size={16} />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-display font-bold text-slate-100 tracking-tight leading-none">
                  {kpi.value}
                </h3>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">{kpi.change}</span>
                  {kpi.trend === 'up' && (
                    <ArrowUpRight size={10} className="text-emerald-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horizontal Funnel Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-semibold text-slate-100 text-sm">Guest Conversion Funnel</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Auto-updated via bot flow tags</p>
            </div>
            <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-bold">
              30-Day Aggregates
            </span>
          </div>

          <div className="space-y-3">
            {funnelStages.map((stage, idx) => {
              // Calculate custom scale offset for horizontal flow
              const scaleWidth = `${stage.percentage}%`;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-1">
                    <span>{stage.label}</span>
                    <div className="space-x-2 font-mono">
                      <span className="text-slate-200 font-bold">{stage.value}</span>
                      <span className="text-slate-500 text-[10px]">({stage.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-6.5 w-full bg-slate-950/60 rounded-xl overflow-hidden border border-slate-800 relative">
                    <div
                      className={`h-full bg-gradient-to-r ${stage.color} rounded-r-md border-r-2 border-teal-400/20 transition-all duration-1000 ease-out`}
                      style={{ width: scaleWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Sidebar Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-semibold text-slate-100 text-sm">Recent Activity Feed</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Live CRM events</p>
            </div>
            <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-ping" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {recentActivity.map((act) => (
              <div
                key={act.id}
                onClick={() => handleActivityClick(act)}
                className="group flex gap-3 text-left p-2.5 rounded-xl border border-slate-800/40 bg-slate-950/40 hover:bg-slate-950/80 hover:border-slate-700 transition-all cursor-pointer"
              >
                <div className="mt-0.5">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    act.type === 'booking' ? 'bg-emerald-500' :
                    act.type === 'lead' ? 'bg-teal-500' :
                    act.type === 'brochure' ? 'bg-cyan-500' : 'bg-amber-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-teal-400 transition-colors truncate">
                      {act.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{act.detail}</p>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-300 self-center transition-transform group-hover:translate-x-0.5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row (Trend Analysis) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Custom Line Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-slate-100 text-sm">7-Day Conversation Trend</h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Incoming chats on Shizuku gateway</p>
          </div>

          <div className="h-44 relative w-full flex items-end">
            {/* SVG Line Drawing */}
            <svg className="w-full h-full absolute inset-0 pt-4" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="#27272a" strokeWidth="0.1" strokeDasharray="1,2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeWidth="0.1" strokeDasharray="1,2" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#27272a" strokeWidth="0.1" strokeDasharray="1,2" />

              {/* Area Under Line */}
              <path
                d="M 5,82 L 5,68 Q 20,58 20,58 T 35,62 T 50,44 T 65,18 T 80,4 T 95,20 L 95,100 L 5,100 Z"
                fill="url(#lineGrad)"
                preserveAspectRatio="none"
              />

              {/* The actual line */}
              <path
                d="M 5,82 L 5,68 Q 20,58 20,58 T 35,62 T 50,44 T 65,18 T 80,4 T 95,20"
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                preserveAspectRatio="none"
              />
            </svg>

            {/* Labels overlay */}
            <div className="absolute inset-0 flex justify-between px-1.5 pointer-events-none text-[10px] font-mono text-slate-500 h-full">
              <div className="absolute right-2 top-0 bg-slate-950 border border-slate-800 text-teal-400 font-bold px-1.5 py-0.5 rounded text-[9px] animate-pulse">
                PEAK WEEKEND (57)
              </div>
            </div>

            {/* Horizontal day labels */}
            <div className="w-full flex justify-between px-2 pt-2 border-t border-slate-800 relative z-10">
              {lineChartData.map((item, idx) => (
                <div key={idx} className="text-center group relative cursor-pointer">
                  <div className="text-[10px] font-mono text-slate-400 font-semibold">{item.day}</div>
                  <div className="text-[9px] font-mono text-slate-600 mt-0.5">{item.count}</div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-950 border border-slate-800 text-slate-100 px-1.5 py-0.5 rounded text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Bar Chart (Revenue) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-slate-100 text-sm">Revenue by Week</h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Secured cottage bookings</p>
          </div>

          <div className="h-44 flex items-end justify-around gap-6 relative px-4">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
              <div className="border-b border-slate-800 w-full" />
              <div className="border-b border-slate-800 w-full" />
              <div className="border-b border-slate-800 w-full" />
              <div className="border-b border-slate-800 w-full" />
            </div>

            {barChartData.map((data, idx) => {
              // Scale height relative to maximum ₹76,000
              const heightPercent = `${(data.amount / 80000) * 100}%`;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative z-10 group">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 bg-slate-950 border border-slate-800 text-teal-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{data.amount.toLocaleString('en-IN')}
                  </div>

                  <div
                    className={`w-full max-w-[42px] ${data.color} rounded-t-md hover:brightness-125 transition-all duration-500 shadow-[0_0_15px_rgba(13,148,136,0.1)]`}
                    style={{ height: heightPercent }}
                  />
                  <span className="text-[10px] font-mono text-slate-400 font-semibold mt-2.5">
                    {data.week}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
