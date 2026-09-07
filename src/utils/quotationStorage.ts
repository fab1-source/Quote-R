import { Quotation } from '../types';
import { createBlankQuotation, createSampleQuotation } from '../data/defaultData';
import {
  fetchQuotationsApi,
  saveQuotationApi,
  deleteQuotationApi,
  getNextRefApi,
  syncQuotationsApi,
} from './apiClient';

export const STORAGE_KEY = 'interglass_saved_quotations_v1';

/**
 * Generates the sequential quotation reference number.
 * Format: IGC/{YY}/{MM}/{SERIAL}
 * Example: IGC/26/09/001 for Sept 2026 (1st quote)
 * Example: IGC/27/03/005 for March 2027 (5th quote)
 */
export function generateNextQuoteNumber(
  date: Date = new Date(),
  existingQuotes?: Quotation[]
): string {
  const quotes = existingQuotes || getSavedQuotations();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `IGC/${yy}/${mm}/`;

  let maxSerial = 0;

  for (const q of quotes) {
    const ref = (q.from?.refNo || '').trim();
    if (ref.startsWith(prefix)) {
      const serialPart = ref.slice(prefix.length).trim();
      const parsed = parseInt(serialPart, 10);
      if (!isNaN(parsed) && parsed > maxSerial) {
        maxSerial = parsed;
      }
    }
  }

  const nextSerial = maxSerial + 1;
  const serialPadded = String(nextSerial).padStart(3, '0');
  return `${prefix}${serialPadded}`;
}

/**
 * Formats current date as DD-MM-YYYY
 */
export function formatQuotationDate(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Retrieves all saved quotations from localStorage.
 */
export function getSavedQuotations(): Quotation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      // Cleanse any legacy references or sample client from storage
      const cleaned = parsed
        .filter(
          (q) =>
            !q.id?.includes('thamvos') &&
            q.client?.name !== 'Thamvos Interiors' &&
            q.id !== 'sample-quote-001' &&
            q.from?.refNo !== 'IG/26-06/ 3685' &&
            !q.client?.name?.toLowerCase().includes('sample client')
        )
        .map((q) => {
          let str = JSON.stringify(q);
          if (str.includes('Thamvos') || str.includes('thamvos')) {
            str = str.replace(/Thamvos Interiors/gi, 'Client LLC')
                     .replace(/Thamvos/gi, 'Client');
            return JSON.parse(str);
          }
          return q;
        });
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return [];
  } catch (error) {
    console.error('Failed to parse quotations from storage', error);
    return [];
  }
}

let saveDebounceTimer: any = null;
let pendingQuoteToSave: Quotation | null = null;

/**
 * Immediately flushes any pending quotation save to the server.
 */
export async function flushPendingQuotationSave(): Promise<Quotation | null> {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  if (pendingQuoteToSave) {
    const toSave = pendingQuoteToSave;
    pendingQuoteToSave = null;
    return await saveQuotationApi(toSave);
  }
  return null;
}

/**
 * Saves or updates a quotation in storage and syncs with backend server API.
 * If quote already exists (by id or refNo), updates it; otherwise prepends it.
 */
export function saveQuotation(quote: Quotation): Quotation[] {
  const currentList = getSavedQuotations();
  const now = new Date().toISOString();
  const updatedQuote: Quotation = {
    ...quote,
    updatedAt: now,
  };

  const refNo = (updatedQuote.from?.refNo || '').trim();
  const rev = (updatedQuote.from?.rev || 'REV-00').trim().toUpperCase();

  const existingIndex = currentList.findIndex(
    (q) =>
      q.id === updatedQuote.id ||
      (refNo &&
        q.from?.refNo?.trim() === refNo &&
        (q.from?.rev || 'REV-00').trim().toUpperCase() === rev)
  );

  let newList: Quotation[];
  if (existingIndex >= 0) {
    // Preserve existing id if present
    updatedQuote.id = currentList[existingIndex].id || updatedQuote.id;
    newList = [...currentList];
    newList[existingIndex] = updatedQuote;
  } else {
    newList = [updatedQuote, ...currentList];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  } catch (error) {
    console.error('Failed to save quotation to storage', error);
  }

  // Push to centralized server database with debounced execution
  pendingQuoteToSave = updatedQuote;
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    if (pendingQuoteToSave) {
      const toSend = pendingQuoteToSave;
      pendingQuoteToSave = null;
      saveQuotationApi(toSend).catch((err) => {
        console.warn('Background server sync error:', err);
      });
    }
  }, 250);

  return newList;
}

