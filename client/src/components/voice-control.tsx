import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";

interface VoiceControlProps {
  currentTime: Date;
  is24Hour: boolean;
  formatTimeKorean: (time: Date, use24Hour: boolean) => string;
}

export default function VoiceControl({ currentTime, is24Hour, formatTimeKorean }: VoiceControlProps) {
  const { speak, isSpeaking } = useSpeech();

  const handleSpeak = () => {
    const text = formatTimeKorean(currentTime, is24Hour);
    speak(text);
  };

  return (
    <div className="feature-card p-6">
      <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        🔊 음성 안내
      </h3>
      <Button
        className={`voice-button w-full py-6 rounded-2xl text-white font-bold text-xl shadow-lg ${isSpeaking ? 'speaking' : ''}`}
        onClick={handleSpeak}
        disabled={isSpeaking}
        data-testid="speak-time-button"
      >
        {isSpeaking ? '말하는 중...' : '시간 말하기'}
      </Button>
      <div className="mt-4 text-sm text-muted-foreground text-center">
        버튼을 눌러 현재 시간을 들어보세요
      </div>
    </div>
  );
}
