import Phaser from "phaser";
import { engine } from "../../runtime/engine";

export class Level2OverworldScene extends Phaser.Scene {
  private info!: HTMLElement;
  private gate!: Phaser.GameObjects.Rectangle;
  private ridge!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("Level2OverworldScene");
  }

  create() {
    const f = engine.getGameState().flags || {};
    if (!f.level1Complete) return this.scene.start("OverworldScene");

    this.cameras.main.setBackgroundColor("#0f1520");
    this.info = document.getElementById("hud")!;
    this.add.text(40, 30, "Sanctuary Highlands — Level 2 Hub", { fontFamily: "monospace", fontSize: "16px", color: "#cde3ff" });

    this.add.grid(480, 270, 960, 540, 48, 48, 0x0f141b, 1, 0x1c2531, 0.5);

    this.ridge = this.add.rectangle(260, 260, 120, 80, 0x2a3d55).setStrokeStyle(1, 0x3a4f66);
    this.add.text(210, 240, "Ridge Pasture\n(Tactics: T)", { fontFamily: "monospace", fontSize: "12px", color: "#9ad1ff" });

    this.gate = this.add.rectangle(720, 220, 140, 90, 0x253248).setStrokeStyle(1, 0x4b6a86);
    this.add.text(675, 200, "Shamanic Gate\n(Ritual: R)", { fontFamily: "monospace", fontSize: "12px", color: "#9ad1ff" });

    this.input.keyboard!.on("keydown-T", () => this.scene.start("Level2TacticsScene"));
    this.input.keyboard!.on("keydown-R", () => {
      const g = engine.getGameState();
      if (!g.flags?.gateKey) {
        this.flash("Gate sealed. Earn the gate key in Tactics.");
        return;
      }
      this.scene.start("Level2RitualScene");
    });
    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("OverworldScene"));
    this.updateHUD("Explore. T for tactics. R for ritual. ESC to base.");
  }

  private updateHUD(msg: string) {
    const gs = engine.getGameState();
    this.info.textContent = [
      "Level 2 Hub",
      msg,
      `Karma: ${gs.player.karma} | Herd: ${gs.herdHealth}`,
      `Flags: ${JSON.stringify(gs.flags || {})}`
    ].join("\n");
  }
  private flash(m: string) {
    this.updateHUD(m);
  }
}
