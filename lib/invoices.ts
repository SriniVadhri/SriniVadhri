// ─── Accounts-payable invoices, suppliers, and early-payment discounts ───
// Suppliers invoice in USD. Cross-border suppliers are foreign legal
// entities that bill in USD, so no FX conversion applies — but their
// available rails are narrower (no ACH/Zelle domestic networks).

import type { PaymentInstrument } from "./data";

// Fixed "today" so the seeded demo stays deterministic
export const INVOICE_TODAY = new Date("2026-07-26T00:00:00Z");

export interface SupplierDiscountPolicy {
  // The most the supplier will concede, and the latest they'll still
  // consider "early". Drives their automated counter-offers.
  maxDiscountPercent: number;
  minPayWithinDays: number;
}

export interface InvoiceSupplier {
  id: string;
  name: string;
  legalName: string;
  category: string;
  country: string;
  countryLabel: string;
  crossBorder: boolean;
  initials: string;
  avatar: string;
  verified: boolean;
  discountPolicy: SupplierDiscountPolicy;
  instruments: PaymentInstrument[];
}

export type OfferParty = "supplier" | "payer";

export interface DiscountOffer {
  id: string;
  from: OfferParty;
  discountPercent: number;
  payWithinDays: number; // days from invoice issue date
  message: string;
  at: string; // human-readable timestamp
}

export type NegotiationStatus =
  | "none" // nobody has proposed anything yet
  | "supplier_offered"
  | "payer_countered"
  | "supplier_countered"
  | "accepted"
  | "declined";

export interface Negotiation {
  status: NegotiationStatus;
  offers: DiscountOffer[];
  // Set once terms are agreed
  agreedDiscountPercent?: number;
  agreedPayWithinDays?: number;
}

export type InvoiceStatus = "pending" | "scheduled" | "paid";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  poNumber: string;
  supplierId: string;
  amount: number; // always USD
  issueDate: string; // ISO
  netTerms: number; // days
  description: string;
  status: InvoiceStatus;
  negotiation: Negotiation;
}

// ─── Suppliers ───────────────────────────────────────────────────────────

