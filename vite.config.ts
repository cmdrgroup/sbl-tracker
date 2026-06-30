// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Vercel migration:
//  - cloudflare:false  -> drop Lovable's build-only Workers plugin (no wrangler bundle).
//  - spa.enabled:true  -> the app is 100% client-rendered (Supabase client auth, no
//    server functions/loaders), so emit a static SPA shell. Vercel then serves it as a
//    plain static site with an index.html fallback — no serverless runtime needed.
// Dev server is unaffected. See DEPLOY-VERCEL.md.
export default defineConfig({
  cloudflare: false,
  tanstackStart: { spa: { enabled: true } },
});
