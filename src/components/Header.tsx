import React from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  Unlock,
  ShieldAlert,
  Server,
  Download,
} from 'lucide-react';
import type { SheetSyncConfig } from '../types/client';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  syncConfig: SheetSyncConfig;
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
  onOpenSyncModal,
  onOpenAddClientModal,
  onOpenVaultModal,
  onExportExcel,
  isPinLocked,
  onTogglePinLock,
  totalClientsCount,
}) => {
  const isEnvConfigured = Boolean(import.meta.env.VITE_SHEET_SYNC_URL);

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Search */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  ClientPulse <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Vault Pro</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>{totalClientsCount} Active Projects</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live" /> Realtime Cloud Sync
                </span>
              </p>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="relative w-full max-w-xs hidden sm:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients, domains, credentials, stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Sheet Sync Status Button */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all hover:border-slate-600"
            title="Configure Secure Cloud Excel Sync"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Live Sheet:</span>
            <span className="text-emerald-400 font-semibold">{isEnvConfigured ? '.ENV Connected' : 'Live Polling'}</span>
            <RefreshCw className={`w-3 h-3 text-slate-400 ${syncConfig.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </button>

          {/* Export to Excel */}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all hover:border-slate-600"
            title="Export database to Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          {/* Credential Vault Quick Launch */}
          <button
            onClick={onOpenVaultModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-500/30 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            <span>Vault</span>
          </button>

          {/* Master PIN Lock Toggle */}
          <button
            onClick={onTogglePinLock}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
              isPinLocked
                ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/80'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
            title={isPinLocked ? 'Vault is Locked (Passes hidden)' : 'Lock Credentials Vault'}
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
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>
      </div>
    </header>
  );
};
