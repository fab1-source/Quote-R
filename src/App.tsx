/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Printer,
  FileDown,
  Layers,
  Calculator,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ClipboardList,
  Lock,
  FileText,
  Edit3,
  Eye
} from 'lucide-react';
import { Quotation, GlassSection, GlassItem, UserAccount } from './types';
import {
  createBlankQuotation,
  createSampleQuotation,
  createEmptyGlassSection,
} from './data/defaultData';
import {
  getSavedQuotations,
  saveQuotation,
  cancelQuotation,
  confirmQuotation,
  unconfirmQuotation,
  ConfirmationDetails,
  createNewQuotationWithNextRef,
  duplicateQuotation,
  initializeSampleIfEmpty,
  STORAGE_KEY,
} from './utils/quotationStorage';
import { getCurrentUser, logoutUser } from './utils/userStorage';
import { calculateQuotationTotals } from './utils/calculations';
import { convertNumberToWords } from './utils/numberToWords';
import { exportToPdf } from './utils/pdfGenerator';
import { TopNavbar } from './components/TopNavbar';
import { DashboardView } from './components/DashboardView';
import { LoginScreen } from './components/LoginScreen';
import { CompanyAndClientCard } from './components/CompanyAndClientCard';
import { GlassSectionCard } from './components/GlassSectionCard';
import { QuotationDocument } from './components/QuotationDocument';
import { JobCardDocument } from './components/JobCardDocument';
import { CostSheetView } from './components/CostSheetView';
import { SavedQuotationsModal } from './components/SavedQuotationsModal';
import { PasteExcelModal } from './components/PasteExcelModal';

