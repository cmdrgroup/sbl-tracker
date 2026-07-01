# Command Overlay — email templates

Branded (CMDR doctrine: command-black bg, command-gold CTA, steel-white text), table-based +
inline-styled HTML so they render across email clients. Dark theme.

## Where each goes

**Supabase Auth templates** — paste into Supabase → project *Command Overlay CRM* → **Auth →
Email Templates** (each template's HTML box). They use GoTrue's `{{ .ConfirmationURL }}` variable.
First point Auth → **SMTP settings** at your Resend SMTP creds so these actually send via Resend
(and lift the built-in rate limit).
- `auth-magic-link.html`       → "Magic Link" template
- `auth-confirm-signup.html`   → "Confirm signup" template
- `auth-invite.html`           → "Invite user" template
- `auth-reset-password.html`   → "Reset Password" template
- `auth-change-email.html`     → "Change Email Address" template (uses `{{ .NewEmail }}` too)
- `auth-reauthentication.html` → "Reauthentication" template — sends a **6-digit code**, uses `{{ .Token }}` (no link/button)

**Resend transactional** (sent from your own code / support tool via the Resend API) — these use
`{{name}}`, `{{app_url}}`, `{{message}}`, `{{ticket_id}}` placeholders (swap for your templating):
- `welcome.html`        → send after a client's first successful login / activation
- `support-reply.html`  → send when replying to a support ticket

## Notes
- Fonts: email clients can't reliably load Bebas Neue/Barlow, so these use a web-safe stack that
  keeps the tactical, letter-spaced feel. The `⬛ COMMAND OVERLAY` wordmark mirrors the app.
- Sender: set From to something like `Command Overlay <ops@commandoverlay.com>` in Resend/Supabase,
  with SPF/DKIM verified on `commandoverlay.com` for deliverability.
