export type Skill = "History"|"Diplomacy"|"Survival"|"SenseMotive";

const MOD: Record<Skill, number> = {
  History: 3, Diplomacy: 2, Survival: 2, SenseMotive: 1
};

export function roll(skill: Skill) {
  const d20 = 1 + Math.floor(Math.random()*20);
  const mod = MOD[skill];
  return { d20, mod, total: d20 + mod };
}

export function check(skill: Skill, dc: number) {
  const r = roll(skill);
  return { ...r, dc, ok: r.total >= dc };
}
