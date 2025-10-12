import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { requestBooking } from "../../runtime/bookings";
import { generateDialogue } from "../../runtime/neoma";

export class Level2RitualScene extends Phaser.Scene {
  private seq: string[] = [];
  private pos = 0;
  private round = 1;
  private info!: HTMLElement;
  private showing = false;

  constructor() {
    super("Level2RitualScene");
  }

  async create() {
    const f = engine.getGameState().flags || {};
    if (!f.gateKey) return this.scene.start("Level2OverworldScene");

    this.cameras.main.setBackgroundColor("#0e1120");
    this.info = document.getElementById("hud")!;
    this.add.text(40, 24, "Shamanic Gate — Ritual", { fontFamily: "monospace", fontSize: "16px", color: "#cde3ff" });
    const line = await generateDialogue("Gate spirit speaks a one-line riddle at a shamanic meeting ground.");
    this.add.text(40, 60, line, { fontFamily: "monospace", fontSize: "14px", color: "#9ad1ff", wordWrap: { width: 880 } });

    this.input.keyboard!.on("keydown-UP", () => this.inputKey("U"));
    this.input.keyboard!.on("keydown-DOWN", () => this.inputKey("D"));
    this.input.keyboard!.on("keydown-LEFT", () => this.inputKey("L"));
    this.input.keyboard!.on("keydown-RIGHT", () => this.inputKey("R"));
    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("Level2OverworldScene"));

    this.nextRound();
  }

  private async nextRound() {
    this.seq = this.makeSeq(this.round + 2);
    this.pos = 0;
    this.showing = true;
    await this.playSeq(this.seq);
    this.showing = false;
    this.updateHUD(`Repeat the pattern. Round ${this.round}/3`);
  }

  private makeSeq(n: number) {
    const keys = ["U", "D", "L", "R"]; const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(keys[Math.floor(Math.random() * keys.length)]);
    return out;
  }

  private async playSeq(s: string[]) {
    this.add.text(40, 420, "Memorize…", { fontFamily: "monospace", fontSize: "14px", color: "#cde3ff" });
    for (const k of s) {
      this.flashKey(k);
      await new Promise(r => setTimeout(r, 450));
    }
    this.children.remove(this.children.getByName("flash") as any);
  }

  private flashKey(k: string) {
    const map = { U: [480, 140], D: [480, 380], L: [240, 260], R: [720, 260] } as any;
    const [x, y] = map[k];
    const r = this.add.rectangle(x, y, 120, 80, 0x324a6a).setName("flash");
    setTimeout(() => r.destroy(), 300);
  }

  private async inputKey(k: string) {
    if (this.showing) return;
    const need = this.seq[this.pos];
    const ok = k === need;
    engine.recordAction({ type: "l2_ritual_input", k, ok, pos: this.pos });
    if (!ok) return this.fail();
    this.pos++;
    if (this.pos < this.seq.length) return;

    this.round++;
    if (this.round > 3) return this.win();
    this.nextRound();
  }

  private async win() {
    const gs = engine.getGameState();
    gs.flags = { ...(gs.flags || {}), level2Complete: true };
    engine.earnKarma(20, "Level2 ritual success");
    engine.recordAction({ type: "l2_ritual_win" });
    try {
      await requestBooking(gs.player.id, "GHQ15");
    } catch { }
    this.updateHUD("Gate opens. Level 2 complete. ESC to hub.");
  }

  private fail() {
    engine.recordAction({ type: "l2_ritual_fail" });
    this.updateHUD("Pattern broken. Try again. ESC to hub.");
  }

  private updateHUD(m: string) {
    const g = engine.getGameState();
    this.info.textContent = [
      "Level 2 — Ritual",
      m,
      `Karma: ${g.player.karma}`,
      `Flags: ${JSON.stringify(g.flags || {})}`
    ].join("\n");
  }
}
