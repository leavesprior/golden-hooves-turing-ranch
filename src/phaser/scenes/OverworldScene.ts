import Phaser from "phaser";
import { engine } from "../../runtime/engine";

export class OverworldScene extends Phaser.Scene {
  private info!: HTMLElement;

  constructor() {
    super("OverworldScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#4a7c3e");
    this.info = document.getElementById("hud")!;
    
    const gs = engine.getGameState();
    const completed = gs.completedActivities || [];
    
    // Enhanced title with ranch branding
    this.add.text(40, 20, "🏞️ BACK OF BEYOND RANCH — OVERWORLD", { 
      fontFamily: "monospace", 
      fontSize: "16px", 
      color: "#f0e68c",
      fontStyle: "bold"
    });

    // Enhanced background - grass base
    this.add.rectangle(480, 270, 960, 540, 0x5a8c4e);
    
    // Dirt paths (horizontal and vertical)
    this.add.rectangle(480, 200, 800, 60, 0x8b6f47);
    this.add.rectangle(480, 350, 800, 50, 0x8b6f47);
    this.add.rectangle(250, 270, 50, 400, 0x8b6f47);
    this.add.rectangle(700, 270, 50, 400, 0x8b6f47);

    // Water feature (stream)
    this.add.rectangle(480, 450, 600, 40, 0x4a90e2);
    
    // PADDOCK 1: Horse Paddock (Top Left) - Jumanji
    const paddock1Complete = completed.includes("pasture_patrol");
    this.add.rectangle(150, 140, 140, 100, 0x6b8f5e).setStrokeStyle(3, paddock1Complete ? 0xf0e68c : 0x4a4a4a);
    this.add.text(120, 100, paddock1Complete ? "✅ HORSE" : "🐴 HORSE", { 
      fontFamily: "monospace", fontSize: "11px", color: "#ffffff",
      backgroundColor: paddock1Complete ? "#28a74588" : "#00000088",
      padding: { x: 3, y: 2 }
    });
    this.add.text(100, 130, "🐴 Jumanji", { fontFamily: "monospace", fontSize: "14px", color: "#ffffff" });
    this.add.text(95, 165, "Press P", { fontFamily: "monospace", fontSize: "10px", color: "#cde3ff" });

    // PADDOCK 2: Sheep & Donkey Paddock (Top Center-Right)
    const paddock2Complete = completed.includes("feeding_frenzy");
    this.add.rectangle(500, 140, 180, 100, 0x7a9f6e).setStrokeStyle(3, paddock2Complete ? 0xf0e68c : 0x4a4a4a);
    this.add.text(450, 100, paddock2Complete ? "✅ FEEDING" : "🌾 FEEDING", { 
      fontFamily: "monospace", fontSize: "11px", color: "#ffffff",
      backgroundColor: paddock2Complete ? "#28a74588" : "#00000088",
      padding: { x: 3, y: 2 }
    });
    this.add.text(430, 130, "🐑 Sheep", { fontFamily: "monospace", fontSize: "13px", color: "#ffffff" });
    this.add.text(530, 130, "🫏 Donkey", { fontFamily: "monospace", fontSize: "13px", color: "#ffffff" });
    this.add.text(475, 165, "Press R", { fontFamily: "monospace", fontSize: "10px", color: "#cde3ff" });

    // PADDOCK 3: Emu Enclosure (Top Right)
    const paddock3Complete = completed.includes("creature_quest");
    this.add.rectangle(800, 140, 120, 100, 0x5e8f6b).setStrokeStyle(3, paddock3Complete ? 0xf0e68c : 0x4a4a4a);
    this.add.text(770, 100, paddock3Complete ? "✅ EMUS" : "🦤 EMUS", { 
      fontFamily: "monospace", fontSize: "11px", color: "#ffffff",
      backgroundColor: paddock3Complete ? "#28a74588" : "#00000088",
      padding: { x: 3, y: 2 }
    });
    this.add.text(765, 135, "🦤🦤", { fontFamily: "monospace", fontSize: "18px", color: "#ffffff" });
    this.add.text(775, 165, "Press B", { fontFamily: "monospace", fontSize: "10px", color: "#cde3ff" });

    // Barn (Center)
    this.add.rectangle(400, 300, 150, 120, 0x8b4513).setStrokeStyle(3, 0xa0522d);
    this.add.polygon(400, 245, [0, 30, 75, 0, 150, 30], 0x654321);
    this.add.rectangle(380, 330, 30, 40, 0x654321); // Door
    this.add.text(355, 370, "🏚️ BARN", { 
      fontFamily: "monospace", fontSize: "12px", color: "#f0e68c",
      backgroundColor: "#00000088", padding: { x: 4, y: 2 }
    });

    // Quest board (Bottom Left)
    const paddock4Complete = completed.includes("fence_frontier");
    this.add.rectangle(150, 380, 120, 90, 0x654321).setStrokeStyle(3, paddock4Complete ? 0xf0e68c : 0x4a4a4a);
    this.add.text(120, 345, paddock4Complete ? "✅ REPAIRS" : "🔨 REPAIRS", { 
      fontFamily: "monospace", fontSize: "11px", color: "#ffffff",
      backgroundColor: paddock4Complete ? "#28a74588" : "#00000088",
      padding: { x: 3, y: 2 }
    });
    this.add.text(105, 370, "📋 FENCE", { fontFamily: "monospace", fontSize: "13px", color: "#cde3ff" });
    this.add.text(100, 395, "FRONTIER", { fontFamily: "monospace", fontSize: "12px", color: "#cde3ff" });
    this.add.text(120, 420, "Press R", { fontFamily: "monospace", fontSize: "10px", color: "#cde3ff" });

    // Quiz gate with mystical appearance (Bottom Center-Right)
    const activities = gs.activitiesCompleted || 0;
    const quizUnlocked = activities >= 3;
    const quizGate = this.add.rectangle(650, 380, 160, 90, quizUnlocked ? 0x4a7f5a : 0x4a4a4a)
      .setStrokeStyle(3, quizUnlocked ? 0xf0e68c : 0x6a6a6a);
    this.add.star(650, 350, 5, 10, 20, quizUnlocked ? 0xf0e68c : 0x888888);
    this.add.text(600, 345, quizUnlocked ? "🎯 CLUE QUIZ" : "🔒 LOCKED", { 
      fontFamily: "monospace", fontSize: "11px", color: quizUnlocked ? "#f0e68c" : "#888888",
      backgroundColor: "#00000088", padding: { x: 4, y: 2 }
    });
    this.add.text(595, 375, quizUnlocked ? "🐸 Golden Frog" : `${3-activities} more`, { 
      fontFamily: "monospace", fontSize: "10px", 
      color: quizUnlocked ? "#8ef5a2" : "#ff9aa2"
    });
    this.add.text(615, 410, "Press Q", { 
      fontFamily: "monospace", fontSize: "10px", 
      color: quizUnlocked ? "#cde3ff" : "#666666"
    });

    // Level 2 Portal (Far Right)
    this.add.rectangle(850, 380, 120, 90, 0x6a4a8a).setStrokeStyle(3, 0x8a6aaa);
    this.add.text(820, 345, "🌟 LEVEL 2", { 
      fontFamily: "monospace", fontSize: "11px", color: "#c9a0ff",
      backgroundColor: "#00000088", padding: { x: 4, y: 2 }
    });
    this.add.text(835, 410, "Press L", { 
      fontFamily: "monospace", fontSize: "10px", color: "#c9a0ff"
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
    const completed = gs.completedActivities || [];
    const quizUnlocked = activities >= 3 ? "✅ UNLOCKED" : `🔒 ${3 - activities} more activities`;
    
    // Show which activities are complete
    const activityStatus = [
      completed.includes("pasture_patrol") ? "✅ Horse Patrol" : "⬜ Horse Patrol",
      completed.includes("feeding_frenzy") ? "✅ Feeding Time" : "⬜ Feeding Time",
      completed.includes("creature_quest") ? "✅ Emu Quest" : "⬜ Emu Quest",
      completed.includes("fence_frontier") ? "✅ Fence Repair" : "⬜ Fence Repair"
    ].join(" | ");
    
    this.info.textContent = [
      "🏠 BACK OF BEYOND RANCH — Managed by Leif Pryor",
      msg,
      `💰 Karma: ${gs.player.karma} | Coins: ${gs.player.coins} | ⚖️ ${gs.player.alignment}`,
      `🌾 Herd Health: ${gs.herdHealth}% | 🎯 Activities: ${activities}/4`,
      activityStatus,
      `🎁 Current Discount: ${discount}% | Clue Quiz: ${quizUnlocked}`,
      gs.flags?.goldenFrog ? "🐸 GOLDEN FROG ACQUIRED!" : ""
    ].filter(Boolean).join("\n");
  }

  private flash(m: string) {
    this.updateHUD(m);
  }
}
