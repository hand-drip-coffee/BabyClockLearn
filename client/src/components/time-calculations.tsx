import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "@/hooks/use-speech";
import { calculateTimeDifference } from "@/lib/time-utils";

interface TimeCalculationsProps {
  currentTime: Date;
  is24Hour: boolean;
  formatTimeKorean: (time: Date, use24Hour: boolean) => string;
  manualTime: Date | null;
}

export default function TimeCalculations({ 
  currentTime, 
  is24Hour, 
  formatTimeKorean,
  manualTime 
}: TimeCalculationsProps) {
  const [targetTime, setTargetTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const { speak } = useSpeech();

  const timeUntilTarget = targetTime ? calculateTimeDifference(currentTime, targetTime) : null;
  const timeSinceStart = startTime ? calculateTimeDifference(startTime, currentTime) : null;

  const handleSpeakTimeUntil = () => {
    if (timeUntilTarget) {
      const text = `목표 시간까지 ${timeUntilTarget.description}`;
      speak(text);
    }
  };

  const handleSpeakTimeSince = () => {
    if (timeSinceStart) {
      const text = `시작 시간부터 ${timeSinceStart.description}`;
      speak(text);
    }
  };

  const handleSpeakManualTime = () => {
    if (manualTime) {
      const text = formatTimeKorean(manualTime, is24Hour);
      speak(`설정한 시간은 ${text}입니다`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Until Target */}
      <div className="feature-card p-6">
        <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          ⏳ 남은 시간
        </h3>
        <div className="space-y-3">
          <Input
            type="time"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            className="w-full p-3 rounded-xl border-2 border-border text-lg font-semibold"
            placeholder="목표 시간"
            data-testid="target-time-input"
          />
          <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4">
            <div className="text-accent font-bold text-lg" data-testid="time-until-display">
              {timeUntilTarget ? timeUntilTarget.description : '목표 시간을 설정하세요'}
            </div>
          </div>
          <Button
            className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors"
            onClick={handleSpeakTimeUntil}
            disabled={!timeUntilTarget}
            data-testid="speak-time-until-button"
          >
            🔊 남은 시간 듣기
          </Button>
        </div>
      </div>

      {/* Time Since Target */}
      <div className="feature-card p-6">
        <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          ⌛ 지난 시간
        </h3>
        <div className="space-y-3">
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-3 rounded-xl border-2 border-border text-lg font-semibold"
            placeholder="시작 시간"
            data-testid="start-time-input"
          />
          <div className="bg-secondary/10 border-2 border-secondary/20 rounded-xl p-4">
            <div className="text-secondary font-bold text-lg" data-testid="time-since-display">
              {timeSinceStart ? timeSinceStart.description : '시작 시간을 설정하세요'}
            </div>
          </div>
          <Button
            className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-bold hover:bg-secondary/90 transition-colors"
            onClick={handleSpeakTimeSince}
            disabled={!timeSinceStart}
            data-testid="speak-time-since-button"
          >
            🔊 지난 시간 듣기
          </Button>
        </div>
      </div>

      {/* Manual Time Set */}
      <div className="feature-card p-6">
        <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          ✋ 시간 맞추기
        </h3>
        <p className="text-muted-foreground mb-3 text-center">
          시계 바늘을 드래그해서<br />시간을 바꿔보세요!
        </p>
        <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4">
          <div className="text-primary font-bold text-lg text-center" data-testid="manual-time-display">
            {manualTime ? formatTimeKorean(manualTime, is24Hour) : '현재 시간'}
          </div>
        </div>
        <Button
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors mt-3"
          onClick={handleSpeakManualTime}
          disabled={!manualTime}
          data-testid="speak-manual-time-button"
        >
          🔊 설정한 시간 듣기
        </Button>
      </div>
    </div>
  );
}
