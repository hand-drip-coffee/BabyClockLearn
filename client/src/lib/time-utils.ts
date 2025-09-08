export function calculateTimeDifference(from: Date | string, to: Date | string): { 
  hours: number; 
  minutes: number; 
  seconds: number; 
  description: string; 
} | null {
  try {
    let fromTime: Date;
    let toTime: Date;

    if (typeof from === 'string') {
      const [hours, minutes] = from.split(':').map(Number);
      fromTime = new Date();
      fromTime.setHours(hours, minutes, 0, 0);
    } else {
      fromTime = from;
    }

    if (typeof to === 'string') {
      const [hours, minutes] = to.split(':').map(Number);
      toTime = new Date();
      toTime.setHours(hours, minutes, 0, 0);
    } else {
      toTime = to;
    }

    let diffMs = toTime.getTime() - fromTime.getTime();
    
    // Handle negative differences for past times
    if (diffMs < 0) {
      diffMs = Math.abs(diffMs);
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    let description = '';
    if (hours > 0) {
      description += `${hours}시간 `;
    }
    if (minutes > 0) {
      description += `${minutes}분 `;
    }
    if (seconds > 0 || (hours === 0 && minutes === 0)) {
      description += `${seconds}초 `;
    }

    description = description.trim();
    
    // Add appropriate suffix
    if (typeof to === 'string') {
      description += '남음';
    } else {
      description += '지남';
    }

    return {
      hours,
      minutes,
      seconds,
      description
    };
  } catch (error) {
    console.error('Error calculating time difference:', error);
    return null;
  }
}

export function formatTimeToKorean(time: Date, is24Hour: boolean = false): string {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  
  const period = is24Hour ? '' : (hours >= 12 ? '오후 ' : '오전 ');
  const displayHours = is24Hour ? hours : (hours % 12 || 12);
  
  const hourText = convertNumberToKorean(displayHours);
  const minuteText = convertNumberToKorean(minutes);
  const secondText = convertNumberToKorean(seconds);
  
  return `${period}${hourText} 시 ${minuteText} 분 ${secondText} 초`;
}

export function convertNumberToKorean(num: number): string {
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
}
