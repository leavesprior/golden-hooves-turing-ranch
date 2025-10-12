// D&D 3.5 dice mechanics
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function skillCheck(dc: number, modifier: number = 0): { success: boolean; roll: number; total: number } {
  const roll = rollD20();
  const total = roll + modifier;
  return { success: total >= dc, roll, total };
}

export type SkillType = "survival" | "strength" | "diplomacy" | "wisdom" | "handle_animal";

export function getSkillModifier(skillType: SkillType, level: number = 1): number {
  const base = Math.floor((level - 1) / 2);
  return base;
}
