export interface GlassItem {
  id: string;
  sNo: number | string;
  code: string;
  qty: number;
  width: number; // in mm
  height: number; // in mm
  perSqm: number; // calculated area per piece in sq mt
  totalSqm: number; // calculated total area for this row
  ratePerSqm?: number; // optional
  amount?: number; // optional
}

export interface GlassSection {
  id: string;
  sectionCode: string; // e.g. "Glass -01", "Glass -02"
  description: string; // e.g. "Supply of 4mm Clear glass Annealed only"
  items: GlassItem[];
  ratePerSqm?: number; // Rate applied to the whole section
  sectionAmount?: number; // Total amount in AED for this section
  useCalculatedAmount?: boolean; // If true, sectionAmount = totalSqm * ratePerSqm
}

export interface ClientInfo {
  name: string; // Client Company Name
  emirate: string;
  tel: string;
  fax: string;
  kindAttn: string;
  contactNo: string;
  email: string;
  ref: string;
  trn: string;
}

export interface FromInfo {
  companyName: string; // Inter Glass Co. LLC. Ajman
  refNo: string; // IG/26-06/ 3685
  rev: string; // REV-00
  dated: string; // 25-06-2026
  email: string; // sales3@interglass.org
  contact: string; // Shiju -055 880 3860
  tel: string; // +971 6 7484004
  fax: string; // +971 6 7484717, +971 6 7484718
  trn: string; // 100211523400003
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNo: string;
  ibanNo: string;
  swiftCode: string;
  currency: string;
}

export interface Quotation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'cancelled' | 'confirmed';
  cancellationReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  salesmanName?: string;
  confirmedQty?: number;
  confirmedTotalAmount?: number;
  client: ClientInfo;
  from: FromInfo;
  scopeOfWork: string;
  glassSections: GlassSection[];
  applyMinAreaRule: boolean; // Minimum invoicing area is 0.50 Sq Mt
  minAreaThreshold: number; // 0.50
  vatRatePercent: number; // 5%
  paymentTerms: string; // CASH
  productionLeadTime: string; // 4-5 WORKING DAYS
  comments: string;
  termsAndConditions: string[];
  bankDetails: BankDetails;
}

export type UserRole = 'ADMIN' | 'ESTIMATION' | 'PRODUCTION';

export interface UserAccount {
  id: string;
  username: string; // e.g. "HOD", "ESTIMATOR1", "FACTORY1"
  password: string; // e.g. "ADMIN1", "ESTM1", "PROD1"
  role: UserRole;
  isActive: boolean;
  name?: string;
  createdAt: string;
}
