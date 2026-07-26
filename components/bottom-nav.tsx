"use client";

import { cn } from "@/lib/utils";
import { Home, Send, Users, Activity, User } from "lucide-react";

type Tab = "home" | "send" | "contacts" | "activity" | "profile";

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "send", label: "Send", icon: Send },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "profile", label: "Profile", icon: User },
];

export function BottomNav({
  active,
  onNavigate,
}: {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}) {
  return (
    <nav className="flex items-center justify-around border-t border-border bg-card px-2 pb-1 pt-2 safe-bottom lg:hidden">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onNavigate(key)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
            active === key
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
