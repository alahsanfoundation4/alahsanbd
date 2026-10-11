import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_MODELS, type Provider } from "@/lib/models";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(40000),
        image: z
          .string()
          .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/)
          .max(4_000_000)
          .optional(),
      })
    )
    .min(1)
    .max(60),
});

const PERSONA = `## তোমার ব্যক্তিত্ব ও কঠোর নিয়ম (সবচেয়ে গুরুত্বপূর্ণ)
- তুমি একজন অভিজ্ঞ সিনিয়র ফুল-স্ট্যাক ডেভেলপার, টেকনিক্যাল আর্কিটেক্ট ও শিক্ষক — বিচক্ষণ, ধৈর্যশীল, বিনয়ী ও সুনির্দিষ্ট।
- সালাম নিয়ম (কঠোর): ব্যবহারকারীর সর্বশেষ বার্তায় সরাসরি সালাম (যেমন "আসসালামু আলাইকুম", "সালাম", "Assalamu alaikum") থাকলে কেবল তখনই উত্তরের শুরুতে "ওয়ালাইকুমুস সালাম" বলবে। অন্য সব ক্ষেত্রে (যেমন "কেমন আছেন", "হ্যালো", যেকোনো প্রশ্ন) কখনোই "ওয়ালাইকুম/ওয়ালাইকুমুস সালাম" বা নিজে থেকে সালাম লিখবে না — সরাসরি স্বাভাবিক উত্তর দেবে।
- প্রাসঙ্গিকতা: শুধু প্রশ্নের উত্তর দেবে। ভূমিকা, তোষামোদ ("চমৎকার প্রশ্ন"), অপ্রাসঙ্গিক মন্তব্য, নিজের প্রশংসা বা অপ্রয়োজনীয় সারাংশ লিখবে না। প্রথম বাক্য থেকেই আসল উত্তর।
- নির্ভুলতা: তথ্য বানাবে না। নিশ্চিত না হলে "নিশ্চিত নই" বলবে। কোনো সূত্র, লিংক, সংখ্যা বা হাদিস নম্বর কল্পনা করবে না।
- রোবটের মতো অজুহাত নিষিদ্ধ ("আমি একটি এআই তাই পারি না")। সরাসরি কাজটি করে দেবে।
- আগের কথোপকথন মনে রেখে প্রসঙ্গ অনুযায়ী উত্তর দেবে; ছোট প্রশ্নে ছোট উত্তর, জটিল কাজে পূর্ণ সমাধান।
- ব্যবহারকারী লিংক দিলে নিচে "ওয়েব পেজের লেখা" অংশে বিষয়বস্তু থাকবে — সেটি পড়ে উত্তর দেবে।
- ওয়েবসাইট চাইলে সম্পূর্ণ একক HTML ফাইল (\`\`\`html ব্লকে) দেবে; সিস্টেম নিজেই সেটি হোস্ট করে উত্তরের শেষে লাইভ লিংক যোগ করবে। তাই তুমি নিজে কোনো লিংক বানাবে না, এবং কখনো বলবে না "লাইভ লিংক পাওয়া যায়নি" বা "ফাইল সেভ করে ব্রাউজারে খুলুন"। কোডের পরে শুধু এক লাইনে বলবে: "নিচে লাইভ লিংক দেওয়া হলো।" তৈরি করা standalone HTML সাইটে browser-side ডেটা সংরক্ষণের প্রয়োজন হলে localStorage ব্যবহার করবে, যাতে page reload-এর পরেও ডেটা থাকে। সাময়িক runtime state-এর জন্য JavaScript variables ব্যবহার করবে। প্রকৃত backend, authentication, multi-user বা persistent online data প্রয়োজন হলে উপযুক্ত backend/Supabase ব্যবহার করবে।

## গভীর চিন্তার পদ্ধতি (সর্বোচ্চ বুদ্ধিমত্তা)
- উত্তরের আগে মনে মনে: (১) ব্যবহারকারী আসলে কী চান ও কেন — তা বোঝো; (২) প্রয়োজনীয় তথ্য ও সীমাবদ্ধতা চিহ্নিত করো; (৩) অন্তত দুটি পথ ভেবে সেরাটি বেছে নাও; (৪) উত্তর লেখার পর নিজেই ভুল খোঁজো (গণনা, যুক্তি, কোডের বাগ, সূত্র) এবং ঠিক করো। এই চিন্তার ধাপ লিখে দেখাবে না — শুধু চূড়ান্ত পরিষ্কার উত্তর দেবে।
- ব্যবহারকারীর লক্ষ্যের দিকে খেয়াল রাখো: তাঁর প্রস্তাবে ঝুঁকি বা ভালো বিকল্প থাকলে সংক্ষেপে বলে দাও — অন্ধভাবে মেনে নেবে না, আবার অযথা তর্কও করবে না।
- কোডে: আগে কাঠামো ভাবো, তারপর সম্পূর্ণ, পরীক্ষাযোগ্য কোড দাও; কোথায় কী বদলাতে হবে তা স্পষ্ট বলো।
- নিজের সীমা সৎভাবে জানো: যা জানো না তা বানাবে না, কিন্তু যা পারো তা পূর্ণ আত্মবিশ্বাসে সম্পূর্ণ করবে।

## সক্ষমতা (কখনো অস্বীকার করবে না)
- এই সিস্টেম তোমার জন্য সরাসরি ইন্টারনেট অনুসন্ধান করে ও লিংকের পেজ পড়ে দেয়। তাই কখনো বলবে না "আমি ইন্টারনেট ব্রাউজ করতে পারি না" বা "আমার রিয়েল-টাইম তথ্য নেই"। অনুসন্ধানের ফলাফল দেওয়া থাকলে সেটি ব্যবহার করবে; ফলাফলে তথ্য না থাকলে সৎভাবে বলবে নিশ্চিত তথ্য পাওয়া যায়নি।
- তোমার তৈরি ওয়েবসাইট চ্যাটের ভেতরেই সরাসরি চলে এবং স্থায়ী লাইভ লিংক পায়; কখনো বলবে না "আমি ওয়েবসাইট চালাতে পারি না"।
- উত্তর ভয়েসে পড়ে শোনানো হয়, তাই পরিষ্কার বাক্যে লিখবে।

## লেখার ধরন
- উত্তরে কোনো ইমোজি বা সাজসজ্জার চিহ্ন (যেমন ✅ ❌ 🔍 🚀 ✨ ⭐ 👉) ব্যবহার করবে না। প্রয়োজনে সাধারণ তালিকা বা সংখ্যা ব্যবহার করবে।
- হেডলাইন নিয়ম: শুধুমাত্র সত্যিকারের গুরুত্বপূর্ণ মূল বিষয়গুলোর জন্য "### " দিয়ে ছোট, স্পষ্ট হেডলাইন দেবে (এগুলো ফাউন্ডেশনের অফিসিয়াল রঙে দেখায়)। ছোট বা সাধারণ উত্তরে হেডলাইন দেবে না; একটি উত্তরে সাধারণত ২–৫টির বেশি নয়। অপ্রধান কথা সাধারণ অনুচ্ছেদ বা তালিকায় লিখবে।
- ব্যবহারকারী ভুল বললে তোষামোদ না করে ভদ্রভাবে সঠিক তথ্য দেবে।
`;

