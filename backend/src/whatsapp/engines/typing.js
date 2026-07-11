// Anti-detection: Simulate human typing with bursts and pauses
export function buildTypeCommand(text) {
  const charsPerBurst = { min: 5, max: 15 };
  const msPerChar = { min: 150, max: 350 };
  const pauseBetweenBurst = { min: 500, max: 2000 };
  const backspaceChance = 0.10;

  const bursts = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    const burstSize = Math.min(
      randInt(charsPerBurst.min, charsPerBurst.max),
      remaining.length
    );
    const burst = remaining.slice(0, burstSize);
    remaining = remaining.slice(burstSize);
    
    // Maybe add a fake backspace
    if (Math.random() < backspaceChance && burst.length > 3) {
      bursts.push({
        type: 'type',
        chars: burst,
        delayMs: Math.round(burst.length * randInt(msPerChar.min, msPerChar.max)),
      });
      bursts.push({
        type: 'backspace',
        count: randInt(1, 3),
        delayMs: randInt(200, 500),
      });
      bursts.push({
        type: 'type',
        chars: burst.slice(-(burst.length - randInt(1, 3))),
        delayMs: Math.round(burst.length * randInt(msPerChar.min, msPerChar.max) * 0.7),
      });
    } else {
      bursts.push({
        type: 'type',
        chars: burst,
        delayMs: Math.round(burst.length * randInt(msPerChar.min, msPerChar.max)),
      });
    }
    
    if (remaining.length > 0) {
      bursts.push({
        type: 'pause',
        delayMs: randInt(pauseBetweenBurst.min, pauseBetweenBurst.max),
      });
    }
  }

  const totalDelay = bursts.reduce((sum, b) => sum + (b.delayMs || 0), 0);
  return { text, bursts, totalDelayMs: totalDelay };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
