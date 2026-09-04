import React from 'react';
import { Quotation, GlassSection } from '../types';
import { InterglassLogo, InterglassLogoBanner } from './InterglassLogo';
import { calculateSectionTotals, calculateQuotationTotals } from '../utils/calculations';
import { convertNumberToWords } from '../utils/numberToWords';

interface QuotationDocumentProps {
  quotation: Quotation;
  isEditable?: boolean;
  onUpdateQuotation?: (updated: Quotation) => void;
  onOpenPasteModalForSection?: (section: GlassSection) => void;
}

export const QuotationDocument: React.FC<QuotationDocumentProps> = ({
  quotation,
  isEditable: initialIsEditable = false,
  onUpdateQuotation,
  onOpenPasteModalForSection,
}) => {
  const isCancelled = quotation.status === 'cancelled';
  const isConfirmed = quotation.status === 'confirmed';
  const isLocked = isCancelled || isConfirmed;
  const isEditable = initialIsEditable && !isLocked;

  const { grandTotalQty, grandTotalSqm, totalAmountAED, vatAmountAED, totalWithVatAED } =
    calculateQuotationTotals(quotation);

  const amountInWords = convertNumberToWords(totalWithVatAED);

  const updateClient = (field: keyof typeof quotation.client, val: string) => {
    if (!onUpdateQuotation) return;
    onUpdateQuotation({
      ...quotation,
      client: { ...quotation.client, [field]: val },
    });
  };

  const updateFrom = (field: keyof typeof quotation.from, val: string) => {
    if (!onUpdateQuotation) return;
    onUpdateQuotation({
      ...quotation,
      from: { ...quotation.from, [field]: val },
    });
  };

  const updateSection = (sectionId: string, updates: Partial<GlassSection>) => {
    if (!onUpdateQuotation) return;
    const newSections = quotation.glassSections.map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    onUpdateQuotation({
      ...quotation,
      glassSections: newSections,
    });
  };

  return (
    <div
      id="quotation-print-container"
      className="bg-white text-neutral-900 mx-auto font-sans text-[11px] leading-snug print:text-[10px] print:leading-tight shadow-lg print:shadow-none border-2 border-black p-4 sm:p-7 max-w-[960px] select-text"
      style={{ minHeight: '1050px' }}
    >
      {/* 1. Header: Official Interglass Logo Banner & Quotation Title */}
      <div className="pb-2.5 mb-2 border-b-[2px] border-black flex justify-center">
        <InterglassLogoBanner className="my-0.5" />
      </div>

      {/* Cancellation Notice Banner */}
      {isCancelled && (
        <div className="mb-3 bg-red-50 border-2 border-red-600 rounded p-2.5 text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:border-red-600 print:bg-red-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 bg-red-600 text-white rounded">
              CANCELLED
            </span>
            <span className="text-[11px] font-medium">
              This quotation is <strong>cancelled & void</strong>.
              {quotation.cancellationReason && (
                <span className="ml-1 text-red-800">
                  Reason: <span className="italic font-semibold underline">"{quotation.cancellationReason}"</span>
                </span>
              )}
            </span>
          </div>
          {quotation.cancelledAt && (
            <span className="text-[10px] text-red-700 font-mono">
              Cancelled: {new Date(quotation.cancelledAt).toLocaleDateString('en-GB')}
            </span>
          )}
        </div>
      )}

      {/* Confirmed Notice Banner */}
      {isConfirmed && (
        <div className="mb-3 bg-emerald-50 border-2 border-emerald-600 rounded p-2.5 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:border-emerald-600 print:bg-emerald-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 bg-emerald-700 text-white rounded">
              CONFIRMED ORDER
            </span>
            <span className="text-[11px] font-medium">
              This quotation has been <strong>confirmed</strong> and locked.
              {quotation.salesmanName && (
                <span className="ml-1 text-emerald-900">
                  Salesman / Order Assigned To: <span className="font-bold underline">{quotation.salesmanName}</span>
                </span>
              )}
            </span>
          </div>
          {quotation.confirmedAt && (
            <span className="text-[10px] text-emerald-800 font-mono font-semibold">
              Confirmed: {new Date(quotation.confirmedAt).toLocaleDateString('en-GB')}
            </span>
          )}
        </div>
      )}

      {/* 2. Side by Side To & From Tables */}
      <div className="grid grid-cols-2 gap-0 border-t border-l border-r border-black">
        {/* LEFT COLUMN: TO (Client) */}
        <div className="border-r border-black">
          <table className="w-full border-collapse text-[11px]">
            <tbody>
              <tr className="border-b border-black">
                <td className="w-24 font-bold px-2 py-1 bg-neutral-50/50 border-r border-black">To</td>
                <td className="px-2 py-1 font-semibold">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.client.name}
                      placeholder="Client Name"
                      onChange={(e) => updateClient('name', e.target.value)}
                      className="w-full font-semibold border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.client.name || '-'
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Emirate</td>
                <td className="px-2 py-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.client.emirate}
                      placeholder="e.g. Dubai"
                      onChange={(e) => updateClient('emirate', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.client.emirate || ''
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Tel</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-2">
                    {isEditable ? (
                      <input
                        type="text"
                        value={quotation.client.tel}
                        placeholder="Tel"
                        onChange={(e) => updateClient('tel', e.target.value)}
                        className="w-1/2 border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                      />
                    ) : (
                      <span>{quotation.client.tel}</span>
                    )}
                    <span className="font-medium">Fax:</span>
                    {isEditable ? (
                      <input
                        type="text"
                        value={quotation.client.fax}
                        placeholder="Fax"
                        onChange={(e) => updateClient('fax', e.target.value)}
                        className="w-1/2 border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                      />
                    ) : (
                      <span>{quotation.client.fax || '-'}</span>
                    )}
                  </div>
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Kind Attn:</td>
                <td className="px-2 py-1 font-semibold">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.client.kindAttn}
                      placeholder="e.g. Karishma"
                      onChange={(e) => updateClient('kindAttn', e.target.value)}
                      className="w-full font-semibold border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.client.kindAttn || '-'
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Contact No.</td>
                <td className="px-2 py-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.client.contactNo}
                      placeholder="Contact No"
                      onChange={(e) => updateClient('contactNo', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.client.contactNo || ''
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">E-Mail</td>
                <td className="px-2 py-1">
                  {isEditable ? (
                    <input
                      type="email"
                      value={quotation.client.email}
                      placeholder="Email"
                      onChange={(e) => updateClient('email', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.client.email || ''
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Ref</td>
                <td className="px-2 py-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.client.ref}
                      placeholder="Reference"
                      onChange={(e) => updateClient('ref', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.client.ref || ''
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">TRN</td>
                <td className="px-2 py-1 font-mono">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.client.trn}
                      placeholder="TRN Number"
                      onChange={(e) => updateClient('trn', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent font-mono"
                    />
                  ) : (
                    quotation.client.trn || ''
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RIGHT COLUMN: FROM (Inter Glass Co. LLC) */}
        <div>
          <table className="w-full border-collapse text-[11px]">
            <tbody>
              <tr className="border-b border-black">
                <td className="w-20 font-bold px-2 py-1 bg-neutral-50/50 border-r border-black">From</td>
                <td className="px-2 py-1 font-bold text-neutral-900">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.from.companyName}
                      onChange={(e) => updateFrom('companyName', e.target.value)}
                      className="w-full font-bold border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.from.companyName
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Ref No.</td>
                <td className="px-2 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono">{quotation.from.refNo}</span>
                    {isEditable ? (
                      <input
                        type="text"
                        value={quotation.from.rev}
                        onChange={(e) => updateFrom('rev', e.target.value)}
                        className="font-bold text-right border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent w-16"
                      />
                    ) : (
                      <span className="font-bold">{quotation.from.rev}</span>
                    )}
                  </div>
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Dated</td>
                <td className="px-2 py-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.from.dated}
                      onChange={(e) => updateFrom('dated', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.from.dated
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">E-Mail</td>
                <td className="px-2 py-1 text-blue-700">
                  {isEditable ? (
                    <input
                      type="email"
                      value={quotation.from.email}
                      onChange={(e) => updateFrom('email', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.from.email
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Contact</td>
                <td className="px-2 py-1 font-medium">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.from.contact}
                      onChange={(e) => updateFrom('contact', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.from.contact
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Tel</td>
                <td className="px-2 py-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.from.tel}
                      onChange={(e) => updateFrom('tel', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.from.tel
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">Fax</td>
                <td className="px-2 py-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.from.fax}
                      onChange={(e) => updateFrom('fax', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent"
                    />
                  ) : (
                    quotation.from.fax
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/50 border-r border-black">TRN</td>
                <td className="px-2 py-1 font-mono font-medium">
                  {isEditable ? (
                    <input
                      type="text"
                      value={quotation.from.trn}
                      onChange={(e) => updateFrom('trn', e.target.value)}
                      className="w-full border-b border-dashed border-neutral-300 focus:border-black outline-none bg-transparent font-mono"
                    />
                  ) : (
                    quotation.from.trn
                  )}
                </td>
              </tr>
              {quotation.salesmanName && (
                <tr className="border-b border-black bg-neutral-50/70">
                  <td className="font-medium px-2 py-1 bg-neutral-100 border-r border-black">Salesman</td>
                  <td className="px-2 py-1 font-bold text-neutral-900">
                    {quotation.salesmanName}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Description / Scope of Work banner */}
      <div className="border-l border-r border-b border-black bg-rose-50/70 px-2 py-1">
        <span className="font-bold text-[#8A1515] uppercase tracking-wide text-xs">
          Description/ Scope of Work
        </span>
      </div>

      {/* 4. Glass Sections */}
      <div className="space-y-4 my-2">
        {quotation.glassSections.map((section, sIdx) => {
          const { totalQty, totalSqm, effectiveAmount } = calculateSectionTotals(section);

          return (
            <div key={section.id} className="border border-black">
              {/* Glass Section Header */}
              <div className="flex border-b border-black bg-rose-100/50">
                <div className="w-24 border-r border-black px-2 py-1 font-bold text-center bg-rose-200/50 text-[#8A1515]">
                  {section.sectionCode}
                </div>
                <div className="flex-1 px-3 py-1 font-bold text-neutral-900 flex items-center justify-between">
                  {isEditable ? (
                    <input
                      type="text"
                      value={section.description}
                      onChange={(e) => updateSection(section.id, { description: e.target.value })}
                      className="w-full font-bold border-b border-dashed border-neutral-400 focus:border-black outline-none bg-transparent text-xs"
                    />
                  ) : (
                    <span>{section.description}</span>
                  )}
                  {onOpenPasteModalForSection && (
                    <button
                      type="button"
                      onClick={() => onOpenPasteModalForSection(section)}
                      className="print:hidden ml-2 px-2 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium cursor-pointer shadow-2xs"
                    >
                      Paste Excel
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse text-[10px] sm:text-[11px] print:text-[9.5px]">
                <thead className="bg-neutral-50/80 border-b border-black text-center font-bold">
                  <tr>
                    <th className="w-10 border-r border-black py-1 px-1">S.No.</th>
                    <th className="w-16 border-r border-black py-1 px-1">code</th>
                    <th className="w-12 border-r border-black py-1 px-1">Qty</th>
                    <th className="w-14 border-r border-black py-1 px-1">Width</th>
                    <th className="w-14 border-r border-black py-1 px-1">Height</th>
                    <th className="w-16 border-r border-black py-1 px-1">Per Sqm</th>
                    <th className="w-18 border-r border-black py-1 px-1">Total sqm</th>
                    <th className="w-20 border-r border-black py-1 px-1">Rate/ Sqm</th>
                    <th className="w-28 py-1 px-1">Amount in AED</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.length === 0 ? (
                    <tr className="border-b border-black">
                      <td colSpan={9} className="py-4 text-center text-neutral-400 italic">
                        No glass sizes added yet for {section.sectionCode}. Paste from Excel or add rows.
                      </td>
                    </tr>
                  ) : (
                    section.items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-black/80 hover:bg-neutral-50/40">
                        <td className="border-r border-black text-center py-0.5 px-1 font-mono">
                          {item.sNo}
                        </td>
                        <td className="border-r border-black text-center py-0.5 px-1 font-mono">
                          {item.code || ''}
                        </td>
                        <td className="border-r border-black text-center py-0.5 px-1 font-medium">
                          {item.qty > 0 ? item.qty : ''}
                        </td>
                        <td className="border-r border-black text-center py-0.5 px-1">
                          {item.width > 0 ? item.width : ''}
                        </td>
                        <td className="border-r border-black text-center py-0.5 px-1">
                          {item.height > 0 ? item.height : ''}
                        </td>
                        <td className="border-r border-black text-center py-0.5 px-1 font-mono">
                          {item.perSqm > 0 ? item.perSqm.toFixed(2) : ''}
                        </td>
                        <td className="border-r border-black text-center py-0.5 px-1 font-mono">
                          {item.totalSqm > 0 ? item.totalSqm.toFixed(2) : ''}
                        </td>
                        <td className="border-r border-black text-center py-0.5 px-1">
                          {item.ratePerSqm ? item.ratePerSqm.toFixed(2) : ''}
                        </td>
                        {/* The Amount in AED column is merged vertically across the section */}
                        {idx === 0 && (
                          <td
                            rowSpan={section.items.length}
                            className="text-center font-bold text-neutral-900 align-middle py-1 px-2 bg-neutral-50/30 text-xs"
                          >
                            {effectiveAmount > 0
                              ? effectiveAmount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : ''}
                          </td>
                        )}
                      </tr>
                    ))
                  )}

                  {/* Section Total Row */}
                  <tr className="font-bold border-t border-black bg-neutral-50/60">
                    <td colSpan={2} className="border-r border-black text-center py-1 px-1">
                      TOTAL
                    </td>
                    <td className="border-r border-black text-center py-1 px-1">
                      {totalQty}
                    </td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black text-center py-1 px-1 font-mono">
                      {totalSqm.toFixed(2)}
                    </td>
                    <td className="border-r border-black"></td>
                    <td className="text-center py-1 px-1 font-mono text-xs">
                      {effectiveAmount > 0
                        ? effectiveAmount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* 5. Grand Total & Summary Table */}
      <div className="border border-black my-2">
        <table className="w-full border-collapse text-[11px] print:text-[10px]">
          <tbody>
            <tr className="bg-neutral-100 font-bold border-b border-black">
              <td className="px-3 py-1.5 border-r border-black uppercase text-blue-950 font-serif">
                GRAND TOTAL
              </td>
              <td className="w-20 text-center px-2 py-1.5 border-r border-black font-bold text-blue-950">
                {grandTotalQty}
              </td>
              <td className="w-24 text-center px-2 py-1.5 border-r border-black font-bold text-blue-950 font-mono">
                {grandTotalSqm.toFixed(2)}
              </td>
              <td className="px-2 py-1.5 border-r border-black text-right text-xs">
                TOTAL AMOUNT IN AED
              </td>
              <td className="w-36 text-center px-3 py-1.5 font-bold font-mono text-xs">
                {totalAmountAED.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>

            {/* VAT Row */}
            <tr className="border-b border-black">
              <td colSpan={3} rowSpan={2} className="px-3 py-2 align-middle border-r border-black bg-neutral-50/40">
                <div className="text-[10px] text-neutral-500 font-medium italic mb-0.5">
                  Amount in words:
                </div>
                <div className="font-bold text-neutral-900 italic leading-relaxed text-xs">
                  {amountInWords}
                </div>
              </td>
              <td className="px-2 py-1 border-r border-black text-right text-xs bg-neutral-50/50">
                VAT @ {quotation.vatRatePercent ?? 5}%
              </td>
              <td className="w-36 text-center px-3 py-1 font-bold font-mono text-xs">
                {vatAmountAED.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>

            {/* Total with VAT Row */}
            <tr className="bg-neutral-100 font-bold">
              <td className="px-2 py-1.5 border-r border-black text-right text-xs text-[#8A1515]">
                TOTAL AMOUNT WITH VAT IN AED
              </td>
              <td className="w-36 text-center px-3 py-1.5 font-black font-mono text-sm text-[#8A1515]">
                {totalWithVatAED.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Comments */}
      <div className="border border-black p-2 my-2 text-[10px]">
        <span className="font-bold">Comments:-</span>
        {isEditable ? (
          <textarea
            value={quotation.comments}
            onChange={(e) => onUpdateQuotation?.({ ...quotation, comments: e.target.value })}
            placeholder="Optional comments or special instructions..."
            rows={1}
            className="w-full mt-1 p-1 border border-neutral-300 rounded text-[10px] outline-none"
          />
        ) : (
          <span className="ml-2">{quotation.comments || 'Standard specifications as above.'}</span>
        )}
      </div>

      {/* 7. TERMS AND CONDITIONS */}
      <div className="border border-black p-3 my-2 text-[9.5px] print:text-[8.5px] leading-snug">
        <div className="font-bold underline uppercase mb-1.5 text-[10.5px]">
          TERMS AND CONDITIONS
        </div>

        {/* Highlights: Payment Terms & Production Lead Time */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold">• Payment Terms:</span>
            <span className="bg-yellow-300 border border-yellow-400 px-3 py-0.5 font-bold uppercase tracking-wider text-black">
              {quotation.paymentTerms || 'CASH'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">• Production Lead Time:</span>
            <span className="bg-yellow-300 border border-yellow-400 px-3 py-0.5 font-bold uppercase tracking-wider text-black">
              {quotation.productionLeadTime || '4-5 WORKING DAYS'}
            </span>
          </div>
        </div>

        {/* Standard Terms List */}
        <div className="space-y-0.5 text-neutral-800">
          {quotation.termsAndConditions.map((term, tIdx) => (
            <div key={tIdx} className="flex items-start gap-1">
              <span className="font-bold select-none">•</span>
              <span>{term}</span>
            </div>
          ))}
        </div>

        {/* Bank Account Details */}
        <div className="mt-3 pt-2 border-t border-black/40">
          <div className="font-bold uppercase text-[10px] mb-1">• OUR BANK ACCOUNT DETAILS</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 font-medium pl-3 text-[9.5px]">
            <div>
              <span className="text-neutral-600">Bank Name:- </span>
              <strong>{quotation.bankDetails.bankName}</strong>
            </div>
            <div>
              <span className="text-neutral-600">NAME:- </span>
              <strong>{quotation.bankDetails.accountName}</strong>
            </div>
            <div>
              <span className="text-neutral-600">ACCOUNT NO:- </span>
              <strong className="font-mono">{quotation.bankDetails.accountNo}</strong>
            </div>
            <div>
              <span className="text-neutral-600">IBAN NO:- </span>
              <strong className="font-mono">{quotation.bankDetails.ibanNo}</strong>
            </div>
            <div>
              <span className="text-neutral-600">SWIFT CODE:- </span>
              <strong className="font-mono">{quotation.bankDetails.swiftCode}</strong>
            </div>
            <div>
              <span className="text-neutral-600">CURRENCY:- </span>
              <strong>{quotation.bankDetails.currency}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Signatures / Approvals Footer */}
      <div className="grid grid-cols-2 border border-black my-2">
        <div className="p-3 border-r border-black flex flex-col justify-between min-h-[90px]">
          <div>
            <div className="font-bold uppercase text-[10.5px]">FOR INTERGLASS CO L L C</div>
            <div className="text-[10px] text-neutral-600">PO Box 13710, Ajman, UAE</div>
          </div>
          <div className="pt-6 border-t border-dashed border-neutral-300 w-48 text-[9px] text-neutral-400">
            Authorized Signature
          </div>
        </div>

        <div className="p-3 flex flex-col justify-between min-h-[90px] text-center">
          <div className="font-bold uppercase text-[10.5px]">APPROVAL</div>
          <div className="font-semibold text-neutral-800 text-xs">
            {quotation.client.name || 'Client Name'}
          </div>
          <div className="pt-6 border-t border-black w-48 mx-auto text-[10px] font-bold">
            Sign & Stamp
          </div>
        </div>
      </div>
    </div>
  );
};
