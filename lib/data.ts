// ─── Types ──────────────────────────────────────────────────────────

export type Rail =
  | "venmo"
  | "cashapp"
  | "zelle"
  | "paypal"
  | "ach"
  | "wire"
  | "applepay"
  | "bank"
  | "usdc";

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
  usdc: { icon: "Coins", color: "text-chart-2", label: "USDC" },
};

// ─── Transaction Costs (US Payment Systems) ────────────────────────────

// How the sender funds the payment. Card funding is materially more
// expensive than pulling from a bank account over ACH.
export type FundingSource = "bank" | "debit" | "credit";

export const FUNDING_SOURCE_META: Record<
  FundingSource,
  { label: string; shortLabel: string; description: string }
> = {
  bank: {
    label: "Bank account (ACH)",
    shortLabel: "Bank / ACH",
    description: "Pulled from your linked checking account",
  },
  debit: {
    label: "Debit card",
    shortLabel: "Debit card",
    description: "Instant funding from your debit card",
  },
  credit: {
    label: "Credit card",
    shortLabel: "Credit card",
    description: "Highest cost — interchange is passed through",
  },
};

export interface TransactionCost {
  userFee: string; // Headline fee summary
  merchantMDR?: string; // Merchant Discount Rate (for P2M)
  feeDetails: string; // Detailed explanation
  taxApplicable: boolean;
  supportedFunding: FundingSource[]; // Funding sources this rail accepts
  // Percentage + fixed component charged to the sender, per funding source
  feeSchedule: Record<FundingSource, { percent: number; fixed: number; min?: number; max?: number }>;
  calculateFee: (amount: number, isP2M: boolean, funding?: FundingSource) => number;
}

// Shared fee math so every rail applies percent/fixed/min/max the same way
function applySchedule(
  schedule: { percent: number; fixed: number; min?: number; max?: number },
  amount: number
): number {
  if (schedule.percent === 0 && schedule.fixed === 0) return 0;
  let fee = (amount * schedule.percent) / 100 + schedule.fixed;
  if (schedule.min !== undefined) fee = Math.max(fee, schedule.min);
  if (schedule.max !== undefined) fee = Math.min(fee, schedule.max);
  return Math.round(fee * 100) / 100;
}

function makeCalculateFee(
  feeSchedule: TransactionCost["feeSchedule"],
  supportedFunding: FundingSource[]
): TransactionCost["calculateFee"] {
  return (amount: number, _isP2M: boolean, funding: FundingSource = "bank") => {
    const effective = supportedFunding.includes(funding) ? funding : supportedFunding[0];
    return applySchedule(feeSchedule[effective], amount);
  };
}

const RAIL_FEE_SCHEDULES: Record<
  Rail,
  { supportedFunding: FundingSource[]; feeSchedule: TransactionCost["feeSchedule"] }
> = {
  venmo: {
    supportedFunding: ["bank", "debit", "credit"],
    feeSchedule: {
      bank: { percent: 0, fixed: 0 },
      debit: { percent: 0, fixed: 0 },
      credit: { percent: 3, fixed: 0 },
    },
  },
  cashapp: {
    supportedFunding: ["bank", "debit", "credit"],
    feeSchedule: {
      bank: { percent: 0, fixed: 0 },
      debit: { percent: 0, fixed: 0 },
      credit: { percent: 3, fixed: 0 },
    },
  },
  zelle: {
    // Zelle is bank-to-bank only; cards are not supported at all
    supportedFunding: ["bank"],
    feeSchedule: {
      bank: { percent: 0, fixed: 0 },
      debit: { percent: 0, fixed: 0 },
      credit: { percent: 0, fixed: 0 },
    },
  },
  paypal: {
    supportedFunding: ["bank", "debit", "credit"],
    feeSchedule: {
      bank: { percent: 0, fixed: 0 },
      debit: { percent: 2.9, fixed: 0.3 },
      credit: { percent: 2.9, fixed: 0.3 },
    },
  },
  applepay: {
    supportedFunding: ["debit", "credit"],
    feeSchedule: {
      bank: { percent: 0, fixed: 0 },
      debit: { percent: 0, fixed: 0 },
      credit: { percent: 3, fixed: 0, min: 0.25 },
    },
  },
  ach: {
    // ACH debit only — a card can never fund an ACH transfer
    supportedFunding: ["bank"],
    feeSchedule: {
      bank: { percent: 0, fixed: 0.8 },
      debit: { percent: 0, fixed: 0.8 },
      credit: { percent: 0, fixed: 0.8 },
    },
  },
  wire: {
    supportedFunding: ["bank"],
    feeSchedule: {
      bank: { percent: 0, fixed: 25 },
      debit: { percent: 0, fixed: 25 },
      credit: { percent: 0, fixed: 25 },
    },
  },
  bank: {
    supportedFunding: ["bank"],
    feeSchedule: {
      bank: { percent: 0, fixed: 0.8 },
      debit: { percent: 0, fixed: 0.8 },
      credit: { percent: 0, fixed: 0.8 },
    },
  },
  usdc: {
    // Stablecoin payout. Bank funding is a cheap on-ramp; cards pay
    // card-network interchange on top of the network fee.
    supportedFunding: ["bank", "debit", "credit"],
    feeSchedule: {
      bank: { percent: 0, fixed: 0.25 },
      debit: { percent: 1.5, fixed: 0.25 },
      credit: { percent: 2.5, fixed: 0.25 },
    },
  },
};

