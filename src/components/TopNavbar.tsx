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
  FileText
} from 'lucide-react';
import { InterglassEmblem } from './InterglassLogo';

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
}) => {
  const isLocked = isCancelled || isConfirmed;
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
                <span className={`font-mono font-bold text-xs sm:text-sm px-2 py-0.5 rounded border ${
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
              {clientName && (
                <span className="text-xs text-slate-600 truncate max-w-[120px] sm:max-w-[180px] font-medium hidden sm:inline-block">
                  • {clientName}
                </span>
              )}
              {salesmanName && (
                <span className="text-xs text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded truncate max-w-[140px] font-semibold hidden md:inline-block">
                  👤 {salesmanName}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold hidden sm:block">
              Inter Glass Co. LLC • Quotation Portal
            </p>
          </div>
        </div>

        {/* Center: Primary Portal Tabs & Sub-view Switcher */}
        <div className="flex items-center gap-2">
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

          {/* Sub-view Switcher when on Quotations Portal */}
          {portalTab === 'quotations' && (
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">{isLocked ? 'Specs' : 'Form &'} </span>
                <span>{isLocked ? '(Locked)' : 'Builder'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Quotation </span><span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('job_card')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'job_card'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Factory Job Card with sizes and specs, zero amounts, zero terms"
              >
                <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Job </span><span>Card</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Save button - hidden if locked */}
          {!isLocked && onSaveCurrentQuote && (
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

          {/* Add Glass Section (+) - hidden if locked */}
          {!isLocked && (
            <button
              type="button"
              onClick={onAddGlassSection}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md shadow-xs transition cursor-pointer"
              title="Add a new glass type section (Glass -02, Glass -03...)"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Glass Type ({glassSectionCount + 1})</span>
            </button>
          )}

          {/* PRINT BUTTON */}
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Print Quotation according to template"
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
        </div>
      </div>

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
        <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2 text-center text-xs text-emerald-900 flex items-center justify-center gap-2">
          <span className="font-bold uppercase tracking-wider bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded">
            Quotation Confirmed
          </span>
          <span>
            Order assigned to {salesmanName ? <strong>{salesmanName}</strong> : 'Salesman'}. This quotation is confirmed and locked for editing.
          </span>
        </div>
      )}
    </header>
  );
};
