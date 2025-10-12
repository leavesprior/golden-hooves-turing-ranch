import Phaser from "phaser";
import { engine } from "../../runtime/engine";

export class OverworldScene extends Phaser.Scene {
  private info!: HTMLElement;

  constructor() {
    super("OverworldScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0f1520");
    this.info = document.getElementById("hud")!;
    this.add.text(40, 30, "Base Ranch — Overworld", { fontFamily: "monospace", fontSize: "16px", color: "#cde3ff" });

    this.add.grid(480, 270, 960, 540, 48, 48, 0x0f141b, 1, 0x1c2531, 0.5);

    // Barn
    this.add.rectangle(200, 200, 120, 100, 0x2a3d55).setStrokeStyle(1, 0x3a4f66);
    this.add.text(160, 180, "Barn (B)", { fontFamily: "monospace", fontSize: "12px", color: "#9ad1ff" });

    // Pasture
    this.add.rectangle(500, 300, 200, 150, 0x253248).setStrokeStyle(1, 0x4b6a86);
    this.add.text(430, 280, "Pasture (P)", { fontFamily: "monospace", fontSize: "12px", color: "#9ad1ff" });

    // Quiz gate
    this.add.rectangle(750, 150, 140, 90, 0x324a6a).setStrokeStyle(1, 0x5a7a9a);
    this.add.text(700, 130, "Quiz Gate (Q)", { fontFamily: "monospace", fontSize: "12px", color: "#9ad1ff" });

    this.input.keyboard!.on("keydown-B", () => this.scene.start("DialogueScene"));
    this.input.keyboard!.on("keydown-P", () => this.scene.start("BattleScene"));
    this.input.keyboard!.on("keydown-Q", () => this.scene.start("ClueScene"));
    this.input.keyboard!.on("keydown-L", () => {
      const f = engine.getGameState().flags || {};
      if (f.level1Complete && f.goldenFrog) {
        this.scene.start("Level2MapScene");
      } else {
        this.flash("Level 2 locked. Earn the Golden Frog by passing all 6 clues.");
      }
    });
    this.input.keyboard!.on("keydown-V", () => {
      const r = engine.tapes.verifyAndRepair();
      this.flash(`Verify: ok=${r.ok} repaired=${r.repaired}`);
    });

    this.updateHUD("Explore the ranch. B: barn | P: pasture | Q: quiz | L: Level 2 | V: verify");
  }

  private updateHUD(msg: string) {
    const gs = engine.getGameState();
    this.info.textContent = [
      "Base Ranch",
      msg,
      `Karma: ${gs.player.karma} | Herd: ${gs.herdHealth}`,
      `Flags: ${JSON.stringify(gs.flags || {})}`
    ].join("\n");
  }

  private flash(m: string) {
    this.updateHUD(m);
  }
}
