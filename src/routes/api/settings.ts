import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

// Safe, user-visible settings on GET; authenticated admin updates on POST.
export const Route = createFileRoute("/api/settings")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("ai_settings")
            .select("welcome_title,welcome_subtitle,suggestions,chat_enabled,site_builder,provider,model")
            .eq("id", 1)
            .maybeSingle();
          return Response.json(data ?? {}, { headers: { "Cache-Control": "no-store" } });
        } catch (e: any) {
          console.warn("[settings GET] Fallback:", e);
          return Response.json({}, { headers: { "Cache-Control": "no-store" } });
        }
      },
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabaseUrl = process.env["SUPABASE_URL"] || DEFAULT_SUPABASE_URL;
        const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"] || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
        const pub = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data: u, error: ue } = await pub.auth.getUser(token);
        if (ue || !u?.user) return new Response("Unauthorized", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
        if (!isAdmin) return new Response("শুধু অ্যাডমিন", { status: 403 });

        const body = await request.json().catch(() => null);
        if (!body) return new Response("Invalid body", { status: 400 });

        const { settings, keys } = body;
        if (settings) {
          const { error: sErr } = await supabaseAdmin.from("ai_settings").upsert({
            ...settings,
            id: 1,
            hourly_limit: Math.max(1, settings.hourly_limit || 1),
            daily_limit: Math.max(1, settings.daily_limit || 1),
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });
          if (sErr) return Response.json({ ok: false, error: sErr.message }, { status: 500 });
        }

        if (keys) {
          const { google_key, openai_key, openrouter_key, key_pool } = keys;
          const cleanPool = Array.isArray(key_pool) ? key_pool : [];
          let kErr: any = null;
          const kRes = await supabaseAdmin.from("ai_keys").upsert({
            id: 1,
            google_key: (google_key ?? "").trim(),
            openai_key: (openai_key ?? "").trim(),
            openrouter_key: (openrouter_key ?? "").trim(),
            key_pool: cleanPool,
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });
          kErr = kRes.error;

          if (kErr && (kErr.message?.includes("openrouter_key") || kErr.code === "PGRST204" || kErr.message?.includes("column"))) {
            const fallbackRes = await supabaseAdmin.from("ai_keys").upsert({
              id: 1,
              google_key: (google_key ?? "").trim(),
              openai_key: (openai_key ?? "").trim(),
              key_pool: cleanPool,
              updated_at: new Date().toISOString(),
            }, { onConflict: "id" });
            kErr = fallbackRes.error;
          }
          if (kErr) return Response.json({ ok: false, error: kErr.message }, { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
