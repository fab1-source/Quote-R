import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  FileText,
  Layers,
  Calendar,
  Eye,
  Ban,
  X,
  Copy,
  Printer,
  Download,
  Upload,
  ArrowUpDown,
  Building2,
  SlidersHorizontal,
  FileSpreadsheet,
  Check,
  Sparkles,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Lock,
  FileCheck,
  ClipboardList,
  Calculator,
  LogOut,
  Users as UsersIcon,
  Shield,
  Clock
} from 'lucide-react';
import { Quotation, UserAccount } from '../types';
import { InterglassEmblem } from './InterglassLogo';
import { calculateQuotationTotals } from '../utils/calculations';
import { generateNextQuoteNumber, ConfirmationDetails, getDefaultDeliveryDate, updateJobCardFlags } from '../utils/quotationStorage';
import { UsersManagementView } from './UsersManagementView';

interface DashboardViewProps {
  quotations: Quotation[];
  onAddNewQuotation: () => void;
  onOpenQuotation: (
    quotation: Quotation,
    tab?: 'edit' | 'preview' | 'job_card',
    portalTab?: 'quotations' | 'cost_sheet'
  ) => void;
  onDuplicateQuotation: (id: string) => void;
  onCancelQuotation: (id: string, reason: string) => void;
  onConfirmQuotation: (id: string, details: ConfirmationDetails) => void;
  onUnconfirmQuotation: (id: string) => void;
  onLoadSample: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  onNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onUpdateJobCardFlags?: (id: string, updates: { isCompleted?: boolean; isInvoiced?: boolean; committedDeliveryDate?: string }) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotations,
  onAddNewQuotation,
  onOpenQuotation,
  onDuplicateQuotation,
  onCancelQuotation,
  onConfirmQuotation,
  onUnconfirmQuotation,
  onLoadSample,
  onExportBackup,
  onImportBackup,
  currentUser,
  onLogout,
  onNotification,
  onUpdateJobCardFlags,
}) => {
  const isProduction = currentUser.role === 'PRODUCTION';
  const isAdmin = currentUser.role === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'ref-desc'>('date-desc');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Dashboard Primary View Tabs: 'quotations' | 'job_cards' | 'users'
  const [dashboardTab, setDashboardTab] = useState<'quotations' | 'job_cards' | 'users'>(() => {
    if (currentUser.role === 'PRODUCTION') return 'job_cards';
    return 'quotations';
  });

  // Role enforcement when user changes
  React.useEffect(() => {
    if (currentUser.role === 'PRODUCTION' && dashboardTab !== 'job_cards') {
      setDashboardTab('job_cards');
    } else if (currentUser.role !== 'ADMIN' && dashboardTab === 'users') {
      setDashboardTab('quotations');
    }
  }, [currentUser.role, dashboardTab]);
  // Sub-filter for quotations list: 'all' (shows all quotes with confirmed in light greenish tint) | 'confirmed' | 'pending' | 'cancelled'
  const [quotesFilter, setQuotesFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  // Cancellation Modal State
  const [quoteToCancel, setQuoteToCancel] = useState<Quotation | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Confirmation Modal State (Read-only as per last saved quotation)
  const [quoteToConfirm, setQuoteToConfirm] = useState<Quotation | null>(null);
  const [committedDateInput, setCommittedDateInput] = useState<string>(() => getDefaultDeliveryDate(4));

  // Handle open confirmation modal
  const handleOpenConfirmationModal = (quote: Quotation) => {
    setQuoteToConfirm(quote);
    setCommittedDateInput(quote.committedDeliveryDate || getDefaultDeliveryDate(4));
  };

  // Adjust committed delivery date by delta days (e.g. -1, +1)
  const adjustCommittedDate = (deltaDays: number) => {
    const base = committedDateInput ? new Date(committedDateInput + 'T00:00:00') : new Date();
    base.setDate(base.getDate() + deltaDays);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    setCommittedDateInput(`${yyyy}-${mm}-${dd}`);
  };

  // Human-readable description of committed delivery date relative to today
  const getDaysFromTodayDesc = (dateStr: string) => {
    if (!dateStr) return 'No delivery date selected';
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dayName = target.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (diffDays === 0) return `Due Today • Final Day (${dayName})`;
    if (diffDays === 1) return `1 day from today • Final day arriving (${dayName})`;
    if (diffDays > 1) return `${diffDays} days from today (${dayName})`;
    return `${Math.abs(diffDays)} day(s) overdue (${dayName})`;
  };

  // Save updated delivery date for an already confirmed quotation
  const handleUpdateCommittedDateOnly = () => {
    if (!quoteToConfirm) return;
    const newDate = committedDateInput || getDefaultDeliveryDate(4);
    if (onUpdateJobCardFlags) {
      onUpdateJobCardFlags(quoteToConfirm.id, { committedDeliveryDate: newDate });
    } else {
      updateJobCardFlags(quoteToConfirm.id, { committedDeliveryDate: newDate });
    }
    if (onNotification) {
      onNotification(`Committed delivery date updated to ${newDate}`, 'success');
    }
    setQuoteToConfirm(null);
  };

  // Toggle Job Card flags: isCompleted (greys out) & isInvoiced (darker green tone)
  const handleToggleJobFlag = (id: string, flag: 'isCompleted' | 'isInvoiced') => {
    const target = quotations.find((q) => q.id === id);
    if (!target) return;
    const currentVal = Boolean(target[flag]);
    const newVal = !currentVal;
    if (onUpdateJobCardFlags) {
      onUpdateJobCardFlags(id, { [flag]: newVal });
    } else {
      updateJobCardFlags(id, { [flag]: newVal });
    }
    if (onNotification) {
      if (flag === 'isCompleted') {
        onNotification(
          newVal
            ? `Job Card ${target.from?.refNo || ''} marked as Completed (greyed out)`
            : `Job Card ${target.from?.refNo || ''} marked as In Progress`,
          'info'
        );
      } else {
        onNotification(
          newVal
            ? `Job Card ${target.from?.refNo || ''} marked as Invoiced (darker green)`
            : `Job Card ${target.from?.refNo || ''} marked as Uninvoiced`,
          'success'
        );
      }
    }
  };

  // Calculates daily filling progress bar and status for job cards
  const getDeliveryProgress = (q: Quotation) => {
    const deliveryDateStr = q.committedDeliveryDate || getDefaultDeliveryDate(4);
    const targetDate = new Date(deliveryDateStr + 'T00:00:00');

    let startDate: Date;
    if (q.confirmedAt) {
      startDate = new Date(q.confirmedAt);
    } else if (q.createdAt) {
      startDate = new Date(q.createdAt);
    } else {
      startDate = new Date();
    }
    startDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total duration in days (minimum 1)
    const totalDays = Math.max(1, Math.round((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Days elapsed since confirmation (from 0 to totalDays)
    const elapsedDays = Math.max(0, Math.round((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Days remaining until delivery
    const daysRemaining = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Daily fill percentage (clamped between 0 and 100)
    let percent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    if (percent === 0 && daysRemaining >= 0) {
      percent = Math.min(100, Math.max(12, Math.round(100 / totalDays)));
    }
    if (daysRemaining <= 0) {
      percent = 100;
    }

    // Turns red as the final day is arriving (daysRemaining <= 1 or overdue)
    const isFinalDay = daysRemaining === 1;
    const isDueToday = daysRemaining === 0;
    const isOverdue = daysRemaining < 0;
    const isWarning = daysRemaining === 2;

    let barColorClass = 'bg-emerald-500';
    let badgeColorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    let statusText = `${daysRemaining}d left`;

    if (isOverdue) {
      barColorClass = 'bg-red-600';
      badgeColorClass = 'bg-red-100 text-red-900 border-red-300 font-bold';
      statusText = `${Math.abs(daysRemaining)}d Overdue!`;
    } else if (isDueToday) {
      barColorClass = 'bg-red-600 animate-pulse';
      badgeColorClass = 'bg-red-100 text-red-900 border-red-300 font-bold';
      statusText = 'Due Today! (Final Day)';
    } else if (isFinalDay) {
      barColorClass = 'bg-red-500 animate-pulse';
      badgeColorClass = 'bg-red-50 text-red-800 border-red-200 font-bold';
      statusText = '1 Day Left (Final Day)';
    } else if (isWarning) {
      barColorClass = 'bg-amber-500';
      badgeColorClass = 'bg-amber-50 text-amber-900 border-amber-200';
      statusText = '2 days left';
    } else {
      statusText = `${daysRemaining} days left`;
    }

    const formattedDate = targetDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return {
      deliveryDateStr,
      formattedDate,
      totalDays,
      elapsedDays,
      daysRemaining,
      percent,
      barColorClass,
      badgeColorClass,
      statusText,
      isFinalDay: isFinalDay || isDueToday || isOverdue,
      isWarning,
    };
  };

  // Submit Confirmation (Moves confirmed quotation to Job Cards with exact saved quotation values and committed delivery date)
  const handleConfirmOrderSubmit = () => {
    if (!quoteToConfirm) return;
    const { grandTotalQty, totalAmountAED } = calculateQuotationTotals(quoteToConfirm);

    onConfirmQuotation(quoteToConfirm.id, {
      clientName: (quoteToConfirm.client?.name || '').trim(),
      salesmanName: (quoteToConfirm.salesmanName || quoteToConfirm.from?.attention || '').trim(),
      qty: grandTotalQty,
      totalAmount: totalAmountAED,
      committedDeliveryDate: committedDateInput || getDefaultDeliveryDate(4),
    });

    setQuoteToConfirm(null);
    // Keep user in quotations tab where the confirmed quote displays in light greenish tint, locked for editing
    setDashboardTab('quotations');
    setQuotesFilter('all');
  };

  // Unconfirm Order (Moves back to quotations)
  const handleUnconfirmOrder = () => {
    if (!quoteToConfirm) return;
    onUnconfirmQuotation(quoteToConfirm.id);
    setQuoteToConfirm(null);
    setDashboardTab('quotations');
  };

  // Handle open cancellation modal
  const handleOpenCancelModal = (quote: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuoteToCancel(quote);
    setCancelReasonInput('');
    setCancelError('');
  };

  // Confirm cancellation
  const handleConfirmCancel = () => {
    if (!quoteToCancel) return;
    if (!cancelReasonInput.trim()) {
      setCancelError('Please provide a reason for cancelling this quotation.');
      return;
    }
    onCancelQuotation(quoteToCancel.id, cancelReasonInput.trim());
    setQuoteToCancel(null);
    setCancelReasonInput('');
    setCancelError('');
  };

  // Compute next quote number for display on the Add button
  const nextQuoteNumber = useMemo(() => {
    return generateNextQuoteNumber(new Date(), quotations);
  }, [quotations]);

  // Extract available months for filtering
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    quotations.forEach((q) => {
      const ref = q.from?.refNo || '';
      // Check if format IGC/YY/MM/...
      const parts = ref.split('/');
      if (parts.length >= 3 && parts[0] === 'IGC') {
        monthsSet.add(`${parts[1]}/${parts[2]}`);
      } else if (q.from?.dated) {
        // Fallback to dated e.g. 03-09-2026
        const dateParts = q.from.dated.split('-');
        if (dateParts.length === 3) {
          const yy = dateParts[2].slice(-2);
          const mm = dateParts[1];
          monthsSet.add(`${yy}/${mm}`);
        }
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [quotations]);

  // Pre-calculate tab counts for badges
  const tabCounts = useMemo(() => {
    let unconfirmedQuotesCount = 0;
    let confirmedJobCardsCount = 0;
    let cancelledCount = 0;

    quotations.forEach((q) => {
      if (q.status === 'confirmed') {
        confirmedJobCardsCount++;
      } else if (q.status === 'cancelled') {
        cancelledCount++;
      } else {
        unconfirmedQuotesCount++;
      }
    });

    return {
      unconfirmedQuotesCount,
      confirmedCount: confirmedJobCardsCount,
      confirmedJobCardsCount,
      cancelledCount,
      totalCount: quotations.length,
      activeAndConfirmedCount: unconfirmedQuotesCount + confirmedJobCardsCount,
    };
  }, [quotations]);

  // Filter and sort quotations according to active dashboard tab & sub-filters
  const filteredQuotations = useMemo(() => {
    return quotations
      .filter((q) => {
        // Tab 1: Quotations
        if (dashboardTab === 'quotations') {
          if (quotesFilter === 'pending' && (q.status === 'confirmed' || q.status === 'cancelled')) {
            return false;
          }
          if (quotesFilter === 'confirmed' && q.status !== 'confirmed') {
            return false;
          }
          if (quotesFilter === 'cancelled' && q.status !== 'cancelled') {
            return false;
          }
          // Default 'all': keep confirmed quotes right in the table with light greenish tint! Exclude cancelled.
          if (quotesFilter === 'all' && q.status === 'cancelled') {
            return false;
          }
        }
        // Tab 2: JOB CARDS (Confirmed production orders only)
        else if (dashboardTab === 'job_cards') {
          if (q.status !== 'confirmed') {
            return false;
          }
        }

        const query = searchTerm.toLowerCase().trim();
        const refMatch = (q.from?.refNo || '').toLowerCase().includes(query);
        const clientMatch = (q.client?.name || '').toLowerCase().includes(query);
        const emirateMatch = (q.client?.emirate || '').toLowerCase().includes(query);
        const attnMatch = (q.client?.kindAttn || '').toLowerCase().includes(query);
        const titleMatch = (q.title || '').toLowerCase().includes(query);
        const salesmanMatch = (q.salesmanName || '').toLowerCase().includes(query);

        const matchesSearch = !query || refMatch || clientMatch || emirateMatch || attnMatch || titleMatch || salesmanMatch;

        if (!matchesSearch) return false;

        if (selectedMonth !== 'all') {
          const ref = q.from?.refNo || '';
          const hasMonth = ref.includes(`/${selectedMonth}/`);
          return hasMonth;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount-desc') {
          const totalA = calculateQuotationTotals(a).totalWithVatAED;
          const totalB = calculateQuotationTotals(b).totalWithVatAED;
          return totalB - totalA;
        }
        if (sortBy === 'date-asc') {
          return new Date(a.createdAt || a.updatedAt).getTime() - new Date(b.createdAt || b.updatedAt).getTime();
        }
        if (sortBy === 'ref-desc') {
          return (b.from?.refNo || '').localeCompare(a.from?.refNo || '');
        }
        // Default: date-desc (newest first)
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      });
  }, [quotations, dashboardTab, quotesFilter, searchTerm, selectedMonth, sortBy]);

  // Calculate Overall Dashboard Metrics
  const metrics = useMemo(() => {
    let pendingPipelineValue = 0; // Excl. VAT, pending orders only (not confirmed, not cancelled)
    let confirmedJobsValue = 0;   // Excl. VAT, confirmed orders only
    let confirmedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    quotations.forEach((q) => {
      const { totalAmountAED } = calculateQuotationTotals(q);

      if (q.status === 'confirmed') {
        confirmedCount++;
        const confirmedAmt = typeof q.confirmedTotalAmount === 'number' && q.confirmedTotalAmount > 0
          ? q.confirmedTotalAmount
          : totalAmountAED;
        confirmedJobsValue += confirmedAmt;
      } else if (q.status === 'cancelled') {
        cancelledCount++;
      } else {
        pendingCount++;
        pendingPipelineValue += totalAmountAED;
      }
    });

    // Current month count (e.g. 26/09)
    const now = new Date();
    const currentYyMm = `${String(now.getFullYear()).slice(-2)}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthCount = quotations.filter((q) => (q.from?.refNo || '').includes(`/${currentYyMm}/`)).length;

    return {
      count: quotations.length,
      confirmedCount,
      pendingCount,
      cancelledCount,
      pendingPipelineValue,
      confirmedJobsValue,
      thisMonthCount,
      currentYyMm,
    };
  }, [quotations]);

  const handleCopyRef = (refNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(refNo);
    setCopiedRef(refNo);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Production specific metrics
  const prodMetrics = useMemo(() => {
    let totalPcs = 0;
    let totalSqm = 0;
    const confirmedList = quotations.filter((q) => q.status === 'confirmed');
    confirmedList.forEach((q) => {
      const { grandTotalQty, grandTotalSqm } = calculateQuotationTotals(q);
      totalPcs += typeof q.confirmedQty === 'number' ? q.confirmedQty : grandTotalQty;
      totalSqm += grandTotalSqm;
    });
    return {
      count: confirmedList.length,
      totalPcs,
      totalSqm,
    };
  }, [quotations]);

  return (
    <div className="flex-1 bg-slate-50/80 min-h-screen">
      {/* Top Banner / Hero Header */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          {/* Top Row: User Status & Sign Out */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Interglass Commercial & Production System</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline">Access Level: <strong className="text-slate-700">{currentUser.role}</strong></span>
            </div>

            <div className="flex items-center gap-3">
              {/* Logged in User Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-red-700'
                      : currentUser.role === 'ESTIMATION'
                      ? 'bg-blue-700'
                      : 'bg-emerald-700'
                  }`}
                >
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 mr-1.5">{currentUser.username}</span>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${
                      currentUser.role === 'ADMIN'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : currentUser.role === 'ESTIMATION'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Sign out of Interglass Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Branding & Title */}
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs shrink-0 mt-0.5">
                <InterglassEmblem width={60} height={38} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-serif italic font-black text-[#7B1818] tracking-wide">
                    INTERGLASS CO. LLC
                  </h1>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-md uppercase tracking-wider border ${
                      isProduction
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-red-50 text-[#7B1818] border-red-200/80'
                    }`}
                  >
                    {isProduction ? 'Factory Production Portal' : 'Quotations Portal'}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mt-1">
                  {isProduction
                    ? 'Authorized Factory View: Review cutting lists, glass types, piece sizes, and fabrication orders'
                    : 'Manage, track, and generate official glass supply quotations with sequential ref numbers'}
                </p>
              </div>
            </div>

            {/* Primary Actions (Hidden for PRODUCTION users) */}
            {!isProduction && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={onAddNewQuotation}
                  id="btn-add-new-quotation"
                  className="px-5 py-2.5 bg-[#7B1818] hover:bg-[#631313] text-white rounded-lg shadow-sm hover:shadow-md font-medium text-sm flex items-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-white/90" />
                  <span className="font-semibold">Add New Quotation</span>
                  <span className="hidden sm:inline-block text-[11px] bg-white/20 px-2 py-0.5 rounded text-white/90 font-mono">
                    {nextQuoteNumber}
                  </span>
                </button>

                <label className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Import JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={onImportBackup}
                    className="hidden"
                  />
                </label>

                {quotations.length > 0 && (
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download full JSON backup of all quotations"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Backup All</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Metrics Cards */}
          {isProduction ? (
            /* Factory Production Metrics (No amounts, no financials) */
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Job Cards</span>
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-950">{prodMetrics.count}</span>
                  <span className="text-xs text-emerald-700 font-medium">orders</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                  Confirmed for factory fabrication
                </div>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Pieces to Produce</span>
                  <Layers className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-emerald-950 font-mono">
                    {prodMetrics.totalPcs.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">Pcs</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">
                  Total glass units in fabrication queue
                </div>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Glass Area</span>
                  <Layers className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-emerald-950 font-mono">
                    {prodMetrics.totalSqm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">m²</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 font-mono">
                  Cumulative square meters
                </div>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Factory Status</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-emerald-900">Queue Active</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">
                  Ready for cutting & processing
                </div>
              </div>
            </div>
          ) : (
            /* Commercial & Estimation Metrics */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Quotations</span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{metrics.count}</span>
                  <span className="text-xs text-slate-500 font-medium">records</span>
                </div>
                <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium truncate">
                  <span>Next:</span>
                  <span className="font-mono font-bold text-[#7B1818]">{nextQuoteNumber}</span>
                </div>
              </div>

              {/* Confirmed Orders (e.g. 1/3) */}
              <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Confirmed Orders</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-950 font-mono">
                    {metrics.confirmedCount}/{metrics.count}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">orders</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 font-medium truncate">
                  {metrics.confirmedCount} confirmed of {metrics.count} total
                </div>
              </div>

              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pipeline Value</span>
                  <span className="text-xs font-mono font-bold text-slate-400">AED</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900 font-mono">
                    {metrics.pendingPipelineValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span className="font-semibold text-slate-700">Excl. VAT</span>
                  <span>• Pending orders only</span>
                </div>
              </div>

              {/* Confirmed Jobs Value (Excl. VAT) */}
              <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Confirmed Jobs Value</span>
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-emerald-950 font-mono">
                    {metrics.confirmedJobsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                  <span className="font-semibold text-emerald-900">Excl. VAT</span>
                  <span>• In Production</span>
                </div>
              </div>

              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">This Month</span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#7B1818]">{metrics.thisMonthCount}</span>
                  <span className="text-xs text-slate-500 font-medium">in {metrics.currentYyMm}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Serial count in current cycle
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: Tabs, Search, Filters & Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Primary Dashboard Tabs: QUOTATIONS vs JOB CARDS vs USERS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 mb-6 gap-4">
          <div className="flex items-center gap-1 sm:gap-3 flex-wrap">
            {/* Tab 1: Quotations (Hidden for PRODUCTION users) */}
            {!isProduction && (
              <button
                type="button"
                onClick={() => setDashboardTab('quotations')}
                className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold flex items-center gap-2.5 border-b-2 transition-all cursor-pointer ${
                  dashboardTab === 'quotations'
                    ? 'border-[#7B1818] text-[#7B1818]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Quotations</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                    dashboardTab === 'quotations' ? 'bg-red-100 text-[#7B1818]' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {quotesFilter === 'pending'
                    ? tabCounts.unconfirmedQuotesCount
                    : quotesFilter === 'confirmed'
                    ? tabCounts.confirmedCount
                    : quotesFilter === 'cancelled'
                    ? tabCounts.cancelledCount
                    : tabCounts.activeAndConfirmedCount}
                </span>
              </button>
            )}

            {/* Tab 2: JOB CARDS (Visible to All) */}
            <button
              type="button"
              onClick={() => setDashboardTab('job_cards')}
              className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold flex items-center gap-2.5 border-b-2 transition-all cursor-pointer ${
                dashboardTab === 'job_cards'
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-emerald-700'
              }`}
            >
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span>JOB CARDS</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  dashboardTab === 'job_cards' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {tabCounts.confirmedJobCardsCount}
              </span>
              {tabCounts.confirmedJobCardsCount > 0 && (
                <span className="hidden md:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Factory Orders
                </span>
              )}
            </button>

            {/* Tab 3: Users (ONLY VISIBLE TO ADMIN) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setDashboardTab('users')}
                className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold flex items-center gap-2.5 border-b-2 transition-all cursor-pointer ${
                  dashboardTab === 'users'
                    ? 'border-purple-700 text-purple-900 bg-purple-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-purple-800'
                }`}
              >
                <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                <span>Users</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                  Admin Only
                </span>
              </button>
            )}
          </div>

          {/* Sub-Filters for Quotations Tab */}
          {dashboardTab === 'quotations' && (
            <div className="flex items-center gap-1.5 pb-2.5 text-xs flex-wrap">
              <span className="text-slate-400 font-medium text-[11px] mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setQuotesFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  quotesFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70 bg-slate-100'
                }`}
                title="All active and confirmed quotes (with confirmed in light green)"
              >
                All Quotes ({tabCounts.activeAndConfirmedCount})
              </button>
              <button
                type="button"
                onClick={() => setQuotesFilter('confirmed')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  quotesFilter === 'confirmed'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-emerald-800 hover:bg-emerald-100 bg-emerald-50 border border-emerald-300'
                }`}
                title="Confirmed quotations (locked for editing, light greenish tint)"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confirmed ({tabCounts.confirmedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setQuotesFilter('pending')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  quotesFilter === 'pending'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70 bg-slate-100'
                }`}
                title="Quotations pending client confirmation"
              >
                Pending ({tabCounts.unconfirmedQuotesCount})
              </button>
              {tabCounts.cancelledCount > 0 && (
                <button
                  type="button"
                  onClick={() => setQuotesFilter('cancelled')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    quotesFilter === 'cancelled'
                      ? 'bg-red-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/70 bg-slate-100'
                  }`}
                  title="Cancelled quotations"
                >
                  Cancelled ({tabCounts.cancelledCount})
                </button>
              )}
            </div>
          )}

          {/* Banner note for Job Cards tab */}
          {dashboardTab === 'job_cards' && (
            <div className="pb-2.5 text-xs text-emerald-800 flex items-center gap-2">
              <span className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Factory Production View: Strictly no amounts, pricing, or commercial terms</span>
              </span>
            </div>
          )}
        </div>

        {/* Conditional Content: Users Management (Admin) vs Tables */}
        {dashboardTab === 'users' && isAdmin ? (
          <UsersManagementView
            currentUser={currentUser}
            onNotification={onNotification}
          />
        ) : (
          <>
            {/* Controls Bar: Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    dashboardTab === 'job_cards'
                      ? 'Search job cards by ref, client, salesman, emirate...'
                      : 'Search quotations by quote ref, client, salesman...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7B1818]/20 focus:border-[#7B1818] transition-all shadow-2xs"
                />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Month Filter */}
            {availableMonths.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs text-xs text-slate-600">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  aria-label="Filter by month"
                  className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Months</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      Month {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs text-xs text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort items"
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                {dashboardTab === 'quotations' && <option value="amount-desc">Highest Amount</option>}
                <option value="ref-desc">Reference (Z-A)</option>
              </select>
            </div>

            {/* Sample Loader Shortcut */}
            <button
              type="button"
              onClick={onLoadSample}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-[#7B1818] bg-white border border-slate-200 hover:border-red-200 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Add sample quotation template"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Load Sample</span>
            </button>
          </div>
        </div>

        {/* Content View: When no items match */}
        {filteredQuotations.length === 0 ? (
          dashboardTab === 'job_cards' ? (
            /* Empty State for Job Cards */
            <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center shadow-2xs">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-700">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Job Cards in Production Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Whenever you confirm a quotation by clicking its <strong>Confirmed</strong> checkbox in the Quotations tab, it will automatically move here as a factory <strong>Job Card</strong> (with piece sizes, glass types, and salesman, but strictly without amounts or terms).
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDashboardTab('quotations')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Go to Quotations List</span>
                </button>
              </div>
            </div>
          ) : (
            /* Empty State for Quotations */
            <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center shadow-2xs">
              <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#7B1818]">
                <FileText className="w-8 h-8" />
              </div>
              {searchTerm || selectedMonth !== 'all' || quotesFilter !== 'all' ? (
                <>
                  <h3 className="text-base font-semibold text-slate-800">No matching quotations found</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    {quotesFilter === 'pending' && tabCounts.unconfirmedQuotesCount === 0 && tabCounts.confirmedJobCardsCount > 0
                      ? 'All active quotations have been confirmed and moved to the JOB CARDS tab.'
                      : 'No quotes match your active search or filter criteria. Try clearing search filters or switching sub-filters.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                    {tabCounts.confirmedJobCardsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setDashboardTab('job_cards')}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span>View Confirmed Job Cards ({tabCounts.confirmedJobCardsCount})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedMonth('all');
                        setQuotesFilter('all');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-serif italic font-bold text-slate-900">
                    Welcome to Interglass Quotations Portal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
                    No quotations created yet. Click the button below to start your first quote with auto-generated serial number <span className="font-mono font-bold text-[#7B1818]">{nextQuoteNumber}</span>.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={onAddNewQuotation}
                      className="px-5 py-2.5 bg-[#7B1818] hover:bg-[#631313] text-white rounded-lg shadow-sm font-medium text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Quotation ({nextQuoteNumber})</span>
                    </button>
                    <button
                      type="button"
                      onClick={onLoadSample}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                      <span>Load Sample Template</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        ) : dashboardTab === 'job_cards' ? (
          /* ============================================================ */
          /* TAB 2: FACTORY JOB CARDS TABLE (NO AMOUNTS, NO TERMS)        */
          /* ============================================================ */
          <div className="bg-white border border-emerald-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900 flex-wrap gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                <span>Production Job Cards ({filteredQuotations.length} Active)</span>
                <span className="text-emerald-700 font-normal">
                  • Click any row to open the complete factory copy
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium italic">
                Strictly confidential: Prices, rates, VAT, and terms are excluded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                    <th className="py-3 px-3 text-left w-36">Stage Checklist</th>
                    <th className="py-3 px-3 text-center w-28">Status</th>
                    <th className="py-3 px-4 w-44">Job Card Ref</th>
                    <th className="py-3 px-3 w-28">Date</th>
                    <th className="py-3 px-4">Client & Project</th>
                    <th className="py-3 px-4 w-52">Delivery Timeline</th>
                    <th className="py-3 px-4 w-40">Salesman Assigned</th>
                    <th className="py-3 px-3 text-center w-24">Total Qty</th>
                    <th className="py-3 px-3 text-center w-28">Glass Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotations.map((q) => {
                    const { grandTotalQty, grandTotalSqm } = calculateQuotationTotals(q);
                    const ref = q.from?.refNo || 'Pending Ref';
                    const isCopied = copiedRef === ref;
                    const displayQty = typeof q.confirmedQty === 'number' ? q.confirmedQty : grandTotalQty;
                    const delivery = getDeliveryProgress(q);

                    let rowClassName = 'transition-colors cursor-pointer group text-slate-800 ';
                    if (q.isCompleted) {
                      // Clicking completed will grey out the job card
                      rowClassName += 'bg-slate-200/90 hover:bg-slate-300/80 border-l-4 border-l-slate-500 text-slate-600 opacity-75 grayscale-[30%]';
                    } else if (q.isInvoiced) {
                      // Clicking invoiced will turn whole job card in little more darker green tone
                      rowClassName += 'bg-emerald-200/90 hover:bg-emerald-300/80 border-l-4 border-l-emerald-800 text-emerald-950 font-medium';
                    } else {
                      // Default confirmed job card
                      rowClassName += 'bg-emerald-50/40 hover:bg-emerald-100/60 border-l-4 border-l-emerald-600';
                    }

                    return (
                      <tr
                        key={q.id}
                        onClick={() => onOpenQuotation(q, 'job_card')}
                        className={rowClassName}
                      >
                        {/* Stage Checklist: Checkboxes in front of each job card (Completed & Invoiced) */}
                        <td className="py-3 px-3 align-top text-left" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1.5 p-1.5 bg-white/85 rounded-lg border border-slate-200 shadow-2xs">
                            <label
                              className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none group/chk"
                              title="Mark as completed (greys out job card)"
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(q.isCompleted)}
                                onChange={() => handleToggleJobFlag(q.id, 'isCompleted')}
                                className="w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500 cursor-pointer accent-slate-700"
                              />
                              <span
                                className={`text-[11px] transition-colors ${
                                  q.isCompleted ? 'text-slate-900 font-bold line-through' : 'text-slate-600 group-hover/chk:text-slate-900'
                                }`}
                              >
                                Completed
                              </span>
                            </label>
                            <label
                              className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none group/chk"
                              title="Mark as invoiced (turns job card darker green tone)"
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(q.isInvoiced)}
                                onChange={() => handleToggleJobFlag(q.id, 'isInvoiced')}
                                className="w-4 h-4 rounded border-emerald-400 text-emerald-700 focus:ring-emerald-600 cursor-pointer accent-emerald-700"
                              />
                              <span
                                className={`text-[11px] transition-colors ${
                                  q.isInvoiced ? 'text-emerald-950 font-black' : 'text-slate-600 group-hover/chk:text-emerald-950'
                                }`}
                              >
                                Invoiced
                              </span>
                            </label>
                          </div>
                        </td>

                        {/* Status badge / Click to edit */}
                        <td className="py-3 px-3 align-top text-center" onClick={(e) => e.stopPropagation()}>
                          {isProduction ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold bg-emerald-100 border-emerald-300 text-emerald-950 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Confirmed</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenConfirmationModal(q)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-all bg-emerald-100 border-emerald-300 text-emerald-950 shadow-2xs hover:bg-emerald-200"
                              title="Click to view confirmed order details or unconfirm back to quotes"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Confirmed</span>
                            </button>
                          )}
                        </td>

                        {/* Job Card Ref */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white px-1.5 py-0.5 rounded font-mono">
                              JC
                            </span>
                            <span className="font-mono font-extrabold text-xs sm:text-sm px-2 py-0.5 rounded border text-emerald-950 bg-white border-emerald-300 shadow-2xs">
                              {ref}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyRef(ref, e)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
                              title="Copy Job Card Ref"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-1">
                            {q.from?.rev || 'REV-00'} • Confirmed {q.confirmedAt ? new Date(q.confirmedAt).toLocaleDateString('en-GB') : 'Ready'}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 align-top text-slate-600 font-mono text-xs">
                          {q.from?.dated || new Date(q.createdAt).toLocaleDateString('en-GB')}
                        </td>

                        {/* Client & Details */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-bold text-sm text-slate-900">
                            {q.client?.name || <span className="text-slate-400 italic">No client name entered</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                            {q.client?.emirate && (
                              <span className="inline-flex items-center gap-1 text-[11px] bg-white px-1.5 py-0.2 rounded font-medium text-slate-600 border border-slate-200">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {q.client.emirate}
                              </span>
                            )}
                            {q.client?.kindAttn && (
                              <span className="text-[11px] text-slate-500">
                                Attn: <span className="text-slate-700 font-medium">{q.client.kindAttn}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Delivery Timeline: between Client & Project and Salesman Assigned */}
                        <td className="py-3 px-4 align-top" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1.5 min-w-[170px]">
                            <div className="flex items-center justify-between text-xs gap-1">
                              <div className="flex items-center gap-1 font-bold text-slate-900 text-[11px]">
                                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>{delivery.formattedDate}</span>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${delivery.badgeColorClass}`}>
                                {delivery.statusText}
                              </span>
                            </div>

                            {/* Bar filling everyday, turns red as final day arrives */}
                            <div className="w-full bg-slate-200/90 rounded-full h-2 overflow-hidden shadow-inner">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${delivery.barColorClass}`}
                                style={{ width: `${delivery.percent}%` }}
                                title={`Delivery timeline: ${delivery.percent}% completed`}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>
                                {delivery.isFinalDay ? (
                                  <span className="text-red-700 font-bold flex items-center gap-0.5">
                                    <Clock className="w-3 h-3 text-red-600 shrink-0 animate-pulse" />
                                    Final Day
                                  </span>
                                ) : (
                                  <span>Day {Math.min(delivery.elapsedDays + 1, delivery.totalDays)} of {delivery.totalDays}</span>
                                )}
                              </span>
                              <span className="font-semibold">{delivery.percent}%</span>
                            </div>

                            {/* Quick edit delivery date link */}
                            {!isProduction && (
                              <div className="pt-0.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenConfirmationModal(q)}
                                  className="text-[10px] text-emerald-800 hover:text-emerald-950 underline font-medium cursor-pointer"
                                >
                                  Edit Date
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Salesman Assigned */}
                        <td className="py-3 px-4 align-top">
                          {q.salesmanName ? (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
                              <UserCheck className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                              <span>{q.salesmanName}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not Assigned</span>
                          )}
                        </td>

                        {/* Quantity (Pcs) */}
                        <td className="py-3 px-3 align-top text-center">
                          <div className="font-mono font-bold text-sm text-slate-900">
                            {displayQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">Pcs</span>
                          </div>
                        </td>

                        {/* Total Glass Area */}
                        <td className="py-3 px-3 align-top text-center">
                          <div className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                            {grandTotalSqm.toFixed(2)} m²
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {q.glassSections?.length || 0} Types
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Summary in Job Cards Table */}
            <div className="px-4 py-3 bg-emerald-50/50 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <div>
                Showing <span className="font-bold text-emerald-900">{filteredQuotations.length}</span> confirmed factory Job Cards
              </div>
              <div className="text-slate-500 text-[11px]">
                To modify or unlock any Job Card, click its <strong>Confirmed</strong> badge or <strong>Specs</strong> button.
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* TAB 1: QUOTATIONS TABLE                                      */
          /* ============================================================ */
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="py-3 px-3 text-center w-32">Confirmed</th>
                    <th className="py-3 px-4 w-44">Quote Number</th>
                    <th className="py-3 px-3 w-28">Date</th>
                    <th className="py-3 px-4">Client & Details</th>
                    <th className="py-3 px-3 text-center w-28">Glass Specs</th>
                    <th className="py-3 px-4 text-right w-36">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotations.map((q) => {
                    const { grandTotalQty, grandTotalSqm, totalWithVatAED } = calculateQuotationTotals(q);
                    const ref = q.from?.refNo || 'Pending Ref';
                    const isCopied = copiedRef === ref;
                    const isCancelled = q.status === 'cancelled';
                    const isConfirmed = q.status === 'confirmed';

                    return (
                      <tr
                        key={q.id}
                        onClick={() => onOpenQuotation(q, 'edit')}
                        className={`transition-colors cursor-pointer group ${
                          isConfirmed
                            ? 'bg-emerald-50/70 hover:bg-emerald-100/50 border-l-4 border-l-emerald-600 text-slate-800'
                            : isCancelled
                            ? 'bg-slate-100/75 hover:bg-slate-200/50 opacity-65 text-slate-500 border-l-4 border-l-slate-400'
                            : 'hover:bg-slate-50/70 border-l-4 border-l-transparent'
                        }`}
                      >
                        {/* Confirmed Checkbox Column */}
                        <td className="py-3 px-3 align-top text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCancelled) return;
                              handleOpenConfirmationModal(q);
                            }}
                            disabled={isCancelled}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                              isCancelled
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                                : isConfirmed
                                ? 'bg-emerald-100/90 border-emerald-300 text-emerald-900 shadow-2xs hover:bg-emerald-200/80 ring-1 ring-emerald-400/40'
                                : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50'
                            }`}
                            title={
                              isCancelled
                                ? 'Cancelled quote cannot be confirmed'
                                : isConfirmed
                                ? 'Quotation is confirmed (Click to view/edit details or unconfirm)'
                                : 'Click to confirm this quotation and move to Job Cards'
                            }
                          >
                            <input
                              type="checkbox"
                              checked={isConfirmed}
                              disabled={isCancelled}
                              onChange={() => {}} // Click handled by button
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none accent-emerald-600"
                            />
                            <span className={isConfirmed ? 'font-bold text-emerald-950' : 'text-slate-700 font-medium'}>
                              Confirmed
                            </span>
                          </button>
                        </td>

                        {/* Quote Number Badge */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`font-mono font-bold text-xs sm:text-sm px-2 py-0.5 rounded border transition-colors ${
                                isCancelled
                                  ? 'text-slate-500 bg-slate-200/90 border-slate-300 line-through'
                                  : isConfirmed
                                  ? 'text-emerald-950 bg-emerald-100 border-emerald-300 font-extrabold'
                                  : 'text-[#7B1818] bg-red-50/80 border-red-200/60 group-hover:border-red-300'
                              }`}
                            >
                              {ref}
                            </span>
                            {isConfirmed && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Confirmed
                              </span>
                            )}
                            {isCancelled && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                                Cancelled
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleCopyRef(ref, e)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
                              title="Copy quote number"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-1">
                            {q.from?.rev || 'REV-00'}
                          </div>
                          {isCancelled && q.cancellationReason && (
                            <div className="text-[11px] text-red-700/80 font-medium italic mt-1.5 flex items-start gap-1">
                              <Ban className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                              <span className="truncate max-w-[200px]" title={q.cancellationReason}>
                                Reason: {q.cancellationReason}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 align-top text-slate-600 font-mono text-xs">
                          {q.from?.dated || new Date(q.createdAt).toLocaleDateString('en-GB')}
                        </td>

                        {/* Client & Info */}
                        <td className="py-3 px-4 align-top">
                          <div className={`font-semibold text-sm ${isCancelled ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                            {q.client?.name || <span className="text-slate-400 italic">No client name entered</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                            {/* Salesman Name Badge */}
                            {q.salesmanName && (
                              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-semibold shadow-2xs">
                                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                                Salesman: <strong>{q.salesmanName}</strong>
                              </span>
                            )}
                            {q.client?.emirate && (
                              <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {q.client.emirate}
                              </span>
                            )}
                            {q.client?.kindAttn && (
                              <span className="text-[11px] text-slate-500">
                                Attn: <span className="text-slate-700 font-medium">{q.client.kindAttn}</span>
                              </span>
                            )}
                            {q.paymentTerms && (
                              <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {q.paymentTerms}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Glass Specs */}
                        <td className="py-3 px-3 align-top text-center">
                          <div className="font-mono text-xs font-semibold text-slate-700">
                            {grandTotalSqm.toFixed(2)} m²
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {q.glassSections?.length || 0} Sec • {grandTotalQty} Pcs
                          </div>
                        </td>

                        {/* Total Amount AED */}
                        <td className="py-3 px-4 align-top text-right">
                          <div className={`font-mono font-bold text-sm ${
                            isCancelled
                              ? 'text-slate-500 line-through'
                              : isConfirmed
                              ? 'text-emerald-950 font-extrabold'
                              : 'text-slate-900'
                          }`}>
                            AED {totalWithVatAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Incl. 5% VAT
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Summary in Table */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Showing <span className="font-semibold text-slate-700">{filteredQuotations.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{quotations.length}</span> total quotations
              </div>
              <div className="flex items-center gap-3">
                <span>
                  Next quote sequence: <strong className="font-mono text-[#7B1818]">{nextQuoteNumber}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Order Confirmation Modal (Non-editable, as per last saved quotation) */}
      {quoteToConfirm && (() => {
        const { grandTotalQty, totalAmountAED, vatAmountAED, totalWithVatAED } = calculateQuotationTotals(quoteToConfirm);
        const salesman = quoteToConfirm.salesmanName || quoteToConfirm.from?.attention || 'Not Assigned';
        const client = quoteToConfirm.client?.name || 'Unnamed Client';
        const isAlreadyConfirmed = quoteToConfirm.status === 'confirmed';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {isAlreadyConfirmed ? 'Confirmed Order Details' : 'Confirm Quotation / Order'}
                      </h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                        {quoteToConfirm.from?.refNo || 'Quotation'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isAlreadyConfirmed
                        ? 'Details as per the last saved quotation.'
                        : 'Confirming will lock this quotation for editing and move it to Job Cards.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuoteToConfirm(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notice Banner: Non-editable as per last saved quotation */}
              <div className="mb-4 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-medium">Values are fixed as per last saved quotation</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Locked (Read Only)
                </span>
              </div>

              {/* Non-Editable Details Display */}
              <div className="space-y-3">
                {/* Salesman Name */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                      Salesman's Name / Assigned To
                    </span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {salesman}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white border border-slate-200 shrink-0">
                    Locked
                  </span>
                </div>

                {/* Client Name */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-600" />
                      Client Name
                    </span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {client}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white border border-slate-200 shrink-0">
                    Locked
                  </span>
                </div>

                {/* Committed Date of Delivery Box (Editable, default 4th day from current date) */}
                <div className="p-3.5 bg-emerald-50/60 border-2 border-emerald-500/30 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-800" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                        Committed Date of Delivery
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                      Default: 4th Day
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={committedDateInput}
                      onChange={(e) => setCommittedDateInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustCommittedDate(-1)}
                        className="px-2.5 py-2 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 shadow-2xs transition-colors cursor-pointer"
                        title="Reduce by 1 day"
                      >
                        -1d
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustCommittedDate(1)}
                        className="px-2.5 py-2 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 shadow-2xs transition-colors cursor-pointer"
                        title="Extend by 1 day"
                      >
                        +1d
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommittedDateInput(getDefaultDeliveryDate(4))}
                        className="px-2 py-2 text-[11px] font-semibold bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-600 shadow-2xs transition-colors cursor-pointer"
                        title="Reset to 4th day from today"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white/80 px-2.5 py-1.5 rounded-md border border-slate-200">
                    <span className="font-semibold text-slate-800">
                      {getDaysFromTodayDesc(committedDateInput)}
                    </span>
                    <span className="text-emerald-800 text-[10px] font-medium">
                      Transfers to Job Card Timeline Bar
                    </span>
                  </div>

                  {isAlreadyConfirmed && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={handleUpdateCommittedDateOnly}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-200 hover:bg-emerald-300 border border-emerald-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Update Delivery Date</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quantity & Total Amount in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Quantity */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Quantity (Qty)
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono font-bold text-lg text-slate-900">
                        {grandTotalQty}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Pieces</span>
                    </div>
                  </div>

                  {/* Total Amount (before VAT) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Total Amount (AED)
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono font-bold text-lg text-slate-900">
                        AED {totalAmountAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VAT Amount & Final Amount */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-emerald-900 pb-2 border-b border-emerald-200/60">
                    <span className="font-medium">VAT Amount (5%)</span>
                    <span className="font-mono font-semibold text-emerald-950 text-sm">
                      AED {vatAmountAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Final Amount */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div>
                      <span className="block text-xs font-extrabold uppercase tracking-wider text-emerald-950">
                        Final Amount (Total + VAT)
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        Inclusive of 5% UAE VAT
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-xl text-emerald-950 tracking-tight">
                        AED {totalWithVatAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  {isAlreadyConfirmed && (
                    isAdmin ? (
                      <button
                        type="button"
                        onClick={handleUnconfirmOrder}
                        className="px-3 py-2 text-xs font-semibold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Unlock quotation and return to active status"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unconfirm & Unlock Editing</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Unconfirming restricted to ADMIN (HOD)</span>
                      </div>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setQuoteToConfirm(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {isAlreadyConfirmed ? 'Close' : 'Cancel'}
                  </button>
                  {!isAlreadyConfirmed && (
                    <button
                      type="button"
                      onClick={handleConfirmOrderSubmit}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Order</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancellation Reason Modal */}
      {quoteToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Cancel Quotation
                  </h3>
                  <p className="text-xs font-mono font-semibold text-[#7B1818] mt-0.5">
                    {quoteToCancel.from?.refNo || 'Quotation'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuoteToCancel(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 mb-4">
              <p className="font-semibold mb-0.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                Quotation Cancellation Policy
              </p>
              <p className="text-amber-800 text-[11px] leading-relaxed mt-1">
                Issued quote reference numbers cannot be deleted to preserve sequential auditing.
                Cancelling will mark this quote as cancelled, gray it out on the dashboard, and permanently lock all its values in read-only mode.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReasonInput}
                  onChange={(e) => {
                    setCancelReasonInput(e.target.value);
                    if (cancelError) setCancelError('');
                  }}
                  placeholder="e.g. Client requested revised glass specifications..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 placeholder-slate-400"
                  autoFocus
                />
                {cancelError && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{cancelError}</p>
                )}
              </div>

              {/* Quick reason suggestions */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Suggested reasons:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Client revised glass specs',
                    'Pricing rejected by client',
                    'Created duplicate in error',
                    'Project postponed indefinitely',
                    'Project scope re-tendered',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setCancelReasonInput(suggestion);
                        if (cancelError) setCancelError('');
                      }}
                      className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuoteToCancel(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Keep Quotation Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm & Cancel Quote</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
