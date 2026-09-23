import React, { useState } from 'react';
import {
  X,
  Globe,
  Key,
  CheckSquare,
  FileSpreadsheet,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  Server,
  ShieldCheck,
  User,
  Mail,
  Phone,
  DollarSign,
  Save,
  Lock,
  Edit3,
} from 'lucide-react';
import type { ClientProject, CredentialCategory, CredentialItem, ProjectTask, ProjectStatus } from '../types/client';

interface ClientDetailModalProps {
  client: ClientProject;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClient: (updated: ClientProject) => void;
  onDeleteClient: (id: string) => void;
  onCopyText: (text: string, label: string) => void;
  isPinLocked: boolean;
  onRequestPinUnlock: () => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onUpdateClient,
  onDeleteClient,
  onCopyText,
  isPinLocked,
  onRequestPinUnlock,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'creds' | 'tasks' | 'excel'>('overview');
  const [revealedCreds, setRevealedCreds] = useState<Record<string, boolean>>({});
  const [copiedCredId, setCopiedCredId] = useState<string | null>(null);

  // Editable Form State
  const [formData, setFormData] = useState<ClientProject>(client);
  const [isEditing, setIsEditing] = useState(false);

  // New Credential Form State
  const [showAddCred, setShowAddCred] = useState(false);
  const [newCredCategory, setNewCredCategory] = useState<CredentialCategory>('wp_admin');
  const [newCredLabel, setNewCredLabel] = useState('');
  const [newCredHost, setNewCredHost] = useState('');
  const [newCredUser, setNewCredUser] = useState('');
  const [newCredPass, setNewCredPass] = useState('');
  const [newCredNotes, setNewCredNotes] = useState('');

  // Inline Credential Edit State
  const [editingCredId, setEditingCredId] = useState<string | null>(null);
  const [editCredData, setEditCredData] = useState<CredentialItem | null>(null);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');

  React.useEffect(() => {
    setFormData(client);
  }, [client]);

  if (!isOpen) return null;

  const handleStartEditCred = (cred: CredentialItem) => {
    setEditingCredId(cred.id);
    setEditCredData({ ...cred });
  };

  const handleSaveEditCred = () => {
    if (!editCredData || !editCredData.label.trim()) return;

    const updatedCreds = formData.credentials.map((c) =>
      c.id === editCredData.id ? { ...editCredData, updatedAt: new Date().toISOString().split('T')[0] } : c
    );

    const updatedClient: ClientProject = {
      ...formData,
      credentials: updatedCreds,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setFormData(updatedClient);
    onUpdateClient(updatedClient);
    setEditingCredId(null);
    setEditCredData(null);
  };

  const togglePasswordReveal = (id: string) => {
    if (isPinLocked) {
      onRequestPinUnlock();
      return;
    }
    setRevealedCreds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, id: string, label: string) => {
    onCopyText(text, label);
    setCopiedCredId(id);
    setTimeout(() => setCopiedCredId(null), 2000);
  };

  const handleSaveOverview = () => {
    onUpdateClient(formData);
    setIsEditing(false);
  };

  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredLabel || !newCredUser) return;

