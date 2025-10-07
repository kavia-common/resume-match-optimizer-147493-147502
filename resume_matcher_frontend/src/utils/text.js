//
// Text analysis utilities for local, client-side insights.
// Provides word count, keyword frequency, simple readability estimate,
// and keyword highlighting for resume texts.
//
/**
 * Normalize whitespace and strip extra spaces.
 * @param {string} s
 * @returns {string}
 */
function normalizeWhitespace(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

/**
 * Split text into words (alphanumeric tokens). Keeps case-insensitive tokens.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  const t = String(text || '');
  // Match words containing letters, numbers, + and # (to keep C++, C#, etc.)
  const tokens = t.match(/[A-Za-z0-9+#]+/g);
  return tokens ? tokens : [];
}

/**
 * PUBLIC_INTERFACE
 * computeWordCount - Count total words in a block of text.
 * @param {string} text
 * @returns {number}
 */
export function computeWordCount(text) {
  const tokens = tokenize(text);
  return tokens.length;
}

/**
 * PUBLIC_INTERFACE
 * computeSentenceCount - Naive sentence count using punctuation separators.
 * @param {string} text
 * @returns {number}
 */
export function computeSentenceCount(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  // Split by ., !, ? while avoiding multiple delimiters counting as multiple sentences
  const parts = t.split(/(?<=[.!?])\s+/g).filter(Boolean);
  return parts.length;
}

/**
 * PUBLIC_INTERFACE
 * computeSyllableCount - Heuristic syllable count for readability approximation.
 * Not perfect; aims for relative comparisons.
 * @param {string} word
 * @returns {number}
 */
export function computeSyllableCount(word) {
  const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  // Vowels groups count as syllables
  let syllables = 0;
  const vowels = 'aeiouy';
  let prevIsVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevIsVowel) syllables++;
    prevIsVowel = isVowel;
  }
  // Trailing 'e' often silent
  if (w.endsWith('e') && syllables > 1) syllables--;
  // Ensure at least 1
  return Math.max(1, syllables);
}

/**
 * PUBLIC_INTERFACE
 * estimateReadability - Rough Flesch-Kincaid-like grade estimate.
 * Returns an integer "grade" bucket for UX.
 * @param {string} text
 * @returns {{ grade: number, sentences: number, words: number, syllables: number }}
 */
export function estimateReadability(text) {
  const wordsArr = tokenize(text);
  const words = wordsArr.length;
  const sentences = computeSentenceCount(text) || 1; // avoid div by zero
  const syllables = wordsArr.reduce((sum, w) => sum + computeSyllableCount(w), 0);

  // Flesch-Kincaid Grade Level approximation:
  // 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
  const gradeRaw =
    0.39 * (words / sentences) + 11.8 * (syllables / Math.max(1, words)) - 15.59;
  const grade = Math.max(0, Math.round(gradeRaw));
  return { grade, sentences, words, syllables };
}

/**
 * PUBLIC_INTERFACE
 * countKeywordFrequency - Count frequency of provided keywords in text (case-insensitive).
 * Accepts array of keyword strings; will treat each as a term (not regex).
 * @param {string} text
 * @param {string[]} keywords
 * @returns {{ totalMentions: number, breakdown: Record<string, number> }}
 */
export function countKeywordFrequency(text, keywords = []) {
  const tokens = tokenize(text).map((t) => t.toLowerCase());
  const freq = {};
  let total = 0;

  keywords
    .map((k) => String(k || '').trim().toLowerCase())
    .filter(Boolean)
    .forEach((kw) => {
      const count = tokens.reduce((sum, t) => sum + (t === kw ? 1 : 0), 0);
      freq[kw] = count;
      total += count;
    });

  return { totalMentions: total, breakdown: freq };
}

/**
 * Escape regex special chars in a string.
 * @param {string} s
 * @returns {string}
 */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * PUBLIC_INTERFACE
 * highlightKeywordsHtml - Returns HTML string with matched keywords wrapped in <mark>.
 * Case-insensitive. Safe for simple highlighting (does not sanitize input).
 * Caller must render via dangerouslySetInnerHTML in a trusted context.
 *
 * @param {string} text
 * @param {string[]} keywords
 * @returns {string} HTML string
 */
export function highlightKeywordsHtml(text, keywords = []) {
  const src = String(text || '');
  const terms = keywords
    .map((k) => String(k || '').trim())
    .filter(Boolean);

  if (terms.length === 0 || !src) return src;

  // Build a regex union of escaped words. Use word boundaries where possible.
  const pattern = terms.map((t) => escapeRegExp(t)).join('|');
  const re = new RegExp(`\\b(${pattern})\\b`, 'gi');

  // Replace matches with a <mark>
  return src.replace(re, (m) => `<mark class="kw">${m}</mark>`);
}

/**
 * PUBLIC_INTERFACE
 * summarizeText - Produce a local text insights summary: word count, readability, and top tokens.
 * @param {string} text
 * @param {string[]} [seedKeywords] - Optional keywords of interest
 * @returns {{
 *   wordCount: number,
 *   readability: { grade: number, sentences: number, words: number, syllables: number },
 *   keywordFrequency: { totalMentions: number, breakdown: Record<string, number> },
 *   topTokens: Array<{ token: string, count: number }>
 * }}
 */
export function summarizeText(text, seedKeywords = []) {
  const wordCount = computeWordCount(text);
  const readability = estimateReadability(text);
  const keywordFrequency = countKeywordFrequency(text, seedKeywords);

  // Simple frequency of all tokens (lowercased), excluding short tokens
  const tokens = tokenize(text).map((t) => t.toLowerCase());
  const map = new Map();
  tokens.forEach((t) => {
    if (t.length < 3) return;
    map.set(t, (map.get(t) || 0) + 1);
  });
  const topTokens = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([token, count]) => ({ token, count }));

  return { wordCount, readability, keywordFrequency, topTokens };
}

export default {
  tokenize,
  computeWordCount,
  computeSentenceCount,
  computeSyllableCount,
  estimateReadability,
  countKeywordFrequency,
  highlightKeywordsHtml,
  summarizeText,
  normalizeWhitespace,
};
