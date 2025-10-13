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
      engine.addDiscount(7);
      engine.recordAction({ type:"l2_case_closed" });
      try { await requestBooking(g.player.id, "GHQ15"); } catch {}
      
      this.add.text(40, 90, "🎉 CASE CLOSED AT CHAW'SE!", { 
        fontFamily:"monospace", 
        fontSize:"20px", 
        color:"#8ef5a2", 
        fontStyle: "bold"
      });
      this.add.text(40, 130, "Artifact returned responsibly with community custodians.", { 
        fontFamily:"monospace", 
        fontSize:"16px", 
        color:"#cde3ff", 
        wordWrap:{ width: 880 }
      });
      this.add.text(40, 180, "✅ +7% ADDITIONAL DISCOUNT EARNED!", { 
        fontFamily:"monospace", 
        fontSize:"18px", 
        color:"#f0e68c",
        fontStyle: "bold"
      });
      this.add.text(40, 220, `💰 Total Discount: ${(g.discountPercent || 0)}% off your ranch booking!`, { 
        fontFamily:"monospace", 
        fontSize:"16px", 
        color:"#8ef5a2"
      });
      this.add.text(40, 260, "🌟 +25 Karma for ethical investigation!", { 
        fontFamily:"monospace", 
        fontSize:"14px", 
        color:"#9ad1ff"
      });
    } else {
      this.add.text(40, 90, "Insufficient evidence or no warrant. Build a respectful case first.", { fontFamily:"monospace", fontSize:"16px", color:"#ff9aa2", wordWrap:{ width: 880 }});
    }
    this.add.text(40, 320, "ESC: back to map", { fontFamily:"monospace", fontSize:"14px", color:"#cde3ff" });
    this.input.keyboard!.on("keydown-ESC", ()=> this.scene.start("Level2MapScene"));
    this.info.textContent = "Level 2 — Resolution";
  }
}
