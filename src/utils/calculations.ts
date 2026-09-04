import { GlassItem, GlassSection, Quotation } from '../types';

/**
 * Calculates per-piece area in square meters.
 * Width and height are in millimeters.
 * Standard formula: (width * height) / 1,000,000
 * In glass manufacturing (and per quotation terms: "Minimum invoicing area is 0.50 Sq Mt"):
 * If applyMinRule is true, minimum area is 0.50 Sq Mt.
 */
export function calculatePerSqm(
  widthMm: number,
  heightMm: number,
  applyMinRule: boolean = true,
  minThreshold: number = 0.50
): number {
  if (!widthMm || !heightMm || widthMm <= 0 || heightMm <= 0) {
    return 0;
  }
  const rawSqm = (widthMm * heightMm) / 1_000_000;
  const rounded = Number(rawSqm.toFixed(2));
  
  if (applyMinRule) {
    return Number(Math.max(minThreshold, rounded).toFixed(2));
  }
  return rounded;
}

export function calculateTotalSqm(qty: number, perSqm: number): number {
  if (!qty || !perSqm || qty <= 0 || perSqm <= 0) {
    return 0;
  }
  return Number((qty * perSqm).toFixed(2));
}

export function calculateSectionTotals(section: GlassSection): {
  totalQty: number;
  totalSqm: number;
  effectiveAmount: number;
} {
  const totalQty = section.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalSqm = Number(
    section.items.reduce((sum, item) => sum + (Number(item.totalSqm) || 0), 0).toFixed(2)
  );

  let effectiveAmount = Number(section.sectionAmount) || 0;
  if (section.useCalculatedAmount && section.ratePerSqm && section.ratePerSqm > 0) {
    effectiveAmount = Number((totalSqm * section.ratePerSqm).toFixed(2));
  }

  return { totalQty, totalSqm, effectiveAmount };
}

export function calculateQuotationTotals(quotation: Quotation): {
  grandTotalQty: number;
  grandTotalSqm: number;
  totalAmountAED: number;
  vatAmountAED: number;
  totalWithVatAED: number;
} {
  let grandTotalQty = 0;
  let grandTotalSqm = 0;
  let totalAmountAED = 0;

  quotation.glassSections.forEach(sec => {
    const { totalQty, totalSqm, effectiveAmount } = calculateSectionTotals(sec);
    grandTotalQty += totalQty;
    grandTotalSqm += totalSqm;
    totalAmountAED += effectiveAmount;
  });

  if (quotation.status === 'confirmed' && typeof quotation.confirmedTotalAmount === 'number') {
    totalAmountAED = quotation.confirmedTotalAmount;
  }
  if (quotation.status === 'confirmed' && typeof quotation.confirmedQty === 'number') {
    grandTotalQty = quotation.confirmedQty;
  }

  grandTotalSqm = Number(grandTotalSqm.toFixed(2));
  totalAmountAED = Number(totalAmountAED.toFixed(2));

  const vatPercent = quotation.vatRatePercent ?? 5;
  const vatAmountAED = Number(((totalAmountAED * vatPercent) / 100).toFixed(2));
  const totalWithVatAED = Number((totalAmountAED + vatAmountAED).toFixed(2));

  return {
    grandTotalQty,
    grandTotalSqm,
    totalAmountAED,
    vatAmountAED,
    totalWithVatAED
  };
}
