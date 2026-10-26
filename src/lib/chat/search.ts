import { buildSearchQuery, FOLLOWUP_SEARCH } from "@/lib/search-query";

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

export function needsSearch(t: string): boolean {
  if (/https?:\/\//.test(t)) return false;
  if (/=== সংযুক্ত ফাইল:/.test(t)) return false;
  if (/(কোন জায়গায়|কোথায় আছি|আমার অবস্থান|where am i|কয়টা বাজে|কত তারিখ|কি বার|কী বার)/i.test(t)) return false;
  if (/^\s*(হাই|হ্যালো|hi|hello|ধন্যবাদ|thanks|ok|ঠিক আছে|আচ্ছা|কেমন আছ(ো|েন)?|আসসালামু আলাইকুম|সালাম)[\s?!।.]*$/i.test(t)) return false;
  if (/[0-9০-৯]\s*[+\-*/×÷^]\s*[0-9০-৯]/.test(t) && !FOLLOWUP_SEARCH.test(t)) return false;
  if (FOLLOWUP_SEARCH.test(t)) return true;
  return /(সর্বশেষ|সাম্প্রতিক|খবর|সংবাদ|দাম|বাজার দর|রেট|আবহাওয়া|ফলাফল|স্কোর|নির্বাচন|latest|news|price|weather|score|সার্চ|খুঁজে|অনুসন্ধান|search|অনলাইন|ইন্টারনেট|গুগল|google|আজ|এখন|বর্তমান|চলতি|এই বছর|এ বছর|গতকাল|কালকে|২০২[৫-৯]|202[5-9]|কে জিতে|কে জিতেছে|কে হয়েছেন|প্রধানমন্ত্রী|রাষ্ট্রপতি|প্রেসিডেন্ট|মন্ত্রী|চেয়ারম্যান|সিইও|ceo|current|today|now|recent|update|আপডেট|রিলিজ|release|ভার্সন|version|কবে|কোথায় পাওয়া|ঠিকানা|ফোন নম্বর|ভর্তি|নোটিশ|বিজ্ঞপ্তি|রেজাল্ট|সময়সূচি|schedule|ম্যাচ|match|কার্যক্রম|ঘটনা|ঘটেছে|হামলা|দুর্ঘটনা|ভূমিকম্প|বন্যা)/i.test(t);
}

export function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase().trim();
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"].includes(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".lan")) return true;
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(h);
}

export async function safeFetch(url: string, maxRedirects = 3): Promise<Response> {
  let cur = url;
  for (let i = 0; i < maxRedirects; i++) {
    const u = new URL(cur);
    if (!["http:", "https:"].includes(u.protocol) || isBlockedHost(u.hostname)) {
      throw new Error("Blocked URL");
    }
    const res = await fetch(cur, {
      redirect: "manual",
      headers: { "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(4000),
    });
    if ([301, 302, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) break;
      cur = new URL(loc, cur).toString();
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}

export async function readUrls(text: string): Promise<string> {
  const urls = text.match(/https?:\/\/[^\s<>"')]+/g) || [];
  if (!urls.length) return "";
  const out: string[] = [];
  for (const u of urls.slice(0, 2)) {
    try {
      const res = await safeFetch(u);
      if (!res.ok) continue;
      const html = await res.text();
      const clean = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000);
      if (clean) out.push(`[${u}]\n${clean}`);
    } catch {}
  }
  return out.join("\n\n");
}

export async function ddgHtml(q: string): Promise<string> {
  const res = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: { "User-Agent": BROWSER_UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: `q=${encodeURIComponent(q.slice(0, 200))}&kl=bd-en`,
    signal: AbortSignal.timeout(2000),
  }).catch(() => null);
  return res?.ok ? await res.text() : "";
}

export async function newsRss(q: string): Promise<string> {
  const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q.slice(0, 150))}&hl=bn&gl=BD&ceid=BD:bn`, {
    headers: { "User-Agent": BROWSER_UA },
    signal: AbortSignal.timeout(2000),
  }).catch(() => null);
  if (!res?.ok) return "";
  const xml = await res.text().catch(() => "");
  const items = xml.split("<item>").slice(1, 6).map((it) => {
    const g = (tag: string) => (new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(it)?.[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    return `- ${g("title")} (${g("pubDate")})\n  ${g("link")}`;
  });
  return items.length ? `=== গুগল নিউজ শিরোনাম ===\n${items.join("\n")}` : "";
}

export async function webSearch(q: string): Promise<string> {
  const news = /(খবর|সংবাদ|news|আজকে|আজকের|সর্বশেষ)/i.test(q) ? newsRss(q.replace(/(আজকের|আজকে|কী|কি)/g, "").trim() || "বাংলাদেশ") : Promise.resolve("");
  const html = await ddgHtml(q);
  const n = await news;
  if (!html) return n;
  const strip = (x: string) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  const out: string[] = [];
  const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 4) {
    let rawUrl = m[1]!;
    const uddg = /uddg=([^&]+)/.exec(rawUrl);
    if (uddg) rawUrl = decodeURIComponent(uddg[1]!);
    out.push(`- ${strip(m[2]!)}\n  লিংক: ${rawUrl}\n  সারসংক্ষেপ: ${strip(m[3]!)}`);
  }
  return [n, out.join("\n\n")].filter(Boolean).join("\n\n");
}
