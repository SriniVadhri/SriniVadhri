"use client";

import { cn } from "@/lib/utils";
import {
  Home,
  Send,
  Users,
  Activity,
  User,
  Wallet,
  Sparkles,
  Globe,
  Zap,
  ArrowRightLeft,
  ShieldCheck,
} from "lucide-react";

type Tab = "home" | "send" | "contacts" | "activity" | "profile";

const NAV: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Dashboard", icon: Home },
  { key: "send", label: "Send Money", icon: Send },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "profile", label: "Profile", icon: User },
];

const STEPS = [
  {
    icon: Globe,
    title: "Resolve Identity",
    desc: "Enter a phone, email, website, or LinkedIn to find a payee.",
  },
  {
    icon: Zap,
    title: "AI Rail Scoring",
    desc: "Speed, cost, and success rate -- all scored in real time.",
  },
  {
    icon: ArrowRightLeft,
    title: "Smart Routing",
    desc: "ACH, RTP, card, wire, crypto, or wallet -- automatically chosen.",
  },
  {
    icon: ShieldCheck,
    title: "Verified & Secure",
    desc: "E2E encryption and identity verification on every payment.",
  },
];

const RAILS = [
  "ACH",
  "RTP",
  "Wire",
  "Push to Card",
  "A2A",
  "Digital Wallet",
  "Crypto",
  "SWIFT",
];

export function DesktopSidebar({
  active,
  onNavigate,
}: {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}) {
  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-border lg:bg-card">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">
            Pay to Anyone
          </h1>
          <p className="text-[10px] text-muted-foreground">
            Smart payments, any rail
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active === key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </button>
        ))}
      </nav>

      {/* Scrollable info section */}
      <div className="mt-3 flex-1 overflow-y-auto border-t border-border px-4 pt-4 pb-4 no-scrollbar">
        <div className="flex flex-col gap-4">
          {/* Pay to Anyone explainer */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">
                Pay to Anyone
              </h3>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Just enter a phone number, email, website, or LinkedIn ID -- our
              Agentic AI resolves the identity, discovers every linked payment
              instrument, and routes your money over the fastest, cheapest, most
              reliable rail in real time.
            </p>
          </div>

          {/* How it works */}
          <div>
            <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              How It Works
            </h4>
            <div className="flex flex-col gap-2.5">
              {STEPS.map((step) => (
                <div key={step.title} className="flex gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <step.icon className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Rails */}
          <div>
            <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Supported Rails
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {RAILS.map((rail) => (
                <span
                  key={rail}
                  className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {rail}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] text-muted-foreground text-center">
          Agentic AI Routing Engine v2.0
        </p>
      </div>
    </aside>
  );
}
