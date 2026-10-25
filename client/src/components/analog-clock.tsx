import { useEffect, useRef, useCallback, useState } from "react";

interface AnalogClockProps {
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  isSpeaking: boolean;
}

type Hand = 'hour' | 'minute' | 'second';

// Logical canvas size; the backing store is scaled by devicePixelRatio for sharp rendering
const SIZE = 384;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 40; // leave room for the outer minute numbers

// Max distance (canvas px) between a touch point and a hand for it to be picked up
const HIT_DISTANCE = 36;

// Hand lengths keep the tip grips off the hour numbers (centered at RADIUS - 50):
// the hour grip stays inside the numbers, the minute and second grips sit on the tick ring
const HANDS: Record<Hand, { label: string; color: string; length: number; width: number; knob: number }> = {
  hour: { label: '시침', color: '#2563eb', length: 0.45, width: 10, knob: 10 },
  minute: { label: '분침', color: '#059669', length: 0.88, width: 7, knob: 9 },
  second: { label: '초침', color: '#ea580c', length: 0.95, width: 3, knob: 6 },
};

const HAND_ORDER: Hand[] = ['hour', 'minute', 'second'];

function getHandAngles(time: Date): Record<Hand, number> {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  return {
    hour: (hours * 30 + minutes * 0.5 - 90) * (Math.PI / 180),
    minute: (minutes * 6 - 90) * (Math.PI / 180),
    second: (seconds * 6 - 90) * (Math.PI / 180),
  };
}

