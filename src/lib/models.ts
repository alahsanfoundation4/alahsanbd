export type Provider = "lovable" | "google" | "openai";

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
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (সেরা যুক্তি ও বাংলা মান)" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (অতি দ্রুত গতি)" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Groq চালিত)" },
];


export const DEFAULT_MODELS: Record<Provider, string> = {
  lovable: "openai/gpt-6-astra",
  google: "gemini-3.8-flash",
  groq: "llama-3.3-70b-versatile",
};

