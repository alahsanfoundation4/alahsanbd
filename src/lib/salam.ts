const USER_SALAM = /(আস[-\s]?সালামু|আসসালাম|সালাম|assalamu|assalam|salam|السلام)/i;
const REPLY_SALAM = /^\s*(ওয়া|ওয়া|ওয়া)?\s*(আলাইকুমুস|আলাইকুম|লাইকুমুস|লাইকুম)\s*(আস[-\s]?)?সালাম[^\s।!,.]*[।!,.\s]*/u;
const REPLY_SALAM_LATIN = /^\s*wa?\s*-?\s*alaikum(us)?\s*-?\s*(as)?-?salam\S*[\s.!,]*/i;

export const userGaveSalam = (text: string) => USER_SALAM.test(text);

/** ব্যবহারকারী সালাম না দিলে উত্তরের শুরুর অযাচিত "ওয়ালাইকুমুস সালাম" সরায় */
export function stripUnaskedSalam(reply: string, userText: string): string {
  if (userGaveSalam(userText)) return reply;
  return reply.replace(REPLY_SALAM, "").replace(REPLY_SALAM_LATIN, "");
}
