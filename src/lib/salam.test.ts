import { describe, it, expect } from "vitest";
import { stripUnaskedSalam } from "./salam";

describe("salam guard", () => {
  it("removes unasked salam reply", () => {
    expect(stripUnaskedSalam("ওয়ালাইকুমুস সালাম। সূরা ফাতিহা", "সূরা ফাতিহার তাফসীর বলুন")).toBe("সূরা ফাতিহা");
  });
  it("keeps salam reply when user greeted", () => {
    expect(stripUnaskedSalam("ওয়ালাইকুমুস সালাম। ভালো", "আসসালামু আলাইকুম")).toBe("ওয়ালাইকুমুস সালাম। ভালো");
  });
});
