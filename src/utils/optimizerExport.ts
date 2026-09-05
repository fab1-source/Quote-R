import * as XLSX from 'xlsx';
import { Quotation } from '../types';
import { calculatePerSqm } from './calculations';

export interface OptimizerRow {
  tag: string;
  section: string;
  glassType: string;
  widthMm: number;
  heightMm: number;
  qty: number;
  sqmPerPc: number;
  totalSqm: number;
  remarks: string;
}

/**
 * Extracts all cutting items from all glass sections of a quotation.
 */
export function extractOptimizerItems(quotation: Quotation): OptimizerRow[] {
  const rows: OptimizerRow[] = [];
  let itemCounter = 1;

  quotation.glassSections.forEach((section, sIdx) => {
    const sectionName = section.sectionCode || `Glass -${String(sIdx + 1).padStart(2, '0')}`;
    const glassType = section.description || sectionName;

    section.items.forEach((item) => {
      const width = item.width || 0;
      const height = item.height || 0;
      const qty = item.qty || 0;
      if (width <= 0 || height <= 0 || qty <= 0) return;

      const area = item.perSqm || calculatePerSqm(width, height, quotation.applyMinAreaRule, quotation.minAreaThreshold);
      const totalArea = item.totalSqm || (area * qty);

      const tag = (item as any).tag || item.code || `ITEM-${String(itemCounter).padStart(3, '0')}`;
      const remarks = (item as any).remarks || (item.code ? `Ref: ${item.code}` : '');

      rows.push({
        tag,
        section: sectionName,
        glassType,
        widthMm: width,
        heightMm: height,
        qty,
        sqmPerPc: Number(area.toFixed(3)),
        totalSqm: Number(totalArea.toFixed(3)),
        remarks,
      });

      itemCounter++;
    });
  });

  return rows;
}

/**
 * Copies sizes to clipboard formatted for quick paste into Excel or sheet optimizer software.
 * Standard format: Width(mm) [TAB] Height(mm) [TAB] Qty [TAB] Tag/Item [TAB] Glass Type [TAB] Remarks
 */
export async function copySizesToClipboard(quotation: Quotation): Promise<{ count: number; totalPcs: number }> {
  const items = extractOptimizerItems(quotation);
  if (items.length === 0) {
    throw new Error('No valid cutting sizes found in this job card.');
  }

  // Header row + data rows separated by tabs and newlines
  const headers = ['Tag / Item', 'Width (mm)', 'Height (mm)', 'Qty', 'Glass Type', 'Section', 'Remarks'];
  const dataRows = items.map((row) => [
    row.tag,
    row.widthMm,
    row.heightMm,
    row.qty,
    row.glassType,
    row.section,
    row.remarks,
  ]);

  const tsvText = [
    headers.join('\t'),
    ...dataRows.map((r) => r.join('\t')),
  ].join('\n');

  await navigator.clipboard.writeText(tsvText);
  const totalPcs = items.reduce((acc, r) => acc + r.qty, 0);
  return { count: items.length, totalPcs };
}

/**
 * Exports the Job Card cutting sizes into a rich Microsoft Excel (.xlsx) file.
 */
export function exportJobCardToExcel(quotation: Quotation): void {
  const items = extractOptimizerItems(quotation);
  const refNo = quotation.from?.refNo || 'JobCard';
  const clientName = quotation.client?.name || 'Interglass';
  const cleanRef = refNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanClient = clientName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `JobCard_${cleanRef}_Optimizer_Sizes.xlsx`;

  const wb = XLSX.utils.book_new();

  // 1. SHEET 1: Cutting Sizes for Optimizer
  const optimizerData: any[][] = [
    ['INTERGLASS CO LLC - FACTORY CUTTING SIZES FOR OPTIMIZER'],
    [`Job Card Ref: ${refNo}`, '', `Client: ${clientName}`, '', `Date: ${quotation.from?.dated || ''}`],
    [`Salesman: ${quotation.salesmanName || 'N/A'}`, '', `Delivery: ${quotation.committedDeliveryDate || 'N/A'}`],
    [], // empty line
    ['Tag / Item', 'Width (mm)', 'Height (mm)', 'Qty (Pcs)', 'Glass Type / Specification', 'Section', 'Area (m²/pc)', 'Total Area (m²)', 'Remarks / Processes'],
  ];

  let totalPcs = 0;
  let totalSqm = 0;

  items.forEach((item) => {
    totalPcs += item.qty;
    totalSqm += item.totalSqm;
    optimizerData.push([
      item.tag,
      item.widthMm,
      item.heightMm,
      item.qty,
      item.glassType,
      item.section,
      item.sqmPerPc,
      item.totalSqm,
      item.remarks,
    ]);
  });

  // Total summary row
  optimizerData.push([]);
  optimizerData.push(['TOTAL', '', '', totalPcs, '', '', '', Number(totalSqm.toFixed(3)), '']);

  const wsSizes = XLSX.utils.aoa_to_sheet(optimizerData);

  // Set column widths
  wsSizes['!cols'] = [
    { wch: 15 }, // Tag
    { wch: 14 }, // Width
    { wch: 14 }, // Height
    { wch: 12 }, // Qty
    { wch: 32 }, // Glass Type
    { wch: 25 }, // Section
    { wch: 14 }, // Area
    { wch: 15 }, // Total Area
    { wch: 28 }, // Remarks
  ];

  XLSX.utils.book_append_sheet(wb, wsSizes, 'Optimizer Sizes');

  // 2. SHEET 2: Clean Simplified Table (Width, Height, Qty, Glass) for 1-click import into cutting software
  const simplifiedData: any[][] = [
    ['WIDTH_MM', 'HEIGHT_MM', 'QTY', 'DESCRIPTION', 'TAG', 'PROCESS'],
  ];

  items.forEach((item) => {
    simplifiedData.push([
      item.widthMm,
      item.heightMm,
      item.qty,
      item.glassType,
      item.tag,
      item.remarks,
    ]);
  });

  const wsSimple = XLSX.utils.aoa_to_sheet(simplifiedData);
  wsSimple['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 35 },
    { wch: 16 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSimple, 'Direct_Optimizer_Import');

  // Write file
  XLSX.writeFile(wb, fileName);
}
