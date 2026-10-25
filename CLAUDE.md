# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)를 위한 안내서입니다.

## 프로젝트

"시계 배우기": 어린이를 위한 한국어 시계 학습 웹 앱입니다. 아날로그 시계의 바늘을 드래그하고, 브라우저 Web Speech API로 시간을 한국어 음성으로 듣고, 12/24시간 표시를 전환하고, 남은 시간과 지난 시간을 계산할 수 있습니다. 원래 Replit에서 만들어졌습니다(`replit.md`, `.replit` 참고). 사용자는 쉽고 일상적인 말투의 설명을 선호합니다.

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

이 앱은 사실상 **클라이언트 전용**입니다. 백엔드는 Replit 템플릿 그대로입니다. `registerRoutes`에는 정의된 라우트가 없고, `server/storage.ts`는 `shared/schema.ts`(Drizzle + drizzle-zod)에 정의된 `users` 테이블용 메모리 저장소 `MemStorage`일 뿐이며, passport/session 패키지는 설치만 되어 있고 쓰이지 않습니다. 클라이언트에서 API를 호출하는 곳도 없습니다.

클라이언트(`client/src`, Vite 루트는 `client/`):
- 경로 별칭: `@/` → `client/src`, `@shared/` → `shared`, `@assets/` → `attached_assets` (`vite.config.ts`와 `tsconfig.json` 양쪽에 정의).
- 라우팅은 `App.tsx`에서 `wouter`로 처리하며, 실제 페이지는 `pages/home.tsx` 하나뿐입니다.
- `components/ui/`는 shadcn/ui로 생성된 코드입니다(`components.json`에서 설정). 앱 고유 컴포넌트는 `analog-clock.tsx`, `voice-control.tsx`, `time-calculations.tsx`입니다.
- 상태 흐름: `home.tsx`가 `is24Hour`를 관리하고, `hooks/use-clock.ts`에서 `currentTime`/`manualTime`을 받습니다. 화면에 표시되는 시간은 `manualTime || currentTime`입니다. `AnalogClock`에서 바늘을 드래그하면 `onTimeChange` → `setManualTime`이 호출되고, "현재 시각으로 돌아가기" 버튼을 누르면 초기화됩니다. `hooks/use-speech.ts`는 `speechSynthesis`를 `lang = 'ko-KR'`로 감싼 훅입니다.
- 한국어 시간 읽기: "시"는 고유어 수 관형사(한/두/세… 시), "분·초"는 한자어 수(일/이/삼… 분)를 씁니다. 24시간 모드에서 13시 이상은 한자어 수로 바뀝니다. **이 로직은 중복되어 있습니다.** `lib/time-utils.ts`(`formatTimeToKorean`, `convertNumberToKorean`, `convertHourToKoreanOrdinal`)와 `pages/home.tsx` 내부에 같은 코드가 있고, `home.tsx`는 자체 `formatTimeKorean`을 props로 하위 컴포넌트에 넘깁니다. 읽기 규칙을 바꿀 때는 두 곳을 함께 수정하거나 하나로 합치세요.
- `use-clock.ts`에는 `isSpeaking` 일시정지 기능이 있지만 음성 이벤트 리스너가 비어 있어서 실제로는 `true`가 되지 않습니다.
