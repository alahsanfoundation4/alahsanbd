import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_MODELS, LOVABLE_MODELS, GROQ_MODELS, OPENROUTER_MODELS, normalizeModel, type Provider } from "@/lib/models";
import { buildSearchQuery } from "@/lib/search-query";
import { ENGINEER_PROMPT, PERSONA, BASE_PROMPT, SITE_BUILDER_PROMPT, INTEGRITY } from "@/lib/chat/prompts";
import { needsSearch, readUrls, webSearch } from "@/lib/chat/search";
import { wantsImage, generateImage } from "@/lib/chat/image";
import { friendlyError, withStages, stageStream } from "@/lib/chat/streaming";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(40000),
        image: z.string().regex(/^data:image\/(png|jpe?g|webp|gif);base64,/).max(4_000_000).optional(),
        images: z.array(z.string().regex(/^data:image\/(png|jpe?g|webp|gif);base64,/).max(2_500_000)).max(5).optional(),
      })
    )
    .min(1)
    .max(60),
  model: z.string().max(80).optional(),
  mode: z.string().max(50).optional(),
});

type PoolKey = { provider: string; key: string; label?: string; active?: boolean };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async (ctx) => {
        try {
          return await handleChat(ctx.request);
        } catch (e) {
          console.error("Critical Engine Exception:", e);
          return new Response("সার্ভারে সাময়িক সমস্যা হয়েছে। কয়েক সেকেন্ড পর আবার চেষ্টা করুন।", { status: 503 });
        }
      },
    },
  },
});

let cachedSettings: { data: any; time: number } | null = null;
let cachedKeys: { data: any; time: number } | null = null;

async function getCachedSettingsAndKeys(supabaseAdmin: any) {
  const now = Date.now();
  const needSettings = !cachedSettings || now - cachedSettings.time > 10_000;
  const needKeys = !cachedKeys || now - cachedKeys.time > 10_000;

  try {
    const [sRes, kRes] = await Promise.all([
      needSettings ? supabaseAdmin.from("ai_settings").select("*").eq("id", 1).maybeSingle() : Promise.resolve({ data: cachedSettings!.data }),
      needKeys ? supabaseAdmin.from("ai_keys").select("*").eq("id", 1).maybeSingle() : Promise.resolve({ data: cachedKeys!.data }),
    ]);

    if (needSettings && sRes?.data) cachedSettings = { data: sRes.data, time: now };
    if (needKeys && kRes?.data) cachedKeys = { data: kRes.data, time: now };
  } catch (err) {
    console.error("Cache lookup failure:", err);
  }

  return { s: cachedSettings?.data, keys: cachedKeys?.data };
}

