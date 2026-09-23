export type ProjectStatus = 'active' | 'in_development' | 'maintenance' | 'paused' | 'archived';
export type HealthStatus = 'online' | 'warning' | 'offline' | 'checking';
export type SslStatus = 'active' | 'expiring_soon' | 'expired' | 'none';

export type CredentialCategory =
  | 'wp_admin'
  | 'ftp_sftp'
  | 'hosting_cpanel'
  | 'database'
  | 'dns'
  | 'api_key'
  | 'custom';

export interface CredentialItem {
  id: string;
  category: CredentialCategory;
  label: string;
  hostUrl: string;
  username: string;
  password: string;
  notes?: string;
  isPinProtected?: boolean;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

export interface ClientProject {
  id: string;
  clientName: string;
  company: string;
  domain: string;
  stagingUrl?: string;
  status: ProjectStatus;
  healthStatus: HealthStatus;
  cmsFramework: string; // e.g. WordPress, Next.js, Shopify, Laravel
  phpNodeVersion?: string; // e.g. PHP 8.2, Node 20
  hostingProvider: string; // e.g. SiteGround, AWS, Vercel, Hostinger
  serverIp?: string;
  sslStatus: SslStatus;
  sslExpiryDate?: string;
  domainRenewalDate?: string;
  monthlyRetainer?: number; // e.g. 500 ($)
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
  };
  tags: string[];
  notes?: string;
  lastBackupDate?: string;
  credentials: CredentialItem[];
  tasks: ProjectTask[];
  lastSyncDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SheetSyncConfig {
  syncType: 'google_sheet_csv' | 'sheet_api' | 'local_file' | 'demo';
  sheetUrl?: string;
  apiKey?: string;
  autoSyncIntervalMinutes: number; // 0 for manual
  lastSyncTime?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncErrorMessage?: string;
}
