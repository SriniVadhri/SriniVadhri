"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  Globe,
  Tag,
  CheckCircle2,
  Wallet,
  Search,
} from "lucide-react";
import { formatUSD } from "@/lib/data";
import {
  INVOICES,
  computeDiscountTerms,
  computeSupplierResponse,
  formatOfferTimestamp,
  getAgreedTerms,
  getDaysUntilDue,
  getLatestOffer,
  getPayableAmount,
  getSupplier,
  type Invoice,
} from "@/lib/invoices";
import { InvoiceCard } from "@/components/invoice-card";

type Filter = "all" | "domestic" | "crossborder" | "discount" | "negotiating";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "domestic", label: "Domestic" },
  { key: "crossborder", label: "Cross-border" },
  { key: "discount", label: "Discount available" },
  { key: "negotiating", label: "In negotiation" },
];

export function PayInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const openInvoices = invoices.filter((i) => i.status !== "paid");

  // Totals reflect agreed discounts, so the figure matches what will be remitted
  const totalPayable = openInvoices.reduce(
    (sum, i) => sum + getPayableAmount(i),
    0
  );
  const agreedSavings = openInvoices.reduce((sum, i) => {
    const agreed = getAgreedTerms(i);
    return sum + (agreed ? agreed.discountAmount : 0);
  }, 0);
  // Savings still on the table from unaccepted supplier offers
  const openSavings = openInvoices.reduce((sum, i) => {
    const latest = getLatestOffer(i);
    if (
      latest &&
      latest.from === "supplier" &&
      latest.discountPercent > 0 &&
      !getAgreedTerms(i)
    ) {
      return (
        sum +
        computeDiscountTerms(i, latest.discountPercent, latest.payWithinDays)
          .discountAmount
      );
    }
    return sum;
  }, 0);

  const filtered = useMemo(() => {
    let result = invoices;

    if (filter === "domestic")
      result = result.filter((i) => !getSupplier(i.supplierId).crossBorder);
    if (filter === "crossborder")
      result = result.filter((i) => getSupplier(i.supplierId).crossBorder);
    if (filter === "discount")
      result = result.filter((i) => {
        const latest = getLatestOffer(i);
        return (
          getAgreedTerms(i) !== null ||
          (latest?.from === "supplier" && latest.discountPercent > 0)
        );
      });
    if (filter === "negotiating")
      result = result.filter(
        (i) =>
          i.negotiation.status === "payer_countered" ||
          i.negotiation.status === "supplier_countered"
      );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => {
        const s = getSupplier(i.supplierId);
        return (
          s.name.toLowerCase().includes(q) ||
          s.legalName.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.poNumber.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
        );
      });
    }

    // Soonest due first, so the urgent windows surface
    return [...result].sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));
  }, [invoices, filter, searchQuery]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }

  // Payer sends terms; the supplier responds immediately per their policy
  function handleCounter(
    invoiceId: string,
    discountPercent: number,
    payWithinDays: number
  ) {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        const stamp = formatOfferTimestamp();
        const payerOffer = {
          id: `${inv.id}-p${inv.negotiation.offers.length + 1}`,
          from: "payer" as const,
          discountPercent,
          payWithinDays,
          message: `We're proposing ${discountPercent}% for payment within ${payWithinDays} days.`,
          at: stamp,
        };

        const response = computeSupplierResponse(
          inv,
          discountPercent,
          payWithinDays
        );
        const supplierReply = {
          id: `${inv.id}-s${inv.negotiation.offers.length + 2}`,
          from: "supplier" as const,
          discountPercent: response.discountPercent,
          payWithinDays: response.payWithinDays,
          message: response.message,
          at: stamp,
        };

        const offers = [...inv.negotiation.offers, payerOffer, supplierReply];
        const supplierName = getSupplier(inv.supplierId).name;

        if (response.action === "accept") {
          showToast(
            `${supplierName} accepted ${response.discountPercent}% on ${inv.invoiceNumber}`
          );
          return {
            ...inv,
            negotiation: {
              status: "accepted" as const,
              offers,
              agreedDiscountPercent: response.discountPercent,
              agreedPayWithinDays: response.payWithinDays,
            },
          };
        }

        if (response.action === "decline") {
          showToast(`${supplierName} declined on ${inv.invoiceNumber}`);
          return {
            ...inv,
            negotiation: { status: "declined" as const, offers },
          };
        }

        showToast(
          `${supplierName} countered at ${response.discountPercent}% on ${inv.invoiceNumber}`
        );
        return {
          ...inv,
          negotiation: { status: "supplier_countered" as const, offers },
        };
      })
    );
  }

  // Payer accepts whatever the supplier last put on the table
  function handleAccept(invoiceId: string) {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const latest = getLatestOffer(inv);
        if (!latest || latest.from !== "supplier") return inv;

        const terms = computeDiscountTerms(
          inv,
          latest.discountPercent,
          latest.payWithinDays
        );
        showToast(
          `Accepted ${latest.discountPercent}% on ${inv.invoiceNumber} — saving ${formatUSD(terms.discountAmount)}`
        );

        return {
          ...inv,
          negotiation: {
            status: "accepted" as const,
            agreedDiscountPercent: latest.discountPercent,
            agreedPayWithinDays: latest.payWithinDays,
            offers: [
              ...inv.negotiation.offers,
              {
                id: `${inv.id}-accept`,
                from: "payer" as const,
                discountPercent: latest.discountPercent,
                payWithinDays: latest.payWithinDays,
                message: `Accepted — we'll clear within ${latest.payWithinDays} days.`,
                at: formatOfferTimestamp(),
              },
            ],
          },
        };
      })
    );
  }

  function handlePay(invoiceId: string, instrumentId: string) {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const supplier = getSupplier(inv.supplierId);
        const inst = supplier.instruments.find((x) => x.id === instrumentId);
        showToast(
          `Paid ${formatUSD(getPayableAmount(inv))} to ${supplier.name} via ${inst?.label ?? "selected rail"}`
        );
        return { ...inv, status: "paid" as const };
      })
    );
    setExpandedId(null);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">Pay Invoices</h1>
        {/* Desktop header already carries this subtitle, so only show it on mobile */}
        <p className="text-xs text-muted-foreground lg:hidden">
          Invoices received from suppliers. Negotiate an early payment discount,
          then choose the rail that settles it.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Supplier, invoice number, or PO..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5 rounded-xl bg-card p-3 shadow-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span className="text-[10px] font-medium">Open</span>
          </div>
          <p className="text-base font-bold text-foreground">
            {openInvoices.length}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatUSD(totalPayable)} payable
          </p>
        </div>
        <div className="flex flex-col gap-0.5 rounded-xl bg-card p-3 shadow-sm">
          <div className="flex items-center gap-1 text-success">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-[10px] font-medium">Locked in</span>
          </div>
          <p className="text-base font-bold text-success">
            {formatUSD(agreedSavings)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            discounts agreed
          </p>
        </div>
        <div className="flex flex-col gap-0.5 rounded-xl bg-card p-3 shadow-sm">
          <div className="flex items-center gap-1 text-primary">
            <Tag className="h-3 w-3" />
            <span className="text-[10px] font-medium">On the table</span>
          </div>
          <p className="text-base font-bold text-primary">
            {formatUSD(openSavings)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            offers to review
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              filter === key
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {key === "crossborder" && <Globe className="h-3 w-3" />}
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Invoice list */}
      <div className="flex flex-col gap-2">
        {filtered.map((invoice) => (
          <div key={invoice.id} className="relative">
            {invoice.status === "paid" && (
              <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-[9px] font-semibold text-success-foreground">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Paid
              </div>
            )}
            <div className={cn(invoice.status === "paid" && "opacity-60")}>
              <InvoiceCard
                invoice={invoice}
                isExpanded={expandedId === invoice.id}
                onToggle={() =>
                  setExpandedId(
                    expandedId === invoice.id ? null : invoice.id
                  )
                }
                onCounter={handleCounter}
                onAccept={handleAccept}
                onPay={handlePay}
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-card p-8 text-center shadow-sm">
            <Wallet className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No invoices match
            </p>
            <p className="text-xs text-muted-foreground">
              Try a different filter or search term.
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="sticky bottom-4 z-20 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <p className="text-xs font-medium text-foreground">{toast}</p>
        </div>
      )}
    </div>
  );
}
