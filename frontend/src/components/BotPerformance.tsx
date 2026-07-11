import React, { useState } from 'react';
import {
  Zap,
  Activity,
  AlertTriangle,
  Play,
  FileText,
  Video,
  ListFilter,
  CheckCircle2,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function BotPerformance() {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Bot KPI stats
  const stats = [
    { label: 'Bot Reply Rate', value: '99.2%', status: 'optimal', desc: 'Gateway auto-triggered replies', color: 'text-teal-400', ringColor: 'stroke-teal-500' },
    { label: 'Menu Engagement', value: '42.0%', status: 'optimal', desc: 'Replies with 1, 2, or 3 menu choices', color: 'text-emerald-400', ringColor: 'stroke-emerald-500' },
    { label: 'Invalid Input Rate', value: '7.3%', status: 'warning', desc: 'Free-text replies triggering warning', color: 'text-amber-400', ringColor: 'stroke-amber-500' },
    { label: 'Media Delivery', value: '98.0%', status: 'optimal', desc: 'Brochure PDF / tour MP4 success', color: 'text-teal-400', ringColor: 'stroke-teal-500' }
  ];

  // Content Breakdown Pie Chart Simulation (Bento-style visual rings + side stats)
  const menuBreakdown = [
    { label: 'Brochure Requests', percentage: 48, count: 120, icon: FileText, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
    { label: 'Video Tour Requests', percentage: 32, count: 80, icon: Video, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Both Requested', percentage: 20, count: 50, icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
  ];

  // Hourly message heatmap mock data (7 days, 24 hours)
  // Let's create an array of days with values representing volume for morning, afternoon, evening, night
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // We'll create blocks of hours grouped into: 1am-6am (darkest), 7am-9am (med), 10am-12pm (bright), 1pm-4pm (bright), 5pm-8pm (brightest), 9pm-12am (med-dark)
  const getHeatmapColor = (hour: number, dayIdx: number) => {
    // Weekends (Fri, Sat, Sun - indices 4,5,6) are brighter
    const weekendMultiplier = dayIdx >= 4 ? 1.4 : 1.0;
    
    if (hour >= 1 && hour <= 6) return 'bg-slate-950'; // Sleeping hours
    if (hour >= 10 && hour <= 12) return 'bg-teal-700/80 shadow-[0_0_8px_rgba(13,148,136,0.2)]'; // 10 AM Peak
    if (hour >= 14 && hour <= 15) return 'bg-teal-600/90 shadow-[0_0_10px_rgba(13,148,136,0.3)]'; // 2 PM Peak
    if (hour >= 18 && hour <= 20) return 'bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.4)]'; // 7 PM Biggest Peak
    
    // Default variations
    const density = (hour * dayIdx) % 5;
    if (density === 0) return 'bg-slate-900/60';
    if (density === 1) return 'bg-teal-950/40';
    if (density === 2) return 'bg-teal-950/70';
    return 'bg-teal-800/40';
  };

  // Variants Performance
  const variants = [
    { id: 'v3', name: 'Welcome Menu v3 (🌴 emoji)', sent: 89, response: '44%', status: 'Best Performance', class: 'border-teal-500/30 bg-teal-950/10 text-teal-400' },
    { id: 'v1', name: 'Welcome Menu v1 (Namaste)', sent: 78, response: '41%', status: 'Strong Engagement', class: 'border-slate-800 bg-slate-900/20 text-slate-300' },
    { id: 'v2', name: 'Welcome Menu v2 (plain)', sent: 72, response: '38%', status: 'Standard Baseline', class: 'border-slate-800 bg-slate-900/10 text-slate-400' },
    { id: 'v4', name: 'Welcome Menu v4 (ocean 🌊)', sent: 8, response: '35%', status: 'A/B Testing Stage', class: 'border-amber-500/20 bg-amber-500/5 text-amber-400' }
  ];

  // Top Customer Questions (Word List)
  const topQuestions = [
    { query: '"Price?"', count: 23, freq: 'High' },
    { query: '"Pool available?"', count: 18, freq: 'High' },
    { query: '"Room types?"', count: 14, freq: 'Medium' },
    { query: '"Check-in time?"', count: 11, freq: 'Medium' },
    { query: '"Wedding packages?"', count: 7, freq: 'Low' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100">
            Bot Performance Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing NLP responses, interactive menus triggers, and Shizuku automated dispatch logs.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-300 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Flow: v3 (Monsoon Holiday)</span>
        </div>
      </div>

      {/* KPI Ring Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.3)] flex items-center gap-5 hover:border-slate-700 transition-colors"
          >
            {/* Visual Ring Gauge */}
            <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-95" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  className="stroke-slate-800"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Active Segment */}
                <path
                  className={`transition-all duration-1000 ${stat.ringColor}`}
                  strokeWidth="3.2"
                  strokeDasharray={`${parseFloat(stat.value)}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-slate-100">{stat.value}</span>
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-slate-400">{stat.label}</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-1 truncate">{stat.desc}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-1.5 h-1.5 rounded-full ${stat.status === 'optimal' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-[10px] font-mono text-slate-400 capitalize">{stat.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown + Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-semibold text-slate-100 text-sm">Hourly Conversation Heatmap</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Heat density of incoming client requests</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-slate-500">Low</span>
              <div className="flex gap-0.5 h-2.5 items-center">
                <div className="w-2.5 h-full bg-slate-950 border border-slate-850 rounded-sm" />
                <div className="w-2.5 h-full bg-teal-950/60 rounded-sm" />
                <div className="w-2.5 h-full bg-teal-800/60 rounded-sm" />
                <div className="w-2.5 h-full bg-teal-600/90 rounded-sm" />
                <div className="w-2.5 h-full bg-teal-400 rounded-sm" />
              </div>
              <span className="text-teal-400 font-bold">Peak</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Hour headers (0 to 23) */}
            <div className="flex pl-10 pr-2">
              <div
                className="flex-1 gap-1 text-[8px] font-mono text-slate-500 text-center font-bold"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <span key={h} className={h % 4 === 0 ? 'opacity-100' : 'opacity-40'}>
                    {h}h
                  </span>
                ))}
              </div>
            </div>

            {/* Matrix rows */}
            {days.map((day, dIdx) => (
              <div key={day} className="flex items-center gap-2">
                <span className="w-8 text-[10px] font-mono font-bold text-slate-400 text-right pr-2">
                  {day}
                </span>
                <div
                  className="flex-1 gap-1"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div
                      key={h}
                      className={`h-5.5 rounded-sm border border-slate-950/40 transition-colors duration-200 group relative ${getHeatmapColor(
                        h,
                        dIdx
                      )}`}
                    >
                      {/* Interactive Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-950 border border-slate-800 text-[9px] font-mono rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-30 transition-opacity">
                        {day} @ {h}:00: {h === 10 || h === 14 || h === 19 ? '🔥 High Traffic' : 'Standard'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center bg-slate-950/30 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Clock size={13} className="text-teal-400" />
            <span>Peak engagement clusters detected around <strong className="text-slate-200">10:00 AM</strong>, <strong className="text-slate-200">2:00 PM</strong>, and <strong className="text-slate-200">7:00 PM</strong>. Optimal for campaign dispatches.</span>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-semibold text-slate-100 text-sm">User Content Preferences</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Distribution of bot replies</p>
              </div>
            </div>

            <div className="space-y-4">
              {menuBreakdown.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 border border-slate-800/60 rounded-xl bg-slate-950/40 flex items-center gap-4 hover:bg-slate-950/80 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0 ${item.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 text-xs font-semibold text-slate-200">
                        <span className="truncate">{item.label}</span>
                        <span className="font-mono text-teal-400">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-teal-400 h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">
                        Count: {item.count} conversations this cycle
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Total Replies Tracked: 250</span>
            <span className="text-teal-400 font-bold">100% Sync</span>
          </div>
        </div>
      </div>

      {/* Variant Table & Questions Word Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message variant table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-display font-semibold text-slate-100 text-sm">Welcome Message variants (A/B Test)</h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Comparing response conversion rate metrics</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 font-bold">Variant Title</th>
                  <th className="py-2.5 text-center font-bold">Sent</th>
                  <th className="py-2.5 text-center font-bold">Reply Rate</th>
                  <th className="py-2.5 text-right font-bold">Status Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {variants.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`hover:bg-slate-950/40 cursor-pointer transition-colors ${
                      selectedVariant === v.id ? 'bg-slate-950/60' : ''
                    }`}
                  >
                    <td className="py-3 font-medium text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      {v.name}
                    </td>
                    <td className="py-3 text-center font-mono text-slate-400">{v.sent}</td>
                    <td className="py-3 text-center font-mono font-semibold text-teal-400">{v.response}</td>
                    <td className="py-3 text-right">
                      <span className={`text-[10px] font-mono font-semibold border px-2 py-0.5 rounded-full ${v.class}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top FAQ list & Warnings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-display font-semibold text-slate-100 text-sm">Top Custom Enquiries</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Most common words in bot bypass requests</p>
            </div>

            <div className="space-y-2.5">
              {topQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2 rounded-xl border border-slate-800 bg-slate-950/30 font-medium"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle size={14} className="text-teal-400" />
                    <span className="font-mono text-slate-200">{q.query}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500">Hits: <strong className="text-slate-300">{q.count}</strong></span>
                    <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${
                      q.freq === 'High' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      {q.freq}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Warning alert box */}
          <div className="mt-4 p-3 border border-rose-500/20 bg-rose-950/10 rounded-xl flex gap-3">
            <AlertTriangle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-rose-400">Media Upload Alarm</h4>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5 truncate">
                "Video resort-tour.mp4 failed to upload — 2 hours ago"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