    const newCred: CredentialItem = {
      id: `cred-${Date.now()}`,
      category: newCredCategory,
      label: newCredLabel,
      hostUrl: newCredHost || formData.domain,
      username: newCredUser,
      password: newCredPass,
      notes: newCredNotes,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updated = {
      ...formData,
      credentials: [...formData.credentials, newCred],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setFormData(updated);
    onUpdateClient(updated);

    // Reset Form
    setNewCredLabel('');
    setNewCredHost('');
    setNewCredUser('');
    setNewCredPass('');
    setNewCredNotes('');
    setShowAddCred(false);
  };

  const handleDeleteCredential = (credId: string) => {
    const updated = {
      ...formData,
      credentials: formData.credentials.filter((c) => c.id !== credId),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setFormData(updated);
    onUpdateClient(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      status: 'pending',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
    };

    const updated = {
      ...formData,
      tasks: [...formData.tasks, newTask],
    };

    setFormData(updated);
    onUpdateClient(updated);
    setNewTaskTitle('');
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = formData.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: t.status === 'completed' ? ('pending' as const) : ('completed' as const),
        };
      }
      return t;
    });

    const updated = {
      ...formData,
      tasks: updatedTasks,
    };
    setFormData(updated);
    onUpdateClient(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-3xl flex flex-col border border-slate-700/60 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-xl text-blue-400">
                {formData.clientName.charAt(0)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight">{formData.clientName}</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 capitalize">
                  {formData.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <a
                  href={`https://${formData.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 font-mono"
                >
                  {formData.domain} <ExternalLink className="w-3 h-3" />
                </a>
                <span>&bull;</span>
                <span>{formData.company}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Details
              </button>
            ) : (
              <button
                onClick={handleSaveOverview}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" /> Save & Sync
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-900/40 border-b border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Overview & Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('creds')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'creds'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Credentials Vault ({formData.credentials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'tasks'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks ({formData.tasks.filter((t) => t.status !== 'completed').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'excel'
                ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Raw Sheet Data</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW & SPECS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Actions Bar */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Website Specifications & Hosting Details
                </span>
                {isEditing && (
                  <span className="text-xs text-blue-400 font-medium animate-pulse">
                    Editing Mode Active &mdash; Make changes and click Save
                  </span>
                )}
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Client Name */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Client Name
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input"
                    />
                  ) : (
                    <p className="text-sm font-bold text-white">{formData.clientName}</p>
                  )}
                </div>

                {/* Company Entity */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 mb-1 block">Company Entity</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-slate-200">{formData.company}</p>
                  )}
                </div>

                {/* Status */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 mb-1 block">Project Status</span>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                      className="w-full text-xs p-2 rounded-lg glass-input capitalize"
                    >
                      <option value="active">Active</option>
                      <option value="in_development">In Development</option>
                      <option value="maintenance">Maintenance Care Plan</option>
                      <option value="paused">Paused</option>
                      <option value="archived">Archived</option>
                    </select>
                  ) : (
                    <p className="text-xs font-bold text-emerald-400 capitalize">{formData.status.replace('_', ' ')}</p>
                  )}
                </div>

                {/* Domain */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                    <Globe className="w-3.5 h-3.5 text-blue-400" /> Primary Domain
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input font-mono"
                    />
                  ) : (
                    <div className="font-mono text-sm font-semibold text-white flex items-center justify-between">
                      <span>{formData.domain}</span>
                      <button
                        onClick={() => handleCopy(`https://${formData.domain}`, 'domain', 'Domain URL')}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Staging URL */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                    <Server className="w-3.5 h-3.5 text-indigo-400" /> Staging Preview
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.stagingUrl || ''}
                      onChange={(e) => setFormData({ ...formData, stagingUrl: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input font-mono"
                    />
                  ) : (
                    <div className="font-mono text-xs font-medium text-slate-300">
                      {formData.stagingUrl ? (
                        <a
                          href={`https://${formData.stagingUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline"
                        >
                          {formData.stagingUrl}
                        </a>
                      ) : (
                        <span className="text-slate-500">Not configured</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Hosting Provider */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                    <Server className="w-3.5 h-3.5 text-emerald-400" /> Hosting Provider
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.hostingProvider}
                      onChange={(e) => setFormData({ ...formData, hostingProvider: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-white">{formData.hostingProvider}</p>
                  )}
                </div>

                {/* CMS / Framework */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 mb-1 block">CMS / Framework</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.cmsFramework}
                      onChange={(e) => setFormData({ ...formData, cmsFramework: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-slate-200">{formData.cmsFramework}</p>
                  )}
                </div>

                {/* PHP / Node Version */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 mb-1 block">Stack Version</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.phpNodeVersion || ''}
                      onChange={(e) => setFormData({ ...formData, phpNodeVersion: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input"
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-300">{formData.phpNodeVersion || 'Default'}</p>
                  )}
                </div>

                {/* Monthly Retainer */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Monthly Retainer
                  </span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.monthlyRetainer || 0}
                      onChange={(e) => setFormData({ ...formData, monthlyRetainer: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-lg glass-input font-bold text-emerald-400"
                    />
                  ) : (
                    <p className="text-sm font-bold text-emerald-400">
                      ${formData.monthlyRetainer ? formData.monthlyRetainer.toLocaleString() : '0'}/mo
                    </p>
                  )}
                </div>

                {/* SSL Expiry */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> SSL Expiry Date
                  </span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.sslExpiryDate || ''}
                      onChange={(e) => setFormData({ ...formData, sslExpiryDate: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input font-mono"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-slate-200">{formData.sslExpiryDate || 'Active'}</p>
                  )}
                </div>

                {/* Domain Renewal */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 mb-1 block">Domain Renewal Date</span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.domainRenewalDate || ''}
                      onChange={(e) => setFormData({ ...formData, domainRenewalDate: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input font-mono"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-slate-200">{formData.domainRenewalDate || 'N/A'}</p>
                  )}
                </div>

                {/* Server IP */}
                <div className="glass-card rounded-2xl p-4">
                  <span className="text-xs text-slate-400 mb-1 block">Server IP Address</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.serverIp || ''}
                      onChange={(e) => setFormData({ ...formData, serverIp: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg glass-input font-mono"
                    />
                  ) : (
                    <p className="text-xs font-mono text-slate-300">{formData.serverIp || 'Cloud Managed'}</p>
                  )}
                </div>
              </div>

              {/* Primary Contact Section */}
              <div className="glass-panel rounded-2xl p-4 border border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Primary Contact Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 flex items-center gap-1 mb-1">
                      <User className="w-3.5 h-3.5 text-blue-400" /> Contact Name
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.primaryContact.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primaryContact: { ...formData.primaryContact, name: e.target.value },
                          })
                        }
                        className="w-full p-2 rounded-lg glass-input"
                      />
                    ) : (
                      <p className="font-semibold text-white">{formData.primaryContact.name}</p>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 flex items-center gap-1 mb-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                    </span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.primaryContact.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primaryContact: { ...formData.primaryContact, email: e.target.value },
                          })
                        }
                        className="w-full p-2 rounded-lg glass-input"
                      />
                    ) : (
                      <a href={`mailto:${formData.primaryContact.email}`} className="text-blue-400 hover:underline">
                        {formData.primaryContact.email}
                      </a>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 flex items-center gap-1 mb-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.primaryContact.phone || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primaryContact: { ...formData.primaryContact, phone: e.target.value },
                          })
                        }
                        className="w-full p-2 rounded-lg glass-input"
                      />
                    ) : (
                      <p className="text-slate-300">{formData.primaryContact.phone || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Save & Delete Client Action */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  {isEditing && (
                    <button
                      onClick={handleSaveOverview}
                      className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                    >
                      <Save className="w-4 h-4" /> Save Changes & Sync to Sheet
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete client "${formData.clientName}"?`)) {
                      onDeleteClient(formData.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Client Record
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS VAULT */}
          {activeTab === 'creds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Stored Credentials ({formData.credentials.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Passwords are hidden by default. Click the eye icon to reveal or copy.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCred(!showAddCred)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Credential
                </button>
              </div>

              {/* Add Credential Sub-form */}
              {showAddCred && (
                <form
                  onSubmit={handleAddCredential}
                  className="glass-panel rounded-2xl p-4 border border-indigo-500/40 bg-indigo-950/20 space-y-3"
                >
                  <h4 className="text-xs font-bold text-indigo-300">Add New Credential</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Category</label>
                      <select
                        value={newCredCategory}
                        onChange={(e) => {
                          const cat = e.target.value as CredentialCategory;
                          setNewCredCategory(cat);
                          if (!newCredHost) {
                            if (cat === 'wp_admin') setNewCredHost(`https://${formData.domain}/wp-admin`);
                            else if (cat === 'hosting_cpanel') setNewCredHost(`https://${formData.domain}:2083`);
                            else if (cat === 'ftp_sftp') setNewCredHost(`ftp.${formData.domain}`);
                          }
                        }}
                        className="w-full p-2 rounded-lg glass-input text-xs"
                      >
                        <option value="wp_admin">WordPress Admin</option>
                        <option value="ftp_sftp">FTP / SFTP</option>
                        <option value="hosting_cpanel">Hosting / CPanel</option>
                        <option value="database">Database</option>
                        <option value="dns">DNS / Cloudflare</option>
                        <option value="api_key">API Key / Token</option>
                        <option value="custom">Custom Login</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Label / Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Production Admin Login"
                        value={newCredLabel}
                        onChange={(e) => setNewCredLabel(e.target.value)}
                        required
                        className="w-full p-2 rounded-lg glass-input text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-slate-400 block mb-1 flex items-center justify-between">
                        <span>Host / Login URL (Customizable Link)</span>
                        <span className="text-[10px] text-blue-400 font-normal">Editable URL</span>
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. https://${formData.domain}/wp-admin`}
                        value={newCredHost}
                        onChange={(e) => setNewCredHost(e.target.value)}
                        className="w-full p-2 rounded-lg glass-input text-xs font-mono text-blue-300"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Username / Access Key *</label>
                      <input
                        type="text"
                        placeholder="Username"
                        value={newCredUser}
                        onChange={(e) => setNewCredUser(e.target.value)}
                        required
                        className="w-full p-2 rounded-lg glass-input text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Password / Secret Key</label>
                      <input
                        type="password"
                        placeholder="Password or Token"
                        value={newCredPass}
                        onChange={(e) => setNewCredPass(e.target.value)}
                        className="w-full p-2 rounded-lg glass-input text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCred(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                    >
                      Save Credential
                    </button>
                  </div>
                </form>
              )}

              {/* Credentials List */}
              <div className="space-y-3">
                {formData.credentials.length === 0 ? (
                  <div className="p-8 text-center glass-panel rounded-2xl text-slate-500 text-xs">
                    No credentials stored for this client yet. Click "Add Credential" to create one.
                  </div>
                ) : (
                  formData.credentials.map((cred) => {
                    const isRevealed = Boolean(revealedCreds[cred.id]);
                    const isEditingThis = editingCredId === cred.id && editCredData;

                    if (isEditingThis && editCredData) {
                      return (
                        <form
                          key={cred.id}
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveEditCred();
                          }}
                          className="glass-card rounded-2xl p-4 border border-blue-500/50 bg-blue-950/20 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <span className="text-xs font-bold text-blue-400">Edit Credential & Custom URL</span>
                            <span className="text-[10px] text-slate-500 font-mono">{cred.id}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-slate-400 block mb-1">Category</label>
                              <select
                                value={editCredData.category}
                                onChange={(e) =>
                                  setEditCredData({ ...editCredData, category: e.target.value as CredentialCategory })
                                }
                                className="w-full p-2 rounded-lg glass-input text-xs"
                              >
                                <option value="wp_admin">WordPress Admin</option>
                                <option value="ftp_sftp">FTP / SFTP</option>
                                <option value="hosting_cpanel">Hosting / CPanel</option>
                                <option value="database">Database</option>
                                <option value="dns">DNS / Cloudflare</option>
                                <option value="api_key">API Key / Token</option>
                                <option value="custom">Custom Login</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-slate-400 block mb-1">Label / Title *</label>
                              <input
                                type="text"
                                value={editCredData.label}
                                onChange={(e) => setEditCredData({ ...editCredData, label: e.target.value })}
                                required
                                className="w-full p-2 rounded-lg glass-input text-xs"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-slate-400 block mb-1 flex items-center justify-between">
                                <span>Host / Login URL (Custom Link)</span>
                                <span className="text-[10px] text-emerald-400">Customizable</span>
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. https://beeshubfarmland.com/wp-admin"
                                value={editCredData.hostUrl}
                                onChange={(e) => setEditCredData({ ...editCredData, hostUrl: e.target.value })}
                                className="w-full p-2 rounded-lg glass-input text-xs font-mono text-blue-300"
                              />
                            </div>

                            <div>
                              <label className="text-slate-400 block mb-1">Username / Access Key *</label>
                              <input
                                type="text"
                                value={editCredData.username}
                                onChange={(e) => setEditCredData({ ...editCredData, username: e.target.value })}
                                required
                                className="w-full p-2 rounded-lg glass-input text-xs font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-slate-400 block mb-1">Password / Secret Key</label>
                              <input
                                type="text"
                                value={editCredData.password}
                                onChange={(e) => setEditCredData({ ...editCredData, password: e.target.value })}
                                className="w-full p-2 rounded-lg glass-input text-xs font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCredId(null);
                                setEditCredData(null);
                              }}
                              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" /> Save Changes & Sync
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={cred.id}
                        className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-indigo-400 border border-slate-700 uppercase">
                              {cred.category.replace('_', ' ')}
                            </span>
                            <h4 className="text-sm font-semibold text-white">{cred.label}</h4>
                          </div>

                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 font-mono">
                            <span>User: <strong className="text-slate-200">{cred.username}</strong></span>
                            {cred.hostUrl ? (
                              <a
                                href={cred.hostUrl.startsWith('http') ? cred.hostUrl : `https://${cred.hostUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                                title="Click to open customizable link"
                              >
                                {cred.hostUrl} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-500 text-[11px]">(No URL configured)</span>
                            )}
                          </div>
                        </div>

                        {/* Password Mask & Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-200">
                            {isPinLocked ? (
                              <span className="text-slate-500 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-rose-400" /> Locked
                              </span>
                            ) : isRevealed ? (
                              <span>{cred.password || '(No Password)'}</span>
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
                            onClick={() => handleCopy(cred.password, cred.id, 'Password')}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Copy Password"
                          >
                            {copiedCredId === cred.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => handleStartEditCred(cred)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600/40 text-slate-300 hover:text-blue-300 transition-colors"
                            title="Edit Credential & Customizable URL"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteCredential(cred.id)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Credential"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a website maintenance task or milestone..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl glass-input text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                >
                  Add Task
                </button>
              </form>

              <div className="space-y-2">
                {formData.tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No tasks added for this project.</p>
                ) : (
                  formData.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`glass-card rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer border ${
                        task.status === 'completed'
                          ? 'opacity-60 border-slate-800'
                          : 'border-slate-700/60 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            task.status === 'completed'
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-slate-600'
                          }`}
                        >
                          {task.status === 'completed' && <Check className="w-3.5 h-3.5 font-bold" />}
                        </div>
                        <span
                          className={`text-xs ${
                            task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{task.dueDate}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RAW EXCEL SHEET INSPECTOR */}
          {activeTab === 'excel' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                This inspects the exact key-value mapping used when exporting or importing this client's row to/from Online Excel.
              </p>
              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