export const TRANSACTION_COSTS: Record<Rail, TransactionCost> = {
  venmo: {
    userFee: "Free from bank/debit · 3% on credit card",
    merchantMDR: "1.9% + $0.10",
    feeDetails:
      "Free when funded by your bank account or debit card. Credit card funding adds a flat 3% of the transfer amount. Instant payout to a bank costs 1.75% separately.",
    taxApplicable: false,
    ...RAIL_FEE_SCHEDULES.venmo,
    calculateFee: makeCalculateFee(
      RAIL_FEE_SCHEDULES.venmo.feeSchedule,
      RAIL_FEE_SCHEDULES.venmo.supportedFunding
    ),
  },
  cashapp: {
    userFee: "Free from bank/debit · 3% on credit card",
    merchantMDR: "2.75%",
    feeDetails:
      "Standard transfers from bank or debit are free. Credit card funding adds 3%. Instant deposit to a linked bank costs 0.5%-1.75% separately.",
    taxApplicable: false,
    ...RAIL_FEE_SCHEDULES.cashapp,
    calculateFee: makeCalculateFee(
      RAIL_FEE_SCHEDULES.cashapp.feeSchedule,
      RAIL_FEE_SCHEDULES.cashapp.supportedFunding
    ),
  },
  zelle: {
    userFee: "Always free — bank funded only",
    merchantMDR: "N/A",
    feeDetails:
      "Zelle moves money directly between enrolled bank accounts, so there is no card option and no sender fee. Settlement is typically within minutes.",
    taxApplicable: false,
    ...RAIL_FEE_SCHEDULES.zelle,
    calculateFee: makeCalculateFee(
      RAIL_FEE_SCHEDULES.zelle.feeSchedule,
      RAIL_FEE_SCHEDULES.zelle.supportedFunding
    ),
  },
  paypal: {
    userFee: "Free from bank · 2.9% + $0.30 on cards",
    merchantMDR: "2.9% + $0.30",
    feeDetails:
      "Free when funded by PayPal balance or a linked bank. Debit and credit card funding costs 2.9% of the amount plus a $0.30 fixed fee.",
    taxApplicable: false,
    ...RAIL_FEE_SCHEDULES.paypal,
    calculateFee: makeCalculateFee(
      RAIL_FEE_SCHEDULES.paypal.feeSchedule,
      RAIL_FEE_SCHEDULES.paypal.supportedFunding
    ),
  },
  applepay: {
    userFee: "Free on debit · 3% on credit card",
    merchantMDR: "Varies by processor",
    feeDetails:
      "Apple Cash is funded by a card, not ACH. Debit funding is free; credit card funding costs 3% (minimum $0.25).",
    taxApplicable: false,
    ...RAIL_FEE_SCHEDULES.applepay,
    calculateFee: makeCalculateFee(
      RAIL_FEE_SCHEDULES.applepay.feeSchedule,
      RAIL_FEE_SCHEDULES.applepay.supportedFunding
    ),
  },
  ach: {
    userFee: "$0.80 flat — no card funding",
    merchantMDR: "N/A",
    feeDetails:
      "ACH is a flat $0.80 per transfer regardless of amount, which makes it the cheapest option for large payments. Cards cannot fund an ACH debit. Settles in 1-3 business days.",
    taxApplicable: false,
    ...RAIL_FEE_SCHEDULES.ach,
    calculateFee: makeCalculateFee(
      RAIL_FEE_SCHEDULES.ach.feeSchedule,
      RAIL_FEE_SCHEDULES.ach.supportedFunding
    ),
  },
  wire: {
    userFee: "$25 flat — no card funding",
    merchantMDR: "N/A",
    feeDetails:
      "Domestic wires are a flat $25 debited from your bank account. Cards cannot fund a wire. Same-day settlement via Fedwire.",
    taxApplicable: false,
    ...RAIL_FEE_SCHEDULES.wire,
    calculateFee: makeCalculateFee(
      RAIL_FEE_SCHEDULES.wire.feeSchedule,
      RAIL_FEE_SCHEDULES.wire.supportedFunding
    ),
  },
  bank: {
    userFee: "$0.80 flat — no card funding",
    merchantMDR: "N/A",
    feeDetails:
      "Standard bank transfer priced like ACH at a flat $0.80 per transfer. Cards are not accepted as a funding source.",
    taxApplicable: false,
    ...RAIL_FEE_SCHEDULES.bank,
    calculateFee: makeCalculateFee(
      RAIL_FEE_SCHEDULES.bank.feeSchedule,
      RAIL_FEE_SCHEDULES.bank.supportedFunding
    ),
  },
  usdc: {
    userFee: "$0.25 from bank · 1.5-2.5% on cards",
    merchantMDR: "0.5%",
    feeDetails:
      "USDC settles on-chain in seconds, 24/7 including weekends. Funding from your bank costs a flat $0.25 network fee. Card on-ramps add 1.5% (debit) or 2.5% (credit) on top. The recipient receives USDC 1:1 with USD.",
    taxApplicable: false,
    ...RAIL_FEE_SCHEDULES.usdc,
    calculateFee: makeCalculateFee(
      RAIL_FEE_SCHEDULES.usdc.feeSchedule,
      RAIL_FEE_SCHEDULES.usdc.supportedFunding
    ),
  },
};

