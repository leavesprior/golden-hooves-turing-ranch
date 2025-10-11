import { v4 as uuidv4 } from "uuid";
import { TapeHub } from "./tm/tapes";
import type { GameState } from "./state";

class Engine {
  tapes = new TapeHub();
  private state: GameState;

  constructor() {
    this.state = { tick: 0, player: { id: uuidv4(), username: "SierraShadow", karma: 0, coins: 0, alignment: "Good" }, herdHealth: 70, flags: {} };
    this.tapes.append("diag", this.tapes.core.snapshot().hash);
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

  setHerdHealth(n: number) {
    this.state.herdHealth = Math.max(0, Math.min(100, n));
    this.recordAction({ type: "herd", value: this.state.herdHealth });
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
