/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import BotPerformance from './components/BotPerformance';
import CustomerSimulator from './components/CustomerSimulator';
import CustomerCRM from './components/CustomerCRM';
import Promotions from './components/Promotions';
import TeamDashboard from './components/TeamDashboard';
import SystemHealth from './components/SystemHealth';
import TariffGuide from './components/TariffGuide';
import AdminPanel from './components/AdminPanel';

import {
  initialCustomers,
  initialCampaigns,
  initialTeam,
  initialErrors,
  initialMetrics
} from './mockData';
import { Customer, Campaign, TeamMember, SystemMetrics, SystemErrorLog } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');

  // Synchronized state with localStorage for dynamic mock data persistence
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('mgh_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('mgh_campaigns');
    return saved ? JSON.parse(saved) : initialCampaigns;
  });

  const [team, setTeam] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('mgh_team');
    return saved ? JSON.parse(saved) : initialTeam;
  });

  const [errorLogs, setErrorLogs] = useState<SystemErrorLog[]>(() => {
    const saved = localStorage.getItem('mgh_errors');
    return saved ? JSON.parse(saved) : initialErrors;
  });

  const [metrics, setMetrics] = useState<SystemMetrics>(() => {
    const saved = localStorage.getItem('mgh_metrics');
    return saved ? JSON.parse(saved) : initialMetrics;
  });

  const [enabledMenus, setEnabledMenus] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('mgh_enabled_menus');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      overview: true,
      bot: true,
      simulator: true,
      crm: true,
      tariffs: true,
      promotions: true,
      team: true,
      system: true
    };
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('c1');

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('mgh_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('mgh_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('mgh_team', JSON.stringify(team));
  }, [team]);

  useEffect(() => {
    localStorage.setItem('mgh_errors', JSON.stringify(errorLogs));
  }, [errorLogs]);

  useEffect(() => {
    localStorage.setItem('mgh_metrics', JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem('mgh_enabled_menus', JSON.stringify(enabledMenus));
  }, [enabledMenus]);

  // Fallback to first available enabled tab if the current tab gets hidden by admin
  useEffect(() => {
    if (enabledMenus && !enabledMenus[activeTab] && activeTab !== 'admin') {
      const preferredOrder = ['bot', 'simulator', 'crm', 'overview', 'tariffs', 'promotions', 'team', 'system'];
      const firstEnabled = preferredOrder.find((id) => enabledMenus[id]);
      if (firstEnabled) {
        setActiveTab(firstEnabled);
      }
    }
  }, [enabledMenus, activeTab]);

  // Dynamically update conversion stats and revenues for our sales reps based on actual customer status changes!
  useEffect(() => {
    setTeam((prevTeam) => {
      return prevTeam.map((member) => {
        if (member.id === 't4') {
          // Unassigned Queue count
          const unassignedLeads = customers.filter(
            (c) => c.assignedTo.includes('Unassigned') || c.assignedTo === ''
          ).length;
          return { ...member, leads: unassignedLeads };
        }

        // Filter customers assigned to this specific member
        const assignedCustomers = customers.filter((c) => c.assignedTo === member.name);
        const bookedCustomers = assignedCustomers.filter((c) => c.status === 'Booked');

        const totalLeads = assignedCustomers.length;
        const totalBookings = bookedCustomers.length;
        
        // Calculate conversion rate
        const conversionRate = totalLeads > 0 ? parseFloat(((totalBookings / totalLeads) * 100).toFixed(1)) : 0;
        
        // Compute revenue: assume ₹12,000 per booking unless custom values in notes
        const computedRevenue = bookedCustomers.reduce((acc, c) => {
          if (c.id === 'c1') return acc + 12000;
          if (c.id === 'c2') return acc + 50000; // Large weddingcottage group
          return acc + 15000; // standard mock cottage price
        }, 0);

        return {
          ...member,
          leads: totalLeads,
          bookings: totalBookings,
          conversionRate,
          revenue: member.revenue > 0 ? member.revenue : computedRevenue // preserve custom admin seeded revenue if present
        };
      });
    });
  }, [customers]);

  // Tab switching animation presets
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeIn' } }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ExecutiveDashboard
            customers={customers}
            setActiveTab={setActiveTab}
            setSelectedCustomerId={setSelectedCustomerId}
          />
        );
      case 'bot':
        return <BotPerformance />;
      case 'simulator':
        return (
          <CustomerSimulator
            customers={customers}
            setCustomers={setCustomers}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
          />
        );
      case 'crm':
        return (
          <CustomerCRM
            customers={customers}
            setCustomers={setCustomers}
            setSelectedCustomerId={setSelectedCustomerId}
            setActiveTab={setActiveTab}
          />
        );
      case 'tariffs':
        return <TariffGuide />;
      case 'promotions':
        return (
          <Promotions
            campaigns={campaigns}
            setCampaigns={setCampaigns}
            customers={customers}
            setCustomers={setCustomers}
          />
        );
      case 'team':
        return <TeamDashboard team={team} customers={customers} />;
      case 'admin':
        // Gated rendering just in case activeTab remains 'admin' while user switches role to employee
        if (userRole !== 'admin') {
          return (
            <ExecutiveDashboard
              customers={customers}
              setActiveTab={setActiveTab}
              setSelectedCustomerId={setSelectedCustomerId}
            />
          );
        }
        return <AdminPanel team={team} setTeam={setTeam} enabledMenus={enabledMenus} setEnabledMenus={setEnabledMenus} />;
      case 'system':
        return (
          <SystemHealth
            metrics={metrics}
            setMetrics={setMetrics}
            errorLogs={errorLogs}
            setErrorLogs={setErrorLogs}
          />
        );
      default:
        return (
          <ExecutiveDashboard
            customers={customers}
            setActiveTab={setActiveTab}
            setSelectedCustomerId={setSelectedCustomerId}
          />
        );
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col md:flex-row font-sans select-text selection:bg-teal-800">
      
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-5 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-300 hover:text-slate-100 cursor-pointer"
            title="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-[0_0_10px_rgba(13,148,136,0.15)]">
            M
          </div>
          <div className="text-left">
            <h1 className="font-display font-bold text-slate-100 tracking-tight text-xs leading-none">
              MGH RESORT
            </h1>
            <span className="text-[9px] font-mono text-teal-400 uppercase leading-none mt-0.5 block">
              WA ENGINE
            </span>
          </div>
        </div>

        {/* Quick Role Badge indicator */}
        <span className={`text-[10px] font-mono font-bold border px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
          userRole === 'admin' 
            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${userRole === 'admin' ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
          {userRole.toUpperCase()}
        </span>
      </header>

      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        phoneBattery={metrics.phoneBattery}
        userRole={userRole}
        setUserRole={setUserRole}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        enabledMenus={enabledMenus}
      />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full pb-10"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
