import React, { useState } from 'react';
import {
  Activity,
  Server,
  Smartphone,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Download,
  AlertOctagon,
  CheckCircle2,
  Bell,
  Terminal,
  Zap,
  Wifi,
  BatteryCharging
} from 'lucide-react';
import { SystemMetrics, SystemErrorLog } from '../types';

interface SystemHealthProps {
  metrics: SystemMetrics;
  setMetrics: React.Dispatch<React.SetStateAction<SystemMetrics>>;
  errorLogs: SystemErrorLog[];
  setErrorLogs: React.Dispatch<React.SetStateAction<SystemErrorLog[]>>;
}

export default function SystemHealth({
  metrics,
  setMetrics,
  errorLogs,
  setErrorLogs
}: SystemHealthProps) {
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[21:00:15] [VM-CORE] Oracle VM node.js gateway initialized.',
    '[21:00:16] [TUNNEL] Tailscale encrypted mesh tunnel secured.',
    '[21:00:18] [SHIZUKU] ADB bridge handshake completed with physical device (Pixel 6a).',
    '[21:00:19] [AUTO-BOT] Scouring Android UI layout nodes... Official WA in foreground.',
    '[21:00:20] [SQLITE] Database sync node connected. 8 active guest profiles matched.',
    '[21:15:32] [BOT-FLOW] Processed incoming chat from Vikram Patel — Menu Trigger v3.'
  ]);

  const [activeActions, setActiveActions] = useState<Record<string, boolean>>({
    bot: false,
    phone: false,
    test: false
  });

  const appendConsoleLog = (line: string) => {
    const time = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => [...prev, `[${time}] ${line}`]);
  };

  // Admin Action: Restart Bot
  const handleRestartBot = () => {
    if (activeActions.bot) return;
    setActiveActions((prev) => ({ ...prev, bot: true }));
    appendConsoleLog('[CORE] Initiating automated restart of Node.js daemon... Please wait.');
    
    setMetrics((prev) => ({ ...prev, whatsappStatus: 'Stopped' }));

    setTimeout(() => {
      setMetrics((prev) => ({
        ...prev,
        whatsappStatus: 'Running',
        cpuUsage: 12,
        ramUsage: 35
      }));
      setActiveActions((prev) => ({ ...prev, bot: false }));
      appendConsoleLog('[CORE] Node.js daemon successfully booted. SQLite thread synchronized.');
      alert("WhatsApp Automation Bot restarted successfully on Oracle VM!");
    }, 1500);
  };

  // Admin Action: Reconnect Phone client via Shizuku
  const handleRestartPhone = () => {
    if (activeActions.phone) return;
    setActiveActions((prev) => ({ ...prev, phone: true }));
    appendConsoleLog('[SHIZUKU] Dropping ADB bridge connection briefly...');
    
    setMetrics((prev) => ({
      ...prev,
      tailscaleStatus: 'Warning',
      phoneCharging: false
    }));

    setTimeout(() => {
      setMetrics((prev) => ({
        ...prev,
        tailscaleStatus: 'Connected',
        phoneCharging: true,
        phoneBattery: 91
      }));
      setActiveActions((prev) => ({ ...prev, phone: false }));
      appendConsoleLog('[SHIZUKU] ADB secure handshake re-established. Port 5555 bound.');
      alert("Physical Android device re-connected via Shizuku ADB bridge!");
    }, 1800);
  };

  // Admin Action: Test alert notification
  const handleTestAlert = () => {
    if (activeActions.test) return;
    setActiveActions((prev) => ({ ...prev, test: true }));
    appendConsoleLog('[ALERT-ENGINE] Dispatching test notification payload to admin console...');

    setTimeout(() => {
      const newErr: SystemErrorLog = {
        id: `e-test-${Date.now()}`,
        time: 'Just now',
        type: 'Phone Alert',
        detail: '⚠️ [TEST CRITICAL ALERT] Visual verification test successfully launched from Admin panel.'
      };
      setErrorLogs((prev) => [newErr, ...prev]);
      setActiveActions((prev) => ({ ...prev, test: false }));
      appendConsoleLog('[ALERT-ENGINE] SMS and Telegram test dispatch completed.');
      alert("Test alert notification pushed successfully! Check the Error Log below.");
    }, 900);
  };

  // Admin Action: Download raw system logs
  const handleDownloadLogs = () => {
    const rawLogs = consoleLogs.join('\r\n');
    const blob = new Blob([rawLogs], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mgh_gateway_syslogs.log');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG representation for messages-per-day bar chart (30-day index)
  const systemMetricsBarData = [
    { label: 'Day 1-5', value: 45 },
    { label: 'Day 6-10', value: 58 },
    { label: 'Day 11-15', value: 64 },
    { label: 'Day 16-20', value: 52 },
    { label: 'Day 21-25', value: 78 },
    { label: 'Day 26-30', value: 92 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            Technical System Health <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase animate-pulse">GATEWAY SECURE</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry of physical ADB bridge connection, Tailscale overlay tunnel, and Oracle Cloud VM node resources.
          </p>
        </div>
      </div>

      {/* Telemetry Status Cards Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Bot Uptime */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4.5 text-left shadow-lg">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Bot Uptime</span>
          <span className="text-lg font-mono font-bold text-teal-400 block mt-1.5">{metrics.botUptime}</span>
          <span className="text-[9px] text-slate-500 font-mono mt-1.5 block">Last 30-day aggregate</span>
        </div>

        {/* Oracle VM CPU */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4.5 text-left shadow-lg">
          <span className="text-[10px] font-mono text-slate-500 uppercase block flex justify-between items-center">
            Oracle CPU <Cpu size={11} className="text-teal-400" />
          </span>
          <span className="text-lg font-mono font-bold text-slate-100 block mt-1.5">{metrics.cpuUsage}%</span>
          <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-teal-500 h-full rounded-full" style={{ width: `${metrics.cpuUsage}%` }} />
          </div>
        </div>

        {/* Oracle VM RAM */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4.5 text-left shadow-lg">
          <span className="text-[10px] font-mono text-slate-500 uppercase block flex justify-between items-center">
            Oracle RAM <Server size={11} className="text-teal-400" />
          </span>
          <span className="text-lg font-mono font-bold text-slate-100 block mt-1.5">{metrics.ramUsage}%</span>
          <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-teal-500 h-full rounded-full" style={{ width: `${metrics.ramUsage}%` }} />
          </div>
        </div>

        {/* Android Phone battery */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4.5 text-left shadow-lg">
          <span className="text-[10px] font-mono text-slate-500 uppercase block flex justify-between items-center">
            Pixel 6a <BatteryCharging size={11} className="text-emerald-400" />
          </span>
          <span className="text-lg font-mono font-bold text-emerald-400 block mt-1.5">
            {metrics.phoneBattery}% <span className="text-[9px] text-slate-500 font-mono">({metrics.phoneCharging ? 'Charging' : 'Idle'})</span>
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-1.5 block">Port 5555 ADB secure</span>
        </div>

        {/* Tailscale Status */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4.5 text-left shadow-lg">
          <span className="text-[10px] font-mono text-slate-500 uppercase block flex justify-between items-center">
            Tailscale Tunnel <Wifi size={11} className="text-teal-400" />
          </span>
          <span className={`text-sm font-semibold font-mono block mt-2 ${
            metrics.tailscaleStatus === 'Connected' ? 'text-teal-400' : 'text-amber-400 animate-pulse'
          }`}>
            ● {metrics.tailscaleStatus}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-2 block">Overlay network mesh</span>
        </div>

        {/* WhatsApp App Service */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4.5 text-left shadow-lg">
          <span className="text-[10px] font-mono text-slate-500 uppercase block flex justify-between items-center">
            WhatsApp App <Smartphone size={11} className="text-teal-400" />
          </span>
          <span className={`text-sm font-semibold font-mono block mt-2 ${
            metrics.whatsappStatus === 'Running' ? 'text-teal-400' : 'text-rose-500 animate-pulse'
          }`}>
            ● {metrics.whatsappStatus}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-2 block">Foreground active</span>
        </div>
      </div>

      {/* Main Row: Console Shell (Left) & Actions/Diagnostic chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Simulated ADB Terminal console */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between h-[450px]">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal size={14} className="text-teal-400 animate-pulse" />
              <span>Orchestrator Logs (Tailscale Overlay)</span>
            </div>
            <span className="text-[9px] font-mono bg-slate-950 text-slate-500 px-2 py-0.5 rounded">
              stdout / stderr
            </span>
          </div>

          {/* Console readout block */}
          <div className="flex-1 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1.5 leading-relaxed text-left selection:bg-teal-800">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="hover:bg-slate-900/30 px-1 rounded transition-colors break-words">
                <span className="text-teal-500">{log.substring(0, 10)}</span>
                <span className="text-slate-200">{log.substring(10)}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border-t border-slate-950 p-3 flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Terminal ready for ADB commands</span>
            <button
              onClick={handleDownloadLogs}
              className="text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer font-bold uppercase"
            >
              <Download size={11} /> Download Complete Logfile
            </button>
          </div>
        </div>

        {/* Admin Actions Panel */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-2xl flex flex-col justify-between h-[450px]">
          <div>
            <div className="border-b border-slate-900 pb-3 mb-4">
              <h3 className="font-display font-semibold text-slate-100 text-sm">Orchestrator Actions</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Physical ADB and Node.js process managers</p>
            </div>

            <div className="space-y-3.5">
              {/* Restart Bot button */}
              <button
                onClick={handleRestartBot}
                disabled={activeActions.bot}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <RefreshCw size={13} className={`text-teal-400 ${activeActions.bot ? 'animate-spin' : ''}`} />
                {activeActions.bot ? 'Restarting Server daemon...' : 'Restart Node.js Bot Service'}
              </button>

              {/* Reset phone ADB secure shell */}
              <button
                onClick={handleRestartPhone}
                disabled={activeActions.phone}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Smartphone size={13} className={`text-emerald-400 ${activeActions.phone ? 'animate-bounce' : ''}`} />
                {activeActions.phone ? 'Reconnecting ADB socket...' : 'Reset Phone Client Connection'}
              </button>

              {/* Push verification notification check */}
              <button
                onClick={handleTestAlert}
                disabled={activeActions.test}
                className="w-full py-3 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-900/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Bell size={13} className="text-rose-400" />
                {activeActions.test ? 'Dispatching verified check...' : 'Test Error Alerts Dispatch'}
              </button>
            </div>
          </div>

          <div className="p-4.5 bg-slate-900/40 border border-slate-900/80 rounded-lg text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Tunnel Status Checklist</span>
            <ul className="text-xs font-mono text-slate-400 space-y-1.5 mt-2">
              <li className="flex items-center gap-2">🟢 <span className="text-slate-300 font-bold">ADB overlay:</span> active bound on port 5555</li>
              <li className="flex items-center gap-2">🟢 <span className="text-slate-300 font-bold">Encrypted VPN:</span> Tailscale secure mesh mesh0</li>
              <li className="flex items-center gap-2">🟢 <span className="text-slate-300 font-bold">SQLite Node:</span> /srv/mgh/db/resort.sqlite</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Error log section */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-xl">
        <div className="mb-4 border-b border-slate-900 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-slate-100 text-sm">System Error & Diagnostic Log</h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Capturing telemetry faults in ADB automated loop</p>
          </div>
          <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded font-bold animate-pulse">
            FAULT ALARM PANEL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-mono">
                <th className="py-2.5 w-24">Timestamp</th>
                <th className="py-2.5 w-32">Fault Type</th>
                <th className="py-2.5">Detailed Telemetry Explanation</th>
                <th className="py-2.5 text-right w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/50">
              {errorLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/20 transition-colors">
                  <td className="py-3 font-mono text-slate-500">{log.time}</td>
                  <td className="py-3">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      [{log.type}]
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-left pr-4 leading-relaxed font-sans">{log.detail}</td>
                  <td className="py-3 text-right">
                    <span className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                      Logged
                    </span>
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
