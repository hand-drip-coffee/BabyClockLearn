import { useState, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

// Uses the native Android/iOS TTS engine in the app and the Web Speech API in the browser
export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Only the latest speak() call may clear isSpeaking; earlier ones end when they get interrupted
  const requestId = useRef(0);

  const speak = useCallback(async (text: string) => {
    if (!Capacitor.isNativePlatform() && !('speechSynthesis' in window)) {
      alert('음성 기능을 지원하지 않는 브라우저입니다.');
      return;
    }

    const id = ++requestId.current;
    setIsSpeaking(true);

    try {
      // The default queue strategy stops any ongoing speech first
      await TextToSpeech.speak({
        text,
        lang: 'ko-KR',
        rate: 0.8,
        pitch: 1.2,
        volume: 1.0,
      });
    } catch (error) {
      console.error('Speech failed:', error);
    } finally {
      if (id === requestId.current) {
        setIsSpeaking(false);
      }
    }
  }, []);

  const stopSpeaking = useCallback(async () => {
    requestId.current++;
    setIsSpeaking(false);
    try {
      await TextToSpeech.stop();
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking
  };
}
