import { SkillType } from "./dice";

export type QuestType = "pasture_patrol" | "fence_frontier" | "feeding_frenzy" | "creature_quest";

export interface Quest {
  id: QuestType;
  name: string;
  description: string;
  skillType: SkillType;
  dc: number;
  karmaReward: number;
  coinReward: number;
}

export const QUESTS: Record<QuestType, Quest> = {
  pasture_patrol: {
    id: "pasture_patrol",
    name: "Pasture Patrol",
    description: "Rotate livestock to balance impacts. Optimize sheep-donkey pairs for healthy grazing.",
    skillType: "survival",
    dc: 12,
    karmaReward: 10,
    coinReward: 10
  },
  fence_frontier: {
    id: "fence_frontier",
    name: "Fence Frontier",
    description: "Repair fence breaks amid storms. Use tools to mend the barriers.",
    skillType: "strength",
    dc: 14,
    karmaReward: 12,
    coinReward: 12
  },
  feeding_frenzy: {
    id: "feeding_frenzy",
    name: "Feeding Frenzy",
    description: "Separate evening treats to prevent donkey dominance. Ensure Jumanji gets proper nutrients.",
    skillType: "diplomacy",
    dc: 15,
    karmaReward: 15,
    coinReward: 15
  },
  creature_quest: {
    id: "creature_quest",
    name: "Creature Quest",
    description: "Bond with emus or foxes via mini-encounters. Perfect for bird watching enthusiasts.",
    skillType: "wisdom",
    dc: 13,
    karmaReward: 11,
    coinReward: 11
  }
};

export function getRandomQuest(): Quest {
  const types: QuestType[] = ["pasture_patrol", "fence_frontier", "feeding_frenzy", "creature_quest"];
  const random = types[Math.floor(Math.random() * types.length)];
  return QUESTS[random];
}
