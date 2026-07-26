"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Globe,
  ShieldCheck,
  Clock,
  Zap,
  Building2,
  ArrowRightLeft,
  Wallet,
  Smartphone,
  Coins,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Tag,
  CalendarClock,
  AlertTriangle,
  Send,
  Sparkles,
} from "lucide-react";
import {
  RAIL_META,
  USDC_NETWORKS,
  computeRouteScoreBreakdown,
  formatGasFee,
  formatUSD,
} from "@/lib/data";
import {
  computeDiscountTerms,
  getAgreedTerms,
  getDaysUntilDue,
  getDueDate,
  getLatestOffer,
  getPayableAmount,
  getSupplier,
  formatDate,
  type Invoice,
} from "@/lib/invoices";

const RAIL_ICONS: Record<string, typeof Zap> = {
  venmo: Wallet,
  cashapp: Zap,
  zelle: Smartphone,
  paypal: Wallet,
  ach: Building2,
  wire: ArrowRightLeft,
  applepay: Wallet,
  bank: Building2,
  usdc: Coins,
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  none: {
    label: "No discount offer",
    className: "bg-muted text-muted-foreground",
  },
  supplier_offered: {
    label: "Discount offered",
    className: "bg-success/15 text-success",
  },
  payer_countered: {
    label: "Awaiting supplier",
    className: "bg-warning/20 text-warning-foreground",
  },
  supplier_countered: {
    label: "Counter received",
    className: "bg-primary/15 text-primary",
  },
  accepted: {
    label: "Terms agreed",
    className: "bg-success/15 text-success",
  },
  declined: {
    label: "Discount declined",
    className: "bg-destructive/10 text-destructive",
  },
};

interface Props {
  invoice: Invoice;
  isExpanded: boolean;
  onToggle: () => void;
  onCounter: (
    invoiceId: string,
    discountPercent: number,
    payWithinDays: number
  ) => void;
  onAccept: (invoiceId: string) => void;
  onPay: (invoiceId: string, instrumentId: string) => void;
}

