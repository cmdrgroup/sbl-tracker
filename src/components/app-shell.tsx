import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, ClipboardList, Users, Settings, Sparkles,
  Bell, Search, ChevronDown, Command, Plus, Activity, Target, Menu, X, LogOut, Send,
} from "lucide-react";
import type { Client } from "@/lib/types";
import { useActiveClient } from "@/lib/client-context";
import { useAuth } from "@/lib/auth-context";
import { isDemoClient, stripDemoPrefix } from "@/lib/demo-seed";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  activeClient: Client;
  onClientChange: (c: Client) => void;
  onOpenCommand: () => void;
};

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard, badge: undefined as string | undefined },
  { to: "/playbooks", label: "Playbooks", icon: BookOpen, badge: "72%" },
  { to: "/sops", label: "SOPs", icon: ClipboardList, badge: "4" },
  { to: "/submit", label: "Submit", icon: Send, badge: undefined },
  { to: "/coaching", label: "Coaching Logs", icon: Target, badge: undefined },
  { to: "/team", label: "Team", icon: Users, badge: undefined },
  { to: "/insights", label: "AI Insights", icon: Sparkles, badge: "new" },
  { to: "/settings", label: "Settings", icon: Settings, badge: undefined },
] as const;

// Helper: generate initials from a name
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppShell({ children, activeClient, onClientChange, onOpenCommand }: Props) {
  const loc = useLocation();
  const { clients } = useActiveClient();
  const { profile, signOut } = useAuth();
  const [clientOpen, setClientOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [loc.pathname]);

  const sidebar = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-background border border-primary/40 flex items-center justify-center shadow-[0_0_20px_oklch(0.72_0.105_80_/_0.25)]">
            <Command className="h-4 w-4 text-primary" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-[18px] font-bold tracking-[0.18em] text-primary leading-none">CMDR</div>
            <div className="text-[10px] text-foreground/80 font-mono uppercase tracking-[0.25em] mt-1">Group · COS</div>
            <div className="h-[2px] w-10 bg-accent mt-1.5" />
          </div>
        </div>
        <button
          onClick={() => setMobileNavOpen(false)}
          className="md:hidden h-8 w-8 rounded-md hover:bg-secondary/60 flex items-center justify-center"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Client switcher */}
      <div className="p-3 border-b border-border relative">
        <button
          onClick={() => setClientOpen(!clientOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-elevated hover:bg-secondary/60 transition-colors text-left"
        >
          <div
            className="h-8 w-8 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: activeClient.color, color: "oklch(0.15 0.02 270)" }}
          >
            {getInitials(activeClient.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{activeClient.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{activeClient.industry}</div>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", clientOpen && "rotate-180")} />
        </button>

        {clientOpen && (
          <div className="absolute top-full left-3 right-3 mt-1 z-30 glass rounded-lg p-1.5 shadow-elevated">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-mono">Clients · {clients.length}</div>
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => { onClientChange(c); setClientOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-secondary/60 transition-colors text-left",
                  c.id === activeClient.id && "bg-secondary/60",
                )}
              >
                <div
                  className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold"
                  style={{ background: c.color, color: "oklch(0.15 0.02 270)" }}
                >
                  {getInitials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{c.name}</div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">{c.health_score}</div>
              </button>
            ))}
            <div className="border-t border-border mt-1 pt-1">
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60 text-[12px] text-muted-foreground">
                <Plus className="h-3.5 w-3.5" /> Add client
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {nav.map((item) => {
          const active = loc.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as any}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors",
                active
                  ? "bg-primary/15 text-foreground border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider",
                  item.badge === "new" ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-secondary/40">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-[11px] font-bold text-background">
            {profile ? getInitials(profile.full_name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium truncate">{profile?.full_name ?? "Loading..."}</div>
            <div className="text-[10px] text-muted-foreground truncate capitalize">{profile?.role?.replace("_", " ") ?? ""}</div>
          </div>
          <button
            onClick={signOut}
            className="h-7 w-7 rounded-md hover:bg-secondary/60 flex items-center justify-center"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] border-r border-border bg-surface/40 flex-col shrink-0">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[85vw] border-r border-border bg-surface flex flex-col animate-in slide-in-from-left duration-200">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-surface/30 backdrop-blur-xl flex items-center px-3 md:px-6 gap-2 md:gap-4 sticky top-0 z-20">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden h-9 w-9 rounded-md hover:bg-secondary/60 flex items-center justify-center shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile mini logo */}
          <div className="md:hidden flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-background border border-primary/40 flex items-center justify-center">
              <Command className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-display text-[14px] font-bold tracking-[0.18em] text-primary">CMDR</span>
          </div>

          <button
            onClick={onOpenCommand}
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-surface-elevated border border-border hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground text-[13px] md:min-w-[320px]"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search or run command...</span>
            <kbd className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border">⌘K</kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={onOpenCommand}
            className="sm:hidden h-9 w-9 rounded-md hover:bg-secondary/60 flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/30">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-success">Live · synced 12s ago</span>
          </div>

          {/* Mobile compact live dot */}
          <div className="md:hidden h-1.5 w-1.5 rounded-full bg-success animate-pulse" />

          <button className="relative h-9 w-9 rounded-md hover:bg-secondary/60 flex items-center justify-center">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>
        </header>

        <main className="flex-1 overflow-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
