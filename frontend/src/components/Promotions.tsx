import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Sparkles,
  Layers,
  Send,
  Calendar,
  Eye,
  Percent,
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Campaign, Customer, Message } from '../types';

interface PromotionsProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export default function Promotions({
  campaigns,
  setCampaigns,
  customers,
  setCustomers
}: PromotionsProps) {
  // Segment builder states
  const [targetTag, setTargetTag] = useState<string>('📄 Brochure');
  const [targetStatus, setTargetStatus] = useState<string>('Engaged');
  
  // Composer states
  const [campaignTitle, setCampaignTitle] = useState('Monsoon Weekend Escape');
  const [composerText, setComposerText] = useState(
    `🏖️ Escape to MGH Resort!\n\nHi {{name}},\n\nMonsoon season is here — enjoy 30% off on all pool-facing rooms! 🌧️\nUse code MONSOON30 when booking.\n\nDates: 1 July - 31 August\n\n[Book Now]  [Talk to Us]`
  );
  
  const [isDispatched, setIsDispatched] = useState(false);

  // Calculate dynamic segment matches
  const matchingCustomers = customers.filter((c) => {
    const tagMatches = targetTag === 'All' || c.tags.includes(targetTag);
    const statusMatches = targetStatus === 'All' || c.status === targetStatus;
    return tagMatches && statusMatches;
  });

  // Get preview name of first matched customer
  const previewName = matchingCustomers.length > 0 ? matchingCustomers[0].name : 'Valued Guest';

  // Replace {{name}} with actual preview name in real-time
  const renderedMessagePreview = composerText.replace(/{{name}}/g, previewName);

  // Dispatch campaign action
  const handleDispatchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchingCustomers.length === 0) {
      alert("No matching customers for this segment. Adjust tags/status.");
      return;
    }

    const campaignId = `cp-${Date.now()}`;
    const newCampaign: Campaign = {
      id: campaignId,
      name: campaignTitle,
      sentTo: matchingCustomers.length,
      opens: Math.round(matchingCustomers.length * 0.85), // realistic 85% open rate
      clicks: Math.round(matchingCustomers.length * 0.45), // realistic 45% click rate
      bookings: 0,
      revenue: 0,
      status: 'Sent',
      segmentTags: [targetTag],
      segmentStatus: targetStatus,
      messageText: composerText
    };

    // 1. Add to historical campaigns
    setCampaigns((prev) => [newCampaign, ...prev]);

    // 2. Push this message to matching customers' conversation history
    setCustomers((prev) =>
      prev.map((c) => {
        const isMatched = matchingCustomers.some((mc) => mc.id === c.id);
        if (isMatched) {
          const promoMsg: Message = {
            id: `m-promo-${Date.now()}-${c.id}`,
            sender: 'bot',
            text: composerText.replace(/{{name}}/g, c.name),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return {
            ...c,
            conversationHistory: [...c.conversationHistory, promoMsg],
            lastContact: 'Just now',
            tags: Array.from(new Set([...c.tags, '🎁 Campaign Sent'])),
            leadScore: Math.min(c.leadScore + 5, 100)
          };
        }
        return c;
      })
    );

    setIsDispatched(true);
    setTimeout(() => {
      setIsDispatched(false);
      setCampaignTitle('New Season Special');
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            Promotions & Campaigns <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-medium">Bulk Broadcast Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build precise cohorts using harvested SQL variables and broadcast template messages without API cost overheads.
          </p>
        </div>
      </div>

      {/* Campaign Setup Grid: Left Builder, Right Visual WhatsApp Simulator Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Composer Form */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <form onSubmit={handleDispatchCampaign} className="space-y-5">
            <div className="border-b border-slate-900 pb-4">
              <h3 className="font-display font-semibold text-slate-100 text-sm flex items-center gap-2">
                <Layers size={16} className="text-teal-400" />
                Step 1: Build Cohort Target Segment
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tag filter selector */}
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-mono text-slate-500 uppercase block">Filter by Captured Tag</label>
                <select
                  value={targetTag}
                  onChange={(e) => setTargetTag(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 font-medium"
                >
                  <option value="All">All Leads (No Tag Filter)</option>
                  <option value="📄 Brochure">Brochure Downloaders</option>
                  <option value="🎥 Videos">Video Viewers</option>
                  <option value="💰 Price Inquiry">Pricing Inquirers</option>
                  <option value="💍 Wedding Enquiry">Wedding Planners</option>
                  <option value="💼 Corporate">Corporate Leads</option>
                  <option value="🏊 Pool Access">Pool Lovers</option>
                </select>
              </div>

              {/* Status filter selector */}
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-mono text-slate-500 uppercase block">Filter by Lead Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="New Lead">New Lead</option>
                  <option value="Engaged">Engaged</option>
                  <option value="Negotiating">Negotiating</option>
                  <option value="Hot Lead">Hot Lead</option>
                  <option value="Booked">Booked</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>

            {/* Matching Leads Summary Gauge */}
            <div className="bg-slate-900/60 border border-slate-900 p-3.5 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center font-mono font-bold text-teal-400 text-sm">
                  {matchingCustomers.length}
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-slate-200 block">Matched Customer Segment</span>
                  <span className="text-[10px] text-slate-500 font-mono">SQLite DB scan completed successfully</span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-teal-400/10 text-teal-400 border border-teal-400/20 px-2 py-0.5 rounded font-bold uppercase">
                Active Cohort
              </span>
            </div>

            <div className="border-b border-slate-900 pt-3 pb-4">
              <h3 className="font-display font-semibold text-slate-100 text-sm flex items-center gap-2">
                <Megaphone size={16} className="text-teal-400" />
                Step 2: Message Template Composer
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-mono text-slate-500 uppercase block">Campaign Title (Internal)</label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. Monsoon Promo 30%"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-slate-500 uppercase block">WhatsApp Message Template</label>
                  <span className="text-[10px] text-teal-400 font-mono">Use {"{{name}}"} for custom name injection</span>
                </div>
                <textarea
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="Write message copy here..."
                  className="w-full h-36 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-3 focus:outline-none focus:border-teal-500 font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Submit button */}
            {isDispatched ? (
              <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-lg flex items-center justify-center gap-2 font-semibold">
                <CheckCircle2 size={15} /> Campaign dispatched! {matchingCustomers.length} chats automated via ADB loop.
              </div>
            ) : (
              <button
                type="submit"
                disabled={matchingCustomers.length === 0}
                className={`w-full py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  matchingCustomers.length === 0
                    ? 'bg-slate-900 border border-slate-850 text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-teal-600 hover:bg-teal-500 text-slate-900 shadow-teal-500/10 font-bold'
                }`}
              >
                <Send size={14} /> Dispatch Campaign (Send to {matchingCustomers.length} Guests)
              </button>
            )}
          </form>
        </div>

        {/* Right WhatsApp Live Preview */}
        <div className="lg:col-span-5 bg-slate-900/30 border border-slate-900 rounded-xl p-5 shadow-2xl flex flex-col justify-between h-[580px]">
          <div className="space-y-4">
            <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-slate-100 text-sm">Visual Preview</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Live WhatsApp bubble rendering</p>
              </div>
              <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-semibold">
                Guest POV
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4.5 space-y-4 shadow-inner">
              <span className="text-[10px] font-mono text-slate-500 block">WhatsApp Incoming Message Preview</span>

              {/* Chat bubble mimicking official phone layout */}
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl rounded-tl-none px-4 py-3 text-xs max-w-[90%] shadow-lg">
                  {/* Sender title */}
                  <span className="text-[10px] font-mono font-bold text-teal-400 block mb-1.5 uppercase tracking-wider">
                    🌴 MGH Resort
                  </span>

                  {/* Rendered content */}
                  <div className="whitespace-pre-line leading-relaxed font-sans font-medium text-slate-200 text-xs">
                    {renderedMessagePreview}
                  </div>

                  {/* Buttons simulation if message ends with brackets */}
                  <div className="mt-3.5 space-y-2 border-t border-slate-800/80 pt-3">
                    <button className="w-full bg-slate-950/70 hover:bg-slate-950 border border-slate-850 py-2 rounded-lg text-[11px] font-bold text-teal-400 flex items-center justify-center gap-1 cursor-not-allowed">
                      <Eye size={12} /> Book Now
                    </button>
                    <button className="w-full bg-slate-950/70 hover:bg-slate-950 border border-slate-850 py-2 rounded-lg text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1 cursor-not-allowed">
                      Talk to Us
                    </button>
                  </div>

                  {/* Timestamp metadata */}
                  <span className="text-[8px] font-mono text-slate-500 block text-right mt-2">
                    Today, Just now • Delivered
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-900/80 rounded-lg p-3 text-left">
            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">
              Dynamic Token Matching
            </span>
            <p className="text-[11px] text-slate-400 leading-normal">
              Tokens like <strong className="text-teal-400 font-mono">{"{{name}}"}</strong> are pulled dynamically from the SQLite database. The preview on this panel is using matching row <strong className="text-slate-200 font-mono">"{previewName}"</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Historical Campaigns Table */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-xl">
        <div className="mb-4 border-b border-slate-900 pb-3">
          <h3 className="font-display font-semibold text-slate-100 text-sm">Campaign Broadcast History</h3>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">Tracking performance of previously sent campaigns</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-mono">
                <th className="py-2.5 font-bold">Campaign Name</th>
                <th className="py-2.5 text-center font-bold">Audience (Sent)</th>
                <th className="py-2.5 text-center font-bold">Opens / Reads</th>
                <th className="py-2.5 text-center font-bold">Click-through Rate</th>
                <th className="py-2.5 text-center font-bold">Status</th>
                <th className="py-2.5 text-right font-bold">Converted Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-medium">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/20 transition-colors">
                  <td className="py-3 text-slate-200">
                    <span className="font-semibold block">{c.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">Segment: {c.segmentStatus}</span>
                  </td>
                  <td className="py-3 text-center font-mono text-slate-400">{c.sentTo}</td>
                  <td className="py-3 text-center font-mono text-slate-400">
                    {c.opens} <span className="text-slate-600 text-[10px]">({Math.round((c.opens / (c.sentTo || 1)) * 100)}%)</span>
                  </td>
                  <td className="py-3 text-center font-mono text-teal-400">
                    {c.clicks} <span className="text-slate-500 text-[10px]">({Math.round((c.clicks / (c.sentTo || 1)) * 100)}%)</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-[9px] font-mono uppercase font-bold border px-1.5 py-0.2 rounded-full ${
                      c.status === 'Sent'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-slate-200">
                    {c.revenue > 0 ? `₹${c.revenue.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
