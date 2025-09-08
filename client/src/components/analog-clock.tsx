import { useEffect, useRef, useCallback } from "react";

interface AnalogClockProps {
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  isSpeaking: boolean;
}

export default function AnalogClock({ currentTime, onTimeChange, isSpeaking }: AnalogClockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef<{ hand: string; offset: number } | null>(null);

  const drawClock = useCallback((time: Date) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw clock face
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Draw hour markers
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x1 = centerX + (radius - 30) * Math.cos(angle);
      const y1 = centerY + (radius - 30) * Math.sin(angle);
      const x2 = centerX + radius * Math.cos(angle);
      const y2 = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Draw minute markers
    for (let i = 0; i < 60; i++) {
      if (i % 5 !== 0) {
        const angle = (i * 6 - 90) * (Math.PI / 180);
        const x1 = centerX + (radius - 15) * Math.cos(angle);
        const y1 = centerY + (radius - 15) * Math.sin(angle);
        const x2 = centerX + radius * Math.cos(angle);
        const y2 = centerY + radius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw numbers
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    numbers.forEach((num, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = centerX + (radius - 50) * Math.cos(angle);
      const y = centerY + (radius - 50) * Math.sin(angle);
      ctx.fillText(num.toString(), x, y);
    });

    // Calculate hand angles
    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    const hourAngle = (hours * 30 + minutes * 0.5 - 90) * (Math.PI / 180);
    const minuteAngle = (minutes * 6 - 90) * (Math.PI / 180);
    const secondAngle = (seconds * 6 - 90) * (Math.PI / 180);

    // Draw hour hand
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + (radius * 0.5) * Math.cos(hourAngle),
      centerY + (radius * 0.5) * Math.sin(hourAngle)
    );
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw minute hand
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + (radius * 0.7) * Math.cos(minuteAngle),
      centerY + (radius * 0.7) * Math.sin(minuteAngle)
    );
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw second hand (only if not speaking)
    if (!isSpeaking) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + (radius * 0.8) * Math.cos(secondAngle),
        centerY + (radius * 0.8) * Math.sin(secondAngle)
      );
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [isSpeaking]);

  const getHandFromPosition = (x: number, y: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const clickX = (x - rect.left) * (canvas.width / rect.width);
    const clickY = (y - rect.top) * (canvas.height / rect.height);
    
    const distance = Math.sqrt((clickX - centerX) ** 2 + (clickY - centerY) ** 2);
    const radius = Math.min(centerX, centerY) - 10;
    
    if (distance > radius * 0.8) return 'second';
    if (distance > radius * 0.7) return 'minute';
    if (distance > radius * 0.5) return 'hour';
    return null;
  };

  const updateTimeFromAngle = (hand: string, angle: number) => {
    const newTime = new Date(currentTime);
    
    if (hand === 'hour') {
      const hours = Math.floor((angle + 90) / 30) % 12;
      const currentHours = newTime.getHours();
      const isPM = currentHours >= 12;
      newTime.setHours(isPM ? hours + 12 : hours);
    } else if (hand === 'minute') {
      const minutes = Math.floor((angle + 90) / 6) % 60;
      newTime.setMinutes(minutes);
    } else if (hand === 'second') {
      const seconds = Math.floor((angle + 90) / 6) % 60;
      newTime.setSeconds(seconds);
    }
    
    onTimeChange(newTime);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hand = getHandFromPosition(e.clientX, e.clientY, canvas);
    if (!hand) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const angle = Math.atan2(clickY - centerY, clickX - centerX) * (180 / Math.PI);
    
    isDragging.current = { hand, offset: 0 };
    canvas.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDragging.current) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const angle = Math.atan2(clickY - centerY, clickX - centerX) * (180 / Math.PI);
    updateTimeFromAngle(isDragging.current.hand, angle);
  };

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isDragging.current = null;
    canvas.style.cursor = 'grab';
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hand = getHandFromPosition(e.clientX, e.clientY, canvas);
    canvas.style.cursor = hand ? 'grab' : 'default';
  };

  useEffect(() => {
    drawClock(currentTime);
  }, [currentTime, drawClock]);

  return (
    <div className="clock-container w-80 h-80 md:w-96 md:h-96">
      <canvas
        ref={canvasRef}
        width={384}
        height={384}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        data-testid="analog-clock"
      />
    </div>
  );
}