/**
 * Deletes a quotation by ID and syncs with server API.
 */
export function deleteQuotation(id: string): Quotation[] {
  const currentList = getSavedQuotations();
  const filtered = currentList.filter((q) => q.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete quotation from storage', error);
  }

  deleteQuotationApi(id).catch((err) => {
    console.warn('Background delete sync error:', err);
  });

  return filtered;
}

/**
 * Cancels an existing quotation by recording reason, timestamp and setting status to 'cancelled'.
 * Quotations are never deleted, ensuring the sequential quote numbers remain intact in records.
 */
export function cancelQuotation(id: string, reason: string): Quotation[] {
  const currentList = getSavedQuotations();
  const now = new Date().toISOString();
  let changedQuote: Quotation | null = null;

  const updatedList = currentList.map((q) => {
    if (q.id === id) {
      const u: Quotation = {
        ...q,
        status: 'cancelled' as const,
        cancellationReason: reason.trim(),
        cancelledAt: now,
        updatedAt: now,
      };
      changedQuote = u;
      return u;
    }
    return q;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Failed to cancel quotation in storage', error);
  }

  if (changedQuote) {
    saveQuotationApi(changedQuote).catch((err) => console.warn('Cancel server sync error:', err));
  }

  return updatedList;
}

export interface ConfirmationDetails {
  clientName: string;
  salesmanName: string;
  qty: number;
  totalAmount: number;
  committedDeliveryDate?: string;
}

/**
 * Returns YYYY-MM-DD for a date offset from today (defaults to 4th day from current date).
 */
export function getDefaultDeliveryDate(daysFromNow: number = 4): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Marks quotation as confirmed, locks editing, updates client name, salesman, amounts and committed delivery date.
 */
export function confirmQuotation(id: string, details: ConfirmationDetails): Quotation[] {
  const currentList = getSavedQuotations();
  const now = new Date().toISOString();
  let changedQuote: Quotation | null = null;

  const updatedList = currentList.map((q) => {
    if (q.id === id) {
      const u: Quotation = {
        ...q,
        status: 'confirmed' as const,
        confirmedAt: now,
        updatedAt: now,
        salesmanName: details.salesmanName.trim(),
        client: {
          ...q.client,
          name: details.clientName.trim(),
        },
        confirmedQty: details.qty,
        confirmedTotalAmount: details.totalAmount,
        committedDeliveryDate: details.committedDeliveryDate || getDefaultDeliveryDate(4),
      };
      changedQuote = u;
      return u;
    }
    return q;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Failed to confirm quotation in storage', error);
  }

  if (changedQuote) {
    saveQuotationApi(changedQuote).catch((err) => console.warn('Confirm server sync error:', err));
  }

  return updatedList;
}

/**
 * Updates Job Card flags such as isCompleted, isInvoiced, committedDeliveryDate, or factoryComments.
 */
export function updateJobCardFlags(
  id: string,
  updates: {
    isCompleted?: boolean;
    isInvoiced?: boolean;
    committedDeliveryDate?: string;
    factoryComments?: string;
  }
): Quotation[] {
  const currentList = getSavedQuotations();
  const now = new Date().toISOString();
  let changedQuote: Quotation | null = null;

  const updatedList = currentList.map((q) => {
    if (q.id === id) {
      const u: Quotation = {
        ...q,
        ...updates,
        updatedAt: now,
      };
      changedQuote = u;
      return u;
    }
    return q;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Failed to update job card flags in storage', error);
  }

  if (changedQuote) {
    saveQuotationApi(changedQuote).catch((err) => console.warn('Job card server sync error:', err));
  }

  return updatedList;
}

/**
 * Updates factory comments for a specific job card order.
 */
export function updateJobCardComments(id: string, factoryComments: string): Quotation[] {
  return updateJobCardFlags(id, { factoryComments });
}

/**
 * Reverts quotation from confirmed back to active (unlocks editing).
 */
export function unconfirmQuotation(id: string): Quotation[] {
  const currentList = getSavedQuotations();
  const now = new Date().toISOString();
  let changedQuote: Quotation | null = null;

  const updatedList = currentList.map((q) => {
    if (q.id === id) {
      const u: Quotation = {
        ...q,
        status: 'active' as const,
        updatedAt: now,
        confirmedAt: undefined,
      };
      changedQuote = u;
      return u;
    }
    return q;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Failed to unconfirm quotation in storage', error);
  }

  if (changedQuote) {
    saveQuotationApi(changedQuote).catch((err) => console.warn('Unconfirm server sync error:', err));
  }

  return updatedList;
}

/**
 * Loads quotations from server API and keeps local cache synchronized.
 */
export async function loadQuotationsFromServer(): Promise<Quotation[]> {
  try {
    const serverQuotes = await fetchQuotationsApi();
    if (serverQuotes && Array.isArray(serverQuotes)) {
      if (serverQuotes.length > 0) {
        // Merge with any newer local edits in local storage so active work isn't overwritten
        const localQuotes = getSavedQuotations();
        const merged = serverQuotes.map((sq) => {
          const sqRev = (sq.from?.rev || 'REV-00').trim().toUpperCase();
          const localMatch = localQuotes.find(
            (lq) =>
              lq.id === sq.id ||
              (lq.from?.refNo &&
                lq.from.refNo === sq.from?.refNo &&
                (lq.from?.rev || 'REV-00').trim().toUpperCase() === sqRev)
          );
          if (localMatch && localMatch.updatedAt && sq.updatedAt) {
            const localTime = new Date(localMatch.updatedAt).getTime();
            const serverTime = new Date(sq.updatedAt).getTime();
            if (localTime > serverTime) {
              return localMatch;
            }
          }
          return sq;
        });

        // Deduplicate records sharing the exact same refNo AND rev, while filtering out Sample Client
        const seenKeys = new Set<string>();
        const deduped: Quotation[] = [];
        for (const q of merged) {
          if (
            q.id === 'sample-quote-001' ||
            q.from?.refNo === 'IG/26-06/ 3685' ||
            q.client?.name?.toLowerCase().includes('sample client')
          ) {
            continue;
          }
          const ref = (q.from?.refNo || '').trim();
          const rev = (q.from?.rev || 'REV-00').trim().toUpperCase();
          if (ref) {
            const key = `${ref}:::${rev}`;
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);
          }
          deduped.push(q);
        }

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
        } catch {}
        return deduped;
      } else {
        // If server database is empty, seed it with local quotations
        const localQuotes = getSavedQuotations();
        if (localQuotes.length > 0) {
          await syncQuotationsApi(localQuotes);
          return localQuotes;
        }
      }
    }
  } catch (err) {
    console.warn('Could not sync with server API, using local storage cache', err);
  }
  return getSavedQuotations();
}

/**
 * Creates a brand new quotation with server-allocated atomic sequential quote number.
 */
export async function createNewQuotationWithNextRefAsync(
  date: Date = new Date(),
  authorName?: string
): Promise<Quotation> {
  let nextRefNo = '';
  let dated = formatQuotationDate(date);

  try {
    const res = await getNextRefApi(date);
    if (res && res.nextRefNo) {
      nextRefNo = res.nextRefNo;
      dated = res.dated || dated;
    }
  } catch (err) {
    console.warn('Server next ref error, using local fallback:', err);
  }

  if (!nextRefNo) {
    const quotes = getSavedQuotations();
    nextRefNo = generateNextQuoteNumber(date, quotes);
  }

  const newQuote = createBlankQuotation(nextRefNo);
  newQuote.id = `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  newQuote.status = 'active';
  newQuote.from.refNo = nextRefNo;
  newQuote.from.dated = dated;
  newQuote.title = `Quotation ${nextRefNo}`;
  if (authorName) {
    newQuote.authorName = authorName;
  }

  return newQuote;
}

/**
 * Creates a brand new quotation with the next sequential quote number.
 */
export function createNewQuotationWithNextRef(date: Date = new Date(), authorName?: string): Quotation {
  const quotes = getSavedQuotations();
  const nextRefNo = generateNextQuoteNumber(date, quotes);
  const dated = formatQuotationDate(date);

  const newQuote = createBlankQuotation(nextRefNo);
  newQuote.id = `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  newQuote.status = 'active';
  newQuote.from.refNo = nextRefNo;
  newQuote.from.dated = dated;
  newQuote.title = `Quotation ${nextRefNo}`;
  if (authorName) {
    newQuote.authorName = authorName;
  }

  return newQuote;
}

/**
 * Duplicates an existing quotation, assigning the next sequential reference number.
 */
export function duplicateQuotation(id: string, authorName?: string): { newQuotation: Quotation; allQuotes: Quotation[] } {
  const quotes = getSavedQuotations();
  const target = quotes.find((q) => q.id === id);
  const now = new Date();
  const nextRefNo = generateNextQuoteNumber(now, quotes);
  const dated = formatQuotationDate(now);

  const source = target || createBlankQuotation();
  const cloned: Quotation = {
    ...JSON.parse(JSON.stringify(source)),
    id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: `${source.client.name ? source.client.name + ' - ' : ''}${nextRefNo}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    authorName: authorName || source.authorName || 'ESTIMATOR1',
    from: {
      ...source.from,
      refNo: nextRefNo,
      dated: dated,
      rev: 'REV-00',
    },
  };

  const updatedQuotes = saveQuotation(cloned);
  return { newQuotation: cloned, allQuotes: updatedQuotes };
}

/**
 * Calculates the next revision string based on current revision (e.g. REV-00 -> REV-01, R-00 -> R-01).
 */
export function getNextRevisionCode(currentRev: string = 'REV-00'): string {
  const clean = (currentRev || '').trim().toUpperCase();
  const numMatch = clean.match(/(\d+)/);
  const currentNum = numMatch ? parseInt(numMatch[1], 10) : 0;
  const nextNum = currentNum + 1;
  const padded = String(nextNum).padStart(2, '0');
  if (clean.startsWith('R-') || clean.startsWith('R0')) {
    return `R-${padded}`;
  }
  return `REV-${padded}`;
}

/**
 * Creates a revised edition of an existing quotation (e.g., R-00 -> R-01).
 * The original quotation becomes locked, marked uneditable, and archived.
 * The new revision inherits all items, client details, rates, and scopes for continued editing.
 */
export function createQuotationRevision(
  sourceQuote: Quotation,
  authorName?: string
): { originalQuote: Quotation; newRevision: Quotation; allQuotes: Quotation[] } {
  const currentRev = (sourceQuote.from?.rev || 'REV-00').trim();
  const nextRev = getNextRevisionCode(currentRev);
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Lock and archive the original quotation (e.g. R-00)
  const originalUpdated: Quotation = {
    ...sourceQuote,
    isLocked: true,
    isArchivedRevision: true,
    supersededBy: nextRev,
    updatedAt: nowIso,
  };

  // 2. Clone to new revision (e.g. R-01) with deep copy
  const newId = `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const clientName = sourceQuote.client?.name ? sourceQuote.client.name.trim() : '';
  const newRevision: Quotation = {
    ...JSON.parse(JSON.stringify(sourceQuote)),
    id: newId,
    title: `${clientName ? clientName + ' - ' : ''}${sourceQuote.from.refNo} (${nextRev})`,
    createdAt: nowIso,
    updatedAt: nowIso,
    authorName: authorName || sourceQuote.authorName || 'ESTIMATOR1',
    status: 'active',
    isLocked: false,
    isArchivedRevision: false,
    supersededBy: undefined,
    revisionOfId: sourceQuote.id,
    revisionNumber: (sourceQuote.revisionNumber || 0) + 1,
    from: {
      ...sourceQuote.from,
      rev: nextRev,
      dated: formatQuotationDate(now),
    },
  };

  // Save the locked original first, then save the new revision
  saveQuotation(originalUpdated);
  const allQuotes = saveQuotation(newRevision);

  // Push both to backend API
  saveQuotationApi(originalUpdated).catch((err) => console.warn('Sync original quote lock failed:', err));
  saveQuotationApi(newRevision).catch((err) => console.warn('Sync new revision failed:', err));

  return { originalQuote: originalUpdated, newRevision, allQuotes };
}

/**
 * Initializes saved quotations if available, or starts clean.
 */
export function initializeSampleIfEmpty(): Quotation[] {
  return getSavedQuotations();
}

