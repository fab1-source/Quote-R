import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings2,
  Sparkles
} from 'lucide-react';
import { GlassSection, GlassItem } from '../types';
import { calculatePerSqm, calculateTotalSqm, calculateSectionTotals } from '../utils/calculations';
import { PasteExcelModal } from './PasteExcelModal';
import { parseExcelData } from '../utils/excelParser';

interface GlassSectionCardProps {
  section: GlassSection;
  sectionIndex: number;
  totalSections: number;
  applyMinRule: boolean;
  minThreshold: number;
  onUpdateSection: (updated: GlassSection) => void;
  onRemoveSection: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  readOnly?: boolean;
}

const COMMON_GLASS_DESCRIPTIONS = [
  "Supply of 4mm Clear glass Annealed only",
  "Supply of 5mm Clear glass Annealed only",
  "Supply of 6mm Clear glass Annealed only",
  "Supply of 8mm Clear glass Annealed only",
  "Supply of 10mm Clear glass Annealed only",
  "Supply of 12mm Clear glass Annealed only",
  "Supply of 4mm Clear glass annealed with Polished edges only",
  "Supply of 6mm Clear glass annealed with Polished edges only",
  "Supply of 8mm Clear glass annealed with Polished edges only",
  "Supply of 10mm Clear glass annealed with Polished edges only",
  "Supply of 12mm Clear glass annealed with Polished edges only",
  "Supply of 6mm Clear Toughened glass with Polished edges",
  "Supply of 8mm Clear Toughened glass with Polished edges",
  "Supply of 10mm Clear Toughened glass with Polished edges",
  "Supply of 12mm Clear Toughened glass with Polished edges",
  "Supply of 6mm Tinted (Grey/Bronze) Annealed glass",
  "Supply of 8mm Tinted (Grey/Bronze) Toughened glass",
  "Supply of 6mm Low-E Glass Toughened",
  "Supply of 24mm Double Glazed Unit (6mm Clear + 12mm AS + 6mm Clear)"
];

