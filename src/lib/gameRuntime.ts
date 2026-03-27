export interface RuntimeState {
  participantGiftChoices: Record<string, string>;
  amigoAutoDrawDisabledAfterReset: boolean;
  bingoGifts: string[];
  bingoStarted: boolean;
  bingoNumbersDrawn: number[];
  bingoAvailableNumbers: number[];
  bingoWinners: Array<{ participantId: string; gift: string }>;
  bingoFinished: boolean;
  roubaNumbers: Record<string, number>;
  roubaStarted: boolean;
  roubaGifts: Array<{ id: string; name: string; holderId: string; steals: number; locked: boolean }>;
  roubaFinished: boolean;
  startedAt: string | null;
  finishedAt: string | null;
}

export const createInitialRuntimeState = (): RuntimeState => ({
  participantGiftChoices: {},
  amigoAutoDrawDisabledAfterReset: false,
  bingoGifts: [],
  bingoStarted: false,
  bingoNumbersDrawn: [],
  bingoAvailableNumbers: Array.from({ length: 75 }, (_, i) => i + 1),
  bingoWinners: [],
  bingoFinished: false,
  roubaNumbers: {},
  roubaStarted: false,
  roubaGifts: [],
  roubaFinished: false,
  startedAt: null,
  finishedAt: null,
});

export function getRuntimeStorageKey(gameId: string) {
  return `game-runtime-${gameId}`;
}

export function loadRuntimeState(gameId: string): RuntimeState {
  const raw = localStorage.getItem(getRuntimeStorageKey(gameId));
  if (!raw) return createInitialRuntimeState();
  try {
    return { ...createInitialRuntimeState(), ...JSON.parse(raw) };
  } catch {
    return createInitialRuntimeState();
  }
}

export function saveRuntimeState(gameId: string, state: RuntimeState) {
  localStorage.setItem(getRuntimeStorageKey(gameId), JSON.stringify(state));
}
