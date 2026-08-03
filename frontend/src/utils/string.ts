import { applicationLocale } from "#config";

export function stringCompare(a: string, b: string) {
  return a.localeCompare(b, applicationLocale);
}

/**
 * Creates a comma-separated text of the given words, with the word "and" used before
 * the last word.
 * @param words The words to enumerate.
 * @returns The formatted text, or an empty string when no words are given.
 */
export function enumerateWords(words: string[]) {
  return words.length > 1
    ? [words.slice(0, -1).join(", "), words.at(-1)].join(" and ")
    : (words[0] ?? "");
}

export function isVersionLessThan(version: string, minimum: string) {
  const v1Parts = version.split(".").map(Number);
  const v2Parts = minimum.split(".").map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1 = v1Parts[i] ?? 0;
    const v2 = v2Parts[i] ?? 0;
    if (v1 < v2) return true;
    if (v1 > v2) return false;
  }

  return false;
}
