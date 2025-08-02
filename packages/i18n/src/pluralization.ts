/**
 * Pluralization rules for different languages
 */
export const pluralizationRules: Record<string, (count: number) => number> = {
  // English and most Germanic languages (singular/plural)
  en: (count: number) => count === 1 ? 0 : 1,
  de: (count: number) => count === 1 ? 0 : 1,
  nl: (count: number) => count === 1 ? 0 : 1,
  da: (count: number) => count === 1 ? 0 : 1,
  sv: (count: number) => count === 1 ? 0 : 1,
  no: (count: number) => count === 1 ? 0 : 1,
  
  // Romance languages (French, Spanish, Italian, Portuguese)
  fr: (count: number) => count <= 1 ? 0 : 1,
  es: (count: number) => count === 1 ? 0 : 1,
  it: (count: number) => count === 1 ? 0 : 1,
  pt: (count: number) => count === 1 ? 0 : 1,
  ca: (count: number) => count === 1 ? 0 : 1,
  
  // Slavic languages with complex rules
  ru: (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    
    if (mod10 === 1 && mod100 !== 11) return 0;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 1;
    return 2;
  },
  
  uk: (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    
    if (mod10 === 1 && mod100 !== 11) return 0;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 1;
    return 2;
  },
  
  pl: (count: number) => {
    if (count === 1) return 0;
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 1;
    return 2;
  },
  
  cs: (count: number) => {
    if (count === 1) return 0;
    if (count >= 2 && count <= 4) return 1;
    return 2;
  },
  
  sk: (count: number) => {
    if (count === 1) return 0;
    if (count >= 2 && count <= 4) return 1;
    return 2;
  },
  
  // Arabic
  ar: (count: number) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count % 100 >= 3 && count % 100 <= 10) return 3;
    if (count % 100 >= 11) return 4;
    return 5;
  },
  
  // Chinese, Japanese, Korean (no pluralization)
  zh: () => 0,
  ja: () => 0,
  ko: () => 0,
  vi: () => 0,
  th: () => 0,
  
  // Turkish
  tr: (count: number) => count > 1 ? 1 : 0,
  
  // Finnish
  fi: (count: number) => count === 1 ? 0 : 1,
  
  // Hungarian
  hu: (count: number) => count === 1 ? 0 : 1,
  
  // Hebrew
  he: (count: number) => {
    if (count === 1) return 0;
    if (count === 2) return 1;
    if (count % 10 === 0 && count !== 0) return 2;
    return 3;
  },
  
  // Romanian
  ro: (count: number) => {
    if (count === 1) return 0;
    if (count === 0 || (count % 100 > 0 && count % 100 < 20)) return 1;
    return 2;
  },
  
  // Lithuanian
  lt: (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    
    if (mod10 === 1 && mod100 !== 11) return 0;
    if (mod10 >= 2 && (mod100 < 10 || mod100 >= 20)) return 1;
    return 2;
  },
  
  // Latvian
  lv: (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) return 0;
    if (count !== 0) return 1;
    return 2;
  },
  
  // Macedonian
  mk: (count: number) => {
    if (count % 10 === 1 && count !== 11) return 0;
    return 1;
  },
  
  // Maltese
  mt: (count: number) => {
    if (count === 1) return 0;
    if (count === 0 || (count % 100 > 1 && count % 100 < 11)) return 1;
    if (count % 100 > 10 && count % 100 < 20) return 2;
    return 3;
  },
  
  // Icelandic
  is: (count: number) => {
    return (count % 10 !== 1 || count % 100 === 11) ? 1 : 0;
  },
  
  // Welsh
  cy: (count: number) => {
    if (count === 1) return 0;
    if (count === 2) return 1;
    if (count !== 8 && count !== 11) return 2;
    return 3;
  },
  
  // Irish
  ga: (count: number) => {
    if (count === 1) return 0;
    if (count === 2) return 1;
    if (count < 7) return 2;
    if (count < 11) return 3;
    return 4;
  },
  
  // Scottish Gaelic
  gd: (count: number) => {
    if (count === 1 || count === 11) return 0;
    if (count === 2 || count === 12) return 1;
    if (count > 2 && count < 20) return 2;
    return 3;
  },
  
  // Breton
  br: (count: number) => {
    if (count % 10 === 1 && ![11, 71, 91].includes(count)) return 0;
    if (count % 10 === 2 && ![12, 72, 92].includes(count)) return 1;
    if ([3, 4, 9].includes(count % 10) && ![13, 14, 19, 73, 74, 79, 93, 94, 99].includes(count)) return 2;
    if (count !== 0 && count % 1000000 === 0) return 3;
    return 4;
  }
};

/**
 * Get pluralization rule for a locale
 */
export function getPluralizationRule(locale: string): (count: number) => number {
  const normalizedLocale = locale.toLowerCase().split('-')[0];
  return pluralizationRules[normalizedLocale] || pluralizationRules.en;
}

/**
 * Get plural form index for a count and locale
 */
export function getPluralForm(count: number, locale: string): number {
  const rule = getPluralizationRule(locale);
  return rule(count);
}

/**
 * Check if locale has pluralization rules
 */
export function hasPluralizationRules(locale: string): boolean {
  const normalizedLocale = locale.toLowerCase().split('-')[0];
  return normalizedLocale in pluralizationRules;
}