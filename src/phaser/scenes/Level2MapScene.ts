import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { LOCS, START, EDGES, LocID } from "../../content/gold_country";
import { syncProgressFromStorage } from "../../runtime/progress_bridge";

export class Level2MapScene extends Phaser.Scene {
  private info!: HTMLElement;
  private here: LocID = START;
  private days = 15;
  private evidence = new Set<string>();
  private warrant = false;

  constructor(){ super("Level2MapScene"); }

  create() {
    // Sync progress from clue game
    syncProgressFromStorage();
    
    const f = engine.getGameState().flags || {};
    const gs = engine.getGameState();
    
    // Debug info for level 2 entry
    console.log("Level2MapScene entry check:", {
      flags: f,
      level1Complete: f.level1Complete,
      goldenFrog: f.goldenFrog,
      activitiesCompleted: gs.activitiesCompleted,
      discountPercent: gs.discountPercent
    });
    
    if (!(f.level1Complete && f.goldenFrog)) {
      // Show clear message about requirements
      const msg = `Level 2 Requirements:\n` +
        `✅ Complete Clue Quiz (6/6 correct) to get Golden Frog\n` +
        `Current Status:\n` +
        `  Golden Frog: ${f.goldenFrog ? '✅' : '❌'}\n` +
        `  Level 1 Complete: ${f.level1Complete ? '✅' : '❌'}\n\n` +
        `Complete 3+ activities, then pass the Clue Quiz (Press Q)`;
      
      alert(msg);
      this.scene.start("OverworldScene");
      return;
    }

    this.cameras.main.setBackgroundColor("#1a2332");
    this.info = document.getElementById("hud")!;
    
    // Retro title with shadow effect
    this.add.text(42, 26, "Gold Country Sleuth — Level 2", { fontFamily:"monospace", fontSize:"16px", color:"#000000" });
    this.add.text(40, 24, "🔍 Gold Country Sleuth — Level 2", { fontFamily:"monospace", fontSize:"16px", color:"#f0e68c", fontStyle:"bold" });

    // Retro 32-bit style terrain background
    // Mountains in background
    this.add.rectangle(480, 100, 960, 80, 0x4a5f7a);
    for (let i = 0; i < 12; i++) {
      const x = 80 + i * 80;
      this.add.triangle(x, 140, x-40, 140, x+40, 140, x, 80, 0x2d3f5a);
      this.add.triangle(x, 140, x-40, 140, x+40, 140, x, 90, 0x3a4d6a);
    }

    // Forest/hills (green areas)
    this.add.rectangle(480, 220, 960, 120, 0x4a7c59);
    for (let i = 0; i < 20; i++) {
      const x = 40 + i * 48;
      const y = 180 + Math.sin(i) * 20;
      this.add.ellipse(x, y, 35, 45, 0x3a6c49);
    }

    // Gold country dirt roads (winding paths)
    const roadColor = 0x8b7355;
    this.add.rectangle(480, 320, 900, 35, roadColor);
    this.add.rectangle(200, 380, 30, 140, roadColor);
    this.add.rectangle(480, 450, 600, 30, roadColor);
    this.add.rectangle(760, 380, 30, 140, roadColor);

    // River (blue water feature)
    this.add.rectangle(480, 500, 960, 40, 0x4a7fb8);
    this.add.rectangle(480, 500, 940, 30, 0x5a8fc8);

    // Draw town nodes with retro 32-bit buildings
    for (const L of LOCS) {
      // Town building base
      this.add.rectangle(L.x, L.y, 32, 32, 0x8b6f47).setStrokeStyle(2, 0x5a4a37);
      
      // Building details based on town
      if (L.name.includes("Angels")) {
        // Mining town - draw a mine entrance
        this.add.rectangle(L.x, L.y-5, 20, 15, 0x3a3a3a);
        this.add.text(L.x-8, L.y-10, "⛏️", { fontSize:"16px" });
      } else if (L.name.includes("Columbia")) {
        // Historic town - draw old building
        this.add.rectangle(L.x, L.y-8, 28, 12, 0xa0522d);
        this.add.text(L.x-8, L.y-10, "🏛️", { fontSize:"16px" });
      } else if (L.name.includes("Mokelumne")) {
        // Justice - courthouse
        this.add.rectangle(L.x, L.y-8, 26, 14, 0x654321);
        this.add.text(L.x-8, L.y-10, "⚖️", { fontSize:"16px" });
      } else if (L.name.includes("Chaw")) {
        // Sacred site
        this.add.star(L.x, L.y-8, 5, 8, 16, 0xf0e68c);
        this.add.text(L.x-8, L.y-10, "🏔️", { fontSize:"16px" });
      } else {
        // Generic town
        this.add.rectangle(L.x, L.y-8, 24, 12, 0x8b4513);
        this.add.text(L.x-8, L.y-10, "🏘️", { fontSize:"16px" });
      }

      // Town marker dot
      this.add.circle(L.x, L.y, 6, 0xf0e68c).setStrokeStyle(2, 0x8ab4f8);
      
      // Town name with background
      const nameText = this.add.text(L.x+14, L.y-8, L.name, { 
        fontFamily:"monospace", 
        fontSize:"11px", 
        color:"#f0e68c",
        backgroundColor:"#00000099",
        padding: { x: 3, y: 1 }
      });
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
      `🔍 Location: ${LOCS.find(l=>l.id===this.here)!.name}`,
      `⏰ Days Remaining: ${this.days}/15 | 📋 Evidence: ${this.evidence.size}/4 | ⚖️ Warrant: ${this.warrant? "✅ YES":"❌ NO"}`,
      `🎁 REMINDER: Complete this case to earn +7% discount on your ranch booking!`,
      `ENTER: Investigate this town | Travel: 1) ${n[0]??"-"}  2) ${n[1]??"-"}  3) ${n[2]??"-"}  | ESC: Return to ranch`,
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
