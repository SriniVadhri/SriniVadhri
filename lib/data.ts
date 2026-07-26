// ─── Types ──────────────────────────────────────────────────────────

export type Rail =
  | "venmo"
  | "cashapp"
  | "zelle"
  | "paypal"
  | "ach"
  | "wire"
  | "applepay"
  | "bank";

export interface PaymentInstrument {
  id: string;
  rail: Rail;
  label: string;
  detail: string; // masked account or username
  routingNumber?: string; // routing number for bank accounts
  currency: string;
  settlementSpeed: string;
  fee: string;
  successRate: number; // 0-100
  enabled: boolean;
}

export interface Contact {
  id: string;
  name: string;
  upa: string; // Payment Identity (username, phone, email, linkedin, venmo, zelle)
  upaType: "linkedin" | "venmo" | "zelle" | "phone" | "email";
  contactType: "person" | "business";
  category?: string;
  avatar: string;
  initials: string;
  instruments: PaymentInstrument[];
  preferredCurrency: string;
  country: string;
  verified: boolean;
  favorite: boolean;
}

export interface Transaction {
  id: string;
  contactId: string;
  contactName: string;
  contactInitials: string;
  contactAvatar: string;
  amount: number;
  currency: string;
  rail: Rail;
  railLabel: string;
  status: "completed" | "pending" | "failed";
  direction: "sent" | "received";
  timestamp: string;
  note: string;
}

export const RAIL_META: Record<Rail, { icon: string; color: string; label: string }> = {
  venmo: { icon: "Wallet", color: "text-chart-1", label: "Venmo" },
  cashapp: { icon: "Zap", color: "text-success", label: "Cash App" },
  zelle: { icon: "Smartphone", color: "text-chart-4", label: "Zelle" },
  paypal: { icon: "Wallet", color: "text-chart-2", label: "PayPal" },
  ach: { icon: "Building2", color: "text-chart-3", label: "ACH Transfer" },
  wire: { icon: "ArrowRightLeft", color: "text-chart-5", label: "Wire Transfer" },
  applepay: { icon: "Wallet", color: "text-primary", label: "Apple Pay" },
  bank: { icon: "Building2", color: "text-accent", label: "Bank Transfer" },
};

// ─── Transaction Costs (US Payment Systems) ────────────────────────────

export interface TransactionCost {
  userFee: string; // Fee charged to user
  merchantMDR?: string; // Merchant Discount Rate (for P2M)
  feeDetails: string; // Detailed explanation
  taxApplicable: boolean;
  calculateFee: (amount: number, isP2M: boolean) => number;
}

