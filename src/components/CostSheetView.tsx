import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  Percent,
  Layers,
  Truck,
  ShieldAlert,
  Printer,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  DollarSign,
  Lock,
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Quotation, GlassSection, GlassItem } from '../types';
import { calculateQuotationTotals, calculateSectionTotals } from '../utils/calculations';

interface CostSheetViewProps {
  quotation: Quotation;
  onUpdateQuotation?: (updated: Quotation) => void;
  isLocked?: boolean;
  onBackToQuotation?: () => void;
}

interface CostRatesConfig {
  wastagePercent: number; // e.g. 10%
  edgingRatePerMeter: number; // e.g. 4.0 AED/linear meter
  temperingRatePerSqm: number; // e.g. 20.0 AED/sqm
  dguAddonRatePerSqm: number; // e.g. 55.0 AED/sqm
  laminationAddonRatePerSqm: number; // e.g. 60.0 AED/sqm
  consumablesRatePerSqm: number; // e.g. 3.5 AED/sqm
  transportOverheadAED: number; // e.g. 250 AED
  factoryOverheadPercent: number; // e.g. 5%
}

const DEFAULT_RATES: CostRatesConfig = {
  wastagePercent: 10,
  edgingRatePerMeter: 4.0,
  temperingRatePerSqm: 20.0,
  dguAddonRatePerSqm: 55.0,
  laminationAddonRatePerSqm: 60.0,
  consumablesRatePerSqm: 3.5,
  transportOverheadAED: 250,
  factoryOverheadPercent: 5.0,
};

// Helper to estimate raw glass substrate rate based on description
function estimateRawSubstrateRate(description: string): number {
  const desc = description.toLowerCase();
  let baseRate = 35; // default 6mm

  if (desc.includes('4mm')) baseRate = 22;
  else if (desc.includes('5mm')) baseRate = 26;
  else if (desc.includes('6mm')) baseRate = 30;
  else if (desc.includes('8mm')) baseRate = 42;
  else if (desc.includes('10mm')) baseRate = 55;
  else if (desc.includes('12mm')) baseRate = 72;
  else if (desc.includes('15mm')) baseRate = 120;
  else if (desc.includes('19mm')) baseRate = 165;
  else if (desc.includes('24mm') || desc.includes('double glazed')) baseRate = 60; // DGU substrate combined

  // Adjustments for tint, low-e, frosted, etc.
  if (desc.includes('tint') || desc.includes('grey') || desc.includes('bronze')) {
    baseRate += 15;
  }
  if (desc.includes('low-e') || desc.includes('low e')) {
    baseRate += 35;
  }
  if (desc.includes('extra clear') || desc.includes('low iron') || desc.includes('ultra clear')) {
    baseRate += 30;
  }
  if (desc.includes('frosted') || desc.includes('sandblast')) {
    baseRate += 20;
  }

  return baseRate;
}

// Detect if tempering is required
function isToughenedRequired(description: string): boolean {
  const desc = description.toLowerCase();
  return desc.includes('toughen') || desc.includes('temper');
}

// Detect if DGU or Laminated
function isDguOrLaminated(description: string): { isDgu: boolean; isLaminated: boolean } {
  const desc = description.toLowerCase();
  return {
    isDgu: desc.includes('dgu') || desc.includes('double glazed') || desc.includes('insulat'),
    isLaminated: desc.includes('laminat') || desc.includes('pvb'),
  };
}

