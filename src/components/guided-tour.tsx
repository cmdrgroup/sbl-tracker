import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, X, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Onboarding spotlight tour: dims the screen except the active element, points a
// pulsing arrow at it, and steps a new operator through submitting their first SOP.
// Runs once per user (localStorage); replay via the `co:replay-tour` window event.

type Step = {
  target?: string; // data-tour attribute value; undefined → centered welcome/finish
  route?: string; // navigate here before showing this step
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: "Welcome to Command Overlay",
    body: "Your operational picture — SOPs, progress and decisions in one place. Let's submit your first SOP together.",
  },
  {
    target: "nav-submit",
    route: "/",
    title: "Submit an SOP",
    body: "Everything starts here — this is where you drop a new SOP recording.",
  },
  {
    target: "submit-name",
    route: "/submit",
    title: "Pick your name",
    body: "Choose who's submitting so it lands in the right department.",
  },
  {
    target: "submit-links",
    route: "/submit",
    title: "Paste your recording",
    body: "Record once in Loom or Scribe, then paste the share link — that's the whole job.",
  },
  {
    target: "submit-button",
    route: "/submit",
    title: "Ship it",
    body: "Hit Submit and it enters the pipeline for review.",
  },
  {
    target: "nav-register",
    route: "/",
    title: "Your finalised SOPs",
    body: "Approved SOPs collect in the SOP Register — printable or exportable anytime.",
  },
];

const DONE_KEY = "co_tour_v1_done";
type Rect = { top: number; left: number; width: number; height: number };

export function GuidedTour() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const key = `${DONE_KEY}_${profile?.id ?? "anon"}`;

  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const pollRef = useRef<number | null>(null);

  const start = useCallback(() => { setIdx(0); setActive(true); }, []);
  const finish = useCallback(() => {
    setActive(false);
    try { localStorage.setItem(key, "1"); } catch { /* ignore */ }
  }, [key]);

  // Auto-launch once per user (a beat after first render).
  useEffect(() => {
    if (!profile) return;
    let done = false;
    try { done = localStorage.getItem(key) === "1"; } catch { /* ignore */ }
    if (done) return;
    const t = setTimeout(() => setActive(true), 900);
    return () => clearTimeout(t);
  }, [profile, key]);

  // Replay from a "Take the tour" control anywhere.
  useEffect(() => {
    const h = () => start();
    window.addEventListener("co:replay-tour", h);
    return () => window.removeEventListener("co:replay-tour", h);
  }, [start]);

  const step = STEPS[idx];

  // Navigate (if needed) then locate the target for this step.
  useEffect(() => {
    if (!active) return;
    if (step.route) navigate({ to: step.route as string });
    if (!step.target) { setRect(null); return; }
    setRect(null);
    let tries = 0;
    const find = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (!el) return false;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      return true;
    };
    if (!find()) {
      pollRef.current = window.setInterval(() => {
        tries += 1;
        if (find() || tries > 25) { if (pollRef.current) window.clearInterval(pollRef.current); }
      }, 100);
    }
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [active, idx, step, navigate]);

  // Keep the spotlight glued to the target on scroll/resize.
  useEffect(() => {
    if (!active || !step.target) return;
    const reposition = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [active, step]);

  if (!active) return null;

  const isLast = idx === STEPS.length - 1;
  const pad = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let tip: React.CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + 20;
    const placeAbove = below > vh - 190;
    const left = Math.min(Math.max(rect.left, 16), Math.max(vw - 336, 16));
    tip = placeAbove ? { bottom: vh - rect.top + 20, left } : { top: below, left };
  } else {
    tip = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {rect ? (
        <div
          className="absolute rounded-md border-2 border-primary transition-all duration-300"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(10,10,10,0.74)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-background/85" />
      )}

      {rect && (
        <div
          className="absolute"
          style={{ top: rect.top + rect.height + pad + 2, left: rect.left + rect.width / 2 - 12 }}
        >
          <ArrowUp className="h-6 w-6 text-primary animate-bounce" strokeWidth={2.5} />
        </div>
      )}

      <div
        className="pointer-events-auto absolute w-[320px] max-w-[90vw] rounded-md border border-primary/40 bg-card p-4 shadow-elevated"
        style={tip}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {idx + 1} / {STEPS.length}
          </span>
          <button onClick={finish} className="text-muted-foreground hover:text-foreground" aria-label="Close tour">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="font-display text-[18px] uppercase tracking-[0.03em] text-foreground">{step.title}</div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={finish} className="text-[11px] text-muted-foreground hover:text-foreground">Skip</button>
          <div className="flex items-center gap-2">
            {idx > 0 && (
              <button
                onClick={() => setIdx((i) => i - 1)}
                className="rounded-md border border-border bg-secondary/60 px-3 py-1.5 text-[11px]"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setIdx((i) => i + 1))}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground"
            >
              {isLast ? <>Done <Check className="h-3.5 w-3.5" /></> : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