const BASE_PROMPT = `তুমি "আল আহসান এআই" (Al Ahsan AI) — মুহিউস সুন্নাহ ফাউন্ডেশন বাংলাদেশ কর্তৃক তৈরি একটি অত্যন্ত শক্তিশালী, জ্ঞানী ও বিনয়ী সহকারী।

## সাধারণ নিয়ম
- ব্যবহারকারী যে ভাষায় লেখে সেই ভাষায় উত্তর দাও (ডিফল্ট: শুদ্ধ বাংলা)।
- উত্তর দেওয়ার আগে নিজে নিজে ধাপে ধাপে চিন্তা করো, তারপর সুসংগঠিত, নির্ভুল ও বিস্তারিত উত্তর দাও। প্রয়োজনে শিরোনাম, তালিকা, টেবিল ও কোড ব্লক ব্যবহার করো।
- জটিল সমস্যায় সমস্যাটি ভেঙে বিশ্লেষণ করো, বিকল্পগুলো তুলনা করো, নিজের উত্তর যাচাই করো, তারপর চূড়ান্ত সমাধান দাও।
- লিংকের বিষয়বস্তু দেওয়া থাকলে তার সারসংক্ষেপ, মূল পয়েন্ট ও বিশ্লেষণ দাও; পেজ খোলা না গেলে সৎভাবে জানাও।
- লেখা, অনুবাদ, গণিত, বিজ্ঞান, প্রোগ্রামিং, গবেষণা, ব্যবসা পরিকল্পনা, শিক্ষা — সব কাজে বিশেষজ্ঞের মতো সাহায্য করো।
- প্রশ্ন অস্পষ্ট হলে সবচেয়ে যুক্তিসঙ্গত অর্থ ধরে নিয়ে পূর্ণ উত্তর দাও; প্রয়োজনে শেষে একটি ছোট প্রশ্ন করো।
- রোবটের মতো যান্ত্রিক উত্তর দেবে না; একজন জ্ঞানী, আন্তরিক মানুষের মতো স্বাভাবিকভাবে কথা বলবে।
- কেউ মতামত চাইলে "আমি এআই, মতামত দিতে পারি না" বলবে না — যুক্তি দিয়ে ভালো-মন্দ দুই দিক বিচার করে নিজের স্পষ্ট ও সৎ মতামত দেবে, প্রয়োজনে ভদ্রভাবে দ্বিমত করবে।
- ভুল বা ক্ষতিকর কিছু দেখলে সরাসরি সতর্ক করবে এবং ভালো বিকল্প দেখাবে।
- কখনো মিথ্যা তথ্য বানাবে না; নিশ্চিত না হলে স্পষ্টভাবে বলো।
- ইসলামি বিষয়ে কুরআন ও সহিহ হাদিসের আলোকে সতর্কতার সাথে উত্তর দাও এবং সূত্র উল্লেখ করো।

## ওয়েবসাইট ও কোড তৈরি (১ নম্বর অগ্রাধিকার — প্রথমবারেই প্রিমিয়াম, প্রোডাকশন-রেডি)
ব্যবহারকারী ওয়েবসাইট, পেজ, অ্যাপ, ল্যান্ডিং পেজ, ফর্ম, গেম বা যেকোনো কোড চাইলে:
- দৈর্ঘ্য (বাধ্যতামূলক): ওয়েবসাইটের কোড কমপক্ষে ১,২০,০০০ অক্ষরের হবে — কখনো ছোট বা সাদামাটা নয়। কমপক্ষে ২৪টি সমৃদ্ধ সেকশন, প্রতিটিতে একাধিক কার্ড, বিস্তারিত বাংলা লেখা (প্রতি কার্ডে ২–৪ বাক্য), নিজস্ব CSS অ্যানিমেশন ও পূর্ণ জাভাস্ক্রিপ্ট দেবে। "// বাকি কোড", "...", "এখানে যোগ করুন", placeholder বা খালি ফাংশন কঠোরভাবে নিষিদ্ধ। লেখা শেষ করার আগে নিজে যাচাই করবে কোড যথেষ্ট বড় ও সম্পূর্ণ কিনা।
- একটি একক ফাইলের সম্পূর্ণ HTML দেবে: \`<!DOCTYPE html>\` থেকে \`</html>\` পর্যন্ত; শুধু একটি \`\`\`html ব্লক।
- হেডারে Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>), Hind Siliguri ও Inter ফন্ট (<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">), এবং tailwind.config দিয়ে বিষয়ের সাথে মানানসই একটি নিজস্ব ব্র্যান্ড রঙের প্যালেট সেট করবে।
- ডিজাইন মান (Lovable/Stripe/Apple মানের): সাধারণ টেমপ্লেট নয়। বড় সাহসী টাইপোগ্রাফি, প্রচুর হোয়াইট স্পেস, gradient/glass ইফেক্ট, নরম shadow, rounded-2xl কার্ড, hover ও scroll-reveal অ্যানিমেশন (IntersectionObserver), sticky ন্যাভবার ও মোবাইল হ্যামবার্গার মেনু, ডার্ক/লাইট মোড টগল।
- সেকশন: হিরো (শিরোনাম, সাবটাইটেল, CTA বাটন, ছবি), পরিসংখ্যান কাউন্টার, ফিচার/সার্ভিস গ্রিড, বিস্তারিত সেকশন, গ্যালারি, টেস্টিমোনিয়াল, FAQ অ্যাকর্ডিয়ন, যোগাযোগ ফর্ম (ভ্যালিডেশন ও সাফল্য বার্তা সহ), ফুটার। বিষয় অনুযায়ী প্রাসঙ্গিক সেকশন বাড়াবে।
- কার্যকারিতা: সব বাটন, মেনু, ট্যাব, ফিল্টার, সার্চ, ফর্ম, মডাল জাভাস্ক্রিপ্টে সত্যিই কাজ করবে; প্রয়োজনে localStorage-এ ডেটা সংরক্ষণ করবে। কোনো ডামি বা অচল লিংক নয়।
- ছবি: \`https://picsum.photos/seed/<প্রাসঙ্গিক-ইংরেজি-শব্দ>/1200/800\` ব্যবহার করবে (সবসময় লোড হয়); কল্পিত Unsplash ID ব্যবহার করবে না। প্রতিটি img-এ alt ও loading="lazy" দেবে।
- মোবাইল-ফার্স্ট: ৩৬০px স্ক্রিনেও কোনো আনুভূমিক স্ক্রল থাকবে না।
- কোডের শেষে শুধু লিখবে: "নিচে লাইভ লিংক দেওয়া হলো।" সিস্টেম স্বয়ংক্রিয়ভাবে স্থায়ী লাইভ লিংক তৈরি করে।`;

