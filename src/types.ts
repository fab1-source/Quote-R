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
  isLocked?: boolean;
  supersededBy?: string; // Reference of newer revision that replaced this, e.g. "REV-01"
  isArchivedRevision?: boolean; // True if this is an older revision kept for reference
  revisionOfId?: string; // The ID of the previous revision from which this was created
  revisionNumber?: number; // 0 for R-00, 1 for R-01, 2 for R-02...
  cancellationReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  salesmanName?: string;
  authorName?: string; // e.g. "HOD", "ESTIMATOR1", "ESTIMATOR2" (uneditable quotation author)
  updatedBy?: string; // name or username of the user who last edited this quotation
  lastEditedBy?: string;
  confirmedQty?: number;
  confirmedTotalAmount?: number;
  committedDeliveryDate?: string; // e.g. "YYYY-MM-DD"
  isCompleted?: boolean;
  isInvoiced?: boolean;
  factoryComments?: string;
  coordinatorRemarks?: string; // Follow-up remarks by Quotation Coordinator
  coordinatorRemarksUpdatedAt?: string;
  coordinatorRemarksAuthor?: string;
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
  costSheetData?: CostSheetData;
}

export interface CostSheetItem {
  id: string;
  type: 'glass' | 'service';
  description: string; // e.g. "6mm HD Grey-3210 x 2250" or "Temper"
  actual: string; // e.g. "12 Sheets" or blank
  actualSheets?: number; // e.g. 12
  qty: number; // e.g. 13 (sheets) or 71.85 (sqm)
  sheetWidthMm?: number; // default 3210
  sheetHeightMm?: number; // default 2250
  pricePerSqm: number; // e.g. 49.00 or 10.00
  cuttingCharge: number; // e.g. 15.00 per sheet (or 0 for service)
  total: number; // calculated total in AED
}

export interface CostSheetData {
  items: CostSheetItem[];
  marginPercent: number; // default 15.00%
  notes?: string;
  lastUpdated?: string;
}

export type UserRole = 'ADMIN' | 'ESTIMATION' | 'PRODUCTION' | 'VIEWER' | 'COORDINATOR';

export interface UserAccount {
  id: string;
  username: string; // e.g. "HOD", "ESTIMATOR1", "FACTORY1"
  password: string; // e.g. "ADMIN1", "ESTM1", "PROD1"
  role: UserRole;
  isActive: boolean;
  name?: string;
  createdAt: string;
}

export type ActivityActionType =
  | 'CREATE_QUOTE'
  | 'EDIT_QUOTE'
  | 'CONFIRM_JOB'
  | 'UNCONFIRM_JOB'
  | 'CANCEL_QUOTE'
  | 'UNCANCEL_QUOTE'
  | 'REVISE_QUOTE'
  | 'DUPLICATE_QUOTE'
  | 'UPDATE_COMMENT'
  | 'UPDATE_REMARKS'
  | 'UPDATE_SALESMAN'
  | 'UPDATE_INVOICE'
  | 'SYSTEM';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO date string
  date: string; // formatted e.g. "09-09-2026"
  time: string; // formatted e.g. "01:45 PM"
  user: string; // username or name e.g. "ADMIN", "ESTIMATOR1"
  userRole?: string; // e.g. "ADMIN", "ESTIMATION", "PRODUCTION"
  action: ActivityActionType;
  reference: string; // Quote or Job Card ref, e.g. "IGC/26/09/003"
  clientName?: string; // Client name
  summary: string; // Short title e.g. "Created new quotation"
  details: string; // Detailed breakdown of changes
}

