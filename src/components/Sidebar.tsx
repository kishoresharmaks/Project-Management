import React from 'react';
import {
  LayoutDashboard,
  Globe,
  Table,
  Key,
  ShieldCheck,
  FileSpreadsheet,
  CheckSquare,
} from 'lucide-react';

export type MainTab = 'overview' | 'projects' | 'table' | 'vault' | 'domains' | 'sync';

interface SidebarProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  expiringSslCount: number;
  expiringDomainsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  expiringSslCount,
  expiringDomainsCount,
}) => {
  const totalAlerts = expiringSslCount + expiringDomainsCount;

  const navItems: Array<{ id: MainTab; label: string; icon: React.ReactNode; badge?: number }> = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'projects',
      label: 'Website Projects',
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'table',
      label: 'Spreadsheet View',
      icon: <Table className="w-4 h-4" />,
    },
    {
      id: 'vault',
      label: 'Credentials Vault',
      icon: <Key className="w-4 h-4" />,
    },
    {
      id: 'domains',
      label: 'Domain & SSL Monitor',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: totalAlerts > 0 ? totalAlerts : undefined,
    },
    {
      id: 'sync',
      label: 'Online Sheet Sync',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-full lg:w-64 glass-panel border-r border-slate-800/80 p-4 shrink-0 flex lg:flex-col justify-between overflow-x-auto">
      <div className="flex lg:flex-col gap-1.5 w-full">
        <div className="hidden lg:block px-3 py-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="hidden lg:block mt-6 pt-4 border-t border-slate-800/80">
        <div className="rounded-xl p-3 bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>Excel Bi-Directional</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All project data & credentials auto-sync with online Excel or Google Sheets.
          </p>
        </div>
      </div>
    </aside>
  );
};
