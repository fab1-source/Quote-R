import React from 'react';
import {
  Printer,
  FileDown,
  Plus,
  RotateCcw,
  Sparkles,
  FolderOpen,
  Eye,
  Edit3,
  Loader2,
  ArrowLeft,
  LayoutDashboard,
  Save,
  ClipboardList,
  Calculator,
  FileText,
  LogOut,
  Shield,
  UserCheck,
  Database
} from 'lucide-react';
import { InterglassEmblem } from './InterglassLogo';
import { UserAccount } from '../types';
import { DbStatusResponse } from '../utils/apiClient';

interface TopNavbarProps {
  portalTab?: 'quotations' | 'cost_sheet';
  setPortalTab?: (tab: 'quotations' | 'cost_sheet') => void;
  activeTab: 'edit' | 'preview' | 'job_card';
  setActiveTab: (tab: 'edit' | 'preview' | 'job_card') => void;
  isGeneratingPdf: boolean;
  onPrint: () => void;
  onSavePdf: () => void;
  onAddGlassSection: () => void;
  onLoadSample: () => void;
  onNewQuotation: () => void;
  onOpenHistory: () => void;
  onBackToDashboard: () => void;
  onSaveCurrentQuote?: () => void;
  glassSectionCount: number;
  currentRefNo?: string;
  clientName?: string;
  isCancelled?: boolean;
  cancellationReason?: string;
  isConfirmed?: boolean;
  salesmanName?: string;
  currentUser?: UserAccount;
  onLogout?: () => void;
  onUnconfirmQuotation?: () => void;
  dbStatus?: DbStatusResponse | null;
  onOpenDbStatus?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  portalTab = 'quotations',
  setPortalTab,
  activeTab,
  setActiveTab,
  isGeneratingPdf,
  onPrint,
  onSavePdf,
  onAddGlassSection,
  onLoadSample,
  onNewQuotation,
  onOpenHistory,
  onBackToDashboard,
  onSaveCurrentQuote,
  glassSectionCount,
  currentRefNo,
  clientName,
  isCancelled = false,
  cancellationReason,
  isConfirmed = false,
  salesmanName,
  currentUser,
  onLogout,
  onUnconfirmQuotation,
  dbStatus,
  onOpenDbStatus,
}) => {
  const isViewer = currentUser?.role === 'VIEWER';
  const isLocked = isCancelled || isConfirmed || isViewer;
  const isProduction = currentUser?.role === 'PRODUCTION';
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Dashboard return & Branding */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back to Dashboard Button */}
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#7B1818] bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
            title="Return to Quotations Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </button>

          <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>

          <div className="p-1 bg-slate-50 border border-slate-200 rounded-lg hidden sm:flex items-center justify-center shrink-0">
            <InterglassEmblem width={38} height={24} />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {currentRefNo ? (
                <span className={`font-mono font-bold text-xs sm:text-sm px-2.5 py-1 rounded border ${
                  isCancelled 
                    ? 'text-red-700 bg-red-100/70 border-red-300' 
                    : 'text-[#7B1818] bg-red-50 border-red-200'
                }`}>
                  {currentRefNo}
                </span>
              ) : (
                <h1 className="text-sm font-bold text-slate-900 leading-tight">
                  Interglass
                </h1>
              )}
              {isCancelled && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-600 text-white shadow-xs">
                  Cancelled (Locked)
                </span>
              )}
              {isConfirmed && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                  Confirmed (Locked)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Primary Portal Tabs & Sub-view Switcher */}
        <div className="flex items-center gap-2">
          {isProduction ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-lg text-xs font-bold shadow-2xs">
              <ClipboardList className="w-4 h-4 text-emerald-700" />
              <span>FACTORY JOB CARD</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-700 text-white shadow-2xs">
                Production Only
              </span>
            </div>
          ) : (
            <>
              {/* Primary Tabs: Quotations Portal vs COST SHEET */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPortalTab && setPortalTab('quotations')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                    portalTab === 'quotations'
                      ? 'bg-white text-[#7B1818] shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Quotation Builder & Documents"
                >
                  <FileText className="w-3.5 h-3.5 text-[#7B1818]" />
                  <span>Quotations Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPortalTab && setPortalTab('cost_sheet')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                    portalTab === 'cost_sheet'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-indigo-700'
                  }`}
                  title="Internal Estimation Cost Sheet & Profit Margins"
                >
                  <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                  <span>COST SHEET</span>
                </button>
              </div>

              {/* Quotation Preview button */}
              {portalTab === 'quotations' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'preview' ? 'edit' : 'preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                  title={activeTab === 'preview' ? 'Return to Quotation Editor' : 'Quotation Preview'}
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Quotation Preview</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Save button - hidden if locked or production */}
          {!isLocked && !isProduction && onSaveCurrentQuote && (
            <button
              type="button"
              onClick={onSaveCurrentQuote}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition cursor-pointer"
              title="Save changes to Dashboard"
            >
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}

          {/* PRINT BUTTON */}
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title={isProduction ? "Print Job Card" : "Print Quotation according to template"}
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* SAVE AS PDF BUTTON */}
          <button
            type="button"
            onClick={onSavePdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#7B1818] hover:bg-[#631313] text-white rounded-md text-xs font-medium shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Download PDF to your computer"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-white" />
            )}
            <span>PDF</span>
          </button>

          {/* Centralized Intranet Database Status Button */}
          {onOpenDbStatus && (
            <button
              type="button"
              onClick={onOpenDbStatus}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Centralized Intranet Database Status"
            >
              <Database className={`w-3.5 h-3.5 ${dbStatus?.engine === 'mongodb' ? 'text-emerald-600' : 'text-blue-600'}`} />
              <span className="hidden sm:inline font-mono text-[11px] font-bold">
                {dbStatus?.engine === 'mongodb' ? 'MongoDB' : 'Intranet DB'}
              </span>
              <span className={`w-2 h-2 rounded-full ${dbStatus?.engine === 'mongodb' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
            </button>
          )}

          {/* Current User Session & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 ml-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] text-white ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-red-700'
                    : currentUser.role === 'ESTIMATION'
                    ? 'bg-blue-700'
                    : currentUser.role === 'PRODUCTION'
                    ? 'bg-emerald-700'
                    : 'bg-purple-700'
                }`}
                title={`${currentUser.username} (${currentUser.role})`}
              >
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-[11px] font-bold text-slate-800 leading-none">{currentUser.username}</div>
                <div className="text-[9px] uppercase font-bold text-slate-500 mt-0.5">{currentUser.role}</div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Viewer Banner underneath navbar */}
      {isViewer && !isCancelled && !isConfirmed && (
        <div className="bg-purple-50 border-t border-purple-200 px-4 py-2 text-center text-xs text-purple-900 flex items-center justify-center gap-2">
          <span className="font-bold uppercase tracking-wider bg-purple-700 text-white text-[10px] px-1.5 py-0.5 rounded">
            Auditor Viewer Mode
          </span>
          <span>
            Viewing in read-only audit mode. Editing, adding items, and saving are disabled.
          </span>
        </div>
      )}

      {/* Cancelled Banner underneath navbar */}
      {isCancelled && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-center text-xs text-red-800 flex items-center justify-center gap-2">
          <span className="font-bold uppercase tracking-wider bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded">
            Quotation Cancelled
          </span>
          <span>
            This quote reference has been cancelled and is in read-only mode.
            {cancellationReason && (
              <span className="font-medium ml-1">
                Reason: <strong className="underline italic">{cancellationReason}</strong>
              </span>
            )}
          </span>
        </div>
      )}

      {/* Confirmed Banner underneath navbar */}
      {isConfirmed && (
        <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-1.5 text-center text-xs text-emerald-900 flex flex-wrap items-center justify-center gap-2">
          <span className="font-bold uppercase tracking-wider bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-2xs">
            Quotation Confirmed
          </span>
          <span>
            Order assigned to {salesmanName ? <strong>{salesmanName}</strong> : 'Salesman'}. This quotation is confirmed and locked for editing.
          </span>
          {onUnconfirmQuotation && (
            <button
              type="button"
              onClick={onUnconfirmQuotation}
              className="ml-2 px-2.5 py-0.5 text-xs font-semibold bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded shadow-2xs transition-colors cursor-pointer"
              title="Unlock quotation editing (Admin)"
            >
              Unlock Editing
            </button>
          )}
        </div>
      )}
    </header>
  );
};
