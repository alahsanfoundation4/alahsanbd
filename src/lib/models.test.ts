import { describe, expect, it } from "vitest";
import { normalizeModel, GOOGLE_MODELS, DEFAULT_MODELS } from "./models";

describe("models", () => {
  it("normalizes defunct or empty Google models to gemini-2.5-flash", () => {
    expect(normalizeModel("google", "")).toBe("gemini-2.5-flash");
    expect(normalizeModel("google", "gemini-3.8-flash")).toBe("gemini-2.5-flash");
    expect(normalizeModel("google", "gemini-3-flash-preview")).toBe("gemini-2.5-flash");
    expect(normalizeModel("google", "gemini-3.1-flash-lite")).toBe("gemini-2.5-flash");
  });

  it("preserves active Google Gemini models", () => {
    expect(normalizeModel("google", "gemini-2.5-flash")).toBe("gemini-2.5-flash");
    expect(normalizeModel("google", "gemini-2.0-flash")).toBe("gemini-2.0-flash");
    expect(normalizeModel("google", "gemini-1.5-flash")).toBe("gemini-1.5-flash");
    expect(normalizeModel("google", "gemini-2.5-pro")).toBe("gemini-2.5-pro");
  });

  it("contains production Google models in GOOGLE_MODELS", () => {
    const ids = GOOGLE_MODELS.map((m) => m.id);
    expect(ids).toContain("gemini-2.5-flash");
    expect(ids).toContain("gemini-2.0-flash");
    expect(ids).toContain("gemini-1.5-flash");
    expect(ids).not.toContain("gemini-3.8-flash");
  });

  it("sets DEFAULT_MODELS correctly", () => {
    expect(DEFAULT_MODELS.google).toBe("gemini-2.5-flash");
    expect(DEFAULT_MODELS.groq).toBe("openai/gpt-oss-120b");
    expect(DEFAULT_MODELS.openrouter).toBe("openrouter/free");
  });
});
