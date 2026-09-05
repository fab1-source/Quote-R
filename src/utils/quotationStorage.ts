import { Quotation } from '../types';
import { createBlankQuotation, createSampleQuotation } from '../data/defaultData';

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
      // Cleanse any legacy references from storage
      const cleaned = parsed
        .filter((q) => !q.id?.includes('thamvos') && q.client?.name !== 'Thamvos Interiors')
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

/**
 * Saves or updates a quotation in storage.
 * If quote already exists (by id or refNo), updates it; otherwise prepends it.
 */
export function saveQuotation(quote: Quotation): Quotation[] {
  const currentList = getSavedQuotations();
  const now = new Date().toISOString();
  const updatedQuote: Quotation = {
    ...quote,
    updatedAt: now,
  };

  const existingIndex = currentList.findIndex(
    (q) => q.id === updatedQuote.id || (q.from?.refNo && q.from.refNo === updatedQuote.from?.refNo)
  );

  let newList: Quotation[];
  if (existingIndex >= 0) {
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

  return newList;
}

/**
 * Deletes a quotation by ID.
 */
export function deleteQuotation(id: string): Quotation[] {
  const currentList = getSavedQuotations();
  const filtered = currentList.filter((q) => q.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete quotation from storage', error);
  }
  return filtered;
}

/**
 * Cancels an existing quotation by recording reason, timestamp and setting status to 'cancelled'.
 * Quotations are never deleted, ensuring the sequential quote numbers remain intact in records.
 */
export function cancelQuotation(id: string, reason: string): Quotation[] {
  const currentList = getSavedQuotations();
  const now = new Date().toISOString();
  const updatedList = currentList.map((q) => {
    if (q.id === id) {
      return {
        ...q,
        status: 'cancelled' as const,
        cancellationReason: reason.trim(),
        cancelledAt: now,
        updatedAt: now,
      };
    }
    return q;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Failed to cancel quotation in storage', error);
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
  const updatedList = currentList.map((q) => {
    if (q.id === id) {
      return {
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
    }
    return q;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Failed to confirm quotation in storage', error);
  }

  return updatedList;
}

/**
 * Updates Job Card flags such as isCompleted, isInvoiced, or committedDeliveryDate.
 */
export function updateJobCardFlags(
  id: string,
  updates: { isCompleted?: boolean; isInvoiced?: boolean; committedDeliveryDate?: string }
): Quotation[] {
  const currentList = getSavedQuotations();
  const now = new Date().toISOString();
  const updatedList = currentList.map((q) => {
    if (q.id === id) {
      return {
        ...q,
        ...updates,
        updatedAt: now,
      };
    }
    return q;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Failed to update job card flags in storage', error);
  }

  return updatedList;
}

/**
 * Reverts quotation from confirmed back to active (unlocks editing).
 */
export function unconfirmQuotation(id: string): Quotation[] {
  const currentList = getSavedQuotations();
  const now = new Date().toISOString();
  const updatedList = currentList.map((q) => {
    if (q.id === id) {
      return {
        ...q,
        status: 'active' as const,
        updatedAt: now,
        confirmedAt: undefined,
      };
    }
    return q;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Failed to unconfirm quotation in storage', error);
  }

  return updatedList;
}

/**
 * Creates a brand new quotation with the next sequential quote number.
 */
export function createNewQuotationWithNextRef(date: Date = new Date()): Quotation {
  const quotes = getSavedQuotations();
  const nextRefNo = generateNextQuoteNumber(date, quotes);
  const dated = formatQuotationDate(date);

  const newQuote = createBlankQuotation();
  newQuote.id = `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  newQuote.status = 'active';
  newQuote.from.refNo = nextRefNo;
  newQuote.from.dated = dated;
  newQuote.title = `Quotation ${nextRefNo}`;

  return newQuote;
}

/**
 * Duplicates an existing quotation, assigning the next sequential reference number.
 */
export function duplicateQuotation(id: string): { newQuotation: Quotation; allQuotes: Quotation[] } {
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
 * Initializes saved quotations if available, or starts clean.
 */
export function initializeSampleIfEmpty(): Quotation[] {
  return getSavedQuotations();
}
