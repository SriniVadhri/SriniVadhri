// ─── Types ──────────────────────────────────────────────────────────

export type Rail =
  | "ach"
  | "wire"
  | "rtp"
  | "card"
  | "a2a"
  | "wallet"
  | "crypto"
  | "mobile_money";

export interface PaymentInstrument {
  id: string;
  rail: Rail;
  label: string;
  detail: string; // masked account
  currency: string;
  settlementSpeed: string;
  fee: string;
  successRate: number; // 0-100
  enabled: boolean;
}

export interface Contact {
  id: string;
  name: string;
  upa: string; // Payment Identity (email, phone, website, or LinkedIn)
  upaType: "email" | "phone" | "website" | "linkedin";
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
  ach: { icon: "Building2", color: "text-chart-1", label: "ACH" },
  wire: { icon: "ArrowRightLeft", color: "text-chart-3", label: "Wire" },
  rtp: { icon: "Zap", color: "text-success", label: "RTP" },
  card: { icon: "CreditCard", color: "text-chart-5", label: "Card" },
  a2a: { icon: "Repeat", color: "text-chart-2", label: "A2A" },
  wallet: { icon: "Wallet", color: "text-chart-4", label: "Wallet" },
  crypto: { icon: "Bitcoin", color: "text-warning", label: "Crypto" },
  mobile_money: { icon: "Phone", color: "text-success", label: "Mobile Money" },
};

export function computeRouteScore(inst: PaymentInstrument): number {
  let score = inst.successRate;
  if (inst.settlementSpeed === "Instant") score += 5;
  else if (inst.settlementSpeed === "Same-day") score += 3;
  const feeNum = Number.parseFloat(inst.fee.replace(/[^0-9.]/g, "")) || 0;
  if (feeNum === 0) score += 4;
  else if (feeNum < 1) score += 2;
  return Math.min(100, score);
}

// ─── Test contacts with payment identity instrument portfolios ──────

