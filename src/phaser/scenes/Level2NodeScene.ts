import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { LOCS, LocID } from "../../content/gold_country";
import { skillCheck, getSkillModifier } from "../../runtime/dice";
import { AIRBNB } from "../../runtime/airbnb";
import { matchesAnswer } from "../../runtime/answers";

export class Level2NodeScene extends Phaser.Scene {
  private here!: LocID;
  private days!: number;
  private evidence!: Set<string>;
  private warrant!: boolean;
  private info!: HTMLElement;
  private log!: Phaser.GameObjects.Text;

  constructor(){ super("Level2NodeScene"); }

  init(data:any) {
    this.here = data.here;
    this.days = data.days;
    this.evidence = new Set<string>(data.evidence || []);
    this.warrant = !!data.warrant;
  }

  create() {
    this.cameras.main.setBackgroundColor("#0f1520");
    this.info = document.getElementById("hud")!;
    const loc = LOCS.find(l=>l.id===this.here)!;

    // Enhanced visual header with location-specific color
    const headerColor = this.getLocationColor(this.here);
    this.add.rectangle(480, 60, 920, 80, headerColor, 0.3);
    this.add.text(480, 40, `📍 ${loc.name}`, { 
      fontFamily:"monospace", 
      fontSize:"24px", 
      color:"#f0e68c",
      fontStyle: "bold"
    }).setOrigin(0.5);
    
    this.add.text(480, 75, loc.blurb, { 
      fontFamily:"monospace", 
      fontSize:"14px", 
      color:"#cde3ff",
      wordWrap:{ width: 840 },
      align: "center"
    }).setOrigin(0.5);

    // Location image/icon
    this.addLocationVisual(this.here, 120, 140);

    // Town facts box
    const factsY = 150;
    this.add.text(540, factsY, "🔍 Historical Facts:", { 
      fontFamily:"monospace", 
      fontSize:"14px", 
      color:"#9ad1ff",
      fontStyle: "bold"
    });
    loc.facts.forEach((fact, i) => {
      this.add.text(560, factsY + 30 + (i * 25), `• ${fact}`, { 
        fontFamily:"monospace", 
        fontSize:"12px", 
        color:"#cde3ff",
        wordWrap:{ width: 380 }
      });
    });

    // Action menu with town-specific options
    const menuY = 280;
    this.add.text(540, menuY, "🎯 Investigation Actions:", { 
      fontFamily:"monospace", 
      fontSize:"14px", 
      color:"#9ad1ff",
      fontStyle: "bold"
    });

    const actions = this.getTownSpecificActions(this.here);
    actions.forEach((action, i) => {
      const actionText = this.add.text(560, menuY + 30 + (i * 30), 
        `${action.key}: ${action.label}`, 
        { 
          fontFamily:"monospace", 
          fontSize:"13px", 
          color: action.available ? "#8ef5a2" : "#666",
          backgroundColor: action.available ? "#1a2a1a" : undefined,
          padding: { x: 8, y: 4 }
        }
      );
      
      if (action.available) {
        actionText.setInteractive({ useHandCursor: true });
        actionText.on('pointerover', () => actionText.setColor("#ffffff"));
        actionText.on('pointerout', () => actionText.setColor("#8ef5a2"));
      }
    });

    // Evidence tracker
    this.add.text(540, 430, `📋 Evidence Collected: ${this.evidence.size}/4`, { 
      fontFamily:"monospace", 
      fontSize:"13px", 
      color: this.evidence.size >= 4 ? "#8ef5a2" : "#f0e68c"
    });
    
    if (loc.token) {
      const hasToken = this.evidence.has(loc.token);
      this.add.text(560, 455, `${hasToken ? "✅" : "🔒"} ${loc.token}`, { 
        fontFamily:"monospace", 
        fontSize:"12px", 
        color: hasToken ? "#8ef5a2" : "#9ad1ff"
      });
    }

    // Log output
    this.log = this.add.text(40, 340, "", { 
      fontFamily:"monospace", 
      fontSize:"13px", 
      color:"#f0e68c",
      wordWrap:{ width: 460 }
    });

    // Register keyboard shortcuts
    this.input.keyboard!.on("keydown-I", ()=> this.act("investigation", 12));
    this.input.keyboard!.on("keydown-T", ()=> this.act("diplomacy", 13));
    this.input.keyboard!.on("keydown-S", ()=> this.act("survival", 14));
    this.input.keyboard!.on("keydown-P", ()=> this.act("wisdom", 15));
    
    if (this.here === "angels" && !this.evidence.has("game_room_clue")) {
      this.input.keyboard!.on("keydown-A", ()=> this.showAirbnbClue());
    }
    
    if (this.here === "mokhill") {
      this.input.keyboard!.on("keydown-W", ()=> this.fileWarrant());
    }
    if (this.here === "chawse") {
      this.input.keyboard!.on("keydown-R", ()=> this.tryReturn());
    }
    
    this.input.keyboard!.on("keydown-ESC", ()=> this.leave("Returned to map."));

    this.updateHUD();
  }