export const INVOICE_SUPPLIERS: InvoiceSupplier[] = [
  {
    id: "s1",
    name: "Meridian Components",
    legalName: "Meridian Components Inc.",
    category: "Contract Manufacturing",
    country: "US",
    countryLabel: "United States",
    crossBorder: false,
    initials: "MC",
    avatar: "bg-chart-1",
    verified: true,
    discountPolicy: { maxDiscountPercent: 2.5, minPayWithinDays: 7 },
    instruments: [
      { id: "s1i1", rail: "ach", label: "Operating Account", detail: "****4417", routingNumber: "021000021", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 99, enabled: true },
      { id: "s1i2", rail: "wire", label: "Wire Transfer", detail: "****4417", routingNumber: "021000021", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 99, enabled: true },
      { id: "s1i3", rail: "usdc", label: "USDC Treasury", detail: "0x51ba...7d30", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25 + gas", successRate: 100, enabled: true, network: "base" },
    ],
  },
  {
    id: "s2",
    name: "Nordwind Logistik",
    legalName: "Nordwind Logistik GmbH",
    category: "Freight & Logistics",
    country: "DE",
    countryLabel: "Germany",
    crossBorder: true,
    initials: "NL",
    avatar: "bg-chart-3",
    verified: true,
    discountPolicy: { maxDiscountPercent: 1.5, minPayWithinDays: 10 },
    instruments: [
      { id: "s2i1", rail: "wire", label: "SWIFT Wire", detail: "DE89****3000", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 98, enabled: true },
      { id: "s2i2", rail: "usdc", label: "USDC Treasury", detail: "0x9c4e...11af", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25 + gas", successRate: 99, enabled: true, network: "ethereum" },
    ],
  },
  {
    id: "s3",
    name: "Sierra Print Works",
    legalName: "Sierra Print Works LLC",
    category: "Packaging & Print",
    country: "US",
    countryLabel: "United States",
    crossBorder: false,
    initials: "SP",
    avatar: "bg-chart-5",
    verified: true,
    discountPolicy: { maxDiscountPercent: 2, minPayWithinDays: 10 },
    instruments: [
      { id: "s3i1", rail: "ach", label: "Business Checking", detail: "****8802", routingNumber: "111000025", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 98, enabled: true },
      { id: "s3i2", rail: "zelle", label: "Zelle", detail: "ar@sierraprint.com", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 97, enabled: true },
      { id: "s3i3", rail: "wire", label: "Wire Transfer", detail: "****8802", routingNumber: "111000025", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 99, enabled: true },
    ],
  },
  {
    id: "s4",
    name: "Aurora Cloud Systems",
    legalName: "Aurora Cloud Systems Inc.",
    category: "SaaS & IT Services",
    country: "US",
    countryLabel: "United States",
    crossBorder: false,
    initials: "AC",
    avatar: "bg-primary",
    verified: true,
    discountPolicy: { maxDiscountPercent: 3, minPayWithinDays: 5 },
    instruments: [
      { id: "s4i1", rail: "ach", label: "Revenue Account", detail: "****2251", routingNumber: "125000024", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 99, enabled: true },
      { id: "s4i2", rail: "paypal", label: "PayPal Business", detail: "billing@auroracloud.io", currency: "USD", settlementSpeed: "Instant", fee: "$0", successRate: 98, enabled: true },
      { id: "s4i3", rail: "usdc", label: "USDC Treasury", detail: "0x2fd7...aa61", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25 + gas", successRate: 100, enabled: true, network: "base" },
    ],
  },
  {
    id: "s5",
    name: "Kavi Textiles",
    legalName: "Kavi Textiles Pvt Ltd",
    category: "Apparel Manufacturing",
    country: "IN",
    countryLabel: "India",
    crossBorder: true,
    initials: "KT",
    avatar: "bg-chart-4",
    verified: true,
    discountPolicy: { maxDiscountPercent: 2.5, minPayWithinDays: 14 },
    instruments: [
      { id: "s5i1", rail: "wire", label: "SWIFT Wire", detail: "IN45****9011", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 97, enabled: true },
      { id: "s5i2", rail: "usdc", label: "USDC Treasury", detail: "0x77e1...c204", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25 + gas", successRate: 99, enabled: true, network: "polygon" },
    ],
  },
  {
    id: "s6",
    name: "Grupo Ferreira",
    legalName: "Grupo Ferreira S.A. de C.V.",
    category: "Industrial Parts",
    country: "MX",
    countryLabel: "Mexico",
    crossBorder: true,
    initials: "GF",
    avatar: "bg-chart-2",
    verified: true,
    discountPolicy: { maxDiscountPercent: 2, minPayWithinDays: 7 },
    instruments: [
      { id: "s6i1", rail: "wire", label: "SWIFT Wire", detail: "MX02****4471", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 97, enabled: true },
      { id: "s6i2", rail: "usdc", label: "USDC Treasury", detail: "8kJq...V2mR", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25 + gas", successRate: 99, enabled: true, network: "solana" },
    ],
  },
  {
    id: "s7",
    name: "Thistle & Crown",
    legalName: "Thistle & Crown Ltd",
    category: "Design Agency",
    country: "GB",
    countryLabel: "United Kingdom",
    crossBorder: true,
    initials: "TC",
    avatar: "bg-chart-3",
    verified: false,
    discountPolicy: { maxDiscountPercent: 1, minPayWithinDays: 10 },
    instruments: [
      { id: "s7i1", rail: "wire", label: "SWIFT Wire", detail: "GB29****6819", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 98, enabled: true },
      { id: "s7i2", rail: "usdc", label: "USDC Treasury", detail: "0xe340...5b7c", currency: "USDC", settlementSpeed: "Seconds", fee: "$0.25 + gas", successRate: 99, enabled: true, network: "arbitrum" },
    ],
  },
  {
    id: "s8",
    name: "Copper Ridge Freight",
    legalName: "Copper Ridge Freight Co.",
    category: "Trucking & Haulage",
    country: "US",
    countryLabel: "United States",
    crossBorder: false,
    initials: "CR",
    avatar: "bg-chart-5",
    verified: true,
    discountPolicy: { maxDiscountPercent: 1, minPayWithinDays: 5 },
    instruments: [
      { id: "s8i1", rail: "ach", label: "Business Checking", detail: "****6033", routingNumber: "071000013", currency: "USD", settlementSpeed: "1-3 days", fee: "$0.80", successRate: 98, enabled: true },
      { id: "s8i2", rail: "wire", label: "Wire Transfer", detail: "****6033", routingNumber: "071000013", currency: "USD", settlementSpeed: "Same-day", fee: "$25", successRate: 99, enabled: true },
    ],
  },
];

export function getSupplier(supplierId: string): InvoiceSupplier {
  const s = INVOICE_SUPPLIERS.find((x) => x.id === supplierId);
  if (!s) throw new Error(`Unknown supplier: ${supplierId}`);
  return s;
}

// ─── Invoices, seeded across every negotiation state ─────────────────────

export const INVOICES: Invoice[] = [
  {
    id: "inv1",
    invoiceNumber: "INV-2047",
    poNumber: "PO-88123",
    supplierId: "s1",
    amount: 48750,
    issueDate: "2026-07-18",
    netTerms: 30,
    description: "CNC machined housings — production run 4B",
    status: "pending",
    negotiation: {
      status: "supplier_offered",
      offers: [
        {
          id: "o1",
          from: "supplier",
          discountPercent: 2,
          payWithinDays: 10,
          message:
            "Standard 2/10 Net 30 on this run. Happy to lock it in if you can clear by the 28th.",
          at: "Jul 18, 9:12 AM",
        },
      ],
    },
  },
  {
    id: "inv2",
    invoiceNumber: "INV-8891",
    poNumber: "PO-88140",
    supplierId: "s2",
    amount: 126400,
    issueDate: "2026-07-11",
    netTerms: 45,
    description: "Ocean freight + customs brokerage, Hamburg to Newark",
    status: "pending",
    negotiation: { status: "none", offers: [] },
  },
  {
    id: "inv3",
    invoiceNumber: "INV-3312",
    poNumber: "PO-87995",
    supplierId: "s3",
    amount: 7280,
    issueDate: "2026-07-21",
    netTerms: 30,
    description: "Retail carton printing, 12k units",
    status: "pending",
    negotiation: {
      status: "accepted",
      agreedDiscountPercent: 1.5,
      agreedPayWithinDays: 15,
      offers: [
        {
          id: "o2",
          from: "supplier",
          discountPercent: 1,
          payWithinDays: 10,
          message: "We can do 1% off if you pay inside 10 days.",
          at: "Jul 21, 2:40 PM",
        },
        {
          id: "o3",
          from: "payer",
          discountPercent: 1.5,
          payWithinDays: 15,
          message:
            "Can you stretch to 1.5%? We'd commit to a 15-day clear, which is still 15 days early.",
          at: "Jul 22, 10:05 AM",
        },
        {
          id: "o4",
          from: "supplier",
          discountPercent: 1.5,
          payWithinDays: 15,
          message: "That works. 1.5% at 15 days — accepted.",
          at: "Jul 22, 4:18 PM",
        },
      ],
    },
  },
  {
    id: "inv4",
    invoiceNumber: "INV-5504",
    poNumber: "PO-88066",
    supplierId: "s4",
    amount: 22000,
    issueDate: "2026-07-09",
    netTerms: 60,
    description: "Annual platform licence, tier 3 — Q3 instalment",
    status: "pending",
    negotiation: {
      status: "payer_countered",
      offers: [
        {
          id: "o5",
          from: "supplier",
          discountPercent: 1.5,
          payWithinDays: 15,
          message: "1.5% if settled within 15 days of issue.",
          at: "Jul 9, 8:30 AM",
        },
        {
          id: "o6",
          from: "payer",
          discountPercent: 2.75,
          payWithinDays: 7,
          message:
            "We can move much faster than 15 days — 7-day clear via USDC. Worth 2.75% to us.",
          at: "Jul 10, 11:52 AM",
        },
      ],
    },
  },
  {
    id: "inv5",
    invoiceNumber: "INV-7719",
    poNumber: "PO-87902",
    supplierId: "s5",
    amount: 89300,
    issueDate: "2026-07-22",
    netTerms: 60,
    description: "Knit goods, SS27 sampling + first bulk tranche",
    status: "pending",
    negotiation: {
      status: "supplier_countered",
      offers: [
        {
          id: "o7",
          from: "payer",
          discountPercent: 3,
          payWithinDays: 10,
          message:
            "Opening ask: 3% for a 10-day clear. We can fund same-week on stablecoin.",
          at: "Jul 22, 7:15 AM",
        },
        {
          id: "o8",
          from: "supplier",
          discountPercent: 2.5,
          payWithinDays: 14,
          message:
            "3% is past our floor with freight where it is. Best we can do is 2.5% at 14 days.",
          at: "Jul 23, 6:02 AM",
        },
      ],
    },
  },
  {
    id: "inv6",
    invoiceNumber: "INV-1120",
    poNumber: "PO-88171",
    supplierId: "s6",
    amount: 34850,
    issueDate: "2026-07-23",
    netTerms: 30,
    description: "Hydraulic fittings and seals, lot 22",
    status: "pending",
    negotiation: {
      status: "supplier_offered",
      offers: [
        {
          id: "o9",
          from: "supplier",
          discountPercent: 1,
          payWithinDays: 10,
          message: "1/10 Net 30 available on this lot.",
          at: "Jul 23, 12:20 PM",
        },
      ],
    },
  },
  {
    id: "inv7",
    invoiceNumber: "INV-6643",
    poNumber: "PO-88155",
    supplierId: "s7",
    amount: 15600,
    issueDate: "2026-07-24",
    netTerms: 30,
    description: "Brand refresh — phase 2 deliverables",
    status: "pending",
    negotiation: { status: "none", offers: [] },
  },
  {
    id: "inv8",
    invoiceNumber: "INV-9087",
    poNumber: "PO-88110",
    supplierId: "s8",
    amount: 12940,
    issueDate: "2026-07-19",
    netTerms: 15,
    description: "Regional LTL haulage, weeks 27-28",
    status: "pending",
    negotiation: {
      status: "declined",
      offers: [
        {
          id: "o10",
          from: "payer",
          discountPercent: 2,
          payWithinDays: 5,
          message: "Would you take 2% for a 5-day clear?",
          at: "Jul 19, 3:44 PM",
        },
        {
          id: "o11",
          from: "supplier",
          discountPercent: 0,
          payWithinDays: 15,
          message:
            "We're already on Net 15 — margins here don't support 2%. We'll pass and take the full amount at term.",
          at: "Jul 20, 8:09 AM",
        },
      ],
    },
  },
  {
    id: "inv9",
    invoiceNumber: "INV-4471",
    poNumber: "PO-88188",
    supplierId: "s1",
    amount: 61200,
    issueDate: "2026-07-25",
    netTerms: 45,
    description: "Aluminium extrusion, framing kits Q3",
    status: "pending",
    negotiation: { status: "none", offers: [] },
  },
];

// ─── Date helpers ────────────────────────────────────────────────────────

export function getDueDate(invoice: Invoice): Date {
  const d = new Date(invoice.issueDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + invoice.netTerms);
  return d;
}

export function getDaysUntilDue(invoice: Invoice): number {
  const due = getDueDate(invoice);
  return Math.round(
    (due.getTime() - INVOICE_TODAY.getTime()) / (1000 * 60 * 60 * 24)
  );
}

// Deadline to earn a discount that requires paying within `payWithinDays`
// of issue, expressed as days from today. Negative means the window closed.
export function getDiscountWindowDaysLeft(
  invoice: Invoice,
  payWithinDays: number
): number {
  const deadline = new Date(invoice.issueDate + "T00:00:00Z");
  deadline.setUTCDate(deadline.getUTCDate() + payWithinDays);
  return Math.round(
    (deadline.getTime() - INVOICE_TODAY.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso + "T00:00:00Z") : iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ─── Discount math ───────────────────────────────────────────────────────

export interface DiscountTerms {
  discountPercent: number;
  payWithinDays: number;
  discountAmount: number;
  netPayable: number;
  daysAccelerated: number; // vs. paying at full term
  windowDaysLeft: number;
}

export function computeDiscountTerms(
  invoice: Invoice,
  discountPercent: number,
  payWithinDays: number
): DiscountTerms {
  const discountAmount =
    Math.round(invoice.amount * (discountPercent / 100) * 100) / 100;
  return {
    discountPercent,
    payWithinDays,
    discountAmount,
    netPayable: Math.round((invoice.amount - discountAmount) * 100) / 100,
    daysAccelerated: invoice.netTerms - payWithinDays,
    windowDaysLeft: getDiscountWindowDaysLeft(invoice, payWithinDays),
  };
}

// The offer currently on the table, whoever made it
export function getLatestOffer(invoice: Invoice): DiscountOffer | null {
  const { offers } = invoice.negotiation;
  return offers.length > 0 ? offers[offers.length - 1] : null;
}

// Terms in force if the negotiation settled, else null
export function getAgreedTerms(invoice: Invoice): DiscountTerms | null {
  const { status, agreedDiscountPercent, agreedPayWithinDays } =
    invoice.negotiation;
  if (
    status !== "accepted" ||
    agreedDiscountPercent === undefined ||
    agreedPayWithinDays === undefined
  ) {
    return null;
  }
  return computeDiscountTerms(
    invoice,
    agreedDiscountPercent,
    agreedPayWithinDays
  );
}

// What the payer would actually remit right now
export function getPayableAmount(invoice: Invoice): number {
  const agreed = getAgreedTerms(invoice);
  return agreed ? agreed.netPayable : invoice.amount;
}

// ─── Supplier auto-response ──────────────────────────────────────────────

export interface SupplierResponse {
  action: "accept" | "counter" | "decline";
  discountPercent: number;
  payWithinDays: number;
  message: string;
}

// Models the payee side of the back-and-forth: they accept anything inside
// their policy, counter at their limit when the ask is close, and walk away
// when it is far past what the margin supports.
export function computeSupplierResponse(
  invoice: Invoice,
  askDiscountPercent: number,
  askPayWithinDays: number
): SupplierResponse {
  const supplier = getSupplier(invoice.supplierId);
  const { maxDiscountPercent, minPayWithinDays } = supplier.discountPolicy;

  const withinRate = askDiscountPercent <= maxDiscountPercent;
  const withinTiming = askPayWithinDays >= minPayWithinDays;

  if (withinRate && withinTiming) {
    return {
      action: "accept",
      discountPercent: askDiscountPercent,
      payWithinDays: askPayWithinDays,
      message: `${askDiscountPercent}% at ${askPayWithinDays} days works on our side — accepted.`,
    };
  }

  // Far past the floor: the discount costs more than the cash is worth
  if (askDiscountPercent > maxDiscountPercent + 1.5) {
    return {
      action: "decline",
      discountPercent: 0,
      payWithinDays: invoice.netTerms,
      message: `${askDiscountPercent}% is well past what we can absorb on this invoice. We'll take the full amount at Net ${invoice.netTerms}.`,
    };
  }

  const counterRate = Math.min(askDiscountPercent, maxDiscountPercent);
  const counterDays = Math.max(askPayWithinDays, minPayWithinDays);
  const reason = !withinRate
    ? `${askDiscountPercent}% is past our floor`
    : `we need at least ${minPayWithinDays} days to process`;

  return {
    action: "counter",
    discountPercent: counterRate,
    payWithinDays: counterDays,
    message: `${reason} — we can do ${counterRate}% if you clear within ${counterDays} days.`,
  };
}

export function formatOfferTimestamp(): string {
  return INVOICE_TODAY.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
