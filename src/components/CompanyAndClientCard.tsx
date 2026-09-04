import React, { useState } from 'react';
import { Building2, UserCheck, ChevronDown, ChevronUp, Sliders, ShieldCheck, Lock } from 'lucide-react';
import { Quotation } from '../types';

interface CompanyAndClientCardProps {
  quotation: Quotation;
  onUpdateQuotation: (updated: Quotation) => void;
  readOnly?: boolean;
}

export const CompanyAndClientCard: React.FC<CompanyAndClientCardProps> = ({
  quotation,
  onUpdateQuotation,
  readOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvancedTerms, setShowAdvancedTerms] = useState(false);

  const updateClient = (field: keyof typeof quotation.client, val: string) => {
    onUpdateQuotation({
      ...quotation,
      client: { ...quotation.client, [field]: val },
    });
  };

  const updateFrom = (field: keyof typeof quotation.from, val: string) => {
    onUpdateQuotation({
      ...quotation,
      from: { ...quotation.from, [field]: val },
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quotation Header & Parties
              </h2>
              {readOnly && (
                <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold rounded bg-neutral-200 text-neutral-700 border border-neutral-300">
                  Read-Only (Locked)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Ref: <span className="font-semibold text-slate-700">{quotation.from.refNo} ({quotation.from.rev})</span> • Client:{' '}
              <span className="font-semibold text-slate-700">
                {quotation.client.name || 'Not filled'}
              </span>
              {quotation.salesmanName && (
                <>
                  {' '}• Salesman:{' '}
                  <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {quotation.salesmanName}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Salesman's Box (Order Assignment) */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <span>Salesman / Order Assigned To</span>
                  {readOnly && (
                    <span className="text-[10px] lowercase font-normal bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                      locked
                    </span>
                  )}
                </label>
                <p className="text-[11px] text-amber-800/80">
                  Mention the name of salesman to whom this order belongs
                </p>
              </div>
            </div>
            <div className="sm:w-80">
              <input
                type="text"
                disabled={readOnly}
                value={quotation.salesmanName || ''}
                onChange={(e) =>
                  onUpdateQuotation({
                    ...quotation,
                    salesmanName: e.target.value,
                  })
                }
                placeholder="e.g. Shiju / Mohammed / Rajesh"
                className="w-full px-3.5 py-2 bg-white disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-amber-300 rounded-lg text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Box: TO (Client Details) */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Client Information (TO)</span>
                <UserCheck className="w-4 h-4 text-blue-600" />
              </h2>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Client / Company Name *
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={quotation.client.name}
                    onChange={(e) => updateClient('name', e.target.value)}
                    placeholder="e.g. Client / Company Name"
                    className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Kind Attn:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.client.kindAttn}
                      onChange={(e) => updateClient('kindAttn', e.target.value)}
                      placeholder="e.g. Karishma"
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Emirate:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.client.emirate}
                      onChange={(e) => updateClient('emirate', e.target.value)}
                      placeholder="e.g. Dubai / Ajman"
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Tel:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.client.tel}
                      onChange={(e) => updateClient('tel', e.target.value)}
                      placeholder="Phone number"
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Fax:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.client.fax}
                      onChange={(e) => updateClient('fax', e.target.value)}
                      placeholder="e.g. 06 5437736"
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Contact No:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.client.contactNo}
                      onChange={(e) => updateClient('contactNo', e.target.value)}
                      placeholder="Mobile number"
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      E-Mail:
                    </label>
                    <input
                      type="email"
                      disabled={readOnly}
                      value={quotation.client.email}
                      onChange={(e) => updateClient('email', e.target.value)}
                      placeholder="client@email.com"
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Client Ref:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.client.ref}
                      onChange={(e) => updateClient('ref', e.target.value)}
                      placeholder="Project/Enquiry Ref"
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      TRN:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.client.trn}
                      onChange={(e) => updateClient('trn', e.target.value)}
                      placeholder="Tax Registration No"
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: FROM (Sender Details) */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Sender Details (Inter Glass - Preloaded)</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </h2>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={quotation.from.companyName}
                    onChange={(e) => updateFrom('companyName', e.target.value)}
                    className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">
                        Ref No.
                      </label>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded flex items-center gap-1 border border-slate-300/80">
                        <Lock className="w-2.5 h-2.5 text-slate-600" />
                        Locked
                      </span>
                    </div>
                    {/* Permanently uneditable reference number */}
                    <div
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm font-mono font-bold text-[#7B1818] cursor-not-allowed select-all flex items-center justify-between shadow-2xs"
                      title="Quotation reference number is permanent and cannot be edited."
                    >
                      <span>{quotation.from.refNo}</span>
                      <span className="text-[10px] font-sans font-normal text-slate-400">Assigned</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Revision
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.from.rev}
                      onChange={(e) => updateFrom('rev', e.target.value)}
                      placeholder="REV-00"
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm font-mono text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Quotation Date:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.from.dated}
                      onChange={(e) => updateFrom('dated', e.target.value)}
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Contact Person:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.from.contact}
                      onChange={(e) => updateFrom('contact', e.target.value)}
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Email:
                    </label>
                    <input
                      type="email"
                      disabled={readOnly}
                      value={quotation.from.email}
                      onChange={(e) => updateFrom('email', e.target.value)}
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Tel:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.from.tel}
                      onChange={(e) => updateFrom('tel', e.target.value)}
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Fax:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.from.fax}
                      onChange={(e) => updateFrom('fax', e.target.value)}
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      TRN:
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={quotation.from.trn}
                      onChange={(e) => updateFrom('trn', e.target.value)}
                      className="w-full px-3 py-2 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-200 rounded-md text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Settings Bar: Payment terms, Lead time, Min area rule, VAT */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 text-xs">Payment Terms:</span>
                <input
                  type="text"
                  disabled={readOnly}
                  value={quotation.paymentTerms}
                  onChange={(e) =>
                    onUpdateQuotation({ ...quotation, paymentTerms: e.target.value })
                  }
                  className="w-28 font-bold text-center py-1 px-2 border border-amber-300 bg-amber-50 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed rounded-md text-amber-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 text-xs">Lead Time:</span>
                <input
                  type="text"
                  disabled={readOnly}
                  value={quotation.productionLeadTime}
                  onChange={(e) =>
                    onUpdateQuotation({ ...quotation, productionLeadTime: e.target.value })
                  }
                  className="w-40 font-bold text-center py-1 px-2 border border-amber-300 bg-amber-50 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed rounded-md text-amber-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 text-xs">VAT Rate:</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={readOnly}
                    value={quotation.vatRatePercent}
                    onChange={(e) =>
                      onUpdateQuotation({
                        ...quotation,
                        vatRatePercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-14 text-center font-bold py-1 px-1 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed rounded-l-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="bg-slate-100 border border-l-0 border-slate-200 py-1 px-2.5 rounded-r-md font-semibold text-slate-600">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className={`inline-flex items-center gap-2 select-none ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={quotation.applyMinAreaRule}
                  onChange={(e) =>
                    onUpdateQuotation({
                      ...quotation,
                      applyMinAreaRule: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 disabled:cursor-not-allowed"
                />
                <span className="text-slate-700 font-medium text-xs">
                  Enforce Min Invoicing Area (0.50 Sq Mt)
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowAdvancedTerms(!showAdvancedTerms)}
                className="text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>{showAdvancedTerms ? 'Hide Bank Details' : 'Bank Details'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Bank Details */}
          {showAdvancedTerms && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="font-bold text-slate-700 uppercase text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Inter Glass Bank Account Details
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={quotation.bankDetails.bankName}
                    onChange={(e) =>
                      onUpdateQuotation({
                        ...quotation,
                        bankDetails: { ...quotation.bankDetails, bankName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={quotation.bankDetails.accountName}
                    onChange={(e) =>
                      onUpdateQuotation({
                        ...quotation,
                        bankDetails: { ...quotation.bankDetails, accountName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Account No
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={quotation.bankDetails.accountNo}
                    onChange={(e) =>
                      onUpdateQuotation({
                        ...quotation,
                        bankDetails: { ...quotation.bankDetails, accountNo: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={quotation.bankDetails.iban}
                    onChange={(e) =>
                      onUpdateQuotation({
                        ...quotation,
                        bankDetails: { ...quotation.bankDetails, iban: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    SWIFT Code
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={quotation.bankDetails.swiftCode}
                    onChange={(e) =>
                      onUpdateQuotation({
                        ...quotation,
                        bankDetails: { ...quotation.bankDetails, swiftCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={quotation.bankDetails.currency}
                    onChange={(e) =>
                      onUpdateQuotation({
                        ...quotation,
                        bankDetails: { ...quotation.bankDetails, currency: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
