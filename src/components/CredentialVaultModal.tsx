import React, { useState } from 'react';
import { X, Search, Eye, EyeOff, Copy, Check, Lock, ShieldAlert, Globe } from 'lucide-react';
import type { ClientProject, CredentialCategory } from '../types/client';

interface CredentialVaultModalProps {
  clients: ClientProject[];
  isOpen: boolean;
  onClose: () => void;
  onCopyText: (text: string, label: string) => void;
  isPinLocked: boolean;
  onRequestPinUnlock: () => void;
}

export const CredentialVaultModal: React.FC<CredentialVaultModalProps> = ({
  clients,
  isOpen,
  onClose,
  onCopyText,
  isPinLocked,
  onRequestPinUnlock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CredentialCategory | 'all'>('all');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Flatten all credentials across all clients
  const allCredentials: Array<{
    clientName: string;
    domain: string;
    clientId: string;
    id: string;
    category: CredentialCategory;
    label: string;
    hostUrl: string;
    username: string;
    password: string;
    notes?: string;
  }> = [];

  clients.forEach((client) => {
    client.credentials.forEach((cred) => {
      allCredentials.push({
        clientName: client.clientName,
        domain: client.domain,
        clientId: client.id,
        ...cred,
      });
    });
  });

  // Filter credentials
  const filteredCreds = allCredentials.filter((cred) => {
    const matchesCategory = selectedCategory === 'all' || cred.category === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      cred.label.toLowerCase().includes(q) ||
      cred.username.toLowerCase().includes(q) ||
      cred.clientName.toLowerCase().includes(q) ||
      cred.domain.toLowerCase().includes(q) ||
      cred.category.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const togglePasswordReveal = (id: string) => {
    if (isPinLocked) {
      onRequestPinUnlock();
      return;
    }
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPassword = (password: string, id: string, label: string) => {
    onCopyText(password, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-3xl flex flex-col border border-indigo-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Centralized Credentials Vault
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal">
                  {filteredCreds.length} credentials
                </span>
              </h2>
              <p className="text-xs text-slate-400">Search and access passwords across all client website projects</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-6 pb-2 border-b border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client, domain, username, or credential label..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input placeholder-slate-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl glass-input"
            >
              <option value="all">All Categories</option>
              <option value="wp_admin">WordPress Admin</option>
              <option value="ftp_sftp">FTP / SFTP</option>
              <option value="hosting_cpanel">Hosting / CPanel</option>
              <option value="database">Database</option>
              <option value="dns">DNS / Cloudflare</option>
              <option value="api_key">API Keys</option>
              <option value="custom">Custom Logins</option>
            </select>
          </div>
        </div>

        {/* Credential Cards List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredCreds.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching credentials found in the vault.
            </div>
          ) : (
            filteredCreds.map((cred) => {
              const isRevealed = Boolean(revealedIds[cred.id]);
              return (
                <div
                  key={cred.id}
                  className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800/80"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-indigo-300 border border-slate-700 uppercase">
                        {cred.category.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-white">{cred.label}</h4>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-semibold text-slate-200">
                        <Globe className="w-3 h-3 text-blue-400" /> {cred.clientName}
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-400">{cred.domain}</span>
                    </p>

                    <div className="text-xs text-slate-300 font-mono pt-1">
                      User: <span className="text-white font-semibold">{cred.username}</span>
                    </div>
                  </div>

                  {/* Actions & Pass */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-200">
                      {isPinLocked ? (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-rose-400" /> Locked
                        </span>
                      ) : isRevealed ? (
                        <span>{cred.password}</span>
                      ) : (
                        <span>••••••••••••</span>
                      )}
                    </div>

                    <button
                      onClick={() => togglePasswordReveal(cred.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title={isRevealed ? 'Hide Password' : 'Show Password'}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleCopyPassword(cred.password, cred.id, 'Password')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Copy Password"
                    >
                      {copiedId === cred.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
