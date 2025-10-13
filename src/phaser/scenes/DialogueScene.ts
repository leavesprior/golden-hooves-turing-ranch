import Phaser from "phaser";
import { engine } from "../../runtime/engine";

export class DialogueScene extends Phaser.Scene {
  private info!: HTMLElement;

  constructor() {
    super("DialogueScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0e1120");
    this.info = document.getElementById("hud")!;
    this.add.text(40, 30, "Barn — Dialogue", { fontFamily: "monospace", fontSize: "16px", color: "#cde3ff" });

    const gs = engine.getGameState();
    const hasFrog = gs.flags?.goldenFrog || false;

    let dialogue: string[];
    
    if (hasFrog) {
      dialogue = [
        "Leif Pryor: Welcome back, Sierra!",
        "You've recovered the Golden Frog - excellent work!",
        "The herd is safe and thriving thanks to you.",
        "Feel free to explore the ranch activities.",
        "",
        "Press SPACE to acknowledge",
        "Press ESC to return"
      ];
    } else {
      dialogue = [
        "Leif Pryor: Welcome to the ranch, Sierra.",
        "The Golden Frog has been stolen.",
        "Complete activities to unlock the Clue Quiz.",
        "Solve all 6 clues to recover it!",
        "",
        "Press SPACE to acknowledge",
        "Press ESC to return"
      ];
    }

    dialogue.forEach((line, i) => {
      this.add.text(40, 80 + i * 30, line, { fontFamily: "monospace", fontSize: "14px", color: "#9ad1ff" });
    });

    this.input.keyboard!.on("keydown-SPACE", () => {
      engine.earnKarma(2, "Listened to Leif");
      this.scene.start("OverworldScene");
    });

    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("OverworldScene"));

    this.updateHUD("Dialogue with Leif Pryor");
  }

  private updateHUD(msg: string) {
    const gs = engine.getGameState();
    this.info.textContent = [
      "Dialogue Scene",
      msg,
      `Karma: ${gs.player.karma}`
    ].join("\n");
  }
}
