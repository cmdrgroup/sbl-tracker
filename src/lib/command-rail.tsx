// ─────────────────────────────────────────────────────────────────────────────
// COMMAND RAIL — copy-controlled shared module.
//
//   ⚠️  SOURCE OF TRUTH: toc-app/src/lib/command-rail.tsx
//   ⚠️  DO NOT EDIT in satellite repos. Sync from toc-app on every change.
//   ⚠️  If you change RAIL_APPS or COMMAND_POST_URL, re-sync ALL repos.
//
// This is the single registry of where the CMDR apps live + the cross-app rail
// that renders "← Command Post", the current-app label, the operator identity,
// and a sign-out button.
//
// Framework-free by construction: it renders ONLY plain <a> and <button> with
// inline styles (no Tailwind classes, no router <Link>, no CSS-var deps), so it
// drops UNCHANGED into Next.js (Close), Vite + React Router (Quotes/Sweep/
// Intake) and TanStack Start (Overlay). The only import is React.
//
// Version: 2026-07-05.1
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties, ReactElement } from 'react'

export type AppKey = 'toc' | 'close' | 'quotes' | 'briefing' | 'clearing' | 'overlay'

export interface RailApp {
  key: AppKey
  name: string
  url: string
}

/** Where the TOC member portal (the "Command Post") lives. */
export const COMMAND_POST_URL = 'https://commandtoc.com/m'

/**
 * The ONE app registry. Every cross-app link in every repo derives from this.
 * `toc` is intentionally omitted — it is the hub, not a stack destination.
 */
export const RAIL_APPS: RailApp[] = [
  { key: 'close', name: 'Command Close', url: 'https://commandclose.com' },
  { key: 'quotes', name: 'Command Quotes', url: 'https://www.commandquotes.com' },
  { key: 'briefing', name: 'Command Intake', url: 'https://commandintake.com' },
  { key: 'clearing', name: 'Command Sweep', url: 'https://commandsweep.com' },
  { key: 'overlay', name: 'Command Overlay', url: 'https://app.commandoverlay.com' },
]

/** Display name for any app key, including the hub. */
export function appName(key: AppKey): string {
  if (key === 'toc') return 'Command Post'
  return RAIL_APPS.find((a) => a.key === key)?.name ?? 'CMDR'
}

// ── Doctrine palette (inline so the Rail looks identical regardless of the
//    host app's CSS setup). Mirrors toc-app src/index.css @theme. ──────────────
const COLORS = {
  chrome: '#161618',
  gunmetal: '#2D2D2F',
  slate: '#8B8B90',
  steelWhite: '#E4E4E7',
  gold: '#C4A04F',
} as const

const MONO =
  "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"

export interface CommandRailProps {
  /** Which app this Rail is mounted in (drives the label + hides the self-link). */
  currentAppKey: AppKey
  /** Logged-in operator email; hidden if absent. */
  userEmail?: string | null
  /** App-supplied sign-out (Supabase signOut, POST to /auth/signout, etc.). */
  signOut: () => void | Promise<void>
}

/**
 * The cross-app rail. Mount it in the top strip of each app's shell.
 * v1: "← Command Post" back-link only (no sibling switcher — peer one-login
 * isn't brokered yet; from the portal the Command Stack still launches apps).
 */
export function CommandRail({ currentAppKey, userEmail, signOut }: CommandRailProps): ReactElement {
  const initial = (userEmail?.trim()?.[0] ?? '·').toUpperCase()

  return (
    <div style={barStyle} className="cmdr-command-rail">
      {currentAppKey !== 'toc' && (
        <a href={COMMAND_POST_URL} style={backLinkStyle} title="Return to the TOC portal">
          ← Command Post
        </a>
      )}

      <span style={currentLabelStyle}>{appName(currentAppKey)}</span>

      <span style={{ flex: 1 }} />

      {userEmail ? (
        <span style={identityStyle} title={userEmail}>
          <span style={avatarStyle}>{initial}</span>
          <span style={emailStyle}>{userEmail}</span>
        </span>
      ) : null}

      <button type="button" onClick={() => void signOut()} style={signOutStyle}>
        Sign out
      </button>
    </div>
  )
}

// ── Inline style objects ─────────────────────────────────────────────────────
const barStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 40,
  padding: '0 16px',
  background: COLORS.chrome,
  borderBottom: `1px solid ${COLORS.gunmetal}`,
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: COLORS.slate,
  boxSizing: 'border-box',
  width: '100%',
}

const backLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  color: COLORS.slate,
  textDecoration: 'none',
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.14em',
  transition: 'color 120ms ease',
  whiteSpace: 'nowrap',
}

const currentLabelStyle: CSSProperties = {
  color: COLORS.gold,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const identityStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
}

const avatarStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  borderRadius: 4,
  background: 'rgba(196,160,79,0.12)',
  border: `1px solid ${COLORS.gunmetal}`,
  color: COLORS.gold,
  fontSize: 10,
  flexShrink: 0,
}

const emailStyle: CSSProperties = {
  color: COLORS.steelWhite,
  textTransform: 'none',
  letterSpacing: 'normal',
  fontSize: 11,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 200,
}

const signOutStyle: CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: `1px solid ${COLORS.gunmetal}`,
  borderRadius: 4,
  color: COLORS.slate,
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  padding: '5px 10px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