async function handleChat(request: Request): Promise<Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return new Response("Unauthorized", { status: 401 });

  const supabaseUrl = process.env["SUPABASE_URL"] || DEFAULT_SUPABASE_URL;
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!supabaseUrl || !serviceKey) {
    return new Response("Supabase credentials missing", { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: u, error: ue }, bodyJson] = await Promise.all([
    supabaseAdmin.auth.getUser(token),
    request.json().catch(() => null),
  ]);

  if (ue || !u?.user) return new Response("Unauthorized", { status: 401 });
  const uid = u.user.id;

  const parsed = Body.safeParse(bodyJson);
  if (!parsed.success) {
    return new Response("অবৈধ বার্তা ফরম্যাট।", { status: 400 });
  }

  const { messages, model: requestedModel, mode } = parsed.data;
  const lastMsg = messages[messages.length - 1]!;
  const lastMsgText = lastMsg.content;

  // ১. ইমেজ জেনারেশন অনুরোধ পরীক্ষা
  if (wantsImage(lastMsgText)) {
    return stageStream(["🎨 ছবি তৈরির পরিকল্পনা...", "✨ ছবি আঁকা হচ্ছে..."], async () => {
      const imgUrl = await generateImage(lastMsgText);
      if (!imgUrl) return "দুঃখিত, এই মুহূর্তে ছবিটি তৈরি করা যায়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।";
      return `![${lastMsgText.slice(0, 50)}](${imgUrl})\n\nআপনার কাঙ্ক্ষিত ছবিটি তৈরি করা হয়েছে।`;
    });
  }

  // ২. লাইভ ডাটা, সেটিংস ও মেমোরি প্যারালাল লোড
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();

  const [settingsAndKeys, hourUsage, dayUsage, fatwasModule, memoryModule] = await Promise.all([
    getCachedSettingsAndKeys(supabaseAdmin),
    supabaseAdmin.from("chat_usage").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", hourAgo),
    supabaseAdmin.from("chat_usage").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", dayAgo),
    import("@/lib/fatwa.server").catch(() => null),
    import("@/lib/memory.server").catch(() => null),
  ]);

  const { s, keys } = settingsAndKeys;

  // রেট লিমিট ভেরিফিকেশন
  const hLimit = s?.rate_limit_hourly ?? 120;
  const dLimit = s?.rate_limit_daily ?? 1200;
  if ((hourUsage.count ?? 0) >= hLimit) {
    return new Response("ঘণ্টার সর্বোচ্চ বার্তার সীমা অতিক্রম করেছে। একটু পরে চেষ্টা করুন।", { status: 429 });
  }
  if ((dayUsage.count ?? 0) >= dLimit) {
    return new Response("দৈনিক সর্বোচ্চ বার্তার সীমা অতিক্রম করেছে। আগামীকাল চেষ্টা করুন।", { status: 429 });
  }

  void supabaseAdmin.from("chat_usage").insert({ user_id: uid }).then(() => {});

  // ৩. মেমোরি ও ফতোয়া লোড
  const [fatwas, userMemories] = await Promise.all([
    fatwasModule ? fatwasModule.findFatwas(lastMsgText) : [],
    memoryModule ? memoryModule.loadMemory(uid, 40) : [],
  ]);

  // ৪. ওয়েব সার্চ বা ইউআরএল স্ক্র্যাপার
  const stages: string[] = ["মডেল নির্বাচন ও যাচাই..."];
  let webData = "";
  if (needsSearch(lastMsgText)) {
    stages.push("🌐 ওয়েব অনুসন্ধান চলছে...");
    webData = await webSearch(lastMsgText).catch(() => "");
  } else if (/https?:\/\//.test(lastMsgText)) {
    stages.push("🔗 লিংক বিশ্লেষণ চলছে...");
    webData = await readUrls(lastMsgText).catch(() => "");
  }

  // ৫. সিস্টেম প্রম্পট অ্যাসেম্বলি
  const isEngineer = mode === "engineer";
  const isSiteReq = /(ওয়েবসাইট|ল্যান্ডিং পেজ|website|landing page)/i.test(lastMsgText);
  let system = isEngineer ? ENGINEER_PROMPT : isSiteReq ? SITE_BUILDER_PROMPT : `${PERSONA}\n\n${BASE_PROMPT}`;

  if (userMemories?.length) {
    system += `\n\n=== ব্যবহারকারী সম্পর্কে তথ্য (স্মৃতি) ===\n${userMemories.map((m: any) => "- " + m.text).join("\n")}`;
  }
  if (fatwas?.length && fatwasModule) {
    system += fatwasModule.fatwaPrompt(fatwas);
  }
  if (webData) {
    system += `\n\n=== ওয়েব ও সাম্প্রতিক তথ্য ===\n${webData}`;
  }
  system += INTEGRITY;

  // ৬. প্রোভাইডার পুল ও মডেল এক্সিকিউশন
  const max_tokens = isSiteReq ? 32768 : isEngineer ? 16384 : 4096;
  const pool = (Array.isArray(keys?.key_pool) ? keys.key_pool : []) as PoolKey[];
  const defaultProvider = (s?.default_provider || "lovable") as Provider;

  let activeModel = requestedModel || normalizeModel(defaultProvider, s?.default_model);

  // এআই কল ও স্ট্রিমিং হ্যান্ডলার
  const clientAbortController = new AbortController();
  const lovableKey = process.env["LOVABLE_API_KEY"];

  let finalResponse: Response | null = null;
  let successfulAttempt: { provider: string; model: string } | null = null;

  try {
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: activeModel || "openai/gpt-5-mini",
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens,
        stream: true,
      }),
      signal: clientAbortController.signal,
    });

    if (upstream.ok && upstream.body) {
      finalResponse = upstream;
      successfulAttempt = { provider: "lovable", model: activeModel };
    }
  } catch (err) {
    console.error("Upstream error:", err);
  }

  if (!finalResponse || !finalResponse.body) {
    return new Response(friendlyError(503, "All providers failed"), { status: 503 });
  }

  return withStages(stages, finalResponse.body, clientAbortController, successfulAttempt?.provider, successfulAttempt?.model);
}
