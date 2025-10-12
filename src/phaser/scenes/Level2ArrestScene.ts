import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { requestBooking } from "../../runtime/bookings";

export class Level2ArrestScene extends Phaser.Scene {
  private info!: HTMLElement;

  constructor(){ super("Level2ArrestScene"); }

  async create(data:any) {
    this.cameras.main.setBackgroundColor("#0f1520");
    this.info = document.getElementById("hud")!;
    const ok = data?.warrant && (data?.evidence?.length||0) >= 4;

    if (ok) {
      engine.earnKarma(25, "Recovered artifact with community custodians");
      const g = engine.getGameState();
      g.flags = { ...(g.flags||{}), level2Complete: true };
      engine.recordAction({ type:"l2_case_closed" });
      try { await requestBooking(g.player.id, "GHQ15"); } catch {}
      this.add.text(40, 90, "Case closed at Chaw'se. Artifact returned responsibly.", { fontFamily:"monospace", fontSize:"16px", color:"#8ef5a2", wordWrap:{ width: 880 }});
    } else {
      this.add.text(40, 90, "Insufficient evidence or no warrant. Build a respectful case first.", { fontFamily:"monospace", fontSize:"16px", color:"#ff9aa2", wordWrap:{ width: 880 }});
    }
    this.add.text(40, 160, "ESC: back to map", { fontFamily:"monospace", fontSize:"14px", color:"#cde3ff" });
    this.input.keyboard!.on("keydown-ESC", ()=> this.scene.start("Level2MapScene"));
    this.info.textContent = "Level 2 — Resolution";
  }
}
