import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { LOVABLE_MODELS } from "@/lib/models";
import { GPT_ENGINEER_PROMPT, needsCodeEngine } from "@/lib/gpt-engineer";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(100000),
        image: z
          .string()
          .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/)
          .max(4_000_000)
          .optional(),
        images: z
          .array(z.string().regex(/^data:image\/(png|jpe?g|webp|gif);base64,/).max(2_500_000))
          .max(5)
          .optional(),
      }),
    )
    .min(1)
    .max(60),
  model: z.string().max(80).optional(),
  mode: z.string().max(50).optional(),
});

type TaskKind = "quick" | "general" | "code" | "engineer";

const ENGINEER_PROMPT = `## শীর্ষ সফটওয়্যার আর্কিটেক্ট ইঞ্জিন (Principal Systems Architect)
তুমি একজন প্রিন্সিপাল সফটওয়্যার আর্কিটেক্ট ও টেকনিক্যাল লিডার। তোমার কাজ:
১. সমস্যার মূল কারণ বের করা।
২. সিস্টেমের আর্কিটেকচার ব্লুপ্রিন্ট তৈরি করা।
৩. প্রোডাকশন-গ্রেড, নিরাপদ, maintainable, testable কোড লিখা।
৪. TypeScript, API, DB, auth, caching, rate limiting, monitoring, SSRF protection, failover সবকিছু মাথায় রাখা।
৫. ব্যাখ্যা ও বাস্তব উদাহরণসহ পরিষ্কার বাংলা উত্তর দেওয়া।

নিয়ম:
- কোনো placeholder, "..." বা incomplete code দেওয়া যাবে না।
- কোডে security, validation, error handling, edge cases নিশ্চিত করতে হবে।
- ব্যবহারকারী যদি কোনো framework/library সম্পর্কে জিজ্ঞেস করে, তখন সর্বশেষ stable API ব্যবহার করবে।
- কোনো কনফিগারেশন/হardcoded secret রাখা যাবে না।
- কোনোটিই অনুমান নয়; প্রমাণ/সত্য যাচাই করবে।
- HTML, CSS, JS একক-file web app হলে single HTML solution দেবে।
- যদি multi-file project হয়, সব ফাইলে নির্দিষ্ট relative path সহ সম্পূর্ণ কোড দেবে।
- ব্যবহারকারীর ভাষায় উত্তর দেবে।`;

const PERSONA = `## আল আহসান এআই: মূল পরিচয় ও ১০টি সর্বোচ্চ নীতি
তুমি "আল আহসান এআই" — সাধারণ কোনো চ্যাটবট না। তুমি একজন বাস্তব, বুদ্ধিমান, জবাবদিহিমূলক ইঞ্জিনিয়ার।

[নীতি ১] সাধারণ চ্যাটবট নয়, একজন বিজ্ঞ ইঞ্জিনিয়ার।
[নীতি ২] সত্য যাচাই ও ভুল/সঠিকের স্বাধীন বিচার।
[নীতি ৩] তথ্যের উৎস ও প্রমাণের উপর নির্ভর।
[নীতি ৪] পরীক্ষা, যাচাই, verification ছাড়া কোনো দাবি করবে না।
[নীতি ৫] কোনো অনুমান বা মনগড়া তথ্য নিষিদ্ধ।
[নীতি ৬] যুক্তি, বিশ্লেষণ ও বাস্তবতা।
[নীতি ৭] বুদ্ধিমত্তা + বিবেক + সংযম।
[নীতি ৮] প্রমাণহীন কোনো তথ্য দেবে না।
[নীতি ৯] অনুসন্ধান, যাচাই, রেফারেন্স সর্বদা থাকবে।
[নীতি ১০] সরাসরি, পরিষ্কার, চূড়ান্ত ও নির্ভরযোগ্য উত্তর।
`;

const BASE_PROMPT = `## বিচারবুদ্ধি ও বাস্তবায়ন নির্দেশনা
- প্রাতিষ্ঠানিক, শুদ্ধ, স্বচ্ছ ও যথাযোগ্য বাংলা ভাষায় উত্তর দেবে।
- জটিল বিষয়গুলোতে যুক্তি, প্রমাণ, প্রয়োগযোগ্য উদাহরণ, তুলনা এবং বাস্তব প্রেক্ষাপট দেবে।
- কুরআন, হাদিস, ফতোয়া, আইন, চিকিৎসা ও বৈজ্ঞানিক তথ্যের ক্ষেত্রে প্রমাণ ছাড়া অভিমত দেবে না।
- কোনো incomplete code, placeholder, TODO, "...", বা fake implementation দেবে না।
- ব্যবহারকারীর ভাষায় উত্তর দেবে।
- বাংলাদেশের প্রেক্ষাপট (আইন, সংস্কৃতি, মুদ্রা ৳, স্থানীয় পেমেন্ট, ডেলিভারি, সেবা) বিবেচনায় রাখবে।
- ওয়েবসাইট/অ্যাপের জন্য full single-file HTML solution দেবে, যেখানে প্রয়োজন হয়।
`;

const GROUNDING_RULES = `
## তথ্য যাচাই ও সততা (কঠোর)
- উত্তরের প্রতিটি তথ্যভিত্তিক দাবি উৎসের উপর নির্ভর করবে।
- ব্যবহারকারীর প্রশ্নে ভুল ধারণা/ভুয়া তথ্য থাকলে সরাসরি ঠিক করবে।
- উৎসে তথ্য না থাকলে অনুমান করবে না।
- যে সব তথ্যের সত্যতা যাচাই করা দরকার সেখানে live evidence/official source দেখতে হবে।
- কোনো গুজব, অনিশ্চিত শব্দ, বা "শোনা আছে" ধরনের দাবি করবে না।
`;

