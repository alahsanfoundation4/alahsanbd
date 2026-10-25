export type Provider = "lovable" | "google" | "groq" | "openrouter";

export const LOVABLE_MODELS = [
  { id: "openai/gpt-6-astra", label: "GPT-6 Astra (সর্বোচ্চ ক্ষমতা, রেকমেন্ডেড)" },
  { id: "openai/gpt-6-sol", label: "GPT-6 Sol (উন্নত ভারসাম্য)" },
  { id: "openai/gpt-5.5", label: "GPT-5.5 (দ্রুত ও নির্ভরযোগ্য)" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (শক্তিশালী যুক্তি)" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (দ্রুত)" },
];

export const GOOGLE_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (সর্বশেষ, দ্রুত ও আধুনিক)" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (দ্রুত ও স্থিতিশীল)" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (ব্যাপকভাবে ব্যবহৃত ও নির্ভরযোগ্য)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (গভীর চিন্তা ও উন্নত বিশ্লেষণ)" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (উন্নত রিজনিং)" },
];

export const GROQ_MODELS = [
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Groq হাই-পাওয়ার)" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B (Groq অতি দ্রুত)" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq ভার্সাটাইল)" },
];

// OpenRouter verified live active free models (retrieved from openrouter.ai/api/v1/models)
export const OPENROUTER_MODELS = [
  { id: "openrouter/free", label: "Free Models Router (স্বয়ংক্রিয় সেরা ফ্রি মডেল)" },
  { id: "google/gemma-4-31b-it:free", label: "Google: Gemma 4 31B (ফ্রি)" },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Google: Gemma 4 26B A4B (ফ্রি)" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "NVIDIA: Nemotron 3 Ultra (ফ্রি)" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", label: "NVIDIA: Nemotron 3 Nano Omni (ফ্রি রিজনিং)" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "NVIDIA: Nemotron 3 Super (ফ্রি)" },
  { id: "nvidia/nemotron-3.5-lightning:free", label: "NVIDIA: Nemotron 3.5 Lightning (ফ্রি)" },
  { id: "recursive/flint-v1.0:free", label: "Recursive: Flint (ফ্রি কোডিং/লজিক)" },
  { id: "poolside/laguna-s-2.1:free", label: "Poolside: Laguna S 2.1 (ফ্রি)" },
  { id: "thinkingmachines/inkling:free", label: "Thinking Machines: Inkling (ফ্রি)" },
  { id: "dots-studio/dots-3-note-preview:free", label: "Dots Studio: Dots3-Note Preview (ফ্রি)" },
];

export const DEFAULT_MODELS: Record<Provider, string> = {
  lovable: "openai/gpt-6-astra",
  google: "gemini-2.5-flash",
  groq: "openai/gpt-oss-120b",
  openrouter: "openrouter/free",
};

export function normalizeModel(provider: Provider | string, model?: string): string {
  const m = (model || "").trim();
  if (provider === "google") {
    if (!m || /^gemini-3/i.test(m) || !m.startsWith("gemini-")) return "gemini-2.5-flash";
    return m;
  }
  if (provider === "lovable") {
    if (!m || /gemini-3/i.test(m) || !LOVABLE_MODELS.some((x) => x.id === m)) return "openai/gpt-6-astra";
    return m;
  }
  if (provider === "groq") {
    if (!m || m === "qwen/qwen3.8-27b" || m.startsWith("gemini-") || m.startsWith("google/") || m.includes("astra")) {
      return "openai/gpt-oss-120b";
    }
    return m;
  }
  if (provider === "openrouter") {
    if (!m || m.startsWith("gemini-") || m.includes("astra") || m === "openai/gpt-oss-120b") {
      return "openrouter/free";
    }
    return m;
  }
  return m || DEFAULT_MODELS.google;
}
