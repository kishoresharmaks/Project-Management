import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ArrowUpDown, Key, Edit3, ShieldAlert } from 'lucide-react';
import type { ClientProject } from '../types/client';

interface ClientTableViewProps {
  clients: ClientProject[];
  onOpenDetailModal: (client: ClientProject) => void;
  onCopyText: (text: string, label: string) => void;
}

export const ClientTableView: React.FC<ClientTableViewProps> = ({
  clients,
  onOpenDetailModal,
  onCopyText,
}) => {
  const [sortField, setSortField] = useState<keyof ClientProject>('clientName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSort = (field: keyof ClientProject) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleCopy = (e: React.MouseEvent, text: string, id: string, label: string) => {
    e.stopPropagation();
    onCopyText(text, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold select-none">
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('clientName')}>
                <div className="flex items-center gap-1.5">
                  <span>Client & Company</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('domain')}>
                <div className="flex items-center gap-1.5">
                  <span>Domain / Staging</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Framework / Stack</th>
              <th className="py-3 px-4">Hosting Provider</th>
              <th className="py-3 px-4">SSL Expiry</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('monthlyRetainer')}>
                <div className="flex items-center gap-1.5">
                  <span>Retainer</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Creds</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedClients.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No matching client projects found.
                </td>
              </tr>
            ) : (
              sortedClients.map((client) => {
                return (
                  <tr
                    key={client.id}
                    onClick={() => onOpenDetailModal(client)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Client Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs shrink-0">
                          {client.clientName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {client.clientName}
                          </p>
                          <p className="text-[11px] text-slate-400">{client.company}</p>
                        </div>
                      </div>
                    </td>

                    {/* Domain & Staging */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-300">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
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
                          className="hover:text-blue-400 hover:underline"
                        >
                          {client.domain}
                        </a>
                        <button
                          onClick={(e) => handleCopy(e, `https://${client.domain}`, `domain-${client.id}`, 'Domain URL')}
                          className="p-1 text-slate-500 hover:text-slate-200 rounded"
                        >
                          {copiedId === `domain-${client.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-[10px] font-semibold rounded-full capitalize ${
                          client.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : client.status === 'in_development'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : client.status === 'maintenance'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {client.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* CMS / Framework */}
                    <td className="py-3 px-4 text-slate-300">
                      <span>{client.cmsFramework}</span>
                    </td>

                    {/* Hosting Provider */}
                    <td className="py-3 px-4 text-slate-300">
                      <span>{client.hostingProvider}</span>
                    </td>

                    {/* SSL Expiry */}
                    <td className="py-3 px-4">
                      {client.sslStatus === 'expiring_soon' ? (
                        <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px]">
                          <ShieldAlert className="w-3 h-3" /> {client.sslExpiryDate || 'Expiring'}
                        </span>
                      ) : client.sslStatus === 'expired' ? (
                        <span className="text-rose-400 font-medium">Expired</span>
                      ) : (
                        <span className="text-slate-400">{client.sslExpiryDate || 'Active'}</span>
                      )}
                    </td>

                    {/* Monthly Retainer */}
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      {client.monthlyRetainer ? `$${client.monthlyRetainer}` : '-'}
                    </td>

                    {/* Credentials Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-medium">
                        <Key className="w-3 h-3 text-indigo-400" />
                        {client.credentials.length}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetailModal(client);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors"
                          title="Edit Client Specs & Credentials"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <a
                          href={`https://${client.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Open Live Website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
