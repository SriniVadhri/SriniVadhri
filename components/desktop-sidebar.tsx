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
  Smartphone,
  Zap,
  Building2,
  ShieldCheck,
  Linkedin,
  Mail,
  Phone,
  AtSign,
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
    icon: Smartphone,
    title: "Enter Username/Phone",
    desc: "Enter a Venmo, Cash App, Zelle username, phone, or email.",
  },
  {
    icon: Zap,
    title: "Routing Agent Scoring",
    desc: "Speed, cost, and success rate -- all scored in real time.",
  },
  {
    icon: Building2,
    title: "Smart Routing",
    desc: "Venmo, Zelle, PayPal, ACH -- automatically chosen for best results.",
  },
  {
    icon: ShieldCheck,
    title: "CFPB Protected",
    desc: "Secure payments compliant with US financial regulations.",
  },
];

const RAILS = [
  "Venmo",
  "Cash App",
  "Zelle",
  "PayPal",
  "Apple Pay",
  "ACH",
  "Wire Transfer",
];

const IDENTITY_EXAMPLES = [
  { icon: Linkedin, name: "Sarah Chen", identityType: "LinkedIn", identity: "linkedin.com/in/sarachen", color: "bg-[#0A66C2]", initials: "SC" },
  { icon: AtSign, name: "Mike Johnson", identityType: "Venmo", identity: "@mike-johnson", color: "bg-[#008CFF]", initials: "MJ" },
  { icon: Smartphone, name: "Emily Davis", identityType: "Zelle", identity: "+1 (555) 123-4567", color: "bg-[#6D1ED4]", initials: "ED" },
  { icon: Phone, name: "James Wilson", identityType: "Phone", identity: "+1 (555) 987-6543", color: "bg-emerald-500", initials: "JW" },
  { icon: Mail, name: "Lisa Martinez", identityType: "Email", identity: "lisa@example.com", color: "bg-orange-500", initials: "LM" },
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
            Pay to an Identity
          </h1>
          <p className="text-[10px] text-muted-foreground">
            P2P Payments & Bank Transfers
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
          {/* PayKaro explainer */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">
                Pay to an Identity
              </h3>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Pay anyone via Venmo, Cash App, Zelle, PayPal, or bank transfer.
              Our Routing Agent picks the fastest and cheapest payment option
              for you automatically.
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

          {/* Send to Identities */}
          <div>
            <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Send to Identities
            </h4>
            <div className="flex flex-col gap-2.5">
              {IDENTITY_EXAMPLES.map((identity) => (
                <div key={identity.name} className="flex items-center gap-3 rounded-lg bg-muted/50 p-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {identity.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-foreground">{identity.name}</p>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded text-white", identity.color)}>
                        <identity.icon className="h-2.5 w-2.5" />
                      </div>
                      <p className="text-[9px] text-muted-foreground truncate">{identity.identityType}: {identity.identity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Payment Methods */}
          <div>
            <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Payment Options
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
          CFPB Protected | FDIC Insured Partners
        </p>
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          Contact - Srini Vadhri &copy; - for more details
        </p>
      </div>
    </aside>
  );
}
