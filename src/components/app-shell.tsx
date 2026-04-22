import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, BookOpen, ClipboardList, Users, Settings, Sparkles,
  Bell, Search, ChevronDown, Command, Plus, Activity, Target,
} from "lucide-react";
import { clients, type Client } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  activeClient: Client;
  onClientChange: (c: Client) => void;
  onOpenCommand: () => void;
};

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/playbooks", label: "Playbooks", icon: BookOpen, badge: "72%" },
  { to: "/sops", label: "SOPs", icon: ClipboardList, badge: "4" },
  { to: "/coaching", label: "Coaching Logs", icon: Target },
  { to: "/team", label: "Team", icon: Users },
  { to: "/insights", label: "AI Insights", icon: Sparkles, badge: "new" },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, activeClient, onClientChange, onOpenCommand }: Props) {
  const loc = useLocation();
  const [clientOpen, setClientOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-border bg-surface/40 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_oklch(0.62_0.22_280_/_0.5)]">
                <Command className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Command Overlay</div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">v2.4 · COS</div>
            </div>
          </div>
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
              {activeClient.initials}
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
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate">{c.name}</div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">{c.health}</div>
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
        <nav className="flex-1 px-3 py-3 space-y-0.5">
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
              CD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate">Curtis Davies</div>
              <div className="text-[10px] text-muted-foreground truncate">Fractional COS</div>
            </div>
            <Activity className="h-3.5 w-3.5 text-success" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-surface/30 backdrop-blur-xl flex items-center px-6 gap-4 sticky top-0 z-20">
          <button
            onClick={onOpenCommand}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-surface-elevated border border-border hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground text-[13px] min-w-[320px]"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search or run command...</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border">⌘K</kbd>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/30">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-success">Live · synced 12s ago</span>
          </div>

          <button className="relative h-8 w-8 rounded-md hover:bg-secondary/60 flex items-center justify-center">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>
        </header>

        <main className="flex-1 overflow-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
