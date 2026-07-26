"use client";

import { cn } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/data";
import {
  Shield,
  Bell,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

export function ProfileScreen() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CURRENT_USER.upa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MENU = [
    { label: "Identity Verification", icon: Shield },
    { label: "Notifications", icon: Bell },
    { label: "Payment Methods & Banks", icon: CreditCard },
    { label: "Language & Region", icon: Globe },
    { label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <div className="flex flex-col gap-5 p-4">
      <h1 className="text-lg font-bold text-foreground">Profile</h1>

      {/* User Card */}
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
          {CURRENT_USER.initials}
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {CURRENT_USER.name}
        </h2>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your Username
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 transition-colors hover:bg-muted/80"
          >
            <span className="text-xs font-medium text-foreground">
              {CURRENT_USER.upa}
            </span>
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        {MENU.map((item, idx) => (
          <button
            key={item.label}
            type="button"
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50",
              idx < MENU.length - 1 && "border-b border-border"
            )}
          >
            <item.icon className="h-4.5 w-4.5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">
              {item.label}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-xl border border-destructive/20 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
