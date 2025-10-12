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
    
    // Enhanced title with ranch branding
    this.add.text(40, 30, "🏞️ BACK OF BEYOND RANCH — OVERWORLD", { 
      fontFamily: "monospace", 
      fontSize: "18px", 
      color: "#f0e68c",
      fontStyle: "bold"
    });

    // Enhanced background with Sierra Nevada theme
    this.add.grid(480, 270, 960, 540, 48, 48, 0x0f141b, 1, 0x1c2531, 0.5);
    
    // Sky gradient effect (top portion)
    const sky = this.add.rectangle(480, 100, 960, 200, 0x1a2332, 0.3);

    // Barn with enhanced details
    const barn = this.add.rectangle(200, 200, 120, 100, 0x8b4513).setStrokeStyle(2, 0xa0522d);
    this.add.rectangle(200, 170, 100, 20, 0x654321); // Roof
    this.add.text(160, 250, "🏚️ BARN (B)", { 
      fontFamily: "monospace", 
      fontSize: "13px", 
      color: "#f0e68c",
      backgroundColor: "#00000088",
      padding: { x: 4, y: 2 }
    });

    // Pasture with fence details
    const pasture = this.add.rectangle(500, 300, 200, 150, 0x2d5016).setStrokeStyle(2, 0x4b6a86);
    this.add.rectangle(400, 225, 200, 5, 0x8b7355); // Fence top
    this.add.rectangle(400, 375, 200, 5, 0x8b7355); // Fence bottom
    this.add.text(430, 385, "🌾 PASTURE (P)", { 
      fontFamily: "monospace", 
      fontSize: "13px", 
      color: "#8ef5a2",
      backgroundColor: "#00000088",
      padding: { x: 4, y: 2 }
    });

    // Quest board
    this.add.rectangle(200, 400, 100, 80, 0x654321).setStrokeStyle(2, 0x8b4513);
    this.add.text(170, 450, "📋 QUEST (R)", { 
      fontFamily: "monospace", 
      fontSize: "13px", 
      color: "#cde3ff",
      backgroundColor: "#00000088",
      padding: { x: 4, y: 2 }
    });

    // Quiz gate with mystical appearance
    const quizGate = this.add.rectangle(750, 150, 140, 90, 0x4a5f7a).setStrokeStyle(3, 0x6a8faa);
    this.add.star(750, 120, 5, 10, 20, 0xf0e68c); // Star decoration
    this.add.text(700, 190, "🎯 CLUE QUIZ (Q)", { 
      fontFamily: "monospace", 
      fontSize: "13px", 
      color: "#f0e68c",
      backgroundColor: "#00000088",
      padding: { x: 4, y: 2 }
    });

    // Level 2 Portal
    this.add.rectangle(750, 400, 120, 80, 0x6a4a8a).setStrokeStyle(3, 0x8a6aaa);
    this.add.text(710, 450, "🌟 LEVEL 2 (L)", { 
      fontFamily: "monospace", 
      fontSize: "13px", 
      color: "#c9a0ff",
      backgroundColor: "#00000088",
      padding: { x: 4, y: 2 }
    });

    // Keyboard controls (original + WASD hints)
    this.input.keyboard!.on("keydown-B", () => this.scene.start("DialogueScene"));
    this.input.keyboard!.on("keydown-P", () => this.scene.start("BattleScene"));
    this.input.keyboard!.on("keydown-Q", () => {
      const gs = engine.getGameState();
      const activities = gs.activitiesCompleted || 0;
      if (activities >= 3) {
        this.scene.start("ClueScene");
      } else {
        this.flash(`Complete ${3 - activities} more activities to unlock Clue Quiz! Try quests (R).`);
      }
    });
    this.input.keyboard!.on("keydown-R", () => {
      this.scene.start("QuestScene");
    });
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

    this.updateHUD("🎮 CONTROLS: B=Barn | P=Pasture | R=Quest | Q=Clue Quiz | L=Level 2 | V=Verify");
  }

  private updateHUD(msg: string) {
    const gs = engine.getGameState();
    const activities = gs.activitiesCompleted || 0;
    const discount = gs.discountPercent || 0;
    const quizUnlocked = activities >= 3 ? "✅ UNLOCKED" : `🔒 ${3 - activities} more activities`;
    
    this.info.textContent = [
      "🏠 BACK OF BEYOND RANCH — Managed by Leif Pryor",
      msg,
      `💰 Karma: ${gs.player.karma} | Coins: ${gs.player.coins} | ⚖️ ${gs.player.alignment}`,
      `🌾 Herd Health: ${gs.herdHealth}% | 🎯 Activities: ${activities}/3`,
      `🎁 Current Discount: ${discount}% | Clue Quiz: ${quizUnlocked}`,
      gs.flags?.goldenFrog ? "🐸 GOLDEN FROG ACQUIRED!" : ""
    ].filter(Boolean).join("\n");
  }

  private flash(m: string) {
    this.updateHUD(m);
  }
}
