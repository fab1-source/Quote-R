import { Quotation, UserAccount } from '../types';

export interface DbStatusResponse {
  engine: 'mongodb' | 'file';
  connected: boolean;
  uri: string;
  databaseName: string;
  totalQuotations: number;
  message: string;
}

export async function getDbStatusApi(): Promise<DbStatusResponse | null> {
  try {
    const res = await fetch('/api/db-status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function reconnectDbApi(): Promise<DbStatusResponse | null> {
  try {
    const res = await fetch('/api/db/reconnect', { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchQuotationsApi(): Promise<Quotation[] | null> {
  try {
    const res = await fetch('/api/quotations');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveQuotationApi(quotation: Quotation): Promise<Quotation | null> {
  try {
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotation),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteQuotationApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/quotations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function getNextRefApi(date: Date = new Date()): Promise<{ nextRefNo: string; dated: string } | null> {
  try {
    const res = await fetch('/api/quotations/next-ref', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: date.toISOString() }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function syncQuotationsApi(quotations: Quotation[]): Promise<{ added: number; updated: number; total: number } | null> {
  try {
    const res = await fetch('/api/quotations/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotations }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchUsersApi(): Promise<UserAccount[] | null> {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveUsersApi(users: UserAccount[]): Promise<UserAccount[] | null> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
