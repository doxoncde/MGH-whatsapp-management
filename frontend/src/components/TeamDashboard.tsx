import React, { useState } from 'react';
import {
  Crown,
  TrendingUp,
  Star,
  Users,
  Coins,
  Clock,
  ChevronRight,
  ShieldAlert,
  CalendarCheck,
  Percent,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { TeamMember, Customer } from '../types';

interface TeamDashboardProps {
  team: TeamMember[];
  customers: Customer[];
}

export default function TeamDashboard({ team, customers }: TeamDashboardProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('t1');
  const selectedMember = team.find((t) => t.id === selectedMemberId) || team[0];

  // Specific employee metrics and activity feed simulations
  const employeeDetails: Record<
    string,
    {
      bookingsWeekly: number[];
      replyTrend: number[]; // response minutes descending
      pipeline: { stage: string; value: number }[];
      activities: { time: string; action: string }[];
    }
  > = {
    t1: {
      bookingsWeekly: [1, 3, 4, 4],
      replyTrend: [2.5, 2.0, 1.5, 1.2],
      pipeline: [
        { stage: 'Assigned Leads', value: 34 },
        { stage: 'Responded', value: 18 },
        { stage: 'Booking Intent', value: 15 },
        { stage: 'Booked Stay', value: 12 }
      ],
      activities: [
        { time: '10 min ago', action: 'Approved booking request for Rahul Sharma — Cottage 104' },
        { time: '1 hr ago', action: 'Shared luxury cottage video tour with Vikram' },
        { time: '2 hrs ago', action: 'Confirmed deposit check of ₹50,000 from Anita Desai' },
        { time: 'Yesterday', action: 'Re-engaged lead Kabir Mehta with customized lunch rate' }
      ]
    },
    t2: {
      bookingsWeekly: [2, 2, 3, 2],
      replyTrend: [3.1, 2.8, 2.4, 2.1],
      pipeline: [
        { stage: 'Assigned Leads', value: 28 },
        { stage: 'Responded', value: 14 },
        { stage: 'Booking Intent', value: 11 },
        { stage: 'Booked Stay', value: 9 }
      ],
      activities: [
        { time: '30 min ago', action: 'Marked lead Rajesh Kulkarni as Lost (low budget limit)' },
        { time: '2 hrs ago', action: 'Connected with Kabir Mehta regarding conference halls' },
        { time: 'Yesterday', action: 'Emailed corporate buffet menu catalog' }
      ]
    },
    t3: {
      bookingsWeekly: [1, 2, 4, 4],
      replyTrend: [4.5, 4.0, 3.8, 3.4],
      pipeline: [
        { stage: 'Assigned Leads', value: 41 },
        { stage: 'Responded', value: 22 },
        { stage: 'Booking Intent', value: 14 },
        { stage: 'Booked Stay', value: 11 }
      ],
      activities: [
        { time: '15 min ago', action: 'Assigned wellness spa package catalog to Pooja' },
        { time: '3 hrs ago', action: 'Rescheduled site inspection visit for Siddharth Roy' },
        { time: 'Yesterday', action: 'Dispatched honeymoon suite candlelight dinner rates' }
      ]
    }
  };

  const details = employeeDetails[selectedMember.id] || employeeDetails['t1'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            Team Performance Tracker <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono font-bold">SALES LEADERBOARD</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking guest assignees, lead conversion ratios, response speeds, and converted booking volume.
          </p>
        </div>
      </div>

      {/* Leaderboard Grid Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {team.map((member, idx) => {
          const isGold = idx === 0;
          const isSilver = idx === 1;
          const isBronze = idx === 2;
          const isQueue = member.id === 't4';

          const bgDecoration = isGold
            ? 'bg-gradient-to-b from-slate-950 to-slate-950 border-amber-500/40 shadow-[0_4px_25px_-5px_rgba(202,138,4,0.15)]'
            : isSilver
            ? 'bg-slate-950 border-slate-700'
            : isBronze
            ? 'bg-slate-950 border-orange-800/40'
            : 'bg-slate-950 border-slate-900';

          return (
            <div
              key={member.id}
              onClick={() => {
                if (!isQueue) setSelectedMemberId(member.id);
              }}
              className={`border rounded-xl p-5 relative select-none flex flex-col justify-between transition-all duration-200 ${bgDecoration} ${
                !isQueue ? 'cursor-pointer hover:border-slate-600' : 'cursor-default'
              } ${selectedMemberId === member.id && !isQueue ? 'ring-2 ring-teal-400/50 scale-[1.01]' : ''}`}
            >
              {/* Leaderboard Rank Badges */}
              <div className="absolute top-4 right-4 flex items-center justify-center">
                {isGold && <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={20} />}
                {isSilver && <Crown className="text-slate-400" size={18} />}
                {isBronze && <Crown className="text-orange-500" size={16} />}
                {isQueue && <ShieldAlert className="text-amber-500 animate-pulse" size={18} />}
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">
                  {isQueue ? 'System Queue' : `Rank 0${member.rank}`}
                </span>
                <h3 className="font-display font-semibold text-slate-200 mt-1 text-sm flex items-center gap-1.5">
                  {member.name}
                </h3>

                {isQueue ? (
                  <div className="mt-3.5 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg text-left">
                    <span className="text-[10px] font-mono text-amber-400 font-semibold block animate-pulse">
                      ⚠️ {member.leads} LEADS WAITING
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                      Requires manual assign in CRM to clear the unassigned pool.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-y-2.5 gap-x-1.5 border-t border-slate-900/60 pt-3 text-left">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">Leads</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{member.leads}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">Booked</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{member.bookings}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">Conv. %</span>
                      <span className="text-xs font-mono font-bold text-teal-400">{member.conversionRate}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">Avg Reply</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{member.avgReplyTime}</span>
                    </div>
                  </div>
                )}
              </div>

              {!isQueue && (
                <div className="mt-4.5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1 text-amber-500"><Star size={11} className="fill-amber-500" /> {member.rating}</span>
                  <span className="text-teal-400 font-bold font-mono">₹{member.revenue.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Representative Breakdown Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Pipeline & Performance chart */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="mb-5 border-b border-slate-900 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-slate-100 text-sm">
                  {selectedMember.name} — Performance Pipeline
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Step-by-step conversion tracking</p>
              </div>
              <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-bold">
                Assigned Pipeline
              </span>
            </div>

            {/* Horizontal Pipeline Steps Bar */}
            <div className="space-y-4">
              {details.pipeline.map((step, idx) => {
                // Calculate percentage scale relative to total assigned
                const totalAssigned = details.pipeline[0].value;
                const scaleWidth = `${(step.value / totalAssigned) * 100}%`;
                
                return (
                  <div key={idx} className="space-y-1 text-left">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-1">
                      <span>{step.stage}</span>
                      <div className="space-x-2 font-mono">
                        <span className="text-slate-200 font-bold">{step.value}</span>
                        <span className="text-slate-500 text-[10px]">
                          ({Math.round((step.value / totalAssigned) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-6 w-full bg-slate-900/60 rounded-md overflow-hidden border border-slate-900">
                      <div
                        className="h-full bg-gradient-to-r from-teal-950/60 to-teal-500/80 rounded-r-md border-r border-teal-400/40 transition-all duration-1000 ease-out"
                        style={{ width: scaleWidth }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini Weekly bookings chart */}
          <div className="mt-6 border-t border-slate-900 pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* SVG Weekly Bookings Trend */}
            <div className="bg-slate-900/20 border border-slate-900 rounded-lg p-3.5 text-left">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Bookings per Week (Trend)</span>
              <div className="h-20 flex items-end justify-around gap-2 px-2 relative">
                {details.bookingsWeekly.map((bVal, bIdx) => {
                  const hPerc = `${(bVal / 6) * 100}%`;
                  return (
                    <div key={bIdx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      <span className="text-[9px] font-mono text-teal-400 font-bold opacity-0 group-hover:opacity-100 mb-1 transition-opacity">
                        {bVal}
                      </span>
                      <div className="w-full max-w-[20px] bg-teal-500 rounded-t-sm" style={{ height: hPerc }} />
                      <span className="text-[9px] font-mono text-slate-500 mt-1.5">Wk{bIdx+1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SVG Speed of Reply minutes Trend */}
            <div className="bg-slate-900/20 border border-slate-900 rounded-lg p-3.5 text-left">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Avg Response Time (minutes)</span>
              <div className="h-20 flex items-end justify-around gap-2 px-2">
                {details.replyTrend.map((rVal, rIdx) => {
                  const hPerc = `${(rVal / 6) * 100}%`;
                  return (
                    <div key={rIdx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      <span className="text-[9px] font-mono text-amber-400 font-bold opacity-0 group-hover:opacity-100 mb-1 transition-opacity">
                        {rVal}m
                      </span>
                      <div className="w-full max-w-[20px] bg-amber-500/75 rounded-t-sm" style={{ height: hPerc }} />
                      <span className="text-[9px] font-mono text-slate-500 mt-1.5">Wk{rIdx+1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mini activity and feedback card */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-900 pb-3">
              <h3 className="font-display font-semibold text-slate-100 text-sm">Recent Agent Activities</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Live CRM modifications</p>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {details.activities.map((act, actIdx) => (
                <div key={actIdx} className="p-2.5 rounded bg-slate-900/40 border border-slate-900/80 text-left text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1"><Activity size={10} className="text-teal-400" /> ACTIVE REP</span>
                    <span>{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                    {act.action}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-900 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[9px] font-mono text-slate-500 uppercase block leading-none">Rating Score</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-sm font-mono font-bold text-slate-200">{selectedMember.rating}</span>
                <div className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      size={11}
                      className={starIdx < Math.floor(selectedMember.rating) ? 'fill-amber-500' : 'text-slate-700'}
                    />
                  ))}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-bold uppercase">
              100% Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
