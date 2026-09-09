import { ActivityLog, ActivityActionType } from '../types';

const AUDIT_LOG_STORAGE_KEY = 'interglass_system_audit_logs';

/**
 * Format local date string DD-MM-YYYY
 */
export function formatLogDate(dateObj: Date): string {
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Format local time string hh:mm AM/PM
 */
export function formatLogTime(dateObj: Date): string {
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Retrieve all audit activity logs from local storage.
 * Seeds initial logs if storage is currently empty.
 */
export function getAuditLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (raw) {
      const parsed: ActivityLog[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading audit logs from localStorage:', err);
  }

  // If empty, generate realistic seed logs and save
  const seeded = generateSeedAuditLogs();
  try {
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(seeded));
  } catch (e) {
    console.error('Error saving seeded logs:', e);
  }
  return seeded;
}

/**
 * Record a new action into the audit trail.
 */
export function logActivity(entry: {
  action: ActivityActionType;
  reference: string;
  user: string;
  userRole?: string;
  clientName?: string;
  summary: string;
  details: string;
  timestamp?: string;
}): ActivityLog {
  const now = entry.timestamp ? new Date(entry.timestamp) : new Date();
  const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const newLog: ActivityLog = {
    id,
    timestamp: now.toISOString(),
    date: formatLogDate(now),
    time: formatLogTime(now),
    user: entry.user || 'ADMIN',
    userRole: entry.userRole || 'ADMIN',
    action: entry.action,
    reference: entry.reference || 'SYSTEM',
    clientName: entry.clientName || '',
    summary: entry.summary,
    details: entry.details,
  };

  try {
    const existing = getAuditLogs();
    // Prepend new log (newest first), limit to 2000 records
    const updated = [newLog, ...existing].slice(0, 2000);
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch event for reactive components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('interglass_audit_log_added', { detail: newLog }));
    }
  } catch (err) {
    console.error('Failed to append audit log:', err);
  }

  return newLog;
}

/**
 * Clear all audit logs (Admin utility)
 */
export function clearAuditLogs(): void {
  try {
    localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('interglass_audit_log_added'));
    }
  } catch (err) {
    console.error('Failed to clear audit logs:', err);
  }
}

/**
 * Generate initial realistic audit logs for historical system operations
 */
function generateSeedAuditLogs(): ActivityLog[] {
  const now = new Date();
  const d1 = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
  const d2 = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
  const d3 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const d4 = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago
  const d5 = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 3 days ago

  return [
    {
      id: 'log_seed_1',
      timestamp: d1.toISOString(),
      date: formatLogDate(d1),
      time: formatLogTime(d1),
      user: 'ADMIN',
      userRole: 'ADMIN',
      action: 'UPDATE_COMMENT',
      reference: 'IGC/26/09/003',
      clientName: 'Al Futtaim Glazing LLC',
      summary: 'Factory comment added on job card',
      details: 'Plant comment entered: "Double glazing argon gas filling in progress. Overlap silicone curing."',
    },
    {
      id: 'log_seed_2',
      timestamp: d2.toISOString(),
      date: formatLogDate(d2),
      time: formatLogTime(d2),
      user: 'ADMIN',
      userRole: 'ADMIN',
      action: 'UPDATE_SALESMAN',
      reference: 'IGC/26/09/003',
      clientName: 'Al Futtaim Glazing LLC',
      summary: 'Assigned salesman updated',
      details: 'Salesman re-assigned to "Shiju - 055 880 3860" for confirmed job card.',
    },
    {
      id: 'log_seed_3',
      timestamp: d3.toISOString(),
      date: formatLogDate(d3),
      time: formatLogTime(d3),
      user: 'ESTIMATOR1',
      userRole: 'ESTIMATION',
      action: 'CONFIRM_JOB',
      reference: 'IGC/26/09/003',
      clientName: 'Al Futtaim Glazing LLC',
      summary: 'Confirmed quotation and issued Factory Job Card',
      details: 'Converted quote to Job Card. Assigned Salesman: Shiju, Committed delivery date: 15-09-2026. 42 Pcs (86.40 m²), Total: AED 45,200.00.',
    },
    {
      id: 'log_seed_4',
      timestamp: d3.toISOString(),
      date: formatLogDate(d3),
      time: formatLogTime(d3),
      user: 'ESTIMATOR1',
      userRole: 'ESTIMATION',
      action: 'EDIT_QUOTE',
      reference: 'IGC/26/09/003',
      clientName: 'Al Futtaim Glazing LLC',
      summary: 'Updated quotation glass specifications & cost sheet',
      details: 'Added 24mm DGU (6mm Vitralite Bronze Refl Tempered + 12mm Asp + 6mm Clear Tempered) with Overlap and U-Insert.',
    },
    {
      id: 'log_seed_5',
      timestamp: d4.toISOString(),
      date: formatLogDate(d4),
      time: formatLogTime(d4),
      user: 'HOD',
      userRole: 'ADMIN',
      action: 'CREATE_QUOTE',
      reference: 'IGC/26/09/003',
      clientName: 'Al Futtaim Glazing LLC',
      summary: 'Created new quotation IGC/26/09/003',
      details: 'Initialised consecutive quotation reference for Al Futtaim Glazing LLC.',
    },
    {
      id: 'log_seed_6',
      timestamp: d4.toISOString(),
      date: formatLogDate(d4),
      time: formatLogTime(d4),
      user: 'PRODUCTION1',
      userRole: 'PRODUCTION',
      action: 'UPDATE_INVOICE',
      reference: 'IGC/26/09/002',
      clientName: 'Emaar Hospitality Group',
      summary: 'Marked Job Card as INVOICED / COMPLETED',
      details: 'Job completed, dispatched to site, and marked as invoiced.',
    },
    {
      id: 'log_seed_7',
      timestamp: d5.toISOString(),
      date: formatLogDate(d5),
      time: formatLogTime(d5),
      user: 'COORDINATOR1',
      userRole: 'COORDINATOR',
      action: 'UPDATE_REMARKS',
      reference: 'IGC/26/09/001',
      clientName: 'Arabian Construction Co.',
      summary: 'Recorded coordinator follow-up remark',
      details: 'Follow-up remark: "Client approved shop drawings. Awaiting LPO issuance."',
    },
    {
      id: 'log_seed_8',
      timestamp: d5.toISOString(),
      date: formatLogDate(d5),
      time: formatLogTime(d5),
      user: 'ESTIMATOR1',
      userRole: 'ESTIMATION',
      action: 'CREATE_QUOTE',
      reference: 'IGC/26/09/001',
      clientName: 'Arabian Construction Co.',
      summary: 'Created new quotation IGC/26/09/001',
      details: 'Initialised quotation reference for Arabian Construction Co.',
    },
  ];
}