// True when the rail can be funded by the chosen source (Zelle/ACH/wire reject cards)
export function railSupportsFunding(rail: Rail, funding: FundingSource): boolean {
  return TRANSACTION_COSTS[rail].supportedFunding.includes(funding);
}

// The funding source a rail will actually use, given the sender's preference
export function resolveFundingSource(rail: Rail, funding: FundingSource): FundingSource {
  const supported = TRANSACTION_COSTS[rail].supportedFunding;
  return supported.includes(funding) ? funding : supported[0];
}

// Helper function to get formatted fee string
export function getTransactionFeeDisplay(
  rail: Rail,
  amount: number,
  isP2M: boolean = false,
  funding: FundingSource = "bank"
): string {
  const cost = TRANSACTION_COSTS[rail];
  const calculatedFee = cost.calculateFee(amount, isP2M, funding);

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
  usdc: {
    perTransaction: 50000,
    daily: 100000,
    newBeneficiaryLimit: 2500, // wallet address cooling-off period
    description: "USDC: Max $50K/txn, $100K/day — settles 24/7 on-chain",
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
  usdc: { amount: 0, count: 0 },
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

// ─── Routing Agent scoring ──────────────────────────────────────────────
// Reliability (observed success rate) is the dominant factor, then speed,
// then the real cost of the transfer for this amount + funding source.
export const SCORE_WEIGHTS = {
  reliability: 60,
  speed: 25,
  cost: 15,
} as const;

// Card-funded transfers see more issuer declines and 3DS drop-off than a
// direct bank debit, so the effective success rate depends on funding.
const FUNDING_SUCCESS_DELTA: Record<FundingSource, number> = {
  bank: 0,
  debit: -0.8,
  credit: -2.5,
};

// Fraction of the speed weight each settlement window earns
const SPEED_FACTORS: Record<string, number> = {
  Instant: 1,
  "Seconds": 1,
  "Same-day": 0.7,
  "1-3 days": 0.4,
};

export interface RouteScoreBreakdown {
  score: number;
  successRate: number; // effective success rate for this funding source
  reliabilityPoints: number;
  speedPoints: number;
  costPoints: number;
  fee: number;
  fundingPenalty: number;
}

// The success rate the Routing Agent actually expects, given how the
// sender is funding the payment.
export function getEffectiveSuccessRate(
  inst: PaymentInstrument,
  funding: FundingSource = "bank"
): number {
  const effective = resolveFundingSource(inst.rail, funding);
  const rate = inst.successRate + FUNDING_SUCCESS_DELTA[effective];
  return Math.max(0, Math.min(100, Math.round(rate * 10) / 10));
}

export function computeRouteScoreBreakdown(
  inst: PaymentInstrument,
  amount = 0,
  funding: FundingSource = "bank"
): RouteScoreBreakdown {
  const successRate = getEffectiveSuccessRate(inst, funding);

  // Reliability dominates the score and is driven entirely by success rate
  const reliabilityPoints = (successRate / 100) * SCORE_WEIGHTS.reliability;

  const speedPoints =
    (SPEED_FACTORS[inst.settlementSpeed] ?? 0.3) * SCORE_WEIGHTS.speed;

  // Cost is judged as a share of the amount being sent, so a $25 wire fee
  // barely dents a $50K transfer but tanks a $200 one.
  const fee =
    amount > 0
      ? TRANSACTION_COSTS[inst.rail].calculateFee(amount, false, funding)
      : Number.parseFloat(inst.fee.replace(/[^0-9.]/g, "")) || 0;
  const feeRatio = amount > 0 ? fee / amount : fee > 0 ? 0.02 : 0;

  let costFactor: number;
  if (fee === 0) costFactor = 1;
  else if (feeRatio <= 0.001) costFactor = 0.9;
  else if (feeRatio <= 0.005) costFactor = 0.7;
  else if (feeRatio <= 0.01) costFactor = 0.5;
  else if (feeRatio <= 0.03) costFactor = 0.25;
  else costFactor = 0;
  const costPoints = costFactor * SCORE_WEIGHTS.cost;

  // Rails that cannot accept the sender's funding source lose points
  const fundingPenalty = railSupportsFunding(inst.rail, funding) ? 0 : 8;

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(reliabilityPoints + speedPoints + costPoints - fundingPenalty)
    )
  );

  return {
    score,
    successRate,
    reliabilityPoints: Math.round(reliabilityPoints),
    speedPoints: Math.round(speedPoints),
    costPoints: Math.round(costPoints),
    fee,
    fundingPenalty,
  };
}