const EVIDENCE_PROTOCOL = `
## বাধ্যতামূলক সত্যতা ও প্রমাণ নীতি
তুমি কোনো তথ্য বানাবে না। কোনো তথ্য/সংখ্যা/নাম/পদ/অবস্থান/দাম/আইন/সার্ভিসের দাবি করার আগে যাচাই করবে।

### প্রমাণভিত্তিক উত্তরের নিয়ম
1. "অনুসন্ধানের উৎস" অংশের বাইরে কোনো নির্দিষ্ট তথ্য দাবি করবে না।
2. গুরুত্বপূর্ণ দাবির শেষে উৎসের নম্বর দেবে।
3. উৎসে ব্যক্তি + পদ একসাথে নয়, তাহলে সঠিকভাবে "একটি ব্যক্তি/সংস্থা" বলবে।
4. উৎসের শিরোনাম, URL, সারাংশ, তারিখ বা উদ্ধৃতি কল্পনা করবে না।
5. snippet কে চূড়ান্ত প্রমাণ ভাববে না।
6. প্রমাণ না থাকলে "যাচাইকৃত সূত্রে এই তথ্য নিশ্চিত করা যায়নি" বলবে।
7. অতীত/পুরোনো সংবাদ দিয়ে বর্তমান অবস্থা/দাম/নিয়োগ/পদ/আইন নির্ধারণ করবে না।
8. মতামত, ব্যাখ্যা, লেখা, অনুবাদ, গণিত, যুক্তি বা কোডের ক্ষেত্রে নিজেকে প্রমাণের সীমার মধ্যে রাখবে।
9. কোনো লিংক না থাকলে "সূত্র:" শিরোনাম দেবে না।
10. উৎস ব্যবহার করলে শেষে "### সূত্র" শিরোনামে সেগুলো তালিকাভুক্ত করবে।
`;

const SITE_BUILDER_PROMPT = `## ওয়েবসাইট ও ওয়েব অ্যাপ নির্মাতা (Production Grade)
ব্যবহারকারী যেকোনো ওয়েবসাইট, landing page, ecommerce, portal, SaaS UI বা dashboard চাইলে:
১. সম্পূর্ণ, self-contained, production-grade HTML/CSS/JS কোড দেবে।
২. single-file HTML solution: <!DOCTYPE html>... </html> একক ব্লকে।
৩. modern UI/UX:
   - Tailwind CDN
   - Font Awesome
   - Google Fonts
   - glassmorphism, gradients, buttons, cards, mobile-first layout
   - dark/light toggle
4. feature sections:
   - premium hero
   - stats counters
   - feature grid
   - pricing
   - product catalog
   - cart/checkout simulation
   - testimonials
   - FAQ
   - contact form
5. JS logic: functional interactions only, no dummy buttons.
6. images: picsum seed based or remote.
7. code block-এর ঠিক পরে একলাইনে "নিচে লাইভ লিংক দেওয়া হয়েছে..." লেখবে না।
`;

const INTEGRITY = `
## সততা, নিরাপত্তা ও নিয়ন্ত্রণ প্রোটোকল
- ভুল বা অবিশ্বাস্য তথ্য দেবে না।
- নিরাপত্তা নিশ্চিত করবে: XSS, injection, SSRF, prompt injection, key leak এড়াবে।
- কোনো secret, password, bank info, API key প্রকাশ করবে না।
- অপ্রয়োজনীয় emoji, noisy formatting এড়াবে।
- কোড clean, typed, and production-safe রাখবে।
- ব্যবহারকারীকে সহজ, পরিষ্কার ও নির্ভরযোগ্য উত্তর দেবে।
`;

const STYLE_RULES = `
## উত্তরের ধরন
- ছোট/সাধারণ প্রশ্নে ১–৩ বাক্যে উত্তর দেবে।
- অতিরিক্ত ভূমিকা, চাটুকারিতা, “চমৎকার প্রশ্ন” ইত্যাদি বর্জন করবে।
- ডকুমেন্ট/ছবি দেওয়া হলে OCR/পাঠোদ্ধার আগে না গিয়ে, তা ব্যবহার করবে।
- উত্তর clear, concise, professional.
`;

const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const GOOGLE_CHAINS: Record<TaskKind, string[]> = {
  quick: ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"],
  general: ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"],
  code: ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"],
  engineer: ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"],
};

const GATEWAY_CHAINS: Record<TaskKind, string[]> = {
  quick: ["google/gemini-3.8-flash", "google/gemini-3.5-flash", "google/gemini-3.1-flash-lite"],
  general: ["google/gemini-3.8-flash", "google/gemini-3.5-flash", "google/gemini-3.1-flash-lite"],
  code: ["google/gemini-3.8-flash", "google/gemini-3.5-flash", "google/gemini-3.1-flash-lite"],
  engineer: ["google/gemini-3.8-flash", "google/gemini-3.5-flash", "google/gemini-3.1-flash-lite"],
};

export function classifyTask(
  text: string,
  opts: { engineer: boolean; site: boolean; code: boolean; hasImage: boolean },
): TaskKind {
  if (opts.engineer) return "engineer";
  if (opts.site || opts.code) return "code";

  const shortQuestionLike = !opts.hasImage && text.length < 300 && !/ফতোয়া|মাসআলা|অংক|গণিত|ব্যাখ্যা|বিস্তারিত|তুলনা|বিশ্লেষণ|latest|current|news|price|rate|official|status/i.test(text);

  if (shortQuestionLike) return "quick";
  return "general";
}

export function tokenBudget(kind: TaskKind, site: boolean): number {
  if (site) return 32768;
  if (kind === "code" || kind === "engineer") return 16384;
  if (kind === "quick") return 2048;
  return 6144;
}

export function firstTokenBudget(kind: TaskKind, pass: 1 | 2): number {
  if (pass === 2) return 25000;
  return kind === "quick" || kind === "general" ? 3500 : 9000;
}

const cooldown = new Map<string, number>();
const deadKeys = new Map<string, number>();
let rrCounter = 0;

function keyId(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return "k" + (h >>> 0).toString(36);
}

export function rotate<T>(list: T[], start: number): T[] {
  if (!list.length) return list;
  const s = ((start % list.length) + list.length) % list.length;
  return [...list.slice(s), ...list.slice(0, s)];
}

type Attempt = {
  url: string;
  key: string;
  model: string;
  label: string;
  google: boolean;
};

function isCooling(a: Attempt, now = Date.now()) {
  return (cooldown.get(a.model + "|" + keyId(a.key)) ?? 0) > now || (deadKeys.get(keyId(a.key)) ?? 0) > now;
}

function cleanKey(value?: string | null): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function getAllowedCustomProviders(): Set<string> {
  const raw = (process.env["ALLOWED_CUSTOM_PROVIDER_HOSTS"] ?? "").trim();
  if (!raw) return new Set(["api.openai.com", "api.anthropic.com"]);
  return new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
}

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase().trim().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || h === "metadata.google.internal") return true;
  if (h === "::1" || h === "::" || h.startsWith("fe80:") || h.startsWith("fc00:") || h.startsWith("fd") || h.startsWith("::ffff:")) return true;
  if (/^\d+$/.test(h) || /^0x[0-9a-f]+$/i.test(h)) return true;

  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

function isAllowedCustomBaseUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return false;
    if (isBlockedHost(url.hostname)) return false;
    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) return false;
    if (url.port && !["80", "443"].includes(url.port)) return false;

    const allow = getAllowedCustomProviders();
    const host = url.hostname.toLowerCase();

    if (allow.size > 0 && !allow.has(host)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function normalizeCustomEndpoint(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const base = rawUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) return null;
  if (!isAllowedCustomBaseUrl(base)) return null;
  return `${base}/chat/completions`;
}

let cachedSettings: { data: any; time: number } | null = null;
let cachedKeys: { data: any; time: number } | null = null;
const searchCache = new Map<string, { at: number; value: SearchResult }>();
const answerCache = new Map<string, { at: number; text: string }>();

function cacheSet<V>(map: Map<string, V>, k: string, v: V, max = 100) {
  map.set(k, v);
  if (map.size > max) {
    const first = map.keys().next().value as string;
    if (first) map.delete(first);
  }
}

async function getCachedSettingsAndKeys(supabaseAdmin: any) {
  const now = Date.now();
  const needSettings = !cachedSettings || now - cachedSettings.time > 45_000;
  const needKeys = !cachedKeys || now - cachedKeys.time > 45_000;

  try {
    const [sRes, kRes] = await Promise.all([
      needSettings ? supabaseAdmin.from("ai_settings").select("*").eq("id", 1).maybeSingle() : Promise.resolve({ data: cachedSettings!.data }),
      needKeys ? supabaseAdmin.from("ai_keys").select("*").eq("id", 1).maybeSingle() : Promise.resolve({ data: cachedKeys!.data }),
    ]);

    if (needSettings && sRes?.data) cachedSettings = { data: sRes.data, time: now };
    if (needKeys && kRes?.data) cachedKeys = { data: kRes.data, time: now };
  } catch (err) {
    console.error("[chat] settings cache lookup failed:", err);
  }

  return { s: cachedSettings?.data, keys: cachedKeys?.data };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          return await handleChat(request);
        } catch (e) {
          console.error("[chat] critical engine exception:", e);
          return new Response("সার্ভারে সাময়িক সমস্যা হয়েছে। কয়েক সেকেন্ড পর আবার চেষ্টা করুন।", { status: 500 });
        }
      },
    },
  },
});

