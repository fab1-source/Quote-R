import { GlassItem } from '../types';
import { calculatePerSqm, calculateTotalSqm } from './calculations';

export interface ParseExcelResult {
  items: GlassItem[];
  rowCount: number;
  warnings: string[];
}

/**
 * Parses raw text copied directly from Excel or Google Sheets.
 * Supported formats:
 * - 5 columns: S.No, Code, Qty, Width, Height
 * - 4 columns: S.No, Qty, Width, Height OR Code, Qty, Width, Height
 * - 3 columns: Qty, Width, Height
 */
export function parseExcelData(
  rawText: string,
  startSNo: number = 1,
  applyMinRule: boolean = true,
  minThreshold: number = 0.50
): ParseExcelResult {
  const warnings: string[] = [];
  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return { items: [], rowCount: 0, warnings: ['No data found in clipboard.'] };
  }

  // Detect delimiter: tab is most common in Excel clipboard
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t')
    ? '\t'
    : firstLine.includes(',')
    ? ','
    : firstLine.includes(';')
    ? ';'
    : /\s{2,}/; // multiple spaces

  let dataLines = lines;

  // Check if line 0 is a header row
  const firstTokens = firstLine.split(delimiter).map(t => t.trim().toLowerCase());
  const headerKeywords = ['s.no', 'sno', 'sn', 's.n', 'code', 'qty', 'quantity', 'width', 'w', 'height', 'h', 'rate', 'sqm'];
  const hasHeaderKeyword = firstTokens.some(tok => headerKeywords.includes(tok));
  
  if (hasHeaderKeyword) {
    dataLines = lines.slice(1);
  }

  const items: GlassItem[] = [];
  let currentSNo = startSNo;

  dataLines.forEach((line, lineIdx) => {
    // Split by delimiter
    const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) return; // skip junk lines

    let sNo: string | number = currentSNo;
    let code = '';
    let qty = 0;
    let width = 0;
    let height = 0;

    const numCols = cols.length;

    if (numCols >= 5) {
      // S.No, Code, Qty, Width, Height, (optional Rate/Sqm...)
      const parsedSNo = parseInt(cols[0], 10);
      sNo = isNaN(parsedSNo) ? cols[0] || currentSNo : parsedSNo;
      code = cols[1] || '';
      qty = Math.max(0, parseInt(cols[2].replace(/,/g, ''), 10) || 0);
      width = Math.max(0, parseFloat(cols[3].replace(/,/g, '')) || 0);
      height = Math.max(0, parseFloat(cols[4].replace(/,/g, '')) || 0);
    } else if (numCols === 4) {
      // Could be: S.No, Qty, Width, Height OR Code, Qty, Width, Height
      const firstIsNumeric = !isNaN(Number(cols[0])) && Number(cols[0]) > 0;
      const secondIsNumeric = !isNaN(Number(cols[1])) && Number(cols[1]) > 0;
      
      if (firstIsNumeric && secondIsNumeric) {
        // likely S.No, Qty, Width, Height
        sNo = parseInt(cols[0], 10);
        code = '';
        qty = Math.max(0, parseInt(cols[1].replace(/,/g, ''), 10) || 0);
        width = Math.max(0, parseFloat(cols[2].replace(/,/g, '')) || 0);
        height = Math.max(0, parseFloat(cols[3].replace(/,/g, '')) || 0);
      } else {
        // Code, Qty, Width, Height
        sNo = currentSNo;
        code = cols[0];
        qty = Math.max(0, parseInt(cols[1].replace(/,/g, ''), 10) || 0);
        width = Math.max(0, parseFloat(cols[2].replace(/,/g, '')) || 0);
        height = Math.max(0, parseFloat(cols[3].replace(/,/g, '')) || 0);
      }
    } else if (numCols === 3) {
      // Qty, Width, Height
      sNo = currentSNo;
      code = '';
      qty = Math.max(0, parseInt(cols[0].replace(/,/g, ''), 10) || 0);
      width = Math.max(0, parseFloat(cols[1].replace(/,/g, '')) || 0);
      height = Math.max(0, parseFloat(cols[2].replace(/,/g, '')) || 0);
    }

    if (width > 0 && height > 0) {
      const perSqm = calculatePerSqm(width, height, applyMinRule, minThreshold);
      const totalSqm = calculateTotalSqm(qty, perSqm);

      items.push({
        id: `item-${Date.now()}-${lineIdx}-${Math.random().toString(36).substr(2, 4)}`,
        sNo,
        code,
        qty,
        width,
        height,
        perSqm,
        totalSqm
      });

      currentSNo++;
    } else {
      warnings.push(`Row ${lineIdx + 1} skipped: invalid width (${cols[numCols >= 5 ? 3 : 2]}) or height (${cols[numCols >= 5 ? 4 : 3]}).`);
    }
  });

  return {
    items,
    rowCount: items.length,
    warnings
  };
}
