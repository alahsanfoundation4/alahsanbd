import { describe, expect, it } from "vitest";
import { normalizeModel, DEFAULT_MODELS, GOOGLE_MODELS, GROQ_MODELS, OPENROUTER_MODELS, LOVABLE_MODELS } from "./models";

describe("Admin Provider and Model Resilience", () => {
  it("enforces provider-specific model compatibility", () => {
    // When Google is selected, OpenAI/Groq models are safely normalized
    expect(normalizeModel("google", "openai/gpt-6-astra")).toBe("gemini-2.5-flash");
    expect(normalizeModel("google", "llama-3.3-70b-versatile")).toBe("gemini-2.5-flash");
    expect(normalizeModel("google", "openrouter/free")).toBe("gemini-2.5-flash");

    // When Groq is selected, Google models are safely normalized
    expect(normalizeModel("groq", "gemini-2.5-flash")).toBe("openai/gpt-oss-120b");
    expect(normalizeModel("groq", "gemini-2.0-flash")).toBe("openai/gpt-oss-120b");
    expect(normalizeModel("groq", "google/gemini-2.5-pro")).toBe("openai/gpt-oss-120b");

    // When OpenRouter is selected, invalid models fallback to openrouter/free
    expect(normalizeModel("openrouter", "gemini-2.5-flash")).toBe("openrouter/free");
    expect(normalizeModel("openrouter", "openai/gpt-oss-120b")).toBe("openrouter/free");
  });

  it("retains all active catalog models for each provider", () => {
    expect(GOOGLE_MODELS.length).toBeGreaterThanOrEqual(4);
    expect(GROQ_MODELS.length).toBeGreaterThanOrEqual(3);
    expect(OPENROUTER_MODELS.length).toBeGreaterThanOrEqual(5);
    expect(LOVABLE_MODELS.length).toBeGreaterThanOrEqual(4);
  });

  it("provides valid defaults for each provider", () => {
    expect(DEFAULT_MODELS.google).toBe("gemini-2.5-flash");
    expect(DEFAULT_MODELS.groq).toBe("openai/gpt-oss-120b");
    expect(DEFAULT_MODELS.openrouter).toBe("openrouter/free");
    expect(DEFAULT_MODELS.lovable).toBe("openai/gpt-6-astra");
  });
});
