import { expect, it } from "vitest";
import { resolveLiveVoice } from "./live-voices";
it("uses the supported masculine voice when selected", () => {
  expect(resolveLiveVoice("meridian")).toBe("meridian");
});
it("preserves the previous voice by default and rejects arbitrary voices", () => {
  expect(resolveLiveVoice(undefined)).toBe("marin");
  expect(resolveLiveVoice("untrusted-voice")).toBe("marin");
});