import { expect, it } from "vitest";
import { buildSearchQuery } from "./search-query";
import { stripEmptySources } from "./salam";
import { geminiLiveConfig } from "./gemini-live-config";

it("removes the mode instruction from the search query", () => {
  expect(buildSearchQuery([{ role: "user", content: "[নির্দেশ: সরাসরি অনলাইন তথ্য দাও]\n\nডলার রেট" }])).toBe("ডলার রেট");
});
it("uses the previous question for a topic-less 'search online' follow-up", () => {
  const q = buildSearchQuery([
    { role: "user", content: "Gemini 4 কি বের হয়েছে?" },
    { role: "assistant", content: "..." },
    { role: "user", content: "অনলাইন থেকে যে দেখে জানান" },
  ]);
  expect(q).toBe("Gemini 4 কি বের হয়েছে?");
});
it("removes an empty sources heading", () => {
  expect(stripEmptySources("উত্তর।\n\nসূত্র:\n")).toBe("উত্তর।");
});
it("keeps sources that have links", () => {
  expect(stripEmptySources("উত্তর।\n\nসূত্র:\n- https://a.com")).toContain("https://a.com");
});
it("voice call has no live search tool and no self-started greeting", () => {
  expect(geminiLiveConfig.tools).toBeUndefined();
  expect(String(geminiLiveConfig.systemInstruction)).not.toContain("প্রথমে সালাম দিন");
});
