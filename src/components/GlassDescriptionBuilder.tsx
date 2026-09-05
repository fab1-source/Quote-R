import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Check,
  RotateCcw,
  Plus,
  ArrowRight,
  Shield,
  Square,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export type GlassCategoryType = 'single' | 'double' | 'triple' | 'laminated' | 'mirror';

// Constants from the Interglass Master Glass Sheet
export const GLASS_THICKNESSES = ['4mm', '5mm', '6mm', '8mm', '10mm', '12mm', '15mm', '19mm'];
export const GLASS_SUPPLIERS = ['Classic', 'Vitralite', 'China', 'Guardian'];
export const GLASS_COLORS = [
  'Clear',
  'Green',
  'Bronze',
  'Blue',
  'Grey',
  'Blue Green',
  'Ultra Clear',
  'Reeded',
  'Ramly',
  'Wire Glass',
  'Wire Ramly'
];
export const GLASS_FINISHES = ['Tinted', 'Reflective', 'Sandblasted'];
export const GLASS_STATES = ['Tempered', 'Annealed'];

// Mirror Options from Master Sheet
export const MIRROR_THICKNESSES = ['6mm', '8mm'];
export const MIRROR_SUPPLIERS = ['Guardian', 'China', 'Belgium'];
export const MIRROR_COLORS = ['Silver Mirror', 'Bronze Mirror', 'Grey Mirror', 'Ultra Clear Mirror'];
export const MIRROR_SERVICES = [
  'Polished',
  'Arised',
  '10mm Bevelled',
  '15mm Bevelled',
  '20mm Bevelled',
  '25mm Bevelled',
  '30mm Bevelled',
  'Annealed'
];

// Spacers from Master Sheet
export const SPACER_SIZES = ['6mm', '8mm', '10mm', '12mm', '14mm', '16mm', '18mm', '20mm', '22mm', '24mm'];
export const SPACER_TYPES = ['Asp', 'Air spacer', 'Argon', 'Warm edge'];

// Lamination PVB or EVA thickness from Master Sheet
export const LAMINATION_THICKNESSES = ['0.38', '0.76', '1.52'];
export const LAMINATION_INTERLAYERS = ['PVB', 'EVA'];

// Services from Master Sheet
export const SERVICES_LIST = [
  'Edge Polished',
  'Holes',
  'Notching',
  'Sandblasting',
  'Overlap',
  'U-Insert',
  'Design sandblasted',
  'Strip sandblasted'
];

export interface GlassPaneConfig {
  thickness: string;
  supplier?: string;
  color: string;
  finish?: string;
  state?: string;
}

interface GlassDescriptionBuilderProps {
  currentDescription: string;
  onApplyDescription: (desc: string) => void;
  readOnly?: boolean;
}

