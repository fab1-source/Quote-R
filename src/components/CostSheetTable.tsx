import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Wrench,
  Percent,
} from 'lucide-react';
import { Quotation, CostSheetItem, CostSheetData } from '../types';

interface CostSheetTableProps {
  quotation: Quotation;
  readOnly?: boolean;
  onUpdateQuotation: (updated: Quotation) => void;
  onNotification?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const DEFAULT_SHEET_W = 3210;
const DEFAULT_SHEET_H = 2250;
const DEFAULT_SHEET_SQM = (DEFAULT_SHEET_W / 1000) * (DEFAULT_SHEET_H / 1000); // 7.2225 sqm

/**
 * Estimates standard market raw substrate price (AED / sqm)
 */
function estimateSubstratePrice(cleanName: string, thickness: string): number {
  const lower = cleanName.toLowerCase();
  let price = 30.0;
  if (lower.includes('clear')) {
    if (thickness === '4mm') price = 22.0;
    else if (thickness === '5mm') price = 25.0;
    else if (thickness === '6mm') price = 30.0;
    else if (thickness === '8mm') price = 38.0;
    else if (thickness === '10mm') price = 48.0;
    else if (thickness === '12mm') price = 62.0;
    else if (thickness === '15mm') price = 120.0;
    else if (thickness === '19mm') price = 165.0;
  } else if (lower.includes('vitralite')) {
    price = 58.0;
  } else if (lower.includes('hd grey') || lower.includes('guardian grey') || (lower.includes('hd') && lower.includes('grey'))) {
    price = 49.0;
  } else if (lower.includes('extra clear') || lower.includes('low iron') || lower.includes('ultra clear')) {
    price = thickness === '10mm' || thickness === '12mm' ? 75.0 : 45.0;
  } else if (lower.includes('low-e') || lower.includes('sunguard')) {
    price = 72.0;
  } else if (lower.includes('bronze') || lower.includes('grey') || lower.includes('blue') || lower.includes('green')) {
    price = 44.0;
  } else if (lower.includes('mirror')) {
    price = 45.0;
  }
  return price;
}

/**
 * Normalizes a raw glass pane string (e.g. "6mm Vitralite Bronze Reflective Tempered" or "Supply of 6mm Clear Annealed")
 * into a clean substrate name, thickness, and tempering flag.
 */
function parseCleanPane(raw: string) {
  let clean = raw
    .replace(/^supply\s+of\s+/i, '')
    .replace(/\s+only$/i, '')
    .replace(/\s+glass$/i, '')
    .trim();

  const lower = clean.toLowerCase();
  const isTempered = /\b(tempered|toughened|temper)\b/i.test(lower);
  const isAnnealed = /\b(annealed|anneal)\b/i.test(lower);

  // Strip process words from the glass substrate name
  let name = clean
    .replace(/\b(tempered|toughened|annealed|only)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract thickness (e.g. "6mm")
  const m = name.match(/(\d+(\.\d+)?)\s*mm/i);
  const thickness = m ? `${m[1]}mm` : '6mm';

  // Ensure name begins with thickness
  if (!name.toLowerCase().startsWith(thickness.toLowerCase())) {
    name = `${thickness} ${name}`;
  }
  name = name.replace(/\s+/g, ' ').trim();

  return {
    cleanName: name,
    thickness,
    isTempered,
    isAnnealed,
    defaultPrice: estimateSubstratePrice(name, thickness),
  };
}

/**
 * Builds auto-generated cost sheet items strictly containing ONLY the glass
 * substrates and processes specified in the quotation.
 */
export function generateDefaultCostSheet(quotation: Quotation): CostSheetItem[] {
  const substrateMap = new Map<
    string,
    {
      label: string;
      cleanName: string;
      thickness: string;
      totalNetSqm: number;
      pricePerSqm: number;
    }
  >();

  const serviceMap = new Map<
    string,
    {
      name: string;
      qty: number;
      rate: number;
    }
  >();

  (quotation.glassSections || []).forEach((section) => {
    const desc = (section.description || '').trim();
    if (!desc) return;
    const lower = desc.toLowerCase();

    // Section net area in sqm
    const sectionNetSqm = (section.items || []).reduce((acc, item) => {
      const w = item.width || 0;
      const h = item.height || 0;
      const q = item.qty || (item as any).quantity || 0;
      return acc + (w * h * q) / 1000000;
    }, 0);

    const isDgu = lower.includes('dgu') || lower.includes('double glaz') || lower.includes('igu');
    const isLaminated = lower.includes('laminat') || lower.includes('pvb') || lower.includes('sgp');

    if ((isDgu || isLaminated) && (desc.includes('+') || lower.includes('consist of'))) {
      // DGU or Laminated assembly with components
      let specPart = desc;
      if (lower.includes('consist of')) {
        specPart = desc.split(/consist of/i)[1] || desc;
      }
      let optionsPart = '';
      if (/with\s+/i.test(specPart)) {
        const withParts = specPart.split(/with\s+/i);
        specPart = withParts[0];
        optionsPart = withParts.slice(1).join(' with ');
      }

      // Split component panes by '+'
      const pieces = specPart.split('+').map((p) => p.trim()).filter(Boolean);
      pieces.forEach((p) => {
        const pl = p.toLowerCase();
        // Skip air spacer or gas
        if (pl.includes('asp') || pl.includes('spacer') || pl.includes(' air ') || /\b\d+\s*mm\s*as\b/i.test(pl)) {
          return;
        }
        // Skip PVB / SGP interlayer as raw glass sheet
        if (pl.includes('pvb') || pl.includes('sgp') || pl.includes('interlayer')) {
          return;
        }

        const pane = parseCleanPane(p);
        const existing = substrateMap.get(pane.cleanName) || {
          label: `${pane.cleanName}-${DEFAULT_SHEET_W} x ${DEFAULT_SHEET_H}`,
          cleanName: pane.cleanName,
          thickness: pane.thickness,
          totalNetSqm: 0,
          pricePerSqm: pane.defaultPrice,
        };
        existing.totalNetSqm += sectionNetSqm;
        substrateMap.set(pane.cleanName, existing);

        // If this pane is tempered, add tempering service for this pane
        if (pane.isTempered) {
          const sName = `Temper - ${pane.cleanName}`;
          const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 10.0 };
          sExisting.qty += sectionNetSqm;
          serviceMap.set(sName, sExisting);
        }
      });

      // Add Double Glazing assembly service
      if (isDgu) {
        const sName = 'Double Glazing';
        const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 45.0 };
        sExisting.qty += sectionNetSqm;
        serviceMap.set(sName, sExisting);
      }

      // Add Lamination assembly service
      if (isLaminated) {
        const sName = 'Lamination / PVB Interlayer';
        const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 55.0 };
        sExisting.qty += sectionNetSqm;
        serviceMap.set(sName, sExisting);
      }

      // Check additional options mentioned in the quotation (e.g. Overlap, U-Insert, Stepped)
      const fullOpts = `${optionsPart} ${desc}`.toLowerCase();
      if (fullOpts.includes('overlap')) {
        const sName = 'Overlap';
        const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 20.0 };
        sExisting.qty += sectionNetSqm;
        serviceMap.set(sName, sExisting);
      }
      if (fullOpts.includes('u-insert') || fullOpts.includes('u insert') || fullOpts.includes('u channel')) {
        const sName = 'U-Insert';
        const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 20.0 };
        sExisting.qty += sectionNetSqm;
        serviceMap.set(sName, sExisting);
      }
      if (fullOpts.includes('step')) {
        const sName = 'Stepped Glazing';
        const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 25.0 };
        sExisting.qty += sectionNetSqm;
        serviceMap.set(sName, sExisting);
      }
    } else {
      // Monolithic single glass (e.g. "Supply of 6mm Clear Annealed")
      const pane = parseCleanPane(desc);
      const existing = substrateMap.get(pane.cleanName) || {
        label: `${pane.cleanName}-${DEFAULT_SHEET_W} x ${DEFAULT_SHEET_H}`,
        cleanName: pane.cleanName,
        thickness: pane.thickness,
        totalNetSqm: 0,
        pricePerSqm: pane.defaultPrice,
      };
      existing.totalNetSqm += sectionNetSqm;
      substrateMap.set(pane.cleanName, existing);

      // If tempered, add tempering service. If Annealed, DO NOT ADD tempering!
      if (pane.isTempered) {
        const sName = `Temper - ${pane.cleanName}`;
        const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 10.0 };
        sExisting.qty += sectionNetSqm;
        serviceMap.set(sName, sExisting);
      }

      // Check for other explicit services in monolithic descriptions
      if (lower.includes('polish') || lower.includes('edging')) {
        const sName = 'Polishing / Edging';
        const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 8.0 };
        sExisting.qty += sectionNetSqm;
        serviceMap.set(sName, sExisting);
      }
      if (lower.includes('sandblast') || lower.includes('frosted')) {
        const sName = 'Sandblasting / Frosted Processing';
        const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 25.0 };
        sExisting.qty += sectionNetSqm;
        serviceMap.set(sName, sExisting);
      }
      if (lower.includes('hole') || lower.includes('cutout') || lower.includes('notch')) {
        const sName = 'Holes / Cutouts Processing';
        const sExisting = serviceMap.get(sName) || { name: sName, qty: 0, rate: 15.0 };
        sExisting.qty += 1;
        serviceMap.set(sName, sExisting);
      }
    }
  });

  const items: CostSheetItem[] = [];

  // 1. Glass Substrates Rows
  substrateMap.forEach((data, key) => {
    const netSqm = data.totalNetSqm;
    // Calculate sheets needed. If netSqm is 0, estimate 1 sheet
    const estimatedActual = netSqm > 0 ? Math.ceil(netSqm / DEFAULT_SHEET_SQM) : 1;
    // Extra sheet buffer (Actual + 1)
    const qty = estimatedActual + 1;
    const pricePerSqm = data.pricePerSqm;
    const cuttingCharge = 15.0; // 15.00 AED per sheet for cutting (annealed cutting charge)

    // Total = (qty * sheet_sqm * pricePerSqm) + (qty * cuttingCharge)
    const total = parseFloat(
      (qty * DEFAULT_SHEET_SQM * pricePerSqm + qty * cuttingCharge).toFixed(2)
    );

    items.push({
      id: `glass-${key.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'glass',
      description: data.label,
      actual: `${estimatedActual} Sheets`,
      actualSheets: estimatedActual,
      qty: qty,
      sheetWidthMm: DEFAULT_SHEET_W,
      sheetHeightMm: DEFAULT_SHEET_H,
      pricePerSqm: pricePerSqm,
      cuttingCharge: cuttingCharge,
      total: total,
    });
  });

  // 2. Services Rows (Only those mentioned in quotation)
  serviceMap.forEach((svc, key) => {
    const qty = parseFloat(svc.qty.toFixed(2));
    const total = parseFloat((qty * svc.rate).toFixed(2));
    items.push({
      id: `service-${key.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'service',
      description: svc.name,
      actual: '',
      qty: qty,
      pricePerSqm: svc.rate,
      cuttingCharge: 0,
      total: total,
    });
  });

  return items;
}