export const GlassSectionCard: React.FC<GlassSectionCardProps> = ({
  section,
  sectionIndex,
  totalSections,
  applyMinRule,
  minThreshold,
  onUpdateSection,
  onRemoveSection,
  onMoveUp,
  onMoveDown,
  readOnly = false,
}) => {
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const { totalQty, totalSqm, effectiveAmount } = calculateSectionTotals(section);

  const handleUpdateItem = (itemId: string, field: keyof GlassItem, value: any) => {
    const updatedItems = section.items.map((item) => {
      if (item.id !== itemId) return item;

      const updated = { ...item, [field]: value };

      if (field === 'width' || field === 'height' || field === 'qty') {
        const width = Number(field === 'width' ? value : updated.width) || 0;
        const height = Number(field === 'height' ? value : updated.height) || 0;
        const qty = Number(field === 'qty' ? value : updated.qty) || 0;

        updated.perSqm = calculatePerSqm(width, height, applyMinRule, minThreshold);
        updated.totalSqm = calculateTotalSqm(qty, updated.perSqm);
      }

      return updated;
    });

    onUpdateSection({
      ...section,
      items: updatedItems,
    });
  };

  const handleAddItem = () => {
    const nextSNo = section.items.length + 1;
    const newItem: GlassItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sNo: nextSNo,
      code: '',
      qty: 0,
      width: 0,
      height: 0,
      perSqm: 0,
      totalSqm: 0,
    };

    onUpdateSection({
      ...section,
      items: [...section.items, newItem],
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = section.items
      .filter((i) => i.id !== itemId)
      .map((item, idx) => ({ ...item, sNo: idx + 1 }));

    onUpdateSection({
      ...section,
      items: updatedItems,
    });
  };

  const handleClearAllItems = () => {
    if (confirm(`Are you sure you want to remove all ${section.items.length} items from ${section.sectionCode}?`)) {
      onUpdateSection({
        ...section,
        items: [],
      });
    }
  };

  const handleApplyPastedItems = (pastedItems: GlassItem[], mode: 'replace' | 'append') => {
    let finalItems: GlassItem[] = [];

    if (mode === 'replace') {
      finalItems = pastedItems.map((item, idx) => ({ ...item, sNo: idx + 1 }));
    } else {
      const startIndex = section.items.length;
      finalItems = [
        ...section.items,
        ...pastedItems.map((item, idx) => ({ ...item, sNo: startIndex + idx + 1 })),
      ];
    }

    onUpdateSection({
      ...section,
      items: finalItems,
    });
  };

  // Direct paste on container
  const handleDirectPaste = (e: React.ClipboardEvent) => {
    if (readOnly) return;
    const pastedData = e.clipboardData.getData('text');
    if (pastedData && pastedData.includes('\t')) {
      e.preventDefault();
      const parsed = parseExcelData(pastedData, section.items.length + 1, applyMinRule, minThreshold);
      if (parsed.items.length > 0) {
        handleApplyPastedItems(parsed.items, 'append');
      }
    }
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition"
      onPaste={handleDirectPaste}
    >
      {/* Section Header Bar */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Section Code Badge */}
          <input
            type="text"
            disabled={readOnly}
            value={section.sectionCode}
            onChange={(e) => onUpdateSection({ ...section, sectionCode: e.target.value })}
            className="w-24 text-center font-bold text-xs bg-blue-100 text-blue-700 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-blue-200/80 disabled:border-slate-200 rounded-md py-1.5 px-2 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title="Section identifier (e.g. Glass -01)"
          />

          {/* Glass Description Input */}
          <div className="relative flex-1">
            <input
              type="text"
              disabled={readOnly}
              value={section.description}
              onChange={(e) => onUpdateSection({ ...section, description: e.target.value })}
              placeholder="e.g. Supply of 4mm Clear glass Annealed only"
              className="w-full text-xs font-semibold text-slate-800 bg-white disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-200 rounded-md py-1.5 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {/* Presets dropdown toggle */}
            {!readOnly && (
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                title="Common glass descriptions"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}

            {showPresets && !readOnly && (
              <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto p-1.5 text-xs">
                <div className="px-2 py-1 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                  Common Glass Types
                </div>
                {COMMON_GLASS_DESCRIPTIONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onUpdateSection({ ...section, description: preset });
                      setShowPresets(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 rounded text-slate-700 hover:text-blue-700 transition line-clamp-1 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section Action Buttons */}
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              {/* Excel Paste Button */}
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(true)}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Paste from Excel</span>
              </button>

              {/* Add Row Button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span>Add Row</span>
              </button>
            </>
          )}

          {/* Section Reorder / Collapse */}
          {!readOnly && onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={sectionIndex === 0}
              className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer"
              title="Move section up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {!readOnly && onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={sectionIndex === totalSections - 1}
              className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer"
              title="Move section down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
            title={isCollapsed ? 'Expand items' : 'Collapse items'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Delete Section */}
          {!readOnly && totalSections > 1 && (
            <button
              type="button"
              onClick={() => onRemoveSection(section.id)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
              title="Delete this glass section"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Chips Bar */}
      <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            Total Items: <span className="font-bold text-slate-700">{section.items.length}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            Total Qty: <strong className="text-slate-800 font-mono">{totalQty.toLocaleString()}</strong> pcs
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            Total Area: <strong className="text-slate-800 font-mono">{totalSqm.toLocaleString()}</strong> m²
          </span>
        </div>

        {/* Amount in AED configuration */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Rate/Sqm:</span>
            <input
              type="number"
              step="0.1"
              disabled={readOnly}
              value={section.ratePerSqm || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onUpdateSection({
                  ...section,
                  ratePerSqm: val,
                  sectionAmount: section.useCalculatedAmount ? Number((totalSqm * val).toFixed(2)) : section.sectionAmount
                });
              }}
              placeholder="0.00"
              className="w-20 text-right text-xs py-1 px-2 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed rounded-md bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <label className={`inline-flex items-center gap-1.5 select-none text-slate-600 ${readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              disabled={readOnly}
              checked={section.useCalculatedAmount || false}
              onChange={(e) => {
                const isCalc = e.target.checked;
                const newAmount = isCalc && section.ratePerSqm
                  ? Number((totalSqm * section.ratePerSqm).toFixed(2))
                  : section.sectionAmount || 0;
                onUpdateSection({
                  ...section,
                  useCalculatedAmount: isCalc,
                  sectionAmount: newAmount
                });
              }}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 disabled:cursor-not-allowed"
            />
            <span>Auto Amount</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold">Section Amount:</span>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                disabled={readOnly || section.useCalculatedAmount}
                value={effectiveAmount || ''}
                onChange={(e) =>
                  onUpdateSection({
                    ...section,
                    sectionAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className={`w-28 text-right font-bold text-xs py-1 px-2 border rounded-md ${
                  section.useCalculatedAmount || readOnly
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-blue-800 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              <span className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-slate-400">
                AED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table View */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          {section.items.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                No glass sizes added yet for {section.sectionCode}.
              </p>
              {!readOnly ? (
                <>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Paste from Excel" to import sizes directly, or click "Add Row" to enter manually.
                  </p>
                  <div className="mt-4 flex justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsPasteModalOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      Paste from Excel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      Add Single Row
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  This quotation is cancelled and locked for editing.
                </p>
              )}
            </div>
          ) : (
            <>
              <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-white border-b border-slate-200">
                <tr className="text-[10px] uppercase text-slate-500 font-bold">
                  <th className="py-2.5 px-4 w-16 text-center">S.No</th>
                  <th className="py-2.5 px-4 w-28">Code</th>
                  <th className="py-2.5 px-4 w-24 text-right">Qty</th>
                  <th className="py-2.5 px-4 w-28 text-right">Width (mm)</th>
                  <th className="py-2.5 px-4 w-28 text-right">Height (mm)</th>
                  <th className="py-2.5 px-4 w-28 text-right">Per Sqm</th>
                  <th className="py-2.5 px-4 w-32 text-right">Area (sqm)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {section.items.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="py-1.5 px-4 text-center text-slate-400 font-mono text-xs">
                      <input
                        type="text"
                        disabled={readOnly}
                        value={item.sNo}
                        onChange={(e) => handleUpdateItem(item.id, 'sNo', e.target.value)}
                        className="w-10 text-center font-mono text-xs border border-transparent hover:border-slate-200 disabled:hover:border-transparent focus:border-blue-500 disabled:cursor-not-allowed rounded py-0.5 bg-transparent focus:bg-white"
                      />
                    </td>
                    <td className="py-1.5 px-4">
                      <input
                        type="text"
                        disabled={readOnly}
                        value={item.code}
                        placeholder="e.g. WD-C-04"
                        onChange={(e) => handleUpdateItem(item.id, 'code', e.target.value)}
                        className="w-full font-mono text-xs border border-transparent hover:border-slate-200 disabled:hover:border-transparent focus:border-blue-500 disabled:cursor-not-allowed rounded py-0.5 px-1 bg-transparent focus:bg-white"
                      />
                    </td>
                    <td className="py-1.5 px-4 text-right font-semibold">
                      <input
                        type="number"
                        min="1"
                        disabled={readOnly}
                        placeholder="Qty"
                        value={item.qty || ''}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'qty', parseInt(e.target.value, 10) || 0)
                        }
                        className="w-16 text-right font-medium text-xs border border-transparent hover:border-slate-200 disabled:hover:border-transparent focus:border-blue-500 disabled:cursor-not-allowed rounded py-0.5 px-1 bg-transparent focus:bg-white"
                      />
                    </td>
                    <td className="py-1.5 px-4 text-right">
                      <input
                        type="number"
                        min="1"
                        disabled={readOnly}
                        placeholder="Width"
                        value={item.width || ''}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'width', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-right text-xs border border-transparent hover:border-slate-200 disabled:hover:border-transparent focus:border-blue-500 disabled:cursor-not-allowed rounded py-0.5 px-1 bg-transparent focus:bg-white"
                      />
                    </td>
                    <td className="py-1.5 px-4 text-right">
                      <input
                        type="number"
                        min="1"
                        disabled={readOnly}
                        placeholder="Height"
                        value={item.height || ''}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'height', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-right text-xs border border-transparent hover:border-slate-200 disabled:hover:border-transparent focus:border-blue-500 disabled:cursor-not-allowed rounded py-0.5 px-1 bg-transparent focus:bg-white"
                      />
                    </td>
                    <td className="py-1.5 px-4 text-right text-slate-500 font-mono text-xs">
                      {item.perSqm > 0 ? item.perSqm.toFixed(2) : '-'}
                    </td>
                    <td className="py-1.5 px-4 text-right font-semibold text-slate-800 font-mono text-xs">
                      {item.totalSqm > 0 ? item.totalSqm.toFixed(2) : '-'}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 transition cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Section Subtotal Footer Row */}
              <tfoot className="bg-slate-50 font-semibold text-xs border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="py-2.5 px-4 text-center uppercase tracking-wide text-slate-600">
                    TOTAL ({section.sectionCode})
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                    {totalQty.toLocaleString()}
                  </td>
                  <td colSpan={3} className="py-2.5 px-4 text-right text-slate-500">
                    Total Sqm:
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                    {totalSqm.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {!readOnly && section.items.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllItems}
                        className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Clear all rows"
                      >
                        Clear
                      </button>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Bottom table actions */}
            <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Empty Row</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(true)}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Bulk import Excel</span>
              </button>
            </div>
          </>
          )}
        </div>
      )}

      {/* Paste from Excel Modal */}
      <PasteExcelModal
        isOpen={isPasteModalOpen}
        sectionCode={section.sectionCode}
        sectionDescription={section.description}
        existingCount={section.items.length}
        applyMinRule={applyMinRule}
        minThreshold={minThreshold}
        onClose={() => setIsPasteModalOpen(false)}
        onApply={handleApplyPastedItems}
      />
    </div>
  );
};
