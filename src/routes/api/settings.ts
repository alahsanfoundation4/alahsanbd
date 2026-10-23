import { createFileRoute } from "@tanstack/react-router";
import { ALL_AVAILABLE_MODELS } from "@/lib/models";

// Safe, user-visible settings only (no prompts, no keys).
export const Route = createFileRoute("/api/settings")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("ai_settings")
          .select("welcome_title,welcome_subtitle,suggestions,chat_enabled,site_builder,admin_note")
          .eq("id", 1)
          .maybeSingle();

        const defaultModes = { study: true, write: true, code: true, engineer: true };
        const defaultModels = ALL_AVAILABLE_MODELS.map((m) => m.id);

        let modes = defaultModes;
        let allowed_models = defaultModels;

        if (data?.admin_note) {
          const m = data.admin_note.match(/<!--CONFIG:(.*?)-->/);
          if (m) {
            try {
              const cfg = JSON.parse(m[1] ?? "{}");
              if (cfg && typeof cfg === "object") {
                if (cfg.modes && typeof cfg.modes === "object") {
                  modes = { ...defaultModes, ...cfg.modes };
                }
                if (Array.isArray(cfg.allowed_models) && cfg.allowed_models.length > 0) {
                  allowed_models = cfg.allowed_models;
                }
              }
            } catch {}
          }
        }

        const safeData = {
          welcome_title: data?.welcome_title ?? "",
          welcome_subtitle: data?.welcome_subtitle ?? "",
          suggestions: data?.suggestions ?? "",
          chat_enabled: data?.chat_enabled ?? true,
          site_builder: data?.site_builder ?? true,
          modes,
          allowed_models,
        };

        return Response.json(safeData, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
