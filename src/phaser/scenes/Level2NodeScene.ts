import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { LOCS, LocID } from "../../content/gold_country";
import { check } from "../../runtime/skills";

export class Level2NodeScene extends Phaser.Scene {
  private info!: HTMLElement;
  private here!: LocID;
  private days!: number;
  private evidence = new Set<string>();
  private warrant = false;
  private log!: Phaser.GameObjects.Text;

  constructor(){ super("Level2NodeScene"); }

  init(data:any){
    this.here = data.here; this.days = data.days;
    (data.evidence||[]).forEach((t:string)=> this.evidence.add(t));
    this.warrant = !!data.warrant;
  }

  create() {
    const L = LOCS.find(l=>l.id===this.here)!;
    this.cameras.main.setBackgroundColor("#111826");
    this.info = document.getElementById("hud")!;
    this.add.text(40, 24, L.name, { fontFamily:"monospace", fontSize:"16px", color:"#cde3ff" });
    this.add.text(40, 60, L.blurb, { fontFamily:"monospace", fontSize:"14px", color:"#9ad1ff", wordWrap:{ width: 880 }});
    this.log = this.add.text(40, 380, "", { fontFamily:"monospace", fontSize:"14px", color:"#cde3ff", wordWrap:{ width: 880 }});

    // actions
    this.add.text(40, 120, "A) Investigate (History DC12)", { fontFamily:"monospace", fontSize:"14px", color:"#cde3ff" });
    this.add.text(40, 150, "B) Talk to locals (Diplomacy DC12)", { fontFamily:"monospace", fontSize:"14px", color:"#cde3ff" });
    this.add.text(40, 180, "C) Track routes (Survival DC10)", { fontFamily:"monospace", fontSize:"14px", color:"#cde3ff" });
    this.add.text(40, 210, "D) Profile suspect (Sense Motive DC12)", { fontFamily:"monospace", fontSize:"14px", color:"#cde3ff" });

    if (this.here==="mokhill")
      this.add.text(40, 240, "W) File warrant (need ≥3 evidence)", { fontFamily:"monospace", fontSize:"14px", color:"#8ef5a2" });

    if (this.here==="chawse")
      this.add.text(40, 270, "R) Return artifact to cultural custodians (needs warrant + ≥4 evidence)", { fontFamily:"monospace", fontSize:"14px", color:"#8ef5a2" });

    this.input.keyboard!.on("keydown-A", ()=> this.act("History", 12));
    this.input.keyboard!.on("keydown-B", ()=> this.act("Diplomacy", 12));
    this.input.keyboard!.on("keydown-C", ()=> this.act("Survival", 10));
    this.input.keyboard!.on("keydown-D", ()=> this.act("SenseMotive", 12));
    this.input.keyboard!.on("keydown-W", ()=> this.fileWarrant());
    this.input.keyboard!.on("keydown-R", ()=> this.tryReturn());
    this.input.keyboard!.on("keydown-ESC", ()=> this.leave("Back to map"));
    this.updateHUD();
  }

  private act(skill: any, dc: number) {
    if (this.days <= 0) return this.print("Out of time.");
    this.days -= 1;
    const r = check(skill, dc);
    if (!r.ok) {
      engine.recordAction({ type:"l2_check_fail", skill, here:this.here, roll:r.total });
      return this.print(`${skill} ${r.total} vs ${dc}: no new lead.`);
    }
    const L = LOCS.find(l=>l.id===this.here)!;
    const fact = L.facts[Math.min(this.evidence.size, L.facts.length-1)];
    if (L.token && !this.evidence.has(L.token)) this.evidence.add(L.token);
    engine.recordAction({ type:"l2_check_ok", skill, here:this.here, fact });
    this.print(`Success. Lead: ${fact}${L.token?`  [+${L.token}]`:""}`);
    this.updateHUD();
  }

  private fileWarrant() {
    if (this.here!=="mokhill") return;
    if (this.evidence.size < 3) return this.print("Need at least 3 evidence.");
    this.warrant = true;
    engine.recordAction({ type:"l2_warrant_filed" });
    this.print("Pursuit warrant filed in Mokelumne Hill.");
    this.updateHUD();
  }

  private tryReturn() {
    if (this.here!=="chawse") return;
    if (!this.warrant || this.evidence.size < 4) return this.print("Need warrant and ≥4 evidence.");
    this.scene.start("Level2ArrestScene", {
      days: this.days, evidence: Array.from(this.evidence), warrant: this.warrant
    });
  }

  private leave(msg:string) {
    this.scene.start("Level2MapScene", {
      fromNode: true, here: this.here, days: this.days,
      evidence: Array.from(this.evidence), warrant: this.warrant
    });
  }

  private updateHUD() {
    this.info.textContent = [
      `Days left: ${this.days} | Evidence: ${this.evidence.size} | Warrant: ${this.warrant? "yes":"no"}`,
      "A/B/C/D to act. ESC to map."
    ].join("\n");
  }

  private print(t: string){ this.log.setText(t); }
}
