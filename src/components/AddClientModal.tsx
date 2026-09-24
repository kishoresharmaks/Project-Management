import React, { useState } from 'react';
import { X, Plus, Globe, Server, User, Mail, IndianRupee, Search, CheckCircle2 } from 'lucide-react';
import type { ClientProject, ProjectStatus, BillingFrequency } from '../types/client';
import { inspectDomainSpecs, cleanDomainName } from '../services/dnsInspectorService';

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
  const [serverIp, setServerIp] = useState('');
  const [sslExpiryDate, setSslExpiryDate] = useState('');
  const [domainRenewalDate, setDomainRenewalDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [cmsFramework, setCmsFramework] = useState('WordPress 6.6');
  const [hostingProvider, setHostingProvider] = useState('SiteGround / Cloud');
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');
  const [projectCost, setProjectCost] = useState<number>(15000);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [wpUser, setWpUser] = useState('');
  const [wpPass, setWpPass] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectMessage, setInspectMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAutoInspect = async () => {
    const cleaned = cleanDomainName(domain);
    if (!cleaned) {
      setInspectMessage('Please enter a domain name first (e.g. beeshubfarmland.com)');
      return;
    }

    setIsInspecting(true);
    setInspectMessage(null);

    try {
      const result = await inspectDomainSpecs(cleaned);
      setDomain(result.domain);
      if (result.serverIp && result.serverIp !== '127.0.0.1') setServerIp(result.serverIp);
      if (result.hostingProvider) setHostingProvider(result.hostingProvider);
      if (result.sslExpiryDate) setSslExpiryDate(result.sslExpiryDate);
      if (result.domainRenewalDate) setDomainRenewalDate(result.domainRenewalDate);

      setInspectMessage(`Fetched IP (${result.serverIp}), Host (${result.hostingProvider}) & Registrar (${result.registrar})`);
    } catch (err: any) {
      setInspectMessage(`Could not inspect domain: ${err.message}`);
    } finally {
      setIsInspecting(false);
    }
  };

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
      billingFrequency,
      projectCost,
      monthlyRetainer: projectCost,
      primaryContact: {
        name: contactName || 'Primary Contact',
        email: contactEmail || '',
      },
      serverIp: serverIp || undefined,
      sslStatus: 'active',
      sslExpiryDate: sslExpiryDate || undefined,
      domainRenewalDate: domainRenewalDate || undefined,
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

            <div className="sm:col-span-2 glass-card p-3 rounded-2xl border border-blue-500/20 bg-blue-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-400" /> Primary Domain *
                </label>
                <button
                  type="button"
                  onClick={handleAutoInspect}
                  disabled={isInspecting}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
                  title="Auto-fetch Server IP, Hosting Provider & SSL Expiry via DNS & WHOIS"
                >
                  <Search className={`w-3.5 h-3.5 ${isInspecting ? 'animate-spin' : ''}`} />
                  <span>{isInspecting ? 'Inspecting...' : '🔍 Auto-Inspect Specs'}</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="beeshubfarmland.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl glass-input font-mono text-slate-100"
              />
              {inspectMessage && (
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{inspectMessage}</span>
                </div>
              )}
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
              <label className="text-slate-400 block mb-1">Billing Cycle</label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
                className="w-full p-2.5 rounded-xl glass-input"
              >
                <option value="monthly">Monthly Retainer</option>
                <option value="yearly">Yearly Contract</option>
                <option value="one_time">One-Time Project Fee</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Project Cost (₹)
              </label>
              <input
                type="number"
                placeholder="Cost in Rupees (₹)"
                value={projectCost}
                onChange={(e) => setProjectCost(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl glass-input font-bold text-emerald-400"
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
