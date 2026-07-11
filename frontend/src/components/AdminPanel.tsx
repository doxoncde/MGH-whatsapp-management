import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Edit,
  Clock,
  Star,
  Shield,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Plus,
  Check,
  X,
  Phone,
  Mail,
  Search
} from 'lucide-react';
import { TeamMember } from '../types';

interface AdminPanelProps {
  team: TeamMember[];
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  enabledMenus?: Record<string, boolean>;
  setEnabledMenus?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function AdminPanel({
  team,
  setTeam,
  enabledMenus,
  setEnabledMenus
}: AdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  // Fields
  const [name, setName] = useState<string>('');
  const [avgReplyTime, setAvgReplyTime] = useState<string>('1.5 min');
  const [rating, setRating] = useState<number>(5.0);
  
  // Custom mock analytics fields for testing newly added employees
  const [leads, setLeads] = useState<number>(0);
  const [bookings, setBookings] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);

  const handleOpenAddForm = () => {
    setEditingMember(null);
    setName('');
    setAvgReplyTime('1.5 min');
    setRating(5.0);
    setLeads(0);
    setBookings(0);
    setRevenue(0);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setAvgReplyTime(member.avgReplyTime);
    setRating(member.rating);
    setLeads(member.leads);
    setBookings(member.bookings);
    setRevenue(member.revenue);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingMember) {
      // Editing
      setTeam((prevTeam) =>
        prevTeam.map((member) => {
          if (member.id === editingMember.id) {
            const conversionRate = leads > 0 ? parseFloat(((bookings / leads) * 100).toFixed(1)) : 0;
            return {
              ...member,
              name: name.trim(),
              avgReplyTime,
              rating: Number(rating),
              leads,
              bookings,
              conversionRate,
              revenue
            };
          }
          return member;
        })
      );
    } else {
      // Adding new
      const newId = `t-${Date.now()}`;
      const conversionRate = leads > 0 ? parseFloat(((bookings / leads) * 100).toFixed(1)) : 0;
      const rank = team.length + 1;
      
      const newMember: TeamMember = {
        id: newId,
        name: name.trim(),
        leads,
        bookings,
        conversionRate,
        revenue,
        avgReplyTime,
        rating: Number(rating),
        rank
      };

      setTeam((prevTeam) => [...prevTeam, newMember]);
    }

