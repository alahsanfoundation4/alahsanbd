export const FOLLOWUP_SEARCH = /(অনলাইন|ইন্টারনেট|গুগল|সার্চ|খুঁজে|খুজে|অনুসন্ধান|যাচাই|দেখে জানান|দেখে বলুন|search|google|check online)/i;

const clean = (x: string) =>
  x.replace(/^\s*\[নির্দেশ:[\s\S]*?\]\s*/, "").replace(/\n*=== সংযুক্ত ফাইল:[\s\S]*$/, "").replace(/\s+/g, " ").trim();

/** সার্চ কোয়েরি: মোড নির্দেশ/ফাইল বাদ; বিষয়হীন "অনলাইনে দেখে জানান" ফলো-আপে আগের প্রশ্নই আসল বিষয় */
export function buildSearchQuery(messages: { role: string; content: string }[]): string {
  const users = messages.filter((m) => m.role === "user").map((m) => clean(m.content));
  const last = users[users.length - 1] ?? "";
  const prev = users[users.length - 2] ?? "";
  const topicLess = last
    .replace(new RegExp(FOLLOWUP_SEARCH.source, "gi"), "")
    .replace(/(থেকে|করে|একটু|আবার|দয়া|প্লিজ|please|জানান|বলুন|দেখুন|দেখে|যে|টা|টি|এটা|সেটা|[?।!.,])/gi, "")
    .trim();
  if (prev && FOLLOWUP_SEARCH.test(last) && topicLess.length < 8) return prev.slice(0, 200);
  return last.slice(0, 200);
}
