import { UserAccount } from '../types';

export interface SavedAccountRecord {
  phone: string;
  password: string;
  savedAt: number;
  lastUsedAt: number;
  userSnapshot?: UserAccount;
}

const SAVED_ACCOUNTS_KEY = 'picanon_saved_accounts_v1';
const MAX_SAVED_ACCOUNTS = 5;

export function normalizeRwandaPhone(raw: string): string {
  let clean = String(raw || '').trim().replace(/[\s\-()]+/g, '');
  if (clean.startsWith('+250')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('250') && cleanPhoneLengthOk(clean)) {
    clean = '0' + clean.slice(3);
  } else if (clean.length === 9 && clean.startsWith('7')) {
    clean = '0' + clean;
  }
  return clean;
}

function cleanPhoneLengthOk(clean: string): boolean {
  return clean.length >= 12;
}

export function formatDisplayPhone(phone: string): string {
  const norm = normalizeRwandaPhone(phone);
  if (norm.startsWith('0') && norm.length === 10) {
    return `+250 ${norm.slice(1, 4)} ${norm.slice(4, 7)} ${norm.slice(7)}`;
  }
  return norm;
}

export function getSavedAccounts(): SavedAccountRecord[] {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is SavedAccountRecord =>
          Boolean(item) &&
          typeof item.phone === 'string' &&
          typeof item.password === 'string' &&
          item.phone !== '0793002388'
      )
      .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
  } catch {
    return [];
  }
}

export function saveAccountCredential(params: {
  phone: string;
  password: string;
  userSnapshot?: UserAccount;
}): SavedAccountRecord[] {
  const cleanPhone = normalizeRwandaPhone(params.phone);
  const cleanPassword = params.password.trim();
  // Never store admin credentials in quick-login browser list
  if (!cleanPhone || !cleanPassword || cleanPhone === '0793002388') {
    return getSavedAccounts();
  }

  const now = Date.now();
  const existing = getSavedAccounts();
  const prev = existing.find((a) => a.phone === cleanPhone);
  const record: SavedAccountRecord = {
    phone: cleanPhone,
    password: cleanPassword,
    savedAt: prev?.savedAt || now,
    lastUsedAt: now,
    userSnapshot: params.userSnapshot || prev?.userSnapshot,
  };

  const next = [record, ...existing.filter((a) => a.phone !== cleanPhone)].slice(
    0,
    MAX_SAVED_ACCOUNTS
  );

  try {
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

export function updateSavedAccountSnapshot(user: UserAccount): void {
  if (!user || user.isAdmin || user.phone === '0793002388') return;
  const cleanPhone = normalizeRwandaPhone(user.phone);
  const existing = getSavedAccounts();
  const idx = existing.findIndex((a) => a.phone === cleanPhone);
  if (idx === -1) return;

  const next = existing.map((item, i) =>
    i === idx
      ? {
          ...item,
          lastUsedAt: Date.now(),
          userSnapshot: user,
        }
      : item
  );
  try {
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function removeSavedAccount(phone: string): SavedAccountRecord[] {
  const cleanPhone = normalizeRwandaPhone(phone);
  const next = getSavedAccounts().filter((a) => a.phone !== cleanPhone);
  try {
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function purgeSavedAccountsOlderThan(resetAtMs: number): void {
  if (!resetAtMs || resetAtMs <= 0) return;
  const next = getSavedAccounts().filter((a) => (a.savedAt || 0) > resetAtMs);
  try {
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
