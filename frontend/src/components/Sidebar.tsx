import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Database,
  Megaphone,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Shield,
  X,
  User,
  Power
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  phoneBattery: number;
  userRole: 'admin' | 'employee';
  setUserRole: (role: 'admin' | 'employee') => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  enabledMenus?: Record<string, boolean>;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  phoneBattery,
  userRole,
  setUserRole,
  mobileOpen,
  setMobileOpen,
  enabledMenus
}: SidebarProps) {
  // Base menu items
  const baseMenuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'bot', label: 'Bot Performance', icon: MessageSquare },
    { id: 'simulator', label: 'Live Data Capture', icon: Sparkles, badge: 'Live' },
    { id: 'crm', label: 'Customer CRM', icon: Database },
    { id: 'tariffs', label: 'Resort Tariffs', icon: BookOpen },
    { id: 'promotions', label: 'Promotions', icon: Megaphone },
    { id: 'team', label: 'Team Tracker', icon: Users },
    { id: 'system', label: 'System Health', icon: Activity },
  ];

  // Dynamically filter supplementary items based on enabledMenus config
  const filteredBaseItems = baseMenuItems.filter(item => {
    if (enabledMenus && enabledMenus[item.id] !== undefined) {
      return enabledMenus[item.id];
    }
    return true;
  });

  const menuItems = [...filteredBaseItems];

  // Dynamically append Admin Panel ONLY if userRole is admin
  if (userRole === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Control', icon: Shield });
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false); // Auto-close drawer on mobile tab selection
  };

  const handleRoleChange = (role: 'admin' | 'employee') => {
    setUserRole(role);
    if (role === 'employee' && activeTab === 'admin') {
      setActiveTab('overview');
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
        />
      )}

      <aside
        className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 select-none 
          h-screen z-50
          fixed md:sticky md:top-0 inset-y-0 left-0
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Top Brand / Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-[0_0_15px_rgba(13,148,136,0.15)]">
              M
            </div>
            {(!collapsed || mobileOpen) && (
              <div>
                <h1 className="font-display font-bold text-slate-100 tracking-tight text-sm leading-none">
                  MGH RESORT
                </h1>
                <span className="text-[10px] font-mono font-medium tracking-wider text-teal-400 uppercase leading-none mt-0.5 block">
                  WA Engine
                </span>
              </div>
            )}
          </div>

          {/* Close Menu Button on Mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-xl bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X size={15} />
          </button>

          {/* Collapse/Expand toggle on Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-100 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group relative ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-300 border-l-2 border-teal-400 shadow-[0_2px_10px_rgba(13,148,136,0.05)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                {(!collapsed || mobileOpen) && item.badge && (
                  <span className="ml-auto text-[9px] font-mono uppercase bg-teal-400/10 text-teal-400 border border-teal-400/20 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on Collapsed (Desktop only) */}
                {collapsed && !mobileOpen && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap shadow-xl">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Role & Status Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 space-y-3">
          {/* Active Role Selector (Gives explicit toggle testing for user review) */}
          {(!collapsed || mobileOpen) ? (
            <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
              <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider mb-1 px-1 font-bold">
                Security Level / Access
              </span>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => handleRoleChange('admin')}
                  className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    userRole === 'admin'
                      ? 'bg-indigo-600 text-slate-100 shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => handleRoleChange('employee')}
                  className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    userRole === 'employee'
                      ? 'bg-slate-800 text-slate-300'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Staff
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleRoleChange(userRole === 'admin' ? 'employee' : 'admin')}
              className="w-full py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-100 flex items-center justify-center cursor-pointer transition-all"
              title={`Switch security role (Current: ${userRole.toUpperCase()})`}
            >
              <Power size={13} className={userRole === 'admin' ? 'text-indigo-400' : 'text-slate-500'} />
            </button>
          )}

          {(!collapsed || mobileOpen) ? (
            <div className="space-y-3">
              {/* Live Link Info */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">ADB BRIDGE</span>
                </div>
                <span className="text-[10px] bg-teal-400/10 text-teal-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {phoneBattery}% 🔋
                </span>
              </div>

              {/* User Session Profile */}
              <div className="flex items-center gap-3 px-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center font-display font-semibold text-xs text-slate-900">
                  {userRole === 'admin' ? 'AD' : 'EM'}
                </div>
                <div className="truncate text-left">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {userRole === 'admin' ? 'Raziv Kapur (Admin)' : 'Guest Employee'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {userRole === 'admin' ? 'razivkap@gmail.com' : 'employee@mghresort.com'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center font-display font-bold text-xs text-slate-900">
                {userRole === 'admin' ? 'AD' : 'EM'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
