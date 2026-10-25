import { describe, it, expect } from "vitest";

function resolveOpenRouterKey(keys: {
  openrouter_key?: string | null;
  key_pool?: Array<{ name?: string; provider?: string; key?: string; active?: boolean }> | null;
} | null | undefined, envKey = ""): string {
  const direct = keys?.openrouter_key?.trim();
  if (direct) return direct;

  if (Array.isArray(keys?.key_pool)) {
    const fromPool = keys.key_pool.find(
      (p) => (p?.name === "_openrouter_primary" || p?.provider === "openrouter") && p?.active !== false && p?.key?.trim()
    );
    if (fromPool?.key) return fromPool.key.trim();
  }

  return envKey.trim();
}

describe("OpenRouter key resolution and fallback", () => {
  it("resolves direct openrouter_key column when present", () => {
    const keys = {
      openrouter_key: "sk-or-v1-direct-key",
      key_pool: [{ name: "_openrouter_primary", provider: "openrouter", key: "sk-or-v1-pool-key" }],
    };
    expect(resolveOpenRouterKey(keys)).toBe("sk-or-v1-direct-key");
  });

  it("falls back to _openrouter_primary from key_pool when openrouter_key column is empty", () => {
    const keys = {
      openrouter_key: "",
      key_pool: [
        { name: "groq-backup", provider: "groq", key: "gsk_test" },
        { name: "_openrouter_primary", provider: "openrouter", key: "sk-or-v1-pool-key", active: true },
      ],
    };
    expect(resolveOpenRouterKey(keys)).toBe("sk-or-v1-pool-key");
  });

  it("falls back to generic openrouter provider in key_pool if name is not _openrouter_primary", () => {
    const keys = {
      openrouter_key: null,
      key_pool: [
        { name: "my-or", provider: "openrouter", key: "sk-or-v1-custom", active: true },
      ],
    };
    expect(resolveOpenRouterKey(keys)).toBe("sk-or-v1-custom");
  });

  it("ignores inactive pool entries and falls back to environment key", () => {
    const keys = {
      openrouter_key: "",
      key_pool: [
        { name: "_openrouter_primary", provider: "openrouter", key: "sk-or-v1-disabled", active: false },
      ],
    };
    expect(resolveOpenRouterKey(keys, "sk-or-v1-from-env")).toBe("sk-or-v1-from-env");
  });
});