export const CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Sarah Chen",
    upa: "sarah.chen@gmail.com",
    upaType: "email",
    contactType: "person",
    avatar: "bg-chart-1",
    initials: "SC",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "i1", rail: "ach", label: "Chase Checking", detail: "****4521", currency: "USD", settlementSpeed: "1-2 days", fee: "$0.00", successRate: 99, enabled: true },
      { id: "i2", rail: "rtp", label: "Chase RTP", detail: "****4521", currency: "USD", settlementSpeed: "Instant", fee: "$0.50", successRate: 98, enabled: true },
      { id: "i3", rail: "card", label: "Visa Debit", detail: "****8832", currency: "USD", settlementSpeed: "Instant", fee: "1.5%", successRate: 97, enabled: true },
      { id: "i4", rail: "wallet", label: "Apple Pay", detail: "sarah***@icloud.com", currency: "USD", settlementSpeed: "Instant", fee: "$0.00", successRate: 96, enabled: true },
    ],
  },
  {
    id: "c2",
    name: "Marcus Johnson",
    upa: "+1 (415) 555-0192",
    upaType: "phone",
    contactType: "person",
    avatar: "bg-success",
    initials: "MJ",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "i5", rail: "rtp", label: "Wells Fargo RTP", detail: "****7710", currency: "USD", settlementSpeed: "Instant", fee: "$0.25", successRate: 99, enabled: true },
      { id: "i6", rail: "ach", label: "Wells Fargo Checking", detail: "****7710", currency: "USD", settlementSpeed: "1-2 days", fee: "$0.00", successRate: 98, enabled: true },
      { id: "i7", rail: "wallet", label: "Google Pay", detail: "marcus***@gmail.com", currency: "USD", settlementSpeed: "Instant", fee: "$0.00", successRate: 97, enabled: true },
    ],
  },
  {
    id: "c3",
    name: "Elena Rodriguez",
    upa: "elena.r@gmail.com",
    upaType: "email",
    contactType: "person",
    avatar: "bg-warning",
    initials: "ER",
    preferredCurrency: "EUR",
    country: "ES",
    verified: true,
    favorite: true,
    instruments: [
      { id: "i8", rail: "a2a", label: "Santander SEPA", detail: "ES****3847", currency: "EUR", settlementSpeed: "Instant", fee: "$0.00", successRate: 99, enabled: true },
      { id: "i9", rail: "wire", label: "Santander SWIFT", detail: "ES****3847", currency: "EUR", settlementSpeed: "1-2 days", fee: "$8.00", successRate: 98, enabled: true },
      { id: "i10", rail: "card", label: "Mastercard", detail: "****2290", currency: "EUR", settlementSpeed: "Instant", fee: "2.1%", successRate: 96, enabled: true },
    ],
  },
  {
    id: "c4",
    name: "Raj Patel",
    upa: "+91 98765 43210",
    upaType: "phone",
    contactType: "person",
    avatar: "bg-chart-4",
    initials: "RP",
    preferredCurrency: "INR",
    country: "IN",
    verified: true,
    favorite: false,
    instruments: [
      { id: "i11", rail: "a2a", label: "HDFC UPI", detail: "raj@hdfc", currency: "INR", settlementSpeed: "Instant", fee: "$0.00", successRate: 99, enabled: true },
      { id: "i12", rail: "wallet", label: "Paytm Wallet", detail: "+91****3210", currency: "INR", settlementSpeed: "Instant", fee: "$0.00", successRate: 97, enabled: true },
      { id: "i13", rail: "wire", label: "HDFC SWIFT", detail: "****6655", currency: "INR", settlementSpeed: "2-3 days", fee: "$15.00", successRate: 95, enabled: true },
    ],
  },
  {
    id: "c5",
    name: "Yuki Tanaka",
    upa: "yuki.tanaka@gmail.com",
    upaType: "email",
    contactType: "person",
    avatar: "bg-chart-5",
    initials: "YT",
    preferredCurrency: "JPY",
    country: "JP",
    verified: true,
    favorite: false,
    instruments: [
      { id: "i14", rail: "a2a", label: "MUFG Zengin", detail: "****8890", currency: "JPY", settlementSpeed: "Instant", fee: "$0.00", successRate: 99, enabled: true },
      { id: "i15", rail: "wire", label: "MUFG SWIFT", detail: "****8890", currency: "JPY", settlementSpeed: "1-2 days", fee: "$12.00", successRate: 97, enabled: true },
      { id: "i16", rail: "crypto", label: "BTC Wallet", detail: "bc1q...x7m3", currency: "BTC", settlementSpeed: "~30 min", fee: "$1.20", successRate: 94, enabled: true },
    ],
  },
  {
    id: "c6",
    name: "Amara Okafor",
    upa: "+234 801 234 5678",
    upaType: "phone",
    contactType: "person",
    avatar: "bg-accent",
    initials: "AO",
    preferredCurrency: "NGN",
    country: "NG",
    verified: true,
    favorite: false,
    instruments: [
      { id: "i17", rail: "mobile_money", label: "MTN Mobile Money", detail: "+234****5678", currency: "NGN", settlementSpeed: "Instant", fee: "$0.00", successRate: 98, enabled: true },
      { id: "i18", rail: "a2a", label: "GTBank", detail: "****1199", currency: "NGN", settlementSpeed: "Instant", fee: "$0.10", successRate: 96, enabled: true },
      { id: "i19", rail: "crypto", label: "USDT Wallet", detail: "0x7f...e2a1", currency: "USDT", settlementSpeed: "Instant", fee: "$0.50", successRate: 95, enabled: true },
    ],
  },
  {
    id: "c7",
    name: "David Kim",
    upa: "linkedin.com/in/davidkim",
    upaType: "linkedin",
    contactType: "person",
    avatar: "bg-chart-3",
    initials: "DK",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "i20", rail: "ach", label: "BoA Checking", detail: "****3392", currency: "USD", settlementSpeed: "1-2 days", fee: "$0.00", successRate: 99, enabled: true },
      { id: "i21", rail: "rtp", label: "BoA RTP", detail: "****3392", currency: "USD", settlementSpeed: "Instant", fee: "$0.50", successRate: 97, enabled: true },
      { id: "i22", rail: "wallet", label: "PayPal", detail: "d.kim***@gmail.com", currency: "USD", settlementSpeed: "Instant", fee: "$0.00", successRate: 96, enabled: true },
    ],
  },
  // ─── Business / Merchant contacts ─────────────────────────────────
  {
    id: "b1",
    name: "NovaTech Store",
    upa: "novatech.store",
    upaType: "website",
    contactType: "business",
    category: "E-commerce",
    avatar: "bg-chart-1",
    initials: "NT",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: true,
    instruments: [
      { id: "bi1", rail: "ach", label: "Stripe Connect", detail: "acct_****n7Tk", currency: "USD", settlementSpeed: "1-2 days", fee: "$0.25", successRate: 99, enabled: true },
      { id: "bi2", rail: "card", label: "Visa/MC Acceptance", detail: "MID ****8821", currency: "USD", settlementSpeed: "Instant", fee: "2.9%", successRate: 98, enabled: true },
      { id: "bi3", rail: "rtp", label: "Chase Commerce", detail: "****6190", currency: "USD", settlementSpeed: "Instant", fee: "$0.50", successRate: 97, enabled: true },
      { id: "bi4", rail: "crypto", label: "USDC Merchant", detail: "0x9a2b...c4d8", currency: "USDC", settlementSpeed: "Instant", fee: "$0.10", successRate: 99, enabled: true },
    ],
  },
  {
    id: "b2",
    name: "CloudSync Pro",
    upa: "billing@cloudsync.io",
    upaType: "email",
    contactType: "business",
    category: "SaaS",
    avatar: "bg-primary",
    initials: "CS",
    preferredCurrency: "USD",
    country: "US",
    verified: true,
    favorite: false,
    instruments: [
      { id: "bi5", rail: "ach", label: "SVB Business", detail: "****2240", currency: "USD", settlementSpeed: "1-2 days", fee: "$0.00", successRate: 98, enabled: true },
      { id: "bi6", rail: "card", label: "Stripe Invoicing", detail: "inv_****pQ3r", currency: "USD", settlementSpeed: "Instant", fee: "2.9%", successRate: 97, enabled: true },
      { id: "bi7", rail: "wire", label: "SVB Business", detail: "****2240", currency: "USD", settlementSpeed: "Same-day", fee: "$12.00", successRate: 99, enabled: true },
    ],
  },
  {
    id: "b3",
    name: "Mercado Express",
    upa: "+52 55 1234 5678",
    upaType: "phone",
    contactType: "business",
    category: "Marketplace",
    avatar: "bg-warning",
    initials: "ME",
    preferredCurrency: "MXN",
    country: "MX",
    verified: true,
    favorite: false,
    instruments: [
      { id: "bi8", rail: "a2a", label: "BBVA Mexico Biz", detail: "MX****7734", currency: "MXN", settlementSpeed: "Instant", fee: "$0.30", successRate: 98, enabled: true },
      { id: "bi9", rail: "wallet", label: "MercadoPago", detail: "merex***@mp.com", currency: "MXN", settlementSpeed: "Instant", fee: "$0.00", successRate: 97, enabled: true },
      { id: "bi10", rail: "card", label: "Visa Business", detail: "****4410", currency: "MXN", settlementSpeed: "Instant", fee: "3.2%", successRate: 95, enabled: true },
    ],
  },
  {
    id: "b4",
    name: "Berlin Roasters GmbH",
    upa: "berlinroasters.de",
    upaType: "website",
    contactType: "business",
    category: "Retail",
    avatar: "bg-chart-3",
    initials: "BR",
    preferredCurrency: "EUR",
    country: "DE",
    verified: true,
    favorite: true,
    instruments: [
      { id: "bi11", rail: "a2a", label: "Deutsche Bank Biz", detail: "DE****9182", currency: "EUR", settlementSpeed: "Instant", fee: "$0.00", successRate: 99, enabled: true },
      { id: "bi12", rail: "card", label: "Adyen Gateway", detail: "MID ****5501", currency: "EUR", settlementSpeed: "Instant", fee: "1.8%", successRate: 98, enabled: true },
      { id: "bi13", rail: "wire", label: "Deutsche Bank Biz", detail: "DE****9182", currency: "EUR", settlementSpeed: "1-2 days", fee: "$8.00", successRate: 99, enabled: true },
    ],
  },
];

