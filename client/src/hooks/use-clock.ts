import { useState, useEffect, useRef } from "react";

export function useClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [manualTime, setManualTime] = useState<Date | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => {
      if (!isSpeaking) {
        setCurrentTime(new Date());
      }
    };

    // Update immediately
    updateTime();

    // Set up interval
    intervalRef.current = setInterval(updateTime, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSpeaking]);

  // Listen for speech events from Web Speech API
  useEffect(() => {
    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => {
      setIsSpeaking(false);
      // Resume clock from current time
      setCurrentTime(new Date());
    };

    // Note: These events would be managed by the speech hook
    // This is a simplified implementation
    return () => {
      // Cleanup if needed
    };
  }, []);

  return {
    currentTime,
    manualTime,
    setManualTime,
    isSpeaking
  };
}
