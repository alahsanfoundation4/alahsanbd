import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/integrations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return Response.json({ error: "অনুমোদন নেই" }, { status: 401 });
        const supabaseUrl = process.env["SUPABASE_URL"];
        const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!supabaseUrl || !publishableKey) return Response.json({ error: "সার্ভার কনফিগারেশন অসম্পূর্ণ" }, { status: 500 });
        const auth = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data: user, error } = await auth.auth.getUser(token);
        if (error || !user.user) return Response.json({ error: "লগইন করুন" }, { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.user.id, _role: "admin" });
        if (!isAdmin) return Response.json({ error: "শুধু অ্যাডমিন" }, { status: 403 });

        const body = await request.json().catch(() => null);
        const index = Number(body?.index);
        if (!Number.isInteger(index) || index < 0 || index >= 10) return Response.json({ error: "ইন্টিগ্রেশন নির্বাচন সঠিক নয়" }, { status: 400 });
        const { data: keys, error: keyError } = await supabaseAdmin.from("ai_keys").select("key_pool").eq("id", 1).maybeSingle();
        if (keyError) return Response.json({ error: "ইন্টিগ্রেশন সেটিংস পড়া যায়নি" }, { status: 500 });
        const pool = Array.isArray(keys?.key_pool) ? keys.key_pool as Array<Record<string, unknown>> : [];
        const entry = pool[index];
        if (!entry || entry["active"] === false) return Response.json({ error: "ইন্টিগ্রেশন নেই বা বন্ধ আছে। আগে সেটিংস সংরক্ষণ করুন।" }, { status: 404 });

        const provider = String(entry["provider"] ?? "");
        const secret = typeof entry["key"] === "string" ? entry["key"].trim() : "";
        const city = typeof entry["model"] === "string" && entry["model"].trim() ? entry["model"].trim() : "Dhaka";
        const path = typeof entry["model"] === "string" && entry["model"].trim() ? entry["model"].trim().replace(/^\/+|\/+$/g, "") : "posts/1";
        let upstream: Response | null = null;
        try {
          if (provider === "weather") {
            if (!secret) return Response.json({ error: "OpenWeatherMap API key দিন এবং সংরক্ষণ করুন" }, { status: 400 });
            upstream = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(secret)}&units=metric`, { signal: AbortSignal.timeout(10000) });
            if (upstream.ok) {
              const data = await upstream.json() as { name?: string; main?: { temp?: number }; weather?: Array<{ description?: string }> };
              const description = data.weather?.[0]?.description ?? "আবহাওয়ার তথ্য পাওয়া গেছে";
              return Response.json({ ok: true, message: `${data.name ?? city}: ${description}, ${typeof data.main?.temp === "number" ? `${Math.round(data.main.temp)}°C` : "তাপমাত্রা পাওয়া যায়নি"}` });
            }
          } else if (provider === "jsonplaceholder") {
            if (!/^(posts|todos|users|comments|albums|photos)(\/\d+)?$/.test(path)) return Response.json({ error: "নিরাপদ পরীক্ষার path দিন: posts/1, todos/1 বা users/1" }, { status: 400 });
            upstream = await fetch(`https://jsonplaceholder.typicode.com/${path}`, { signal: AbortSignal.timeout(10000) });
            if (upstream.ok) {
              const payload: unknown = await upstream.json();
              const preview = JSON.stringify(payload).slice(0, 100);
              return Response.json({ ok: true, message: `JSONPlaceholder সচল (${path}); নমুনা: ${preview}` });
            }
          } else {
            return Response.json({ error: "এই পরীক্ষা কেবল OpenWeatherMap ও JSONPlaceholder-এর জন্য" }, { status: 400 });
          }
        } catch {
          return Response.json({ error: "API-তে সংযোগ করা যায়নি; পরে আবার চেষ্টা করুন" }, { status: 502 });
        }
        const message = provider === "weather"
          ? upstream?.status === 401 ? "API key ভুল বা এখনো সক্রিয় হয়নি" : upstream?.status === 404 ? "শহর পাওয়া যায়নি" : upstream?.status === 429 ? "provider rate limit অতিক্রম হয়েছে" : `OpenWeatherMap ত্রুটি (${upstream?.status ?? "network"})`
          : `JSONPlaceholder ত্রুটি (${upstream?.status ?? "network"})`;
        return Response.json({ error: message }, { status: 502 });
      },
    },
  },
});
