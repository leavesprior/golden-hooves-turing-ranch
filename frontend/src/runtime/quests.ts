import { SkillType } from "./dice";

export type QuestType = "horse_patrol" | "fence_repair" | "feeding_time" | "emu_quest";

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
  horse_patrol: {
    id: "horse_patrol",
    name: "Horse Patrol",
    description: "Rotate livestock to balance impacts. Optimize sheep-donkey pairs for healthy grazing.",
    skillType: "survival",
    dc: 12,
    karmaReward: 10,
    coinReward: 10
  },
  fence_repair: {
    id: "fence_repair",
    name: "Fence Repair",
    description: "Repair fence breaks amid storms. Use tools to mend the barriers.",
    skillType: "strength",
    dc: 14,
    karmaReward: 12,
    coinReward: 12
  },
  feeding_time: {
    id: "feeding_time",
    name: "Feeding Time",
    description: "Separate evening treats to prevent donkey dominance. Ensure Jumanji gets proper nutrients.",
    skillType: "diplomacy",
    dc: 15,
    karmaReward: 15,
    coinReward: 15
  },
  emu_quest: {
    id: "emu_quest",
    name: "Emu Quest",
    description: "Bond with emus or foxes via mini-encounters. Perfect for bird watching enthusiasts.",
    skillType: "wisdom",
    dc: 13,
    karmaReward: 11,
    coinReward: 11
  }
};

export function getRandomQuest(): Quest {
  const types: QuestType[] = ["horse_patrol", "fence_repair", "feeding_time", "emu_quest"];
  const random = types[Math.floor(Math.random() * types.length)];
  return QUESTS[random];
}
