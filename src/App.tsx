import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { MainTab } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { ClientCard } from './components/ClientCard';
import { ClientTableView } from './components/ClientTableView';
import { ClientDetailModal } from './components/ClientDetailModal';
import { CredentialVaultModal } from './components/CredentialVaultModal';
import { SheetSyncModal } from './components/SheetSyncModal';
import { AddClientModal } from './components/AddClientModal';
import { MasterPinModal } from './components/MasterPinModal';
import {
  loadClientsFromStorage,
  saveClientsToStorage,
  loadSyncConfig,
  saveSyncConfig,
  hasMasterPin,
} from './services/storageService';
import {
  exportClientsToExcel,
  fetchAndParseOnlineSheetUrl,
  pushFullDatabaseToOnlineSheet,
} from './services/excelSyncService';
import type { ClientProject, SheetSyncConfig } from './types/client';
import {
  Check,
  ShieldAlert,
  Key,
  Globe,
  Table as TableIcon,
  Activity,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react';

export function App() {
  const [clients, setClients] = useState<ClientProject[]>([]);
  const [syncConfig, setSyncConfig] = useState<SheetSyncConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Drawers State
  const [selectedClient, setSelectedClient] = useState<ClientProject | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isPinLocked, setIsPinLocked] = useState<boolean>(hasMasterPin());

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pollingTimerRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 1. Initial Load & Setup
  useEffect(() => {
    const loadedClients = loadClientsFromStorage();
    setClients(loadedClients);

    const loadedConfig = loadSyncConfig();
    setSyncConfig(loadedConfig);

    performLiveSheetSync(loadedConfig.sheetUrl);
  }, []);

  // 2. Real-time Auto-Sync Polling Interval Loop
  useEffect(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    const intervalSec = syncConfig.autoSyncIntervalMinutes || 10;
    if (intervalSec > 0) {
      pollingTimerRef.current = setInterval(() => {
        performLiveSheetSync(syncConfig.sheetUrl, true);
      }, intervalSec * 1000);
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [syncConfig.sheetUrl, syncConfig.autoSyncIntervalMinutes]);

  const performLiveSheetSync = async (sheetUrl?: string, isSilent = false) => {
    try {
      const targetUrl = sheetUrl || import.meta.env.VITE_SHEET_SYNC_URL || import.meta.env.VITE_CUSTOM_API_ENDPOINT;
      if (!targetUrl && !import.meta.env.VITE_GOOGLE_API_KEY) return;

      setSyncConfig((prev) => ({ ...prev, syncStatus: 'syncing' }));

      const syncedClients = await fetchAndParseOnlineSheetUrl(sheetUrl);
      
      if (Array.isArray(syncedClients)) {
        setClients(syncedClients);
        saveClientsToStorage(syncedClients);
        setSyncConfig((prev) => ({
          ...prev,
          syncStatus: 'success',
          lastSyncTime: new Date().toLocaleTimeString(),
        }));

        if (!isSilent) {
          triggerToast(
            syncedClients.length > 0
              ? `Synced ${syncedClients.length} clients from live online sheet!`
              : 'Synced online sheet (0 clients found)'
          );
        }
      }
    } catch (err: any) {
      setSyncConfig((prev) => ({
        ...prev,
        syncStatus: 'error',
        syncErrorMessage: err.message,
      }));
    }
  };

  /**
   * Update Clients Locally & Trigger Bi-Directional Write-Back Push to Online Sheet
   */
  const handleUpdateClients = async (updatedList: ClientProject[], message?: string) => {
    setClients(updatedList);
    saveClientsToStorage(updatedList);

    const pushed = await pushFullDatabaseToOnlineSheet(updatedList);
    if (message) {
      triggerToast(pushed ? `${message} & synced to sheet` : message);
    }
  };

  const handleSingleClientUpdate = (updatedClient: ClientProject) => {
    const newList = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    handleUpdateClients(newList, `Updated ${updatedClient.clientName}`);
    setSelectedClient(updatedClient);
  };

  const handleDeleteClient = (clientId: string) => {
    const newList = clients.filter((c) => c.id !== clientId);
    handleUpdateClients(newList, 'Client record deleted');
  };

  const handleAddClient = (newClient: ClientProject) => {
    const newList = [newClient, ...clients];
    handleUpdateClients(newList, `Added ${newClient.clientName} to portfolio`);
  };

  const handleImportClients = (imported: ClientProject[]) => {
    handleUpdateClients(imported, `Imported ${imported.length} client projects from sheet`);
  };

  const handleExportExcel = () => {
    exportClientsToExcel(clients);
    triggerToast('Exported database to Excel (.xlsx)');
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied ${label} to clipboard!`);
  };

  // Filtered Clients Logic
  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.clientName.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.cmsFramework.toLowerCase().includes(q) ||
      c.hostingProvider.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const expiringSslCount = clients.filter(
    (c) => c.sslStatus === 'expiring_soon' || c.sslStatus === 'expired'
  ).length;

  const expiringDomainsCount = clients.filter((c) => {
    if (!c.domainRenewalDate) return false;
    const renewal = new Date(c.domainRenewalDate).getTime();
    const now = new Date().getTime();
    const daysDiff = (renewal - now) / (1000 * 3600 * 24);
    return daysDiff <= 60;
  }).length;

  // Analytics Metrics for Dashboard Overview
  const totalRetainer = clients.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);
  const activeCount = clients.filter((c) => c.status === 'active').length;
  const inDevCount = clients.filter((c) => c.status === 'in_development').length;
  const carePlanCount = clients.filter((c) => c.status === 'maintenance').length;
  const onlineCount = clients.filter((c) => c.healthStatus === 'online').length;
  const warningCount = clients.filter((c) => c.healthStatus === 'warning').length;
  const offlineCount = clients.filter((c) => c.healthStatus === 'offline').length;

  // All pending tasks across clients
  const allPendingTasks = clients.flatMap((c) =>
    c.tasks
      .filter((t) => t.status !== 'completed')
      .map((t) => ({ ...t, clientName: c.clientName, domain: c.domain }))
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel border border-emerald-500/40 text-emerald-300 shadow-2xl text-xs font-semibold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        syncConfig={syncConfig}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenAddClientModal={() => setIsAddClientModalOpen(true)}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
        onExportExcel={handleExportExcel}
        isPinLocked={isPinLocked}
        onTogglePinLock={() => setIsPinModalOpen(true)}
        totalClientsCount={clients.length}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-4 lg:p-8 gap-6">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          expiringSslCount={expiringSslCount}
          expiringDomainsCount={expiringDomainsCount}
        />

        {/* Dynamic Main Section */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* TAB 1: DASHBOARD OVERVIEW (Executive Analytics Page) */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top KPI Metrics Cards */}
              <DashboardStats
                clients={clients}
                onSelectFilter={(filter) => {
                  if (filter === 'alerts') setActiveTab('domains');
                  if (filter === 'vault') setIsVaultModalOpen(true);
                  if (filter === 'all') setActiveTab('projects');
                }}
              />

              {/* Analytics & Distribution Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status & Portfolio Distribution */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" /> Portfolio Breakdown
                    </h3>
                    <span className="text-xs text-slate-500">{clients.length} total</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active Websites
                        </span>
                        <span className="font-semibold">{activeCount} ({clients.length > 0 ? Math.round((activeCount / clients.length) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${clients.length > 0 ? (activeCount / clients.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400" /> In Development
                        </span>
                        <span className="font-semibold">{inDevCount} ({clients.length > 0 ? Math.round((inDevCount / clients.length) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${clients.length > 0 ? (inDevCount / clients.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400" /> Care Plan Maintenance
                        </span>
                        <span className="font-semibold">{carePlanCount} ({clients.length > 0 ? Math.round((carePlanCount / clients.length) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all"
                          style={{ width: `${clients.length > 0 ? (carePlanCount / clients.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Server Uptime & SSL Health Box */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" /> Server Health Monitor
                    </h3>
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All Live
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center py-2">
                    <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                      <span className="text-xl font-bold text-emerald-400">{onlineCount}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Online</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                      <span className="text-xl font-bold text-amber-400">{warningCount}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Warnings</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30">
                      <span className="text-xl font-bold text-rose-400">{offlineCount}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Down</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>SSL Certificate Expirations:</span>
                    <span className={expiringSslCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {expiringSslCount} expiring soon
                    </span>
                  </div>
                </div>

                {/* Recurring Revenue Metric */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Financial Summary
                    </h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30">
                    <span className="text-xs text-slate-400 block mb-1">Monthly Recurring Retainers</span>
                    <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                      ${totalRetainer.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">
                      Annualized: ${(totalRetainer * 12).toLocaleString()} / year
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Avg Retainer / Client:</span>
                    <span className="font-semibold text-slate-200">
                      ${clients.length > 0 ? Math.round(totalRetainer / clients.length) : 0}/mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Maintenance Tasks & Quick Action Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Maintenance Tasks */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" /> Pending Maintenance Milestones ({allPendingTasks.length})
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allPendingTasks.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">All website maintenance tasks completed! 🎉</p>
                    ) : (
                      allPendingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="glass-card rounded-xl p-3 flex items-center justify-between gap-3 border border-slate-800 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-white">{task.title}</p>
                            <p className="text-[11px] text-blue-400 font-mono">{task.clientName} ({task.domain})</p>
                          </div>
                          <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                            {task.dueDate}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Launcher Commands */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400" /> Agency Action Launcher
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <button
                      onClick={() => setIsAddClientModalOpen(true)}
                      className="p-3 rounded-2xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 flex items-center gap-2.5 font-semibold transition-all"
                    >
                      <Plus className="w-4 h-4 text-blue-400" /> Add Client Project
                    </button>

                    <button
                      onClick={() => setIsSyncModalOpen(true)}
                      className="p-3 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-2.5 font-semibold transition-all"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-400" /> Sync Google Sheet
                    </button>

                    <button
                      onClick={() => setIsVaultModalOpen(true)}
                      className="p-3 rounded-2xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 flex items-center gap-2.5 font-semibold transition-all"
                    >
                      <Key className="w-4 h-4 text-indigo-400" /> Open Credential Vault
                    </button>

                    <button
                      onClick={handleExportExcel}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2.5 font-semibold transition-all"
                    >
                      <TableIcon className="w-4 h-4 text-cyan-400" /> Download .XLSX
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEBSITE PROJECTS PAGE (Dedicated Projects Listing) */}
          {activeTab === 'projects' && (
            <>
              {/* Header Title & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" /> Website Projects
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                      {filteredClients.length} of {clients.length} projects
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Filter Tabs */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl glass-input"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="in_development">In Development</option>
                    <option value="maintenance">Care Plan</option>
                    <option value="paused">Paused</option>
                  </select>

                  {/* Grid vs Table Switcher */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        viewMode === 'grid'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Grid Cards View"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Grid Cards</span>
                    </button>

                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        viewMode === 'table'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Spreadsheet View"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Spreadsheet</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid or Table Display */}
              {clients.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">No Client Projects Found</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Your Google Sheet currently has 0 clients. Add clients in your Google Sheet or click below to add one manually.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => performLiveSheetSync(syncConfig.sheetUrl)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                    >
                      Sync Now
                    </button>
                    <button
                      onClick={() => setIsAddClientModalOpen(true)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      Add Client Manually
                    </button>
                  </div>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onOpenDetailModal={(c) => {
                        setSelectedClient(c);
                        setIsDetailModalOpen(true);
                      }}
                      onCopyText={handleCopyText}
                    />
                  ))}
                </div>
              ) : (
                <ClientTableView
                  clients={filteredClients}
                  onOpenDetailModal={(c) => {
                    setSelectedClient(c);
                    setIsDetailModalOpen(true);
                  }}
                  onCopyText={handleCopyText}
                />
              )}
            </>
          )}

          {/* TAB 3: SPREADSHEET TABLE VIEW */}
          {activeTab === 'table' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-emerald-400" /> Excel Spreadsheet View
                </h2>
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  Download .XLSX
                </button>
              </div>

              <ClientTableView
                clients={filteredClients}
                onOpenDetailModal={(c) => {
                  setSelectedClient(c);
                  setIsDetailModalOpen(true);
                }}
                onCopyText={handleCopyText}
              />
            </div>
          )}

          {/* TAB 4: CREDENTIALS VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-indigo-400" /> Global Credentials Vault
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage all FTP, WordPress Admin, Database, CPanel, and API Key credentials
                    </p>
                  </div>
                  <button
                    onClick={() => setIsVaultModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Open Vault Modal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOMAIN & SSL MONITOR */}
          {activeTab === 'domains' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-400" /> Domain Renewal & SSL Certificate Monitor
                  </h2>
                  <p className="text-xs text-slate-400">Track SSL expiration dates and domain renewals</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedClient(c);
                      setIsDetailModalOpen(true);
                    }}
                    className="glass-card rounded-2xl p-4 cursor-pointer hover:border-amber-500/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white text-sm">{c.clientName}</h3>
                      <span className="font-mono text-xs text-slate-400">{c.domain}</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">SSL Certificate:</span>
                        <span
                          className={
                            c.sslStatus === 'expiring_soon'
                              ? 'text-amber-400 font-bold'
                              : c.sslStatus === 'expired'
                              ? 'text-rose-400 font-bold'
                              : 'text-emerald-400'
                          }
                        >
                          {c.sslExpiryDate || 'Active'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">Domain Renewal:</span>
                        <span className="font-semibold text-slate-200">{c.domainRenewalDate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ONLINE SHEET SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-emerald-400" /> Realtime Cloud Sheet Integration
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Configure background auto-polling and view connected sheet status.
                </p>

                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                >
                  Configure Sync & Upload Spreadsheet
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Drawers and Modals */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdateClient={handleSingleClientUpdate}
          onDeleteClient={handleDeleteClient}
          onCopyText={handleCopyText}
          isPinLocked={isPinLocked}
          onRequestPinUnlock={() => setIsPinModalOpen(true)}
        />
      )}

      <CredentialVaultModal
        clients={clients}
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onCopyText={handleCopyText}
        isPinLocked={isPinLocked}
        onRequestPinUnlock={() => setIsPinModalOpen(true)}
      />

      <SheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncConfig={syncConfig}
        onSaveConfig={(cfg) => {
          setSyncConfig(cfg);
          saveSyncConfig(cfg);
          performLiveSheetSync(cfg.sheetUrl);
        }}
        clients={clients}
        onImportClients={handleImportClients}
      />

      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onAddClient={handleAddClient}
      />

      <MasterPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onUnlockSuccess={() => {
          setIsPinLocked(!isPinLocked);
          triggerToast(isPinLocked ? 'Vault unlocked!' : 'Vault locked!');
        }}
      />
    </div>
  );
}

const DEFAULT_CONFIG: SheetSyncConfig = {
  syncType: 'google_sheet_csv',
  autoSyncIntervalMinutes: 10,
  syncStatus: 'idle',
};

export default App;
