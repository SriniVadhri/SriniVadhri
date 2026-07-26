"use client";

import { cn } from "@/lib/utils";
import {
  CONTACTS,
  TRANSACTIONS,
  CURRENT_USER,
  RAIL_META,
  formatUSD,
} from "@/lib/data";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  QrCode,
  Plus,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Store,
  Building,
  Linkedin,
  Mail,
  Phone,
  AtSign,
  Smartphone,
} from "lucide-react";

interface Props {
  onNavigate: (tab: string) => void;
  onSendTo: (contactId: string) => void;
}

export function HomeScreen({ onNavigate, onSendTo }: Props) {
  const favoriteIdentities = CONTACTS.filter(
    (c) => c.favorite && c.contactType === "person"
  );
  const favoriteBusinesses = CONTACTS.filter(
    (c) => c.favorite && c.contactType === "business"
  );
  const recentTx = [...TRANSACTIONS]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-5 p-4 pb-6">
      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary-foreground/5" />
        <div className="relative">
          <p className="text-xs font-medium opacity-80">Available Balance</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">
            {formatUSD(CURRENT_USER.balance)}
          </h2>
          <p className="mt-1 text-xs opacity-70">
            {CURRENT_USER.upa}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Send", icon: ArrowUpRight, onClick: () => onNavigate("send") },
          { label: "Business", icon: Store, onClick: () => onNavigate("send") },
          { label: "Request", icon: ArrowDownLeft, onClick: () => {} },
          { label: "Scan QR", icon: QrCode, onClick: () => {} },
          { label: "Top Up", icon: Plus, onClick: () => {} },
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 rounded-xl bg-card p-3 shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium text-foreground">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Send to Identities */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Send to Identities
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("contacts")}
            className="flex items-center gap-0.5 text-xs font-medium text-primary"
          >
            See all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
          {favoriteIdentities.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => onSendTo(contact.id)}
              className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-primary-foreground",
                  contact.avatar
                )}
              >
                {contact.initials}
              </div>
              <span className="w-16 truncate text-center text-[11px] font-medium text-foreground">
                {contact.name.split(" ")[0]}
              </span>
              <div className="flex items-center gap-1">
                {contact.upaType === "linkedin" && (
                  <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                )}
                {contact.upaType === "venmo" && (
                  <AtSign className="h-3 w-3 text-[#008CFF]" />
                )}
                {contact.upaType === "zelle" && (
                  <Smartphone className="h-3 w-3 text-[#6D1ED4]" />
                )}
                {contact.upaType === "phone" && (
                  <Phone className="h-3 w-3 text-emerald-500" />
                )}
                {contact.upaType === "email" && (
                  <Mail className="h-3 w-3 text-orange-500" />
                )}
                <span className="text-[9px] text-muted-foreground">
                  {contact.upaType === "linkedin"
                    ? "LinkedIn"
                    : contact.upaType === "venmo"
                      ? "Venmo"
                      : contact.upaType === "zelle"
                        ? "Zelle"
                        : contact.upaType === "email"
                          ? "Email"
                          : "Phone"}
                </span>
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onNavigate("contacts")}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground">
              <Plus className="h-5 w-5" />
            </div>
            <span className="w-16 truncate text-center text-[11px] font-medium text-muted-foreground">
              Add
            </span>
          </button>
        </div>
      </section>

      {/* Pay a Business */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Pay a Business
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("contacts")}
            className="flex items-center gap-0.5 text-xs font-medium text-primary"
          >
            See all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {favoriteBusinesses.map((biz) => (
            <button
              key={biz.id}
              type="button"
              onClick={() => onSendTo(biz.id)}
              className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground",
                  biz.avatar
                )}
              >
                {biz.initials}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {biz.name}
                  </p>
                  {biz.verified && (
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {biz.category}
                  </span>
                  <span className="text-muted-foreground">&middot;</span>
                  <span className="text-xs text-muted-foreground">
                    {biz.instruments.length} payment options
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Recent Activity
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("activity")}
            className="flex items-center gap-0.5 text-xs font-medium text-primary"
          >
            See all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {recentTx.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground",
                  tx.contactAvatar
                )}
              >
                {tx.contactInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {tx.contactName}
                </p>
                <p className="text-xs text-muted-foreground">{tx.note}</p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    tx.direction === "received"
                      ? "text-success"
                      : "text-foreground"
                  )}
                >
                  {tx.direction === "received" ? "+" : "-"}
                  {formatUSD(tx.amount)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {RAIL_META[tx.rail].label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Banner -- mobile only, desktop version lives in side panel */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 lg:hidden">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Pay to an Identity
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Pay anyone via Venmo, Cash App, Zelle, PayPal, or bank transfer.
              Our Routing Agent picks the fastest and cheapest payment method
              for you automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
