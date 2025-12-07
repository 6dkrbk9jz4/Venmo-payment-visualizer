export interface AliasMapping {
  canonical: string;
  aliases: string[];
}

export function normalizeNameForMatching(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export function findSimilarNames(
  people: string[],
  threshold: number = 0.8
): Array<{ names: string[]; suggested: string }> {
  const groups: Array<{ names: string[]; suggested: string }> = [];
  const used = new Set<string>();

  for (let i = 0; i < people.length; i++) {
    if (used.has(people[i])) continue;

    const similar: string[] = [people[i]];
    const normalized1 = normalizeNameForMatching(people[i]);

    for (let j = i + 1; j < people.length; j++) {
      if (used.has(people[j])) continue;

      const normalized2 = normalizeNameForMatching(people[j]);

      if (normalized1 === normalized2) {
        similar.push(people[j]);
        used.add(people[j]);
      } else if (areSimilar(normalized1, normalized2, threshold)) {
        similar.push(people[j]);
        used.add(people[j]);
      }
    }

    if (similar.length > 1) {
      used.add(people[i]);
      groups.push({
        names: similar.sort(),
        suggested: selectCanonicalName(similar),
      });
    }
  }

  return groups;
}

function areSimilar(a: string, b: string, threshold: number): boolean {
  if (a === b) return true;

  const aParts = a.split(" ").filter(Boolean);
  const bParts = b.split(" ").filter(Boolean);

  if (aParts.length === bParts.length) {
    let matches = 0;
    for (let i = 0; i < aParts.length; i++) {
      if (aParts[i] === bParts[i] || levenshteinSimilarity(aParts[i], bParts[i]) > threshold) {
        matches++;
      }
    }
    if (matches === aParts.length) return true;
  }

  return levenshteinSimilarity(a, b) >= threshold;
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

function selectCanonicalName(names: string[]): string {
  return names.reduce((best, name) => {
    const bestHasProperCase = /[A-Z]/.test(best) && /[a-z]/.test(best);
    const nameHasProperCase = /[A-Z]/.test(name) && /[a-z]/.test(name);

    if (nameHasProperCase && !bestHasProperCase) return name;
    if (!nameHasProperCase && bestHasProperCase) return best;

    return name.length >= best.length ? name : best;
  });
}

export function applyAliases(
  name: string,
  aliasMap: Map<string, string>
): string {
  return aliasMap.get(name) || name;
}

export function buildAliasMap(mappings: AliasMapping[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const mapping of mappings) {
    for (const alias of mapping.aliases) {
      map.set(alias, mapping.canonical);
    }
    map.set(mapping.canonical, mapping.canonical);
  }

  return map;
}
