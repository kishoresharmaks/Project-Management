import * as XLSX from 'xlsx';
import type { ClientProject, ProjectStatus, HealthStatus, SslStatus, BillingFrequency } from '../types/client';

// Initial empty clients list
export const INITIAL_CLIENTS: ClientProject[] = [];

/**
 * Export Client Projects to Excel (.xlsx) file downloaded in browser
 */
export function exportClientsToExcel(clients: ClientProject[], fileName = 'Client_Websites_Credentials_Export.xlsx') {
  const overviewRows = clientsToOverviewRows(clients);
  const credRows = clientsToCredRows(clients);

  const wb = XLSX.utils.book_new();

  const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Client Overview');

  const wsCreds = XLSX.utils.json_to_sheet(credRows);
  XLSX.utils.book_append_sheet(wb, wsCreds, 'Credentials Vault');

  XLSX.writeFile(wb, fileName);
}

/**
 * Convert ClientProject[] to raw sheet overview rows
 */
function clientsToOverviewRows(clients: ClientProject[]) {
  return clients.map((c) => ({
    'ID': c.id,
    'Client Name': c.clientName,
    'Company': c.company,
    'Domain': c.domain,
    'Staging URL': c.stagingUrl || '',
    'Status': c.status,
    'Health': c.healthStatus,
    'CMS / Framework': c.cmsFramework,
    'Stack Version': c.phpNodeVersion || '',
    'Hosting Provider': c.hostingProvider,
    'Server IP': c.serverIp || '',
    'SSL Status': c.sslStatus,
    'SSL Expiry': c.sslExpiryDate || '',
    'Domain Renewal': c.domainRenewalDate || '',
    'Billing Frequency': c.billingFrequency || 'monthly',
    'Project Cost (₹)': c.projectCost !== undefined ? c.projectCost : (c.monthlyRetainer || 0),
    'Monthly Retainer ($)': c.projectCost !== undefined ? c.projectCost : (c.monthlyRetainer || 0),
    'Contact Name': c.primaryContact.name,
    'Contact Email': c.primaryContact.email,
    'Contact Phone': c.primaryContact.phone || '',
    'Tags': c.tags.join(', '),
    'Last Backup': c.lastBackupDate || '',
    'Notes': c.notes || '',
    'Last Sync': c.lastSyncDate || '',
  }));
}

/**
 * Convert ClientProject[] to raw sheet credentials rows
 */
function clientsToCredRows(clients: ClientProject[]) {
  const credRows: Array<Record<string, string>> = [];
  clients.forEach((c) => {
    c.credentials.forEach((cred) => {
      credRows.push({
        'Client ID': c.id,
        'Client Name': c.clientName,
        'Domain': c.domain,
        'Category': cred.category,
        'Label / Title': cred.label,
        'Host / URL': cred.hostUrl,
        'Username': cred.username,
        'Password / Key': cred.password,
        'Notes': cred.notes || '',
        'Updated At': cred.updatedAt,
      });
    });
  });
  return credRows;
}

/**
 * Push Updated Client Records back to Online Sheet (Bi-directional Write-Back Sync)
 */
