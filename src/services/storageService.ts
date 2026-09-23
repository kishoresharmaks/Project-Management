import type { ClientProject, SheetSyncConfig } from '../types/client';

const STORAGE_KEYS = {
  CLIENTS: 'clientpulse_projects_data_v1',
  SYNC_CONFIG: 'clientpulse_sheet_sync_config_v1',
  MASTER_PIN: 'clientpulse_master_pin_hash_v1',
};

export const DEFAULT_SYNC_CONFIG: SheetSyncConfig = {
  syncType: 'google_sheet_csv',
  autoSyncIntervalMinutes: Number(import.meta.env.VITE_AUTO_SYNC_INTERVAL_SEC || 10),
  syncStatus: 'idle',
};

/**
 * Load clients from LocalStorage or initialize empty array
 */
export function loadClientsFromStorage(): ClientProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading clients from local storage', err);
    return [];
  }
}

/**
 * Persist client projects to LocalStorage
 */
export function saveClientsToStorage(clients: ClientProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  } catch (err) {
    console.error('Error saving clients to local storage', err);
  }
}

/**
 * Load Online Sheet sync config settings
 */
export function loadSyncConfig(): SheetSyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_CONFIG);
    const envUrl = import.meta.env.VITE_CUSTOM_API_ENDPOINT || import.meta.env.VITE_SHEET_SYNC_URL;
    const envInterval = Number(import.meta.env.VITE_AUTO_SYNC_INTERVAL_SEC || 10);

    if (!raw) {
      return {
        ...DEFAULT_SYNC_CONFIG,
        sheetUrl: envUrl || '',
        autoSyncIntervalMinutes: envInterval,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      sheetUrl: parsed.sheetUrl || envUrl || '',
      autoSyncIntervalMinutes: parsed.autoSyncIntervalMinutes || envInterval,
    };
  } catch (err) {
    return DEFAULT_SYNC_CONFIG;
  }
}

/**
 * Save Online Sheet sync config settings
 */
export function saveSyncConfig(config: SheetSyncConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving sync config', err);
  }
}

/**
 * Check if Master PIN security protection is configured (.env or local)
 */
export function hasMasterPin(): boolean {
  const envPin = import.meta.env.VITE_MASTER_SECURITY_PIN;
  if (envPin) return true;
  return Boolean(localStorage.getItem(STORAGE_KEYS.MASTER_PIN));
}

/**
 * Set Master PIN
 */
export function setMasterPin(pin: string): void {
  const hashed = btoa(`PIN_SALT_2026_${pin}`);
  localStorage.setItem(STORAGE_KEYS.MASTER_PIN, hashed);
}

/**
 * Verify Master PIN against .env or LocalStorage
 */
export function verifyMasterPin(pin: string): boolean {
  const envPin = import.meta.env.VITE_MASTER_SECURITY_PIN;
  if (envPin && String(pin).trim() === String(envPin).trim()) {
    return true;
  }

  const stored = localStorage.getItem(STORAGE_KEYS.MASTER_PIN);
  if (!stored) {
    // If no stored PIN and no env PIN, true
    return !envPin;
  }
  return stored === btoa(`PIN_SALT_2026_${pin}`);
}

/**
 * Clear Master PIN
 */
export function removeMasterPin(): void {
  localStorage.removeItem(STORAGE_KEYS.MASTER_PIN);
}
