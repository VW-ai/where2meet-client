/**
 * Anonymous Name Generation Utility
 *
 * Generates unique anonymous names in the format: adjective_animal
 * e.g., "brave_tiger", "swift_wolf", "clever_eagle"
 *
 * Total combinations: 20 adjectives × 30 animals = 600 unique names
 */

const ADJECTIVES = [
  'brave', 'swift', 'clever', 'mighty', 'gentle',
  'bold', 'quiet', 'wise', 'eager', 'calm',
  'fierce', 'kind', 'bright', 'proud', 'humble',
  'loyal', 'wild', 'noble', 'cool', 'free'
];

const ANIMALS = [
  'wolf', 'tiger', 'eagle', 'bear', 'fox',
  'lion', 'hawk', 'owl', 'deer', 'shark',
  'falcon', 'panda', 'lynx', 'otter', 'raven',
  'dolphin', 'jaguar', 'bison', 'crane', 'seal',
  'cobra', 'moose', 'badger', 'swan', 'python',
  'leopard', 'penguin', 'cheetah', 'raccoon', 'heron'
];

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates a unique anonymous name that doesn't conflict with existing names
 *
 * @param existingNames - Set of already-used names in the event
 * @returns A unique name in format "adjective_animal"
 *
 * @example
 * const existing = new Set(['brave_tiger', 'swift_wolf']);
 * const name = generateUniqueName(existing);
 * // Returns something like "clever_eagle"
 */
export function generateUniqueName(existingNames: Set<string>): string {
  const shuffledAdj = shuffle(ADJECTIVES);
  const shuffledAni = shuffle(ANIMALS);

  // Try to find an unused combination
  for (const adj of shuffledAdj) {
    for (const animal of shuffledAni) {
      const name = `${adj}_${animal}`;
      if (!existingNames.has(name)) {
        return name;
      }
    }
  }

  // Fallback: If all 600 combinations are somehow used (extremely unlikely)
  // Generate a numbered anonymous name
  let i = 1;
  while (existingNames.has(`anonymous_${i}`)) {
    i++;
  }
  return `anonymous_${i}`;
}

/**
 * Extracts existing participant names from a list of participants
 *
 * @param participants - Array of participant objects with 'name' property
 * @returns Set of existing names
 */
export function extractExistingNames(participants: Array<{ name?: string }>): Set<string> {
  return new Set(
    participants
      .map(p => p.name)
      .filter((name): name is string => typeof name === 'string')
  );
}