function getHandTip(hand: Hand, angle: number) {
  const length = RADIUS * HANDS[hand].length;
  return {
    x: CENTER + length * Math.cos(angle),
    y: CENTER + length * Math.sin(angle),
  };
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export default function AnalogClock({ currentTime, onTimeChange, isSpeaking }: AnalogClockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef<Hand | null>(null);
  const [activeHand, setActiveHand] = useState<Hand | null>(null);
  const [hoverHand, setHoverHand] = useState<Hand | null>(null);
  const highlighted = activeHand ?? hoverHand;

  const drawClock = useCallback((time: Date) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr;
      canvas.height = SIZE * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = CENTER;
    const centerY = CENTER;
    const radius = RADIUS;

    // Clear canvas
    ctx.clearRect(0, 0, SIZE, SIZE);

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

    // Draw hour numbers (inside)
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 32px "Pretendard Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    numbers.forEach((num, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = centerX + (radius - 50) * Math.cos(angle);
      const y = centerY + (radius - 50) * Math.sin(angle);
      ctx.fillText(num.toString(), x, y);
    });

    // Draw minute/second numbers (outside)
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 20px "Pretendard Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    minuteNumbers.forEach((num, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = centerX + (radius + 25) * Math.cos(angle);
      const y = centerY + (radius + 25) * Math.sin(angle);
      ctx.fillText(num.toString(), x, y);
    });

    const angles = getHandAngles(time);

    const drawHand = (hand: Hand) => {
      const { color, width, knob } = HANDS[hand];
      const tip = getHandTip(hand, angles[hand]);
      const isHighlighted = hand === highlighted;
      // Dim the other hands while one is being dragged so the selected one stands out
      const isDimmed = activeHand !== null && !isHighlighted;

      ctx.save();
      ctx.globalAlpha = isDimmed ? 0.3 : 1;

      // Soft halo behind the selected hand
      if (isHighlighted) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = width + 16;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(tip.x, tip.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = isHighlighted ? width + 3 : width;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Round grip at the tip shows where to grab the hand
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, isHighlighted ? knob + 5 : knob, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    };

    // Draw the highlighted hand last so it sits on top
    const visibleHands = HAND_ORDER.filter((hand) => hand !== 'second' || !isSpeaking);
    visibleHands.filter((hand) => hand !== highlighted).forEach(drawHand);
    if (highlighted && visibleHands.includes(highlighted)) {
      drawHand(highlighted);
    }

    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [isSpeaking, activeHand, highlighted]);

  const toCanvasPoint = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (SIZE / rect.width),
      y: (clientY - rect.top) * (SIZE / rect.height),
    };
  };

  // Pick the hand closest to the touch point, so any part of a hand can be grabbed
  const getHandFromPosition = (clientX: number, clientY: number, canvas: HTMLCanvasElement): Hand | null => {
    const { x, y } = toCanvasPoint(clientX, clientY, canvas);
    // All hands meet at the center, so touches there are ambiguous
    if (Math.hypot(x - CENTER, y - CENTER) < 20) return null;

    const angles = getHandAngles(currentTime);
    let closest: Hand | null = null;
    let closestDistance = HIT_DISTANCE;

    for (const hand of HAND_ORDER) {
      if (hand === 'second' && isSpeaking) continue;
      const tip = getHandTip(hand, angles[hand]);
      const distance = distanceToSegment(x, y, CENTER, CENTER, tip.x, tip.y);
      if (distance < closestDistance) {
        closest = hand;
        closestDistance = distance;
      }
    }

    return closest;
  };

  const updateTimeFromAngle = (hand: Hand, angle: number) => {
    // atan2 gives -180..180 with 0 at 3 o'clock; convert to 0..360 clockwise from 12 o'clock
    const clockAngle = (angle + 90 + 360) % 360;

    const units = {
      hour: { steps: 12, ms: 60 * 60 * 1000, current: currentTime.getHours() % 12 },
      minute: { steps: 60, ms: 60 * 1000, current: currentTime.getMinutes() },
      second: { steps: 60, ms: 1000, current: currentTime.getSeconds() },
    };
    const { steps, ms, current } = units[hand];
    const target = Math.floor(clockAngle / (360 / steps)) % steps;

    // Move by the shortest way around the dial, so passing 12 o'clock carries over like a real clock:
    // minute 59 -> 0 adds an hour, second 59 -> 0 adds a minute, hour 11 -> 12 switches AM/PM (and back when reversing)
    let delta = target - current;
    if (delta > steps / 2) delta -= steps;
    if (delta < -steps / 2) delta += steps;

    onTimeChange(new Date(currentTime.getTime() + delta * ms));
  };

  // Pointer events handle mouse, touch and pen alike
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hand = getHandFromPosition(e.clientX, e.clientY, canvas);
    if (!hand) return;

    // Keep receiving moves even if the finger slides off the canvas
    canvas.setPointerCapture(e.pointerId);
    isDragging.current = hand;
    setActiveHand(hand);
    canvas.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isDragging.current) {
      if (e.pointerType === 'mouse') {
        const hand = getHandFromPosition(e.clientX, e.clientY, canvas);
        setHoverHand(hand);
        canvas.style.cursor = hand ? 'grab' : 'default';
      }
      return;
    }

    const { x, y } = toCanvasPoint(e.clientX, e.clientY, canvas);
    const angle = Math.atan2(y - CENTER, x - CENTER) * (180 / Math.PI);
    updateTimeFromAngle(isDragging.current, angle);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDragging.current) return;

    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isDragging.current = null;
    setActiveHand(null);
    canvas.style.cursor = 'grab';
  };

  // The canvas doesn't redraw by itself when the web font finishes loading (e.g. while the time is set by hand)
  const [fontsLoaded, setFontsLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setFontsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    drawClock(currentTime);
  }, [currentTime, drawClock, fontsLoaded]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="clock-container w-96 max-w-full aspect-square">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="w-full h-full touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={() => setHoverHand(null)}
          data-testid="analog-clock"
        />
      </div>

      {/* Legend: which color is which hand, and which one is currently selected */}
      <div className="flex gap-2" data-testid="clock-hand-legend">
        {HAND_ORDER.map((hand) => {
          const { label, color } = HANDS[hand];
          const isSelected = hand === highlighted;
          return (
            <div
              key={hand}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 font-bold text-base transition-all ${
                isSelected ? 'scale-110 text-white shadow-md' : 'bg-white text-foreground'
              }`}
              style={{ borderColor: color, backgroundColor: isSelected ? color : undefined }}
              data-testid={`legend-${hand}`}
            >
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: isSelected ? '#ffffff' : color }}
              />
              {label}
            </div>
          );
        })}
      </div>
      <p className="text-base font-semibold text-muted-foreground text-center" data-testid="clock-drag-hint">
        {highlighted
          ? `${HANDS[highlighted].label}을 움직이고 있어요`
          : '바늘 끝의 동그라미를 잡고 돌려보세요'}
      </p>
    </div>
  );
}
