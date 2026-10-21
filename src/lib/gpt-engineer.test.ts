import { describe, expect, it } from "vitest";
import { GPT_ENGINEER_PROMPT, needsCodeEngine } from "./gpt-engineer";

describe("needsCodeEngine", () => {
  it("ওয়েবসাইট অনুরোধে সর্বদা কোড-ইঞ্জিন ডাকে", () => {
    expect(needsCodeEngine("আমার জন্য একটি ল্যান্ডিং পেজ", true)).toBe(true);
  });

  it("কোডিং অনুরোধ চেনে", () => {
    expect(needsCodeEngine("python দিয়ে একটা ফাংশন লিখে দাও", false)).toBe(true);
    expect(needsCodeEngine("এই কোডের বাগ ফিক্স করো", false)).toBe(true);
  });

  it("সাধারণ প্রশ্নে কোড-ইঞ্জিন ডাকে না", () => {
    expect(needsCodeEngine("সূরা ফাতিহার তাফসীর সংক্ষেপে বলুন", false)).toBe(false);
    expect(needsCodeEngine("২+২ কত?", false)).toBe(false);
  });

  it("GPT_ENGINEER_PROMPT পূর্ণাঙ্গ থাকে", () => {
    expect(GPT_ENGINEER_PROMPT.length).toBeGreaterThan(100);
    expect(GPT_ENGINEER_PROMPT).toContain("GPT-Engineer");
  });
});
