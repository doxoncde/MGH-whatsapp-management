// Anti-detection: Random delay engine with Gaussian distribution
export function calculateDelay(type = 'short') {
  const ranges = {
    short: { min: 2000, max: 8000, mean: 4000, stdDev: 1500 },
    medium: { min: 8000, max: 25000, mean: 14000, stdDev: 5000 },
    long: { min: 15000, max: 45000, mean: 25000, stdDev: 8000 },
  };
  
  const range = ranges[type] || ranges.short;
  let delay = gaussianRandom(range.mean, range.stdDev);
  delay = Math.max(range.min, Math.min(range.max, delay));
  return Math.round(delay);
}

function gaussianRandom(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