export const GlassDescriptionBuilder: React.FC<GlassDescriptionBuilderProps> = ({
  currentDescription,
  onApplyDescription,
  readOnly = false,
}) => {
  const [activeType, setActiveType] = useState<GlassCategoryType>('single');

  // Glass Pane 1 (Outer)
  const [pane1, setPane1] = useState<GlassPaneConfig>({
    thickness: '6mm',
    supplier: '',
    color: 'Clear',
    finish: '',
    state: 'Annealed',
  });

  // Glass Pane 2 (Inner for DGU / Laminated, Middle for Triple)
  const [pane2, setPane2] = useState<GlassPaneConfig>({
    thickness: '6mm',
    supplier: '',
    color: 'Clear',
    finish: '',
    state: 'Tempered',
  });

  // Glass Pane 3 (Inner for Triple Glazed)
  const [pane3, setPane3] = useState<GlassPaneConfig>({
    thickness: '6mm',
    supplier: '',
    color: 'Clear',
    finish: '',
    state: 'Tempered',
  });

  // Spacers
  const [spacer1, setSpacer1] = useState<string>('12mm');
  const [spacerType, setSpacerType] = useState<string>('Asp');
  const [spacer2, setSpacer2] = useState<string>('12mm');

  // Lamination
  const [lamThickness, setLamThickness] = useState<string>('1.52');
  const [lamInterlayer, setLamInterlayer] = useState<string>('PVB');

  // Mirror
  const [mirrorThickness, setMirrorThickness] = useState<string>('6mm');
  const [mirrorSupplier, setMirrorSupplier] = useState<string>('Belgium');
  const [mirrorColor, setMirrorColor] = useState<string>('Silver Mirror');
  const [mirrorService, setMirrorService] = useState<string>('25mm Bevelled');

  // Selected Services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [includePrefix, setIncludePrefix] = useState<boolean>(true);
  const [autoApply, setAutoApply] = useState<boolean>(true);

  // Helper to format a single pane
  const formatPane = (p: GlassPaneConfig): string => {
    const parts: string[] = [];
    if (p.thickness) parts.push(p.thickness);
    if (p.supplier) parts.push(p.supplier);
    if (p.color) parts.push(p.color);
    if (p.finish) parts.push(p.finish);
    if (p.state) parts.push(p.state);
    return parts.join(' ');
  };

  // Helper to extract numeric thickness
  const parseNum = (val: string): number => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  // Helper to format services list with "and" / commas
  const formatServicesString = (services: string[]): string => {
    if (services.length === 0) return '';
    if (services.length === 1) return ` with ${services[0]}`;
    if (services.length === 2) return ` with ${services[0]} and ${services[1]}`;
    const allButLast = services.slice(0, -1).join(', ');
    return ` with ${allButLast} and ${services[services.length - 1]}`;
  };

  // Generate complete description based on user's exact patterns
  const generatedDescription = useMemo(() => {
    const prefix = includePrefix ? 'Supply of ' : '';
    const servicesStr = formatServicesString(selectedServices);

    if (activeType === 'single') {
      const paneStr = formatPane(pane1);
      return `${prefix}${paneStr}${servicesStr}`.trim();
    }

    if (activeType === 'double') {
      const t1 = parseNum(pane1.thickness);
      const sp = parseNum(spacer1);
      const t2 = parseNum(pane2.thickness);
      const totalThickness = t1 + sp + t2;
      const spacerDesc = `${spacer1} ${spacerType}`.trim();
      const pane1Str = formatPane(pane1);
      const pane2Str = formatPane(pane2);

      return `${prefix}${totalThickness}mm DGU consist of ${pane1Str} + ${spacerDesc} + ${pane2Str}${servicesStr}`.trim();
    }

    if (activeType === 'triple') {
      const t1 = parseNum(pane1.thickness);
      const sp1 = parseNum(spacer1);
      const t2 = parseNum(pane2.thickness);
      const sp2 = parseNum(spacer2);
      const t3 = parseNum(pane3.thickness);
      const totalThickness = t1 + sp1 + t2 + sp2 + t3;
      const spacer1Desc = `${spacer1} ${spacerType}`.trim();
      const spacer2Desc = `${spacer2} ${spacerType}`.trim();

      const pane1Str = formatPane(pane1);
      const pane2Str = formatPane(pane2);
      const pane3Str = formatPane(pane3);

      return `${prefix}${totalThickness}mm Triple Glazed consist of ${pane1Str} + ${spacer1Desc} + ${pane2Str} + ${spacer2Desc} + ${pane3Str}${servicesStr}`.trim();
    }

    if (activeType === 'laminated') {
      const t1 = parseNum(pane1.thickness);
      const lam = parseNum(lamThickness);
      const t2 = parseNum(pane2.thickness);
      const totalThickness = (t1 + lam + t2).toFixed(2).replace(/\.00$/, '');
      const lamDesc = `${lamThickness}mm ${lamInterlayer}`.trim();

      const pane1Str = formatPane(pane1);
      const pane2Str = formatPane(pane2);

      return `${prefix}${totalThickness}mm Laminated Glass consist of ${pane1Str} + ${lamDesc} + ${pane2Str}${servicesStr}`.trim();
    }

    if (activeType === 'mirror') {
      const parts: string[] = [mirrorThickness];
      if (mirrorSupplier) parts.push(mirrorSupplier);
      if (mirrorColor) parts.push(mirrorColor);
      let mirrorDesc = parts.join(' ');
      if (mirrorService) {
        mirrorDesc += ` with ${mirrorService}`;
      }
      return `${prefix}${mirrorDesc}${servicesStr}`.trim();
    }

    return '';
  }, [
    activeType,
    pane1,
    pane2,
    pane3,
    spacer1,
    spacerType,
    spacer2,
    lamThickness,
    lamInterlayer,
    mirrorThickness,
    mirrorSupplier,
    mirrorColor,
    mirrorService,
    selectedServices,
    includePrefix,
  ]);

  // Auto-apply when enabled
  useEffect(() => {
    if (autoApply && generatedDescription && !readOnly) {
      onApplyDescription(generatedDescription);
    }
  }, [generatedDescription, autoApply, readOnly]);

  const toggleService = (srv: string) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  // Quick preset loader
  const loadPreset = (
    type: GlassCategoryType,
    p1: Partial<GlassPaneConfig>,
    p2?: Partial<GlassPaneConfig>,
    sp?: string,
    services: string[] = []
  ) => {
    setActiveType(type);
    setPane1((prev) => ({ ...prev, ...p1 }));
    if (p2) setPane2((prev) => ({ ...prev, ...p2 }));
    if (sp) setSpacer1(sp);
    setSelectedServices(services);
  };

  return (
    <div className="mt-2.5 p-3.5 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-3.5 text-xs">
      {/* Category Tabs: Single Glass, Double Glazed (DGU), Triple Glazed, Laminated, Mirror */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveType('single')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeType === 'single'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Single Glass</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('double')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeType === 'double'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Double Glazed (DGU)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('triple')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeType === 'triple'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Triple Glazed</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('laminated')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeType === 'laminated'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Laminated</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('mirror')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeType === 'mirror'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mirror</span>
          </button>
        </div>

        {/* Prefix & Auto-Apply Toggles */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includePrefix}
              onChange={(e) => setIncludePrefix(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 border-slate-300"
            />
            <span>Include "Supply of"</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-emerald-800 font-medium">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 border-slate-300"
            />
            <span>Instant sync</span>
          </label>
        </div>
      </div>

      {/* QUICK PRESET CHIPS */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
          Quick Enquiries:
        </span>
        <button
          type="button"
          onClick={() =>
            loadPreset('single', { thickness: '10mm', color: 'Clear', state: 'Annealed', finish: '', supplier: '' })
          }
          className="px-2 py-0.5 rounded bg-white hover:bg-slate-200/70 border border-slate-200 text-[11px] text-slate-700 transition cursor-pointer"
        >
          10mm Clear Annealed
        </button>
        <button
          type="button"
          onClick={() =>
            loadPreset(
              'single',
              { thickness: '6mm', supplier: 'Classic', color: 'Grey', finish: 'Reflective', state: 'Tempered' },
              undefined,
              undefined,
              ['Edge Polished']
            )
          }
          className="px-2 py-0.5 rounded bg-white hover:bg-slate-200/70 border border-slate-200 text-[11px] text-slate-700 transition cursor-pointer"
        >
          6mm Classic Grey Reflective Tempered
        </button>
        <button
          type="button"
          onClick={() =>
            loadPreset(
              'double',
              { thickness: '6mm', supplier: 'Guardian', color: 'Blue', finish: 'Reflective', state: 'Tempered' },
              { thickness: '6mm', color: 'Clear', state: 'Tempered', supplier: '', finish: '' },
              '12mm'
            )
          }
          className="px-2 py-0.5 rounded bg-white hover:bg-slate-200/70 border border-slate-200 text-[11px] text-slate-700 transition cursor-pointer"
        >
          24mm DGU (Guardian Blue + 12mm Asp + Clear)
        </button>
        <button
          type="button"
          onClick={() =>
            loadPreset(
              'double',
              { thickness: '6mm', supplier: 'Guardian', color: 'Grey', finish: 'Reflective', state: 'Tempered' },
              { thickness: '6mm', color: 'Clear', state: 'Tempered', supplier: '', finish: '' },
              '12mm',
              ['Sandblasting', 'Overlap']
            )
          }
          className="px-2 py-0.5 rounded bg-white hover:bg-slate-200/70 border border-slate-200 text-[11px] text-slate-700 transition cursor-pointer"
        >
          24mm DGU with Sandblast & Overlap
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveType('laminated');
            setPane1({ thickness: '6mm', color: 'Clear', state: 'Tempered', supplier: '', finish: '' });
            setLamThickness('1.52');
            setLamInterlayer('PVB');
            setPane2({ thickness: '6mm', color: 'Clear', state: 'Tempered', supplier: '', finish: '' });
            setSelectedServices(['Edge Polished']);
          }}
          className="px-2 py-0.5 rounded bg-white hover:bg-slate-200/70 border border-slate-200 text-[11px] text-slate-700 transition cursor-pointer"
        >
          13.52mm Laminated (6+1.52 PVB+6)
        </button>
      </div>

      {/* OPTIONS MATRIX */}
      {activeType !== 'mirror' ? (
        <div className="space-y-3">
          {/* GLASS PANE 1 (Outer / Single) */}
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                  1
                </span>
                {activeType === 'single' ? 'Glass Specifications' : 'Outer Glass (Glass 1)'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                {formatPane(pane1) || 'Select Options'}
              </span>
            </div>

            {/* Thickness */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">
                Thickness:
              </span>
              {GLASS_THICKNESSES.map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => setPane1((p) => ({ ...p, thickness: th }))}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                    pane1.thickness === th
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {th}
                </button>
              ))}
            </div>

            {/* Supplier (Optional) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">
                Supplier:
              </span>
              <button
                type="button"
                onClick={() => setPane1((p) => ({ ...p, supplier: '' }))}
                className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                  !pane1.supplier ? 'bg-slate-700 text-white font-semibold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                None
              </button>
              {GLASS_SUPPLIERS.map((sup) => (
                <button
                  key={sup}
                  type="button"
                  onClick={() => setPane1((p) => ({ ...p, supplier: sup }))}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    pane1.supplier === sup
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {sup}
                </button>
              ))}
            </div>

            {/* Color */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">
                Color:
              </span>
              {GLASS_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setPane1((p) => ({ ...p, color: col }))}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    pane1.color === col
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>

            {/* Finish & State in one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              {/* Finish */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-14 shrink-0">
                  Finish:
                </span>
                <button
                  type="button"
                  onClick={() => setPane1((p) => ({ ...p, finish: '' }))}
                  className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                    !pane1.finish ? 'bg-slate-700 text-white font-semibold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  None
                </button>
                {GLASS_FINISHES.map((fn) => (
                  <button
                    key={fn}
                    type="button"
                    onClick={() => setPane1((p) => ({ ...p, finish: fn }))}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      pane1.finish === fn
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {fn}
                  </button>
                ))}
              </div>

              {/* State */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-14 shrink-0">
                  State:
                </span>
                <button
                  type="button"
                  onClick={() => setPane1((p) => ({ ...p, state: '' }))}
                  className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                    !pane1.state ? 'bg-slate-700 text-white font-semibold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  None
                </button>
                {GLASS_STATES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPane1((p) => ({ ...p, state: st }))}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      pane1.state === st
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DGU / TRIPLE SPACER 1 OR LAMINATION INTERLAYER */}
          {(activeType === 'double' || activeType === 'triple') && (
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-[10px]">
                    S
                  </span>
                  Spacer Between Panes {activeType === 'triple' ? '(Spacer 1)' : ''}
                </span>
                <span className="text-[10px] font-mono text-indigo-900 font-bold bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                  {spacer1} {spacerType}
                </span>
              </div>

              {/* Spacer Size */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-indigo-700 uppercase w-16 shrink-0">
                  Air Spacer:
                </span>
                {SPACER_SIZES.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpacer1(sp)}
                    className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                      spacer1 === sp
                        ? 'bg-indigo-700 text-white shadow-2xs'
                        : 'bg-white hover:bg-indigo-100 text-indigo-950 border border-indigo-200'
                    }`}
                  >
                    {sp}
                  </button>
                ))}
              </div>

              {/* Spacer Type */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-700 uppercase w-16 shrink-0">
                  Type:
                </span>
                {SPACER_TYPES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSpacerType(st)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      spacerType === st
                        ? 'bg-indigo-700 text-white font-bold shadow-2xs'
                        : 'bg-white hover:bg-indigo-100 text-indigo-950 border border-indigo-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LAMINATION INTERLAYER */}
          {activeType === 'laminated' && (
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  Lamination Interlayer
                </span>
                <span className="text-[10px] font-mono text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  {lamThickness}mm {lamInterlayer}
                </span>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase shrink-0">
                    Thickness:
                  </span>
                  {LAMINATION_THICKNESSES.map((lt) => (
                    <button
                      key={lt}
                      type="button"
                      onClick={() => setLamThickness(lt)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                        lamThickness === lt
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200'
                      }`}
                    >
                      {lt}mm
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase shrink-0">
                    Interlayer:
                  </span>
                  {LAMINATION_INTERLAYERS.map((li) => (
                    <button
                      key={li}
                      type="button"
                      onClick={() => setLamInterlayer(li)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        lamInterlayer === li
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200'
                      }`}
                    >
                      {li}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GLASS PANE 2 (Inner for DGU / Laminated, Middle for Triple) */}
          {(activeType === 'double' || activeType === 'triple' || activeType === 'laminated') && (
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  {activeType === 'triple' ? 'Middle Glass (Glass 2)' : 'Inner Glass (Glass 2)'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPane2({ ...pane1 })}
                    className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                  >
                    Copy Outer Glass
                  </button>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                    {formatPane(pane2) || 'Select Options'}
                  </span>
                </div>
              </div>

              {/* Thickness */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">
                  Thickness:
                </span>
                {GLASS_THICKNESSES.map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => setPane2((p) => ({ ...p, thickness: th }))}
                    className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                      pane2.thickness === th
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {th}
                  </button>
                ))}
              </div>

              {/* Color */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">
                  Color:
                </span>
                {GLASS_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setPane2((p) => ({ ...p, color: col }))}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      pane2.color === col
                        ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>

              {/* State & Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase w-14 shrink-0">
                    State:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPane2((p) => ({ ...p, state: '' }))}
                    className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                      !pane2.state ? 'bg-slate-700 text-white font-semibold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    None
                  </button>
                  {GLASS_STATES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPane2((p) => ({ ...p, state: st }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                        pane2.state === st
                          ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase w-14 shrink-0">
                    Supplier:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPane2((p) => ({ ...p, supplier: '' }))}
                    className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                      !pane2.supplier ? 'bg-slate-700 text-white font-semibold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    None
                  </button>
                  {GLASS_SUPPLIERS.map((sup) => (
                    <button
                      key={sup}
                      type="button"
                      onClick={() => setPane2((p) => ({ ...p, supplier: sup }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                        pane2.supplier === sup
                          ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {sup}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TRIPLE GLAZED 2nd SPACER AND 3rd PANE */}
          {activeType === 'triple' && (
            <>
              <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                    Spacer 2
                  </span>
                  <span className="text-[10px] font-mono text-purple-900 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                    {spacer2} {spacerType}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SPACER_SIZES.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSpacer2(sp)}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                        spacer2 === sp
                          ? 'bg-purple-700 text-white shadow-2xs'
                          : 'bg-white hover:bg-purple-100 text-purple-950 border border-purple-200'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              {/* PANE 3 */}
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    Inner Glass (Glass 3)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                    {formatPane(pane3)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {GLASS_THICKNESSES.map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => setPane3((p) => ({ ...p, thickness: th }))}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                        pane3.thickness === th
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* MIRROR CONFIGURATION PANEL */
        <div className="p-3 bg-white border border-amber-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Mirror Specifications (from Master Sheet)
            </span>
            <span className="text-[10px] font-mono text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              {mirrorThickness} {mirrorSupplier} {mirrorColor}
            </span>
          </div>

          {/* Thickness */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">
              Thickness:
            </span>
            {MIRROR_THICKNESSES.map((mt) => (
              <button
                key={mt}
                type="button"
                onClick={() => setMirrorThickness(mt)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                  mirrorThickness === mt
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {mt}
              </button>
            ))}
          </div>

          {/* Supplier */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">
              Supplier:
            </span>
            {MIRROR_SUPPLIERS.map((ms) => (
              <button
                key={ms}
                type="button"
                onClick={() => setMirrorSupplier(ms)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  mirrorSupplier === ms
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {ms}
              </button>
            ))}
          </div>

          {/* Color */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">
              Color:
            </span>
            {MIRROR_COLORS.map((mc) => (
              <button
                key={mc}
                type="button"
                onClick={() => setMirrorColor(mc)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  mirrorColor === mc
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {mc}
              </button>
            ))}
          </div>

          {/* Mirror Service / Edge */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">
              Edge / Finish:
            </span>
            {MIRROR_SERVICES.map((mserv) => (
              <button
                key={mserv}
                type="button"
                onClick={() => setMirrorService(mserv === mirrorService ? '' : mserv)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  mirrorService === mserv
                    ? 'bg-amber-700 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {mserv}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SERVICES GROUP (Multi-select) */}
      <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
            <span>Services Group</span>
            <span className="text-[10px] font-normal text-slate-400">(Click any to add/remove)</span>
          </span>
          {selectedServices.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedServices([])}
              className="text-[10px] text-red-600 hover:text-red-700 underline cursor-pointer"
            >
              Clear Services
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {SERVICES_LIST.map((srv) => {
            const isSelected = selectedServices.includes(srv);
            return (
              <button
                key={srv}
                type="button"
                onClick={() => toggleService(srv)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{srv}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIVE GENERATED DESCRIPTION PREVIEW & APPLICATION BAR */}
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-950 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span>Generated Description:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generatedDescription);
              }}
              className="text-[11px] text-blue-700 hover:text-blue-900 underline font-medium cursor-pointer flex items-center gap-1"
              title="Copy to clipboard"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        <div className="p-2.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-900 font-mono select-all shadow-2xs break-words">
          {generatedDescription || 'Select specifications above to generate description'}
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <div className="text-[11px] text-slate-500">
              {currentDescription === generatedDescription ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Synchronized with Description field
                </span>
              ) : (
                <span>Click button to update the description field</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onApplyDescription(generatedDescription)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Description</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const combined = currentDescription
                    ? `${currentDescription} + ${generatedDescription}`
                    : generatedDescription;
                  onApplyDescription(combined);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                title="Append to existing description text"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Append</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
