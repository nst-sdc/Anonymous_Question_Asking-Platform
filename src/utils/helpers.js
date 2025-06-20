const profanityList = [
  // English Slurs & Vulgar
  'fuck', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'piss',
  'cock', 'cunt', 'pussy', 'motherfucker', 'slut', 'whore', 'twat',
  'stupid', 'idiot', 'dumb', 'loser', 'suck', 'crap', 'shut up', 'moron',
  'kill yourself', 'die', 'go to hell', 'hang yourself',

  // Hate Speech / Racism
  'nigga', 'nigger', 'fag', 'faggot', 'retard', 'tranny', 'dyke', 'homo', 'queer',
  'chink', 'spic', 'kike', 'raghead', 'terrorist',

  // Hindi Abuse (Roman Hindi)
  'bhosdi', 'bhosdike', 'madarchod', 'behenchod', 'chutiya', 'chutiye', 'gandu',
  'lund', 'gaand', 'bhenchod', 'mc', 'bc', 'randi', 'chinal', 'kamina', 'harami',
  'kutte', 'kaminey', 'gaand mara', 'chodu', 'lavde', 'launde', 'chod', 'gandfat',
  'jhant', 'jhatu', 'jhantichat', 'lodu', 'tatti', 'madharchod', 'chut', 'chodna',
  'jhaatu', 'jhaant', 'jhantichod', 'teri maa', 'teri behen', 'gand', 'gandmara',
  'kutti', 'kutta', 'launda', 'gand mein', 'bhen ke', 'maa ke', 'lode', 'lund le',
];

// 😎 Quirky dev-themed anonymous usernames
const anonymousNames = [
  'Codezilla', 'BugHunter', 'NullNinja', 'PixelMage', 'SyntaxSage',
  'LoopLord', 'BitBandit', 'StackSamurai', 'Hackonaut', 'CryptoCat',
  'SnappyDev', 'JSJuggler', 'NullPointer', 'ByteRider', 'AsyncAlien',
  '404Genius', 'CaffeinatedCoder', 'ReactRogue', 'NodeNerd', 'DevDruid',
  'CommitKing', 'LintLegend', 'GitGoblin', 'VimViper', 'TerminalTiger'
];

// 👻 Generate Anonymous Name like: "Codezilla 238"
export const generateAnonymousName = () => {
  const name = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${name} ${number}`;
};

// Profanity Checker that cleans the msg.
export const checkProfanity = (text) => {
  const cleanText = text.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '');
  return profanityList.some(word => cleanText.includes(word));
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getTimeRemaining = (futureDate) => {
  const now = new Date();
  const diff = new Date(futureDate).getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};
