export type Provider = "lovable" | "google" | "openai" | "groq" | "openrouter";

export const LOVABLE_MODELS = [
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (সবচেয়ে শক্তিশালী যুক্তি)" },
  { id: "google/gemini-3.8-flash", label: "Gemini 3.8 Flash (দ্রুত ও শক্তিশালী)" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (সাশ্রয়ী)" },
  { id: "openai/gpt-6-astra", label: "GPT-6 Astra (সর্বোচ্চ ক্ষমতা)" },
  { id: "openai/gpt-6-sol", label: "GPT-6 Sol" },
  { id: "openai/gpt-5.5", label: "GPT-5.5" },
];

export const GOOGLE_MODELS = [
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (সর্বশেষ, দ্রুত ও শক্তিশালী)" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (সাশ্রয়ী)" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (পেইড কি লাগে)" },
];

// Groq's currently documented text-generation models. Account-level free limits vary.
export const GROQ_MODELS = [
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
  { id: "openai/gpt-oss-120b", label: "OpenAI GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b", label: "OpenAI GPT-OSS 20B" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
];

// OpenRouter's zero-price model IDs, obtained from its public /api/v1/models catalogue.
export const OPENROUTER_MODELS = [
  { id: "openrouter/free", label: "Free Models Router (automatic)" },
  { id: "recursive/flint-v1.0:free", label: "Recursive Flint (free)" },
  { id: "xingchen-agi/xing4.0-29b-a4b:free", label: "XingChen 4.0 29B A4B (free)" },
  { id: "nvidia/nemotron-3.5-super-vl:free", label: "NVIDIA Nemotron 3.5 Super VL (free)" },
  { id: "dots-studio/dots-3-note-preview:free", label: "Dots 3 Note Preview (free)" },
  { id: "liquid/lfm-2.5-2.6b:free", label: "Liquid LFM 2.5 2.6B (free)" },
  { id: "nvidia/nemotron-3.5-lightning:free", label: "NVIDIA Nemotron 3.5 Lightning (free)" },
  { id: "thinkingmachines/inkling-small:free", label: "Thinking Machines Inkling Small (free)" },
  { id: "poolside/laguna-s-2.1:free", label: "Poolside Laguna S 2.1 (free)" },
  { id: "thinkingmachines/inkling:free", label: "Thinking Machines Inkling (free)" },
  { id: "poolside/laguna-xs-2.1:free", label: "Poolside Laguna XS 2.1 (free)" },
  { id: "cohere/north-mini-code:free", label: "Cohere North Mini Code (free)" },
  { id: "nvidia/nemotron-3.5-content-safety:free", label: "NVIDIA Nemotron 3.5 Content Safety (free)" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "NVIDIA Nemotron 3 Ultra (free)" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", label: "NVIDIA Nemotron 3 Nano Omni (free)" },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Google Gemma 4 26B A4B (free)" },
  { id: "google/gemma-4-31b-it:free", label: "Google Gemma 4 31B (free)" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "NVIDIA Nemotron 3 Super (free)" },
];

export const OPENAI_MODELS = [
  { id: "gpt-5.5", label: "GPT-5.5" },
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "gpt-4o", label: "GPT-4o" },
];

export const DEFAULT_MODELS: Record<Provider, string> = {
  lovable: "openai/gpt-6-astra",
  google: "gemini-3.8-flash",
  openai: "gpt-5.5",
  groq: "llama-3.3-70b-versatile",
  openrouter: "openrouter/free",
};

export const ALL_AVAILABLE_MODELS = [
  ...LOVABLE_MODELS.map((m) => ({ ...m, provider: "lovable" as Provider })),
  ...GOOGLE_MODELS.map((m) => ({ ...m, provider: "google" as Provider })),
  ...OPENAI_MODELS.map((m) => ({ ...m, provider: "openai" as Provider })),
  ...GROQ_MODELS.map((m) => ({ ...m, provider: "groq" as Provider })),
  ...OPENROUTER_MODELS.map((m) => ({ ...m, provider: "openrouter" as Provider })),
];
