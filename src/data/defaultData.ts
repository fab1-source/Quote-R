import { Quotation, GlassSection } from '../types';

export const DEFAULT_TERMS: string[] = [
  "This offer is subject to availability of the material during the time of the order",
  "This offer is valid upto 7 days from the date of quotation.",
  "Customer should specify the type of sealant required as per their site requirements. Unless specified, Inter Glass Co LLC will use polysulphide sealant for normal bonding for double glazed glass units",
  "The above given price is applicable only for this project and cannot be used as basis for any further requirements.",
  "The above given price is applicable only for this time and any change in price will be subjected to price revision.",
  "Minimum invoicing area is 0.50 Sq Mt",
  "Extra charges will be applicable on shaped & round glasses for processing if not specified in quotation.",
  "Extra charges will be applicable for step glazing if not specified in quotation.",
  "Interglass Co LLC has no responsibility to any breakage caused by thermal breakage for annealed glass.",
  "Holes, Notches and cutouts will be charged extra accordingly",
  "This offer is based on your details in the enquiry and any changes in sizes or process will be subject to price revision",
  "Final invoice value will be based on actual size and quantities as per production order.",
  "Packing: Wooden box packing will be charged extra if necessary otherwise glass will be delivered without packing.",
  "Transport: To be discussed while order confirmation.",
  "Rejections: Any rejections due to quality should be reported to Inter Glass Co. LLC within 2 days from the receipt of glasses.",
  "Processed glasses must be collected within 2 days after informing the client officially.",
  "Inter Glass Co. LLC will not take any responsibility for quality/storage of the glasses once the grace period is over for collection.",
  "Inter Glass Co. LLC has no responsibility to any breakages/rejections for Customer Owned Glass.",
  "We don't accept any kind of back to back payment terms or penalty which is imposed by your client or contractor in any form",
  "Please note that it is the responsibility of the customer to ensure that the glass is fit for the purpose and meets standards",
  "Alterations in payment terms is not acceptable."
];

export const DEFAULT_BANK_DETAILS = {
  bankName: "RAK BANK",
  accountName: "INTERGLASS CO LLC",
  accountNo: "0019323618062",
  ibanNo: "AE150400000019323618062",
  swiftCode: "NRAKAEAK",
  currency: "AED"
};

export const DEFAULT_FROM_INFO = {
  companyName: "Inter Glass Co. LLC. Ajman",
  refNo: `IGC/${String(new Date().getFullYear()).slice(-2)}/${String(new Date().getMonth() + 1).padStart(2, '0')}/001`,
  rev: "REV-00",
  dated: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'), // e.g. 03-09-2026
  email: "sales3@interglass.org",
  contact: "Shiju -055 880 3860",
  tel: "+971 6 7484004",
  fax: "+971 6 7484717, +971 6 7484718",
  trn: "100211523400003"
};

export const createEmptyGlassSection = (index: number): GlassSection => {
  const pad = String(index).padStart(2, '0');
  return {
    id: `glass-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sectionCode: `Glass -${pad}`,
    description: "Supply of 4mm Clear glass Annealed only",
    items: [],
    sectionAmount: 0,
    ratePerSqm: 0,
    useCalculatedAmount: false
  };
};

export const createBlankQuotation = (initialRefNo?: string): Quotation => {
  const ref = initialRefNo || DEFAULT_FROM_INFO.refNo;
  return {
    id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: `Quotation ${ref}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    client: {
      name: "",
      emirate: "",
      tel: "",
      fax: "",
      kindAttn: "",
      contactNo: "",
      email: "",
      ref: "",
      trn: ""
    },
    from: {
      ...DEFAULT_FROM_INFO,
      refNo: ref,
      dated: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    },
    scopeOfWork: "Description/ Scope of Work",
    glassSections: [createEmptyGlassSection(1)],
    applyMinAreaRule: true,
    minAreaThreshold: 0.50,
    vatRatePercent: 5,
    paymentTerms: "CASH",
    productionLeadTime: "4-5 WORKING DAYS",
    comments: "",
    termsAndConditions: [...DEFAULT_TERMS],
    bankDetails: { ...DEFAULT_BANK_DETAILS }
  };
};

