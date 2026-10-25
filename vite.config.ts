// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { liveVoiceDev } from "./live-vite-plugin";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const DEFAULT_SUPABASE_URL = "https://c--4e9a5c82-349f-42ed-b939-6c621c23126e-prod.lovable.cloud";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_AT-wR43_1WdeuljfZKNqqQ_JwfIaij7";
const DEFAULT_SUPABASE_PROJECT_ID = "bnhhodvylhfhzhkghkaa";

export default defineConfig({
  vite: {
    plugins: [liveVoiceDev()],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        process.env.VITE_SUPABASE_PROJECT_ID || DEFAULT_SUPABASE_PROJECT_ID
      ),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
