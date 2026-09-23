import React from 'react';
import { ExternalLink, Key, CheckSquare, ShieldCheck, ShieldAlert, Cpu, Server, Copy, Check, Edit3 } from 'lucide-react';
import type { ClientProject } from '../types/client';

interface ClientCardProps {
  client: ClientProject;
  onOpenDetailModal: (client: ClientProject) => void;
  onCopyText: (text: string, label: string) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onOpenDetailModal, onCopyText }) => {
  const [copiedDomain, setCopiedDomain] = React.useState(false);

  const handleCopyDomain = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyText(`https://${client.domain}`, 'Domain URL');
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const getStatusBadge = () => {
    switch (client.status) {
      case 'active':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>;
      case 'in_development':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">In Dev</span>;
      case 'maintenance':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">Care Plan</span>;
      case 'paused':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">Paused</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-slate-700 text-slate-300">Archived</span>;
    }
  };

  const pendingTasksCount = client.tasks.filter((t) => t.status !== 'completed').length;

  return (
    <div
      onClick={() => onOpenDetailModal(client)}
      className="glass-card rounded-2xl p-5 cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all"
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700/70 flex items-center justify-center font-bold text-blue-400 text-base shadow-inner">
              {client.clientName.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                {client.clientName}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">{client.company}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {getStatusBadge()}
            {/* Direct Edit Trigger */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetailModal(client);
              }}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-700/60 transition-colors"
              title="Edit Client Data & Credentials"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Domain Link & Copy */}
        <div className="flex items-center justify-between rounded-xl bg-slate-900/80 border border-slate-800/80 px-3 py-2 mb-4 group/domain">
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                client.healthStatus === 'online'
                  ? 'bg-emerald-400 pulse-live'
                  : client.healthStatus === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <a
              href={`https://${client.domain}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-mono text-slate-200 hover:text-blue-400 hover:underline truncate"
            >
              {client.domain}
            </a>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyDomain}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              title="Copy URL"
            >
              {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={`https://${client.domain}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Tech Stack & Hosting Details */}
        <div className="space-y-2 mb-4 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Framework:
            </span>
            <span className="font-medium text-slate-200">{client.cmsFramework}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Server className="w-3.5 h-3.5 text-blue-400" /> Hosting:
            </span>
            <span className="font-medium text-slate-200 truncate max-w-[140px]" title={client.hostingProvider}>
              {client.hostingProvider}
            </span>
          </div>

          {/* SSL Status Pill */}
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              {client.sslStatus === 'expiring_soon' ? (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              SSL Status:
            </span>
            <span
              className={`font-medium ${
                client.sslStatus === 'expiring_soon'
                  ? 'text-amber-400 font-semibold'
                  : client.sslStatus === 'expired'
                  ? 'text-rose-400 font-semibold'
                  : 'text-emerald-400'
              }`}
            >
              {client.sslStatus === 'expiring_soon'
                ? `Expiring (${client.sslExpiryDate || 'Soon'})`
                : client.sslStatus === 'active'
                ? 'Valid SSL'
                : 'No SSL'}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {client.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 text-[10px] rounded-md bg-slate-800 text-slate-400 border border-slate-700/50">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 hover:text-indigo-300" title="Saved Credentials">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-200">{client.credentials.length}</span>
          </span>

          {pendingTasksCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400" title="Pending Tasks">
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="font-semibold">{pendingTasksCount}</span>
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetailModal(client);
          }}
          className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-all hover:bg-blue-500/20"
        >
          <Edit3 className="w-3 h-3" /> Edit Client
        </button>
      </div>
    </div>
  );
};
