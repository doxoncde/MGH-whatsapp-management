import React, { useState } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  Send,
  Edit,
  Download,
  Flame,
  Tag,
  ChevronRight,
  Database,
  Trash2,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Customer, CustomerStatus } from '../types';

interface CustomerCRMProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setSelectedCustomerId: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function CustomerCRM({
  customers,
  setCustomers,
  setSelectedCustomerId,
  setActiveTab
}: CustomerCRMProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Load team list dynamically from localStorage to keep CRM assignee dropdown in sync
  const teamList = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('mgh_team');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 't1', name: 'Priya Sharma' },
      { id: 't2', name: 'Rajesh Kumar' },
      { id: 't3', name: 'Anita Verma' },
      { id: 't4', name: 'Unassigned Queue' }
    ];
  }, []);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<CustomerStatus>('New Lead');
  const [editAssigned, setEditAssigned] = useState('');

  // Collect all unique tags for filter dropdown
  const allUniqueTags = Array.from(
    new Set(customers.flatMap((c) => c.tags.map((t) => t.replace(/[📄🎥💍🏊💼💆🧘👶💰⏰]/g, '').trim())))
  );

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;

    const matchesTag =
      selectedTagFilter === 'All' ||
      c.tags.some((t) => t.toLowerCase().includes(selectedTagFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesTag;
  });

  // Bulk select toggles
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(filteredCustomers.map((c) => c.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  // Launch simulated conversation view
  const handleViewCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setActiveTab('simulator');
  };

  // Open inline edit row
  const startEditing = (c: Customer) => {
    setEditingCustomerId(c.id);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditStatus(c.status);
    setEditAssigned(c.assignedTo);
  };

  // Save inline edits
  const saveEdits = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              name: editName,
              phone: editPhone,
              status: editStatus,
              assignedTo: editAssigned,
              lastContact: 'Just now'
            }
          : c
      )
    );
    setEditingCustomerId(null);
  };

  // Delete customer record from DB
  const handleDeleteCustomer = (id: string) => {
    if (confirm("Are you sure you want to delete this guest record from SQLite database?")) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setSelectedRows((prev) => prev.filter((rid) => rid !== id));
    }
  };

  // Mock Export CSV Download
  const handleExportCSV = () => {
    const csvHeader = 'Name,Phone,Lead Score,Status,Last Contact,Assigned Owner\r\n';
    const csvRows = filteredCustomers
      .map(
        (c) =>
          `"${c.name}","${c.phone}",${c.leadScore},"${c.status}","${c.lastContact}","${c.assignedTo}"`
      )
      .join('\r\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mgh_resort_leads.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Tag Assignment helper
  const handleBulkStatusChange = (status: CustomerStatus) => {
    if (selectedRows.length === 0) return;
    setCustomers((prev) =>
      prev.map((c) =>
        selectedRows.includes(c.id)
          ? {
              ...c,
              status,
              leadScore: status === 'Booked' ? 100 : c.leadScore,
              lastContact: 'Just now'
            }
          : c
      )
    );
    setSelectedRows([]);
    alert(`Status updated to "${status}" for ${selectedRows.length} selected leads.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            SQLite Customer Database <span className="text-xs font-mono bg-slate-900 text-slate-400 border border-slate-800 px-2.5 py-0.5 rounded-full">CRM Desk</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Query and filter client variables captured by ADB. Export reports directly to spreadsheet platforms.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer font-semibold transition-all hover:border-slate-700"
          >
            <Download size={14} className="text-teal-400" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* Database Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'SQLite Row Counts', value: customers.length, color: 'text-slate-100' },
          { label: 'Confirmed Booked', value: customers.filter((c) => c.status === 'Booked').length, color: 'text-emerald-400' },
          { label: 'Hot Leads (>=80)', value: customers.filter((c) => c.leadScore >= 80).length, color: 'text-rose-400' },
          { label: 'Waiting Queue', value: customers.filter((c) => c.assignedTo.includes('Unassigned')).length, color: 'text-amber-400' },
          { label: 'Total Inactive/Lost', value: customers.filter((c) => c.status === 'Lost').length, color: 'text-slate-500' }
        ].map((dbMetric, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left flex flex-col justify-between h-24 shadow-sm hover:border-slate-700 transition-colors">
            <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider leading-none">{dbMetric.label}</span>
            <span className={`text-2xl font-mono font-bold block leading-none ${dbMetric.color}`}>
              {dbMetric.value}
            </span>
          </div>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads by guest name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 text-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-teal-500 font-semibold"
            />
          </div>

          {/* Tag Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1 flex-shrink-0">
            <Filter size={13} className="text-teal-400" />
            <span className="text-slate-500 text-[11px] font-semibold">Filter Tag:</span>
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer pr-1 font-semibold"
            >
              <option value="All" className="bg-slate-950 text-slate-300">All Tags</option>
              {allUniqueTags.map((tag) => (
                <option key={tag} value={tag} className="bg-slate-950 text-slate-300">
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filtering Tabs */}
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800/60 pt-3">
          {['All', 'New Lead', 'Engaged', 'Negotiating', 'Hot Lead', 'Booked', 'Lost'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors font-semibold cursor-pointer border ${
                selectedStatus === st
                  ? 'bg-teal-950/80 text-teal-300 border-teal-500/30'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-850'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* CRM Main CRM Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredCustomers.length > 0 &&
                      selectedRows.length === filteredCustomers.length
                    }
                    onChange={handleSelectAll}
                    className="accent-teal-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 font-semibold">Guest Profile</th>
                <th className="py-3 px-3 font-semibold text-center">Lead Score</th>
                <th className="py-3 px-3 font-semibold">Status Badge</th>
                <th className="py-3 px-3 font-semibold">Last Interacted</th>
                <th className="py-3 px-3 font-semibold">Flow Tags</th>
                <th className="py-3 px-3 font-semibold">Assigned Rep</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                    No matching guest records found in SQLite database.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const isSelected = selectedRows.includes(c.id);
                  const isEditing = editingCustomerId === c.id;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-950/30 transition-colors ${
                        isSelected ? 'bg-teal-950/10' : ''
                      }`}
                    >
                      {/* Checkbox cell */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(c.id)}
                          className="accent-teal-500 cursor-pointer"
                        />
                      </td>

                      {/* Guest name & phone */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <div className="space-y-1.5 max-w-[150px]">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 py-1 rounded"
                            />
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono px-2 py-0.5 rounded"
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-200 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{c.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Lead Score Indicator */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {c.leadScore >= 80 ? (
                            <span className="flex items-center gap-0.5 text-rose-400 font-mono font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded">
                              <Flame size={12} className="text-rose-500 fill-rose-500" />
                              {c.leadScore}
                            </span>
                          ) : c.leadScore >= 40 ? (
                            <span className="text-amber-400 font-mono font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                              {c.leadScore}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono px-1.5 py-0.2 rounded">
                              {c.leadScore}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badging */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as CustomerStatus)}
                            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 py-1 rounded focus:outline-none cursor-pointer"
                          >
                            <option value="New Lead" className="bg-slate-950 text-slate-200">New Lead</option>
                            <option value="Engaged" className="bg-slate-950 text-slate-200">Engaged</option>
                            <option value="Negotiating" className="bg-slate-950 text-slate-200">Negotiating</option>
                            <option value="Hot Lead" className="bg-slate-950 text-slate-200">Hot Lead</option>
                            <option value="Booked" className="bg-slate-950 text-slate-200">Booked</option>
                            <option value="Lost" className="bg-slate-950 text-slate-200">Lost</option>
                          </select>
                        ) : (
                          <span
                            className={`text-[10px] font-semibold font-mono border px-2 py-0.5 rounded-full ${
                              c.status === 'Booked'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : c.status === 'Hot Lead'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
                                : c.status === 'Negotiating'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : c.status === 'Engaged'
                                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            {c.status}
                          </span>
                        )}
                      </td>

                      {/* Last Contact */}
                      <td className="py-3 px-3 text-slate-400 font-mono font-medium">
                        {c.lastContact}
                      </td>

                      {/* Flow Tags */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {c.tags.slice(0, 3).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[9px] font-mono bg-slate-950 border border-slate-850 text-slate-400 px-1.5 py-0.2 rounded"
                            >
                              {tag.replace(/[📄🎥💍🏊💼💆🧘👶💰⏰]/g, '')}
                            </span>
                          ))}
                          {c.tags.length > 3 && (
                            <span className="text-[9px] font-mono bg-slate-950 text-slate-500 px-1 py-0.2 rounded border border-slate-850">
                              +{c.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Owner */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <select
                            value={editAssigned}
                            onChange={(e) => setEditAssigned(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 py-1 rounded focus:outline-none cursor-pointer"
                          >
                            {teamList.map((member: any) => (
                              <option key={member.id} value={member.name} className="bg-slate-950 text-slate-200">
                                {member.name === 'Unassigned Queue' ? 'Unassigned' : member.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-semibold text-slate-300">{c.assignedTo.split(' ')[0]}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingCustomerId(null)}
                              className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-lg text-[10px]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdits(c.id)}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-500 text-slate-900 font-bold rounded-lg text-[10px]"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => handleViewCustomer(c.id)}
                              className="p-1 text-teal-400 hover:text-teal-300 hover:bg-slate-950 border border-transparent hover:border-slate-800 rounded-lg"
                              title="Open live conversation dashboard"
                            >
                              <ChevronRight size={15} />
                            </button>
                            <button
                              onClick={() => startEditing(c)}
                              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-950 border border-transparent hover:border-slate-800 rounded-lg"
                              title="Edit user details"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(c.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-950 border border-transparent hover:border-slate-800 rounded-lg"
                              title="Delete record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bulk Action Controls Bar */}
        {selectedRows.length > 0 && (
          <div className="bg-slate-900 border-t border-slate-800 px-5 py-3.5 flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-200">
                {selectedRows.length} leads selected
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-slate-400">Bulk operations:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange('Booked')}
                className="bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer"
              >
                Mark as Booked
              </button>
              <button
                onClick={() => handleBulkStatusChange('Lost')}
                className="bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer"
              >
                Mark as Lost
              </button>
              <button
                onClick={() => {
                  setSelectedRows([]);
                }}
                className="text-slate-500 hover:text-slate-300 px-2 py-1 font-semibold"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