// ─── Test transaction history ───────────────────────────────────────

export const TRANSACTIONS: Transaction[] = [
  { id: "t1", contactId: "c1", contactName: "Sarah Chen", contactInitials: "SC", contactAvatar: "bg-chart-1", amount: 250.00, currency: "USD", rail: "rtp", railLabel: "Real-Time Payment", status: "completed", direction: "sent", timestamp: "2026-02-11T10:30:00Z", note: "Rent share" },
  { id: "t2", contactId: "c2", contactName: "Marcus Johnson", contactInitials: "MJ", contactAvatar: "bg-success", amount: 45.00, currency: "USD", rail: "wallet", railLabel: "Google Pay", status: "completed", direction: "received", timestamp: "2026-02-10T15:22:00Z", note: "Dinner split" },
  { id: "t3", contactId: "c3", contactName: "Elena Rodriguez", contactInitials: "ER", contactAvatar: "bg-warning", amount: 120.00, currency: "EUR", rail: "a2a", railLabel: "SEPA Transfer", status: "completed", direction: "sent", timestamp: "2026-02-09T09:15:00Z", note: "Birthday gift" },
  { id: "t4", contactId: "c4", contactName: "Raj Patel", contactInitials: "RP", contactAvatar: "bg-chart-4", amount: 500.00, currency: "INR", rail: "a2a", railLabel: "UPI Transfer", status: "pending", direction: "sent", timestamp: "2026-02-08T14:45:00Z", note: "Freelance payment" },
  { id: "t5", contactId: "c1", contactName: "Sarah Chen", contactInitials: "SC", contactAvatar: "bg-chart-1", amount: 75.00, currency: "USD", rail: "ach", railLabel: "ACH Transfer", status: "completed", direction: "received", timestamp: "2026-02-07T11:00:00Z", note: "Groceries reimbursement" },
  { id: "t6", contactId: "c6", contactName: "Amara Okafor", contactInitials: "AO", contactAvatar: "bg-accent", amount: 30.00, currency: "USD", rail: "mobile_money", railLabel: "MTN Mobile Money", status: "completed", direction: "sent", timestamp: "2026-02-06T08:30:00Z", note: "Family support" },
  { id: "t7", contactId: "c5", contactName: "Yuki Tanaka", contactInitials: "YT", contactAvatar: "bg-chart-5", amount: 0.005, currency: "BTC", rail: "crypto", railLabel: "Bitcoin", status: "completed", direction: "received", timestamp: "2026-02-05T22:10:00Z", note: "Design work" },
  { id: "t10", contactId: "b1", contactName: "NovaTech Store", contactInitials: "NT", contactAvatar: "bg-chart-1", amount: 89.99, currency: "USD", rail: "card", railLabel: "Push to Card", status: "completed", direction: "sent", timestamp: "2026-02-10T18:20:00Z", note: "Wireless charger order" },
  { id: "t11", contactId: "b2", contactName: "CloudSync Pro", contactInitials: "CS", contactAvatar: "bg-primary", amount: 29.00, currency: "USD", rail: "ach", railLabel: "ACH Transfer", status: "completed", direction: "sent", timestamp: "2026-02-08T09:00:00Z", note: "Monthly subscription" },
  { id: "t12", contactId: "b4", contactName: "Berlin Roasters GmbH", contactInitials: "BR", contactAvatar: "bg-chart-3", amount: 42.50, currency: "EUR", rail: "a2a", railLabel: "Account-to-Account", status: "pending", direction: "sent", timestamp: "2026-02-11T07:30:00Z", note: "Coffee bean subscription" },
  { id: "t13", contactId: "b3", contactName: "Mercado Express", contactInitials: "ME", contactAvatar: "bg-warning", amount: 156.00, currency: "USD", rail: "wallet", railLabel: "Digital Wallet", status: "completed", direction: "sent", timestamp: "2026-02-07T14:10:00Z", note: "Marketplace purchase" },
];

// ─── Current user data ──────────────────────────────────────────────

export const CURRENT_USER = {
  name: "Alex Morgan",
  upa: "alex.morgan@gmail.com",
  initials: "AM",
  balance: 4_285.50,
  currency: "USD",
};
