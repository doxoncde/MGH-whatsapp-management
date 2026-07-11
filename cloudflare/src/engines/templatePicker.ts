// Multi-variant message template picker
// Ported from backend/src/whatsapp/engines/templatePicker.js
// Adapted for DO storage persistence (survives hibernation)

const menuVariants = [
  "🌴 *Welcome to MGH Resort!*\n\nHow can we help you today?\n\n1️⃣ View our Brochure\n2️⃣ Watch Resort Videos\n3️⃣ Both\n\nReply with *1*, *2*, or *3*.",
  "Hello! Welcome to MGH Resort 🌊\n\nWhat would you like to see?\n\nReply 1 - Brochure | 2 - Videos | 3 - Both",
  "Hi there! 👋 Thanks for reaching out to MGH Resort.\n\nHere's what we can share:\n📄 1 - Our Brochure\n🎥 2 - Property Videos\n📦 3 - Both",
  "Namaste! 🪷 Welcome to MGH Resort.\n\nChoose an option below:\n1️⃣ Brochure  2️⃣ Videos  3️⃣ Everything",
  "Welcome! ✨ Discover MGH Resort:\n1. Brochure 📄\n2. Videos 🎬\n3. Both 📦\n\nJust reply with the number!",
];

const brochureVariants = [
  "📄 Here's our resort brochure. Let us know if you'd like to see our videos too! Reply *2*.",
  "📄 Enjoy browsing our brochure! Want to see the property in action? Reply *2* for videos.",
  "Here's our brochure! 📄 Feel free to ask for videos — just reply *2*.",
  "📄 Brochure attached! See something you like? Reply *2* for video walkthroughs.",
];

const videoVariants = [
  "🎥 Here are videos of our resort. Enjoy! Reply *1* for the brochure.",
  "🎬 Resort videos coming up! Want the brochure too? Reply *1*.",
  "Here are our resort videos! 🎥 Curious about details? Brochure at *1*.",
  "🎥 Take a tour! Our brochure also available — just reply *1*.",
];

const bothVariants = [
  "📄🎥 Here's everything — brochure and videos! Let us know if you have any questions.",
  "You got it! Brochure 📄 + Videos 🎥 on the way. Need anything else?",
  "Sending you the full MGH experience! 📄🎥 Questions? We're here!",
];

const invalidVariants = [
  "Please reply with *1* (Brochure), *2* (Videos), or *3* (Both).",
  "I didn't quite catch that — could you reply with 1, 2, or 3?",
  "Just pick a number: 1️⃣ Brochure, 2️⃣ Videos, or 3️⃣ Both!",
];

export type TemplateCategory = 'menu' | 'brochure' | 'video' | 'both' | 'invalid';

// Get template storage keys
function storageKey(category: TemplateCategory): string {
  return `template:${category}:index`;
}

// Pick next template with DO storage persistence
export async function pickTemplate(
  category: TemplateCategory,
  storage: DurableObjectStorage
): Promise<string> {
  const variants = getVariants(category);
  const key = storageKey(category);

  let lastIndex: number = (await storage.get(key)) as number ?? -1;

  // Avoid consecutive repeats
  let next = Math.floor(Math.random() * variants.length);
  if (next === lastIndex && variants.length > 2) {
    next = (next + 1 + Math.floor(Math.random() * (variants.length - 1))) % variants.length;
  }

  // Persist for next hibernation cycle
  await storage.put(key, next);

  return variants[next];
}

function getVariants(category: TemplateCategory): string[] {
  switch (category) {
    case 'menu': return menuVariants;
    case 'brochure': return brochureVariants;
    case 'video': return videoVariants;
    case 'both': return bothVariants;
    case 'invalid': return invalidVariants;
    default: return menuVariants;
  }
}

// Convenience functions
export async function pickMenu(storage: DurableObjectStorage): Promise<string> {
  return pickTemplate('menu', storage);
}

export async function pickBrochure(storage: DurableObjectStorage): Promise<string> {
  return pickTemplate('brochure', storage);
}

export async function pickVideos(storage: DurableObjectStorage): Promise<string> {
  return pickTemplate('video', storage);
}

export async function pickBoth(storage: DurableObjectStorage): Promise<string> {
  return pickTemplate('both', storage);
}

export async function pickInvalid(storage: DurableObjectStorage): Promise<string> {
  return pickTemplate('invalid', storage);
}
