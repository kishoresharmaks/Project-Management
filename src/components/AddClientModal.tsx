import React, { useState } from 'react';
import { X, Plus, Globe, Server, User, Mail, DollarSign } from 'lucide-react';
import type { ClientProject, ProjectStatus } from '../types/client';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: ClientProject) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onAddClient }) => {
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState('');
  const [stagingUrl, setStagingUrl] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [cmsFramework, setCmsFramework] = useState('WordPress 6.6');
  const [hostingProvider, setHostingProvider] = useState('SiteGround / Cloud');
  const [monthlyRetainer, setMonthlyRetainer] = useState<number>(500);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [wpUser, setWpUser] = useState('');
  const [wpPass, setWpPass] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !domain) return;

    const newClient: ClientProject = {
      id: `client-${Date.now()}`,
      clientName,
      company: company || clientName,
      domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      stagingUrl: stagingUrl ? stagingUrl.replace(/^https?:\/\//, '') : undefined,
      status,
      healthStatus: 'online',
      cmsFramework,
      hostingProvider,
      monthlyRetainer,
      primaryContact: {
        name: contactName || 'Primary Contact',
        email: contactEmail || '',
      },
      sslStatus: 'active',
      tags: ['New Client'],
      credentials: wpUser
        ? [
            {
              id: `cred-${Date.now()}`,
              category: 'wp_admin',
              label: 'WP Admin Login',
              hostUrl: `https://${domain}/wp-admin`,
              username: wpUser,
              password: wpPass,
              updatedAt: new Date().toISOString().split('T')[0],
            },
          ]
        : [],
      tasks: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onAddClient(newClient);
    onClose();

    // Reset Form
    setClientName('');
    setCompany('');
    setDomain('');
    setStagingUrl('');
    setWpUser('');
    setWpPass('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-3xl flex flex-col border border-slate-700/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add New Client Project</h2>
              <p className="text-xs text-slate-400">Register website details, stack, and initial credentials</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Client Name *</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Company Entity</label>
              <input
                type="text"
                placeholder="e.g. Acme Technologies LLC"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" /> Primary Domain *
              </label>
              <input
                type="text"
                placeholder="acmecorp.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl glass-input font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-indigo-400" /> Staging URL
              </label>
              <input
                type="text"
                placeholder="dev.acmecorp.com"
                value={stagingUrl}
                onChange={(e) => setStagingUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Project Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full p-2.5 rounded-xl glass-input"
              >
                <option value="active">Active</option>
                <option value="in_development">In Development</option>
                <option value="maintenance">Care Plan Maintenance</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Monthly Retainer ($)
              </label>
              <input
                type="number"
                value={monthlyRetainer}
                onChange={(e) => setMonthlyRetainer(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">CMS / Framework</label>
              <input
                type="text"
                placeholder="e.g. Next.js 15, WordPress, Shopify"
                value={cmsFramework}
                onChange={(e) => setCmsFramework(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Hosting Provider</label>
              <input
                type="text"
                placeholder="e.g. Vercel, SiteGround, AWS"
                value={hostingProvider}
                onChange={(e) => setHostingProvider(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Contact Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-400" /> Contact Email
              </label>
              <input
                type="email"
                placeholder="john@acmecorp.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>
          </div>

          {/* Optional Initial Admin Credentials */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-300 text-xs">Initial Admin Login (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="WP Admin Username"
                value={wpUser}
                onChange={(e) => setWpUser(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input font-mono"
              />
              <input
                type="password"
                placeholder="WP Admin Password"
                value={wpPass}
                onChange={(e) => setWpPass(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25"
            >
              Save Client Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
