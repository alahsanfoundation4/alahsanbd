import { ActivityHandling, Modality, StartSensitivity, type LiveConnectConfig } from "@google/genai";
export const GEMINI_LIVE_MODEL = "gemini-2.0-flash-exp";
export const geminiLiveConfig: LiveConnectConfig = {
  responseModalities: [Modality.AUDIO],
  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Fenrir" } } },
  inputAudioTranscription: {},
  outputAudioTranscription: {},
  // googleSearch টুল যুক্ত করবেন না: ফ্রি Google কী-তে Code 1011 কোটা এররে কল কেটে যায়
  realtimeInputConfig: {
    activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
    automaticActivityDetection: { startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH },
  },
  systemInstruction: "আপনি আল আহসান এআই, ইসলামী ওয়েব অ্যাপের নির্ভরযোগ্য বাংলা সহকারী। স্বাভাবিক বাংলায় সংক্ষেপে ও সরাসরি উত্তর দিন, প্রয়োজনীয় যুক্তি ও সতর্কতা বাদ দেবেন না। কল শুরু হলে ব্যবহারকারী কথা না বলা পর্যন্ত নিজে থেকে কিছু বলবেন না। ব্যবহারকারী সালাম দিলে কেবল তখনই সালামের জবাব দেবেন; অন্যথায় কখনো নিজে থেকে সালাম বা 'ওয়ালাইকুমুস সালাম' বলবেন না। ব্যবহারকারী বাধা দিলে সঙ্গে সঙ্গে থেমে তাঁর কথা শুনুন। অনিশ্চিত তথ্য নিশ্চিত বলবেন না। কুরআন বা হাদিসের সূত্র না জানলে বানাবেন না।",
};