async function handleChat(request: Request): Promise<Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return new Response("অনুমোদন নেই (লগইন আবশ্যক)", { status: 401 });

  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!supabaseUrl || !supabaseKey) {
    return new Response("সার্ভার কনফিগারেশন অসম্পূর্ণ", { status: 500 });
  }

  const pub = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const [authRes, rawJson] = await Promise.all([pub.auth.getUser(token), request.json().catch(() => null)]);
  const { data: u, error: ue } = authRes;
  if (ue || !u?.user) {
    return new Response("ব্যবহারকারী চিহ্নিত করা যায়নি। পুনরায় লগইন করুন।", { status: 401 });
  }

  const parsed = Body.safeParse(rawJson);
  if (!parsed.success) {
    return new Response("ইনপুট যাচাইয়ে ত্রুটি", { status: 400 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const uid = u.user.id;
  const msgsIn = parsed.data.messages;
  const lastMsgText = String(msgsIn[msgsIn.length - 1]?.content ?? "");

  const imgsOf = (i: number) => {
    const m = msgsIn[i];
    return [...(m?.images ?? []), ...(m?.image ? [m.image] : [])].slice(0, 5);
  };

  const hasImage = msgsIn.some((_, i) => imgsOf(i).length > 0);
  const isSiteReq = /ওয়েবসাইট|ওয়েব সাইট|website|landing|html|web page|পেজ বানা|অ্যাপ বানা|স্টোর বানা|ইকমার্স|ecommerce|dashboard|admin panel|app design|landing page/i.test(lastMsgText);
  const isEngineer = parsed.data.mode === "engineer";
  const isCode = needsCodeEngine(lastMsgText, isSiteReq);
  const kind = classifyTask(lastMsgText, { engineer: isEngineer, site: isSiteReq, code: isCode, hasImage });

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();

  const memTask = (async () => {
    try {
      const mem = await import("@/lib/memory.server");
      const [items, rec] = await Promise.all([
        mem.loadMemory(uid, 30),
        kind === "quick"
          ? Promise.resolve({ data: null })
          : supabaseAdmin.from("messages").select("content,created_at").eq("user_id", uid).eq("role", "user").order("created_at", { ascending: false }).limit(6),
      ]);
      return { items, recent: (rec.data ?? []) as { content: string }[] };
    } catch (e) {
      console.warn("[chat] memory load failed:", e);
      return { items: [] as { text: string }[], recent: [] as { content: string }[] };
    }
  })();

  const fatwaTask = (async () => {
    if (!/ফতোয়া|মাসআলা|রোজা|নামাজ|সালাত|হাদিস|কুরআন|কোরআন|হারাম|হালাল|যাকাত|কসর|সুন্নাহ|ইসলাম/i.test(lastMsgText)) {
      return "";
    }

    try {
      const { findFatwas, fatwaPrompt } = await import("@/lib/fatwa.server");
      const fatwas = await findFatwas(lastMsgText);
      return fatwas.length ? fatwaPrompt(fatwas) : "";
    } catch {
      return "";
    }
  })();

  const [settingsAndKeys, adminCheck, hourlyUsage, dailyUsage] = await Promise.all([
    getCachedSettingsAndKeys(supabaseAdmin),
    supabaseAdmin.rpc("has_role", { _user_id: uid, _role: "admin" }),
    supabaseAdmin.from("chat_usage").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", hourAgo),
    supabaseAdmin.from("chat_usage").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", dayAgo),
  ]);

  const { s, keys } = settingsAndKeys;
  const isAdmin = !!adminCheck.data;

  if (s && s.chat_enabled === false && !isAdmin) {
    return new Response("চ্যাট সাময়িকভাবে বন্ধ আছে। কিছুক্ষণ পর আবার চেষ্টা করুন।", { status: 503 });
  }

  if (!isAdmin) {
    if ((hourlyUsage.count ?? 0) >= (s?.hourly_limit ?? 60)) {
      return new Response(`এক ঘণ্টার প্রশ্ন সীমা (${s?.hourly_limit ?? 60}টি) শেষ। কিছুক্ষণ পর আবার চেষ্টা করুন।`, { status: 429 });
    }
    if ((dailyUsage.count ?? 0) >= (s?.daily_limit ?? 300)) {
      return new Response(`আজকের দৈনিক ব্যবহারের সীমা (${s?.daily_limit ?? 300}টি) শেষ। আগামীকাল আবার চেষ্টা করুন।`, { status: 429 });
    }
  }

  void supabaseAdmin.from("chat_usage").insert({ user_id: uid }).catch(() => {});

  type PoolKey = { name?: string; provider?: string; key?: string; base_url?: string; model?: string; active?: boolean };

  const pool: PoolKey[] = (Array.isArray(keys?.key_pool) ? (keys.key_pool as PoolKey[]) : [])
    .filter((p) => p && p.active !== false && typeof p.key === "string" && p.key.trim())
    .slice(0, 2);

  const googleKeys = [...new Set(
    [
      cleanKey(keys?.google_key) || cleanKey(process.env["GOOGLE_API_KEY"]),
      ...pool.filter((p) => !p.provider || p.provider === "google").map((p) => cleanKey(p.key)),
    ].filter(Boolean),
  )];

  const openaiKey = cleanKey(keys?.openai_key) || cleanKey(process.env["OPENAI_API_KEY"]);
  const gatewayKey = cleanKey(process.env["LOVABLE_API_KEY"]);
  const userModel = parsed.data.model && LOVABLE_MODELS.some((m) => m.id === parsed.data.model) ? parsed.data.model : "";
  const adminProvider = String(s?.provider ?? "google");
  const adminModel = String(s?.model ?? "").trim();

  const attempts: Attempt[] = [];
  const add = (a: Attempt) => {
    if (!attempts.some((x) => x.url === a.url && x.key === a.key && x.model === a.model)) {
      attempts.push(a);
    }
  };

  const googleChain = [...GOOGLE_CHAINS[kind]];

  const rotatedGoogle = rotate(googleKeys, rrCounter++);

  if (isEngineer) {
    for (const model of googleChain) {
      for (const key of rotatedGoogle) {
        add({ url: GOOGLE_URL, key, model, label: `google:${model}`, google: true });
      }
    }
  } else {
    const preferGateway = Boolean(gatewayKey) && (Boolean(userModel) || adminProvider === "lovable");
    if (preferGateway) {
      add({
        url: GATEWAY_URL,
        key: gatewayKey,
        model: GATEWAY_CHAINS[kind][0]!,
        label: "gateway:preferred",
        google: false,
      });
    }

    if (adminProvider === "openai" && openaiKey) {
      add({ url: OPENAI_URL, key: openaiKey, model: adminModel || "gpt-4o", label: "openai:admin", google: false });
    }

    for (const model of googleChain) {
      for (const key of rotatedGoogle) {
        add({ url: GOOGLE_URL, key, model, label: `google:${model}`, google: true });
      }
    }

    for (const p of pool) {
      const key = cleanKey(p.key);
      if (!key) continue;

      const customUrl = normalizeCustomEndpoint(p.base_url);
      if (p.provider === "custom" && customUrl) {
        add({
          url: customUrl,
          key,
          model: p.model?.trim() || "llama-3.3-70b-versatile",
          label: `custom:${p.name ?? ""}`,
          google: false,
        });
      } else if (p.provider === "openai") {
        add({ url: OPENAI_URL, key, model: p.model?.trim() || "gpt-4o", label: `openai-pool:${p.name ?? ""}`, google: false });
      }
    }

    if (openaiKey) {
      add({ url: OPENAI_URL, key: openaiKey, model: "gpt-4o", label: "openai:backup", google: false });
    }

    if (gatewayKey) {
      for (const model of GATEWAY_CHAINS[kind]) {
        add({ url: GATEWAY_URL, key: gatewayKey, model, label: `gateway:${model}`, google: false });
      }
    }
  }

  if (!attempts.length) {
    return new Response("কোনো এআই কী সেট করা নেই। অ্যাডমিন প্যানেলে গুগল/ওপেনএআই কী বসান।", { status: 503 });
  }

  attempts.sort((a, b) => Number(isCooling(a)) - Number(isCooling(b)));

  const lastImgs = imgsOf(msgsIn.length - 1);
  const wantImg = !lastImgs.length && wantsImage(lastMsgText) && !!gatewayKey;

  const verification = assessVerificationNeed(lastMsgText, {
    isEngineer,
    isSiteReq,
    isCode,
    hasImage,
  });

  const shouldSearch = verification.search;
  const cacheKey =
    kind === "quick" &&
    !hasImage &&
    !shouldSearch &&
    msgsIn.length === 1
      ? `${uid}|${lastMsgText.trim().toLowerCase()}`
      : "";

  const enc = new TextEncoder();
  const sse = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`);
  const clientGone = new AbortController();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const push = (v: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(v);
        } catch {
          closed = true;
        }
      };

      const stage = (st: string) => push(sse({ stage: st }));
      const say = (text: string) => push(sse({ choices: [{ delta: { content: text } }] }));

      const ping = setInterval(() => push(enc.encode(": ping\n\n")), 8000);

      const finish = () => {
        clearInterval(ping);
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      try {
        stage("think");

        const hit = cacheKey ? answerCache.get(cacheKey) : undefined;
        if (hit && Date.now() - hit.at < 600_000) {
          stage("write");
          say(hit.text);
          push(enc.encode("data: [DONE]\n\n"));
          return finish();
        }

        if (wantImg) {
          stage("image");
          const img = await generateImage(lastMsgText);
          say(img ? `আপনার ছবি তৈরি সম্পন্ন হয়েছে:\n\n![ছবি](${img})` : "ছবি তৈরি করতে সমস্যা হয়েছে।");
          push(enc.encode("data: [DONE]\n\n"));
          return finish();
        }

        let system = PERSONA + "\n\n" + BASE_PROMPT;
        if (isSiteReq && s?.site_builder !== false) system += "\n\n" + SITE_BUILDER_PROMPT;
        if (isEngineer) system += "\n\n" + ENGINEER_PROMPT;
        if (isCode || isSiteReq || isEngineer) system += "\n\n" + GPT_ENGINEER_PROMPT;
        system += "\n\n" + STYLE_RULES + "\n\n" + INTEGRITY;

        const now = new Date();
        const bd = new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", dateStyle: "full", timeStyle: "short" }).format(now);
        let hijri = "";
        try {
          hijri = new Intl.DateTimeFormat("bn-BD-u-ca-islamic-umalqura", { timeZone: "Asia/Dhaka", dateStyle: "long" }).format(now);
        } catch {}

        system += `\n\n=== বর্তমান সময় (সার্ভার ঘড়ি, নির্ভুল) ===\nবাংলাদেশ সময়: ${bd}${hijri ? `\nহিজরি তারিখ: ${hijri}` : ""}`;

        const [mem, fatwaContext] = await Promise.all([memTask, fatwaTask]);
        if (fatwaContext) system += fatwaContext;
        if (mem.items.length) {
          system += `\n\n=== ব্যবহারকারী সম্পর্কে সংরক্ষিত তথ্য (স্মৃতি) ===\n${mem.items.map((m) => `- ${String(m.text ?? "")}`).join("\n")}`;
        }
        if (mem.recent.length) {
          system += `\n\n=== পূর্ববর্তী প্রাসঙ্গিক প্রশ্ন ===\n${[...mem.recent].reverse().map((r) => `- ${String(r.content ?? "")}`).join("\n")}`;
        }
        if (s?.system_prompt?.trim()) system += `\n\n=== অতিরিক্ত সিস্টেম নির্দেশনা (অ্যাডমিন) ===\n${s.system_prompt.trim()}`;
        if (s?.admin_note?.trim()) system += `\n\n=== অ্যাডমিন নোট (সর্বোচ্চ অগ্রাধিকার) ===\n${s.admin_note.trim()}`;
        if (isAdmin) system += `\n\n[সেশন]: ব্যবহারকারী সিস্টেমের ভেরিফাইড অ্যাডমিন।`;

        const textMsgs = msgsIn.map((m) => ({ role: m.role, content: m.content }));
        const wantsUrl = s?.url_reader !== false && /https?:\/\//.test(lastMsgText);

        if (shouldSearch) stage("search");

        const [web, found] = await Promise.all([
          wantsUrl ? readUrls(lastMsgText).catch(() => "") : Promise.resolve(""),
          shouldSearch ? withTimeout(cachedSearch(lastMsgText), 3000, { text: "", count: 0, strongCount: 0, hasStrongEvidence: false }) : Promise.resolve({ text: "", count: 0, strongCount: 0, hasStrongEvidence: false }),
        ]);

        if (web) {
          const last = textMsgs[textMsgs.length - 1];
          if (last) {
            textMsgs[textMsgs.length - 1] = { role: last.role, content: `${last.content}\n\n=== সংযুক্ত ওয়েব পেজের লেখা ===\n${web}` };
          }
        }

        if (shouldSearch) {
          stage("verify");

          if (verification.mustRefuseWithoutEvidence && !found.hasStrongEvidence) {
            stage("write");
            say(
              "যাচাইকৃত সূত্রে এই তথ্য নিশ্চিত করা যায়নি। নির্ভরযোগ্য সরকারি, প্রাতিষ্ঠানিক বা প্রাথমিক উৎস ছাড়া আমি নাম, পদ, অবস্থান, বর্তমান অবস্থা, আইন বা চিকিৎসা সম্পর্কিত সুনির্দিষ্ট দাবি করতে পারি না। প্রশ্নটি আরও নির্দিষ্ট করে দিন অথবা সংশ্লিষ্ট প্রতিষ্ঠানের অফিসিয়াল তথ্য যাচাই করুন।"
            );
            push(enc.encode("data: [DONE]\n\n"));
            return finish();
          }

          system += `\n\n${GROUNDING_RULES}\n\n${EVIDENCE_PROTOCOL}`;
          system += found.count
            ? `\n\n=== অনুসন্ধানের উৎস (${found.count}টি, লাইভ) ===\nনিচের উৎসের বাইরে কোনো সুনির্দিষ্ট দাবি করা যাবে না।\n\n${found.text}`
            : `\n\n=== অনুসন্ধানের উৎস ===\nলাইভ অনুসন্ধানে নির্ভরযোগ্য ফল পাওয়া যায়নি। অনুমান করা নিষিদ্ধ। নিশ্চিত তথ্যের জন্য প্রামাণ্য ও প্রাথমিক উৎস দরকার।`;
        } else if (web) {
          system += `\n\n${GROUNDING_RULES}\n\n${EVIDENCE_PROTOCOL}`;
        }

        system += `\n\n${INTEGRITY}`;

        if (isCode || isSiteReq || isEngineer) stage("code");

        const msgs: { role: string; content: unknown }[] = textMsgs.map((m, i) => {
          const imgs = imgsOf(i);
          if (m.role !== "user" || !imgs.length) return m;
          return {
            role: m.role,
            content: [{ type: "text", text: m.content || "সংযুক্ত ছবিগুলো বিশদভাবে বিশ্লেষণ করুন।" }, ...imgs.map((url) => ({ type: "image_url", image_url: { url } }))],
          };
        });

        const basePayload = {
          stream: true,
          temperature: isSiteReq ? 0.4 : 0.2,
          max_tokens: tokenBudget(kind, isSiteReq),
          messages: [{ role: "system", content: system }, ...msgs],
        };

        let opened: { reader: ReadableStreamDefaultReader<Uint8Array>; first: Uint8Array; label: string; abort: AbortController } | null = null;
        let lastErr = { status: 502, text: "" };

        for (const pass of [1, 2] as const) {
          if (pass === 2) await new Promise((r) => setTimeout(r, 600));

          for (const a of attempts) {
            if (closed || clientGone.signal.aborted) return finish();
            if ((deadKeys.get(keyId(a.key)) ?? 0) > Date.now()) continue;
            if (pass === 1 && isCooling(a) && attempts.some((x) => !isCooling(x))) continue;

            const r = await tryAttempt(a, basePayload, kind, firstTokenBudget(kind, pass), clientGone.signal);
            if (r.ok) {
              opened = { reader: r.reader, first: r.first, label: a.label, abort: r.abort };
              break;
            }

            lastErr = { status: r.status, text: r.text };
            console.warn(`[chat] attempt ${a.label} pass${pass} failed [${r.status}] ${r.text.slice(0, 160)}`);

            const ck = a.model + "|" + keyId(a.key);
            if (r.status === 401 || r.status === 403) deadKeys.set(keyId(a.key), Date.now() + 10 * 60_000);
            else if (r.status === 429 || r.status === 503 || r.status === 504) cooldown.set(ck, Date.now() + 30_000);
            else if (r.status === 404 || r.status === 400) cooldown.set(ck, Date.now() + 10 * 60_000);
          }

          if (opened) break;
        }

        if (!opened) {
          push(sse({ error: friendlyError(lastErr.status, lastErr.text) }));
          return finish();
        }

        stage("write");
        const dec = new TextDecoder();
        let full = "";
        let buf = "";

        const collect = (chunk: Uint8Array) => {
          if (!cacheKey) return;
          buf += dec.decode(chunk, { stream: true });
          let i;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (!line.startsWith("data:")) continue;
            try {
              const d = JSON.parse(line.slice(5).trim());
              full += d?.choices?.[0]?.delta?.content ?? "";
            } catch {}
          }
        };

        const onAbort = () => opened?.abort.abort();
        clientGone.signal.addEventListener("abort", onAbort);

        push(opened.first);
        collect(opened.first);

        try {
          while (!closed) {
            const { done, value } = await opened.reader.read();
            if (done) break;
            push(value);
            collect(value);
          }

          if (cacheKey && full.trim().length > 0 && full.length < 8000) {
            cacheSet(answerCache, cacheKey, { at: Date.now(), text: full });
          }
        } catch (e) {
          console.warn(`[chat] stream from ${opened.label} interrupted:`, e);
          push(sse({ error: "সংযোগ মাঝপথে বিঘ্নিত হয়েছে। আবার পাঠান।" }));
        }

        finish();
      } catch (e) {
        console.error("[chat] pipeline error:", e);
        push(sse({ error: "উত্তর তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।" }));
        finish();
      }
    },
    cancel() {
      clientGone.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

type TryResult =
  | { ok: true; reader: ReadableStreamDefaultReader<Uint8Array>; first: Uint8Array; abort: AbortController }
  | { ok: false; status: number; text: string };

async function tryAttempt(a: Attempt, base: Record<string, unknown>, kind: TaskKind, budgetMs: number, clientSignal: AbortSignal): Promise<TryResult> {
  const abort = new AbortController();
  const onClient = () => abort.abort();
  clientSignal.addEventListener("abort", onClient, { once: true });

  const timer = setTimeout(() => abort.abort(), budgetMs);
  const payload: Record<string, unknown> = { ...base, model: a.model };

  if (a.google) {
    payload["reasoning_effort"] = kind === "quick" || kind === "general" ? "minimal" : "low";
  }

  if (a.url === OPENAI_URL && /^gpt-5|^o\d/.test(a.model)) {
    delete payload["temperature"];
  }

  try {
    const res = await fetch(a.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${a.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: abort.signal,
    });

    if (!res.ok || !res.body) {
      clearTimeout(timer);
      const text = (await res.text().catch(() => "")).slice(0, 400);
      return { ok: false, status: res.status || 502, text };
    }

    const reader = res.body.getReader();
    const first = await reader.read();
    clearTimeout(timer);

    if (first.done || !first.value) {
      return { ok: false, status: 502, text: "empty stream" };
    }

    return { ok: true, reader, first: first.value, abort };
  } catch (e: any) {
    clearTimeout(timer);
    const isTimeout = e?.name === "AbortError";
    return {
      ok: false,
      status: isTimeout ? 504 : 502,
      text: isTimeout ? `timeout ${budgetMs}ms` : String(e?.message ?? e),
    };
  } finally {
    clientSignal.removeEventListener("abort", onClient);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((r) => setTimeout(() => r(fallback), ms)),
  ]);
}

function friendlyError(status: number, text: string): string {
  const t = text.toLowerCase();

  if (status === 401 || status === 403 || /api key|unauthorized|permission|denied access/.test(t)) {
    return "সব এআই কী ব্যর্থ হয়েছে: কী-এর অনুমতি নেই বা বাতিল হয়েছে। অ্যাডমিন প্যানেল থেকে কী যাচাই করুন।";
  }
  if (status === 429 || /rate.?limit|quota|resource_exhausted/.test(t)) {
    return "সব মডেলের ফ্রি কোটা এই মুহূর্তে শেষ বা সীমিত। এক মিনিট পর আবার চেষ্টা করুন।";
  }
  if (status === 402) return "ব্যাকআপ এআই সার্ভিসের ক্রেডিট শেষ। গুগল/অ্যাডমিন কী যাচাই করুন।";
  if (status === 504 || /timeout/.test(t)) return "কোনো মডেল সময়মতো সাড়া দেয়নি। আবার চেষ্টা করুন।";
  if (status >= 500) return "এআই প্রোভাইডারের সার্ভারে সাময়িক সমস্যা। একটু পরে আবার চেষ্টা করুন।";
  return `উত্তর তৈরি করা যায়নি (কোড: ${status})। অনুগ্রহ করে আবার চেষ্টা করুন।`;
}

function wantsImage(t: string): boolean {
  return (
    /(ছবি|চিত্র|লোগো|পোস্টার|ব্যানার|image|picture|photo|logo|poster|illustration)/i.test(t) &&
    /(বানা|তৈরি|আঁক|এঁকে|জেনারেট|generate|create|draw|make|design)/i.test(t) &&
    !/(ওয়েবসাইট|website|html|কোড|code)/i.test(t)
  );
}

async function generateImage(prompt: string): Promise<string | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return null;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-image-2.5-sunburst",
      prompt: prompt.slice(0, 3000),
      size: "1024x1024",
      n: 1,
    }),
    signal: AbortSignal.timeout(45000),
  }).catch(() => null);

  if (!res?.ok) return null;
  const j: any = await res.json().catch(() => null);
  const d = j?.data?.[0];
  return d?.b64_json ? `data:image/png;base64,${d.b64_json}` : (d?.url ?? null);
}

type VerificationNeed = {
  search: boolean;
  mustRefuseWithoutEvidence: boolean;
  reason: string;
};

type SearchResult = {
  text: string;
  count: number;
  strongCount: number;
  hasStrongEvidence: boolean;
};

type Hit = {
  title: string;
  url: string;
  snippet: string;
  trust: number;
  sourceType: "official" | "primary" | "reputable-news" | "reference" | "general";
};

const SEARCH_CACHE_TTL_MS = 5 * 60_000;
const SEARCH_RESULT_LIMIT = 8;
const STRONG_EVIDENCE_MINIMUM = 1;

const STOP = new Set([
  "আমি",
  "আমার",
  "তুমি",
  "আপনি",
  "আপনার",
  "একটু",
  "দয়া",
  "করে",
  "বলুন",
  "বলো",
  "বলেন",
  "জানান",
  "জানা",
  "কী",
  "কি",
  "এবং",
  "বা",
  "এর",
  "হয়",
  "এরকম",
  "please",
  "plz",
  "hi",
  "hello",
  "thanks",
  "ধন্যবাদ",
  "about",
  "from",
  "the",
  "to",
  "a",
  "an",
  "of",
  "in",
  "on",
  "for",
  "with",
] as string[]);

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

const strip = (value: string) =>
  value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function isGreetingOrSmallTalk(text: string): boolean {
  const value = text.trim();
  if (!value || value.length < 3) return true;
  return /^(আসসালামু আলাইকুম|আসসালামু|সালাম|হাই|হ্যালো|hello|hi|ধন্যবাদ|thanks|কেমন আছ|কেমন আছেন|কেমন আছেন?)/i.test(value);
}

function isMathOnly(text: string): boolean {
  return /^[\d\s+\-*/().=x×÷^%]+$/.test(text.trim());
}

function hasQuestionIntent(text: string): boolean {
  return /[?？]|(কে|কী|কি|কোথায়|কোথায়|কবে|কত|কোন|কাদের|কেন|কিভাবে|কীভাবে|বলুন|জানান|বলেন|চাই|চাইলে|খুঁজে)/i.test(text);
}

function hasTimeSensitiveIntent(text: string): boolean {
  return /(বর্তমান|এখন|আজ|কাল|সর্বশেষ|সাম্প্রতিক|খবর|সংবাদ|দাম|বাজার|রেট|আবহাওয়া|আবহাওয়া|latest|current|today|news|price|rate)/i.test(text);
}

function hasIdentityOrOfficeIntent(text: string): boolean {
  return /(চেয়ারম্যান|চেয়ারম্যান|মেয়র|মেয়র|এমপি|মন্ত্রী|রাষ্ট্রপতি|প্রধানমন্ত্রী|সচিব|ক্যাবিনেট|বিভাগীয় কমিশনার|চেয়ারপারসন|চেয়ারপারসন|director|president|mayor)/i.test(text);
}

function hasLocalInstitutionIntent(text: string): boolean {
  return /(ইউনিয়ন|ইউনিয়ন|উপজেলা|জেলা|গ্রাম|পৌরসভা|সিটি কর্পোরেশন|থানা|হাসপাতাল|বিদ্যালয়|স্কুল|কলেজ|বিশ্ববিদ্যালয়|ক্লিনিক|কোম্পানি|ব্র্যান্ড)/i.test(text);
}

function hasHighRiskIntent(text: string): boolean {
  return /(আইন|ধারা|মামলা|জামিন|আইনজীবী|ওষুধ|ডোজ|চিকিৎসা|রোগ|প্রেসক্রিপশন|শেয়ার|স্টক|বিটকয়েন|crypto|investment|loan|ভর্তি|নির্বাচন|ধর্ম|ফতোয়া|fatwa)/i.test(text);
}

export function assessVerificationNeed(
  text: string,
  context: {
    isEngineer: boolean;
    isSiteReq: boolean;
    isCode: boolean;
    hasImage: boolean;
  },
): VerificationNeed {
  const query = text.trim();

  if (!query || context.hasImage || isGreetingOrSmallTalk(query) || isMathOnly(query)) {
    return {
      search: false,
      mustRefuseWithoutEvidence: false,
      reason: "conversation-or-math",
    };
  }

  const identity = hasIdentityOrOfficeIntent(query);
  const localInstitution = hasLocalInstitutionIntent(query);
  const timeSensitive = hasTimeSensitiveIntent(query);
  const highRisk = hasHighRiskIntent(query);
  const asksForFacts = hasQuestionIntent(query);

  const technicalFreshness =
    context.isCode &&
    /(api|sdk|লাইব্রেরি|package|প্যাকেজ|react|typescript|javascript|python|node|version|ভার্সন|release|documentation|ডকুমেন্টেশন|latest|stable)/i.test(query);

  const search = identity || localInstitution || timeSensitive || highRisk || technicalFreshness || asksForFacts;

  return {
    search,
    mustRefuseWithoutEvidence: identity || timeSensitive || highRisk || (localInstitution && asksForFacts),
    reason: identity
      ? "identity-or-office"
      : timeSensitive
        ? "time-sensitive"
        : highRisk
          ? "high-risk"
          : localInstitution
            ? "local-institution"
            : technicalFreshness
              ? "technical-freshness"
              : asksForFacts
                ? "factual-question"
                : "general",
  };
}

export function needsSearch(text: string): boolean {
  return assessVerificationNeed(text, {
    isEngineer: false,
    isSiteReq: false,
    isCode: false,
    hasImage: false,
  }).search;
}

export function searchKeywords(text: string): string {
  return text
    .replace(/https?:\/\/[^\s<>"')]+/gi, " ")
    .replace(/[?।,!:;"'()[\]{}]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word && !STOP.has(word.toLowerCase()))
    .slice(0, 14)
    .join(" ")
    .slice(0, 180);
}

function sourceTypeOf(url: string): Hit["sourceType"] {
  const host = new URL(url).hostname.toLowerCase();

  if (host.endsWith(".gov.bd") || host.endsWith(".gov") || host.endsWith(".edu") || host === "who.int" || host.endsWith(".who.int") || host === "un.org" || host.endsWith(".un.org")) {
    return "official";
  }

  if (host === "quran.com" || host.endsWith(".quran.com") || host === "sunnah.com" || host.endsWith(".sunnah.com") || host === "bjsm.org" || host.endsWith(".bjsm.org")) {
    return "primary";
  }

  if (/^(.+\.)?bbc\.com$|^(.+\.)?reuters\.com$|^(.+\.)?apnews\.com$|^(.+\.)?prothomalo\.com$|^(.+\.)?thedailystar\.net$|^(.+\.)?bdnews24\.com$|^(.+\.)?aljazeera\.com$/.test(host)) {
    return "reputable-news";
  }

  if (host.endsWith(".wikipedia.org") || host === "en.banglapedia.org" || host.endsWith(".banglapedia.org")) {
    return "reference";
  }

  return "general";
}

function trustOf(url: string): number {
  try {
    const sourceType = sourceTypeOf(url);

    if (sourceType === "official") return 10;
    if (sourceType === "primary") return 9;
    if (sourceType === "reputable-news") return 7;
    if (sourceType === "reference") return 4;

    return 1;
  } catch {
    return 0;
  }
}

function isStrongSource(hit: Hit): boolean {
  return hit.sourceType === "official" || hit.sourceType === "primary";
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

async function cachedSearch(query: string): Promise<SearchResult> {
  const cacheKey = searchKeywords(query).toLowerCase();
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.at < SEARCH_CACHE_TTL_MS) {
    return cached.value;
  }

  const result = await webSearch(query);

  if (result.count > 0) {
    cacheSet(searchCache, cacheKey, { at: Date.now(), value: result });
  }

  return result;
}

async function wikiSearch(lang: "bn" | "en", query: string): Promise<Hit[]> {
  const response = await fetch(
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&utf8=1&format=json&origin=*`,
    {
      headers: {
        "User-Agent": "AlAhsanAI/2.0",
      },
      signal: AbortSignal.timeout(3_000),
    },
  );

  if (!response.ok) return [];

  const data: any = await response.json();

  return (data?.query?.search ?? []).slice(0, 2).map((item: any) => {
    const title = String(item?.title ?? "");
    const url = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

    return {
      title: `উইকিপিডিয়া (${lang}): ${title}`,
      url,
      snippet: strip(String(item?.snippet ?? "")),
      trust: trustOf(url),
      sourceType: "reference" as const,
    };
  });
}

async function ddgSearch(query: string): Promise<Hit[]> {
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "User-Agent": BROWSER_UA,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `q=${encodeURIComponent(query)}&kl=bd-en`,
    signal: AbortSignal.timeout(3_500),
  });

  if (!response.ok) return [];

  const html = await response.text();
  const results: Hit[] = [];
  const matcher =
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  let match: RegExpExecArray | null;

  while ((match = matcher.exec(html)) && results.length < 8) {
    let url = match[1] ?? "";
    const redirectMatch = /uddg=([^&]+)/.exec(url);

    if (redirectMatch?.[1]) {
      try {
        url = decodeURIComponent(redirectMatch[1]);
      } catch {
        continue;
      }
    }

    url = normalizeUrl(url);

    if (!url || /duckduckgo\.com\/y\.js/i.test(url)) continue;

    const sourceType = sourceTypeOf(url);

    results.push({
      title: strip(match[2] ?? ""),
      url,
      snippet: strip(match[3] ?? ""),
      trust: trustOf(url),
      sourceType,
    });
  }

  return results;
}

