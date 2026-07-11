// Multi-variant message template picker
const menuVariants = [
  "🌴 *Welcome to MGH Resort!*\n\nHow can we help you today?\n\n1️⃣  View our Brochure\n2️⃣  Watch Resort Videos\n3️⃣  Both\n\nReply with *1*, *2*, or *3*.",
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

let menuIndex = -1, brochureIndex = -1, videoIndex = -1, bothIndex = -1, invalidIndex = -1;

function pickNext(arr, lastIndexRef) {
  let next = Math.floor(Math.random() * arr.length);
  // Avoid repeating the same variant more than once consecutively
  if (next === lastIndexRef && arr.length > 2) {
    next = (next + 1 + Math.floor(Math.random() * (arr.length - 1))) % arr.length;
  }
  lastIndexRef = next;
  return arr[next];
}

export function pickMenu() { menuIndex = (menuIndex + 1 + Math.floor(Math.random() * (menuVariants.length - 1))) % menuVariants.length; return menuVariants[menuIndex]; }
export function pickBrochure() { brochureIndex = (brochureIndex + 1 + Math.floor(Math.random() * (brochureVariants.length - 1))) % brochureVariants.length; return brochureVariants[brochureIndex]; }
export function pickVideos() { videoIndex = (videoIndex + 1 + Math.floor(Math.random() * (videoVariants.length - 1))) % videoVariants.length; return videoVariants[videoIndex]; }
export function pickBoth() { bothIndex = (bothIndex + 1 + Math.floor(Math.random() * (bothVariants.length - 1))) % bothVariants.length; return bothVariants[bothIndex]; }
export function pickInvalid() { invalidIndex = (invalidIndex + 1 + Math.floor(Math.random() * (invalidVariants.length - 1))) % invalidVariants.length; return invalidVariants[invalidIndex]; }