export const TRANSACTION_COSTS: Record<Rail, TransactionCost> = {
  venmo: {
    userFee: "Free (bank), 3% (card)",
    merchantMDR: "1.9% + $0.10",
    feeDetails: "P2P transfers free from bank or balance. Credit/debit card funding costs 3%. Instant transfer to bank: 1.75% (min $0.25, max $25).",
    taxApplicable: false,
    calculateFee: (amount: number, isP2M: boolean) => {
      return 0; // P2P from bank is free
    },
  },
  cashapp: {
    userFee: "Free (standard), 0.5-1.75% (instant)",
    merchantMDR: "2.75%",
    feeDetails: "Standard transfers free. Instant deposit: 0.5%-1.75% (min $0.25). Credit card funding: 3%.",
    taxApplicable: false,
    calculateFee: (amount: number, isP2M: boolean) => {
      return 0; // Standard is free
    },
  },
  zelle: {
    userFee: "Free",
    merchantMDR: "N/A",
    feeDetails: "Free P2P transfers through participating banks. Some banks may charge for non-customer transfers.",
    taxApplicable: false,
    calculateFee: (amount: number, isP2M: boolean) => 0,
  },
  paypal: {
    userFee: "Free (balance/bank), 2.9% (card)",
    merchantMDR: "2.9% + $0.30",
    feeDetails: "P2P free when funded by balance or bank. Credit/debit: 2.9%. Instant transfer: 1.75% (max $25).",
    taxApplicable: false,
    calculateFee: (amount: number, isP2M: boolean) => 0,
  },
  applepay: {
    userFee: "Free (debit), 3% (credit)",
    merchantMDR: "Varies by processor",
    feeDetails: "Apple Cash P2P: Free with debit, 3% with credit. Instant transfer: 1.5% (min $0.25, max $15).",
    taxApplicable: false,
    calculateFee: (amount: number, isP2M: boolean) => 0,
  },
  ach: {
    userFee: "$0 - $3",
    merchantMDR: "N/A",
    feeDetails: "Most banks offer free ACH. Some charge $0-$3 per transfer. Settlement: 1-3 business days.",
    taxApplicable: false,
    calculateFee: (amount: number, isP2M: boolean) => {
      return 0; // Most banks free
    },
  },
  wire: {
    userFee: "$15 - $35 (domestic), $35-$50 (international)",
    merchantMDR: "N/A",
    feeDetails: "Domestic wire: $15-$35. Same-day settlement. Incoming wires often $0-$15.",
    taxApplicable: false,
    calculateFee: (amount: number, isP2M: boolean) => {
      return 25; // Average domestic wire fee
    },
  },
  bank: {
    userFee: "Varies by method",
    merchantMDR: "N/A",
    feeDetails: "Depends on transfer method (ACH/Wire). See individual method costs.",
    taxApplicable: false,
    calculateFee: (amount: number, isP2M: boolean) => 0,
  },
};

// Helper function to get formatted fee string
export function getTransactionFeeDisplay(rail: Rail, amount: number, isP2M: boolean = false): string {
  const cost = TRANSACTION_COSTS[rail];
  const calculatedFee = cost.calculateFee(amount, isP2M);
  
  if (calculatedFee === 0) {
    return "Free";
  }
  
  return `$${calculatedFee.toFixed(2)}`;
}

// ─── Velocity Limits (US Payment Systems) ────────────────────────────

export interface VelocityLimit {
  perTransaction: number;
  daily: number;
  weekly?: number;
  dailyCount?: number;
  minAmount?: number;
  newBeneficiaryLimit?: number;
  description: string;
}

export const VELOCITY_LIMITS: Record<Rail, VelocityLimit> = {
  venmo: {
    perTransaction: 5000, // $5,000 per transaction (verified)
    daily: 7000, // $7,000 daily limit
    weekly: 7000, // $7,000 weekly limit
    description: "Venmo: Max $5K/txn, $7K/week (verified accounts)",
  },
  cashapp: {
    perTransaction: 7500, // $7,500 per transaction (verified)
    daily: 7500,
    weekly: 17500, // $17,500 weekly
    description: "Cash App: Max $7.5K/txn, $17.5K/week (verified)",
  },
  zelle: {
    perTransaction: 5000, // Varies by bank, typically $2K-$5K
    daily: 5000,
    description: "Zelle: Max $5K/day (varies by bank)",
  },
  paypal: {
    perTransaction: 10000, // $10,000 per transaction
    daily: 10000,
    description: "PayPal: Max $10K/txn (verified accounts)",
  },
  applepay: {
    perTransaction: 10000,
    daily: 10000,
    description: "Apple Pay: Max $10K/txn, $10K/week",
  },
  ach: {
    perTransaction: 100000, // Typically $100K for personal
    daily: 100000,
    newBeneficiaryLimit: 5000, // $5K for new payees (first 24 hours)
    description: "ACH: Up to $100K/txn (bank-specific), 1-3 days",
  },
  wire: {
    perTransaction: Number.MAX_SAFE_INTEGER, // No limit
    daily: Number.MAX_SAFE_INTEGER,
    minAmount: 1000, // Practical minimum due to fees
    newBeneficiaryLimit: 10000,
    description: "Wire: No max limit, same-day settlement",
  },
  bank: {
    perTransaction: 100000,
    daily: 100000,
    newBeneficiaryLimit: 5000,
    description: "Bank Transfer: Limits vary by bank and account type",
  },
};