export const CostSheetView: React.FC<CostSheetViewProps> = ({
  quotation,
  onUpdateQuotation,
  isLocked = false,
  onBackToQuotation,
}) => {
  const [rates, setRates] = useState<CostRatesConfig>(DEFAULT_RATES);
  const [showConfig, setShowConfig] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSectionExpand = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Calculate detailed cost breakdown per section
  const sectionCostBreakdowns = useMemo(() => {
    return quotation.glassSections.map((sec) => {
      const { totalQty, totalSqm, effectiveAmount } = calculateSectionTotals(sec);

      // Raw Substrate Cost
      const rawRate = estimateRawSubstrateRate(sec.description);
      const rawGlassBaseCost = totalSqm * rawRate;
      const rawGlassWastageCost = rawGlassBaseCost * (rates.wastagePercent / 100);
      const totalRawCost = rawGlassBaseCost + rawGlassWastageCost;

      // Linear perimeter calculation (edging in running meters)
      let totalPerimeterMeters = 0;
      sec.items.forEach((item) => {
        const itemPerimeterM = ((item.width + item.height) * 2) / 1000;
        totalPerimeterMeters += itemPerimeterM * (item.qty || 1);
      });
      const edgingCost = totalPerimeterMeters * rates.edgingRatePerMeter;

      // Tempering Cost
      const requiresTempering = isToughenedRequired(sec.description);
      const temperingCost = requiresTempering ? totalSqm * rates.temperingRatePerSqm : 0;

      // DGU / Lamination Cost
      const { isDgu, isLaminated } = isDguOrLaminated(sec.description);
      let specialProcessingCost = 0;
      if (isDgu) specialProcessingCost += totalSqm * rates.dguAddonRatePerSqm;
      if (isLaminated) specialProcessingCost += totalSqm * rates.laminationAddonRatePerSqm;

      // Consumables (cork pads, corner protectors, strapping)
      const consumablesCost = totalSqm * rates.consumablesRatePerSqm;

      // Total direct cost for this section
      const directCost = totalRawCost + edgingCost + temperingCost + specialProcessingCost + consumablesCost;

      // Section selling price (quoted)
      const sellingPrice = effectiveAmount || 0;
      const grossProfit = sellingPrice - directCost;
      const marginPercent = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
      const markupPercent = directCost > 0 ? (grossProfit / directCost) * 100 : 0;
      const costPerSqm = totalSqm > 0 ? directCost / totalSqm : 0;
      const sellingPricePerSqm = totalSqm > 0 ? sellingPrice / totalSqm : 0;

      return {
        sectionId: sec.id,
        sectionCode: sec.sectionCode,
        description: sec.description,
        totalQty,
        totalSqm,
        totalPerimeterMeters,
        rawRate,
        rawGlassBaseCost,
        rawGlassWastageCost,
        totalRawCost,
        edgingCost,
        requiresTempering,
        temperingCost,
        isDgu,
        isLaminated,
        specialProcessingCost,
        consumablesCost,
        directCost,
        sellingPrice,
        grossProfit,
        marginPercent,
        markupPercent,
        costPerSqm,
        sellingPricePerSqm,
        items: sec.items.map((it) => {
          const itemPerimeterM = ((it.width + it.height) * 2) / 1000;
          const itemTotalPerimeter = itemPerimeterM * (it.qty || 1);
          const itemRawCost = it.totalSqm * rawRate * (1 + rates.wastagePercent / 100);
          const itemEdgingCost = itemTotalPerimeter * rates.edgingRatePerMeter;
          const itemTempering = requiresTempering ? it.totalSqm * rates.temperingRatePerSqm : 0;
          const itemSpecial = isDgu ? it.totalSqm * rates.dguAddonRatePerSqm : isLaminated ? it.totalSqm * rates.laminationAddonRatePerSqm : 0;
          const itemConsumables = it.totalSqm * rates.consumablesRatePerSqm;
          const itemCost = itemRawCost + itemEdgingCost + itemTempering + itemSpecial + itemConsumables;
          const itemSellingPrice = it.totalSqm > 0 && totalSqm > 0 ? (it.totalSqm / totalSqm) * sellingPrice : 0;
          const itemProfit = itemSellingPrice - itemCost;

          return {
            ...it,
            itemPerimeterM,
            itemTotalPerimeter,
            itemCost,
            itemSellingPrice,
            itemProfit,
          };
        }),
      };
    });
  }, [quotation, rates]);

  // Overall Quotation Totals
  const { grandTotalQty, grandTotalSqm, totalAmountAED } = useMemo(() => {
    return calculateQuotationTotals(quotation);
  }, [quotation]);

  // Aggregate Direct Costs
  const totalRawGlassCost = sectionCostBreakdowns.reduce((acc, s) => acc + s.totalRawCost, 0);
  const totalEdgingCost = sectionCostBreakdowns.reduce((acc, s) => acc + s.edgingCost, 0);
  const totalTemperingCost = sectionCostBreakdowns.reduce((acc, s) => acc + s.temperingCost, 0);
  const totalSpecialProcessingCost = sectionCostBreakdowns.reduce((acc, s) => acc + s.specialProcessingCost, 0);
  const totalConsumablesCost = sectionCostBreakdowns.reduce((acc, s) => acc + s.consumablesCost, 0);

  const totalDirectCosts =
    totalRawGlassCost +
    totalEdgingCost +
    totalTemperingCost +
    totalSpecialProcessingCost +
    totalConsumablesCost;

  // Overheads
  const factoryOverheadAED = totalDirectCosts * (rates.factoryOverheadPercent / 100);
  const totalCostAED = totalDirectCosts + factoryOverheadAED + rates.transportOverheadAED;

  // Commercial KPIs
  const totalRevenueAED = totalAmountAED; // Excl. VAT
  const totalGrossProfitAED = totalRevenueAED - totalCostAED;
  const overallMarginPercent = totalRevenueAED > 0 ? (totalGrossProfitAED / totalRevenueAED) * 100 : 0;
  const overallMarkupPercent = totalCostAED > 0 ? (totalGrossProfitAED / totalCostAED) * 100 : 0;
  const overallCostPerSqm = grandTotalSqm > 0 ? totalCostAED / grandTotalSqm : 0;
  const overallRevenuePerSqm = grandTotalSqm > 0 ? totalRevenueAED / grandTotalSqm : 0;
  const breakEvenRatePerSqm = grandTotalSqm > 0 ? totalCostAED / grandTotalSqm : 0;

  const handlePrintCostSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Quotation Header Bar (Print hidden) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-[#7B1818] text-white">
              COST SHEET
            </span>
            <span className="font-mono font-bold text-base text-slate-900">
              {quotation.from.refNo} ({quotation.from.rev})
            </span>
            {quotation.status === 'confirmed' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Confirmed & Locked</span>
              </span>
            )}
            {quotation.status === 'cancelled' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-900 border border-red-300 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                <span>Cancelled</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Client: <strong className="text-slate-800">{quotation.client.name || 'Not specified'}</strong>
            {quotation.client.emirate && <span> • {quotation.client.emirate}</span>}
            {quotation.salesmanName && (
              <span className="ml-2 font-medium text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Salesman: {quotation.salesmanName}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onBackToQuotation && (
            <button
              type="button"
              onClick={onBackToQuotation}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Quotation</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              showConfig
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Cost Rate Settings</span>
            {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handlePrintCostSheet}
            className="px-4 py-2 text-xs font-semibold bg-[#7B1818] hover:bg-[#631313] text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Cost Sheet</span>
          </button>
        </div>
      </div>

      {/* Internal Confidential Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 print:border print:border-black">
        <Info className="w-4 h-4 text-amber-700 shrink-0" />
        <div>
          <strong className="font-bold">STRICTLY CONFIDENTIAL • INTERNAL COST & PROFIT ESTIMATION:</strong>{' '}
          This sheet breaks down raw float substrate, edge polishing, kiln heat treatment, lamination, and overhead margins. Never distribute to clients.
        </div>
      </div>

      {/* Collapsible Rate Settings Drawer */}
      {showConfig && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Factory Cost & Overhead Parameters (AED)
              </h3>
              {isLocked && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Locked</span>
                </span>
              )}
            </div>
            {!isLocked && (
              <button
                type="button"
                onClick={() => setRates(DEFAULT_RATES)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Cutting Wastage (%)
              </label>
              <input
                type="number"
                disabled={isLocked}
                value={rates.wastagePercent}
                onChange={(e) => setRates({ ...rates, wastagePercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-slate-800 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Standard sheet scrap</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Edging / Polishing (AED/m)
              </label>
              <input
                type="number"
                step="0.5"
                disabled={isLocked}
                value={rates.edgingRatePerMeter}
                onChange={(e) => setRates({ ...rates, edgingRatePerMeter: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-slate-800 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Per linear meter</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Tempering Rate (AED/m²)
              </label>
              <input
                type="number"
                step="1"
                disabled={isLocked}
                value={rates.temperingRatePerSqm}
                onChange={(e) => setRates({ ...rates, temperingRatePerSqm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-slate-800 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Kiln treatment per sqm</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                DGU Add-on (AED/m²)
              </label>
              <input
                type="number"
                step="1"
                disabled={isLocked}
                value={rates.dguAddonRatePerSqm}
                onChange={(e) => setRates({ ...rates, dguAddonRatePerSqm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-slate-800 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Spacer, butyl & sealants</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Lamination PVB (AED/m²)
              </label>
              <input
                type="number"
                step="1"
                disabled={isLocked}
                value={rates.laminationAddonRatePerSqm}
                onChange={(e) => setRates({ ...rates, laminationAddonRatePerSqm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-slate-800 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Autoclave & interlayer</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Consumables (AED/m²)
              </label>
              <input
                type="number"
                step="0.5"
                disabled={isLocked}
                value={rates.consumablesRatePerSqm}
                onChange={(e) => setRates({ ...rates, consumablesRatePerSqm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-slate-800 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Pads, straps, corner guards</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Transport & Delivery (AED)
              </label>
              <input
                type="number"
                step="25"
                disabled={isLocked}
                value={rates.transportOverheadAED}
                onChange={(e) => setRates({ ...rates, transportOverheadAED: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-slate-800 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Fixed logistics allocation</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Factory Overhead (%)
              </label>
              <input
                type="number"
                step="0.5"
                disabled={isLocked}
                value={rates.factoryOverheadPercent}
                onChange={(e) => setRates({ ...rates, factoryOverheadPercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-slate-800 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">% of direct production</span>
            </div>
          </div>
        </div>
      )}

      {/* Executive Financial Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Quoted Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Quoted Selling Price (Excl. VAT)
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            AED {totalRevenueAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Avg Selling Rate:</span>
            <span className="font-mono font-bold text-slate-700">AED {overallRevenuePerSqm.toFixed(2)} / m²</span>
          </div>
        </div>

        {/* Card 2: Total Estimated Cost */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Estimated Cost
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-900">
            AED {totalCostAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Avg Cost Rate:</span>
            <span className="font-mono font-bold text-blue-800">AED {overallCostPerSqm.toFixed(2)} / m²</span>
          </div>
        </div>

        {/* Card 3: Gross Profit */}
        <div
          className={`border rounded-xl p-5 shadow-2xs ${
            totalGrossProfitAED >= 0
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-red-50/70 border-red-300'
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
              totalGrossProfitAED >= 0 ? 'text-emerald-800' : 'text-red-800'
            }`}
          >
            Gross Profit (Margin AED)
          </span>
          <div
            className={`text-xl sm:text-2xl font-black font-mono ${
              totalGrossProfitAED >= 0 ? 'text-emerald-950' : 'text-red-950'
            }`}
          >
            AED {totalGrossProfitAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs mt-1 flex items-center justify-between text-slate-600">
            <span>Profit / m²:</span>
            <span className="font-mono font-bold">
              AED {(grandTotalSqm > 0 ? totalGrossProfitAED / grandTotalSqm : 0).toFixed(2)} / m²
            </span>
          </div>
        </div>

        {/* Card 4: Margin % & Markup */}
        <div
          className={`border rounded-xl p-5 shadow-2xs ${
            overallMarginPercent >= 25
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : overallMarginPercent >= 15
              ? 'bg-amber-50/70 border-amber-300 text-amber-950'
              : 'bg-rose-50/70 border-rose-300 text-rose-950'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-80">
            Gross Margin & Markup
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono">
              {overallMarginPercent.toFixed(1)}%
            </span>
            <span className="text-xs font-semibold opacity-75">Margin</span>
          </div>
          <div className="text-xs mt-1 flex items-center justify-between opacity-85">
            <span>Markup on Cost:</span>
            <span className="font-mono font-bold">{overallMarkupPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Cost Component Breakdown Progress / Summary Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
          <span>Cost Element Breakdown</span>
          <span className="text-slate-400 font-normal">
            Total Direct: AED {totalDirectCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })} + Overheads: AED {(factoryOverheadAED + rates.transportOverheadAED).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Raw Glass Substrate</span>
            <span className="font-mono font-bold text-sm text-slate-900 block">
              AED {totalRawGlassCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalCostAED > 0 ? ((totalRawGlassCost / totalCostAED) * 100).toFixed(0) : 0}% of cost
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Edge Polishing</span>
            <span className="font-mono font-bold text-sm text-slate-900 block">
              AED {totalEdgingCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalCostAED > 0 ? ((totalEdgingCost / totalCostAED) * 100).toFixed(0) : 0}% of cost
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Tempering / Kiln</span>
            <span className="font-mono font-bold text-sm text-slate-900 block">
              AED {totalTemperingCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalCostAED > 0 ? ((totalTemperingCost / totalCostAED) * 100).toFixed(0) : 0}% of cost
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">DGU / Lamination</span>
            <span className="font-mono font-bold text-sm text-slate-900 block">
              AED {totalSpecialProcessingCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalCostAED > 0 ? ((totalSpecialProcessingCost / totalCostAED) * 100).toFixed(0) : 0}% of cost
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Consumables & Packing</span>
            <span className="font-mono font-bold text-sm text-slate-900 block">
              AED {totalConsumablesCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalCostAED > 0 ? ((totalConsumablesCost / totalCostAED) * 100).toFixed(0) : 0}% of cost
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Logistics & Overhead</span>
            <span className="font-mono font-bold text-sm text-slate-900 block">
              AED {(factoryOverheadAED + rates.transportOverheadAED).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalCostAED > 0 ? (((factoryOverheadAED + rates.transportOverheadAED) / totalCostAED) * 100).toFixed(0) : 0}% of cost
            </span>
          </div>
        </div>
      </div>

      {/* Section-by-Section Cost Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="bg-slate-50/80 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#7B1818]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Section Profitability Breakdown ({quotation.glassSections.length} Sections)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Click any section row to expand itemized dimensions & costs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                <th className="py-2.5 px-4 w-12 text-center"></th>
                <th className="py-2.5 px-3 w-24">Section</th>
                <th className="py-2.5 px-4">Glass Specification</th>
                <th className="py-2.5 px-3 text-right w-20">Qty</th>
                <th className="py-2.5 px-3 text-right w-24">Area (m²)</th>
                <th className="py-2.5 px-3 text-right w-28">Raw Cost</th>
                <th className="py-2.5 px-3 text-right w-28">Edging</th>
                <th className="py-2.5 px-3 text-right w-28">Processing</th>
                <th className="py-2.5 px-3 text-right w-28 font-extrabold text-blue-950">Total Cost</th>
                <th className="py-2.5 px-3 text-right w-28 font-extrabold text-slate-900">Quoted AED</th>
                <th className="py-2.5 px-3 text-right w-28 font-bold text-emerald-950">Profit (AED)</th>
                <th className="py-2.5 px-4 text-center w-24">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sectionCostBreakdowns.map((sec) => {
                const isExpanded = !!expandedSections[sec.sectionId];

                return (
                  <React.Fragment key={sec.sectionId}>
                    <tr
                      onClick={() => toggleSectionExpand(sec.sectionId)}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        sec.marginPercent < 15
                          ? 'bg-rose-50/20'
                          : sec.marginPercent >= 30
                          ? 'bg-emerald-50/10'
                          : ''
                      }`}
                    >
                      {/* Expand Toggle Chevron */}
                      <td className="py-3 px-4 text-center text-slate-400">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </td>

                      {/* Code */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {sec.sectionCode}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{sec.description}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Substrate: AED {sec.rawRate}/m² • Perimeter: {sec.totalPerimeterMeters.toFixed(1)}m
                          {sec.requiresTempering && ' • Toughened'}
                          {sec.isDgu && ' • DGU'}
                          {sec.isLaminated && ' • Laminated'}
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {sec.totalQty.toLocaleString()}
                      </td>

                      {/* Area */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                        {sec.totalSqm.toFixed(2)}
                      </td>

                      {/* Raw Substrate Cost */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {sec.totalRawCost.toFixed(2)}
                      </td>

                      {/* Edging */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {sec.edgingCost.toFixed(2)}
                      </td>

                      {/* Processing / Tempering */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {(sec.temperingCost + sec.specialProcessingCost + sec.consumablesCost).toFixed(2)}
                      </td>

                      {/* Total Cost */}
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-900 bg-blue-50/40">
                        {sec.directCost.toFixed(2)}
                      </td>

                      {/* Quoted Amount */}
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        {sec.sellingPrice.toFixed(2)}
                      </td>

                      {/* Profit */}
                      <td
                        className={`py-3 px-3 text-right font-mono font-extrabold ${
                          sec.grossProfit >= 0 ? 'text-emerald-900' : 'text-red-900'
                        }`}
                      >
                        {sec.grossProfit.toFixed(2)}
                      </td>

                      {/* Margin % badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-xs font-bold ${
                            sec.marginPercent >= 30
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                              : sec.marginPercent >= 15
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : 'bg-rose-100 text-rose-950 border border-rose-300'
                          }`}
                        >
                          {sec.marginPercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>

                    {/* Expandable item rows for this section */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-y border-slate-200">
                        <td colSpan={12} className="py-3 px-6">
                          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-600 mb-2">
                              Piece-Level Details for {sec.sectionCode} ({sec.items.length} Sizes)
                            </div>
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-400 font-bold">
                                  <th className="py-1 px-2">S.No</th>
                                  <th className="py-1 px-3">Item Code</th>
                                  <th className="py-1 px-2 text-right">Qty</th>
                                  <th className="py-1 px-3 text-right">Width (mm)</th>
                                  <th className="py-1 px-3 text-right">Height (mm)</th>
                                  <th className="py-1 px-3 text-right">Area (m²)</th>
                                  <th className="py-1 px-3 text-right">Perimeter (m)</th>
                                  <th className="py-1 px-3 text-right font-bold text-blue-900">Est. Cost (AED)</th>
                                  <th className="py-1 px-3 text-right font-bold text-slate-800">Quoted (AED)</th>
                                  <th className="py-1 px-3 text-right font-bold text-emerald-800">Profit (AED)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                {sec.items.map((it, iIdx) => (
                                  <tr key={it.id || iIdx} className="hover:bg-slate-50">
                                    <td className="py-1.5 px-2 text-slate-400">{it.sNo || iIdx + 1}</td>
                                    <td className="py-1.5 px-3 font-semibold text-slate-800">{it.code || '-'}</td>
                                    <td className="py-1.5 px-2 text-right font-bold">{it.qty}</td>
                                    <td className="py-1.5 px-3 text-right">{it.width}</td>
                                    <td className="py-1.5 px-3 text-right">{it.height}</td>
                                    <td className="py-1.5 px-3 text-right">{it.totalSqm.toFixed(2)}</td>
                                    <td className="py-1.5 px-3 text-right">{it.itemTotalPerimeter.toFixed(2)}</td>
                                    <td className="py-1.5 px-3 text-right text-blue-900 font-bold">{it.itemCost.toFixed(2)}</td>
                                    <td className="py-1.5 px-3 text-right text-slate-800">{it.itemSellingPrice.toFixed(2)}</td>
                                    <td className="py-1.5 px-3 text-right text-emerald-800 font-bold">{it.itemProfit.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            {/* Table Grand Totals Footer */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
              <tr>
                <td></td>
                <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-slate-800 font-sans">
                  Total Direct Production
                </td>
                <td className="py-3 px-3 text-right">{grandTotalQty.toLocaleString()}</td>
                <td className="py-3 px-3 text-right">{grandTotalSqm.toFixed(2)}</td>
                <td className="py-3 px-3 text-right">{totalRawGlassCost.toFixed(2)}</td>
                <td className="py-3 px-3 text-right">{totalEdgingCost.toFixed(2)}</td>
                <td className="py-3 px-3 text-right">{(totalTemperingCost + totalSpecialProcessingCost + totalConsumablesCost).toFixed(2)}</td>
                <td className="py-3 px-3 text-right text-blue-950 font-black">{totalDirectCosts.toFixed(2)}</td>
                <td className="py-3 px-3 text-right text-slate-950 font-black">{totalRevenueAED.toFixed(2)}</td>
                <td className="py-3 px-3 text-right text-emerald-950 font-black">{totalGrossProfitAED.toFixed(2)}</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full font-mono text-xs font-black bg-slate-900 text-white">
                    {overallMarginPercent.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Internal Estimation Signatures (Visible on Print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs print:border print:border-slate-300">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 pb-2 border-b border-slate-200">
          Internal Estimation Approvals
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Estimated By (Estimation Eng.)
            </span>
            <div className="h-12 border-b border-dashed border-slate-300 mb-2"></div>
            <div className="text-slate-800 font-semibold">Sign & Date:</div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Sales Rep Assigned
            </span>
            <div className="h-12 border-b border-dashed border-slate-300 mb-2 flex items-end pb-1 font-semibold text-amber-900">
              {quotation.salesmanName || 'Not Assigned'}
            </div>
            <div className="text-slate-800 font-semibold">Sign & Date:</div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Approved By (Operations / GM)
            </span>
            <div className="h-12 border-b border-dashed border-slate-300 mb-2"></div>
            <div className="text-slate-800 font-semibold">Sign & Date:</div>
          </div>
        </div>
      </div>
    </div>
  );
};