export function InvoiceCard({
  invoice,
  isExpanded,
  onToggle,
  onCounter,
  onAccept,
  onPay,
}: Props) {
  const supplier = getSupplier(invoice.supplierId);
  const daysUntilDue = getDaysUntilDue(invoice);
  const latestOffer = getLatestOffer(invoice);
  const agreed = getAgreedTerms(invoice);
  const payable = getPayableAmount(invoice);
  const statusMeta = STATUS_LABELS[invoice.negotiation.status];

  // Counter-offer form seeds from whatever is currently on the table
  const [counterPct, setCounterPct] = useState(
    latestOffer ? String(latestOffer.discountPercent + 0.5) : "2"
  );
  const [counterDays, setCounterDays] = useState(
    latestOffer ? String(latestOffer.payWithinDays) : "10"
  );
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<
    string | null
  >(null);

  // Rank this supplier's rails for the amount actually being remitted
  const rankedInstruments = [...supplier.instruments]
    .map((inst) => ({
      inst,
      breakdown: computeRouteScoreBreakdown(inst, payable, "bank"),
    }))
    .sort((a, b) => b.breakdown.score - a.breakdown.score);

  const bestInstrumentId = rankedInstruments[0]?.inst.id ?? null;
  const activeInstrumentId = selectedInstrumentId ?? bestInstrumentId;

  // Terms the payer is proposing, previewed live as they type
  const previewPct = Number.parseFloat(counterPct);
  const previewDays = Number.parseInt(counterDays, 10);
  const previewValid =
    Number.isFinite(previewPct) &&
    previewPct > 0 &&
    previewPct <= 10 &&
    Number.isFinite(previewDays) &&
    previewDays > 0 &&
    previewDays < invoice.netTerms;
  const previewTerms = previewValid
    ? computeDiscountTerms(invoice, previewPct, previewDays)
    : null;

  // A declined negotiation records a 0% offer to close the thread — that is a
  // rejection, not terms on the table, so it must not render as an offer.
  const offerOnTable =
    latestOffer &&
    latestOffer.from === "supplier" &&
    !agreed &&
    invoice.negotiation.status !== "declined" &&
    latestOffer.discountPercent > 0
      ? computeDiscountTerms(
          invoice,
          latestOffer.discountPercent,
          latestOffer.payWithinDays
        )
      : null;

  const canAct =
    invoice.negotiation.status !== "accepted" &&
    invoice.negotiation.status !== "declined";

  // Supplier's offer requires paying by a date that has already passed
  const offerLapsed =
    latestOffer?.from === "supplier" &&
    offerOnTable !== null &&
    offerOnTable.windowDaysLeft < 0;

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm">
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50"
      >
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground",
            supplier.avatar
          )}
        >
          {supplier.initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-foreground">
              {supplier.name}
            </p>
            {supplier.verified && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="font-mono">{invoice.invoiceNumber}</span>
            <span>&middot;</span>
            <span className="flex items-center gap-0.5">
              <Globe className="h-3 w-3" />
              {supplier.crossBorder ? supplier.countryLabel : "Domestic"}
            </span>
            <span>&middot;</span>
            <span
              className={cn(
                "flex items-center gap-0.5",
                daysUntilDue <= 7 ? "font-semibold text-warning" : ""
              )}
            >
              <CalendarClock className="h-3 w-3" />
              {daysUntilDue > 0
                ? `Due in ${daysUntilDue}d`
                : daysUntilDue === 0
                  ? "Due today"
                  : `${Math.abs(daysUntilDue)}d overdue`}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-sm font-bold text-foreground">
            {formatUSD(payable)}
          </p>
          {agreed && (
            <p className="text-[10px] font-medium text-success">
              saving {formatUSD(agreed.discountAmount)}
            </p>
          )}
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[9px] font-semibold",
              statusMeta.className
            )}
          >
            {statusMeta.label}
          </span>
        </div>

        {isExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-4 border-t border-border p-3">
          {/* Invoice detail */}
          <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-2.5">
            <p className="text-xs text-foreground">{invoice.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
              <span>
                PO <span className="font-mono">{invoice.poNumber}</span>
              </span>
              <span>Issued {formatDate(invoice.issueDate)}</span>
              <span>
                Net {invoice.netTerms} &middot; due{" "}
                {formatDate(getDueDate(invoice))}
              </span>
              <span>{supplier.legalName}</span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-[10px] text-muted-foreground">
                Invoice total
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  agreed
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {formatUSD(invoice.amount)}
              </span>
              {agreed && (
                <span className="text-xs font-bold text-success">
                  {formatUSD(agreed.netPayable)}
                </span>
              )}
            </div>
          </div>

          {/* ── Early payment discount ─────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Early Payment Discount
              </p>
            </div>

            {/* Agreed terms */}
            {agreed && (
              <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">
                    {agreed.discountPercent}% off for paying within{" "}
                    {agreed.payWithinDays} days
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Saves {formatUSD(agreed.discountAmount)} &middot; pay{" "}
                    {formatUSD(agreed.netPayable)} instead of{" "}
                    {formatUSD(invoice.amount)} &middot;{" "}
                    {agreed.daysAccelerated} days ahead of term
                  </p>
                  {agreed.windowDaysLeft >= 0 ? (
                    <p className="mt-0.5 text-[11px] font-medium text-success">
                      {agreed.windowDaysLeft === 0
                        ? "Discount window closes today"
                        : `${agreed.windowDaysLeft} days left to pay and keep the discount`}
                    </p>
                  ) : (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Window closed {Math.abs(agreed.windowDaysLeft)} days ago
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Declined */}
            {invoice.negotiation.status === "declined" && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Supplier declined an early payment discount
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Pay the full {formatUSD(invoice.amount)} at Net{" "}
                    {invoice.netTerms}.
                  </p>
                </div>
              </div>
            )}

            {/* Live offer from the supplier */}
            {offerOnTable && (
              <div className="flex flex-col gap-2 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Supplier offers {offerOnTable.discountPercent}% to pay
                      within {offerOnTable.payWithinDays} days
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      You&apos;d save{" "}
                      <span className="font-semibold text-success">
                        {formatUSD(offerOnTable.discountAmount)}
                      </span>{" "}
                      &middot; pay {formatUSD(offerOnTable.netPayable)} &middot;{" "}
                      {offerOnTable.daysAccelerated} days early
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {offerOnTable.windowDaysLeft >= 0
                        ? `${offerOnTable.windowDaysLeft} days left in the window`
                        : `Window closed ${Math.abs(offerOnTable.windowDaysLeft)} days ago`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Negotiation thread */}
            {invoice.negotiation.offers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Negotiation ({invoice.negotiation.offers.length})
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {invoice.negotiation.offers.map((offer) => {
                    const isPayer = offer.from === "payer";
                    return (
                      <div
                        key={offer.id}
                        className={cn(
                          "flex flex-col gap-0.5 rounded-lg p-2",
                          isPayer
                            ? "ml-6 bg-primary/10"
                            : "mr-6 bg-muted"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-[10px] font-semibold",
                              isPayer ? "text-primary" : "text-foreground"
                            )}
                          >
                            {isPayer ? "You (Payer)" : supplier.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {offer.at}
                          </span>
                        </div>
                        {offer.discountPercent > 0 && (
                          <span className="text-[10px] font-medium text-foreground">
                            {offer.discountPercent}% &middot; pay within{" "}
                            {offer.payWithinDays} days &middot; saves{" "}
                            {formatUSD(
                              computeDiscountTerms(
                                invoice,
                                offer.discountPercent,
                                offer.payWithinDays
                              ).discountAmount
                            )}
                          </span>
                        )}
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {offer.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payer actions */}
            {canAct && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {/* A lapsed window can't be accepted — the supplier's terms
                      required paying by a date that has already passed. The
                      payer can still counter with a fresh window. */}
                  {latestOffer?.from === "supplier" && !offerLapsed && (
                    <button
                      type="button"
                      onClick={() => onAccept(invoice.id)}
                      className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground transition-transform active:scale-95"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Accept {latestOffer.discountPercent}%
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCounterForm((v) => !v)}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    {invoice.negotiation.offers.length === 0
                      ? "Request a discount"
                      : offerLapsed
                        ? "Counter with a new window"
                        : "Counter offer"}
                  </button>
                </div>

                {offerLapsed && (
                  <p className="flex items-center gap-1 text-[11px] text-destructive">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    The pay-by date on this offer has passed, so it can no
                    longer be accepted as written. Counter with a later window
                    to keep a discount in play.
                  </p>
                )}

                {invoice.negotiation.status === "payer_countered" && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Your counter is with {supplier.name}. Send a new one to
                    replace it.
                  </p>
                )}

                {showCounterForm && (
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Discount %
                        </span>
                        <input
                          type="number"
                          step="0.25"
                          min="0.25"
                          max="10"
                          value={counterPct}
                          onChange={(e) => setCounterPct(e.target.value)}
                          className="w-20 rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Pay within (days)
                        </span>
                        <input
                          type="number"
                          min="1"
                          max={invoice.netTerms - 1}
                          value={counterDays}
                          onChange={(e) => setCounterDays(e.target.value)}
                          className="w-24 rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={!previewValid}
                        onClick={() => {
                          onCounter(invoice.id, previewPct, previewDays);
                          setShowCounterForm(false);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        Send to supplier
                      </button>
                    </div>
                    {previewTerms ? (
                      <p className="text-[11px] text-muted-foreground">
                        Saves{" "}
                        <span className="font-semibold text-success">
                          {formatUSD(previewTerms.discountAmount)}
                        </span>{" "}
                        &middot; pay {formatUSD(previewTerms.netPayable)}{" "}
                        &middot; {previewTerms.daysAccelerated} days ahead of
                        term
                      </p>
                    ) : (
                      <p className="text-[11px] text-destructive">
                        Enter a discount up to 10% and a window shorter than Net{" "}
                        {invoice.netTerms}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Payment rails ──────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  How {supplier.name} accepts payment
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                scored for {formatUSD(payable)}
              </span>
            </div>

            {supplier.crossBorder && (
              <p className="flex items-start gap-1 rounded-lg bg-muted/50 px-2 py-1 text-[10px] leading-relaxed text-muted-foreground">
                <Globe className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  Foreign entity in {supplier.countryLabel} billing in USD — no
                  FX conversion, but domestic networks like ACH and Zelle
                  aren&apos;t reachable.
                </span>
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              {rankedInstruments.map(({ inst, breakdown }, index) => {
                const RailIcon = RAIL_ICONS[inst.rail] || Zap;
                const isActive = activeInstrumentId === inst.id;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => setSelectedInstrumentId(inst.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card">
                      <RailIcon
                        className={cn("h-4 w-4", RAIL_META[inst.rail].color)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-medium text-foreground">
                          {inst.label}
                        </p>
                        {inst.rail === "usdc" && (
                          <span className="text-[10px] text-muted-foreground">
                            on {USDC_NETWORKS[inst.network ?? "base"].label}
                          </span>
                        )}
                        {index === 0 && (
                          <span className="rounded bg-primary/15 px-1 py-0.5 text-[9px] font-semibold text-primary">
                            Agent pick
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {inst.settlementSpeed}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <TrendingDown className="h-2.5 w-2.5" />
                          {breakdown.fee === 0
                            ? "Free"
                            : `${formatGasFee(breakdown.fee)} fee`}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-0.5 font-semibold",
                            breakdown.successRate >= 99
                              ? "text-success"
                              : breakdown.successRate >= 97
                                ? "text-foreground"
                                : "text-warning"
                          )}
                        >
                          <TrendingUp className="h-2.5 w-2.5" />
                          {breakdown.successRate}%
                        </span>
                      </div>
                      {inst.rail === "usdc" && breakdown.gasFee > 0 && (
                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                          {formatGasFee(breakdown.railFee)} ramp +{" "}
                          {formatGasFee(breakdown.gasFee)} flat gas in{" "}
                          {USDC_NETWORKS[inst.network ?? "base"].gasToken}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-primary">
                        {breakdown.score}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        Agent Score
                      </p>
                      <p className="text-[8px] text-muted-foreground">
                        {breakdown.reliabilityPoints}R {breakdown.speedPoints}S{" "}
                        {breakdown.costPoints}C
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!activeInstrumentId}
              onClick={() =>
                activeInstrumentId && onPay(invoice.id, activeInstrumentId)
              }
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Pay {formatUSD(payable)}
              {agreed ? " (discounted)" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
