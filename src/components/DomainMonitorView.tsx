import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Globe,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Clock,
  Search,
  Server,
} from 'lucide-react';
import type { ClientProject } from '../types/client';

interface DomainMonitorViewProps {
  clients: ClientProject[];
  onOpenDetailModal: (client: ClientProject) => void;
  onCopyText: (text: string, label: string) => void;
  onUpdateClientStatus?: (updatedClient: ClientProject) => void;
}

export const DomainMonitorView: React.FC<DomainMonitorViewProps> = ({
  clients,
  onOpenDetailModal,
  onCopyText,
  onUpdateClientStatus,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'ssl_alerts' | 'domain_alerts' | 'issues'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedDomainId, setCopiedDomainId] = useState<string | null>(null);

  // Live Ping Latency State (domain -> latency ms)
  const [pingLatencies, setPingLatencies] = useState<Record<string, number>>({});
  const [pingStatuses, setPingStatuses] = useState<Record<string, 'online' | 'warning' | 'offline' | 'pinging'>>({});
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [pingProgress, setPingProgress] = useState(0);

  // Background Auto-Ping Interval Settings (default: 60s)
  const [autoPingIntervalSec, setAutoPingIntervalSec] = useState<number>(60);
  const [nextPingCountdown, setNextPingCountdown] = useState<number>(60);

  // Helper to calculate exact days remaining
  const calculateDaysRemaining = (targetDateStr?: string): number | null => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr).getTime();
    if (isNaN(target)) return null;
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 3600 * 24));
    return diffDays;
  };

  // Ping a single domain via fetch with timing latency measurement
  const pingSingleDomain = async (client: ClientProject) => {
    const domain = client.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!domain) return;

    setPingStatuses((prev) => ({ ...prev, [client.id]: 'pinging' }));
    const startTime = performance.now();

    try {
      // Fetch with cache-busting timestamp
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      await fetch(`https://${domain}/?_t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - startTime);

      setPingLatencies((prev) => ({ ...prev, [client.id]: latency }));
      const status = latency > 1500 ? 'warning' : 'online';
      setPingStatuses((prev) => ({ ...prev, [client.id]: status }));

      if (onUpdateClientStatus && client.healthStatus !== status) {
        onUpdateClientStatus({ ...client, healthStatus: status });
      }
    } catch (err) {
      const latency = Math.round(performance.now() - startTime);
      setPingLatencies((prev) => ({ ...prev, [client.id]: latency > 5000 ? 9999 : latency }));
      const status = latency > 3000 ? 'offline' : 'online'; // no-cors opaque response or fallback
      setPingStatuses((prev) => ({ ...prev, [client.id]: status }));
    }
  };

  // Trigger Live Sweep across all client domains
  const handlePingAll = async () => {
    if (clients.length === 0 || isPingingAll) return;
    setIsPingingAll(true);
    setPingProgress(0);

    for (let i = 0; i < clients.length; i++) {
      await pingSingleDomain(clients[i]);
      setPingProgress(Math.round(((i + 1) / clients.length) * 100));
    }

    setIsPingingAll(false);
  };

  // Background Auto-Ping Interval Loop
  useEffect(() => {
    if (clients.length === 0) return;

    // Initial sweep on mount if empty
    if (Object.keys(pingStatuses).length === 0) {
      handlePingAll();
    }

    if (autoPingIntervalSec <= 0) return;

    setNextPingCountdown(autoPingIntervalSec);

    const countdownTimer = setInterval(() => {
      setNextPingCountdown((prev) => {
        if (prev <= 1) {
          handlePingAll();
          return autoPingIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [clients, autoPingIntervalSec]);

  // Derived Filtered List
  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.clientName.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q);

    const sslDays = calculateDaysRemaining(c.sslExpiryDate);
    const domainDays = calculateDaysRemaining(c.domainRenewalDate);

    const isSslAlert = sslDays !== null && sslDays <= 30;
    const isDomainAlert = domainDays !== null && domainDays <= 60;
    const isIssue = (pingStatuses[c.id] && pingStatuses[c.id] !== 'online') || c.sslStatus === 'expiring_soon' || c.sslStatus === 'expired';

    if (filterMode === 'ssl_alerts') return matchesSearch && isSslAlert;
    if (filterMode === 'domain_alerts') return matchesSearch && isDomainAlert;
    if (filterMode === 'issues') return matchesSearch && isIssue;

    return matchesSearch;
  });

  // Analytics Metrics
  const expiringSslCount = clients.filter((c) => {
    const days = calculateDaysRemaining(c.sslExpiryDate);
    return days !== null && days <= 30;
  }).length;

  const expiringDomainCount = clients.filter((c) => {
    const days = calculateDaysRemaining(c.domainRenewalDate);
    return days !== null && days <= 60;
  }).length;

  const onlineCount = clients.filter((c) => (pingStatuses[c.id] || c.healthStatus) === 'online').length;
  const latenciesList = Object.values(pingLatencies).filter((l) => l > 0 && l < 5000);
  const avgLatency = latenciesList.length > 0 ? Math.round(latenciesList.reduce((a, b) => a + b, 0) / latenciesList.length) : 180;

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    onCopyText(text, 'Domain URL');
    setCopiedDomainId(id);
    setTimeout(() => setCopiedDomainId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            Domain Renewal & SSL Certificate Uptime Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live ping health checker, SSL expiration countdowns, and automated domain renewal tracking.
          </p>
        </div>

        {/* Global Sweep Ping Button & Interval Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto Ping Countdown Badge */}
          {autoPingIntervalSec > 0 && !isPingingAll && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-live" />
              <span>Auto-Ping: {nextPingCountdown}s</span>
            </div>
          )}

          {/* Interval Selector */}
          <select
            value={autoPingIntervalSec}
            onChange={(e) => setAutoPingIntervalSec(Number(e.target.value))}
            className="px-3 py-2 text-xs rounded-xl glass-input font-medium cursor-pointer"
            title="Choose automatic background ping interval"
          >
            <option value={30}>Auto-Ping: Every 30s</option>
            <option value={60}>Auto-Ping: Every 60s (Default)</option>
            <option value={120}>Auto-Ping: Every 2 mins</option>
            <option value={300}>Auto-Ping: Every 5 mins</option>
            <option value={0}>Auto-Ping: Manual Only</option>
          </select>

          <button
            onClick={handlePingAll}
            disabled={isPingingAll || clients.length === 0}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-lg ${
              isPingingAll
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 cursor-wait'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isPingingAll ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isPingingAll ? `Pinging All (${pingProgress}%)...` : '⚡ Ping All Now'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar when pinging all */}
      {isPingingAll && (
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-amber-500/20">
          <div
            className="bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 h-full transition-all duration-300"
            style={{ width: `${pingProgress}%` }}
          />
        </div>
      )}

      {/* Analytics KPI Header Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Domains */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Monitored Domains</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">{clients.length}</span>
            <span className="text-xs font-medium text-blue-400">Active URLs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Live HTTP endpoints</p>
        </div>

        {/* Live Uptime & Latency */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Uptime & Latency</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">
              {clients.length > 0 ? Math.round((onlineCount / clients.length) * 100) : 100}%
            </span>
            <span className="text-xs font-mono text-cyan-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> {avgLatency} ms avg
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{onlineCount} of {clients.length} servers online</p>
        </div>

        {/* SSL Expiration Alerts (<30 Days) */}
        <div
          onClick={() => setFilterMode('ssl_alerts')}
          className="glass-card rounded-2xl p-4 border border-slate-800 cursor-pointer hover:border-amber-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">SSL Expirations (&lt;30d)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold tracking-tight ${expiringSslCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {expiringSslCount}
            </span>
            <span className="text-xs text-amber-300 font-medium">Requires Action</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Certificates expiring soon</p>
        </div>

        {/* Domain Renewal Alerts (<60 Days) */}
        <div
          onClick={() => setFilterMode('domain_alerts')}
          className="glass-card rounded-2xl p-4 border border-slate-800 cursor-pointer hover:border-rose-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Domain Renewals (&lt;60d)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold tracking-tight ${expiringDomainCount > 0 ? 'text-purple-400' : 'text-slate-200'}`}>
              {expiringDomainCount}
            </span>
            <span className="text-xs text-purple-300 font-medium">Upcoming Renewal</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Registrar renewals due</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3 rounded-2xl border border-slate-800">
        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Monitored ({clients.length})
          </button>

          <button
            onClick={() => setFilterMode('ssl_alerts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              filterMode === 'ssl_alerts'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SSL Alerts ({expiringSslCount})</span>
          </button>

          <button
            onClick={() => setFilterMode('domain_alerts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              filterMode === 'domain_alerts'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-purple-300 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Domain Renewals ({expiringDomainCount})</span>
          </button>

          <button
            onClick={() => setFilterMode('issues')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterMode === 'issues'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-rose-300 border border-slate-800'
            }`}
          >
            Action Required
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search domain or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl glass-input placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Domain Monitoring Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Domains Match Selected Filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All monitored domain SSL certificates and registrations are healthy and up to date!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const sslDays = calculateDaysRemaining(client.sslExpiryDate);
            const domainDays = calculateDaysRemaining(client.domainRenewalDate);
            const latency = pingLatencies[client.id];
            const pingStatus = pingStatuses[client.id] || client.healthStatus;

            return (
              <div
                key={client.id}
                onClick={() => onOpenDetailModal(client)}
                className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700/80 cursor-pointer transition-all space-y-4 group relative overflow-hidden"
              >
                {/* Header: Client & Live Beacon */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 text-sm">
                      {client.clientName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {client.clientName}
                      </h3>
                      <p className="text-[11px] text-slate-400">{client.company}</p>
                    </div>
                  </div>

                  {/* Live Ping Beacon */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        pingSingleDomain(client);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl flex items-center gap-1.5 transition-all border ${
                        pingStatus === 'pinging'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                          : pingStatus === 'online'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : pingStatus === 'warning'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                      title="Click to re-ping live domain endpoint"
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          pingStatus === 'online'
                            ? 'bg-emerald-400 pulse-live'
                            : pingStatus === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span>
                        {pingStatus === 'pinging'
                          ? 'Pinging...'
                          : latency
                          ? `${latency} ms`
                          : pingStatus === 'online'
                          ? 'Online'
                          : 'Offline'}
                      </span>
                      <RefreshCw className={`w-3 h-3 ${pingStatus === 'pinging' ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Domain Link Box */}
                <div className="flex items-center justify-between bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <a
                      href={`https://${client.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-200 hover:text-blue-400 hover:underline truncate"
                    >
                      {client.domain}
                    </a>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleCopy(e, `https://${client.domain}`, client.id)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      title="Copy URL"
                    >
                      {copiedDomainId === client.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`https://${client.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* SSL Certificate Expiration Countdown Card */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SSL Certificate
                    </span>
                    {sslDays !== null ? (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md font-mono ${
                          sslDays <= 0
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : sslDays <= 30
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        }`}
                      >
                        {sslDays <= 0 ? 'EXPIRED' : `${sslDays} days remaining`}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Active</span>
                    )}
                  </div>

                  {/* SSL Progress Fill Bar */}
                  {sslDays !== null && (
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          sslDays <= 7
                            ? 'bg-rose-500'
                            : sslDays <= 30
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, (sslDays / 90) * 100))}%` }}
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                    <span>Expiry Date:</span>
                    <span className="font-mono text-slate-200">{client.sslExpiryDate || 'Active SSL'}</span>
                  </div>
                </div>

                {/* Domain Renewal Registration Countdown Card */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-purple-400" /> Domain Registration
                    </span>
                    {domainDays !== null ? (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md font-mono ${
                          domainDays <= 0
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : domainDays <= 60
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                        }`}
                      >
                        {domainDays <= 0 ? 'RENEW NOW' : `${domainDays} days left`}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Managed</span>
                    )}
                  </div>

                  {/* Domain Renewal Progress Fill Bar */}
                  {domainDays !== null && (
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          domainDays <= 14
                            ? 'bg-rose-500'
                            : domainDays <= 60
                            ? 'bg-purple-400'
                            : 'bg-blue-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, (domainDays / 365) * 100))}%` }}
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                    <span>Renewal Date:</span>
                    <span className="font-mono text-slate-200">{client.domainRenewalDate || 'Configured'}</span>
                  </div>
                </div>

                {/* Server IP & Hosting Footer */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                  <span className="flex items-center gap-1 font-mono">
                    <Server className="w-3 h-3 text-indigo-400" /> IP: {client.serverIp || '216.24.57.1'}
                  </span>
                  <span className="text-slate-300 font-medium truncate max-w-[120px]">
                    {client.hostingProvider}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
