export type Provider = "lovable" | "google" | "groq" | "openrouter";

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
  google: "gemini-3.8-flash",
  groq: "openai/gpt-oss-120b",
  openrouter: "openrouter/free",
};