export default function App() {
  // Current logged in user session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());

  // App starts from Dashboard as requested
  const [viewMode, setViewMode] = useState<'dashboard' | 'portal'>('dashboard');

  // Quotations list loaded from local storage
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    return initializeSampleIfEmpty();
  });

  // Current active quotation being viewed/edited in the portal
  const [quotation, setQuotation] = useState<Quotation>(() => {
    const list = getSavedQuotations();
    return list[0] || createBlankQuotation();
  });

  // Primary tab in portal: 'quotations' | 'cost_sheet'
  const [portalTab, setPortalTab] = useState<'quotations' | 'cost_sheet'>('quotations');
  // Sub-view tab in quotations portal: 'edit' | 'preview' | 'job_card'
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'job_card'>('edit');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activePasteSection, setActivePasteSection] = useState<GlassSection | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync quotation changes into local storage automatically
  const updateQuotationAndStorage = (updater: (prev: Quotation) => Quotation) => {
    setQuotation((prev) => {
      const updated = updater(prev);
      const updatedList = saveQuotation(updated);
      setQuotations(updatedList);
      return updated;
    });
  };

  const { grandTotalQty, grandTotalSqm, totalAmountAED, vatAmountAED, totalWithVatAED } =
    calculateQuotationTotals(quotation);
  const amountInWords = convertNumberToWords(totalWithVatAED);

  // DASHBOARD ACTION: Add New Quotation with format IGC/{YY}/{MM}/{SERIAL}
  const handleAddNewQuotation = () => {
    const newQuote = createNewQuotationWithNextRef(new Date());
    const updatedList = saveQuotation(newQuote);
    setQuotations(updatedList);
    setQuotation(newQuote);
    setPortalTab('quotations');
    setActiveTab('edit');
    setViewMode('portal');
    showNotification(`Created new quotation ${newQuote.from.refNo}`, 'success');
  };

  // Auth handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setViewMode('dashboard');
    showNotification(`Welcome back, ${user.username}! Signed in as ${user.role}.`, 'success');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setViewMode('dashboard');
    showNotification('Logged out successfully.', 'info');
  };

  // DASHBOARD ACTION: Open existing quote
  const handleOpenQuotation = (
    targetQuote: Quotation,
    tab: 'edit' | 'preview' | 'job_card' = 'edit',
    targetPortalTab: 'quotations' | 'cost_sheet' = 'quotations'
  ) => {
    setQuotation(targetQuote);
    if (currentUser?.role === 'PRODUCTION') {
      setActiveTab('job_card');
      setPortalTab('quotations');
    } else {
      setActiveTab(tab);
      setPortalTab(targetPortalTab);
    }
    setViewMode('portal');
  };

  // DASHBOARD ACTION: Duplicate quote with next serial
  const handleDuplicateQuotation = (id: string) => {
    const { newQuotation, allQuotes } = duplicateQuotation(id);
    setQuotations(allQuotes);
    showNotification(`Duplicated as ${newQuotation.from.refNo}`, 'success');
  };

  // DASHBOARD ACTION: Cancel quote
  const handleCancelQuotation = (id: string, reason: string) => {
    const target = quotations.find((q) => q.id === id);
    const ref = target?.from?.refNo || 'this quotation';
    const updated = cancelQuotation(id, reason);
    setQuotations(updated);
    if (quotation.id === id) {
      const updatedQuote = updated.find((q) => q.id === id);
      if (updatedQuote) {
        setQuotation(updatedQuote);
      }
    }
    showNotification(`Cancelled quotation ${ref} and locked reference`, 'info');
  };

  // DASHBOARD ACTION: Confirm quote
  const handleConfirmQuotation = (id: string, details: ConfirmationDetails) => {
    const target = quotations.find((q) => q.id === id);
    const ref = target?.from?.refNo || 'this quotation';
    const updated = confirmQuotation(id, details);
    setQuotations(updated);
    if (quotation.id === id) {
      const updatedQuote = updated.find((q) => q.id === id);
      if (updatedQuote) {
        setQuotation(updatedQuote);
      }
    }
    showNotification(`Confirmed quotation ${ref} and assigned to ${details.salesmanName || 'Salesman'}!`, 'success');
  };

  // DASHBOARD ACTION: Unconfirm quote
  const handleUnconfirmQuotation = (id: string) => {
    const target = quotations.find((q) => q.id === id);
    const ref = target?.from?.refNo || 'this quotation';
    const updated = unconfirmQuotation(id);
    setQuotations(updated);
    if (quotation.id === id) {
      const updatedQuote = updated.find((q) => q.id === id);
      if (updatedQuote) {
        setQuotation(updatedQuote);
      }
    }
    showNotification(`Unlocked quotation ${ref} for editing`, 'info');
  };

  // Load sample quotation template
  const handleLoadSample = () => {
    const sample = createSampleQuotation();
    sample.id = `sample-quote-${Date.now()}`;
    // Assign proper sequential ref
    const updatedList = saveQuotation(sample);
    setQuotations(updatedList);
    setQuotation(sample);
    showNotification('Loaded sample quotation template', 'success');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const allQuotes = getSavedQuotations();
    const blob = new Blob([JSON.stringify(allQuotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interglass_Quotations_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exported quotations backup file', 'success');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          setQuotations(parsed);
          setQuotation(parsed[0]);
          showNotification(`Imported ${parsed.length} quotations successfully!`, 'success');
        } else {
          showNotification('Invalid quotations backup file', 'error');
        }
      } catch (err) {
        showNotification('Failed to read JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Add new Glass section (Glass -02, Glass -03...)
  const handleAddGlassSection = () => {
    const nextIndex = quotation.glassSections.length + 1;
    const newSection = createEmptyGlassSection(nextIndex);
    updateQuotationAndStorage((prev) => ({
      ...prev,
      glassSections: [...prev.glassSections, newSection],
    }));
    showNotification(`Added ${newSection.sectionCode} section`, 'info');
  };

  // Update a single glass section
  const handleUpdateSection = (updatedSection: GlassSection) => {
    updateQuotationAndStorage((prev) => ({
      ...prev,
      glassSections: prev.glassSections.map((s) =>
        s.id === updatedSection.id ? updatedSection : s
      ),
    }));
  };

  // Remove a glass section
  const handleRemoveSection = (sectionId: string) => {
    updateQuotationAndStorage((prev) => {
      const filtered = prev.glassSections.filter((s) => s.id !== sectionId);
      // Renumber section codes cleanly
      const renumbered = filtered.map((s, idx) => ({
        ...s,
        sectionCode: `Glass -${String(idx + 1).padStart(2, '0')}`,
      }));
      return { ...prev, glassSections: renumbered };
    });
    showNotification('Glass section removed', 'info');
  };

  // Move section up
  const handleMoveSectionUp = (index: number) => {
    if (index === 0) return;
    updateQuotationAndStorage((prev) => {
      const sections = [...prev.glassSections];
      const temp = sections[index - 1];
      sections[index - 1] = sections[index];
      sections[index] = temp;
      return { ...prev, glassSections: sections };
    });
  };

  // Move section down
  const handleMoveSectionDown = (index: number) => {
    if (index === quotation.glassSections.length - 1) return;
    updateQuotationAndStorage((prev) => {
      const sections = [...prev.glassSections];
      const temp = sections[index + 1];
      sections[index + 1] = sections[index];
      sections[index] = temp;
      return { ...prev, glassSections: sections };
    });
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Save PDF Handler
  const handleSavePdf = async () => {
    const isJobCard = activeTab === 'job_card';
    const containerId = isJobCard ? 'jobcard-print-container' : 'quotation-print-container';
    const cleanClient = (quotation.client.name || 'Interglass').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanRef = (quotation.from.refNo || 'Doc').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = isJobCard
      ? `JobCard_${cleanRef}_${cleanClient}.pdf`
      : `Quotation_${cleanRef}_${cleanClient}.pdf`;

    setIsGeneratingPdf(true);
    showNotification(isJobCard ? 'Generating Factory Job Card PDF...' : 'Generating Quotation PDF...', 'info');

    try {
      await exportToPdf(containerId, {
        fileName,
        onProgress: (_, msg) => {
          console.log(msg);
        },
      });
      showNotification(`Saved "${fileName}" successfully!`, 'success');
    } catch (err: any) {
      console.error('PDF export error:', err);
      showNotification('PDF generation encountered an issue. Using Print dialog...', 'error');
      // Fallback to print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Start fresh quotation inside portal
  const handleNewQuotation = () => {
    handleAddNewQuotation();
  };

  // Save current quotation to dashboard
  const handleSaveCurrentQuote = () => {
    const updated = saveQuotation(quotation);
    setQuotations(updated);
    showNotification(`Saved ${quotation.from.refNo} to Dashboard!`, 'success');
  };

  // Apply items pasted into the global/modal paste section
  const handleApplyPastedItemsToActiveSection = (
    items: GlassItem[],
    mode: 'replace' | 'append'
  ) => {
    if (!activePasteSection) return;

    let finalItems: GlassItem[] = [];
    if (mode === 'replace') {
      finalItems = items.map((item, idx) => ({ ...item, sNo: idx + 1 }));
    } else {
      const startIdx = activePasteSection.items.length;
      finalItems = [
        ...activePasteSection.items,
        ...items.map((item, idx) => ({ ...item, sNo: startIdx + idx + 1 })),
      ];
    }

    handleUpdateSection({
      ...activePasteSection,
      items: finalItems,
    });
    showNotification(
      `Imported ${items.length} glass items into ${activePasteSection.sectionCode}!`,
      'success'
    );
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isProductionUser = currentUser.role === 'PRODUCTION';
  const isAdminUser = currentUser.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Notifications banner */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : notification.type === 'info'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* VIEW 1: DASHBOARD VIEW */}
      {viewMode === 'dashboard' ? (
        <DashboardView
          quotations={quotations}
          onAddNewQuotation={handleAddNewQuotation}
          onOpenQuotation={handleOpenQuotation}
          onDuplicateQuotation={handleDuplicateQuotation}
          onCancelQuotation={handleCancelQuotation}
          onConfirmQuotation={handleConfirmQuotation}
          onUnconfirmQuotation={handleUnconfirmQuotation}
          onLoadSample={handleLoadSample}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          currentUser={currentUser}
          onLogout={handleLogout}
          onNotification={showNotification}
        />
      ) : (() => {
        const isLocked = quotation.status === 'cancelled' || quotation.status === 'confirmed';

        return (
          /* VIEW 2: QUOTATION PORTAL (BUILDER & DOCUMENT PREVIEW) */
          <>
            {/* Top Application Navbar */}
            <TopNavbar
              portalTab={portalTab}
              setPortalTab={setPortalTab}
              activeTab={isProductionUser ? 'job_card' : activeTab}
              setActiveTab={setActiveTab}
              isGeneratingPdf={isGeneratingPdf}
              onPrint={handlePrint}
              onSavePdf={handleSavePdf}
              onAddGlassSection={handleAddGlassSection}
              onLoadSample={handleLoadSample}
              onNewQuotation={handleNewQuotation}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onBackToDashboard={() => {
                // Ensure current changes are saved and return to dashboard
                if (!isLocked && !isProductionUser) {
                  saveQuotation(quotation);
                }
                setQuotations(getSavedQuotations());
                setViewMode('dashboard');
              }}
              onSaveCurrentQuote={!isLocked && !isProductionUser ? handleSaveCurrentQuote : undefined}
              glassSectionCount={quotation.glassSections.length}
              currentRefNo={quotation.from?.refNo}
              clientName={quotation.client?.name}
              isCancelled={quotation.status === 'cancelled'}
              cancellationReason={quotation.cancellationReason}
              isConfirmed={quotation.status === 'confirmed'}
              salesmanName={quotation.salesmanName}
              currentUser={currentUser}
              onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
              {/* If user is PRODUCTION role: strictly Job Card Document only */}
              {isProductionUser ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-950 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Authorized Factory Production Job Card • Document View</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('dashboard')}
                      className="px-3 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 cursor-pointer font-bold transition-colors"
                    >
                      ← Back to Job Cards List
                    </button>
                  </div>
                  <JobCardDocument quotation={quotation} />
                </div>
              ) : (
                <>
                  {/* Primary Tabs: 1st Tab is Quotations Portal, 2nd Tab is COST SHEET */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 mb-6 gap-3">
                    <div className="flex items-center gap-2 sm:gap-4">
                      {/* Tab 1: Quotations Portal */}
                      <button
                        type="button"
                        onClick={() => setPortalTab('quotations')}
                        className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                          portalTab === 'quotations'
                            ? 'border-[#7B1818] text-[#7B1818]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#7B1818]" />
                        <span>Quotations Portal</span>
                      </button>

                      {/* Tab 2: COST SHEET Tab */}
                      <button
                        type="button"
                        onClick={() => setPortalTab('cost_sheet')}
                        className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                          portalTab === 'cost_sheet'
                            ? 'border-indigo-600 text-indigo-900 bg-indigo-50/60 rounded-t-lg'
                            : 'border-transparent text-slate-500 hover:text-indigo-700'
                        }`}
                      >
                        <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                        <span>COST SHEET</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Costing & Margins
                        </span>
                      </button>
                    </div>

                    {/* Sub-view switcher for Quotations Portal */}
                    {portalTab === 'quotations' && (
                      <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs mb-2 sm:mb-0">
                        <button
                          type="button"
                          onClick={() => setActiveTab('edit')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                            activeTab === 'edit'
                              ? 'bg-white text-slate-900 shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{isLocked ? 'Specs (Locked)' : 'Form & Builder'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('preview')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                            activeTab === 'preview'
                              ? 'bg-white text-slate-900 shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Quotation Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('job_card')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                            activeTab === 'job_card'
                              ? 'bg-white text-emerald-800 shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Factory Job Card without amounts or terms"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Job Card</span>
                        </button>
                      </div>
                    )}
                  </div>

              {/* 2nd Tab: COST SHEET View */}
              {portalTab === 'cost_sheet' ? (
                <CostSheetView
                  quotation={quotation}
                  isLocked={isLocked}
                  onBackToQuotation={() => setPortalTab('quotations')}
                />
              ) : (
                /* 1st Tab: Quotations Portal */
                <>
                  {/* Confirmed / Locked Alert Banner */}
                  {quotation.status === 'confirmed' && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 shrink-0">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">This Quotation is Confirmed</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white shadow-2xs">
                              Locked for Editing
                            </span>
                          </div>
                          <p className="text-xs text-emerald-800 mt-0.5">
                            Assigned to salesman:{' '}
                            <strong>{quotation.salesmanName || 'Not Assigned'}</strong> • All specifications, rates, and totals are locked in read-only mode.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPortalTab('cost_sheet')}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                          title="Open Cost Sheet for this quotation"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>View Cost Sheet</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('job_card')}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                          title="View production Job Card without amounts or terms"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>View Job Card</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuotations(getSavedQuotations());
                            setViewMode('dashboard');
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg transition-colors cursor-pointer"
                        >
                          Back to Dashboard
                        </button>
                        {isAdminUser ? (
                          <button
                            type="button"
                            onClick={() => handleUnconfirmQuotation(quotation.id)}
                            className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg transition-colors cursor-pointer"
                            title="Unconfirm order and unlock editing"
                          >
                            Unlock Editing
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                            Unconfirming restricted to ADMIN (HOD)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

              {activeTab === 'edit' ? (
                <div className="space-y-6">
                  {/* Header: Client TO & Interglass FROM info */}
                  <CompanyAndClientCard
                    quotation={quotation}
                    readOnly={isLocked}
                    onUpdateQuotation={(updated) => {
                      if (isLocked) return;
                      updateQuotationAndStorage(() => updated);
                    }}
                  />

                  {/* Glass Sections List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                          <Layers className="w-4 h-4" />
                        </div>
                        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Glass Specifications & Sizes ({quotation.glassSections.length} Sections)
                          {quotation.status === 'confirmed' && (
                            <span className="ml-2 text-[10px] text-emerald-800 font-bold uppercase bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                              Confirmed & Locked
                            </span>
                          )}
                          {quotation.status === 'cancelled' && (
                            <span className="ml-2 text-[10px] text-red-600 font-bold uppercase bg-red-100 px-1.5 py-0.5 rounded">
                              Cancelled & Locked
                            </span>
                          )}
                        </h2>
                      </div>

                      {!isLocked && (
                        <button
                          type="button"
                          onClick={handleAddGlassSection}
                          className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            Add Glass Section (Glass -{String(quotation.glassSections.length + 1).padStart(2, '0')})
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Glass Sections Loop */}
                    {quotation.glassSections.map((section, idx) => (
                      <GlassSectionCard
                        key={section.id}
                        section={section}
                        sectionIndex={idx}
                        totalSections={quotation.glassSections.length}
                        applyMinRule={quotation.applyMinAreaRule}
                        minThreshold={quotation.minAreaThreshold}
                        readOnly={isLocked}
                        onUpdateSection={handleUpdateSection}
                        onRemoveSection={handleRemoveSection}
                        onMoveUp={idx > 0 && !isLocked ? () => handleMoveSectionUp(idx) : undefined}
                        onMoveDown={
                          idx < quotation.glassSections.length - 1 && !isLocked
                            ? () => handleMoveSectionDown(idx)
                            : undefined
                        }
                      />
                    ))}

                    {/* Bottom Add Section Card (Hidden if locked) */}
                    {!isLocked && (
                      <div
                        onClick={handleAddGlassSection}
                        className="border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-blue-600"
                      >
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
                          <Plus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="font-semibold text-xs text-slate-700">
                          Click to Add Another Glass Type Section (Glass -
                          {String(quotation.glassSections.length + 1).padStart(2, '0')})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Multiple glass types supported (Annealed, Toughened, Polished, Laminated, Double Glazed)
                        </div>
                      </div>
                    )}
                  </div>

                {/* Calculation & Summary Card */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mt-8">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Quotation Calculation Summary
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Total Quantity
                      </span>
                      <span className="text-lg font-bold text-slate-900 font-mono">
                        {grandTotalQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">pcs</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Total Glass Area
                      </span>
                      <span className="text-lg font-bold text-slate-900 font-mono">
                        {grandTotalSqm.toLocaleString()} <span className="text-xs font-normal text-slate-500">m²</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Subtotal (Excl. VAT)
                      </span>
                      <span className="text-lg font-bold text-slate-900 font-mono">
                        AED {totalAmountAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-200/80">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                        Total With VAT (5%)
                      </span>
                      <span className="text-lg font-black text-blue-700 font-mono">
                        AED {totalWithVatAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Amount in words */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Amount in Words:
                    </span>
                    <p className="font-bold text-slate-800 italic">
                      {amountInWords}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      Ready to print or save as PDF? You can preview the exact document template anytime.
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition cursor-pointer"
                      >
                        View Print Preview
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePdf}
                        disabled={isGeneratingPdf}
                        className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <FileDown className="w-4 h-4 text-slate-600" />
                        <span>Save PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="px-5 py-2 text-xs font-medium text-white bg-[#7B1818] hover:bg-[#631313] rounded-md flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Quotation</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'job_card' ? (
              /* JOB CARD TAB (Factory Copy: No Amounts, No Terms) */
              <div className="space-y-4">
                {/* Job Card Toolbar */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
                  <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                    <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded uppercase text-[10px] tracking-wider">
                      Factory Job Card
                    </span>
                    <span className="font-mono font-bold text-slate-900">{quotation.from?.refNo}</span>
                    {quotation.salesmanName && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                        Salesman: {quotation.salesmanName}
                      </span>
                    )}
                    <span className="text-slate-500 hidden md:inline">
                      • Production copy with piece dimensions. No pricing, amounts, or commercial terms.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md transition cursor-pointer"
                    >
                      View Specs (Locked)
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePdf}
                      disabled={isGeneratingPdf}
                      className="px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-slate-600" />
                      <span>Save PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Job Card</span>
                    </button>
                  </div>
                </div>

                {/* Job Card Rendered Container */}
                <div className="overflow-x-auto py-2">
                  <JobCardDocument quotation={quotation} />
                </div>
              </div>
            ) : (
              /* PREVIEW TAB */
              <div className="space-y-4">
                {/* Preview Toolbar */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">Quotation Template Preview:</span>
                    <span className="font-mono font-bold text-[#7B1818]">{quotation.from?.refNo}</span>
                    <span>• Matches official Interglass print & PDF sheet layout.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md transition cursor-pointer"
                    >
                      Back to Form
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePdf}
                      disabled={isGeneratingPdf}
                      className="px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-slate-600" />
                      <span>Save as PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-1.5 text-xs font-medium text-white bg-[#7B1818] hover:bg-[#631313] rounded-md flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Document</span>
                    </button>
                  </div>
                </div>

                {/* Document Rendered Container in Preview */}
                <div className="overflow-x-auto py-2">
                  <QuotationDocument
                    quotation={quotation}
                    isEditable={quotation.status !== 'cancelled' && quotation.status !== 'confirmed'}
                    onUpdateQuotation={(updated) => {
                      if (quotation.status === 'cancelled' || quotation.status === 'confirmed') return;
                      updateQuotationAndStorage(() => updated);
                    }}
                    onOpenPasteModalForSection={(section) => {
                      if (quotation.status === 'cancelled' || quotation.status === 'confirmed') return;
                      setActivePasteSection(section);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Off-screen Document for Print and PDF Export when on Edit tab */}
            {activeTab === 'edit' && (
              <div className="fixed -left-[9999px] top-0 pointer-events-none print:static print:pointer-events-auto print:block">
                <QuotationDocument
                  quotation={quotation}
                  isEditable={false}
                />
              </div>
            )}
                  </>
                )}
              </>
            )}
            </main>
          </>
        );
      })()}

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-xs font-medium border animate-slide-up print:hidden ${
            notification.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : notification.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-800 text-white border-slate-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Saved Quotations Modal */}
      <SavedQuotationsModal
        isOpen={isHistoryOpen}
        currentQuotation={quotation}
        onClose={() => setIsHistoryOpen(false)}
        onLoadQuotation={(loaded) => {
          setQuotation(loaded);
          const updated = saveQuotation(loaded);
          setQuotations(updated);
          showNotification(`Loaded quotation: ${loaded.from?.refNo || loaded.title}`, 'success');
        }}
      />

      {/* Dynamic Paste Excel Modal if triggered from document preview */}
      {activePasteSection && (
        <PasteExcelModal
          isOpen={!!activePasteSection}
          sectionCode={activePasteSection.sectionCode}
          sectionDescription={activePasteSection.description}
          existingCount={activePasteSection.items.length}
          applyMinRule={quotation.applyMinAreaRule}
          minThreshold={quotation.minAreaThreshold}
          onClose={() => setActivePasteSection(null)}
          onApply={handleApplyPastedItemsToActiveSection}
        />
      )}
    </div>
  );
}
