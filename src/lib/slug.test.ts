import { describe, it, expect } from "vitest";
import { normalizeSlug, slugError } from "./slug";

describe("customer URL", () => {
  it("accepts any customer-chosen slug", () => expect(slugError(normalizeSlug("Rahman-School-2026"))).toBeNull());
  it("rejects reserved app paths", () => expect(slugError("admin")).not.toBeNull());
  it("rejects bad characters", () => expect(slugError("my shop!")).not.toBeNull());
});
