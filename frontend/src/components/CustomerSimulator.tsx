import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  User,
  Smartphone,
  CheckCheck,
  Tag,
  Plus,
  Trash2,
  Calendar,
  Users,
  Award,
  BookOpen,
  MessageSquare,
  Sparkles,
  UserCheck,
  Video
} from 'lucide-react';
import { Customer, Message, CustomerStatus } from '../types';

interface CustomerSimulatorProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
}

export default function CustomerSimulator({
  customers,
  setCustomers,
  selectedCustomerId,
  setSelectedCustomerId
}: CustomerSimulatorProps) {
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const [typedMessage, setTypedMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Edit states for customer details
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(currentCustomer.notes);
  const [newTagText, setNewTagText] = useState('');

  // Auto-scroll chat on message update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentCustomer?.conversationHistory]);

  // Sync internal edit notes when customer changes
  useEffect(() => {
    setNotesText(currentCustomer.notes);
  }, [selectedCustomerId, currentCustomer]);

  // Save modified notes to parent state
  const handleSaveNotes = () => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === currentCustomer.id ? { ...c, notes: notesText } : c))
    );
    setIsEditingNotes(false);
  };

  // Add custom tag
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagText.trim()) return;
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === currentCustomer.id) {
          if (c.tags.includes(newTagText.trim())) return c;
          return { ...c, tags: [...c.tags, newTagText.trim()] };
        }
        return c;
      })
    );
    setNewTagText('');
  };

  // Delete tag
  const handleDeleteTag = (tagToDelete: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === currentCustomer.id) {
          return { ...c, tags: c.tags.filter((t) => t !== tagToDelete) };
        }
        return c;
      })
    );
  };

  // Quick Action: Mark as Booked
  const handleMarkAsBooked = () => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === currentCustomer.id) {
          return {
            ...c,
            status: 'Booked' as CustomerStatus,
            leadScore: 100,
            tags: Array.from(new Set([...c.tags, '💰 Paid Deposit']))
          };
        }
        return c;
      })
    );
  };

  // Quick Action: Send Custom Promotional Offer
  const handleSendOffer = () => {
    const offerMessage: Message = {
      id: `m-offer-${Date.now()}`,
      sender: 'agent',
      text: `🎁 [Exclusive Offer for ${currentCustomer.name}] We are delighted to extend a customized discount: Book premium lake cottages with code SPECIAL15 for 15% off and free breakfast! Offer valid for next 48 hours. 🌴`,
      timestamp: 'Just now'
    };

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === currentCustomer.id) {
          return {
            ...c,
            conversationHistory: [...c.conversationHistory, offerMessage],
            lastContact: 'Just now',
            status: 'Hot Lead' as CustomerStatus,
            leadScore: Math.min(c.leadScore + 10, 100)
          };
        }
        return c;
      })
    );
  };

  // Simulated messaging loop for client testing
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const userMsgText = typedMessage.trim();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Create customer message
    const userMessage: Message = {
      id: `m-${Date.now()}`,
      sender: 'customer',
      text: userMsgText,
      timestamp: nowStr
    };

    // Prepare updated customer state
    let updatedHistory = [...currentCustomer.conversationHistory, userMessage];
    let botReplyText = '';
    let isPdf = false;
    let isVideo = false;
    let updatedTags = [...currentCustomer.tags];
    let updatedStatus = currentCustomer.status;
    let updatedLeadScore = currentCustomer.leadScore;
    let updatedPreferredDates = currentCustomer.preferredDates;
    let updatedGuestCount = currentCustomer.guestCount;
    let updatedName = currentCustomer.name;

    // 2. Compute Automated Bot Logic based on user text to demonstrate real-time database capture
    const normalizedInput = userMsgText.toLowerCase().trim();

    if (normalizedInput === 'hi' || normalizedInput === 'hello' || normalizedInput === 'hey') {
      botReplyText = `🌴 Welcome to MGH Resort!\n\n1️⃣ Brochure\n2️⃣ Videos\n3️⃣ Both\n\nReply with a number.`;
    } else if (normalizedInput === '1') {
      botReplyText = `📄 Here's our digital brochure! (File attached below)\n\nWould you also like:\n4️⃣ Talk to our sales team\n5️⃣ Check availability & pricing`;
      isPdf = true;
      if (!updatedTags.includes('📄 Brochure')) updatedTags.push('📄 Brochure');
      updatedLeadScore = Math.min(updatedLeadScore + 10, 100);
    } else if (normalizedInput === '2') {
      botReplyText = `🎥 Here are our resort video tours! (ResortTour.mp4, PoolInfinity.mp4)\n\nWould you like:\n4️⃣ Connect with sales\n5️⃣ Check prices & booking`;
      isVideo = true;
      if (!updatedTags.includes('🎥 Videos')) updatedTags.push('🎥 Videos');
      updatedLeadScore = Math.min(updatedLeadScore + 15, 100);
    } else if (normalizedInput === '3') {
      botReplyText = `🌟 Here are both the brochure and video guides! Enjoy reading and watching.\n\nType 5️⃣ to query rates and dates directly!`;
      isPdf = true;
      isVideo = true;
      if (!updatedTags.includes('📄 Brochure')) updatedTags.push('📄 Brochure');
      if (!updatedTags.includes('🎥 Videos')) updatedTags.push('🎥 Videos');
      updatedLeadScore = Math.min(updatedLeadScore + 20, 100);
    } else if (normalizedInput === '4' || normalizedInput.includes('sales') || normalizedInput.includes('human')) {
      botReplyText = `Connecting you with our Sales Coordinator, Priya Sharma! One moment please... 📞`;
      updatedStatus = 'Engaged';
      if (!updatedTags.includes('📞 Human Connect')) updatedTags.push('📞 Human Connect');
    } else if (normalizedInput === '5' || normalizedInput.includes('price') || normalizedInput.includes('availability') || normalizedInput.includes('dates')) {
      botReplyText = `Great! To help you better, may I know your full name?`;
      if (!updatedTags.includes('💰 Price Inquiry')) updatedTags.push('💰 Price Inquiry');
      updatedLeadScore = Math.min(updatedLeadScore + 15, 100);
    } else if (currentCustomer.conversationHistory.length > 0 && currentCustomer.conversationHistory[currentCustomer.conversationHistory.length - 1].text.includes('know your full name')) {
      // User entered their name
      updatedName = userMsgText;
      botReplyText = `Thanks ${userMsgText}! What dates and how many guests are you looking at for your stay?`;
      updatedStatus = 'Negotiating';
    } else if (currentCustomer.conversationHistory.length > 0 && currentCustomer.conversationHistory[currentCustomer.conversationHistory.length - 1].text.includes('how many guests are you looking at')) {
      // User entered preferred dates / guest counts
      botReplyText = `Perfect! Checking calendar... One moment, connecting Priya from sales to confirm availability and share booking links! 🌴`;
      updatedPreferredDates = userMsgText;
      updatedStatus = 'Negotiating';
      updatedLeadScore = Math.min(updatedLeadScore + 25, 100);
    } else {
      // Fallback response simulating Shizuku bot safety warning
      botReplyText = `I received: "${userMsgText}".\n\nI'm still learning! Type:\n"hi" to open menu\n"1" for brochure\n"2" for video tours\n"5" to book room\n"sales" to talk with sales support.`;
    }

    setTypedMessage('');

    // Update parent database state with the user message immediately
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === currentCustomer.id) {
          return {
            ...c,
            name: updatedName,
            conversationHistory: updatedHistory,
            lastContact: 'Today, Just now'
          };
        }
        return c;
      })
    );

    // 3. Delay Bot reply by 900ms to simulate ADB pipeline execution
    setTimeout(() => {
      const botMessage: Message = {
        id: `m-bot-${Date.now()}`,
        sender: 'bot',
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isPdf,
        isVideo
      };

      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === currentCustomer.id) {
            return {
              ...c,
              conversationHistory: [...c.conversationHistory, botMessage],
              tags: updatedTags,
              status: updatedStatus,
              leadScore: updatedLeadScore,
              preferredDates: updatedPreferredDates || c.preferredDates,
              lastContact: 'Today, Just now'
            };
          }
          return c;
        })
      );
    }, 900);
  };

  // Interactive script walkthrough simulation
  const triggerAutomatedStep = (stepIndex: number) => {
    let text = '';
    if (stepIndex === 1) text = 'Hi';
    if (stepIndex === 2) text = '1';
    if (stepIndex === 3) text = '5';
    if (stepIndex === 4) text = 'Rahul Sharma';
    if (stepIndex === 5) text = '15-18 August, 2 adults';

    setTypedMessage(text);
  };

  return (
    <div className="space-y-6">
      {/* Header Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            Live Data Capture Simulator <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">LIVE TRACKING</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test and watch Shizuku automate ADB interactions, harvest client details, and populate CRM in real-time.
          </p>
        </div>

        {/* Customer Quick Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Testing Profile:</span>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-slate-900 border border-slate-850 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left Chat, Right Record Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Simulated Phone Panel */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-[0_8px_35px_rgb(0,0,0,0.5)] h-[580px]">
          {/* Simulated WhatsApp Status Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 relative text-teal-400 font-bold font-mono">
                {currentCustomer.name.charAt(0)}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 leading-none">
                  {currentCustomer.name}
                  <span className="text-[10px] bg-slate-950 text-slate-400 font-mono font-medium border border-slate-800 px-1.5 py-0.2 rounded">
                    WA Web
                  </span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  {currentCustomer.phone} • Shizuku Port 5555
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold animate-pulse">
                AUTO-BOT UP
              </span>
            </div>
          </div>

          {/* Interactive walkthrough helper for testing */}
          <div className="bg-slate-950/40 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="font-bold text-teal-400 text-[11px]">Walkthrough Steps:</span>
            <button onClick={() => triggerAutomatedStep(1)} className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300">1. "Hi"</button>
            <button onClick={() => triggerAutomatedStep(2)} className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300">2. Send "1"</button>
            <button onClick={() => triggerAutomatedStep(3)} className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300">3. Send "5"</button>
            <button onClick={() => triggerAutomatedStep(4)} className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300">4. Enter Name</button>
            <button onClick={() => triggerAutomatedStep(5)} className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300">5. Enter dates</button>
          </div>

          {/* Chat Bubble Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/30">
            {currentCustomer.conversationHistory.map((msg) => {
              const isUser = msg.sender === 'customer';
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-xs relative ${
                      isUser
                        ? 'bg-teal-900 text-teal-100 border border-teal-850 rounded-br-none shadow-[0_2px_10px_rgba(13,148,136,0.15)]'
                        : isBot
                        ? 'bg-slate-950 text-slate-200 border border-slate-800/80 rounded-bl-none'
                        : 'bg-indigo-950 text-indigo-100 border border-indigo-900 rounded-bl-none'
                    }`}
                  >
                    {/* Speaker Header */}
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">
                      {msg.sender === 'customer' ? 'Customer' : msg.sender === 'bot' ? '🌴 MGH BOT' : '📞 Sales Agent'}
                    </span>

                    {/* Text block */}
                    <div className="whitespace-pre-line leading-relaxed break-words font-medium">
                      {msg.text}
                    </div>

                    {/* Attachments rendering */}
                    {msg.isPdf && (
                      <div className="mt-2 p-2 bg-slate-950/70 border border-teal-500/20 rounded-md flex items-center justify-between gap-3 text-[10px] font-mono text-teal-300">
                        <span className="truncate flex items-center gap-1.5 font-bold"><BookOpen size={12} /> MGH_Resort_Brochure.pdf</span>
                        <span className="text-slate-500 text-[9px]">4.2 MB</span>
                      </div>
                    )}
                    {msg.isVideo && (
                      <div className="mt-2 p-2 bg-slate-950/70 border border-cyan-500/20 rounded-md flex items-center justify-between gap-3 text-[10px] font-mono text-cyan-300">
                        <span className="truncate flex items-center gap-1.5 font-bold"><Video size={12} /> Resort_Virtual_Tour.mp4</span>
                        <span className="text-slate-500 text-[9px]">18.5 MB</span>
                      </div>
                    )}

                    {/* Bottom Meta */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[8px] font-mono text-slate-500 text-right">
                      <span>{msg.timestamp}</span>
                      {isUser && <CheckCheck size={11} className="text-teal-400" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Simulated Text Composer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Type simulated guest message or use walkthrough prompts above..."
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-teal-500 placeholder-slate-600 font-medium"
            />
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 transition-colors text-slate-900 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer shadow-lg shadow-teal-500/10"
              title="Send to automated ADB loop"
            >
              <Send size={15} />
            </button>
          </form>
        </div>

        {/* Right Panel: Captured Database Records */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-[0_8px_35px_rgb(0,0,0,0.5)]">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                  Capture Node SQL_01
                </span>
                <h3 className="font-display font-semibold text-slate-100 mt-1.5">Auto-Created CRM Record</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-mono block">Lead Score</span>
                <span className="text-lg font-mono font-bold text-amber-400">
                  {currentCustomer.leadScore} <span className="text-[10px] text-slate-500">/100</span>
                </span>
              </div>
            </div>
          </div>

          {/* CRM Navigation Tabs */}
          <div className="flex border-b border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 text-center font-semibold border-b ${
                activeTab === 'details' ? 'border-teal-400 text-teal-400 bg-slate-950/20' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Captured Details
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 text-center font-semibold border-b ${
                activeTab === 'notes' ? 'border-teal-400 text-teal-400 bg-slate-950/20' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Cottage Notes & Logistics
            </button>
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            {activeTab === 'details' ? (
              <div className="space-y-4">
                {/* Status and Assignment badge deck */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl text-left">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Status</span>
                    <span className={`text-xs font-semibold font-mono block mt-1 ${
                      currentCustomer.status === 'Booked' ? 'text-emerald-400' :
                      currentCustomer.status === 'Hot Lead' ? 'text-rose-400 animate-pulse' :
                      currentCustomer.status === 'Negotiating' ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      ● {currentCustomer.status}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl text-left">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Assigned Owner</span>
                    <span className="text-xs font-semibold text-slate-200 block mt-1 flex items-center gap-1">
                      <UserCheck size={11} className="text-teal-400" />
                      {currentCustomer.assignedTo}
                    </span>
                  </div>
                </div>

                {/* Structured DB Rows */}
                <div className="divide-y divide-slate-850 border-t border-b border-slate-850 py-1 space-y-2">
                  <div className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-500 font-medium">Name:</span>
                    <span className="text-slate-200 font-semibold">{currentCustomer.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-500 font-medium">Phone:</span>
                    <span className="text-slate-300 font-mono font-semibold">{currentCustomer.phone}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Calendar size={12} className="text-slate-600" /> Preferred Dates:
                    </span>
                    <span className="text-teal-400 font-semibold font-mono">
                      {currentCustomer.preferredDates || 'Pending Bot Reply'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Users size={12} className="text-slate-600" /> Guest Count:
                    </span>
                    <span className="text-slate-300 font-semibold">
                      {currentCustomer.guestCount ? `${currentCustomer.guestCount} Adults` : 'Not Captured'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-500 font-medium">Database Node ID:</span>
                    <span className="text-slate-500 font-mono">sqlite_row_{currentCustomer.id}</span>
                  </div>
                </div>

                {/* Tags Section */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-mono text-slate-500 uppercase block">Active Flow Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCustomer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-full"
                      >
                        <Tag size={9} className="text-teal-400" />
                        {tag}
                        <button
                          onClick={() => handleDeleteTag(tag)}
                          className="text-slate-500 hover:text-slate-300 ml-1.5 text-xs cursor-pointer font-bold"
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddTag} className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. Pool Request)..."
                      value={newTagText}
                      onChange={(e) => setNewTagText(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-xl px-2.5 py-1 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      className="bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={11} /> Add
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              // Notes & logs panel
              <div className="space-y-4 text-left">
                <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1.5">
                    Cottage Manager Notes
                  </span>
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        className="w-full h-28 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500 font-sans leading-relaxed"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsEditingNotes(false)}
                          className="px-2.5 py-1 text-xs border border-slate-800 hover:bg-slate-900 text-slate-400 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNotes}
                          className="px-2.5 py-1 text-xs bg-teal-600 hover:bg-teal-500 text-slate-900 font-semibold rounded cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{currentCustomer.notes || 'No notes added yet. Click edit below.'}"
                      </p>
                      <button
                        onClick={() => setIsEditingNotes(true)}
                        className="text-teal-400 hover:text-teal-300 font-mono text-[11px] mt-3 underline"
                      >
                        Edit Notes
                      </button>
                    </div>
                  )}
                </div>

                {/* Flow Logs */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Capture Flow Logs</span>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800 text-[10px] font-mono text-slate-400">
                      🟢 [Today] First Contact logged on Shizuku bridge — {currentCustomer.firstContact}
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800 text-[10px] font-mono text-slate-400">
                      🟢 [Today] Automated PDF brochure pushed — Success
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800 text-[10px] font-mono text-slate-400">
                      🟢 [Today] Lead scoring assigned Hot tag — {currentCustomer.leadScore}/100 score
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/20 grid grid-cols-3 gap-2">
            <button
              onClick={handleSendOffer}
              className="bg-indigo-900/40 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 text-xs py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Send custom monsoon offer text"
            >
              <Sparkles size={12} /> Send Offer
            </button>
            <button
              onClick={() => {
                setCustomers((prev) =>
                  prev.map((c) =>
                    c.id === currentCustomer.id
                      ? {
                          ...c,
                          status: 'Hot Lead' as CustomerStatus,
                          leadScore: Math.min(c.leadScore + 10, 100),
                          tags: Array.from(new Set([...c.tags, '⏰ Followup Set']))
                        }
                      : c
                  )
                );
              }}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850 text-xs py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calendar size={12} /> Follow-up
            </button>
            <button
              onClick={handleMarkAsBooked}
              disabled={currentCustomer.status === 'Booked'}
              className={`text-xs py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                currentCustomer.status === 'Booked'
                  ? 'bg-emerald-950/20 text-emerald-600 border-emerald-950/30 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-900 border-emerald-500/20 font-bold'
              }`}
            >
              <UserCheck size={12} /> {currentCustomer.status === 'Booked' ? 'Booked' : 'Mark Booked'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
