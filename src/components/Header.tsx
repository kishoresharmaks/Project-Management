import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  ShieldAlert,
  Server,
  Download,
  Settings,
  X,
  Key,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import type { SheetSyncConfig, ClientProject } from '../types/client';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clients?: ClientProject[];
  onSelectClient?: (client: ClientProject) => void;
  onNavigateToTab?: (tab: string) => void;
  syncConfig: SheetSyncConfig;
  onTriggerSync: () => void;
  onOpenSyncModal: () => void;
  onOpenAddClientModal: () => void;
  onOpenVaultModal: () => void;
  onExportExcel: () => void;
  isPinLocked: boolean;
  onTogglePinLock: () => void;
  totalClientsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  clients = [],
  onSelectClient,
  onNavigateToTab,
  syncConfig,
  onTriggerSync,
  onOpenSyncModal,
  onOpenAddClientModal,
  onOpenVaultModal,
  onExportExcel,
  isPinLocked,
  onTogglePinLock,
  totalClientsCount,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDropdownFocused, setIsDropdownFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isSyncing = syncConfig.syncStatus === 'syncing';
  const hasSyncError = syncConfig.syncStatus === 'error';
  const isSyncSuccess = syncConfig.syncStatus === 'success';

  // Safe string lowercasing helper to prevent TypeError on numeric or undefined values
  const safeStr = (val: any) => String(val || '').toLowerCase();

  const query = searchQuery.toLowerCase().trim();
  const isSearchActive = query.length > 0;

  // Filter clients for live search dropdown popup
  const searchResults = isSearchActive
    ? clients.filter((c) => {
        const matchesBasic =
          safeStr(c.clientName).includes(query) ||
          safeStr(c.company).includes(query) ||
          safeStr(c.domain).includes(query) ||
          safeStr(c.stagingUrl).includes(query) ||
          safeStr(c.cmsFramework).includes(query) ||
          safeStr(c.phpNodeVersion).includes(query) ||
          safeStr(c.hostingProvider).includes(query) ||
          safeStr(c.serverIp).includes(query) ||
          safeStr(c.notes).includes(query) ||
          (Array.isArray(c.tags) && c.tags.some((t) => safeStr(t).includes(query)));

        const contact = c.primaryContact || {};
        const matchesContact =
          safeStr(contact.name).includes(query) ||
          safeStr(contact.email).includes(query) ||
          safeStr(contact.phone).includes(query);

        const matchesCreds = Array.isArray(c.credentials) && c.credentials.some(
          (cred) =>
            safeStr(cred.label).includes(query) ||
            safeStr(cred.username).includes(query) ||
            safeStr(cred.category).includes(query) ||
            safeStr(cred.hostUrl).includes(query) ||
            safeStr(cred.notes).includes(query)
        );

        const matchesTasks = Array.isArray(c.tasks) && c.tasks.some((task) => safeStr(task.title).includes(query));

        return matchesBasic || matchesContact || matchesCreds || matchesTasks;
      })
    : [];

  // Close search overlay dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (client: ClientProject) => {
    if (onSelectClient) {
      onSelectClient(client);
    }
    setIsDropdownFocused(false);
  };

  const handleViewAllResults = () => {
    if (onNavigateToTab) {
      onNavigateToTab('projects');
    }
    setIsDropdownFocused(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-3">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Brand Area */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  ClientPulse <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold tracking-wide">Vault Pro</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="font-medium text-slate-300">{totalClientsCount} Projects</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live" /> Realtime Sync
                </span>
              </p>
            </div>
          </div>

          {/* Desktop Search Bar with Live Spotlight Dropdown Overlay */}
          <div ref={searchContainerRef} className="relative w-full max-w-sm hidden md:block mx-4">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search clients, domains, credentials, stack..."
              value={searchQuery}
              onFocus={() => setIsDropdownFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  handleViewAllResults();
                }
                if (e.key === 'Escape') {
                  setIsDropdownFocused(false);
                }
              }}
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl glass-input placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* LIVE SPOTLIGHT SEARCH DROPDOWN OVERLAY */}
            {isSearchActive && isDropdownFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-950/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl rounded-2xl p-2 max-h-[70vh] overflow-y-auto animate-fadeIn">
                <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <span>Instant Match Results ({searchResults.length})</span>
                  <span className="text-[10px] text-slate-500 font-mono">Press ESC to dismiss</span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <p className="font-semibold text-slate-300">No matching records found for "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-500 mt-1">Try searching by Client name, Domain, WP Admin username, CMS, or Hosting provider.</p>
                  </div>
                ) : (
                  <div className="space-y-1 py-1">
                    {searchResults.map((client) => {
                      const matchedCred = Array.isArray(client.credentials) && client.credentials.find(
                        (cr) =>
                          safeStr(cr.label).includes(query) ||
                          safeStr(cr.username).includes(query) ||
                          safeStr(cr.category).includes(query) ||
                          safeStr(cr.hostUrl).includes(query)
                      );

                      return (
                        <div
                          key={client.id}
                          onClick={() => handleSelectResult(client)}
                          className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors border border-transparent hover:border-slate-700/60 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                              {client.clientName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                {client.clientName}
                                <span className="text-[11px] font-mono text-slate-400 font-normal ml-2">
                                  ({client.domain})
                                </span>
                              </p>

                              {/* Highlighted matched property pill */}
                              {matchedCred ? (
                                <p className="text-[11px] text-indigo-300 flex items-center gap-1 font-mono mt-0.5 truncate">
                                  <Key className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span>
                                    {matchedCred.label}: <strong className="text-white">{matchedCred.username || matchedCred.category}</strong>
                                  </span>
                                </p>
                              ) : safeStr(client.cmsFramework).includes(query) || safeStr(client.hostingProvider).includes(query) ? (
                                <p className="text-[11px] text-cyan-300 flex items-center gap-1 font-mono mt-0.5 truncate">
                                  <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                                  <span>
                                    Stack: {client.cmsFramework} &bull; {client.hostingProvider}
                                  </span>
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  Company: {client.company} &bull; Status: <span className="text-emerald-400 capitalize">{client.status}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchResults.length > 0 && (
                  <button
                    onClick={handleViewAllResults}
                    className="w-full mt-1 p-2 text-center text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl border border-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>View all {searchResults.length} matching projects in table view</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Search Toggle */}
          <div className="flex items-center md:hidden ml-auto sm:ml-0">
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:text-white"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            {/* 1-CLICK INSTANT SYNC BUTTON */}
            <div className="flex items-center gap-0.5 rounded-xl bg-slate-900 border border-slate-800 p-0.5 shadow-sm">
              <button
                onClick={onTriggerSync}
                disabled={isSyncing}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isSyncing
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 cursor-wait'
                    : hasSyncError
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900/80'
                    : isSyncSuccess
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                }`}
                title="Click to trigger instant live sheet sync without modal"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                {syncConfig.lastSyncTime && !isSyncing && (
                  <span className="hidden xl:inline text-[10px] text-emerald-400/80 font-normal">
                    ({syncConfig.lastSyncTime})
                  </span>
                )}
              </button>

              {/* Settings gear button to open configuration modal */}
              <button
                onClick={onOpenSyncModal}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Configure Sheet Sync Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export to Excel */}
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all hover:border-slate-600"
              title="Export database to Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Credential Vault Button */}
            <button
              onClick={onOpenVaultModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-500/30 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Vault</span>
            </button>

            {/* Lock / Unlock Security PIN */}
            <button
              onClick={onTogglePinLock}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                isPinLocked
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/80'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
              title={isPinLocked ? 'Vault is Locked' : 'Lock Credentials Vault'}
            >
              {isPinLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Unlocked</span>
                </>
              )}
            </button>

            {/* Add Client Button */}
            <button
              onClick={onOpenAddClientModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">+ Add Client</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Input Row */}
        {isMobileSearchOpen && (
          <div className="relative w-full md:hidden pt-1 pb-1 animate-fadeIn">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients, domains, credentials, stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl glass-input placeholder-slate-500 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
