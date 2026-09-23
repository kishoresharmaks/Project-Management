import React, { useState } from 'react';
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
} from 'lucide-react';
import type { SheetSyncConfig } from '../types/client';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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
  const isSyncing = syncConfig.syncStatus === 'syncing';
  const hasSyncError = syncConfig.syncStatus === 'error';
  const isSyncSuccess = syncConfig.syncStatus === 'success';

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

          {/* Desktop Search Bar */}
          <div className="relative w-full max-w-sm hidden md:block mx-4">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search clients, domains, credentials, stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl glass-input placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
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

          {/* Right Action Buttons */}
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
