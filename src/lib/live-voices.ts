export const LIVE_VOICES = [
  { id: "marin", label: "আগের কণ্ঠ" },
  { id: "meridian", label: "পুরুষ কণ্ঠ" },
] as const;
export type LiveVoice = (typeof LIVE_VOICES)[number]["id"];
export function resolveLiveVoice(value: unknown): LiveVoice {
  return value === "meridian" ? "meridian" : "marin";
}