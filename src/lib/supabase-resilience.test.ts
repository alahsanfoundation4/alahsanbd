import { describe, it, expect } from "vitest";
import {
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  DEFAULT_SUPABASE_PROJECT_ID,
  getResolvedSupabaseConfig,
  supabase,
} from "@/integrations/supabase/client";

describe("Supabase Environment Resilience", () => {
  it("provides valid default credentials so the app never crashes without .env", () => {
    expect(DEFAULT_SUPABASE_URL).toBeDefined();
    expect(DEFAULT_SUPABASE_URL).toMatch(/^https:\/\/.+/);
    expect(DEFAULT_SUPABASE_PUBLISHABLE_KEY).toBeDefined();
    expect(DEFAULT_SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")).toBe(true);
    expect(DEFAULT_SUPABASE_PROJECT_ID).toBeDefined();
  });

  it("resolves config safely even in empty environment", () => {
    const config = getResolvedSupabaseConfig();
    expect(config.url).toBe(DEFAULT_SUPABASE_URL);
    expect(config.key).toBe(DEFAULT_SUPABASE_PUBLISHABLE_KEY);
  });

  it("initializes client instance without throwing fatal errors", () => {
    expect(() => {
      // Accessing a property on the proxy triggers createSupabaseClient()
      const auth = supabase.auth;
      expect(auth).toBeDefined();
    }).not.toThrow();
  });
});