export async function pushFullDatabaseToOnlineSheet(clients: ClientProject[]): Promise<boolean> {
  const writeEndpoint = import.meta.env.VITE_SHEET_WRITE_ENDPOINT || import.meta.env.VITE_CUSTOM_API_ENDPOINT;
  if (!writeEndpoint) {
    console.warn('No VITE_SHEET_WRITE_ENDPOINT configured in .env for write-back sync.');
    return false;
  }

  const overviewRows = clientsToOverviewRows(clients);
  const credRows = clientsToCredRows(clients);

  const payload = {
    action: 'update_all',
    clients: overviewRows,
    credentials: credRows,
    updatedAt: new Date().toISOString(),
  };

  try {
    const response = await fetch(writeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (err) {
    console.error('Failed to push update to Online Sheet endpoint', err);
    return false;
  }
}

/**
 * Parse an Excel file (.xlsx) or CSV buffer/file object into ClientProject[] array
 */
export async function parseExcelFile(file: File): Promise<ClientProject[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  return parseWorkbook(workbook);
}

/**
 * Fetch and parse Online Sheet Data (Supports Public CSV, Private Google Sheets API, Apps Script, and SheetDB endpoints)
 */
export async function fetchAndParseOnlineSheetUrl(sheetUrlOverride?: string): Promise<ClientProject[]> {
  const envApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const envSheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
  const envSheetName = import.meta.env.VITE_GOOGLE_SHEET_NAME || 'Sheet1';
  const envCustomEndpoint = import.meta.env.VITE_CUSTOM_API_ENDPOINT;
  const envUrl = import.meta.env.VITE_SHEET_SYNC_URL;

  // PRIORITY 1: Custom API Endpoint (Google Apps Script Web App / SheetDB) - 2-Way Sync
  if (!sheetUrlOverride && envCustomEndpoint) {
    try {
      return await fetchCustomJsonEndpoint(envCustomEndpoint);
    } catch (err) {
      console.warn('Custom API Endpoint fetch failed, attempting backup sync methods...', err);
    }
  }

  // PRIORITY 2: Private Google Sheets API (Key + Spreadsheet ID)
  if (!sheetUrlOverride && envApiKey && envSheetId) {
    try {
      return await fetchPrivateGoogleSheetApi(envSheetId, envApiKey, envSheetName);
    } catch (err: any) {
      if (err.message && err.message.includes('403')) {
        throw new Error(
          'Google Sheet Access Forbidden (HTTP 403). Open your Google Sheet -> Click Share -> Set to "Anyone with the link can view". Or use your deployed Google Apps Script URL.'
        );
      }
      throw err;
    }
  }

  // PRIORITY 3: Standard Published CSV / URL
  let targetUrl = (sheetUrlOverride || envUrl || '').trim();

  if (!targetUrl) {
    throw new Error('No Online Sheet configured. Please set VITE_CUSTOM_API_ENDPOINT or VITE_SHEET_SYNC_URL in .env');
  }

  // Format Google Sheet URLs to CSV format if required
  if (targetUrl.includes('docs.google.com/spreadsheets') && !targetUrl.includes('export?format=csv')) {
    if (targetUrl.includes('/edit')) {
      targetUrl = targetUrl.replace(/\/edit.*$/, '/export?format=csv');
    } else if (!targetUrl.includes('/export')) {
      targetUrl = `${targetUrl.replace(/\/$/, '')}/export?format=csv`;
    }
  }

  const cacheBustUrl = targetUrl.includes('?') 
    ? `${targetUrl}&_t=${Date.now()}`
    : `${targetUrl}?_t=${Date.now()}`;

  const response = await fetch(cacheBustUrl, {
    method: 'GET',
    referrerPolicy: 'no-referrer',
    headers: {
      'Accept': 'text/csv, application/json, text/plain, */*',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Sheet is PRIVATE (HTTP 401/403). Share Google Sheet as "Anyone with link can view" or use Google Apps Script URL.');
    }
    throw new Error(`Failed to fetch online sheet. Server status: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const workbook = XLSX.read(text, { type: 'string' });

  return parseWorkbook(workbook);
}

/**
 * Helper to fetch Private Google Sheet via Google Sheets API v4
 */
async function fetchPrivateGoogleSheetApi(sheetId: string, apiKey: string, sheetName: string): Promise<ClientProject[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Sheets API Error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const values: string[][] = json.values;

  if (!values || values.length < 2) {
    return [];
  }

  const headers = values[0];
  const objectRows = values.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = row[idx] || '';
    });
    return obj;
  });

  return convertRawRowsToClients(objectRows);
}

/**
 * Helper to fetch Custom JSON Endpoint (Google Apps Script Web App / SheetDB)
 */
async function fetchCustomJsonEndpoint(endpointUrl: string): Promise<ClientProject[]> {
  const cacheBustUrl = endpointUrl.includes('?') 
    ? `${endpointUrl}&_t=${Date.now()}`
    : `${endpointUrl}?_t=${Date.now()}`;

  const response = await fetch(cacheBustUrl);
  if (!response.ok) {
    throw new Error(`Custom API Endpoint Error (${response.status})`);
  }

  const json = await response.json();
  if (Array.isArray(json)) {
    if (json.length > 0 && Array.isArray(json[0])) {
      const headers = json[0];
      const objectRows = json.slice(1).map((row: any[]) => {
        const obj: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          obj[String(h).trim()] = row[idx] || '';
        });
        return obj;
      });
      return convertRawRowsToClients(objectRows);
    } else {
      return convertRawRowsToClients(json);
    }
  }

  return [];
}

/**
 * Helper to process SheetJS workbook into standard ClientProject[] array
 */
function parseWorkbook(workbook: XLSX.WorkBook): ClientProject[] {
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) return [];

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  let credRows: Record<string, any>[] = [];
  if (workbook.SheetNames.length > 1) {
    const credSheet = workbook.Sheets[workbook.SheetNames[1]];
    credRows = XLSX.utils.sheet_to_json(credSheet);
  }

  return convertRawRowsToClients(rows, credRows);
}

/**
 * Convert raw key-value rows to ClientProject[] array
 */
function convertRawRowsToClients(rows: Record<string, any>[], credRows: Record<string, any>[] = []): ClientProject[] {
  const clientsMap: Map<string, ClientProject> = new Map();

  rows.forEach((row, index) => {
    const clientName = row['Client Name'] || row['Client'] || row['Name'];
    if (!clientName) return;

    const domain = row['Domain'] || row['Website'] || row['URL'] || `client-${index + 1}.com`;
    const id = row['ID'] || `client-synced-${index + 1}`;

    const costVal = Number(row['Project Cost (₹)'] || row['Project Cost'] || row['Monthly Retainer ($)'] || row['Retainer'] || 0);
    const billingFrequency = mapBillingFrequency(row['Billing Frequency'] || row['Billing'] || row['Frequency']);

    const project: ClientProject = {
      id,
      clientName,
      company: row['Company'] || clientName,
      domain,
      stagingUrl: row['Staging URL'] || row['Staging'] || '',
      status: mapStatus(row['Status']),
      healthStatus: mapHealth(row['Health'] || row['Status']),
      cmsFramework: row['CMS / Framework'] || row['CMS'] || row['Framework'] || 'WordPress',
      phpNodeVersion: row['Stack Version'] || row['PHP/Node'] || '',
      hostingProvider: row['Hosting Provider'] || row['Hosting'] || 'Cloud Hosting',
      serverIp: row['Server IP'] || row['IP'] || '',
      sslStatus: mapSslStatus(row['SSL Status'] || row['SSL']),
      sslExpiryDate: row['SSL Expiry'] || '',
      domainRenewalDate: row['Domain Renewal'] || row['Renewal Date'] || '',
      billingFrequency,
      projectCost: costVal,
      monthlyRetainer: costVal,
      primaryContact: {
        name: row['Contact Name'] || row['Contact'] || 'Primary Contact',
        email: row['Contact Email'] || row['Email'] || '',
        phone: row['Contact Phone'] || row['Phone'] || '',
      },
      tags: row['Tags'] ? String(row['Tags']).split(',').map((t) => t.trim()) : ['Synced'],
      notes: row['Notes'] || '',
      lastBackupDate: row['Last Backup'] || '',
      credentials: [],
      tasks: [],
      lastSyncDate: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (row['WP Admin User'] || row['WP Admin Pass']) {
      project.credentials.push({
        id: `cred-inline-wp-${index}`,
        category: 'wp_admin',
        label: 'WordPress Admin',
        hostUrl: row['WP Admin URL'] || `https://${domain}/wp-admin`,
        username: row['WP Admin User'] || 'admin',
        password: row['WP Admin Pass'] || '',
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }

    if (row['FTP User'] || row['FTP Pass']) {
      project.credentials.push({
        id: `cred-inline-ftp-${index}`,
        category: 'ftp_sftp',
        label: 'FTP/SFTP Credentials',
        hostUrl: row['FTP Host'] || domain,
        username: row['FTP User'] || '',
        password: row['FTP Pass'] || '',
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }

    clientsMap.set(id, project);
  });

  credRows.forEach((credRow, idx) => {
    const clientId = credRow['Client ID'];
    const clientName = credRow['Client Name'];
    let targetClient: ClientProject | undefined;

    if (clientId && clientsMap.has(clientId)) {
      targetClient = clientsMap.get(clientId);
    } else if (clientName) {
      targetClient = Array.from(clientsMap.values()).find((c) => c.clientName.toLowerCase() === String(clientName).toLowerCase());
    }

    if (targetClient) {
      targetClient.credentials.push({
        id: `cred-sheet2-${idx}`,
        category: (credRow['Category'] as any) || 'custom',
        label: credRow['Label / Title'] || credRow['Title'] || 'Login Credential',
        hostUrl: credRow['Host / URL'] || credRow['URL'] || targetClient.domain,
        username: credRow['Username'] || credRow['User'] || '',
        password: credRow['Password / Key'] || credRow['Password'] || '',
        notes: credRow['Notes'] || '',
        updatedAt: credRow['Updated At'] || new Date().toISOString().split('T')[0],
      });
    }
  });

  return Array.from(clientsMap.values());
}

function mapStatus(val: any): ProjectStatus {
  if (!val) return 'active';
  const str = String(val).toLowerCase();
  if (str.includes('dev') || str.includes('build')) return 'in_development';
  if (str.includes('maint') || str.includes('care')) return 'maintenance';
  if (str.includes('pause') || str.includes('hold')) return 'paused';
  if (str.includes('archive')) return 'archived';
  return 'active';
}

function mapHealth(val: any): HealthStatus {
  if (!val) return 'online';
  const str = String(val).toLowerCase();
  if (str.includes('warn') || str.includes('issue') || str.includes('slow')) return 'warning';
  if (str.includes('down') || str.includes('off') || str.includes('error')) return 'offline';
  return 'online';
}

function mapSslStatus(val: any): SslStatus {
  if (!val) return 'active';
  const str = String(val).toLowerCase();
  if (str.includes('soon') || str.includes('warn')) return 'expiring_soon';
  if (str.includes('expir') || str.includes('no') || str.includes('fail')) return 'expired';
  return 'active';
}

function mapBillingFrequency(val: any): BillingFrequency {
  if (!val) return 'monthly';
  const str = String(val).toLowerCase();
  if (str.includes('year') || str.includes('annual')) return 'yearly';
  if (str.includes('one') || str.includes('single') || str.includes('fixed')) return 'one_time';
  return 'monthly';
}