export function computeRouteScore(
  inst: PaymentInstrument,
  amount = 0,
  funding: FundingSource = "bank"
): number {
  return computeRouteScoreBreakdown(inst, amount, funding).score;
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
      { id: "i3", rail: "ach", label: "Chase Checking", detail: "****4521", routingNumber: "021000021", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 98, enabled: true },
      { id: "i4", rail: "cashapp", label: "Cash App", detail: "$sarahj", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 97, enabled: true },
      { id: "i4b", rail: "usdc", label: "USDC Wallet", detail: "0x7a2f...4c91", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25", successRate: 99, enabled: true },
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
      { id: "i7", rail: "ach", label: "Bank of America", detail: "****7710", routingNumber: "026009593", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 97, enabled: true },
      { id: "i7b", rail: "usdc", label: "USDC Wallet", detail: "mikechen.eth", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25", successRate: 100, enabled: true },
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
      { id: "i10b", rail: "usdc", label: "USDC Wallet", detail: "0xb14c...9f02", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25", successRate: 98, enabled: true },
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
      { id: "i13b", rail: "usdc", label: "USDC Wallet", detail: "0x3e8d...1b47", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25", successRate: 99, enabled: true },
    ],
  },
  {
    id: "c5",
    name: "Ashley Martinez",
    upa: "@ashleymartinez",
    upaType: "venmo",
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
      { id: "i18", rail: "ach", label: "Citibank", detail: "****1199", routingNumber: "021000089", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 96, enabled: true },
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
  // ─── Business / Merchant contacts ─────────────────────────���───────
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
      { id: "bi3", rail: "ach", label: "Chase Business", detail: "****8821", routingNumber: "021000021", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 99, enabled: true },
      { id: "bi3b", rail: "usdc", label: "USDC Treasury", detail: "0xa9f1...20de", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25", successRate: 100, enabled: true },
    ],
  },
  {
    id: "b2",
    name: "DoorDash",
    upa: "@doordash",
    upaType: "venmo",
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
    upaType: "venmo",
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
      { id: "bi12", rail: "ach", label: "Business Account", detail: "****5501", routingNumber: "091000019", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 98, enabled: true },
      { id: "bi13", rail: "wire", label: "Wire Transfer", detail: "****5501", routingNumber: "091000019", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 99, enabled: true },
      { id: "bi13b", rail: "usdc", label: "USDC Treasury", detail: "0xc027...5a83", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25", successRate: 99, enabled: true },
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
      { id: "bi14", rail: "ach", label: "ACH Payment", detail: "PG&E Billing", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 99, enabled: true },
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