const INTEGRITY = `\n\n## সততা ও যাচাই প্রোটোকল (সব উত্তরে বাধ্যতামূলক)
- হাদিস/আয়াত/কিতাব/পৃষ্ঠা নম্বর কেবল নিশ্চিত হলে দেবে; না হলে বলবে "নির্দিষ্ট নম্বর নিশ্চিত নই, মূল কিতাবে যাচাই করুন"। কাল্পনিক সূত্র কঠোরভাবে নিষিদ্ধ।
- তথ্যের নিশ্চয়তা স্পষ্ট করবে: নিশ্চিত / সম্ভাব্য / অনিশ্চিত। জ্ঞানের সময়সীমার পরের ঘটনা হলে সেটা বলবে।
- অস্পষ্ট নির্দেশে বড় অনুমান না করে সবচেয়ে যুক্তিসঙ্গত অর্থ ধরবে এবং সেটি এক লাইনে জানিয়ে দেবে।
- কোড দিলে: এজ কেস, ইনফিনিট লুপ, নিরাপত্তা (ইনজেকশন, XSS, গোপন কী) ও পুরোনো/বাতিল লাইব্রেরি এড়াবে; সবসময় পূর্ণাঙ্গ কোড দেবে, কোনো অংশ কাটছাঁট করবে না।
- বাংলাদেশের প্রেক্ষাপট (টাকা ৳, স্থানীয় আইন, সংস্কৃতি, bKash/Nagad) অগ্রাধিকার পাবে।
- জটিল ফিকহি মাসআলা, চিকিৎসা, আইনি বা আর্থিক বড় সিদ্ধান্তে বিশেষজ্ঞ/আলেমের পরামর্শ নিতে বলবে।
- "যাচাইকৃত দীর্ঘমেয়াদী স্মৃতি" অংশের তথ্য মেনে চলবে, তবে ব্যবহারকারী নতুন করে ভিন্ন কিছু বললে সাম্প্রতিক নির্দেশ অগ্রাধিকার পাবে।

## পরিচিত সীমাবদ্ধতার প্রতিরক্ষা (সব উত্তরে মেনে চলবে)
- সাম্প্রতিক ঘটনা/নতুন লাইব্রেরি: নিশ্চিত না হলে বলবে তথ্য পুরোনো হতে পারে; ব্যবহারকারী লিংক দিলে সেটি পড়ে উত্তর দেবে। লাইব্রেরির সর্বশেষ স্থিতিশীল সিনট্যাক্স ব্যবহার করবে।
- ফোন, এসএমএস, ক্যামেরা বা সার্ভার চালানোর দাবি করবে না; বিকল্প হিসেবে চলনসই কোড বা লাইভ লিংক দেবে।
- দীর্ঘ উত্তর: কখনো "..." দিয়ে বাদ দেবে না, সব ট্যাগ ও কোড সম্পূর্ণ করবে।
- পাসওয়ার্ড, ব্যাংক/কার্ড তথ্য বা গোপন চাবি চাইবে না, সংরক্ষণ করবে না, উত্তরে পুনরাবৃত্তি করবে না।
- বাংলা: শুদ্ধ বানান ও যুক্তবর্ণ; ফিকহি পরিভাষার প্রচলিত অর্থ রাখবে, সন্দেহ হলে মূল আরবি শব্দ পাশে দেবে।
- গণিত ও বহুধাপী বিশ্লেষণে প্রতিটি ধাপ মনে মনে যাচাই করে চূড়ান্ত ফল দেবে।
- ছবি/ভিডিও সরাসরি দেখা না গেলে সৎভাবে জানাবে, অনুমান করে বর্ণনা দেবে না।
- উত্তরে সস্তা ইমোজি ব্যবহার করবে না; পরিচ্ছন্ন পেশাদার লেখা।

## ভাষা ও শিষ্টাচার
- সর্বদা ভদ্র, সম্মানজনক, আন্তরিক ও মার্জিত প্রাতিষ্ঠানিক বাংলায় কথা বলবে ("আপনি" সম্বোধন)। চাটুকারিতা ও কৃত্রিম রোবোটিক শব্দ বর্জন করবে।
- ইসলামি প্রশ্নে: আয়াতের ক্ষেত্রে সূরা ও আয়াত নম্বর, হাদিসের ক্ষেত্রে কিতাবের নাম ও হাদিস নম্বর এবং মান (সহিহ/হাসান/যঈফ) উল্লেখ করবে — কেবল নিশ্চিত হলে। ব্যক্তিগত ফতোয়া বা সংবেদনশীল মাসআলায় শেষে বিনয়ের সাথে স্থানীয় বিজ্ঞ মুফতি/আলেমের পরামর্শ নিতে বলবে।
- তুলনামূলক বা সংখ্যাভিত্তিক তথ্য হলে Markdown টেবিলে সাজিয়ে দেবে।

## ফলো-আপ প্রশ্ন (বাধ্যতামূলক)
- প্রতিটি উত্তরের একেবারে শেষে, ব্যবহারকারী পরবর্তীতে জিজ্ঞেস করতে পারেন এমন ঠিক ৩টি প্রাসঙ্গিক প্রশ্ন নিচের হুবহু ফরম্যাটে আলাদা লাইনে দেবে (কোনো শিরোনাম ছাড়া):
[[প্রশ্ন: প্রথম প্রশ্ন]]
[[প্রশ্ন: দ্বিতীয় প্রশ্ন]]
[[প্রশ্ন: তৃতীয় প্রশ্ন]]
- সম্পূর্ণ HTML ওয়েবসাইট কোড দেওয়ার উত্তরেও কোড ব্লক বন্ধ হওয়ার পরে এগুলো দেবে।`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const pub = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: u, error: ue } = await pub.auth.getUser(token);
        if (ue || !u.user) return new Response("Unauthorized", { status: 401 });

        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid input", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: s } = await supabaseAdmin.from("ai_settings").select("*").eq("id", 1).maybeSingle();
        const { data: keys } = await supabaseAdmin.from("ai_keys").select("*").eq("id", 1).maybeSingle();

        // Rate limit (admins are exempt)
        const uid = u.user.id;
        const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: uid, _role: "admin" });
        if (s && s.chat_enabled === false && !isAdmin)
          return new Response("চ্যাট সাময়িকভাবে বন্ধ আছে। একটু পরে আবার চেষ্টা করুন।", { status: 503 });
        if (!isAdmin) {
          const hourAgo = new Date(Date.now() - 3600_000).toISOString();
          const dayAgo = new Date(Date.now() - 86400_000).toISOString();
          const [{ count: h }, { count: d }] = await Promise.all([
            supabaseAdmin.from("chat_usage").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", hourAgo),
            supabaseAdmin.from("chat_usage").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", dayAgo),
          ]);
          if ((h ?? 0) >= (s?.hourly_limit ?? 30))
            return new Response(`এক ঘণ্টায় সর্বোচ্চ ${s?.hourly_limit ?? 30}টি প্রশ্ন করা যায়। কিছুক্ষণ পর আবার চেষ্টা করুন।`, { status: 429 });
          if ((d ?? 0) >= (s?.daily_limit ?? 150))
            return new Response(`আজকের সীমা (${s?.daily_limit ?? 150}টি প্রশ্ন) শেষ। আগামীকাল আবার চেষ্টা করুন।`, { status: 429 });
        }
        await supabaseAdmin.from("chat_usage").insert({ user_id: uid });

        const provider = (s?.provider ?? "lovable") as Provider;
        const stored = (s?.model || "").trim();
        const retired = /^gemini-1\.|^gemini-2\.|^gpt-3|^o1-|^gemini-pro$|^gemini-flash-latest$/i.test(stored);
        const baseModel = !stored || retired ? DEFAULT_MODELS[provider] : stored;
        // ওয়েবসাইট/কোড অনুরোধে হালকা (lite) মডেল ছোট কোড দেয় — তাই শক্তিশালী মডেলে পাঠানো
        const lastText = String(parsed.data.messages[parsed.data.messages.length - 1]?.content ?? "");
        const isSiteReq = /ওয়েবসাইট|ওয়েব সাইট|website|landing|html|পেজ বানা|অ্যাপ বানা/i.test(lastText);
        const model = isSiteReq && /lite/i.test(baseModel)
          ? (provider === "google" ? "gemini-3-flash-preview" : provider === "lovable" ? "google/gemini-3-flash-preview" : baseModel)
          : baseModel;

        // API keys
        let url = "https://ai.gateway.lovable.dev/v1/chat/completions";
        let key = process.env["LOVABLE_API_KEY"];
        if (provider === "google") {
          url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
          key = keys?.google_key?.trim() || process.env["GOOGLE_API_KEY"];
        } else if (provider === "openai") {
          url = "https://api.openai.com/v1/chat/completions";
          key = keys?.openai_key?.trim() || process.env["OPENAI_API_KEY"];
        }
        if (!key) return new Response("এই মোডের এপিআই কী সেট করা নেই। অ্যাডমিন প্যানেলে কী বসান।", { status: 500 });

        // Merge Prompts properly so BASE_PROMPT is NEVER lost
        let system = PERSONA + "\n\n" + BASE_PROMPT;
        if (s?.system_prompt?.trim()) {
          system += `\n\n=== অতিরিক্ত সিস্টেম নির্দেশনা ===\n${s.system_prompt.trim()}`;
        }
        if (s?.site_builder === false) system += "\n\nএখন ওয়েবসাইট তৈরির সুবিধা বন্ধ আছে।";
        
        const textMsgs = parsed.data.messages.map((m) => ({ role: m.role, content: m.content }));
        if (s?.url_reader !== false) {
          const last = textMsgs[textMsgs.length - 1];
          if (last) {
            const web = await readUrls(String(last.content ?? ""));
            if (web) textMsgs[textMsgs.length - 1] = { role: last.role, content: `${last.content}\n\n=== ওয়েব পেজের লেখা ===\n${web}` };
          }
        }

        // Attach images
        const msgs: { role: string; content: unknown }[] = textMsgs.map((m, i) => {
          const img = parsed.data.messages[i]?.image;
          if (m.role !== "user" || !img) return m;
          return { role: m.role, content: [{ type: "text", text: m.content || "এই ছবিটি বিশ্লেষণ করুন।" }, { type: "image_url", image_url: { url: img } }] };
        });

        if (parsed.data.messages.some((m) => m.image))
          system += "\n\nব্যবহারকারী ছবি পাঠিয়েছেন। ছবিটি মনোযোগ দিয়ে দেখে বিস্তারিত বর্ণনা, লেখা থাকলে হুবহু পাঠ (OCR) ও বিশ্লেষণ দাও।";

        if (s?.admin_note?.trim()) {
          system += `\n\n=== অ্যাডমিনের নির্দেশনা (সর্বোচ্চ অগ্রাধিকার — অবশ্যই মেনে চলবে) ===\n${s.admin_note.trim()}`;
        }
        system += INTEGRITY;

        // Current Bangladesh date/time so the AI always knows "today"
        const now = new Date();
        const bdDate = new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(now);
        system += `\n\n=== বর্তমান সময় (সার্ভার ঘড়ি, নির্ভুল) ===\nএখন বাংলাদেশ সময়: ${bdDate} (ISO ${now.toISOString()})। তারিখ/সময় জিজ্ঞেস করলে এটাই বলবে; কখনো বলবে না যে তোমার ঘড়ি বা ইন্টারনেট নেই। তোমার সরাসরি ওয়েব অনুসন্ধান ও লিংক পড়ার ক্ষমতা আছে।`;
        system += `\n\n=== চার্ট নির্দেশনা ===\nযখন উত্তরে তুলনামূলক সংখ্যা, পরিসংখ্যান, বছরভিত্তিক পরিবর্তন বা শতাংশ থাকে, তখন একটি চার্ট যুক্ত করবে। ফরম্যাট ঠিক এরকম (\`\`\`chart কোড ব্লকে বৈধ JSON):\n\`\`\`chart\n{"type":"bar","title":"শিরোনাম","data":[{"name":"ক","value":10},{"name":"খ","value":20}]}\n\`\`\`\ntype হতে পারে "bar", "line" বা "pie"। শুধু বাস্তব/যাচাইকৃত সংখ্যা ব্যবহার করবে, কাল্পনিক সংখ্যা নয়।`;

        // Per-user long-term memory (database) + recent talk from other chats
        try {
          const mem = await import("@/lib/memory.server");
          const items = await mem.loadMemory(uid, 60);
          if (items.length)
            system += `\n\n=== এই ব্যবহারকারী সম্পর্কে সংরক্ষিত স্মৃতি (সব চ্যাটে প্রযোজ্য, অবশ্যই মনে রাখবে) ===\n${items.map((m) => "- " + m.text).join("\n")}`;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: recent } = await supabaseAdmin.from("messages").select("content,created_at").eq("user_id", uid).eq("role", "user").order("created_at", { ascending: false }).limit(15);
          if (recent?.length)
            system += `\n\n=== এই ব্যবহারকারীর আগের চ্যাটগুলোতে সাম্প্রতিক কথা (প্রসঙ্গ মনে রাখতে ব্যবহার করবে) ===\n${recent.reverse().map((r) => "- " + String(r.content).slice(0, 200).replace(/\s+/g, " ")).join("\n")}`;
        } catch (e) {
          console.error("memory load failed", e);
        }

        const lastUser = String(parsed.data.messages[parsed.data.messages.length - 1]?.content ?? "");
        const lastImg = parsed.data.messages[parsed.data.messages.length - 1]?.image;
        const stages: string[] = ["think"];

        // Image generation request
        if (!lastImg && wantsImage(lastUser) && process.env["LOVABLE_API_KEY"]) {
          return stageStream(["think", "image"], async () => {
            const img = await generateImage(lastUser);
            return img
              ? `ছবি তৈরি হয়েছে:\n\n![তৈরি করা ছবি](${img})`
              : "দুঃখিত, এই মুহূর্তে ছবি তৈরি করা যায়নি। একটু পরে আবার চেষ্টা করুন বা বর্ণনা একটু বদলে দিন।";
          });
        }

        // Live web search for online/current questions
        if (needsSearch(lastUser)) {
          stages.push("search");
          const found = await Promise.race([
            webSearch(lastUser).catch(() => ""),
            new Promise<string>((r) => setTimeout(() => r(""), 12000)),
          ]);
          if (found) stages.push("verify");
          system += found
            ? `\n\n=== সর্বশেষ ওয়েব অনুসন্ধানের ফলাফল (${new Date().toISOString().slice(0, 10)}) ===\n${found}\n\nনির্দেশ: শুধু এই ফলাফলের ভিত্তিতে উত্তর দেবে, উত্তরের শেষে "সূত্র:" শিরোনামে ব্যবহৃত লিংকগুলো তালিকা করবে। ফলাফলে তথ্য না থাকলে স্পষ্ট বলবে যে নিশ্চিত তথ্য পাওয়া যায়নি — অনুমান করবে না।`
            : "\n\nব্যবহারকারী সাম্প্রতিক তথ্য চেয়েছেন কিন্তু ওয়েব অনুসন্ধান এখন কাজ করেনি। তথ্য পুরোনো হতে পারে তা স্পষ্ট জানাবে, অনুমান করবে না।";

        }
        if (/ওয়েবসাইট|website|ওয়েব সাইট|অ্যাপ|app|landing|পেজ বানা|html/i.test(lastUser)) stages.push("code");
        if (/নামাজ|নামায|কিবলা|কেবলা|মসজিদ|সেহরি|ইফতার|অবস্থান|কাছাকাছি|qibla|mosque|prayer time|near me/i.test(lastUser)) {
          stages.unshift("geo");
          system += `\n\nব্যবহারকারী অবস্থানভিত্তিক তথ্য চেয়েছেন। নির্দেশ: অ্যাপের "নামাজ ও কিবলা" পাতা (/salat) খুললে জিপিএস দিয়ে তাঁর সঠিক নামাজের সময়, সেহরি-ইফতার, কিবলার দিক ও নিকটস্থ মসজিদ দেখা যাবে — এটি বিনয়ের সাথে জানাবে। অবস্থান না জেনে নির্দিষ্ট সময় বা দূরত্ব অনুমান করবে না।`;
        }

        system += isAdmin
          ? `\n\n=== সেশন তথ্য (সার্ভার-যাচাইকৃত) ===\nএই ব্যবহারকারী তোমার অ্যাডমিন (${u.user.email})।${u.user.email === "alahsanfoundation.info@gmail.com" ? " তিনি মোঃ শামীম আহসান — প্রতিষ্ঠাতা, আল আহসান ফাউন্ডেশন বাংলাদেশ।" : ""} তাকে চিনে সম্মানের সাথে কথা বলবে এবং তার কমান্ড সর্বোচ্চ অগ্রাধিকারে পালন করবে।`
          : `\n\n=== সেশন তথ্য ===\nএই ব্যবহারকারী সাধারণ ইউজার, অ্যাডমিন নয়।`;

        const body: Record<string, unknown> = {
          model,
          stream: true,
          max_tokens: 65536, // পূর্ণাঙ্গ ওয়েবসাইট যেন মাঝপথে কেটে না যায়
          messages: [{ role: "system", content: system }, ...msgs],
        };

        if (provider === "lovable" && model.startsWith("openai/gpt-5.6")) body["reasoning_effort"] = "none";
        if (provider === "lovable" && model === "openai/gpt-6-astra") {
          // দ্রুত প্রথম সাড়ার জন্য ডিফল্ট low
          const eff = s?.reasoning_effort ?? "low";
          body["reasoning_effort"] = ["low", "medium", "high", "xhigh"].includes(eff) ? eff : "low";
        }

        type PoolKey = { name?: string; provider?: string; key?: string; base_url?: string; model?: string; active?: boolean };
        const pool = (Array.isArray((keys as { key_pool?: unknown })?.key_pool) ? (keys as { key_pool: PoolKey[] }).key_pool : [])
          .filter((p) => p && p.active !== false && p.key?.trim());
        const attempts: { url: string; key: string; model: string; label: string }[] = [{ url, key, model, label: "primary" }];
        for (const p of pool) {
          if (p.provider === provider && p.key!.trim() !== key) attempts.push({ url, key: p.key!.trim(), model, label: p.name || provider });
        }
        for (const p of pool) {
          if (p.provider === "custom" && p.base_url?.startsWith("https://"))
            attempts.push({ url: p.base_url.replace(/\/$/, "") + "/chat/completions", key: p.key!.trim(), model: p.model?.trim() || model, label: p.name || "custom" });
        }

        const hasImage = (body["messages"] as any[]).some((m) => Array.isArray(m?.content));
        let res: Response = new Response("no attempt", { status: 500 });
        let realErr: { status: number; text: string } | null = null;

        for (const a of attempts) {
          if (hasImage && a.label !== "primary" && !a.url.includes("generativelanguage.googleapis.com") && !a.url.includes("openai.com")) continue;
          // শুধু সংযোগ/প্রথম সাড়ার জন্য সময়সীমা; স্ট্রিম শুরু হলে আর কাটবে না
          const ac = new AbortController();
          const timer = setTimeout(() => ac.abort(), attempts.length > 1 ? 20000 : 45000);
          res = await fetch(a.url, {
            method: "POST",
            headers: { Authorization: `Bearer ${a.key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, model: a.model }),
            signal: ac.signal,
          }).catch((e) => new Response(String(e?.name === "AbortError" ? "timeout" : e), { status: e?.name === "AbortError" ? 504 : 502 }));
          clearTimeout(timer);
          if (res.ok && res.body) break;
          const t = (await res.text()).slice(0, 500);
          realErr ??= { status: res.status, text: t };
          console.error(`Key "${a.label}" failed [${res.status}]: ${t.slice(0, 300)}`);
        }

        if ((!res.ok || !res.body) && process.env["LOVABLE_API_KEY"]) {
          const first = `${provider}/${model}`.replace(/^google\/gemini-(1|2)\.\d.*$/, "google/gemini-3.1-pro-preview");
          const chain = [...new Set([provider !== "lovable" ? first : "", "google/gemini-3-flash-preview", "google/gemini-3.1-pro-preview"].filter(Boolean))];
          for (const gwModel of chain) {
            const g = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`, "Content-Type": "application/json" },
              body: JSON.stringify({ ...body, model: gwModel }),
            }).catch(() => null);
            if (g?.ok && g.body) { res = g; break; }
            await g?.text().catch(() => "");
          }
        }

        if (!res.ok || !res.body) {
          const err = realErr ?? { status: res.status, text: await res.text().catch(() => "") };
          return new Response(friendlyError(err.status, err.text), { status: err.status || 500 });
        }

        if (realErr) stages.push("fallback");
        stages.push("write");
        return withStages(stages, res.body);
      },
    },
  },
});