// Simulated user's daily usage (for demo purposes)
export const USER_DAILY_USAGE = {
  venmo: { amount: 1200, count: 4 }, // $1.2K spent, 4 transactions today
  cashapp: { amount: 350, count: 2 },
  zelle: { amount: 500, count: 1 },
  paypal: { amount: 0, count: 0 },
  applepay: { amount: 150, count: 3 },
  ach: { amount: 2500, count: 1 },
  wire: { amount: 0, count: 0 },
  bank: { amount: 0, count: 0 },
};

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  remainingDaily?: number;
  remainingCount?: number;
  suggestedAlternatives?: Rail[];
}

export function checkVelocityLimit(
  rail: Rail,
  amount: number,
  isNewBeneficiary: boolean = false
): LimitCheckResult {
  const limit = VELOCITY_LIMITS[rail];
  const usage = USER_DAILY_USAGE[rail];

  // Check minimum amount for Wire
  if (limit.minAmount && amount < limit.minAmount) {
    return {
      allowed: false,
      reason: `Wire transfers recommended for amounts over $${(limit.minAmount).toLocaleString()} due to fees. Use ACH or Zelle for smaller amounts.`,
      suggestedAlternatives: ["ach", "zelle"],
    };
  }

  // Check new beneficiary limit
  if (isNewBeneficiary && limit.newBeneficiaryLimit && amount > limit.newBeneficiaryLimit) {
    return {
      allowed: false,
      reason: `New recipient limit: $${(limit.newBeneficiaryLimit).toLocaleString()} for first 24 hours`,
      remainingDaily: limit.newBeneficiaryLimit,
      suggestedAlternatives: [],
    };
  }

  // Check per-transaction limit
  if (amount > limit.perTransaction) {
    const alternatives: Rail[] = [];
    if (amount <= VELOCITY_LIMITS.ach.perTransaction) alternatives.push("ach");
    if (amount >= (VELOCITY_LIMITS.wire.minAmount || 0)) alternatives.push("wire");
    
    return {
      allowed: false,
      reason: `Exceeds ${RAIL_META[rail].label} limit of ${formatUSD(limit.perTransaction)}/txn`,
      suggestedAlternatives: alternatives,
    };
  }

  // Check daily limit
  const projectedDaily = usage.amount + amount;
  if (projectedDaily > limit.daily) {
    const remaining = limit.daily - usage.amount;
    const alternatives: Rail[] = [];
    if (amount <= VELOCITY_LIMITS.ach.daily - USER_DAILY_USAGE.ach.amount) alternatives.push("ach");
    if (amount <= VELOCITY_LIMITS.paypal.daily - USER_DAILY_USAGE.paypal.amount) alternatives.push("paypal");
    if (amount >= (VELOCITY_LIMITS.wire.minAmount || 0)) alternatives.push("wire");

    return {
      allowed: false,
      reason: `Daily limit exceeded. Remaining: ${formatUSD(Math.max(0, remaining))}`,
      remainingDaily: Math.max(0, remaining),
      suggestedAlternatives: alternatives,
    };
  }

  return {
    allowed: true,
    remainingDaily: limit.daily - projectedDaily,
    remainingCount: limit.dailyCount ? limit.dailyCount - usage.count - 1 : undefined,
  };
}

export function computeRouteScore(inst: PaymentInstrument): number {
  let score = inst.successRate;
  if (inst.settlementSpeed === "Instant") score += 5;
  else if (inst.settlementSpeed === "Same-day") score += 3;
  const feeNum = Number.parseFloat(inst.fee.replace(/[^0-9.]/g, "")) || 0;
  if (feeNum === 0) score += 4;
  else if (feeNum < 1) score += 2;
  return Math.min(100, score);
}

// Helper function to format USD currency
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── US contacts with payment instrument portfolios ──────

