# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

"시계 배우기": 어린이를 위한 한국어 시계 학습 웹 앱입니다. 아날로그 시계의 바늘을 드래그하고, 시간을 한국어 음성으로 듣고, 12/24시간 표시를 전환하고, 남은 시간과 지난 시간을 계산할 수 있습니다. 원래 Replit에서 만들어졌습니다(`replit.md`, `.replit` 참고).

Capacitor로 안드로이드 앱으로 바꾸는 중입니다. 현재는 `@capacitor/core`와 TTS 플러그인만 설치된 상태이고, `@capacitor/cli`·`@capacitor/android`, `capacitor.config`, `android/` 폴더는 아직 없습니다. 그래서 휴대폰 터치(포인터 이벤트, `touch-none`), 좁은 화면(400px 폭에서 가로 스크롤 없음), 호버가 없는 기기(호버 효과는 `@media (hover: hover)` 안에만)를 항상 고려해야 합니다. 사용자는 쉽고 일상적인 말투의 설명을 선호합니다.

## 명령어

```
npm install
npm run dev      # Express + Vite 개발 서버(HMR), PORT(기본 5000)에서 API와 클라이언트를 함께 제공
npm run build    # vite build -> dist/public, esbuild server/index.ts -> dist/index.js
npm start        # 프로덕션 빌드 실행
npm run check    # tsc 타입 검사 (유일한 정적 검사이며 린터와 테스트는 없음)
npm run db:push  # drizzle-kit push, DATABASE_URL 필요
```

Windows 참고: `dev`/`start` 스크립트는 `cross-env`로 `NODE_ENV`를 설정하므로 Windows에서도 동작합니다. `server/index.ts`의 `reusePort`는 Windows에서 지원되지 않아 `win32`가 아닐 때만 켜집니다.

## 아키텍처

단일 Node 프로세스로 동작합니다. `server/index.ts`가 Express 앱을 만들고 `/api` 라우트(`server/routes.ts`)를 등록한 뒤, 개발 모드에서는 Vite를 미들웨어로 붙이고(`server/vite.ts`), 프로덕션에서는 `dist/public`을 정적 파일로 제공하며 SPA 캐치올 라우트를 둡니다. 캐치올이 API 라우트를 가리지 않도록 Vite 설정은 반드시 마지막에 등록해야 합니다.

이 앱은 사실상 **클라이언트 전용**입니다. 백엔드는 Replit 템플릿 그대로입니다. `registerRoutes`에는 정의된 라우트가 없고, `server/storage.ts`는 `shared/schema.ts`(Drizzle + drizzle-zod)에 정의된 `users` 테이블용 메모리 저장소 `MemStorage`일 뿐이며, passport/session 패키지는 설치만 되어 있고 쓰이지 않습니다. 클라이언트에서 API를 호출하는 곳도 없습니다(`App.tsx`의 `QueryClientProvider`와 `lib/queryClient.ts`도 템플릿에서 남은 것이고, 실제 쿼리는 없습니다).

클라이언트(`client/src`, Vite 루트는 `client/`):
- 경로 별칭: `@/` → `client/src`, `@shared/` → `shared`, `@assets/` → `attached_assets`. `@/`와 `@shared/`는 `vite.config.ts`와 `tsconfig.json` 양쪽에 있지만, `@assets/`는 `vite.config.ts`에만 있고 `attached_assets/` 폴더도 현재 없습니다(쓰려면 `tsconfig.json`에도 추가해야 타입 검사가 통과합니다).
- 라우팅은 `App.tsx`에서 `wouter`로 처리하며, 실제 페이지는 `pages/home.tsx` 하나뿐입니다.
- `components/ui/`는 shadcn/ui로 생성된 코드입니다(`components.json`에서 설정). 앱 고유 컴포넌트는 `analog-clock.tsx`, `voice-control.tsx`, `time-calculations.tsx`입니다.
- 상태 흐름: `home.tsx`가 `is24Hour`를 관리하고, `hooks/use-clock.ts`에서 `currentTime`/`manualTime`을 받습니다. 화면에 표시되는 시간은 `manualTime || currentTime`입니다. `AnalogClock`에서 바늘을 드래그하면 `onTimeChange` → `setManualTime`이 호출되고, "현재 시각으로 돌아가기" 버튼을 누르면 초기화됩니다.
- 음성: `hooks/use-speech.ts`는 `@capacitor-community/text-to-speech`를 씁니다. 앱에서는 기기의 TTS를, 브라우저에서는 Web Speech API를 자동으로 사용합니다(`ko-KR`). `requestId` ref를 두어 가장 마지막에 요청한 음성만 `isSpeaking`을 끄도록 합니다.
- `analog-clock.tsx`는 캔버스에 그립니다(384 논리 픽셀, devicePixelRatio 배율). 바늘 길이·색·두께는 `HANDS` 상수에 모여 있습니다. 포인터를 누르면 선분까지의 거리가 가장 가까운 바늘을 고르고(`HIT_DISTANCE`), `setPointerCapture`로 드래그를 잡습니다. 각도는 칸 번호로 바꾼 뒤 **현재 값과의 차이(±반 바퀴 이내)를 기존 시각에 더합니다.** 그래서 분침이 12를 지나면 시가 넘어가고 날짜도 바르게 바뀝니다. 시·분·초를 직접 덮어쓰는 방식으로 되돌리지 마세요. 캔버스 글꼴은 `document.fonts.ready` 이후에 다시 그립니다.
- 글꼴: Pretendard를 npm 패키지로 번들링합니다(`main.tsx`에서 import, `--font-sans`). 외부 폰트 CDN은 쓰지 않습니다.
- 한국어 시간 읽기: "시"는 고유어 수 관형사(한/두/세… 시), "분·초"는 한자어 수(일/이/삼… 분)를 씁니다. 24시간 모드에서 13시 이상은 한자어 수로 바뀝니다. **이 로직은 중복되어 있습니다.** `lib/time-utils.ts`(`formatTimeToKorean`, `convertNumberToKorean`, `convertHourToKoreanOrdinal`)와 `pages/home.tsx` 내부에 같은 코드가 있고, `home.tsx`는 자체 `formatTimeKorean`을 props로 하위 컴포넌트에 넘깁니다. 실제로 화면과 음성에 쓰이는 것은 `home.tsx` 쪽이고, `time-utils.ts`의 한국어 함수들은 어디서도 import되지 않습니다(`time-utils.ts`에서 쓰이는 것은 `time-calculations.tsx`가 가져가는 `calculateTimeDifference`뿐). 읽기 규칙을 바꿀 때는 두 곳을 함께 수정하거나 하나로 합치세요.
- `isSpeaking`이 두 개 있습니다. `use-speech.ts`의 것은 실제로 동작하며 `VoiceControl` 버튼에 쓰입니다. `use-clock.ts`의 것은 음성 이벤트 리스너가 비어 있어서 `true`가 되지 않습니다. 그런데 `home.tsx`는 `use-clock` 쪽 값을 `AnalogClock`에 넘기므로, "말하는 동안 초침 숨기기"와 시계 일시정지는 지금 실제로는 일어나지 않습니다.
