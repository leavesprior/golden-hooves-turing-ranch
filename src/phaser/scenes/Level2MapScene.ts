import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { LOCS, START, EDGES, LocID } from "../../content/gold_country";

export class Level2MapScene extends Phaser.Scene {
  private info!: HTMLElement;
  private here: LocID = START;
  private days = 8;
  private evidence = new Set<string>();
  private warrant = false;

  constructor(){ super("Level2MapScene"); }

  create() {
    const f = engine.getGameState().flags||{};
    if (!f.level1Complete) return this.scene.start("OverworldScene");

    this.cameras.main.setBackgroundColor("#0f1520");
    this.info = document.getElementById("hud")!;
    this.add.text(40, 24, "Gold Country Sleuth — Level 2", { fontFamily:"monospace", fontSize:"16px", color:"#cde3ff" });

    // grid/map
    this.add.grid(480,270,960,540,48,48,0x102030,1,0x1a2a3a,0.5);

    // draw nodes
    for (const L of LOCS) {
      this.add.circle(L.x, L.y, 10, 0x8ab4f8).setStrokeStyle(1, 0x3a4f66);
      this.add.text(L.x+12, L.y-10, L.name, { fontFamily:"monospace", fontSize:"12px", color:"#9ad1ff" });
    }

    this.input.keyboard!.on("keydown-ENTER", ()=> this.enter());
    this.input.keyboard!.on("keydown-ONE", ()=> this.travel(0));
    this.input.keyboard!.on("keydown-TWO", ()=> this.travel(1));
    this.input.keyboard!.on("keydown-THREE", ()=> this.travel(2));
    this.input.keyboard!.on("keydown-ESC", ()=> this.scene.start("OverworldScene"));

    this.updateHUD();
  }

  private neighbors(): LocID[] { return EDGES[this.here]; }

  private updateHUD(msg="") {
    const n = this.neighbors();
    const lines = [
      `Here: ${LOCS.find(l=>l.id===this.here)!.name}`,
      `Days left: ${this.days} | Evidence: ${this.evidence.size} | Warrant: ${this.warrant? "yes":"no"}`,
      `ENTER: investigate here`,
      `Travel: 1) ${n[0]??"-"}  2) ${n[1]??"-"}  3) ${n[2]??"-"}  | ESC: base`,
      msg
    ];
    this.info.textContent = lines.filter(Boolean).join("\n");
  }

  private enter() {
    this.scene.start("Level2NodeScene", {
      here: this.here,
      days: this.days,
      evidence: Array.from(this.evidence),
      warrant: this.warrant
    });
  }

  private travel(i: number) {
    const n = this.neighbors();
    const dest = n[i];
    if (!dest) return;
    if (this.days <= 0) return this.updateHUD("Out of time.");
    this.days -= 1;
    this.here = dest;
    engine.recordAction({ type:"l2_travel", to: dest, days:this.days });
    this.updateHUD("Traveled.");
  }

  // receive state back
  init(data:any) {
    if (data?.fromNode) {
      this.here = data.here ?? this.here;
      this.days = data.days ?? this.days;
      this.evidence = new Set<string>(data.evidence ?? Array.from(this.evidence));
      this.warrant = !!data.warrant;
    }
  }
}
