import { useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useGeminiVoice } from "@/hooks/use-gemini-voice";

/** চ্যাটের ভেতরেই থাকা ভয়েস কল বার (ChatGPT-এর মতো) — চ্যাট দৃশ্যমান থাকে */
export function VoiceCallDialog({ onClose }: { onClose: () => void }) {
  const [caption, setCaption] = useState("");
  const [thinking, setThinking] = useState(false);
  const call = useGeminiVoice({ onEvent(event) {
    if (event.type === "app.delegation.pending") setThinking(true);
    const delta = event["delta"];
    if (event.type === "session.output_transcript.delta" && typeof delta === "string") {
      setThinking(false);
      setCaption(previous => (previous + delta).slice(-600));
    }
    if (event.type === "session.input_transcript.delta") setCaption("");
  } });
  const canStart = call.status === "idle" || call.status === "closed";
  const live = call.status === "connected";
  const status = { idle: "ভয়েস কল", connecting: "সংযোগ হচ্ছে…", connected: thinking ? "ভাবছি…" : "শুনছি… কথা বলুন", stopping: "কল শেষ হচ্ছে…", closed: "কল শেষ হয়েছে" }[call.status];
  return <div className="shrink-0 border-b border-border/60 bg-card px-3 py-2 sm:px-6">
    <audio ref={call.audioRef} autoPlay className="hidden" />
    <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
      <div className={`relative shrink-0 ${live ? "animate-pulse" : ""}`}><Logo size={36} /></div>
      <div className="min-w-0 flex-1">
        <p role="status" className="text-sm font-medium text-foreground">{status}</p>
        {caption && <p aria-live="polite" className="line-clamp-2 text-xs text-muted-foreground">{caption}</p>}
        {call.error && <p role="alert" className="break-words text-xs text-destructive">{call.error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {call.playbackBlocked && <Button size="sm" variant="outline" onClick={call.resumePlayback}><Play />শুনুন</Button>}
        {canStart ? <>
          <Button size="sm" onClick={() => { setCaption(""); setThinking(false); window.speechSynthesis?.cancel(); call.start(); }}><Phone />{call.status === "closed" ? "আবার" : "শুরু"}</Button>
          <Button size="icon" variant="ghost" onClick={() => { call.stop(); onClose(); }} aria-label="বন্ধ করুন"><X /></Button>
        </> : <>
          <Button size="icon" variant="outline" disabled={call.status === "stopping"} onClick={() => call.setMuted(!call.muted)} aria-label={call.muted ? "মাইক চালু করুন" : "মাইক বন্ধ করুন"}>{call.muted ? <MicOff /> : <Mic />}</Button>
          <Button size="icon" variant="destructive" disabled={call.status === "stopping"} onClick={() => { call.stop(); onClose(); }} aria-label="কল শেষ করুন"><PhoneOff /></Button>
        </>}
      </div>
    </div>
  </div>;
}
