import React from 'react';
import { Quotation } from '../types';
import { InterglassLogoBanner } from './InterglassLogo';
import { calculateSectionTotals, calculateQuotationTotals } from '../utils/calculations';

interface JobCardDocumentProps {
  quotation: Quotation;
}

export const JobCardDocument: React.FC<JobCardDocumentProps> = ({ quotation }) => {
  const { grandTotalQty, grandTotalSqm } = calculateQuotationTotals(quotation);

  const confirmedDateStr = quotation.confirmedAt
    ? new Date(quotation.confirmedAt).toLocaleDateString('en-GB')
    : quotation.from?.dated || '';

  return (
    <div
      id="jobcard-print-container"
      className="bg-white text-neutral-900 mx-auto font-sans text-[11px] leading-snug print:text-[10px] print:leading-tight shadow-lg print:shadow-none border-2 border-black p-4 sm:p-7 max-w-[960px] select-text"
      style={{ minHeight: '1050px' }}
    >
      {/* 1. Header: Official Logo Banner & Job Card Title */}
      <div className="pb-2 mb-2 border-b-[2px] border-black flex flex-col items-center">
        <InterglassLogoBanner className="my-0.5" />
        <div className="w-full mt-2 pt-1 border-t border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white font-mono font-black text-sm px-2.5 py-0.5 uppercase tracking-wider">
              JOB CARD
            </span>
            <span className="font-bold text-xs uppercase tracking-wide text-neutral-800">
              Factory Production & Work Order
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
              STATUS: CONFIRMED ORDER
            </span>
            <span className="font-mono font-extrabold text-sm text-[#7B1818]">
              {quotation.from?.refNo || 'REF-PENDING'}
            </span>
          </div>
        </div>
      </div>

      {/* Salesman Highlight Alert Banner */}
      <div className="mb-2.5 bg-amber-50 border border-amber-300 rounded p-2 text-amber-950 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wide text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
            SALESMAN ASSIGNED
          </span>
          <span className="font-extrabold text-sm text-slate-900">
            {quotation.salesmanName || <span className="text-amber-800 italic">Not Assigned</span>}
          </span>
        </div>
        <div className="text-[11px] text-amber-900 font-medium">
          Production Department Copy • Factory Ajman
        </div>
      </div>

      {/* 2. Side by Side To (Client) & From (Order Details) Tables */}
      <div className="grid grid-cols-2 gap-0 border-t border-l border-r border-black mb-2">
        {/* LEFT COLUMN: Client / Project Details */}
        <div className="border-r border-black">
          <table className="w-full border-collapse text-[11px]">
            <tbody>
              <tr className="border-b border-black">
                <td className="w-24 font-bold px-2 py-1 bg-neutral-100 border-r border-black">Client Name</td>
                <td className="px-2 py-1 font-bold text-slate-900">
                  {quotation.client?.name || '-'}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/70 border-r border-black">Emirate / Site</td>
                <td className="px-2 py-1 font-semibold">
                  {quotation.client?.emirate || '-'}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/70 border-r border-black">Kind Attn:</td>
                <td className="px-2 py-1">
                  {quotation.client?.kindAttn || '-'}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/70 border-r border-black">Contact No.</td>
                <td className="px-2 py-1">
                  {quotation.client?.contactNo || quotation.client?.tel || '-'}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/70 border-r border-black">Project Ref</td>
                <td className="px-2 py-1 font-mono">
                  {quotation.client?.ref || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RIGHT COLUMN: Production Order Reference & Factory Details */}
        <div>
          <table className="w-full border-collapse text-[11px]">
            <tbody>
              <tr className="border-b border-black">
                <td className="w-24 font-bold px-2 py-1 bg-neutral-100 border-r border-black">Job Card Ref</td>
                <td className="px-2 py-1 font-mono font-black text-slate-900 text-xs">
                  {quotation.from?.refNo}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/70 border-r border-black">Order Date</td>
                <td className="px-2 py-1">
                  {quotation.from?.dated}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-amber-50 border-r border-black text-amber-950 font-bold">
                  Salesman
                </td>
                <td className="px-2 py-1 font-black text-slate-900 bg-amber-50/40">
                  {quotation.salesmanName || '-'}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/70 border-r border-black">Confirmed On</td>
                <td className="px-2 py-1 font-mono">
                  {confirmedDateStr}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-medium px-2 py-1 bg-neutral-50/70 border-r border-black">Factory Phone</td>
                <td className="px-2 py-1">
                  {quotation.from?.contact || quotation.from?.tel}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Scope of Work / Glass Processing Banner */}
      <div className="border border-black bg-slate-100 px-3 py-1 mb-2.5 flex items-center justify-between">
        <span className="font-bold text-slate-900 uppercase tracking-wide text-xs">
          Glass Cutting, Processing & Fabrication Details
        </span>
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          Dimensions in mm
        </span>
      </div>

      {/* 4. Glass Sections (NO AMOUNTS) */}
      <div className="space-y-3.5 mb-3">
        {quotation.glassSections.map((section) => {
          const { totalQty, totalSqm } = calculateSectionTotals(section);

          return (
            <div key={section.id} className="border border-black">
              {/* Glass Section Header */}
              <div className="flex border-b border-black bg-slate-50">
                <div className="w-24 border-r border-black px-2 py-1 font-bold text-center bg-slate-200 text-slate-800">
                  {section.sectionCode}
                </div>
                <div className="flex-1 px-3 py-1 font-bold text-neutral-900 text-xs flex items-center justify-between">
                  <span>{section.description}</span>
                  <span className="text-[10px] font-mono text-slate-500 font-medium">
                    {section.items.length} items
                  </span>
                </div>
              </div>

              {/* Items Table - CRITICAL: No Rate, No Amount! */}
              <table className="w-full border-collapse text-[10.5px] print:text-[9.5px]">
                <thead className="bg-neutral-100 border-b border-black text-center font-bold">
                  <tr>
                    <th className="w-12 border-r border-black py-1 px-1">S.No.</th>
                    <th className="w-28 border-r border-black py-1 px-1 text-left pl-2">Glass Mark / Code</th>
                    <th className="w-16 border-r border-black py-1 px-1">Qty (Pcs)</th>
                    <th className="w-20 border-r border-black py-1 px-1">Width (mm)</th>
                    <th className="w-20 border-r border-black py-1 px-1">Height (mm)</th>
                    <th className="w-24 border-r border-black py-1 px-1">Area / Pc (m²)</th>
                    <th className="w-24 py-1 px-1">Total Area (m²)</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.length === 0 ? (
                    <tr className="border-b border-black">
                      <td colSpan={7} className="py-3 text-center text-neutral-400 italic">
                        No glass sizes specified for {section.sectionCode}.
                      </td>
                    </tr>
                  ) : (
                    section.items.map((item) => (
                      <tr key={item.id} className="border-b border-black/70 hover:bg-neutral-50/40">
                        <td className="border-r border-black text-center py-1 px-1 font-mono">
                          {item.sNo}
                        </td>
                        <td className="border-r border-black py-1 px-2 font-mono font-medium">
                          {item.code || '-'}
                        </td>
                        <td className="border-r border-black text-center py-1 px-1 font-bold">
                          {item.qty}
                        </td>
                        <td className="border-r border-black text-right py-1 px-2 font-mono">
                          {item.width}
                        </td>
                        <td className="border-r border-black text-right py-1 px-2 font-mono">
                          {item.height}
                        </td>
                        <td className="border-r border-black text-right py-1 px-2 font-mono text-slate-600">
                          {item.perSqm > 0 ? item.perSqm.toFixed(2) : '-'}
                        </td>
                        <td className="text-right py-1 px-2 font-mono font-bold text-slate-900">
                          {item.totalSqm > 0 ? item.totalSqm.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Section Total Row (Quantities only, NO AMOUNT) */}
                  <tr className="font-bold border-t border-black bg-neutral-100/80">
                    <td colSpan={2} className="border-r border-black text-center py-1 px-2 uppercase text-[10px]">
                      Section Total ({section.sectionCode})
                    </td>
                    <td className="border-r border-black text-center py-1 px-1 font-black text-slate-900">
                      {totalQty}
                    </td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black text-right pr-2 text-[10px] text-slate-500">
                      Total Sqm:
                    </td>
                    <td className="text-right py-1 px-2 font-mono font-black text-slate-900">
                      {totalSqm.toFixed(2)} m²
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* 5. Grand Total Summary (Pieces and Sqm only, NO AMOUNTS) */}
      <div className="border-2 border-black mb-3">
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            <tr className="bg-slate-100 font-bold">
              <td className="px-3 py-2 border-r border-black uppercase text-slate-900 font-black text-xs">
                TOTAL PRODUCTION SUMMARY
              </td>
              <td className="w-32 text-center px-2 py-2 border-r border-black font-black text-slate-900 text-sm">
                <span className="text-[10px] font-normal block text-slate-500 uppercase">Total Pieces</span>
                {grandTotalQty} Pcs
              </td>
              <td className="w-36 text-center px-2 py-2 border-r border-black font-black text-slate-900 text-sm font-mono">
                <span className="text-[10px] font-normal block text-slate-500 uppercase">Total Area</span>
                {grandTotalSqm.toFixed(2)} m²
              </td>
              <td className="px-3 py-2 text-right text-xs text-slate-700">
                <span className="text-[10px] font-normal block text-slate-500 uppercase">Total Glass Sections</span>
                <span className="font-bold">{quotation.glassSections.length} Specifications</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Production Remarks / Comments & Lead Time */}
      <div className="border border-black p-2.5 mb-3 text-[10.5px]">
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-neutral-200">
          <span className="font-bold uppercase tracking-wider text-[10px] text-slate-700">
            Special Instructions / Production Remarks:
          </span>
          {quotation.productionLeadTime && (
            <span className="font-bold text-neutral-800">
              Required Lead Time: <span className="underline">{quotation.productionLeadTime}</span>
            </span>
          )}
        </div>
        <div className="text-slate-800 text-[10px] min-h-[22px]">
          {quotation.comments ? (
            <p className="whitespace-pre-line">{quotation.comments}</p>
          ) : (
            <p className="text-slate-500 italic">
              Fabricate and process as per UAE standard glass specifications. Verify all hole and notch positions before tempering.
            </p>
          )}
        </div>
      </div>

      {/* NOTE: TERMS AND CONDITIONS AND BANK DETAILS ARE EXCLUDED AS REQUESTED */}

      {/* 7. Factory Signatures & Approvals Footer */}
      <div className="grid grid-cols-4 border border-black text-center text-[10px]">
        <div className="p-2.5 border-r border-black flex flex-col justify-between min-h-[90px]">
          <div>
            <div className="font-bold uppercase text-[9.5px]">PREPARED BY</div>
            <div className="text-slate-600 font-semibold mt-0.5">
              {quotation.salesmanName || 'Sales Dept'}
            </div>
          </div>
          <div className="pt-4 border-t border-dashed border-neutral-300 text-[8.5px] text-neutral-400">
            Sales Signature
          </div>
        </div>

        <div className="p-2.5 border-r border-black flex flex-col justify-between min-h-[90px]">
          <div>
            <div className="font-bold uppercase text-[9.5px]">CUTTING / EDGING</div>
            <div className="text-slate-400 text-[9px] mt-0.5">Operator</div>
          </div>
          <div className="pt-4 border-t border-dashed border-neutral-300 text-[8.5px] text-neutral-400">
            Sign & Date
          </div>
        </div>

        <div className="p-2.5 border-r border-black flex flex-col justify-between min-h-[90px]">
          <div>
            <div className="font-bold uppercase text-[9.5px]">TEMPERING / DGU</div>
            <div className="text-slate-400 text-[9px] mt-0.5">Operator</div>
          </div>
          <div className="pt-4 border-t border-dashed border-neutral-300 text-[8.5px] text-neutral-400">
            Sign & Date
          </div>
        </div>

        <div className="p-2.5 flex flex-col justify-between min-h-[90px]">
          <div>
            <div className="font-bold uppercase text-[9.5px]">QC & DISPATCH</div>
            <div className="text-slate-400 text-[9px] mt-0.5">Final Inspection</div>
          </div>
          <div className="pt-4 border-t border-dashed border-neutral-300 text-[8.5px] text-neutral-400">
            Inspector Stamp
          </div>
        </div>
      </div>
    </div>
  );
};
