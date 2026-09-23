import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  Link,
  RefreshCw,
  Check,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import type { SheetSyncConfig, ClientProject } from '../types/client';
import { fetchAndParseOnlineSheetUrl, parseExcelFile, exportClientsToExcel } from '../services/excelSyncService';

interface SheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SheetSyncConfig;
  onSaveConfig: (config: SheetSyncConfig) => void;
  clients: ClientProject[];
  onImportClients: (imported: ClientProject[]) => void;
}

export const SheetSyncModal: React.FC<SheetSyncModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onSaveConfig,
  clients,
  onImportClients,
}) => {
  const [sheetUrl, setSheetUrl] = useState(syncConfig.sheetUrl || '');
  const [intervalSec, setIntervalSec] = useState(syncConfig.autoSyncIntervalMinutes || 10);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const isEnvUrlActive = Boolean(import.meta.env.VITE_SHEET_SYNC_URL);

  if (!isOpen) return null;

  const handleFetchOnlineSheet = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);

    try {
      const parsedClients = await fetchAndParseOnlineSheetUrl(sheetUrl);
      if (parsedClients.length === 0) {
        throw new Error('No client rows found in the provided sheet.');
      }

      onImportClients(parsedClients);
      onSaveConfig({
        ...syncConfig,
        syncType: 'google_sheet_csv',
        sheetUrl: sheetUrl || import.meta.env.VITE_SHEET_SYNC_URL || '',
        autoSyncIntervalMinutes: Number(intervalSec),
        lastSyncTime: new Date().toLocaleTimeString(),
        syncStatus: 'success',
      });

      setSyncSuccess(`Successfully imported & synced ${parsedClients.length} client projects!`);
    } catch (err: any) {
      setSyncError(err.message || 'Failed to sync with Online Sheet.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);

    try {
      const parsed = await parseExcelFile(file);
      onImportClients(parsed);
      setSyncSuccess(`Successfully imported ${parsed.length} client projects from ${file.name}!`);
    } catch (err: any) {
      setSyncError('Failed to parse uploaded Excel file. Ensure valid .xlsx format.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportAll = () => {
    exportClientsToExcel(clients, `Client_Projects_Database_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-3xl flex flex-col border border-emerald-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Realtime Online Excel & Google Sheet Sync
              </h2>
              <p className="text-xs text-slate-400">Automatic background polling & encrypted configuration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Notifications */}
          {syncError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {syncSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{syncSuccess}</span>
            </div>
          )}

          {/* SECTION 1: Online Sheet URL Sync */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <Link className="w-4 h-4 text-emerald-400" /> Published Google Sheet / Excel CSV URL
              </h3>
              {isEnvUrlActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Locked in .ENV
                </span>
              )}
            </div>

            <form onSubmit={handleFetchOnlineSheet} className="space-y-3">
              <div>
                <input
                  type="url"
                  placeholder={
                    isEnvUrlActive
                      ? '•••••••• URL configured in .env (Hidden for Security) ••••••••'
                      : 'https://docs.google.com/spreadsheets/d/.../export?format=csv'
                  }
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 text-[11px] whitespace-nowrap">Auto-Sync Interval:</label>
                  <select
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                    className="p-1.5 rounded-lg glass-input text-xs"
                  >
                    <option value={5}>Every 5 Seconds</option>
                    <option value={10}>Every 10 Seconds</option>
                    <option value={30}>Every 30 Seconds</option>
                    <option value={60}>Every 1 Minute</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: Local Excel File (.xlsx) Import */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <Upload className="w-4 h-4 text-blue-400" /> Upload Local Excel Spreadsheet (.xlsx / .csv)
            </h3>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl cursor-pointer bg-slate-900/50 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="font-semibold text-slate-200">Click to Select Excel File</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Supports .xlsx and .csv files</span>
              <input type="file" accept=".xlsx, .csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* SECTION 3: Database Export */}
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <Download className="w-4 h-4 text-indigo-400" /> Export Database to Excel Workbook
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Generates a multi-tab `.xlsx` file containing Client Overview and Credentials Vault.
              </p>
            </div>
            <button
              onClick={handleExportAll}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
            >
              Export XLSX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
