"use client";

import { useState, useCallback } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { HomeScreen } from "@/components/home-screen";
import { SendMoney } from "@/components/send-money";
import { ContactsScreen } from "@/components/contacts-screen";
import { ActivityScreen } from "@/components/activity-screen";
import { ProfileScreen } from "@/components/profile-screen";
import { Wallet } from "lucide-react";

type Tab = "home" | "send" | "contacts" | "activity" | "profile";

const TAB_TITLES: Record<Tab, string> = {
  home: "Dashboard",
  send: "Send Money",
  contacts: "Contacts",
  activity: "Activity",
  profile: "Profile",
};

const TAB_SUBTITLES: Record<Tab, string> = {
  home: "Welcome back. Pay anyone using just their phone or email.",
  send: "Pay to anyone -- Agentic AI picks the best rail for you.",
  contacts: "Browse identities and their linked payment instruments.",
  activity: "View your complete transaction history across all rails.",
  profile: "Manage your account, security, and preferences.",
};

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [sendToContactId, setSendToContactId] = useState<string | null>(null);

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab as Tab);
    setSendToContactId(null);
  }, []);

  const handleSendTo = useCallback((contactId: string) => {
    setSendToContactId(contactId);
    setActiveTab("send");
  }, []);

  return (
    <div className="flex h-dvh w-full bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar active={activeTab} onNavigate={handleNavigate} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden items-center gap-4 border-b border-border bg-card px-6 py-4 lg:flex">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {TAB_TITLES[activeTab]}
            </h1>
            <p className="text-xs text-muted-foreground">
              {TAB_SUBTITLES[activeTab]}
            </p>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="flex items-center gap-3 bg-card px-4 py-3 shadow-sm lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">
            Pay to Anyone
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl">
            {activeTab === "home" && (
              <HomeScreen
                onNavigate={handleNavigate}
                onSendTo={handleSendTo}
              />
            )}
            {activeTab === "send" && (
              <SendMoney
                initialContactId={sendToContactId}
                onBack={() => handleNavigate("home")}
              />
            )}
            {activeTab === "contacts" && (
              <ContactsScreen onSendTo={handleSendTo} />
            )}
            {activeTab === "activity" && <ActivityScreen />}
            {activeTab === "profile" && <ProfileScreen />}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav active={activeTab} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}
