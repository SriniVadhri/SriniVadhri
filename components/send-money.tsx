"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  CONTACTS,
  RAIL_META,
  VELOCITY_LIMITS,
  TRANSACTION_COSTS,
  computeRouteScore,
  formatUSD,
  checkVelocityLimit,
  getTransactionFeeDisplay,
  type Contact,
  type PaymentInstrument,
  type Rail,
} from "@/lib/data";
import {
  ArrowLeft,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  ChevronRight,
  Zap,
  Building2,
  ArrowRightLeft,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle2,
  Sparkles,
  Clock,
  DollarSign,
  TrendingUp,
  X,
  Loader2,
  Store,
  AlertTriangle,
  Info,
  AtSign,
  Linkedin,
} from "lucide-react";

const RAIL_ICONS: Record<string, typeof Zap> = {
  venmo: Wallet,
  cashapp: Zap,
  zelle: Smartphone,
  paypal: Wallet,
  ach: Building2,
  wire: ArrowRightLeft,
  applepay: Wallet,
  bank: Building2,
};

type Step = "search" | "amount" | "rail" | "confirm" | "success";

interface Props {
  initialContactId?: string | null;
  onBack: () => void;
}

export function SendMoney({ initialContactId, onBack }: Props) {
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedInstrument, setSelectedInstrument] =
    useState<PaymentInstrument | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  // Search / filter contacts
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return CONTACTS;
    const q = searchQuery.toLowerCase();
    return CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.upa.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const handleSelectContact = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setStep("amount");
  }, []);

  // Auto-select contact if coming from Quick Send
  useEffect(() => {
    if (initialContactId) {
      const c = CONTACTS.find((x) => x.id === initialContactId);
      if (c) handleSelectContact(c);
    }
  }, [initialContactId, handleSelectContact]);

  // Sort instruments by AI score
  const sortedInstruments = useMemo(() => {
    if (!selectedContact) return [];
    return [...selectedContact.instruments]
      .filter((i) => i.enabled)
      .sort((a, b) => computeRouteScore(b) - computeRouteScore(a));
  }, [selectedContact]);

  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSending(false);
    setStep("success");
  };

  const reset = () => {
    setStep("search");
    setSearchQuery("");
    setSelectedContact(null);
    setAmount("");
    setSelectedInstrument(null);
    setNote("");
  };

  // ─── STEP: Search ─────────────────────────────────────────────────
  if (step === "search") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-sm transition-transform active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Send Money</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Name, username, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <p className="text-xs font-medium text-muted-foreground">
          {searchQuery
            ? `${filtered.length} results`
            : `${filtered.filter((c) => c.contactType === "person").length} identities, ${filtered.filter((c) => c.contactType === "business").length} businesses`}
        </p>

        {/* Contact List */}
        <div className="flex flex-col gap-1">
          {filtered.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => handleSelectContact(contact)}
              className="flex items-center gap-3 rounded-xl bg-card p-3 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
            >
              <div
                className={cn(
                  "relative flex h-11 w-11 shrink-0 items-center justify-center text-sm font-bold text-primary-foreground",
                  contact.contactType === "business"
                    ? "rounded-xl"
                    : "rounded-full",
                  contact.avatar
                )}
              >
                {contact.initials}
                {contact.contactType === "business" && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card shadow-sm">
                    <Store className="h-2.5 w-2.5 text-primary" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {contact.name}
                  </p>
                  {contact.verified && (
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {contact.contactType === "business" && (
                    <>
                      <Store className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {contact.category}
                      </span>
                      <span className="text-muted-foreground">&middot;</span>
                    </>
                  )}
                  {contact.upaType === "linkedin" ? (
                    <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                  ) : contact.upaType === "venmo" ? (
                    <AtSign className="h-3 w-3 text-[#008CFF]" />
                  ) : contact.upaType === "zelle" ? (
                    <Smartphone className="h-3 w-3 text-[#6D1ED4]" />
                  ) : contact.upaType === "email" ? (
                    <Mail className="h-3 w-3 text-orange-500" />
                  ) : (
                    <Phone className="h-3 w-3 text-emerald-500" />
                  )}
                  <p className="truncate text-xs text-muted-foreground">
                    {contact.upa}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {contact.contactType === "business" && (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    Business
                  </span>
                )}
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {contact.instruments.length} options
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedContact) return null;

  // ─── STEP: Amount ─────────────────────────────────────────────────
  if (step === "amount") {
    const topRail = sortedInstruments[0];
    const amountNum = Number.parseFloat(amount) || 0;
    const exceedsP2PLimit = amountNum > 7500; // $7,500 Cash App/Venmo limit
    const exceedsACHLimit = amountNum > 100000; // $100K ACH limit
    const qualifiesForWire = amountNum >= 1000; // $1K practical minimum for wire
    
    return (
      <div className="flex flex-col gap-5 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("search")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-sm transition-transform active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Enter Amount</h1>
        </div>

        {/* Recipient Card */}
        <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
          <div
            className={cn(
              "relative flex h-12 w-12 items-center justify-center text-sm font-bold text-primary-foreground",
              selectedContact.contactType === "business"
                ? "rounded-xl"
                : "rounded-full",
              selectedContact.avatar
            )}
          >
            {selectedContact.initials}
            {selectedContact.contactType === "business" && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-card shadow-sm">
                <Store className="h-3 w-3 text-primary" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-foreground">
                {selectedContact.name}
              </p>
              {selectedContact.verified && (
                <ShieldCheck className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {selectedContact.contactType === "business" &&
                selectedContact.category && (
                  <>
                    <span className="text-xs font-medium text-primary">
                      {selectedContact.category}
                    </span>
                    <span className="text-muted-foreground">&middot;</span>
                  </>
                )}
              <p className="truncate text-xs text-muted-foreground">
                {selectedContact.upa}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {selectedContact.contactType === "business" && (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                Business
              </span>
            )}
            <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
              {selectedContact.country === "US" ? "USA" : selectedContact.country}
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-8 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Amount ({selectedContact.preferredCurrency})
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-muted-foreground">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                setAmount(v);
              }}
              className="w-40 border-none bg-transparent text-center text-4xl font-bold text-foreground outline-none placeholder:text-muted-foreground/30"
            />
          </div>
          {/* AI Recommendation */}
          {topRail && !exceedsP2PLimit && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-medium text-success">
                AI recommends {topRail.label} &middot; {topRail.settlementSpeed}{" "}
                &middot; {topRail.fee} fee
              </span>
            </div>
          )}
          
          {/* P2P Limit Warning */}
          {exceedsP2PLimit && !exceedsACHLimit && (
            <div className="mt-2 flex flex-col gap-1.5 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">
                  Exceeds P2P app limits ($7,500)
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                AI will suggest ACH (up to $100K, 1-3 days) or wire transfer for this amount
              </span>
            </div>
          )}
          
          {/* ACH Limit Warning - suggest wire */}
          {exceedsACHLimit && (
            <div className="mt-2 flex flex-col gap-1.5 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">
                  High value transfer ({formatUSD(amountNum)})
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {qualifiesForWire 
                  ? "Wire transfer recommended for same-day settlement."
                  : "ACH recommended for this amount (1-3 business days)."}
              </span>
            </div>
          )}
          
          {/* Quick amount buttons */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[25, 50, 100, 250, 500, 1000].map((quickAmt) => (
              <button
                key={quickAmt}
                type="button"
                onClick={() => setAmount(quickAmt.toString())}
                className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                ${quickAmt.toLocaleString("en-US")}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <input
          type="text"
          placeholder="Add a note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Continue */}
        <button
          type="button"
          disabled={!amount || Number.parseFloat(amount) <= 0}
          onClick={() => setStep("rail")}
          className="rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
        >
          Choose Payment Method
        </button>
      </div>
    );
  }

  // ─── STEP: Rail Selection ─────────────────────────────────────────
  if (step === "rail") {
    const amountNum = Number.parseFloat(amount) || 0;
    
    // Check velocity limits for each instrument
    const instrumentsWithLimits = sortedInstruments.map((inst) => {
      const limitCheck = checkVelocityLimit(inst.rail, amountNum, false);
      return { ...inst, limitCheck };
    });

    // Find suggested alternatives from blocked rails
    const blockedRails = instrumentsWithLimits.filter((i) => !i.limitCheck.allowed);
    const suggestedAlternativeRails = new Set<Rail>();
    blockedRails.forEach((i) => {
      i.limitCheck.suggestedAlternatives?.forEach((alt) => suggestedAlternativeRails.add(alt));
    });

    // Check if selected instrument exceeds limit
    const selectedLimitCheck = selectedInstrument 
      ? checkVelocityLimit(selectedInstrument.rail, amountNum, false)
      : null;

    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("amount")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-sm transition-transform active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
            Select Payment Method
          </h1>
        </div>

        {/* AI Header */}
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs font-medium text-foreground">
            AI scored{" "}
            {sortedInstruments.length} payment options for {formatUSD(amountNum)}
          </p>
        </div>

        {/* Velocity Limit Info Banner */}
        {blockedRails.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-warning">
                Some payment options unavailable for this amount
              </p>
              <p className="text-[11px] text-muted-foreground">
                {amountNum > 7500 
                  ? "P2P apps have $7.5K limits. Use ACH (up to $100K) or wire transfer for larger amounts."
                  : "Daily limits exceeded on some options. Try alternatives below."}
              </p>
            </div>
          </div>
        )}

        {/* Rails */}
        <div className="flex flex-col gap-2">
          {instrumentsWithLimits.map((inst, idx) => {
            const score = computeRouteScore(inst);
            const RailIcon = RAIL_ICONS[inst.rail] || Zap;
            const isTop = idx === 0 && inst.limitCheck.allowed;
            const selected = selectedInstrument?.id === inst.id;
            const isBlocked = !inst.limitCheck.allowed;
            const isSuggested = suggestedAlternativeRails.has(inst.rail) && inst.limitCheck.allowed;
            const limit = VELOCITY_LIMITS[inst.rail];
            
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => !isBlocked && setSelectedInstrument(inst)}
                disabled={isBlocked}
                className={cn(
                  "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
                  isBlocked 
                    ? "border-destructive/30 bg-destructive/5 opacity-60 cursor-not-allowed"
                    : selected
                      ? "border-primary bg-primary/5 shadow-md"
                      : isSuggested
                        ? "border-success/50 bg-success/10 shadow-md"
                        : "border-border bg-card shadow-sm hover:shadow-md",
                  isTop && !selected && !isSuggested && "border-success/30 bg-success/5"
                )}
              >
                {isBlocked && (
                  <div className="absolute -top-2.5 right-3 rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                    Limit Exceeded
                  </div>
                )}
                {isSuggested && !isBlocked && (
                  <div className="absolute -top-2.5 right-3 rounded-full bg-success px-2.5 py-0.5 text-[10px] font-bold text-success-foreground">
                    Recommended Alternative
                  </div>
                )}
                {isTop && !isSuggested && (
                  <div className="absolute -top-2.5 right-3 rounded-full bg-success px-2.5 py-0.5 text-[10px] font-bold text-success-foreground">
                    AI Recommended
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      isBlocked ? "bg-destructive/10" : selected ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    <RailIcon
                      className={cn("h-5 w-5", isBlocked ? "text-destructive/50" : RAIL_META[inst.rail].color)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-semibold", isBlocked ? "text-muted-foreground" : "text-foreground")}>
                      {inst.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inst.detail} &middot; {inst.currency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-bold", isBlocked ? "text-muted-foreground" : "text-primary")}>{score}</p>
                    <p className="text-[10px] text-muted-foreground">AI Score</p>
                  </div>
                </div>
                
                {/* Limit Info */}
                {isBlocked && inst.limitCheck.reason && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2 py-1.5">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span className="text-[10px] font-medium text-destructive">
                      {inst.limitCheck.reason}
                    </span>
                  </div>
                )}
                
                {/* Velocity Limit & Cost Info */}
                {!isBlocked && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1">
                      <Info className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        Limit: {limit.perTransaction >= Number.MAX_SAFE_INTEGER 
                          ? `Min ${formatUSD(limit.minAmount || 0)}` 
                          : `${formatUSD(limit.perTransaction)}/txn`}
                        {limit.dailyCount && ` • ${limit.dailyCount} txns/day`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-2 py-1">
                      <DollarSign className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-primary font-medium">
                        Your fee: {getTransactionFeeDisplay(inst.rail, amountNum, selectedContact.contactType === "business")}
                        {TRANSACTION_COSTS[inst.rail].merchantMDR && selectedContact.contactType === "business" && (
                          <span className="text-muted-foreground font-normal"> • MDR: {TRANSACTION_COSTS[inst.rail].merchantMDR}</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Metrics */}
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {inst.settlementSpeed}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {inst.fee}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {inst.successRate}% success
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Rail Fee Details */}
        {selectedInstrument && (
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Fee Details: {RAIL_META[selectedInstrument.rail].label}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {TRANSACTION_COSTS[selectedInstrument.rail].feeDetails}
            </p>
            {selectedContact.contactType === "business" && TRANSACTION_COSTS[selectedInstrument.rail].merchantMDR && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Merchant pays:</span> {TRANSACTION_COSTS[selectedInstrument.rail].merchantMDR} MDR
              </p>
            )}
          </div>
        )}

        {/* Continue */}
        <button
          type="button"
          disabled={!selectedInstrument || (selectedLimitCheck && !selectedLimitCheck.allowed)}
          onClick={() => setStep("confirm")}
          className="rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
        >
          Review Payment
        </button>
      </div>
    );
  }

  // ─── STEP: Confirm ────────────────────────────────────────────────
  if (step === "confirm" && selectedInstrument) {
    const score = computeRouteScore(selectedInstrument);
    const RailIcon = RAIL_ICONS[selectedInstrument.rail] || Zap;
    return (
      <div className="flex flex-col gap-5 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("rail")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-sm transition-transform active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
            Confirm Payment
          </h1>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-sm">
          {/* Amount */}
          <div className="mb-4 text-center">
            <p className="text-xs text-muted-foreground">Sending</p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {formatUSD(Number.parseFloat(amount))}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedContact.preferredCurrency}
            </p>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">To</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  {selectedContact.name}
                </span>
                {selectedContact.contactType === "business" && (
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-semibold text-primary">
                    Biz
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Username / Phone</span>
              <span className="text-xs font-medium text-foreground">
                {selectedContact.upa}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Payment Via</span>
              <div className="flex items-center gap-1.5">
                <RailIcon
                  className={cn(
                    "h-3.5 w-3.5",
                    RAIL_META[selectedInstrument.rail].color
                  )}
                />
                <span className="text-xs font-medium text-foreground">
                  {selectedInstrument.label}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Speed</span>
              <span className="text-xs font-medium text-foreground">
                {selectedInstrument.settlementSpeed}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Your Fee</span>
              <span className="text-xs font-medium text-success">
                {getTransactionFeeDisplay(selectedInstrument.rail, Number.parseFloat(amount), selectedContact.contactType === "business")}
              </span>
            </div>
            {TRANSACTION_COSTS[selectedInstrument.rail].merchantMDR && selectedContact.contactType === "business" && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Merchant MDR</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {TRANSACTION_COSTS[selectedInstrument.rail].merchantMDR}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">AI Score</span>
              <span className="text-xs font-bold text-primary">{score}/100</span>
            </div>
            {note && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Note</span>
                <span className="text-xs font-medium text-foreground">
                  {note}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl active:scale-[0.99] disabled:opacity-70"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Send ${formatUSD(Number.parseFloat(amount))}`
          )}
        </button>
      </div>
    );
  }

  // ─── STEP: Success ────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-5 p-4 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Payment Sent!</h2>
        <p className="text-center text-sm text-muted-foreground">
          {formatUSD(Number.parseFloat(amount))} is on its way to{" "}
          {selectedContact.name} via{" "}
          {selectedInstrument?.label ?? "selected payment method"}.
        </p>
        <div className="flex w-full gap-3 pt-4">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground transition-all hover:bg-muted"
          >
            Send Another
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
}