export const CostSheetTable: React.FC<CostSheetTableProps> = ({
  quotation,
  readOnly = false,
  onUpdateQuotation,
  onNotification,
}) => {
  // Initialize from saved quotation.costSheetData or auto-generate from quote sections
  const [items, setItems] = useState<CostSheetItem[]>(() => {
    if (quotation.costSheetData && quotation.costSheetData.items && quotation.costSheetData.items.length > 0) {
      // Check if it's the old legacy dummy items (e.g. contains 'glass-default' or '6mm HD Grey' when quote does not have HD Grey)
      const hasOldDummy = quotation.costSheetData.items.some(
        (it) =>
          it.id.startsWith('glass-default') ||
          (it.description.includes('6mm HD Grey') &&
            !quotation.glassSections?.some((s) => s.description?.toLowerCase().includes('hd')))
      );
      if (!hasOldDummy) {
        return quotation.costSheetData.items;
      }
    }
    return generateDefaultCostSheet(quotation);
  });

  const [marginPercent, setMarginPercent] = useState<number>(() => {
    if (quotation.costSheetData && typeof quotation.costSheetData.marginPercent === 'number') {
      return quotation.costSheetData.marginPercent;
    }
    return 15.0; // 15% default margin as shown in image.png
  });

  // Calculate Subtotal (sum of all glass + services items)
  const totalCost = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  }, [items]);

  // Margin AED = Total * (Margin% / 100)
  const marginAmount = useMemo(() => {
    return (totalCost * marginPercent) / 100;
  }, [totalCost, marginPercent]);

  // Final Quote Value = Total + Margin
  const finalQuoteValue = useMemo(() => {
    return totalCost + marginAmount;
  }, [totalCost, marginAmount]);

  // Save changes to quotation object
  const persistChanges = (newItems: CostSheetItem[], newMargin: number) => {
    const updatedData: CostSheetData = {
      items: newItems,
      marginPercent: newMargin,
      lastUpdated: new Date().toISOString(),
    };
    onUpdateQuotation({
      ...quotation,
      costSheetData: updatedData,
    });
  };

  // Recalculate item total based on fields
  const calculateItemTotal = (item: CostSheetItem): number => {
    if (item.type === 'glass') {
      const w = item.sheetWidthMm || DEFAULT_SHEET_W;
      const h = item.sheetHeightMm || DEFAULT_SHEET_H;
      const sheetSqm = (w / 1000) * (h / 1000);
      const glassCost = (item.qty || 0) * sheetSqm * (item.pricePerSqm || 0);
      const cuttingCost = (item.qty || 0) * (item.cuttingCharge || 0);
      return parseFloat((glassCost + cuttingCost).toFixed(2));
    } else {
      // Service item: Qty * Price/Sqm
      return parseFloat(((item.qty || 0) * (item.pricePerSqm || 0)).toFixed(2));
    }
  };

  // Handle cell edits
  const handleItemChange = (id: string, field: keyof CostSheetItem, value: any) => {
    if (readOnly) return;
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };

        // If user changed "actual" or "actualSheets", auto-update Qty with +1 buffer if glass
        if (field === 'actual' && item.type === 'glass') {
          const numMatch = String(value).match(/(\d+(\.\d+)?)/);
          if (numMatch) {
            const parsedActual = parseFloat(numMatch[1]);
            updatedItem.actualSheets = parsedActual;
            updatedItem.qty = parsedActual + 1;
          }
        } else if (field === 'actualSheets' && item.type === 'glass') {
          const num = Number(value) || 0;
          updatedItem.actual = `${num} Sheets`;
          updatedItem.qty = num + 1;
        }

        // Auto-recalculate row total
        updatedItem.total = calculateItemTotal(updatedItem);
        return updatedItem;
      });

      persistChanges(updated, marginPercent);
      return updated;
    });
  };

  // Add new custom glass row
  const handleAddGlassRow = () => {
    if (readOnly) return;
    const actual = 10;
    const qty = 11;
    const price = 30.0;
    const cutting = 15.0;
    const total = parseFloat((qty * DEFAULT_SHEET_SQM * price + qty * cutting).toFixed(2));

    const newItem: CostSheetItem = {
      id: `glass-custom-${Date.now()}`,
      type: 'glass',
      description: `6mm Clear-${DEFAULT_SHEET_W} x ${DEFAULT_SHEET_H}`,
      actual: `${actual} Sheets`,
      actualSheets: actual,
      qty: qty,
      sheetWidthMm: DEFAULT_SHEET_W,
      sheetHeightMm: DEFAULT_SHEET_H,
      pricePerSqm: price,
      cuttingCharge: cutting,
      total: total,
    };

    const next = [...items, newItem];
    setItems(next);
    persistChanges(next, marginPercent);
    if (onNotification) onNotification('Added glass row to Cost Sheet', 'info');
  };

  // Add new custom service row
  const handleAddServiceRow = () => {
    if (readOnly) return;
    const newItem: CostSheetItem = {
      id: `service-custom-${Date.now()}`,
      type: 'service',
      description: 'Polishing / Edging',
      actual: '',
      qty: 25.0,
      pricePerSqm: 8.0,
      cuttingCharge: 0,
      total: 200.0,
    };

    const next = [...items, newItem];
    setItems(next);
    persistChanges(next, marginPercent);
    if (onNotification) onNotification('Added service row to Cost Sheet', 'info');
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    if (readOnly) return;
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    persistChanges(next, marginPercent);
    if (onNotification) onNotification('Removed item from Cost Sheet', 'info');
  };

  // Reset to auto-generated from quotation sections
  const handleResetFromQuotation = () => {
    if (readOnly) return;
    const freshItems = generateDefaultCostSheet(quotation);
    setItems(freshItems);
    persistChanges(freshItems, marginPercent);
    if (onNotification) onNotification('Reset Cost Sheet from quotation glass specifications', 'success');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
      {/* Cost Sheet Header Banner */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30">
            <Calculator className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>INTERNAL COST ESTIMATION SHEET</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Formula Sheet
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Direct cost breakdown for glass substrates, cutting charges, processing services, and margin.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAddGlassRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold border border-slate-700 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Glass Row</span>
            </button>
            <button
              type="button"
              onClick={handleAddServiceRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold border border-slate-700 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>+ Service Row</span>
            </button>
            <button
              type="button"
              onClick={handleResetFromQuotation}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 rounded-lg text-xs font-semibold border border-indigo-700/50 transition cursor-pointer"
              title="Recalculate glass types and areas directly from quotation sections"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-300" />
              <span>Auto-Populate</span>
            </button>
          </div>
        )}
      </div>

      {/* Notice Banner */}
      <div className="bg-amber-50/70 border-b border-amber-200/80 px-5 py-2.5 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Calculation Rule:</strong> Estimated actual sheets include a <strong>+1 extra sheet buffer</strong> for factory processing/breakage allowance. All cells (descriptions, quantities, rates, cutting charges, margin %) are fully editable.
          </span>
        </div>
      </div>

      {/* Main Cost Sheet Table matching image.png */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-300">
              <th className="py-3 px-4 text-left border-r border-slate-300 min-w-[240px]">
                Item Description
              </th>
              <th className="py-3 px-3 text-center border-r border-slate-300 w-32">
                Actual
              </th>
              <th className="py-3 px-3 text-center border-r border-slate-300 w-24">
                Qty
              </th>
              <th className="py-3 px-3 text-right border-r border-slate-300 w-32">
                Price/Sqm (AED)
              </th>
              <th className="py-3 px-3 text-right border-r border-slate-300 w-36">
                Cutting Charge (AED)
              </th>
              <th className="py-3 px-4 text-right border-r border-slate-300 w-36">
                Total (AED)
              </th>
              {!readOnly && (
                <th className="py-3 px-2 text-center w-12">
                  Act
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 6 : 7} className="py-8 text-center text-slate-400">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="font-semibold text-slate-700">No Glass or Services in Cost Sheet</p>
                    <p className="text-xs text-slate-500">
                      Add glass specifications in the Main Quote tab, or click <strong>+ Glass Row</strong> or <strong>Auto-Populate</strong> above.
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {/* 1. GLASS SUBSTRATES SECTION */}
            {items
              .filter((it) => it.type === 'glass')
              .map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Item Description (e.g. 6mm HD Grey-3210 x 2250) */}
                  <td className="py-2.5 px-4 border-r border-slate-300 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        <Layers className="w-3.5 h-3.5" />
                      </span>
                      {readOnly ? (
                        <span className="font-bold text-slate-900">{item.description}</span>
                      ) : (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="w-full font-bold text-slate-900 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="e.g. 6mm HD Grey-3210 x 2250"
                        />
                      )}
                    </div>
                  </td>

                  {/* Actual (e.g. 12 Sheets) */}
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center align-middle">
                    {readOnly ? (
                      <span className="font-semibold text-slate-700 font-mono">{item.actual || '-'}</span>
                    ) : (
                      <input
                        type="text"
                        value={item.actual}
                        onChange={(e) => handleItemChange(item.id, 'actual', e.target.value)}
                        className="w-full text-center font-semibold text-slate-800 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="e.g. 12 Sheets"
                      />
                    )}
                  </td>

                  {/* Qty (e.g. 13) */}
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center align-middle">
                    {readOnly ? (
                      <span className="font-bold text-slate-900 font-mono">{item.qty}</span>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(item.id, 'qty', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-center font-bold text-slate-900 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    )}
                  </td>

                  {/* Price/Sqm (e.g. 49.00) */}
                  <td className="py-2.5 px-3 border-r border-slate-300 text-right align-middle">
                    {readOnly ? (
                      <span className="font-mono text-slate-800">
                        {item.pricePerSqm?.toFixed(2)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={item.pricePerSqm}
                        onChange={(e) =>
                          handleItemChange(item.id, 'pricePerSqm', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right font-mono text-slate-900 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    )}
                  </td>

                  {/* Cutting Charge (e.g. 15.00) */}
                  <td className="py-2.5 px-3 border-r border-slate-300 text-right align-middle">
                    {readOnly ? (
                      <span className="font-mono text-slate-800">
                        {item.cuttingCharge?.toFixed(2)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={item.cuttingCharge}
                        onChange={(e) =>
                          handleItemChange(item.id, 'cuttingCharge', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right font-mono text-slate-900 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    )}
                  </td>

                  {/* Total (e.g. 4795.73) */}
                  <td className="py-2.5 px-4 border-r border-slate-300 text-right align-middle bg-slate-50/50">
                    {readOnly ? (
                      <span className="font-bold text-slate-900 font-mono">
                        {item.total?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={item.total}
                        onChange={(e) =>
                          handleItemChange(item.id, 'total', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right font-bold text-slate-900 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    )}
                  </td>

                  {!readOnly && (
                    <td className="py-2.5 px-2 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

            {/* 2. SERVICES SECTION (e.g. Temper, Edging) */}
            {items
              .filter((it) => it.type === 'service')
              .map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors bg-blue-50/20">
                  {/* Service Description (e.g. Temper) */}
                  <td className="py-2.5 px-4 border-r border-slate-300 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        <Wrench className="w-3.5 h-3.5" />
                      </span>
                      {readOnly ? (
                        <span className="font-semibold text-slate-900">{item.description}</span>
                      ) : (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="w-full font-semibold text-slate-900 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="e.g. Temper"
                        />
                      )}
                    </div>
                  </td>

                  {/* Actual for service (blank in image.png) */}
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center align-middle text-slate-400">
                    -
                  </td>

                  {/* Qty (e.g. 71.85 sqm) */}
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center align-middle">
                    {readOnly ? (
                      <span className="font-bold text-slate-900 font-mono">{item.qty}</span>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(item.id, 'qty', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-center font-bold text-slate-900 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Qty"
                      />
                    )}
                  </td>

                  {/* Price/Sqm (e.g. 10.00) */}
                  <td className="py-2.5 px-3 border-r border-slate-300 text-right align-middle">
                    {readOnly ? (
                      <span className="font-mono text-slate-800">
                        {item.pricePerSqm?.toFixed(2)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={item.pricePerSqm}
                        onChange={(e) =>
                          handleItemChange(item.id, 'pricePerSqm', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right font-mono text-slate-900 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    )}
                  </td>

                  {/* Cutting Charge for service (blank in image.png) */}
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center align-middle text-slate-400">
                    -
                  </td>

                  {/* Total (e.g. 718.50) */}
                  <td className="py-2.5 px-4 border-r border-slate-300 text-right align-middle bg-slate-50/50">
                    {readOnly ? (
                      <span className="font-bold text-slate-900 font-mono">
                        {item.total?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={item.total}
                        onChange={(e) =>
                          handleItemChange(item.id, 'total', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right font-bold text-slate-900 bg-white hover:bg-slate-100/80 focus:bg-white px-2 py-1 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    )}
                  </td>

                  {!readOnly && (
                    <td className="py-2.5 px-2 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

            {/* Separator / Blank Row matching image.png */}
            <tr className="h-4 bg-slate-50/50">
              <td colSpan={readOnly ? 6 : 7} className="border-t border-b border-slate-200"></td>
            </tr>

            {/* 3. TOTAL ROW (e.g. 5514.23) */}
            <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
              <td className="py-3 px-4 border-r border-slate-300 text-slate-900 text-sm font-black">
                Total
              </td>
              <td className="border-r border-slate-300"></td>
              <td className="border-r border-slate-300"></td>
              <td className="border-r border-slate-300"></td>
              <td className="border-r border-slate-300"></td>
              <td className="py-3 px-4 border-r border-slate-300 text-right font-mono text-sm font-black text-slate-900 bg-white">
                {totalCost.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              {!readOnly && <td></td>}
            </tr>

            {/* 4. MARGIN ROW (e.g. 15.00% -> 827.13) */}
            <tr className="bg-amber-50/30 border-t border-slate-200 font-bold">
              <td className="py-3 px-4 border-r border-slate-300 text-slate-900 text-sm font-bold flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-600" />
                <span>Margin</span>
              </td>
              <td className="border-r border-slate-300"></td>
              <td className="border-r border-slate-300"></td>
              <td className="border-r border-slate-300"></td>
              {/* Margin % input cell */}
              <td className="py-2.5 px-3 border-r border-slate-300 text-right align-middle">
                <div className="inline-flex items-center justify-end gap-1 w-full">
                  {readOnly ? (
                    <span className="font-mono text-slate-900 font-bold">{marginPercent.toFixed(2)}%</span>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        step="0.1"
                        value={marginPercent}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setMarginPercent(val);
                          persistChanges(items, val);
                        }}
                        className="w-20 text-right font-mono font-bold text-amber-900 bg-white hover:bg-slate-50 focus:bg-white px-2 py-1 border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-600">%</span>
                    </div>
                  )}
                </div>
              </td>
              {/* Margin AED Amount */}
              <td className="py-3 px-4 border-r border-slate-300 text-right font-mono text-sm font-bold text-amber-900 bg-amber-50/50">
                {marginAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              {!readOnly && <td></td>}
            </tr>

            {/* 5. FINAL QUOTE VALUE ROW (e.g. 6341.37) */}
            <tr className="bg-emerald-50/60 border-t-2 border-emerald-500/80 font-black">
              <td className="py-3.5 px-4 border-r border-slate-300 text-emerald-950 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Final Quote Value</span>
              </td>
              <td className="border-r border-slate-300"></td>
              <td className="border-r border-slate-300"></td>
              <td className="border-r border-slate-300"></td>
              <td className="border-r border-slate-300"></td>
              <td className="py-3.5 px-4 border-r border-slate-300 text-right font-mono text-base text-emerald-950 bg-emerald-100/60">
                AED{' '}
                {finalQuoteValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              {!readOnly && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Info & Helpers */}
      <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-slate-400">Standard Sheet: </span>
            <span className="font-mono font-semibold text-slate-700">
              {DEFAULT_SHEET_W} × {DEFAULT_SHEET_H} mm ({DEFAULT_SHEET_SQM} m²)
            </span>
          </div>
          <div>
            <span className="text-slate-400">Active Glass Items: </span>
            <span className="font-mono font-semibold text-slate-700">
              {items.filter((it) => it.type === 'glass').length}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Active Services: </span>
            <span className="font-mono font-semibold text-slate-700">
              {items.filter((it) => it.type === 'service').length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">
            Estimator reference only • Not printed on client quotation
          </span>
        </div>
      </div>
    </div>
  );
};