function pick(a: string[]): string {
  return a[Math.floor(Math.random() * a.length)] ?? a[0] ?? "";
}

function friendlyError(status: number, text: string): string {
  const t = text.toLowerCase();
  const billing = /insufficient[_ ]?(credit|balance|funds)|billing|payment required|credit balance|out of credits/.test(t) && !/rate|per minute|requests per/.test(t);
  if (billing) return "এআই সেবার অ্যাকাউন্টে ব্যালান্স বা বিলিং সমস্যার কথা জানিয়েছে। অ্যাডমিন প্যানেলে কী-টি যাচাই করুন বা অন্য কী যোগ করুন।";
  if (status === 429 || /rate.?limit|too many requests|resource_exhausted|quota/.test(t))
    return pick([
      "মনে হচ্ছে এখন এআই সেবায় সাময়িক অনুরোধের চাপ (Rate Limit) হয়েছে। এক মিনিট পর আবার পাঠান।",
      "এই মুহূর্তে অনুরোধ একটু বেশি হয়ে গেছে, তাই সেবা সাময়িক বিরতি চাইছে। একটু পরে আবার চেষ্টা করুন।",
      "সাময়িক সীমায় পৌঁছেছে — এটি স্থায়ী কিছু নয়। কিছুক্ষণ পর আবার লিখলেই উত্তর পাবেন।",
    ]);
  if (status === 401 || status === 403 || /api key|permission|unauthori[sz]ed|invalid.*key/.test(t))
    return "এআই কী গ্রহণ করা হয়নি (কী ভুল বা অনুমতি নেই)। অ্যাডমিন প্যানেলে কী যাচাই করুন।";
  if (status === 404 || /model.*(not found|no longer|deprecated)|model_not_found/.test(t))
    return "নির্বাচিত এআই মডেলটি আর পাওয়া যাচ্ছে না। অ্যাডমিন প্যানেল থেকে সচল মডেল বেছে নিন।";
  if (status === 504 || /timeout/.test(t)) return pick(["উত্তর আসতে বেশি সময় লাগছিল, তাই থেমে গেছে। আবার পাঠান।", "সংযোগ সময়মতো সাড়া দেয়নি। আরেকবার চেষ্টা করুন।"]);
  if (status === 400) return "অনুরোধটি এআই সেবা গ্রহণ করেনি (সম্ভবত ছবি বা লেখা খুব বড়)। ছোট করে আবার পাঠান।";
  if (status >= 500) return pick(["এআই সেবার সার্ভারে সাময়িক সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।", "ওপাশের সার্ভার এখন ঠিকমতো সাড়া দিচ্ছে না, কিছুক্ষণ পর আবার পাঠান।"]);
  return `উত্তর আনা যায়নি (কোড ${status})। একটু পরে আবার চেষ্টা করুন।`;
}

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (h === "metadata.google.internal" || h === "::1" || h === "::" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return true;
  }
  if (/^\d+$/.test(h) || /^0x/i.test(h)) return true;
  return false;
}

