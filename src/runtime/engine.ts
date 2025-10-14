import { TapeHub } from "./tm/tapes";
import type { GameState } from "./state";
import { getCurrentUserId } from "./auth";

class Engine {
  tapes = new TapeHub();
  private state: GameState;
  private initialized = false;

  constructor() {
    // Initialize with placeholder - will be set with actual auth.uid() on init
    this.state = { 
      tick: 0, 
      player: { 
        id: "", // Will be set from auth.uid()
        username: "SierraShadow", 
        karma: 0, 
        coins: 0, 
        alignment: "Good" 
      }, 
      herdHealth: 70, 
      flags: {},
      activitiesCompleted: 0,
      completedActivities: [],
      discountPercent: 0
    };
    this.tapes.append("diag", this.tapes.core.snapshot().hash);
  }

  async initialize() {
    if (this.initialized) return;
    
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("User must be authenticated to play");
    }
    
    this.state.player.id = userId;
    this.initialized = true;
  }

  loadState(state: GameState) {
    // Merge flags to preserve progress set by /clue-game bridge
    const mergedFlags = { ...(this.state.flags || {}), ...(state.flags || {}) };
    this.state = { ...state, flags: mergedFlags };
    this.recordAction({ type: "load_state" });
  }

  getGameState() { return this.state; }

  recordAction(evt: any) {
    this.tapes.append("core", { t: Date.now(), evt });
    this.state.tick++;
    this.tapes.append("diag", this.tapes.core.snapshot().hash);
  }

  earnKarma(n: number, reason: string) {
    this.state.player.karma += n;
    this.recordAction({ type: "karma", delta: n, reason });
  }

  earnCoins(n: number, reason: string) {
    this.state.player.coins += n;
    this.recordAction({ type: "coins", delta: n, reason });
  }

  spendCoins(n: number, reason: string): boolean {
    if (this.state.player.coins < n) return false;
    this.state.player.coins -= n;
    this.recordAction({ type: "coins", delta: -n, reason });
    return true;
  }

  updateAlignment(alignment: "Good" | "Neutral" | "Chaotic") {
    this.state.player.alignment = alignment;
    this.recordAction({ type: "alignment", value: alignment });
  }

  setFlag(key: string, value: boolean) {
    if (!this.state.flags) this.state.flags = {};
    this.state.flags[key] = value;
    this.recordAction({ type: "flag", key, value });
  }

  setHerdHealth(n: number) {
    this.state.herdHealth = Math.max(0, Math.min(100, n));
    this.recordAction({ type: "herd", value: this.state.herdHealth });
  }

  completeActivity(activityId?: string) {
    this.state.activitiesCompleted = (this.state.activitiesCompleted || 0) + 1;
    if (activityId && !this.state.completedActivities?.includes(activityId)) {
      this.state.completedActivities = [...(this.state.completedActivities || []), activityId];
    }
    this.recordAction({ type: "activity_complete", count: this.state.activitiesCompleted, id: activityId });
  }

  addDiscount(percent: number) {
    this.state.discountPercent = (this.state.discountPercent || 0) + percent;
    this.recordAction({ type: "discount_earned", total: this.state.discountPercent });
  }

  snapshot() {
    return {
      ts: new Date().toISOString(),
      state: this.state,
      tapes: {
        core: this.tapes.core.snapshot(),
        diag: this.tapes.diag.snapshot(),
        sync: this.tapes.sync.snapshot(),
        proc: this.tapes.proc.snapshot()
      }
    };
  }
}
export const engine = new Engine();
