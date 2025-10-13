export type Alignment = "Good" | "Neutral" | "Chaotic";
export interface Player { id: string; username: string; karma: number; coins: number; alignment: Alignment; }
export interface GameState { 
  tick: number; 
  player: Player; 
  herdHealth: number; 
  flags?: Record<string, boolean>; 
  activitiesCompleted?: number;
  completedActivities?: string[];
  discountPercent?: number;
}
