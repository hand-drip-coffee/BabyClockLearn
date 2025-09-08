import { useState } from "react";
import AnalogClock from "@/components/analog-clock";
import VoiceControl from "@/components/voice-control";
import TimeCalculations from "@/components/time-calculations";
import { useClock } from "@/hooks/use-clock";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [is24Hour, setIs24Hour] = useState(false);
  const { currentTime, manualTime, setManualTime, isSpeaking } = useClock();

  const formatTime = (time: Date, use24Hour: boolean) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    
    if (use24Hour) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      const period = hours >= 12 ? '오후' : '오전';
      const displayHours = hours % 12 || 12;
      return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const formatTimeKorean = (time: Date, use24Hour: boolean) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    
    const period = use24Hour ? '' : (hours >= 12 ? '오후 ' : '오전 ');
    const displayHours = use24Hour ? hours : (hours % 12 || 12);
    
    const hourText = convertNumberToKorean(displayHours);
    const minuteText = convertNumberToKorean(minutes);
    const secondText = convertNumberToKorean(seconds);
    
    return `${period}${hourText} 시 ${minuteText} 분 ${secondText} 초`;
  };

  const convertNumberToKorean = (num: number) => {
    const ones = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const tens = ['', '십', '이십', '삼십', '사십', '오십'];
    
    if (num === 0) return '영';
    if (num < 10) return ones[num];
    if (num < 60) {
      const tenDigit = Math.floor(num / 10);
      const oneDigit = num % 10;
      return tens[tenDigit] + (oneDigit > 0 ? ones[oneDigit] : '');
    }
    return num.toString();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl" data-testid="home-page">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-2" data-testid="app-title">
          🕐 시계 배우기
        </h1>
        <p className="text-xl text-muted-foreground font-semibold" data-testid="app-subtitle">
          재미있게 시간을 배워보아요!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Panel - Controls */}
        <div className="lg:order-1 space-y-6">
          {/* Voice Control */}
          <VoiceControl 
            currentTime={manualTime || currentTime}
            is24Hour={is24Hour}
            formatTimeKorean={formatTimeKorean}
          />

          {/* 12/24 Hour Toggle */}
          <div className="feature-card p-6">
            <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              ⏰ 시간 형식
            </h3>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">12시간</span>
              <Button
                variant="ghost"
                className={`toggle-switch ${is24Hour ? 'active' : ''}`}
                onClick={() => setIs24Hour(!is24Hour)}
                data-testid="toggle-time-format"
              >
                <div className="toggle-slider"></div>
              </Button>
              <span className="font-semibold text-lg">24시간</span>
            </div>
          </div>

          {/* Current Time Display */}
          <div className="time-display p-6">
            <h3 className="text-xl font-bold text-foreground mb-3">현재 시간</h3>
            <div className="text-3xl font-black text-primary" data-testid="current-time-display">
              {formatTime(currentTime, is24Hour)}
            </div>
            <div className="text-lg text-muted-foreground mt-2" data-testid="current-time-korean">
              {formatTimeKorean(currentTime, is24Hour)}
            </div>
            {manualTime && (
              <Button
                className="w-full bg-primary text-primary-foreground py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors mt-4"
                onClick={() => setManualTime(null)}
                data-testid="reset-to-current-time-button"
              >
                🕐 현재 시각으로 돌아가기
              </Button>
            )}
          </div>
        </div>

        {/* Center - Analog Clock */}
        <div className="lg:order-2 flex justify-center">
          <AnalogClock 
            currentTime={manualTime || currentTime}
            onTimeChange={setManualTime}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Right Panel - Time Calculations */}
        <div className="lg:order-3">
          <TimeCalculations 
            currentTime={currentTime}
            is24Hour={is24Hour}
            formatTimeKorean={formatTimeKorean}
            manualTime={manualTime}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-12 bg-card rounded-3xl p-8 border-2 border-border">
        <h2 className="text-3xl font-bold text-foreground mb-6 text-center" data-testid="instructions-title">
          📚 사용 방법
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">👆</div>
            <h3 className="font-bold text-lg mb-2">바늘 움직이기</h3>
            <p className="text-muted-foreground">시침, 분침, 초침을 드래그해서 시간을 바꿔보세요</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🔊</div>
            <h3 className="font-bold text-lg mb-2">소리로 듣기</h3>
            <p className="text-muted-foreground">버튼을 눌러 시간을 소리로 들어보세요</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="font-bold text-lg mb-2">설정 바꾸기</h3>
            <p className="text-muted-foreground">12시간과 24시간 중에 선택할 수 있어요</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🧮</div>
            <h3 className="font-bold text-lg mb-2">시간 계산</h3>
            <p className="text-muted-foreground">남은 시간과 지난 시간을 계산해보세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
