import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_LIVE_MODEL, geminiLiveConfig } from "./gemini-live-config";
import { voiceError } from "./service-errors";

export const createGeminiLiveToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: keys }, { data: settings }] = await Promise.all([
      supabaseAdmin.from("ai_keys").select("google_key").eq("id", 1).maybeSingle(),
      supabaseAdmin.from("ai_settings").select("chat_enabled").eq("id", 1).maybeSingle(),
    ]);
    if (!settings?.chat_enabled) throw new Error("চ্যাট ও ভয়েস সেবা আপাতত বন্ধ আছে।");
    const key = keys?.google_key.trim();
    if (!key) throw new Error("অ্যাডমিন প্যানেলে Google Gemini API Key সংরক্ষণ করুন।");
    try {
      const ai = new GoogleGenAI({ apiKey: key, httpOptions: { apiVersion: "v1alpha" } });
      const token = await ai.authTokens.create({ config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60_000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 60_000).toISOString(),
        liveConnectConstraints: { model: GEMINI_LIVE_MODEL, config: geminiLiveConfig },
      } });
      if (!token.name) throw new Error("Google নিরাপদ ভয়েস টোকেন দেয়নি।");
      return { token: token.name, model: GEMINI_LIVE_MODEL };
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 503;
      throw new Error(voiceError({ httpStatus: status, message: error instanceof Error ? error.message : "" }));
    }
  });