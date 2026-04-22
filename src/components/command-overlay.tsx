import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  Search, FileText, Users, BookOpen, Sparkles, Plus, BarChart3,
  CheckCircle2, Calendar, Settings, ArrowRight, Zap, Target, Bell,
} from "lucide-react";
import { clients } from "@/lib/demo-data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandOverlay({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

      {/* Glow */}
      <div className="absolute top-[10vh] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Palette */}
      <div
        className="relative w-full max-w-[640px] glass rounded-2xl shadow-elevated overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent" loop>
          {/* Search */}
          <div className="flex items-center gap-3 px-4 border-b border-border/60">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search SOPs, clients, log a decision, ask AI..."
              className="flex-1 h-14 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">ESC</kbd>
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto scrollbar-thin p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results. Try "log decision" or "switch client"
            </Command.Empty>

            {/* AI Suggestion */}
            {query.length > 0 && (
              <Command.Group heading="Ask Command AI" className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono px-2 py-1.5">
                <Command.Item className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-primary/15 data-[selected=true]:border-primary/30 border border-transparent">
                  <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">Ask AI: "{query}"</div>
                    <div className="text-[11px] text-muted-foreground">Search across all client context · 2.3s avg</div>
                  </div>
                  <kbd className="text-[10px] font-mono text-muted-foreground">↵</kbd>
                </Command.Item>
              </Command.Group>
            )}

            <Item icon={Plus} label="Log a Captain's Table session" hint="New coaching log" shortcut="L" />
            <Item icon={CheckCircle2} label="Approve pending SOP" hint="4 awaiting review" shortcut="A" />
            <Item icon={FileText} label="Submit Loom recording" hint="Add to playbook" shortcut="S" />
            <Item icon={Target} label="Add action item" hint="To open list" />
            <Item icon={Bell} label="Send weekly client update" hint="Auto-draft from this week" />

            <Command.Group heading="Switch client" className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono px-2 py-1.5 mt-2">
              {clients.slice(0, 4).map((c) => (
                <Command.Item
                  key={c.id}
                  value={`client ${c.name}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-primary/15 border border-transparent data-[selected=true]:border-primary/30"
                >
                  <div
                    className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: c.color, color: "oklch(0.15 0.02 270)" }}
                  >
                    {c.initials}
                  </div>
                  <span className="flex-1 text-[13px]">{c.name}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">health {c.health}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Navigate" className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono px-2 py-1.5 mt-2">
              <Item icon={BarChart3} label="Overview" hint="Dashboard" />
              <Item icon={BookOpen} label="Playbooks" />
              <Item icon={Users} label="Team" />
              <Item icon={Calendar} label="Coaching Logs" />
              <Item icon={Settings} label="Settings" />
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-accent" />
              <span className="font-mono">Command Overlay AI</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span><kbd className="px-1 py-0.5 rounded bg-secondary border border-border">↑↓</kbd> navigate</span>
              <span><kbd className="px-1 py-0.5 rounded bg-secondary border border-border">↵</kbd> run</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

function Item({
  icon: Icon, label, hint, shortcut,
}: { icon: any; label: string; hint?: string; shortcut?: string }) {
  return (
    <Command.Item
      value={label}
      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-primary/15 border border-transparent data-[selected=true]:border-primary/30 group"
    >
      <div className="h-7 w-7 rounded-md bg-secondary/60 group-data-[selected=true]:bg-primary/20 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground group-data-[selected=true]:text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      {shortcut && (
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
          ⌘{shortcut}
        </kbd>
      )}
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100" />
    </Command.Item>
  );
}
