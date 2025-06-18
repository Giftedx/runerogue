/**
 * OSRS Gem Table and rollGemTable function
 * @see https://oldschool.runescape.wiki/w/Mining#Gems
 */

// OSRS gem drop table (simplified for levels 1-50)
export const GEM_TABLE = [
  { id: 1623, name: "uncut sapphire", minLevel: 1, weight: 50 },
  { id: 1621, name: "uncut emerald", minLevel: 1, weight: 30 },
  { id: 1619, name: "uncut ruby", minLevel: 34, weight: 15 },
  { id: 1617, name: "uncut diamond", minLevel: 43, weight: 5 },
];

/**
 * Roll the OSRS gem table for a mining level (returns itemId or null)
 * @param miningLevel Player's mining level
 * @returns Gem itemId or null
 */
export function rollGemTable(miningLevel: number): number | null {
  const available = GEM_TABLE.filter((gem) => miningLevel >= gem.minLevel);
  if (available.length === 0) return null;
  const totalWeight = available.reduce((sum, gem) => sum + gem.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const gem of available) {
    if (roll < gem.weight) return gem.id;
    roll -= gem.weight;
  }
  return null;
}
