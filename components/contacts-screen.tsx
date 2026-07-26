"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  Send,
  Globe,
  ChevronDown,
  ChevronUp,
  Zap,
  Building2,
  ArrowRightLeft,
  Wallet,
  Smartphone,
  Clock,
  DollarSign,
  TrendingUp,
  Store,
  Users,
  AtSign,
  Linkedin,
  Coins,
} from "lucide-react";
import {
  CONTACTS,
  RAIL_META,
  TRANSACTION_COSTS,
  computeRouteScore,
  computeRouteScoreBreakdown,
  USDC_NETWORKS,
  type Contact,
} from "@/lib/data";

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

interface Props {
  onSendTo: (contactId: string) => void;
}

export function ContactsScreen({ onSendTo }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "identities" | "business"
  >("all");
  const [subFilter, setSubFilter] = useState<"all" | "favorites" | "verified">(
    "all"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = CONTACTS;
    if (typeFilter === "identities")
      result = result.filter((c) => c.contactType === "person");
    if (typeFilter === "business")
      result = result.filter((c) => c.contactType === "business");
    if (subFilter === "favorites") result = result.filter((c) => c.favorite);
    if (subFilter === "verified") result = result.filter((c) => c.verified);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.upa.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q))
      );
    }
    return result;
  }, [searchQuery, typeFilter, subFilter]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-bold text-foreground">Contacts</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Name, username, or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2">
        {(
          [
            { key: "all", label: "All", icon: null },
            { key: "identities", label: "Identities", icon: Users },
            { key: "business", label: "Business", icon: Store },
          ] as const
        ).map(({ key, label, icon: TypeIcon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTypeFilter(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              typeFilter === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {TypeIcon && <TypeIcon className="h-3 w-3" />}
            {label}
          </button>
        ))}
      </div>

      {/* Sub filter */}
      <div className="flex gap-2">
        {(["all", "favorites", "verified"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setSubFilter(f)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              subFilter === f
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" && "All"}
            {f === "favorites" && "Favorites"}
            {f === "verified" && "Verified"}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Contact List */}
      <div className="flex flex-col gap-2">
        {filtered.map((contact) => {
          const isExpanded = expandedId === contact.id;
          return (
            <div
              key={contact.id}
              className="overflow-hidden rounded-xl bg-card shadow-sm"
            >
              {/* Header */}
              <button
                type="button"
                onClick={() =>
                  setExpandedId(isExpanded ? null : contact.id)
                }
                className="flex w-full items-center gap-3 p-3 text-left transition-all hover:bg-muted/50"
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
                    {contact.favorite && (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {contact.contactType === "business" && (
                      <>
                        <Store className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {contact.category}
                        </span>
                        <span className="text-muted-foreground">
                          &middot;
                        </span>
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
                  <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {contact.country === "US" ? "USA" : contact.country}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded: Instruments */}
              {isExpanded && (
                <div className="border-t border-border px-3 pb-3 pt-2">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Payment Options ({contact.instruments.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => onSendTo(contact.id)}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all active:scale-95"
                    >
                      <Send className="h-3 w-3" />
                      Pay
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[...contact.instruments]
                      .sort(
                        (a, b) =>
                          computeRouteScore(b) - computeRouteScore(a)
                      )
                      .map((inst) => {
                        const RailIcon =
                          RAIL_ICONS[inst.rail] || Zap;
                        const breakdown =
                          computeRouteScoreBreakdown(inst);
                        return (
                          <div
                            key={inst.id}
                            className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card">
                              <RailIcon
                                className={cn(
                                  "h-4 w-4",
                                  RAIL_META[inst.rail].color
                                )}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">
                                {inst.label}
                                {inst.rail === "usdc" && (
                                  <span className="ml-1 font-normal text-muted-foreground">
                                    on{" "}
                                    {
                                      USDC_NETWORKS[inst.network ?? "base"]
                                        .label
                                    }
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {inst.settlementSpeed}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <DollarSign className="h-2.5 w-2.5" />
                                  {inst.fee}
                                </span>
                                <span
                                  className={cn(
                                    "flex items-center gap-0.5 font-semibold",
                                    inst.successRate >= 99
                                      ? "text-success"
                                      : inst.successRate >= 97
                                        ? "text-foreground"
                                        : "text-warning"
                                  )}
                                >
                                  <TrendingUp className="h-2.5 w-2.5" />
                                  {inst.successRate}% success
                                </span>
                              </div>
                              <p className="mt-0.5 text-[9px] text-muted-foreground">
                                {TRANSACTION_COSTS[inst.rail].userFee}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">
                                {breakdown.score}
                              </p>
                              <p className="text-[9px] text-muted-foreground">
                                Agent Score
                              </p>
                              <p className="text-[8px] text-muted-foreground">
                                {breakdown.reliabilityPoints}R{" "}
                                {breakdown.speedPoints}S {breakdown.costPoints}C
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