  private getLocationColor(loc: LocID): number {
    const colors: Record<LocID, number> = {
      angels: 0x4a7c59,      // Green (nature/frogs)
      columbia: 0x6b4423,    // Brown (historic buildings)
      mokhill: 0x5a4a6a,     // Purple (official/legal)
      jackson: 0x8b6914,     // Gold (mining)
      chawse: 0x8b4513       // Saddle brown (indigenous heritage)
    };
    return colors[loc] || 0x1a2a3a;
  }

  private addLocationVisual(loc: LocID, x: number, y: number) {
    // Create visual representations for each location
    const graphics = this.add.graphics();
    
    switch(loc) {
      case "angels":
        // Frog icon
        graphics.fillStyle(0x4a7c59, 1);
        graphics.fillCircle(x + 200, y + 50, 40);
        this.add.text(x + 200, y + 50, "🐸", { fontSize: "48px" }).setOrigin(0.5);
        this.add.text(x + 200, y + 110, "Frog Jump Capital", { 
          fontFamily:"monospace", fontSize:"12px", color:"#8ef5a2" 
        }).setOrigin(0.5);
        break;
      
      case "columbia":
        // Historic building
        graphics.fillStyle(0x6b4423, 1);
        graphics.fillRect(x + 160, y + 20, 80, 80);
        graphics.fillStyle(0x4a3318, 1);
        graphics.fillTriangle(x + 160, y + 20, x + 200, y - 10, x + 240, y + 20);
        this.add.text(x + 200, y + 60, "🏛️", { fontSize: "40px" }).setOrigin(0.5);
        this.add.text(x + 200, y + 110, "State Historic Park", { 
          fontFamily:"monospace", fontSize:"12px", color:"#cde3ff" 
        }).setOrigin(0.5);
        break;
      
      case "mokhill":
        // Courthouse/official building
        graphics.fillStyle(0x5a4a6a, 1);
        graphics.fillRect(x + 160, y + 20, 80, 80);
        this.add.text(x + 200, y + 60, "⚖️", { fontSize: "40px" }).setOrigin(0.5);
        this.add.text(x + 200, y + 110, "Legal District", { 
          fontFamily:"monospace", fontSize:"12px", color:"#9ad1ff" 
        }).setOrigin(0.5);
        break;
      
      case "jackson":
        // Mine shaft
        graphics.fillStyle(0x8b6914, 1);
        graphics.fillRect(x + 180, y + 30, 40, 70);
        graphics.fillStyle(0x2a2a2a, 1);
        graphics.fillRect(x + 185, y + 35, 30, 65);
        this.add.text(x + 200, y + 60, "⛏️", { fontSize: "40px" }).setOrigin(0.5);
        this.add.text(x + 200, y + 110, "Kennedy Mine", { 
          fontFamily:"monospace", fontSize:"12px", color:"#f0e68c" 
        }).setOrigin(0.5);
        break;
      
      case "chawse":
        // Grinding rock
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillEllipse(x + 200, y + 60, 80, 40);
        graphics.fillStyle(0x654321, 1);
        for(let i = 0; i < 5; i++) {
          graphics.fillCircle(x + 180 + i * 10, y + 55, 4);
        }
        this.add.text(x + 200, y + 60, "🪨", { fontSize: "40px" }).setOrigin(0.5);
        this.add.text(x + 200, y + 110, "Grinding Rock SHP", { 
          fontFamily:"monospace", fontSize:"12px", color:"#cde3ff" 
        }).setOrigin(0.5);
        break;
    }
  }

  private getTownSpecificActions(loc: LocID): Array<{key: string, label: string, available: boolean}> {
    const base = [
      { key: "I", label: "Investigate artifacts (Investigation DC 12)", available: true },
      { key: "T", label: "Talk to locals (Diplomacy DC 13)", available: true },
      { key: "S", label: "Track footprints (Survival DC 14)", available: true },
      { key: "P", label: "Profile suspect behavior (Wisdom DC 15)", available: true }
    ];

    // Add Airbnb photo clue for Angels Camp
    if (loc === "angels" && !this.evidence.has("game_room_clue")) {
      base.push({ key: "A", label: "🖼️ Study Airbnb game room photo", available: true });
    }

    // Add location-specific options
    if (loc === "mokhill" && this.evidence.size >= 2) {
      base.push({ key: "W", label: "📜 File Warrant (requires 2+ evidence)", available: true });
    } else if (loc === "mokhill") {
      base.push({ key: "W", label: "📜 File Warrant (need more evidence)", available: false });
    }

    if (loc === "chawse" && this.warrant && this.evidence.size >= 4) {
      base.push({ key: "R", label: "🎯 Return Artifact (requires warrant + 4 evidence)", available: true });
    } else if (loc === "chawse") {
      base.push({ key: "R", label: "🎯 Return Artifact (locked)", available: false });
    }

    return base;
  }