// Sample quotation template
export const createSampleQuotation = (): Quotation => {
  return {
    id: "sample-quote-001",
    title: "Sample Quotation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    client: {
      name: "Sample Client LLC",
      emirate: "Dubai",
      tel: "",
      fax: "",
      kindAttn: "Project Manager",
      contactNo: "",
      email: "",
      ref: "",
      trn: ""
    },
    from: {
      companyName: "Inter Glass Co. LLC. Ajman",
      refNo: "IG/26-06/ 3685",
      rev: "REV-00",
      dated: "25-06-2026",
      email: "sales3@interglass.org",
      contact: "Shiju -055 880 3860",
      tel: "+971 6 7484004",
      fax: "+971 6 7484717, +971 6 7484718",
      trn: "100211523400003"
    },
    scopeOfWork: "Description/ Scope of Work",
    applyMinAreaRule: true,
    minAreaThreshold: 0.50,
    vatRatePercent: 5,
    paymentTerms: "CASH",
    productionLeadTime: "4-5 WORKING DAYS",
    comments: "",
    termsAndConditions: [...DEFAULT_TERMS],
    bankDetails: { ...DEFAULT_BANK_DETAILS },
    glassSections: [
      {
        id: "sample-section-1",
        sectionCode: "Glass -01",
        description: "Supply of 4mm Clear glass Annealed only",
        sectionAmount: 19155.00,
        ratePerSqm: 0,
        useCalculatedAmount: false,
        items: [
          { id: "s1-1", sNo: 1, code: "", qty: 78, width: 600, height: 720, perSqm: 0.50, totalSqm: 39.00 },
          { id: "s1-2", sNo: 2, code: "", qty: 58, width: 475, height: 720, perSqm: 0.50, totalSqm: 29.00 },
          { id: "s1-3", sNo: 3, code: "", qty: 7, width: 450, height: 720, perSqm: 0.50, totalSqm: 3.50 },
          { id: "s1-4", sNo: 4, code: "", qty: 56, width: 375, height: 720, perSqm: 0.50, totalSqm: 28.00 },
          { id: "s1-5", sNo: 5, code: "", qty: 242, width: 400, height: 720, perSqm: 0.50, totalSqm: 121.00 },
          { id: "s1-6", sNo: 6, code: "", qty: 31, width: 250, height: 720, perSqm: 0.50, totalSqm: 15.50 },
          { id: "s1-7", sNo: 7, code: "", qty: 60, width: 325, height: 720, perSqm: 0.50, totalSqm: 30.00 },
          { id: "s1-8", sNo: 8, code: "", qty: 24, width: 500, height: 720, perSqm: 0.50, totalSqm: 12.00 },
          { id: "s1-9", sNo: 9, code: "", qty: 6, width: 350, height: 720, perSqm: 0.50, totalSqm: 3.00 },
          { id: "s1-10", sNo: 10, code: "", qty: 32, width: 525, height: 720, perSqm: 0.50, totalSqm: 16.00 },
          { id: "s1-11", sNo: 11, code: "", qty: 73, width: 300, height: 720, perSqm: 0.50, totalSqm: 36.50 },
          { id: "s1-12", sNo: 12, code: "", qty: 6, width: 550, height: 720, perSqm: 0.50, totalSqm: 3.00 },
          { id: "s1-13", sNo: 13, code: "", qty: 496, width: 500, height: 2200, perSqm: 1.10, totalSqm: 545.60 }
        ]
      },
      {
        id: "sample-section-2",
        sectionCode: "Glass -02",
        description: "Supply of 8mm Clear glass annealed with Polished edges only",
        sectionAmount: 12525.00,
        ratePerSqm: 0,
        useCalculatedAmount: false,
        items: [
          { id: "s2-1", sNo: 1, code: "", qty: 84, width: 600, height: 305, perSqm: 0.50, totalSqm: 42.00 },
          { id: "s2-2", sNo: 2, code: "", qty: 58, width: 475, height: 305, perSqm: 0.50, totalSqm: 29.00 },
          { id: "s2-3", sNo: 3, code: "", qty: 7, width: 450, height: 305, perSqm: 0.50, totalSqm: 3.50 },
          { id: "s2-4", sNo: 4, code: "", qty: 28, width: 750, height: 305, perSqm: 0.50, totalSqm: 14.00 },
          { id: "s2-5", sNo: 5, code: "", qty: 62, width: 400, height: 305, perSqm: 0.50, totalSqm: 31.00 },
          { id: "s2-6", sNo: 6, code: "", qty: 51, width: 800, height: 305, perSqm: 0.50, totalSqm: 25.50 },
          { id: "s2-7", sNo: 7, code: "", qty: 73, width: 300, height: 305, perSqm: 0.50, totalSqm: 36.50 },
          { id: "s2-8", sNo: 8, code: "", qty: 31, width: 250, height: 305, perSqm: 0.50, totalSqm: 15.50 },
          { id: "s2-9", sNo: 9, code: "", qty: 30, width: 650, height: 305, perSqm: 0.50, totalSqm: 15.00 },
          { id: "s2-10", sNo: 10, code: "", qty: 24, width: 500, height: 305, perSqm: 0.50, totalSqm: 12.00 },
          { id: "s2-11", sNo: 11, code: "", qty: 6, width: 550, height: 305, perSqm: 0.50, totalSqm: 3.00 },
          { id: "s2-12", sNo: 12, code: "", qty: 16, width: 1050, height: 305, perSqm: 0.50, totalSqm: 8.00 },
          { id: "s2-13", sNo: 13, code: "", qty: 6, width: 350, height: 305, perSqm: 0.50, totalSqm: 3.00 }
        ]
      },
      {
        id: "sample-section-3",
        sectionCode: "Glass -03",
        description: "Supply of 4mm Clear glass annealed with Polished edges only",
        sectionAmount: 32542.00,
        ratePerSqm: 0,
        useCalculatedAmount: false,
        items: [
          { id: "s3-1", sNo: 1, code: "", qty: 86, width: 475, height: 1580, perSqm: 0.75, totalSqm: 64.54 },
          { id: "s3-2", sNo: 2, code: "", qty: 324, width: 500, height: 2200, perSqm: 1.10, totalSqm: 356.40 }
        ]
      }
    ]
  };
};