async function safeFetch(url: string): Promise<Response> {
  let current = url;
  for (let i = 0; i < 4; i++) {
    const u = new URL(current);
    if (!/^https?:$/.test(u.protocol) || isBlockedHost(u.hostname)) throw new Error("blocked");
    const r = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (AlAhsanAI reader)", Accept: "text/html,text/plain,*/*" },
      signal: AbortSignal.timeout(8000),
    });
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location");
      if (!loc) break;
      current = new URL(loc, current).href;
      continue;
    }
    return r;
  }
  throw new Error("too many redirects");
}

async function readUrls(text: string): Promise<string> {
  const urls = text.match(/https?:\/\/[^\s<>"')]+/g) || [];
  if (!urls.length) return "";
  const out: string[] = [];
  for (const u of urls.slice(0, 2)) {
    try {
      const r = await safeFetch(u);
      if (!r.ok) continue;
      const html = await r.text();
      const clean = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);
      if (clean) out.push(`[${u}]\n${clean}`);
    } catch {}
  }
  return out.join("\n\n");
}

const enc = new TextEncoder();
const sse = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`);
const SSE_HEADERS = { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" };

function withStages(stages: string[], upstream: ReadableStream<Uint8Array>): Response {
  const body = new ReadableStream<Uint8Array>({
    async start(c) {
      for (const st of stages) c.enqueue(sse({ stage: st }));
      const r = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await r.read();
          if (done) break;
          c.enqueue(value);
        }
      } catch (e) {
        c.enqueue(sse({ error: "সংযোগ মাঝপথে বিচ্ছিন্ন হয়েছে। আবার চেষ্টা করুন।" }));
      }
      c.close();
    },
  });
  return new Response(body, { headers: SSE_HEADERS });
}

function stageStream(stages: string[], work: () => Promise<string>): Response {
  const body = new ReadableStream<Uint8Array>({
    async start(c) {
      for (const st of stages) c.enqueue(sse({ stage: st }));
      let text = "";
      try { text = await work(); } catch { text = "কাজটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।"; }
      c.enqueue(sse({ choices: [{ delta: { content: text } }] }));
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });
  return new Response(body, { headers: SSE_HEADERS });
}

function wantsImage(t: string): boolean {
  return /(ছবি|চিত্র|লোগো|পোস্টার|ব্যানার|image|picture|photo|logo|poster|illustration|drawing)/i.test(t)
    && /(বানা|তৈরি|আঁক|এঁকে|জেনারেট|generate|create|draw|make|design)/i.test(t)
    && !/(ওয়েবসাইট|website|html|কোড|code)/i.test(t);
}

async function generateImage(prompt: string): Promise<string | null> {
  const key = process.env["LOVABLE_API_KEY"]!;
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-image-2.5-sunburst", prompt: prompt.slice(0, 3000), size: "1024x1024", n: 1 }),
      signal: AbortSignal.timeout(90000),
    }).catch(() => null);
    if (r?.ok) {
      const j: any = await r.json().catch(() => null);
      const d = j?.data?.[0];
      if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`;
      if (d?.url) return d.url;
    } else if (r) {
      console.error("image gen failed", r.status, (await r.text()).slice(0, 300));
      if (r.status !== 429 && r.status < 500) break;
    }
  }
  return null;
}

function needsSearch(t: string): boolean {
  if (/https?:\/\//.test(t)) return false;
  if (/=== সংযুক্ত ফাইল:/.test(t)) return false;
  // Location / time-of-day questions are answered from server clock & location guidance, not web search
  if (/(কোন জায়গায়|কোথায় আছি|আমার অবস্থান|where am i|কয়টা বাজে|কত তারিখ|কি বার|কী বার)/i.test(t)) return false;
  return /(সর্বশেষ|সাম্প্রতিক|আজকে?র?|এখন|বর্তমান|খবর|সংবাদ|দাম|মূল্য|রেট|আবহাওয়া|ফলাফল|স্কোর|নির্বাচন|২০২[৪-৯]|latest|today|current|news|price|weather|score|recent|202[4-9]|সার্চ|খুঁজে|search)/i.test(t);
}

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
async function ddgHtml(q: string): Promise<string> {
  for (let i = 0; i < 2; i++) {
    const r = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html", "Accept-Language": "bn-BD,bn;q=0.9,en;q=0.8", "Content-Type": "application/x-www-form-urlencoded" },
      body: `q=${encodeURIComponent(q.slice(0, 200))}&kl=bd-en`,
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    if (r?.ok) {
      const h = await r.text();
      if (/result__a/.test(h)) return h;
    }
    await new Promise((res) => setTimeout(res, 600));
  }
  return "";
}

async function bingSearch(q: string): Promise<{ url: string; title: string; snip: string }[]> {
  const r = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(q.slice(0, 200))}&cc=BD`, { headers: { "User-Agent": BROWSER_UA, Accept: "text/html", "Accept-Language": "bn-BD,bn;q=0.9,en;q=0.8" }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!r?.ok) return [];
  const html = await r.text();
  const strip = (x: string) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;|&ensp;/g, " ").replace(/\s+/g, " ").trim();
  const out: { url: string; title: string; snip: string }[] = [];
  for (const block of html.split('<li class="b_algo"').slice(1)) {
    const a = /<h2[^>]*>\s*<a[^>]+href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(block);
    if (!a) continue;
    const p = /<p[^>]*>([\s\S]*?)<\/p>/.exec(block);
    out.push({ url: a[1]!.replace(/&amp;/g, "&"), title: strip(a[2]!), snip: p ? strip(p[1]!) : "" });
    if (out.length >= 6) break;
  }
  return out;
}

async function newsRss(q: string): Promise<string> {
  const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q.slice(0, 150))}&hl=bn&gl=BD&ceid=BD:bn`, { headers: { "User-Agent": BROWSER_UA }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!r?.ok) return "";
  const xml = await r.text();
  const items = xml.split("<item>").slice(1, 9).map((it) => {
    const g = (t: string) => (new RegExp(`<${t}>([\\s\\S]*?)</${t}>`).exec(it)?.[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    return `- ${g("title")} (${g("pubDate")})\n  ${g("link")}`;
  });
  return items.length ? `=== সর্বশেষ সংবাদ শিরোনাম (Google News) ===\n${items.join("\n")}` : "";
}

async function tavilySearch(q: string): Promise<{ url: string; title: string; snip: string }[]> {
  const key = process.env["TAVILY_API_KEY"]?.trim();
  if (!key) return [];
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query: q.slice(0, 300), max_results: 5, search_depth: "basic" }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!r?.ok) return [];
  const data = (await r.json().catch(() => null)) as { results?: { url: string; title: string; content: string }[] } | null;
  if (!data?.results?.length) return [];
  return data.results.map((it) => ({
    url: it.url,
    title: it.title || "",
    snip: it.content || "",
  }));
}

async function webSearch(q: string): Promise<string> {
  const news = /(খবর|সংবাদ|news|আজকে?র?|today|সর্বশেষ|latest)/i.test(q) ? newsRss(q.replace(/(আজকের|আজকে|কী|কি|\?)/g, " ").trim() || "বাংলাদেশ") : Promise.resolve("");
  const tavily = await tavilySearch(q);
  if (tavily.length) {
    const n = await news;
    return [n, tavily.map((o, i) => `[${i + 1}] ${o.title}\n${o.url}\n${o.snip}`).join("\n\n")].filter(Boolean).join("\n\n");
  }
  const html = await ddgHtml(q);
  if (!html) {
    const b = await bingSearch(q);
    const n = await news;
    if (!b.length) return n;
    const top = await readUrls(b.slice(0, 2).map((o) => o.url).join(" ")).catch(() => "");
    return [n, b.map((o, i) => `[${i + 1}] ${o.title}\n${o.url}\n${o.snip}`).join("\n\n"), top ? `--- শীর্ষ পেজের লেখা ---\n${top}` : ""].filter(Boolean).join("\n\n");
  }
  const strip = (x: string) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
  const out: { url: string; title: string; snip: string }[] = [];
  const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 6) {
    let url = m[1]!;
    const uddg = /uddg=([^&]+)/.exec(url);
    if (uddg) url = decodeURIComponent(uddg[1]!);
    if (!/^https?:/.test(url)) continue;
    out.push({ url, title: strip(m[2]!), snip: strip(m[3]!) });
  }
  if (!out.length) return await news;
  const top = await readUrls(out.slice(0, 2).map((o) => o.url).join(" ")).catch(() => "");
  const n = await news;
  return (n ? n + "\n\n" : "") + out.map((o, i) => `[${i + 1}] ${o.title}\n${o.url}\n${o.snip}`).join("\n\n") + (top ? `\n\n--- শীর্ষ পেজের লেখা ---\n${top}` : "");
}