  private showAirbnbClue() {
    this.print("🖼️ Opening Airbnb game room photo...\nStudy the caption carefully!");
    window.open(AIRBNB.photos.gameRoom, "_blank");
    
    // Create DOM input for answer
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f1520;padding:20px;border:4px solid #8ef5a2;z-index:1000;";
    
    const prompt = document.createElement("p");
    prompt.textContent = "What sentiment about family does the caption express?";
    prompt.style.cssText = "color:#f0e68c;font-family:monospace;margin-bottom:10px;";
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type your answer...";
    input.style.cssText = "width:100%;padding:8px;font-family:monospace;margin-bottom:10px;";
    
    const submit = document.createElement("button");
    submit.textContent = "Submit";
    submit.style.cssText = "background:#8ef5a2;color:#1a2a1a;border:2px solid #f0e68c;padding:8px 16px;cursor:pointer;margin-right:10px;";
    
    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    cancel.style.cssText = "background:#666;color:#fff;border:2px solid #444;padding:8px 16px;cursor:pointer;";
    
    const GAME_ROOM_ACCEPT = [
      "family memories",
      "family makes a small town great",
      "peace and quiet with family makes mountain living",
      "peace and quiet with family makes country living",
      "peace and quiet with family makes ranch life"
    ];
    
    submit.onclick = () => {
      const val = input.value || "";
      if (matchesAnswer(val, GAME_ROOM_ACCEPT)) {
        this.evidence.add("game_room_clue");
        this.print("✅ Correct! You found a crucial clue about family values at the ranch.");
        document.body.removeChild(container);
        this.updateHUD();
      } else {
        this.print("❌ Not quite. Hint: Focus on what makes this place special for families.");
      }
    };
    
    cancel.onclick = () => {
      document.body.removeChild(container);
      this.print("Airbnb clue cancelled.");
    };
    
    container.appendChild(prompt);
    container.appendChild(input);
    container.appendChild(submit);
    container.appendChild(cancel);
    document.body.appendChild(container);
  }

  private act(skill: any, dc: number) {
    if (this.days <= 0) return this.print("❌ Out of time!");
    
    this.days -= 1;
    const mod = getSkillModifier(skill);
    const result = skillCheck(dc, mod);
    
    engine.recordAction({ type:"l2_action", loc:this.here, skill, result: result.success });
    
    const loc = LOCS.find(l=>l.id===this.here)!;
    
    if (result.success && loc.token && !this.evidence.has(loc.token)) {
      this.evidence.add(loc.token);
      this.print(`✅ Success! Rolled ${result.roll}+${mod}=${result.total} vs DC ${dc}\n🔍 Found: ${loc.token}!`);
      
      // Visual feedback
      this.add.text(480, 200, `+${loc.token}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#8ef5a2"
      }).setOrigin(0.5);
    } else if (result.success) {
      this.print(`✅ Success! Rolled ${result.roll}+${mod}=${result.total} vs DC ${dc}\nBut you already have evidence from here.`);
    } else {
      this.print(`❌ Failed. Rolled ${result.roll}+${mod}=${result.total} vs DC ${dc}`);
    }
    
    this.updateHUD();
  }

  private fileWarrant() {
    if (this.evidence.size < 2) return this.print("❌ Need at least 2 pieces of evidence to file a warrant.");
    if (this.warrant) return this.print("You already have a warrant.");
    
    this.warrant = true;
    this.print("✅ Warrant filed at Mokelumne Hill courthouse!\n🔓 You can now legally return the artifact at Chaw'se.");
    engine.recordAction({ type:"l2_warrant" });
  }

  private tryReturn() {
    if (!this.warrant) return this.print("❌ Need a warrant first! File one at Mokelumne Hill.");
    if (this.evidence.size < 4) return this.print(`❌ Need all 4 pieces of evidence. You have ${this.evidence.size}/4.`);
    
    this.scene.start("Level2ArrestScene", {
      warrant: this.warrant,
      evidence: Array.from(this.evidence)
    });
  }

  private leave(msg: string) {
    this.print(msg);
    this.time.delayedCall(300, ()=> {
      this.scene.start("Level2MapScene", {
        fromNode: true,
        here: this.here,
        days: this.days,
        evidence: Array.from(this.evidence),
        warrant: this.warrant
      });
    });
  }

  private updateHUD() {
    this.info.textContent = `Days: ${this.days} | Evidence: ${this.evidence.size}/4 | Warrant: ${this.warrant?"✅":"❌"}\nESC: leave this location`;
  }

  private print(t: string) {
    this.log.setText(t);
  }
}
