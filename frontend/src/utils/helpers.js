// Messages containing these words will be automatically deleted
const prohibitedTerms = [
  // Self-harm and suicide
  'kill myself', 'suicide', 'end my life', 'want to die', 'end it all',
  'cut myself', 'self-harm', 'self harm', 'hang myself', 'jump off',
  'overdose', 'od on', 'swallow pills', 'cutting myself',
  
  // Violence and threats
  'kill you', 'hurt you', 'shoot up', 'bomb', 'terrorist', 'shoot you',
  'stab you', 'attack you', 'beat you', 'hit you', 'punch you',
  
  // Extremely offensive content
  'nigger', 'faggot', 'chink', 'spic', 'kike', 'raghead',
  'pedo', 'pedophile', 'child porn', 'cp', 'loli', 'shota',
  
  // Doxing and personal info
  'my address is', 'phone number', 'social security', 'ssn', 'credit card',
  'bank account', 'home address', 'personal info', 'private info'
];

// Messages containing these words will be blocked and user will be warned
const warningTerms = [
  // English Slurs & Vulgar
  'fuck', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'piss',
  'cock', 'cunt', 'pussy', 'motherfucker', 'slut', 'whore', 'twat',
  'stupid', 'idiot', 'dumb', 'loser', 'suck', 'crap', 'shut up', 'moron',
  'kill yourself', 'die', 'go to hell', 'hang yourself',

  // Hate Speech / Racism
  'nigga', 'fag', 'retard', 'tranny', 'dyke', 'homo', 'queer',
  
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

/**
 * Check if message contains prohibited or warning terms
 * @param {string} text - The message text to check
 * @returns {Object} - Returns { isProhibited: boolean, isWarning: boolean }
 */
export const checkProfanity = (text) => {
  const cleanText = text.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ' ');
  
  // Check for prohibited terms (auto-delete)
  const hasProhibited = prohibitedTerms.some(term => {
    // Match whole words only to avoid false positives
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(text);
  });
  
  // Check for warning terms (warn user)
  const hasWarning = !hasProhibited && warningTerms.some(term => {
    // Match whole words only to avoid false positives
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(text);
  });
  
  return {
    isProhibited: hasProhibited,
    isWarning: hasWarning
  };
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
