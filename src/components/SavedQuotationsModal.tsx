import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Save, Trash2, Copy, Download, Upload, FileText } from 'lucide-react';
import { Quotation } from '../types';

interface SavedQuotationsModalProps {
  isOpen: boolean;
  currentQuotation: Quotation;
  onClose: () => void;
  onLoadQuotation: (quotation: Quotation) => void;
}

const STORAGE_KEY = 'interglass_saved_quotations_v1';

export const SavedQuotationsModal: React.FC<SavedQuotationsModalProps> = ({
  isOpen,
  currentQuotation,
  onClose,
  onLoadQuotation,
}) => {
  const [savedQuotes, setSavedQuotes] = useState<Quotation[]>([]);
  const [saveTitle, setSaveTitle] = useState('');

  // Load from local storage
  const reloadFromStorage = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          setSavedQuotes(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load saved quotations', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadFromStorage();
      const defaultTitle = `${currentQuotation.client.name || 'Quotation'} - ${
        currentQuotation.from.refNo
      }`;
      setSaveTitle(defaultTitle);
    }
  }, [isOpen, currentQuotation]);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    const updatedQuote: Quotation = {
      ...currentQuotation,
      id: `quote-${Date.now()}`,
      title: saveTitle.trim() || 'Untitled Quotation',
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = savedQuotes.findIndex((q) => q.from.refNo === updatedQuote.from.refNo);
    let updatedList: Quotation[] = [];

    if (existingIndex >= 0) {
      updatedList = [...savedQuotes];
      updatedList[existingIndex] = updatedQuote;
    } else {
      updatedList = [updatedQuote, ...savedQuotes];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setSavedQuotes(updatedList);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this saved quotation?')) {
      const filtered = savedQuotes.filter((q) => q.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      setSavedQuotes(filtered);
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(savedQuotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interglass_Quotations_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          setSavedQuotes(parsed);
          alert(`Successfully imported ${parsed.length} quotations!`);
        }
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Saved Quotations (Intranet)</h2>
              <p className="text-xs text-slate-500">
                Manage and recall your quotations stored locally in this browser.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current Section */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Quotation title or client name..."
              className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveCurrent}
            className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Current Quote</span>
          </button>
        </div>

        {/* List of Quotes */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {savedQuotes.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No saved quotations yet.</p>
              <p className="text-xs mt-1">Save the current quotation above to keep a record.</p>
            </div>
          ) : (
            savedQuotes.map((quote) => (
              <div
                key={quote.id}
                className="p-3.5 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/20 flex items-center justify-between gap-3 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 truncate">
                      {quote.title || 'Untitled Quotation'}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200">
                      {quote.from.refNo} ({quote.from.rev})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                    <span>Client: {quote.client.name || 'Not specified'}</span>
                    <span>•</span>
                    <span>Sections: {quote.glassSections.length}</span>
                    <span>•</span>
                    <span>
                      {new Date(quote.updatedAt).toLocaleDateString()} at{' '}
                      {new Date(quote.updatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadQuotation(quote);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-md shadow-xs transition cursor-pointer"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(quote.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                    title="Delete quotation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Backup / Export */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={savedQuotes.length === 0}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup</span>
            </button>
            <span className="text-slate-300">|</span>
            <label className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