async function newsSearch(query: string): Promise<Hit[]> {
  const response = await fetch(
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=bn&gl=BD&ceid=BD:bn`,
    {
      headers: { "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(3_500),
    },
  );

  if (!response.ok) return [];

  const xml = await response.text();

  return xml
    .split("<item>")
    .slice(1, 7)
    .map((item) => {
      const tag = (name: string) =>
        (new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(item)?.[1] ?? "")
          .replace(/<!\[CDATA\[|\]\]>/g, "")
          .trim();

      const url = normalizeUrl(tag("link"));
      if (!url) return null;

      return {
        title: strip(tag("title")),
        url,
        snippet: `প্রকাশের সময়: ${strip(tag("pubDate"))}`,
        trust: trustOf(url),
        sourceType: sourceTypeOf(url),
      };
    })
    .filter((item): item is Hit => Boolean(item?.title && item.url));
}

async function tavilySearch(query: string): Promise<Hit[]> {
  const key = process.env["TAVILY_API_KEY"]?.trim();
  if (!key) return [];

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query,
      max_results: 6,
      search_depth: "advanced",
      include_answer: false,
      include_raw_content: false,
    }),
    signal: AbortSignal.timeout(3_000),
  });

  if (!response.ok) return [];

  const data: any = await response.json();

  return (data?.results ?? [])
    .map((item: any): Hit | null => {
      const url = normalizeUrl(String(item?.url ?? ""));
      if (!url) return null;

      return {
        title: String(item?.title ?? "").trim(),
        url,
        snippet: String(item?.content ?? "").replace(/\s+/g, " ").trim().slice(0, 900),
        trust: trustOf(url) + 1,
        sourceType: sourceTypeOf(url),
      };
    })
    .filter((item: Hit | null): item is Hit => item !== null);
}

function deduplicateHits(hits: Hit[]): Hit[] {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    const normalized = normalizeUrl(hit.url);
    if (!normalized || seen.has(normalized)) return false;

    seen.add(normalized);
    hit.url = normalized;
    return Boolean(hit.title && hit.snippet);
  });
}

async function webSearch(rawQuery: string): Promise<SearchResult> {
  const query = searchKeywords(rawQuery) || rawQuery.slice(0, 180);
  const isNewsQuery = /(খবর|সংবাদ|আজ|বর্তমান|সর্বশেষ|সাম্প্রতিক|news|today|current|latest)/i.test(rawQuery);

  const tasks: Promise<Hit[]>[] = [
    ddgSearch(query),
    tavilySearch(query),
    wikiSearch("bn", query),
    wikiSearch("en", query),
  ];

  if (isNewsQuery) tasks.push(newsSearch(query));

  const settled = await Promise.allSettled(tasks);

  const hits = deduplicateHits(
    settled.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
  )
    .sort((a, b) => b.trust - a.trust)
    .slice(0, SEARCH_RESULT_LIMIT);

  const strongHits = hits.filter(isStrongSource);
  const strongCount = strongHits.length;

  const text = hits
    .map((hit, index) => {
      const label =
        hit.sourceType === "official"
          ? "সরকারি/প্রাতিষ্ঠানিক"
          : hit.sourceType === "primary"
            ? "প্রাথমিক উৎস"
            : hit.sourceType === "reputable-news"
              ? "নির্ভরযোগ্য সংবাদ"
              : hit.sourceType === "reference"
                ? "রেফারেন্স"
                : "সাধারণ ওয়েব উৎস";

      return `[${index + 1}] ${hit.title}
ধরন: ${label}
লিংক: ${hit.url}
সারাংশ: ${hit.snippet}`;
    })
    .join("\n\n");

  return {
    text,
    count: hits.length,
    strongCount,
    hasStrongEvidence: strongCount >= STRONG_EVIDENCE_MINIMUM,
  };
}

async function safeFetch(url: string, maxRedirects = 3): Promise<Response> {
  let cur = url;

  for (let i = 0; i <= maxRedirects; i++) {
    const u = new URL(cur);

    if (!["http:", "https:"].includes(u.protocol)) throw new Error("Blocked protocol");
    if (isBlockedHost(u.hostname)) throw new Error("Blocked host");
    if (u.port && !["80", "443"].includes(u.port)) throw new Error("Blocked port");

    const res = await fetch(cur, {
      redirect: "manual",
      headers: {
        "User-Agent": BROWSER_UA + " (AlAhsanAI Reader)",
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      cur = new URL(loc, cur).href;
      continue;
    }

    return res;
  }

  throw new Error("Too many redirects");
}

async function readUrls(text: string): Promise<string> {
  const urls = (text.match(/https?:\/\/[^\s<>"')]+/g) || []).slice(0, 2);

  const pages = await Promise.all(
    urls.map(async (u) => {
      try {
        const res = await safeFetch(u);
        if (!res.ok) return "";

        const html = await res.text();
        const clean = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000);

        return clean ? `[${u}]\n${clean}` : "";
      } catch {
        return "";
      }
    }),
  );

  return pages.filter(Boolean).join("\n\n");
}