export const CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Sarah Johnson",
    upa: "linkedin.com/in/sarahjohnson",
    upaType: "linkedin",
    contactType: "person",
    avatar: "bg-chart-1",
    initials: "SJ",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "i1", rail: "venmo", label: "Venmo", detail: "@sarahjohnson", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "i2", rail: "zelle", label: "Zelle", detail: "sarah.j@email.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 98, enabled: true },
      { id: "i3", rail: "ach", label: "Chase Checking", detail: "****4521", routingNumber: "021000021", currency: "USD", settlementSpeed: "1-3 days", fee: "$0", successRate: 98, enabled: true },
      { id: "i4", rail: "cashapp", label: "Cash App", detail: "$sarahj", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 97, enabled: true },
    ],
  },
  {
    id: "c2",
    name: "Michael Chen",
    upa: "@mikechen",
    upaType: "venmo",
    contactType: "person",
    avatar: "bg-success",
    initials: "MC",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "i5", rail: "zelle", label: "Zelle", detail: "+1 (415) 555-0123", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "i6", rail: "venmo", label: "Venmo", detail: "@mikechen", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 98, enabled: true },
      { id: "i7", rail: "ach", label: "Bank of America", detail: "****7710", routingNumber: "026009593", currency: "USD", settlementSpeed: "1-3 days", fee: "$0", successRate: 97, enabled: true },
    ],
  },
  {
    id: "c3",
    name: "Emily Davis",
    upa: "+1 (415) 555-0123",
    upaType: "zelle",
    contactType: "person",
    avatar: "bg-warning",
    initials: "ED",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "i8", rail: "paypal", label: "PayPal", detail: "emily.davis@gmail.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "i9", rail: "zelle", label: "Zelle", detail: "emily.davis@gmail.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 98, enabled: true },
      { id: "i10", rail: "cashapp", label: "Cash App", detail: "$emilyd", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 96, enabled: true },
    ],
  },
  {
    id: "c4",
    name: "James Wilson",
    upa: "+1 (212) 555-0456",
    upaType: "phone",
    contactType: "person",
    avatar: "bg-chart-4",
    initials: "JW",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: false,
    instruments: [
      { id: "i11", rail: "cashapp", label: "Cash App", detail: "$jameswilson", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "i12", rail: "venmo", label: "Venmo", detail: "@jameswilson", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 97, enabled: true },
      { id: "i13", rail: "wire", label: "Wells Fargo", detail: "****6655", routingNumber: "121000248", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 99, enabled: true },
    ],
  },
  {
    id: "c5",
    name: "Ashley Martinez",
    upa: "@ashleymartinez",
    upaType: "username",
    contactType: "person",
    avatar: "bg-chart-5",
    initials: "AM",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: false,
    instruments: [
      { id: "i14", rail: "venmo", label: "Venmo", detail: "@ashleymartinez", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "i15", rail: "applepay", label: "Apple Pay", detail: "ashley***@icloud.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 97, enabled: true },
      { id: "i16", rail: "paypal", label: "PayPal", detail: "ashley.m@gmail.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 96, enabled: true },
    ],
  },
  {
    id: "c6",
    name: "David Thompson",
    upa: "+1 (310) 555-0789",
    upaType: "phone",
    contactType: "person",
    avatar: "bg-accent",
    initials: "DT",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: false,
    instruments: [
      { id: "i17", rail: "zelle", label: "Zelle", detail: "+1 (310) 555-0789", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 98, enabled: true },
      { id: "i18", rail: "ach", label: "Citibank", detail: "****1199", routingNumber: "021000089", currency: "USD", settlementSpeed: "1-3 days", fee: "$0", successRate: 96, enabled: true },
      { id: "i19", rail: "cashapp", label: "Cash App", detail: "$davidthompson", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 95, enabled: true },
    ],
  },
  {
    id: "c7",
    name: "Jessica Brown",
    upa: "+1 (212) 555-0789",
    upaType: "phone",
    contactType: "person",
    avatar: "bg-chart-3",
    initials: "JB",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "i20", rail: "paypal", label: "PayPal", detail: "jessica.brown@outlook.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "i21", rail: "venmo", label: "Venmo", detail: "@jessicabrown", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 97, enabled: true },
      { id: "i22", rail: "applepay", label: "Apple Pay", detail: "jess***@icloud.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 96, enabled: true },
    ],
  },
  // ─── Business / Merchant contacts ─────────────────────────────────
  {
    id: "b1",
    name: "Amazon",
    upa: "payments@amazon.com",
    upaType: "email",
    contactType: "business",
    category: "E-commerce",
    avatar: "bg-chart-1",
    initials: "AZ",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "bi1", rail: "paypal", label: "Amazon Pay", detail: "payments@amazon.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "bi2", rail: "venmo", label: "Venmo", detail: "@amazonpay", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 98, enabled: true },
      { id: "bi3", rail: "ach", label: "Chase Business", detail: "****8821", routingNumber: "021000021", currency: "USD", settlementSpeed: "1-3 days", fee: "$0", successRate: 99, enabled: true },
    ],
  },
  {
    id: "b2",
    name: "DoorDash",
    upa: "@doordash",
    upaType: "username",
    contactType: "business",
    category: "Food Delivery",
    avatar: "bg-warning",
    initials: "DD",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "bi5", rail: "venmo", label: "Venmo", detail: "@doordash", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "bi6", rail: "paypal", label: "PayPal", detail: "pay@doordash.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 98, enabled: true },
      { id: "bi7", rail: "cashapp", label: "Cash App", detail: "$doordash", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 97, enabled: true },
    ],
  },
  {
    id: "b3",
    name: "Uber Eats",
    upa: "@ubereats",
    upaType: "username",
    contactType: "business",
    category: "Food Delivery",
    avatar: "bg-destructive",
    initials: "UE",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: false,
    instruments: [
      { id: "bi8", rail: "paypal", label: "PayPal", detail: "payments@uber.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "bi9", rail: "venmo", label: "Venmo", detail: "@ubereats", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 98, enabled: true },
      { id: "bi10", rail: "applepay", label: "Apple Pay", detail: "uber@applepay", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 96, enabled: true },
    ],
  },
  {
    id: "b4",
    name: "Best Buy",
    upa: "payments@bestbuy.com",
    upaType: "email",
    contactType: "business",
    category: "Electronics",
    avatar: "bg-chart-3",
    initials: "BB",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "bi11", rail: "paypal", label: "PayPal", detail: "payments@bestbuy.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 99, enabled: true },
      { id: "bi12", rail: "ach", label: "Business Account", detail: "****5501", routingNumber: "091000019", currency: "USD", settlementSpeed: "1-3 days", fee: "$0", successRate: 98, enabled: true },
      { id: "bi13", rail: "wire", label: "Wire Transfer", detail: "****5501", routingNumber: "091000019", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 99, enabled: true },
    ],
  },
  {
    id: "b5",
    name: "PG&E",
    upa: "billing@pge.com",
    upaType: "email",
    contactType: "business",
    category: "Utility Bills",
    avatar: "bg-primary",
    initials: "PG",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: false,
    instruments: [
      { id: "bi14", rail: "ach", label: "ACH Payment", detail: "PG&E Billing", currency: "USD", settlementSpeed: "1-3 days", fee: "$0", successRate: 99, enabled: true },
      { id: "bi15", rail: "paypal", label: "PayPal", detail: "billing@pge.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 98, enabled: true },
      { id: "bi16", rail: "zelle", label: "Zelle", detail: "billing@pge.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 97, enabled: true },
    ],
  },
];

// ─── Test transaction history ───────────────────────────────────────

export const TRANSACTIONS: Transaction[] = [
  { id: "t1", contactId: "c1", contactName: "Sarah Johnson", contactInitials: "SJ", contactAvatar: "bg-chart-1", amount: 250.00, currency: "USD", rail: "venmo", railLabel: "Venmo", status: "completed", direction: "sent", timestamp: "2026-02-11T10:30:00Z", note: "Rent share" },
  { id: "t2", contactId: "c2", contactName: "Michael Chen", contactInitials: "MC", contactAvatar: "bg-success", amount: 45.00, currency: "USD", rail: "zelle", railLabel: "Zelle", status: "completed", direction: "received", timestamp: "2026-02-10T15:22:00Z", note: "Dinner split" },
  { id: "t3", contactId: "c3", contactName: "Emily Davis", contactInitials: "ED", contactAvatar: "bg-warning", amount: 120.00, currency: "USD", rail: "cashapp", railLabel: "Cash App", status: "completed", direction: "sent", timestamp: "2026-02-09T09:15:00Z", note: "Birthday gift" },
  { id: "t4", contactId: "c4", contactName: "James Wilson", contactInitials: "JW", contactAvatar: "bg-chart-4", amount: 500.00, currency: "USD", rail: "ach", railLabel: "ACH Transfer", status: "pending", direction: "sent", timestamp: "2026-02-08T14:45:00Z", note: "Freelance payment" },
  { id: "t5", contactId: "c1", contactName: "Sarah Johnson", contactInitials: "SJ", contactAvatar: "bg-chart-1", amount: 75.00, currency: "USD", rail: "paypal", railLabel: "PayPal", status: "completed", direction: "received", timestamp: "2026-02-07T11:00:00Z", note: "Groceries reimbursement" },
  { id: "t6", contactId: "c6", contactName: "David Thompson", contactInitials: "DT", contactAvatar: "bg-accent", amount: 30.00, currency: "USD", rail: "venmo", railLabel: "Venmo", status: "completed", direction: "sent", timestamp: "2026-02-06T08:30:00Z", note: "Coffee" },
  { id: "t7", contactId: "c5", contactName: "Ashley Martinez", contactInitials: "AM", contactAvatar: "bg-chart-5", amount: 150.00, currency: "USD", rail: "applepay", railLabel: "Apple Pay", status: "completed", direction: "received", timestamp: "2026-02-05T22:10:00Z", note: "Gift refund" },
  { id: "t10", contactId: "b1", contactName: "Amazon", contactInitials: "AZ", contactAvatar: "bg-chart-1", amount: 89.99, currency: "USD", rail: "paypal", railLabel: "PayPal", status: "completed", direction: "sent", timestamp: "2026-02-10T18:20:00Z", note: "Electronics order" },
  { id: "t11", contactId: "b2", contactName: "DoorDash", contactInitials: "DD", contactAvatar: "bg-warning", amount: 34.99, currency: "USD", rail: "venmo", railLabel: "Venmo", status: "completed", direction: "sent", timestamp: "2026-02-08T09:00:00Z", note: "Food delivery" },
  { id: "t12", contactId: "b4", contactName: "Best Buy", contactInitials: "BB", contactAvatar: "bg-chart-3", amount: 1249.00, currency: "USD", rail: "ach", railLabel: "ACH Transfer", status: "pending", direction: "sent", timestamp: "2026-02-11T07:30:00Z", note: "Laptop purchase" },
  { id: "t13", contactId: "b3", contactName: "Uber Eats", contactInitials: "UE", contactAvatar: "bg-destructive", amount: 25.60, currency: "USD", rail: "cashapp", railLabel: "Cash App", status: "completed", direction: "sent", timestamp: "2026-02-07T14:10:00Z", note: "Lunch order" },
  { id: "t14", contactId: "b5", contactName: "PG&E", contactInitials: "PG", contactAvatar: "bg-primary", amount: 185.00, currency: "USD", rail: "ach", railLabel: "ACH Transfer", status: "completed", direction: "sent", timestamp: "2026-02-05T10:00:00Z", note: "Electric bill" },
];

// ─── Current user data ──────────────────────────────────────────────

export const CURRENT_USER = {
  name: "Alex Morgan",
  upa: "@alexmorgan",
  phone: "+1 (555) 123-4567",
  initials: "AM",
  balance: 8525.50,
  currency: "USD",
};
