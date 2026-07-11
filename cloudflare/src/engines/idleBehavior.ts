// Anti-detection: Random idle behaviors before replying
// Ported from backend/src/whatsapp/engines/idleBehavior.js
// DO handles decision, phone handles execution

const behaviors: Record<string, number> = {
  scrollUp: 0.30,
  viewContact: 0.15,
  highlightMessage: 0.10,
  fakeTypeDelete: 0.05,
  switchChat: 0.05,
  switchApp: 0.03,
  noBehavior: 0.02,
  normalReply: 0.30,
};

export type BehaviorCommand = {
  action: string;
  payload: Record<string, any>;
};

export function selectBehavior(): string {
  const rand = Math.random();
  let cumulative = 0;

  for (const [behavior, probability] of Object.entries(behaviors)) {
    cumulative += probability;
    if (rand <= cumulative) return behavior;
  }

  return 'normalReply';
}

export function getBehaviorCommands(behavior: string): BehaviorCommand[] {
  switch (behavior) {
    case 'scrollUp':
      return [{ action: 'swipe', payload: { x1: 540, y1: 1500, x2: 540, y2: 500, duration: 300 } }];
    case 'viewContact':
      return [{ action: 'tap', payload: { x: 540, y: 200 } }];
    case 'highlightMessage':
      return [{ action: 'tap', payload: { x: 400, y: 1200 } }];
    case 'fakeTypeDelete':
      return [{ action: 'type', payload: { text: 'ummm', charDelay: { min: 50, max: 100 }, burstSize: { min: 3, max: 5 } } }];
    case 'switchChat':
      return [{ action: 'keyevent', payload: { key: 'BACK' } }];
    case 'switchApp':
      return [{ action: 'keyevent', payload: { key: 'HOME' } }];
    default:
      return [];
  }
}
