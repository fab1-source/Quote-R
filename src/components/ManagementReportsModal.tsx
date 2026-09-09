import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Calendar,
  FileText,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Sparkles,
  Check,
  RotateCcw,
  History
} from 'lucide-react';
import { Quotation, UserAccount, ActivityLog } from '../types';
import { calculateQuotationTotals } from '../utils/calculations';
import { InterglassEmblem } from './InterglassLogo';
import { exportToPdf } from '../utils/pdfGenerator';
import { compareQuotationRefDesc, formatLastUpdated } from './DashboardView';
import { getAuditLogs } from '../utils/auditLogger';
import { AuditLogReportView } from './AuditLogReportView';

interface ManagementReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: Quotation[];
  currentUser?: UserAccount | null;
  onNotification?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

/**
 * Robust date parser for quotation dates
 */
function parseQuoteDate(q: Quotation): Date | null {
  if (q.from?.dated) {
    const raw = q.from.dated.trim();
    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
      const d = parseInt(dmy[1], 10);
      const m = parseInt(dmy[2], 10) - 1;
      const y = parseInt(dmy[3], 10);
      const parsed = new Date(y, m, d);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const standard = new Date(raw);
    if (!isNaN(standard.getTime())) return standard;
  }
  if (q.createdAt) {
    const d = new Date(q.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Extract sequential numeric ID from quote ref (e.g. IGC/26/09/004 -> 4)
 */
function extractRefNumber(ref?: string): number | null {
  if (!ref) return null;
  const matches = ref.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  const last = parseInt(matches[matches.length - 1], 10);
  return isNaN(last) ? null : last;
}

export const ManagementReportsModal: React.FC<ManagementReportsModalProps> = ({
  isOpen,
  onClose,
  quotations,
  currentUser,
  onNotification
}) => {
  // Active report tab: 'quotations_status' | 'job_cards' | 'activity_log'
  const [activeReportTab, setActiveReportTab] = useState<'quotations_status' | 'job_cards' | 'activity_log'>('quotations_status');

  // Quotation Status Report Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [fromRef, setFromRef] = useState<string>('');
  const [toRef, setToRef] = useState<string>('');
  const [selectedSalesman, setSelectedSalesman] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Job Cards Report Filters
  const [jcSalesman, setJcSalesman] = useState<string>('all');

  // Activity / Audit Log Report Filters & State
  const [logSearch, setLogSearch] = useState<string>('');
  const [logUserFilter, setLogUserFilter] = useState<string>('all');
  const [logActionFilter, setLogActionFilter] = useState<string>('all');
  const [logDateFrom, setLogDateFrom] = useState<string>('');
  const [logDateTo, setLogDateTo] = useState<string>('');
  const [logs, setLogs] = useState<ActivityLog[]>(() => getAuditLogs());

  // Reload logs when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setLogs(getAuditLogs());
    }
  }, [isOpen]);

  // Listen for real-time audit log events
  React.useEffect(() => {
    const handler = () => {
      setLogs(getAuditLogs());
    };
    window.addEventListener('interglass_audit_log_added', handler);
    return () => window.removeEventListener('interglass_audit_log_added', handler);
  }, []);

  // Unique users found in activity logs
  const availableLogUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.user && l.user.trim()) {
        set.add(l.user.trim());
      }
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (logUserFilter !== 'all' && item.user !== logUserFilter) {
        return false;
      }
      if (logActionFilter !== 'all' && item.action !== logActionFilter) {
        return false;
      }
      if (logDateFrom) {
        const itemD = new Date(item.timestamp);
        const fromD = new Date(logDateFrom);
        fromD.setHours(0, 0, 0, 0);
        if (itemD < fromD) return false;
      }
      if (logDateTo) {
        const itemD = new Date(item.timestamp);
        const toD = new Date(logDateTo);
        toD.setHours(23, 59, 59, 999);
        if (itemD > toD) return false;
      }
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase().trim();
        const match =
          item.reference.toLowerCase().includes(q) ||
          (item.clientName || '').toLowerCase().includes(q) ||
          item.user.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [logs, logUserFilter, logActionFilter, logDateFrom, logDateTo, logSearch]);

  // Export progress
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportMessage, setExportMessage] = useState<string>('');

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Available salesmen from quotation list
  const availableSalesmen = useMemo(() => {
    const set = new Set<string>();
    quotations.forEach((q) => {
      if (q.salesmanName && q.salesmanName.trim()) {
        set.add(q.salesmanName.trim());
      }
    });
    return Array.from(set).sort();
  }, [quotations]);

  // Quick Date Range Presets
  const applyDatePreset = (preset: 'all' | 'this_month' | 'last_30_days' | 'this_year') => {
    if (preset === 'all') {
      setFromDate('');
      setToDate('');
      return;
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (preset === 'this_month') {
      setFromDate(`${yyyy}-${mm}-01`);
      setToDate(todayStr);
    } else if (preset === 'last_30_days') {
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const pY = past.getFullYear();
      const pM = String(past.getMonth() + 1).padStart(2, '0');
      const pD = String(past.getDate()).padStart(2, '0');
      setFromDate(`${pY}-${pM}-${pD}`);
      setToDate(todayStr);
    } else if (preset === 'this_year') {
      setFromDate(`${yyyy}-01-01`);
      setToDate(todayStr);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setFromRef('');
    setToRef('');
    setSelectedSalesman('all');
    setSelectedStatus('all');
    setJcSalesman('all');
    setLogSearch('');
    setLogUserFilter('all');
    setLogActionFilter('all');
    setLogDateFrom('');
    setLogDateTo('');
  };

  // Filter Quotations for Report 1: Quotations Status
  const filteredQuotationsReport = useMemo(() => {
    // Start with non-archived quotes (or active quote per family)
    const base = quotations.filter((q) => !q.isArchivedRevision);

    return base.filter((q) => {
      // 1. Date Range filter (if specified)
      if (fromDate || toDate) {
        const qDate = parseQuoteDate(q);
        if (qDate) {
          if (fromDate) {
            const start = new Date(fromDate);
            start.setHours(0, 0, 0, 0);
            if (qDate < start) return false;
          }
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (qDate > end) return false;
          }
        }
      }

      // 2. Quotation Ref Range filter (if specified)
      const qRef = (q.from?.refNo || '').trim();
      const qNum = extractRefNumber(qRef);

      const fNum = extractRefNumber(fromRef.trim());
      const tNum = extractRefNumber(toRef.trim());

      if (fNum !== null && qNum !== null && qNum < fNum) {
        return false;
      }
      if (tNum !== null && qNum !== null && qNum > tNum) {
        return false;
      }

      // Fallback string matching if reference didn't parse numeric
      if (fromRef.trim() && fNum === null && qRef && qRef < fromRef.trim()) {
        return false;
      }
      if (toRef.trim() && tNum === null && qRef && qRef > toRef.trim()) {
        return false;
      }

      // 3. Salesman filter
      if (selectedSalesman !== 'all' && (q.salesmanName || '').trim() !== selectedSalesman) {
        return false;
      }

      // 4. Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'confirmed' && q.status !== 'confirmed') return false;
        if (selectedStatus === 'invoiced' && !q.isInvoiced) return false;
        if (selectedStatus === 'cancelled' && q.status !== 'cancelled') return false;
        if (selectedStatus === 'draft' && (q.status === 'confirmed' || q.status === 'cancelled')) return false;
      }

      return true;
    }).sort((a, b) => compareQuotationRefDesc(a.from?.refNo, b.from?.refNo));
  }, [quotations, fromDate, toDate, fromRef, toRef, selectedSalesman, selectedStatus]);

  // Aggregate totals for Report 1
  const quoteStatusTotals = useMemo(() => {
    let totalCount = filteredQuotationsReport.length;
    let confirmedCount = 0;
    let invoicedCount = 0;
    let cancelledCount = 0;
    let draftCount = 0;
    let totalPcs = 0;
    let totalSqm = 0;
    let totalAmountExclVat = 0;
    let totalVat = 0;
    let totalAmountWithVat = 0;

    filteredQuotationsReport.forEach((q) => {
      if (q.status === 'confirmed') confirmedCount++;
      else if (q.status === 'cancelled') cancelledCount++;
      else draftCount++;

      if (q.isInvoiced) invoicedCount++;

      const { grandTotalQty, grandTotalSqm, totalAmountAED, vatAmountAED, totalWithVatAED } = calculateQuotationTotals(q);
      const displayQty = typeof q.confirmedQty === 'number' ? q.confirmedQty : grandTotalQty;
      const displayAmt = typeof q.confirmedTotalAmount === 'number' ? q.confirmedTotalAmount : totalAmountAED;

      totalPcs += displayQty;
      totalSqm += grandTotalSqm;
      totalAmountExclVat += displayAmt;
      totalVat += vatAmountAED;
      totalAmountWithVat += totalWithVatAED;
    });

    return {
      totalCount,
      confirmedCount,
      invoicedCount,
      cancelledCount,
      draftCount,
      totalPcs,
      totalSqm,
      totalAmountExclVat,
      totalVat,
      totalAmountWithVat
    };
  }, [filteredQuotationsReport]);

  // Filter Job Cards for Report 2: Running & Completed
  const { runningJobCards, completedJobCards } = useMemo(() => {
    // Only confirmed job cards
    const confirmed = quotations.filter((q) => q.status === 'confirmed');

    const filtered = confirmed.filter((q) => {
      if (jcSalesman !== 'all' && (q.salesmanName || '').trim() !== jcSalesman) {
        return false;
      }
      return true;
    });

    // Running jobs: not invoiced and not completed
    const running = filtered
      .filter((q) => !q.isInvoiced && !q.isCompleted)
      .sort((a, b) => compareQuotationRefDesc(a.from?.refNo, b.from?.refNo));

    // Completed jobs: invoiced or marked completed
    const completed = filtered
      .filter((q) => q.isInvoiced || q.isCompleted)
      .sort((a, b) => compareQuotationRefDesc(a.from?.refNo, b.from?.refNo));

    return { runningJobCards: running, completedJobCards: completed };
  }, [quotations, jcSalesman]);

  // Subtotals for Job Cards Report
  const runningTotals = useMemo(() => {
    let count = runningJobCards.length;
    let pcs = 0;
    let sqm = 0;
    let amt = 0;
    runningJobCards.forEach((q) => {
      const { grandTotalQty, grandTotalSqm, totalAmountAED } = calculateQuotationTotals(q);
      pcs += typeof q.confirmedQty === 'number' ? q.confirmedQty : grandTotalQty;
      sqm += grandTotalSqm;
      amt += typeof q.confirmedTotalAmount === 'number' ? q.confirmedTotalAmount : totalAmountAED;
    });
    return { count, pcs, sqm, amt };
  }, [runningJobCards]);

  const completedTotals = useMemo(() => {
    let count = completedJobCards.length;
    let pcs = 0;
    let sqm = 0;
    let amt = 0;
    completedJobCards.forEach((q) => {
      const { grandTotalQty, grandTotalSqm, totalAmountAED } = calculateQuotationTotals(q);
      pcs += typeof q.confirmedQty === 'number' ? q.confirmedQty : grandTotalQty;
      sqm += grandTotalSqm;
      amt += typeof q.confirmedTotalAmount === 'number' ? q.confirmedTotalAmount : totalAmountAED;
    });
    return { count, pcs, sqm, amt };
  }, [completedJobCards]);

  // Delivery timeline helper
  const getTimelineBadge = (committedDateStr?: string) => {
    if (!committedDateStr) return { text: 'No Date Set', color: 'text-slate-500 bg-slate-100 border-slate-200' };
    const target = new Date(committedDateStr);
    if (isNaN(target.getTime())) return { text: committedDateStr, color: 'text-slate-500 bg-slate-100 border-slate-200' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)}d`,
        color: 'text-red-800 bg-red-100 border-red-300 font-bold'
      };
    }
    if (diffDays === 0) {
      return {
        text: 'Due Today',
        color: 'text-amber-800 bg-amber-100 border-amber-300 font-bold'
      };
    }
    return {
      text: `${diffDays} days left`,
      color: 'text-emerald-800 bg-emerald-100 border-emerald-300'
    };
  };

  // Trigger PDF Download via jsPDF & html2canvas-pro
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setExportProgress(10);
    setExportMessage('Initializing high-resolution PDF generation...');

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName =
      activeReportTab === 'quotations_status'
        ? `Interglass_Quotations_Status_Report_${timestamp}.pdf`
        : activeReportTab === 'job_cards'
        ? `Interglass_Factory_Job_Cards_Report_${timestamp}.pdf`
        : `Interglass_System_Audit_Log_Report_${timestamp}.pdf`;

    try {
      await exportToPdf('management-report-print-container', {
        fileName,
        orientation: 'landscape',
        customWidth: 1400,
        onProgress: (p, msg) => {
          setExportProgress(p);
          setExportMessage(msg);
        }
      });
      if (onNotification) onNotification(`Report downloaded successfully: ${fileName}`, 'success');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      if (onNotification) onNotification(`Failed to generate PDF: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportMessage('');
    }
  };

  // Direct Browser Print (Vector PDF / Printer)
  const handlePrint = () => {
    const printable = document.getElementById('management-report-print-container');
    if (!printable) {
      if (onNotification) onNotification('Report element not found for printing.', 'error');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      // Fallback: window.print()
      window.print();
      return;
    }

    const reportHtml = printable.innerHTML;
    const title =
      activeReportTab === 'quotations_status'
        ? 'Interglass - Quotations Status Report'
        : activeReportTab === 'job_cards'
        ? 'Interglass - Factory Job Cards Report'
        : 'Interglass - System Change & Audit Log Report';

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm 8mm 8mm 8mm;
            }
            body {
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body class="p-4">
          <div>${reportHtml}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#7B1818] via-[#8C1D1D] to-[#601212] px-5 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">Executive Management Reports</h2>
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Generate and download comprehensive PDF statements for board review & operational tracking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/90 px-5 pt-3 gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveReportTab('quotations_status')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border-t border-x ${
              activeReportTab === 'quotations_status'
                ? 'bg-white text-[#7B1818] border-slate-300 shadow-xs -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4 text-[#7B1818]" />
            <span>1. Quotations Status Report</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
              {filteredQuotationsReport.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('job_cards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border-t border-x ${
              activeReportTab === 'job_cards'
                ? 'bg-white text-[#7B1818] border-slate-300 shadow-xs -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-700" />
            <span>2. Factory Job Cards Report</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
              {runningJobCards.length} Running / {completedJobCards.length} Done
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('activity_log')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border-t border-x ${
              activeReportTab === 'activity_log'
                ? 'bg-white text-[#7B1818] border-slate-300 shadow-xs -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <History className="w-4 h-4 text-purple-700" />
            <span>3. System Audit Log (LOG)</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold">
              {filteredLogs.length} Events
            </span>
          </button>
        </div>

        {/* Filter Controls Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
          {activeReportTab === 'quotations_status' ? (
            /* Filters for Quotations Status Report */
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Filter className="w-3.5 h-3.5 text-[#7B1818]" />
                  <span>Filter Date Range or Quotation Range</span>
                  <span className="text-[11px] text-slate-500 font-normal lowercase">
                    (leave blank to include all quotations)
                  </span>
                </div>

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">Quick Dates:</span>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('all')}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:border-[#7B1818] rounded-md font-medium text-slate-700 hover:text-[#7B1818] transition-colors cursor-pointer"
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('this_month')}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:border-[#7B1818] rounded-md font-medium text-slate-700 hover:text-[#7B1818] transition-colors cursor-pointer"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('last_30_days')}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:border-[#7B1818] rounded-md font-medium text-slate-700 hover:text-[#7B1818] transition-colors cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('this_year')}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:border-[#7B1818] rounded-md font-medium text-slate-700 hover:text-[#7B1818] transition-colors cursor-pointer"
                  >
                    This Year
                  </button>
                  {(fromDate || toDate || fromRef || toRef || selectedSalesman !== 'all' || selectedStatus !== 'all') && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs px-2 py-1 text-red-700 hover:text-red-900 font-bold flex items-center gap-1 cursor-pointer ml-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {/* Date From */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full text-xs text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Date To */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full text-xs text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>

                {/* From Quotation Ref */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    From Quote Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IGC/26/09/001"
                    value={fromRef}
                    onChange={(e) => setFromRef(e.target.value)}
                    className="w-full text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>

                {/* To Quotation Ref */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    To Quote Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IGC/26/09/050"
                    value={toRef}
                    onChange={(e) => setToRef(e.target.value)}
                    className="w-full text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Salesman Assigned */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Salesman
                  </label>
                  <select
                    value={selectedSalesman}
                    onChange={(e) => setSelectedSalesman(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Salesmen</option>
                    {availableSalesmen.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Order Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-transparent focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="all">All Orders</option>
                    <option value="confirmed">Confirmed Only (JC)</option>
                    <option value="invoiced">Invoiced Only</option>
                    <option value="draft">Drafts Only</option>
                    <option value="cancelled">Cancelled Only</option>
                  </select>
                </div>
              </div>
            </div>
          ) : activeReportTab === 'job_cards' ? (
            /* Filters for Factory Job Cards Report */
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Factory Job Cards Summary Scope</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Includes all factory confirmed production orders divided into <strong>Section 1: Running Jobs</strong> and <strong>Section 2: Completed / Invoiced Jobs</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Filter by Salesman:
                  </label>
                  <select
                    value={jcSalesman}
                    onChange={(e) => setJcSalesman(e.target.value)}
                    className="text-xs text-slate-800 bg-transparent focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="all">All Salesmen ({runningJobCards.length + completedJobCards.length} jobs)</option>
                    {availableSalesmen.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* Filters for System Audit Log Report (LOG) */
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Filter className="w-3.5 h-3.5 text-purple-700" />
                  <span>Filter System Activity & Change Logs</span>
                  <span className="text-[11px] text-slate-500 font-normal lowercase">
                    (tracks creating quotes, editing quotes, job confirmations, comments & salesman reassignments)
                  </span>
                </div>

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">Quick Dates:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLogDateFrom('');
                      setLogDateTo('');
                    }}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:border-purple-700 rounded-md font-medium text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().slice(0, 10);
                      setLogDateFrom(today);
                      setLogDateTo(today);
                    }}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:border-purple-700 rounded-md font-medium text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                      setLogDateFrom(past7);
                      setLogDateTo(now.toISOString().slice(0, 10));
                    }}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:border-purple-700 rounded-md font-medium text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = String(now.getMonth() + 1).padStart(2, '0');
                      setLogDateFrom(`${y}-${m}-01`);
                      setLogDateTo(now.toISOString().slice(0, 10));
                    }}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:border-purple-700 rounded-md font-medium text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
                  >
                    This Month
                  </button>
                  {(logSearch || logUserFilter !== 'all' || logActionFilter !== 'all' || logDateFrom || logDateTo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogSearch('');
                        setLogUserFilter('all');
                        setLogActionFilter('all');
                        setLogDateFrom('');
                        setLogDateTo('');
                      }}
                      className="text-xs px-2 py-1 text-red-700 hover:text-red-900 font-bold flex items-center gap-1 cursor-pointer ml-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Log Filters Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                {/* Search Text */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Search Ref / Client / Details
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. IGC/26, Al Futtaim..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* User Filter */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    User / Operator
                  </label>
                  <select
                    value={logUserFilter}
                    onChange={(e) => setLogUserFilter(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Users ({availableLogUsers.length})</option>
                    {availableLogUsers.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Filter */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Activity / Action
                  </label>
                  <select
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-transparent focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="all">All Change Actions</option>
                    <option value="CREATE_QUOTE">New Quotation Created</option>
                    <option value="EDIT_QUOTE">Quotation Edited</option>
                    <option value="CONFIRM_JOB">Job Card Confirmed</option>
                    <option value="UNCONFIRM_JOB">Job Card Unlocked</option>
                    <option value="UPDATE_COMMENT">Factory / Order Comments</option>
                    <option value="UPDATE_REMARKS">Coordinator Follow-up Remarks</option>
                    <option value="UPDATE_SALESMAN">Salesman Reassignment</option>
                    <option value="UPDATE_INVOICE">Invoiced / Status Flags</option>
                    <option value="CANCEL_QUOTE">Cancelled Quotations</option>
                    <option value="UNCANCEL_QUOTE">Reactivated Quotations</option>
                    <option value="REVISE_QUOTE">Quotation Revisions</option>
                  </select>
                </div>

                {/* Date From */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={logDateFrom}
                    onChange={(e) => setLogDateFrom(e.target.value)}
                    className="w-full text-xs text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Date To */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={logDateTo}
                    onChange={(e) => setLogDateTo(e.target.value)}
                    className="w-full text-xs text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Bar: Download PDF, Print, Close */}
        <div className="bg-white px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900">
              {activeReportTab === 'quotations_status'
                ? `Total Matching Quotations: ${filteredQuotationsReport.length}`
                : activeReportTab === 'job_cards'
                ? `Total Orders: ${runningJobCards.length + completedJobCards.length} (${runningJobCards.length} Running, ${completedJobCards.length} Completed)`
                : `Total Audit Events: ${filteredLogs.length} Changes (${logs.length} Total in Audit Trail)`}
            </span>
            <span className="text-slate-400">•</span>
            <span>A4 Landscape Optimized</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Direct Vector Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Print directly or save as vector PDF using browser printer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print / Save Vector</span>
            </button>

            {/* Download PDF via jsPDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7B1818] hover:bg-[#601212] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
              title="Generate and download official PDF report"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? `Generating (${exportProgress}%)...` : 'Download PDF Document'}</span>
            </button>
          </div>
        </div>

        {/* Progress Alert if generating */}
        {isExporting && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-amber-700 animate-spin" />
              <span>{exportMessage || 'Preparing report for PDF export...'}</span>
            </div>
            <div className="w-36 bg-amber-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#7B1818] h-full transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* DOCUMENT PREVIEW & PDF RENDER CONTAINER                             */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70">
          {/* Printable / Renderable Container */}
          <div
            id="management-report-print-container"
            ref={reportContainerRef}
            className="bg-white text-slate-900 border border-slate-300 shadow-lg rounded-xl mx-auto p-6 sm:p-8 max-w-[1360px] min-w-[1020px] font-sans"
          >
            {/* ============================================================= */}
            {/* REPORT 1: QUOTATIONS STATUS REPORT                            */}
            {/* ============================================================= */}
            {activeReportTab === 'quotations_status' && (
              <div className="space-y-6">
                {/* Corporate Header */}
                <div className="border-b-2 border-[#7B1818] pb-4">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Interglass Brand Logo & Info */}
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-2 border border-slate-300 rounded-xl shadow-2xs shrink-0">
                        <InterglassEmblem width={64} height={42} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black text-[#7B1818] tracking-tight leading-none uppercase">
                          INTER GLASS CO. LLC
                        </h1>
                        <p className="text-xs font-semibold text-slate-700 mt-1 uppercase tracking-wider">
                          Architectural Glass Processing & High-Performance Glazing Solutions
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          P.O. Box 2125, Sharjah / Dubai, United Arab Emirates • Tel: +971 6 7484004 • Email: sales@interglass.org
                        </p>
                      </div>
                    </div>

                    {/* Right: Document Title & Metadata */}
                    <div className="text-right">
                      <div className="inline-block bg-[#7B1818] text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded shadow-2xs">
                        Executive Statement
                      </div>
                      <h2 className="text-lg font-black text-slate-900 mt-1">
                        QUOTATIONS & INVOICES STATUS REPORT
                      </h2>
                      <div className="text-[11px] text-slate-600 mt-1 space-y-0.5 font-mono">
                        <div>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                        <div>Date Filter: {fromDate || toDate ? `${fromDate || 'Beginning'} to ${toDate || 'Present'}` : 'All Dates Included'}</div>
                        <div>Quote Range: {fromRef || toRef ? `${fromRef || 'Start'} - ${toRef || 'End'}` : 'All Quotations'}</div>
                        <div>Authorized By: {currentUser?.name || 'Administrator'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Management KPI Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-slate-50 border border-slate-300 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Quotes</div>
                    <div className="text-xl font-black text-slate-900 font-mono mt-1">{quoteStatusTotals.totalCount}</div>
                    <div className="text-[10px] text-slate-500">Document Count</div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Confirmed (JC)</div>
                    <div className="text-xl font-black text-emerald-900 font-mono mt-1">{quoteStatusTotals.confirmedCount}</div>
                    <div className="text-[10px] text-emerald-700">Orders Active</div>
                  </div>

                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Invoiced Jobs</div>
                    <div className="text-xl font-black text-blue-900 font-mono mt-1">{quoteStatusTotals.invoicedCount}</div>
                    <div className="text-[10px] text-blue-700">Completed Orders</div>
                  </div>

                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Total Glass Pcs</div>
                    <div className="text-xl font-black text-amber-900 font-mono mt-1">{quoteStatusTotals.totalPcs.toLocaleString()}</div>
                    <div className="text-[10px] text-amber-700">Fabrication Pieces</div>
                  </div>

                  <div className="bg-purple-50 border border-purple-300 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Total Glass Area</div>
                    <div className="text-xl font-black text-purple-900 font-mono mt-1">{quoteStatusTotals.totalSqm.toFixed(2)} m²</div>
                    <div className="text-[10px] text-purple-700">Square Meters</div>
                  </div>

                  <div className="bg-[#7B1818]/10 border border-[#7B1818]/30 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#7B1818]">Total Value (AED)</div>
                    <div className="text-base font-black text-[#7B1818] font-mono mt-1 truncate" title={`AED ${quoteStatusTotals.totalAmountWithVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}>
                      AED {quoteStatusTotals.totalAmountWithVat.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-[#7B1818]/80 font-medium">Incl. 5% VAT</div>
                  </div>
                </div>

                {/* Quotations Main Data Table (Identical format to portal) */}
                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-800 font-black bg-slate-200/90 border-b border-slate-300">
                        <th className="py-2.5 px-2 text-center w-12 border-r border-slate-300">S.No.</th>
                        <th className="py-2.5 px-2.5 text-center w-28 border-r border-slate-300">Status</th>
                        <th className="py-2.5 px-3 w-48 border-r border-slate-300">Quote Number</th>
                        <th className="py-2.5 px-2.5 text-center w-24 border-r border-slate-300">Date</th>
                        <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-300">Client & Project</th>
                        <th className="py-2.5 px-3 w-36 border-r border-slate-300">Salesman Assigned</th>
                        <th className="py-2.5 px-2.5 text-center w-24 border-r border-slate-300">Qty (Pcs)</th>
                        <th className="py-2.5 px-2.5 text-center w-24 border-r border-slate-300">Area (m²)</th>
                        <th className="py-2.5 px-3 text-right w-36 border-r border-slate-300">Total Amount</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Remarks / Follow-up</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredQuotationsReport.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                            No quotations match the selected date or quotation range criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredQuotationsReport.map((q, index) => {
                          const { grandTotalQty, grandTotalSqm, totalAmountAED, vatAmountAED, totalWithVatAED } = calculateQuotationTotals(q);
                          const ref = q.from?.refNo || 'Pending Ref';
                          const displayQty = typeof q.confirmedQty === 'number' ? q.confirmedQty : grandTotalQty;
                          const displayAmt = typeof q.confirmedTotalAmount === 'number' ? q.confirmedTotalAmount : totalAmountAED;

                          const isConfirmed = q.status === 'confirmed';
                          const isCancelled = q.status === 'cancelled';
                          const isInvoiced = q.isInvoiced;

                          return (
                            <tr key={q.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                              {/* S.No. */}
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-600 border-r border-slate-200">
                                {index + 1}
                              </td>

                              {/* Status Badge */}
                              <td className="py-2.5 px-2.5 text-center border-r border-slate-200">
                                {isConfirmed ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    <span>{isInvoiced ? 'INVOICED' : 'CONFIRMED'}</span>
                                  </span>
                                ) : isCancelled ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300">
                                    CANCELLED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                    DRAFT
                                  </span>
                                )}
                              </td>

                              {/* Quote Number & Rev */}
                              <td className="py-2.5 px-3 border-r border-slate-200">
                                <div className="font-mono font-black text-slate-900 text-xs">
                                  {ref}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {q.from?.rev || 'REV-00'} • Updated: {formatLastUpdated(q.updatedAt || q.createdAt)}
                                </div>
                              </td>

                              {/* Date */}
                              <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 border-r border-slate-200">
                                {q.from?.dated || '-'}
                              </td>

                              {/* Client & Project */}
                              <td className="py-2.5 px-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900 text-xs">
                                  {q.client?.name || 'Unnamed Client'}
                                </div>
                                <div className="text-[11px] text-slate-600 mt-0.5">
                                  {q.client?.emirate && <span className="text-slate-500">[{q.client.emirate}] </span>}
                                  {q.client?.kindAttn && <span>Attn: {q.client.kindAttn}</span>}
                                </div>
                                {q.client?.ref && (
                                  <div className="text-[10px] text-slate-500 italic mt-0.5">
                                    Project: {q.client.ref}
                                  </div>
                                )}
                              </td>

                              {/* Salesman */}
                              <td className="py-2.5 px-3 border-r border-slate-200">
                                {q.salesmanName ? (
                                  <span className="inline-block text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                    {q.salesmanName}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Unassigned</span>
                                )}
                              </td>

                              {/* Quantity */}
                              <td className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                                {displayQty.toLocaleString()} Pcs
                              </td>

                              {/* Area */}
                              <td className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                                {grandTotalSqm.toFixed(2)} m²
                              </td>

                              {/* Total Amount */}
                              <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200">
                                <div className="font-black text-slate-900 text-xs">
                                  AED {totalWithVatAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Excl. VAT: AED {displayAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </td>

                              {/* Remarks */}
                              <td className="py-2.5 px-3 text-slate-700 text-[11px] italic">
                                {q.coordinatorRemarks || q.comments || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>

                    {/* Table Summary Footer */}
                    {filteredQuotationsReport.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-200/90 font-bold text-slate-900 border-t-2 border-slate-400 text-xs">
                          <td colSpan={6} className="py-3 px-3 text-right uppercase tracking-wider">
                            Total Summary ({quoteStatusTotals.totalCount} Quotations):
                          </td>
                          <td className="py-3 px-2.5 text-center font-mono font-black text-slate-900">
                            {quoteStatusTotals.totalPcs.toLocaleString()} Pcs
                          </td>
                          <td className="py-3 px-2.5 text-center font-mono font-black text-slate-900">
                            {quoteStatusTotals.totalSqm.toFixed(2)} m²
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-950">
                            AED {quoteStatusTotals.totalAmountWithVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-600">
                            VAT Total: AED {quoteStatusTotals.totalVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Sign-off / Verification Footer */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Prepared By</p>
                    <p className="text-slate-500 mt-1">{currentUser?.name || 'Administrator'} (Estimation / Sales)</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Commercial & Accounts Review</p>
                    <p className="text-slate-500 mt-1">Interglass Commercial Dept.</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Management Approval</p>
                    <p className="text-slate-500 mt-1">General Manager / Managing Director</p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* REPORT 2: FACTORY JOB CARDS REPORT                            */}
            {/* ============================================================= */}
            {activeReportTab === 'job_cards' && (
              <div className="space-y-8">
                {/* Corporate Header */}
                <div className="border-b-2 border-emerald-800 pb-4">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Interglass Brand Logo & Info */}
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-2 border border-slate-300 rounded-xl shadow-2xs shrink-0">
                        <InterglassEmblem width={64} height={42} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black text-emerald-900 tracking-tight leading-none uppercase">
                          INTER GLASS CO. LLC
                        </h1>
                        <p className="text-xs font-semibold text-slate-700 mt-1 uppercase tracking-wider">
                          Factory Production & Job Cards Operational Status Report
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Industrial Area Fabrication Plant • Sharjah / Dubai, United Arab Emirates
                        </p>
                      </div>
                    </div>

                    {/* Right: Document Title & Metadata */}
                    <div className="text-right">
                      <div className="inline-block bg-emerald-800 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded shadow-2xs">
                        Plant Operations Statement
                      </div>
                      <h2 className="text-lg font-black text-slate-900 mt-1">
                        FACTORY JOB CARDS PRODUCTION REPORT
                      </h2>
                      <div className="text-[11px] text-slate-600 mt-1 space-y-0.5 font-mono">
                        <div>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                        <div>Production Scope: Running & Completed Orders</div>
                        <div>Authorized By: {currentUser?.name || 'Administrator'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall KPI Executive Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">1. Running Jobs</div>
                    <div className="text-2xl font-black text-amber-950 font-mono mt-1">{runningTotals.count} Orders</div>
                    <div className="text-[10px] text-amber-700">{runningTotals.pcs.toLocaleString()} Pcs • {runningTotals.sqm.toFixed(2)} m²</div>
                  </div>

                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">2. Completed / Invoiced</div>
                    <div className="text-2xl font-black text-emerald-950 font-mono mt-1">{completedTotals.count} Orders</div>
                    <div className="text-[10px] text-emerald-700">{completedTotals.pcs.toLocaleString()} Pcs • {completedTotals.sqm.toFixed(2)} m²</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-300 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Total Factory Orders</div>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">{runningTotals.count + completedTotals.count} Orders</div>
                    <div className="text-[10px] text-slate-500">Confirmed Job Cards</div>
                  </div>

                  <div className="bg-purple-50 border border-purple-300 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Total Glass Volume</div>
                    <div className="text-2xl font-black text-purple-950 font-mono mt-1">{(runningTotals.sqm + completedTotals.sqm).toFixed(2)} m²</div>
                    <div className="text-[10px] text-purple-700">{(runningTotals.pcs + completedTotals.pcs).toLocaleString()} Pieces</div>
                  </div>

                  <div className="bg-emerald-900 text-white rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Total Job Card Value</div>
                    <div className="text-lg font-black text-white font-mono mt-1 truncate" title={`AED ${(runningTotals.amt + completedTotals.amt).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}>
                      AED {(runningTotals.amt + completedTotals.amt).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-emerald-200">Factory Production Value</div>
                  </div>
                </div>

                {/* =========================================================== */}
                {/* SECTION 1: RUNNING JOB CARDS                                */}
                {/* =========================================================== */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-amber-500 text-amber-950 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-900" />
                      <span>SECTION 1: RUNNING JOB CARDS (FACTORY IN-PROGRESS)</span>
                    </div>
                    <span className="font-mono bg-amber-950 text-amber-100 px-2 py-0.5 rounded text-[11px]">
                      {runningJobCards.length} Active Orders
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-800 font-bold bg-amber-50 border-b border-slate-300">
                          <th className="py-2 px-2 text-center w-12 border-r border-slate-300">S.No.</th>
                          <th className="py-2 px-2.5 text-center w-24 border-r border-slate-300">Invoiced</th>
                          <th className="py-2 px-3 w-40 border-r border-slate-300">Job Card Ref</th>
                          <th className="py-2 px-3 min-w-[200px] border-r border-slate-300">Client & Project</th>
                          <th className="py-2 px-3 w-44 border-r border-slate-300">Delivery Timeline</th>
                          <th className="py-2 px-3 w-36 border-r border-slate-300">Salesman</th>
                          <th className="py-2 px-2.5 text-center w-24 border-r border-slate-300">Qty (Pcs)</th>
                          <th className="py-2 px-2.5 text-center w-24 border-r border-slate-300">Glass Area</th>
                          <th className="py-2 px-3 text-right w-32 border-r border-slate-300">Total Amount</th>
                          <th className="py-2 px-3 min-w-[180px]">Factory Comments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {runningJobCards.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-6 text-center text-slate-500 italic">
                              No running job cards in factory production.
                            </td>
                          </tr>
                        ) : (
                          runningJobCards.map((q, index) => {
                            const { grandTotalQty, grandTotalSqm, totalAmountAED } = calculateQuotationTotals(q);
                            const ref = q.from?.refNo || 'Pending Ref';
                            const displayQty = typeof q.confirmedQty === 'number' ? q.confirmedQty : grandTotalQty;
                            const amt = typeof q.confirmedTotalAmount === 'number' ? q.confirmedTotalAmount : totalAmountAED;
                            const timeline = getTimelineBadge(q.committedDeliveryDate);

                            return (
                              <tr key={q.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}>
                                {/* S.No. */}
                                <td className="py-2 px-2 text-center font-mono font-bold text-slate-600 border-r border-slate-200">
                                  {index + 1}
                                </td>

                                {/* Invoiced Status */}
                                <td className="py-2 px-2.5 text-center border-r border-slate-200">
                                  <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                                    RUNNING
                                  </span>
                                </td>

                                {/* Job Card Ref */}
                                <td className="py-2 px-3 font-mono font-black text-slate-900 border-r border-slate-200">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-800 text-white px-1.5 py-0.5 rounded">
                                      JC
                                    </span>
                                    <span>{ref}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    Updated: {formatLastUpdated(q.updatedAt || q.createdAt)}
                                  </div>
                                </td>

                                {/* Client & Project */}
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900 text-xs">{q.client?.name || 'Unnamed Client'}</div>
                                  {q.client?.ref && <div className="text-[10px] text-slate-500 italic mt-0.5">Proj: {q.client.ref}</div>}
                                </td>

                                {/* Delivery Timeline */}
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900 text-[11px]">
                                    {q.committedDeliveryDate || 'Not Set'}
                                  </div>
                                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border mt-0.5 ${timeline.color}`}>
                                    {timeline.text}
                                  </span>
                                </td>

                                {/* Salesman */}
                                <td className="py-2 px-3 border-r border-slate-200">
                                  {q.salesmanName ? (
                                    <span className="text-xs font-bold text-amber-900">{q.salesmanName}</span>
                                  ) : (
                                    <span className="text-slate-400 italic text-xs">Unassigned</span>
                                  )}
                                </td>

                                {/* Qty */}
                                <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                                  {displayQty.toLocaleString()} Pcs
                                </td>

                                {/* Area */}
                                <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                                  {grandTotalSqm.toFixed(2)} m²
                                </td>

                                {/* Amount */}
                                <td className="py-2 px-3 text-right font-mono font-black text-slate-900 border-r border-slate-200">
                                  AED {amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>

                                {/* Factory Comments */}
                                <td className="py-2 px-3 text-slate-700 text-[11px] italic">
                                  {q.factoryComments || '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {runningJobCards.length > 0 && (
                        <tfoot>
                          <tr className="bg-amber-100/80 font-bold text-amber-950 border-t-2 border-amber-300 text-xs">
                            <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider">
                              Section 1 Subtotal ({runningTotals.count} Running Orders):
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-black text-slate-900">
                              {runningTotals.pcs.toLocaleString()} Pcs
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-black text-slate-900">
                              {runningTotals.sqm.toFixed(2)} m²
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                              AED {runningTotals.amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* =========================================================== */}
                {/* SECTION 2: COMPLETED & INVOICED JOB CARDS                   */}
                {/* =========================================================== */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between bg-emerald-700 text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>SECTION 2: COMPLETED & INVOICED JOB CARDS</span>
                    </div>
                    <span className="font-mono bg-emerald-950 text-emerald-100 px-2 py-0.5 rounded text-[11px]">
                      {completedJobCards.length} Delivered / Invoiced Orders
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-800 font-bold bg-emerald-50 border-b border-slate-300">
                          <th className="py-2 px-2 text-center w-12 border-r border-slate-300">S.No.</th>
                          <th className="py-2 px-2.5 text-center w-24 border-r border-slate-300">Invoiced</th>
                          <th className="py-2 px-3 w-40 border-r border-slate-300">Job Card Ref</th>
                          <th className="py-2 px-3 min-w-[200px] border-r border-slate-300">Client & Project</th>
                          <th className="py-2 px-3 w-36 border-r border-slate-300">Salesman</th>
                          <th className="py-2 px-2.5 text-center w-24 border-r border-slate-300">Qty (Pcs)</th>
                          <th className="py-2 px-2.5 text-center w-24 border-r border-slate-300">Glass Area</th>
                          <th className="py-2 px-3 text-right w-32 border-r border-slate-300">Total Amount</th>
                          <th className="py-2 px-3 min-w-[180px]">Factory Comments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {completedJobCards.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-slate-500 italic">
                              No completed job cards found in the system.
                            </td>
                          </tr>
                        ) : (
                          completedJobCards.map((q, index) => {
                            const { grandTotalQty, grandTotalSqm, totalAmountAED } = calculateQuotationTotals(q);
                            const ref = q.from?.refNo || 'Pending Ref';
                            const displayQty = typeof q.confirmedQty === 'number' ? q.confirmedQty : grandTotalQty;
                            const amt = typeof q.confirmedTotalAmount === 'number' ? q.confirmedTotalAmount : totalAmountAED;

                            return (
                              <tr key={q.id} className={index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/20'}>
                                {/* S.No. */}
                                <td className="py-2 px-2 text-center font-mono font-bold text-slate-600 border-r border-slate-200">
                                  {index + 1}
                                </td>

                                {/* Invoiced Status */}
                                <td className="py-2 px-2.5 text-center border-r border-slate-200">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                                    <Check className="w-3 h-3 text-emerald-700" />
                                    <span>INVOICED</span>
                                  </span>
                                </td>

                                {/* Job Card Ref */}
                                <td className="py-2 px-3 font-mono font-black text-slate-900 border-r border-slate-200">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-800 text-white px-1.5 py-0.5 rounded">
                                      JC
                                    </span>
                                    <span>{ref}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    Updated: {formatLastUpdated(q.updatedAt || q.createdAt)}
                                  </div>
                                </td>

                                {/* Client & Project */}
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900 text-xs">{q.client?.name || 'Unnamed Client'}</div>
                                  {q.client?.ref && <div className="text-[10px] text-slate-500 italic mt-0.5">Proj: {q.client.ref}</div>}
                                </td>

                                {/* Salesman */}
                                <td className="py-2 px-3 border-r border-slate-200">
                                  {q.salesmanName ? (
                                    <span className="text-xs font-bold text-amber-900">{q.salesmanName}</span>
                                  ) : (
                                    <span className="text-slate-400 italic text-xs">Unassigned</span>
                                  )}
                                </td>

                                {/* Qty */}
                                <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                                  {displayQty.toLocaleString()} Pcs
                                </td>

                                {/* Area */}
                                <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                                  {grandTotalSqm.toFixed(2)} m²
                                </td>

                                {/* Amount */}
                                <td className="py-2 px-3 text-right font-mono font-black text-slate-900 border-r border-slate-200">
                                  AED {amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>

                                {/* Factory Comments */}
                                <td className="py-2 px-3 text-slate-700 text-[11px] italic">
                                  {q.factoryComments || '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {completedJobCards.length > 0 && (
                        <tfoot>
                          <tr className="bg-emerald-100/80 font-bold text-emerald-950 border-t-2 border-emerald-300 text-xs">
                            <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider">
                              Section 2 Subtotal ({completedTotals.count} Completed Orders):
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-black text-slate-900">
                              {completedTotals.pcs.toLocaleString()} Pcs
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-black text-slate-900">
                              {completedTotals.sqm.toFixed(2)} m²
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                              AED {completedTotals.amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* Combined Grand Production Totals Banner */}
                <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2 text-sm font-sans font-black uppercase text-amber-400">
                    <Layers className="w-5 h-5 text-amber-400" />
                    <span>Combined Factory Grand Totals:</span>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap font-bold">
                    <div>
                      <span className="text-slate-400 font-normal">Total Orders: </span>
                      <span className="text-white text-sm">{runningTotals.count + completedTotals.count} Orders</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">Total Volume: </span>
                      <span className="text-emerald-400 text-sm">{(runningTotals.pcs + completedTotals.pcs).toLocaleString()} Pcs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">Total Glass Area: </span>
                      <span className="text-purple-400 text-sm">{(runningTotals.sqm + completedTotals.sqm).toFixed(2)} m²</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">Total Production Value: </span>
                      <span className="text-amber-300 text-base">AED {(runningTotals.amt + completedTotals.amt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Plant Sign-off / Verification Footer */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Factory & Production Manager</p>
                    <p className="text-slate-500 mt-1">Interglass Plant Operations</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Quality Control (QC) Inspector</p>
                    <p className="text-slate-500 mt-1">Tempering & Glazing Quality Assurance</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Accounts & Invoicing Officer</p>
                    <p className="text-slate-500 mt-1">Delivery Invoicing Verification</p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* REPORT 3: SYSTEM AUDIT & CHANGE LOG REPORT (LOG)              */}
            {/* ============================================================= */}
            {activeReportTab === 'activity_log' && (
              <AuditLogReportView
                logs={filteredLogs}
                currentUser={currentUser}
                filters={{
                  search: logSearch,
                  user: logUserFilter,
                  action: logActionFilter,
                  dateFrom: logDateFrom,
                  dateTo: logDateTo
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