    handleCloseForm();
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Are you sure you want to remove this employee? This will release their assigned CRM tickets to the unassigned queue.')) {
      setTeam((prevTeam) => {
        const filtered = prevTeam.filter((m) => m.id !== id);
        // Re-rank
        return filtered.map((m, idx) => ({ ...m, rank: idx + 1 }));
      });
    }
  };

  // Filtered list
  const filteredTeam = team.filter((m) => {
    const query = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            Employee Directory Control <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">Admin Level</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authorize and manage employee accounts, configure system response expectations, and track lead workloads.
          </p>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto shadow-lg shadow-teal-500/10"
        >
          <UserPlus size={14} /> Add New Employee
        </button>
      </div>

      {/* Analytics Counter Deck */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Employees', value: team.filter(t => t.id !== 't4').length, color: 'text-indigo-400', icon: Users },
          { label: 'Avg Rating Limit', value: (team.filter(t => t.id !== 't4').reduce((acc, t) => acc + t.rating, 0) / Math.max(1, team.filter(t => t.id !== 't4').length)).toFixed(1) + ' ★', color: 'text-amber-400', icon: Star },
          { label: 'Total Allocated Leads', value: team.reduce((acc, t) => acc + t.leads, 0), color: 'text-teal-400', icon: TrendingUp },
          { label: 'System Access Rank', value: 'Lv. 1 Admin', color: 'text-purple-400', icon: Shield }
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
                <Icon size={16} className={metric.color} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider leading-none mb-1">{metric.label}</span>
                <span className={`text-xl font-mono font-bold leading-none ${metric.color}`}>
                  {metric.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workspace Menu Access Toggles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div>
          <h3 className="text-sm font-semibold font-mono text-slate-100 flex items-center gap-2">
            <Shield size={14} className="text-teal-400" />
            Workspace Navigation Access Controls
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Configure which tabs are visible to staff in the main sidebar. To focus staff on our core <strong className="text-teal-400 font-bold">WhatsApp Engine functionalities</strong> (Bot Performance, CRM, & Live Data Capture), you can toggle visibility for other supplementary menus.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'overview', label: 'Executive Overview', desc: 'Summary of analytics & performance', isCore: false },
            { id: 'bot', label: 'Bot Performance', desc: 'Real-time agent simulation logs', isCore: true },
            { id: 'simulator', label: 'Live Data Capture', desc: 'Simulate guest incoming chats', isCore: true },
            { id: 'crm', label: 'Customer CRM', desc: 'Manage guest status & ticket logs', isCore: true },
            { id: 'tariffs', label: 'Resort Tariffs & Calculator', desc: 'Quotation and rate guides', isCore: false },
            { id: 'promotions', label: 'Promotions / Campaigns', desc: 'Bulk broadcast whatsapp lists', isCore: false },
            { id: 'team', label: 'Team Tracker', desc: 'Sales leaderboard stats', isCore: false },
            { id: 'system', label: 'System Health', desc: 'Battery, delays & error logs', isCore: false }
          ].map((menu) => {
            const isEnabled = enabledMenus ? !!enabledMenus[menu.id] : true;
            return (
              <div 
                key={menu.id} 
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isEnabled 
                    ? 'bg-slate-950/40 border-teal-500/20 shadow-[0_2px_10px_rgba(20,184,166,0.03)]' 
                    : 'bg-slate-950/10 border-slate-850 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-200">{menu.label}</span>
                    {menu.isCore && (
                      <span className="text-[8px] font-mono font-bold bg-teal-500/15 text-teal-400 px-1.5 py-0.5 rounded-md uppercase">
                        Core WA
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">{menu.desc}</p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-950/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    {isEnabled ? '🟢 Active' : '🔴 Hidden'}
                  </span>
                  
                  {/* Switch toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (setEnabledMenus && enabledMenus) {
                        setEnabledMenus({
                          ...enabledMenus,
                          [menu.id]: !isEnabled
                        });
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-teal-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Filter & Table Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search employee directory by name or system ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 text-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-850">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 font-mono">
                <th className="py-3 px-4 font-semibold">Employee ID</th>
                <th className="py-3 px-4 font-semibold">Full Name</th>
                <th className="py-3 px-4 font-semibold">Active Workload</th>
                <th className="py-3 px-4 font-semibold">Target Rating</th>
                <th className="py-3 px-4 font-semibold">Response Sla</th>
                <th className="py-3 px-4 font-semibold">Role Access</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredTeam.map((member) => {
                const isSpecialQueue = member.id === 't4';
                return (
                  <tr key={member.id} className="hover:bg-slate-950/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">
                      {isSpecialQueue ? 'SYSTEM' : member.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center font-display font-bold text-[10px] text-slate-900">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block">{member.name}</span>
                          <span className="text-[9px] font-mono text-slate-500">Rank #{member.rank} in Sales</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {member.leads} lead ticket(s)
                    </td>
                    <td className="py-3.5 px-4">
                      {isSpecialQueue ? (
                        <span className="text-slate-500 font-mono">-</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px]">
                          ★ {member.rating.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono flex items-center gap-1 mt-1.5 border-transparent">
                      {!isSpecialQueue && <Clock size={11} className="text-indigo-400" />}
                      {member.avgReplyTime}
                    </td>
                    <td className="py-3.5 px-4">
                      {isSpecialQueue ? (
                        <span className="text-[10px] font-mono bg-slate-950 text-slate-500 border border-slate-850 px-2 py-0.5 rounded-full">
                          System Buffer
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                          Client Agent
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isSpecialQueue ? (
                        <span className="text-[10px] text-slate-500 font-medium">LOCKED</span>
                      ) : (
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditForm(member)}
                            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-950 border border-transparent hover:border-slate-850 rounded-lg cursor-pointer"
                            title="Edit employee"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-950 border border-transparent hover:border-slate-850 rounded-lg cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTeam.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-semibold">
                    No employees matching search parameters were found in active memory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overlay Modal for Adding/Editing */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="p-5 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
              <h3 className="text-sm font-semibold font-mono text-slate-100 flex items-center gap-2">
                <Shield size={14} className="text-indigo-400" />
                {editingMember ? 'Modify Employee Profile' : 'Authorize New Employee'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-slate-500 hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">SLA Reply Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.2 min"
                    value={avgReplyTime}
                    onChange={(e) => setAvgReplyTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Target Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    required
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Advanced Analytics Seeding */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5">
                <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold block">
                  Seed Baseline Analytics (Simulated Workload)
                </span>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Leads Assigned</label>
                    <input
                      type="number"
                      min={0}
                      value={leads}
                      onChange={(e) => setLeads(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Bookings Logged</label>
                    <input
                      type="number"
                      min={0}
                      value={bookings}
                      onChange={(e) => setBookings(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Total Revenue</label>
                    <input
                      type="number"
                      min={0}
                      value={revenue}
                      onChange={(e) => setRevenue(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-850 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-teal-500/10"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
