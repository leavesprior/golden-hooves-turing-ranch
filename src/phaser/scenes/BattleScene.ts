import Phaser from "phaser";
import { engine } from "../../runtime/engine";

export class BattleScene extends Phaser.Scene {
  private info!: HTMLElement;

  constructor() {
    super("BattleScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#121821");
    this.info = document.getElementById("hud")!;
    this.add.text(40, 30, "Pasture — Simple Battle", { fontFamily: "monospace", fontSize: "16px", color: "#cde3ff" });

    this.add.text(40, 100, "Press SPACE to defend sheep", { fontFamily: "monospace", fontSize: "14px", color: "#9ad1ff" });
    this.add.text(40, 130, "Press ESC to return", { fontFamily: "monospace", fontSize: "14px", color: "#9ad1ff" });

    this.input.keyboard!.on("keydown-SPACE", () => {
      engine.earnKarma(5, "Defended sheep");
      engine.setHerdHealth(engine.getGameState().herdHealth + 5);
      this.updateHUD("Defended successfully!");
    });

    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("OverworldScene"));

    this.updateHUD("Battle scene ready");
  }

  private updateHUD(msg: string) {
    const gs = engine.getGameState();
    this.info.textContent = [
      "Battle Scene",
      msg,
      `Karma: ${gs.player.karma} | Herd: ${gs.herdHealth}`
    ].join("\n");
  }
}
