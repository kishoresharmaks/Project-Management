import React from 'react';
import { Globe, DollarSign, Activity, ShieldAlert, Key, CheckCircle2 } from 'lucide-react';
import type { ClientProject } from '../types/client';

interface DashboardStatsProps {
  clients: ClientProject[];
  onSelectFilter: (filterType: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ clients, onSelectFilter }) => {
  const totalProjects = clients.length;

  const totalMonthlyRetainer = clients.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);

  const onlineCount = clients.filter((c) => c.healthStatus === 'online').length;
  const healthRate = totalProjects > 0 ? Math.round((onlineCount / totalProjects) * 100) : 100;

  const expiringSslCount = clients.filter(
    (c) => c.sslStatus === 'expiring_soon' || c.sslStatus === 'expired'
  ).length;

  const totalCredentialsCount = clients.reduce((sum, c) => sum + c.credentials.length, 0);

  const activeProjectsCount = clients.filter((c) => c.status === 'active').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Active Clients Card */}
      <div
        onClick={() => onSelectFilter('all')}
        className="glass-card rounded-2xl p-4 cursor-pointer hover:border-blue-500/40 group transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Total Projects</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{totalProjects}</span>
          <span className="text-xs font-medium text-emerald-400">{activeProjectsCount} active</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Websites under management</p>
      </div>

      {/* Monthly Retainers Card */}
      <div className="glass-card rounded-2xl p-4 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Monthly Retainer</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-emerald-400 tracking-tight">
            ${totalMonthlyRetainer.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">/mo</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Recurring client retainer revenue</p>
      </div>

      {/* Server Health Rate */}
      <div className="glass-card rounded-2xl p-4 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Health Uptime</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{healthRate}%</span>
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {onlineCount} online
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Live ping & SSL status rate</p>
      </div>

      {/* Domain & SSL Alerts Card */}
      <div
        onClick={() => onSelectFilter('alerts')}
        className="glass-card rounded-2xl p-4 cursor-pointer hover:border-amber-500/40 group transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">SSL / Domain Alerts</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-400 tracking-tight">{expiringSslCount}</span>
          <span className="text-xs text-amber-300">Requires Action</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">SSL certificates expiring soon</p>
      </div>

      {/* Total Credentials Stored */}
      <div
        onClick={() => onSelectFilter('vault')}
        className="glass-card rounded-2xl p-4 cursor-pointer hover:border-indigo-500/40 group transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Credentials Vault</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
            <Key className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-indigo-300 tracking-tight">{totalCredentialsCount}</span>
          <span className="text-xs text-slate-400">Keys & Logins</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">WP, FTP, DB & API keys secured</p>
      </div>
    </div>
  );
};
