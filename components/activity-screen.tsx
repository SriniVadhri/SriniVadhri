"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TRANSACTIONS, RAIL_META, formatUSD } from "@/lib/data";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export function ActivityScreen() {
  const [directionFilter, setDirectionFilter] = useState<
    "all" | "sent" | "received"
  >("all");

  const sorted = useMemo(() => {
    let txs = [...TRANSACTIONS].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (directionFilter !== "all")
      txs = txs.filter((t) => t.direction === directionFilter);
    return txs;
  }, [directionFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof sorted>();
    for (const tx of sorted) {
      const day = new Date(tx.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(tx);
    }
    return Array.from(map.entries());
  }, [sorted]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-bold text-foreground">Activity</h1>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "sent", "received"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setDirectionFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              directionFilter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grouped Transactions */}
      {grouped.map(([date, txs]) => (
        <section key={date}>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            {date}
          </p>
          <div className="flex flex-col gap-1">
            {txs.map((tx) => (
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
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-foreground">
                      {tx.contactName}
                    </p>
                    {tx.status === "completed" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    )}
                    {tx.status === "pending" && (
                      <Clock className="h-3.5 w-3.5 text-warning" />
                    )}
                    {tx.status === "failed" && (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tx.note} &middot; {RAIL_META[tx.rail].label}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {tx.direction === "sent" ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-foreground" />
                    ) : (
                      <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                    )}
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
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
