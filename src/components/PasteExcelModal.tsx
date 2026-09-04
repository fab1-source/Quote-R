import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Check, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { GlassItem } from '../types';
import { parseExcelData } from '../utils/excelParser';

interface PasteExcelModalProps {
  isOpen: boolean;
  sectionCode: string;
  sectionDescription: string;
  existingCount: number;
  applyMinRule: boolean;
  minThreshold: number;
  onClose: () => void;
  onApply: (items: GlassItem[], mode: 'replace' | 'append') => void;
}

export const PasteExcelModal: React.FC<PasteExcelModalProps> = ({
  isOpen,
  sectionCode,
  sectionDescription,
  existingCount,
  applyMinRule,
  minThreshold,
  onClose,
  onApply,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [insertMode, setInsertMode] = useState<'replace' | 'append'>('replace');
  const [parsedItems, setParsedItems] = useState<GlassItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [minRuleEnabled, setMinRuleEnabled] = useState(applyMinRule);

  useEffect(() => {
    if (isOpen) {
      setPastedText('');
      setParsedItems([]);
      setWarnings([]);
      setInsertMode(existingCount > 0 ? 'replace' : 'append');
      setMinRuleEnabled(applyMinRule);
    }
  }, [isOpen, existingCount, applyMinRule]);

  // Re-parse when text or min rule changes
  useEffect(() => {
    if (!pastedText.trim()) {
      setParsedItems([]);
      setWarnings([]);
      return;
    }

    const startSNo = insertMode === 'append' ? existingCount + 1 : 1;
    const result = parseExcelData(pastedText, startSNo, minRuleEnabled, minThreshold);
    setParsedItems(result.items);
    setWarnings(result.warnings);
  }, [pastedText, insertMode, existingCount, minRuleEnabled, minThreshold]);

  if (!isOpen) return null;

  const totalQty = parsedItems.reduce((s, i) => s + i.qty, 0);
  const totalSqm = Number(parsedItems.reduce((s, i) => s + i.totalSqm, 0).toFixed(2));

  const loadSampleData = () => {
    const sample = `1\t\t78\t600\t720
2\t\t58\t475\t720
3\t\t7\t450\t720
4\t\t56\t375\t720
5\t\t242\t400\t720
6\t\t31\t250\t720
7\t\t60\t325\t720
8\t\t24\t500\t720
9\t\t6\t350\t720
10\t\t32\t525\t720
11\t\t73\t300\t720
12\t\t6\t550\t720
13\t\t496\t500\t2200`;
    setPastedText(sample);
  };

  const handleApply = () => {
    if (parsedItems.length === 0) return;
    onApply(parsedItems, insertMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Paste Glass Sizes from Excel
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded uppercase tracking-wide">
                  {sectionCode}
                </span>
              </h2>
              <p className="text-xs text-slate-500 line-clamp-1">{sectionDescription}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Instructions Box */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">
                Copy your columns from Excel and paste directly below (handles 1 to 200+ rows):
              </p>
              <p className="text-blue-800">
                Expected Excel column order:{' '}
                <span className="font-mono font-medium bg-blue-100 px-1 py-0.5 rounded">
                  S.No | Code | Qty | Width | Height
                </span>{' '}
                or{' '}
                <span className="font-mono font-medium bg-blue-100 px-1 py-0.5 rounded">
                  Code | Qty | Width | Height
                </span>{' '}
                or{' '}
                <span className="font-mono font-medium bg-blue-100 px-1 py-0.5 rounded">
                  Qty | Width | Height
                </span>
                . Dimensions should be in <strong>millimeters (mm)</strong>.
              </p>
            </div>
          </div>

          {/* Paste Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Paste Clipboard Data (Ctrl + V / Cmd + V)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSampleData}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                >
                  Load Sample 13 Rows
                </button>
                {pastedText && (
                  <button
                    type="button"
                    onClick={() => setPastedText('')}
                    className="text-xs text-slate-400 hover:text-slate-700 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Click here and press Ctrl+V to paste your Excel rows..."
              rows={6}
              className="w-full font-mono text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 text-slate-800"
              autoFocus
            />
          </div>

          {/* Options: Mode & Minimum Sqm Rule */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-700">Paste Action:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="insertMode"
                  value="replace"
                  checked={insertMode === 'replace'}
                  onChange={() => setInsertMode('replace')}
                  className="text-blue-600"
                />
                <span className="text-slate-700">
                  Replace all items {existingCount > 0 && `(overwrites ${existingCount} existing)`}
                </span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="insertMode"
                  value="append"
                  checked={insertMode === 'append'}
                  onChange={() => setInsertMode('append')}
                  className="text-blue-600"
                />
                <span className="text-slate-700">Append to current table</span>
              </label>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={minRuleEnabled}
                onChange={(e) => setMinRuleEnabled(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
              />
              <span className="text-slate-700 font-medium">
                Apply Min Area Rule ({minThreshold} m² per piece)
              </span>
            </label>
          </div>

          {/* Parsed Preview Section */}
          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Successfully Parsed {parsedItems.length} Rows
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium border border-slate-200">
                    Total Qty: <strong>{totalQty.toLocaleString()}</strong> pcs
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium border border-slate-200">
                    Total Area: <strong>{totalSqm.toLocaleString()}</strong> m²
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-white text-slate-500 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">S.No</th>
                      <th className="py-2.5 px-3 w-20">Code</th>
                      <th className="py-2.5 px-3 w-16 text-right">Qty</th>
                      <th className="py-2.5 px-3 w-20 text-right">Width (mm)</th>
                      <th className="py-2.5 px-3 w-20 text-right">Height (mm)</th>
                      <th className="py-2.5 px-3 w-24 text-right">Per Sqm</th>
                      <th className="py-2.5 px-3 w-24 text-right">Total Sqm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedItems.slice(0, 100).map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-1.5 px-3 text-center text-slate-400 font-mono">
                          {item.sNo}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600 font-mono">{item.code || '-'}</td>
                        <td className="py-1.5 px-3 text-right font-medium text-slate-800">
                          {item.qty}
                        </td>
                        <td className="py-1.5 px-3 text-right text-slate-600">{item.width}</td>
                        <td className="py-1.5 px-3 text-right text-slate-600">{item.height}</td>
                        <td className="py-1.5 px-3 text-right text-slate-600">
                          {item.perSqm.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-semibold text-slate-900">
                          {item.totalSqm.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedItems.length > 100 && (
                <p className="text-xs text-slate-400 text-right">
                  Showing first 100 of {parsedItems.length} rows (all {parsedItems.length} will be
                  imported)
                </p>
              )}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Notice while parsing:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                  {warnings.slice(0, 3).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                  {warnings.length > 3 && <li>...and {warnings.length - 3} more items.</li>}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={parsedItems.length === 0}
              className={`px-5 py-2 text-xs font-medium rounded-md shadow-sm flex items-center gap-2 transition ${
                parsedItems.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Import {parsedItems.length} Glass Sizes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
