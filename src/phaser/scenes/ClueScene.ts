import Phaser from "phaser";
import { QUIZ } from "../../runtime/quiz";
import { engine } from "../../runtime/engine";
import { saveRunLocal } from "../../runtime/persistence";
import { saveRunToSupabase } from "../../runtime/sync";

export class ClueScene extends Phaser.Scene {
  private i = 0;
  private correct = 0;
  private qText!: Phaser.GameObjects.Text;
  private oText!: Phaser.GameObjects.Text[];
  private info!: HTMLElement;

  constructor(){ super("ClueScene"); }

  create() {
    this.cameras.main.setBackgroundColor("#121821");
    this.info = document.getElementById("hud")!;
    this.add.text(40, 30, "Clue Quiz — answer all 6 correctly to earn the Golden Frog", { fontFamily:"monospace", fontSize:"16px", color:"#cde3ff" });
    this.qText = this.add.text(40, 90, "", { fontFamily:"monospace", fontSize:"16px", color:"#9ad1ff", wordWrap:{ width: 880 }});
    this.oText = [0,1,2,3].map((k)=> this.add.text(60, 150 + k*40, "", { fontFamily:"monospace", fontSize:"14px", color:"#cde3ff" }));
    this.input.keyboard!.on("keydown-ONE", ()=>this.answer(0));
    this.input.keyboard!.on("keydown-TWO", ()=>this.answer(1));
    this.input.keyboard!.on("keydown-THREE", ()=>this.answer(2));
    this.input.keyboard!.on("keydown-FOUR", ()=>this.answer(3));
    this.input.keyboard!.on("keydown-ESC", ()=>this.scene.start("OverworldScene"));
    this.show();
  }

  private show() {
    const it = QUIZ[this.i];
    this.info.textContent = `Q${this.i+1}/6  Correct: ${this.correct}\nPress 1–4 to answer. ESC to exit.`;
    this.qText.setText(it.q);
    this.oText.forEach((t, idx)=> t.setText(`${idx+1}) ${it.o[idx]}`));
  }

  private async answer(idx: number) {
    const it = QUIZ[this.i];
    const ok = idx === it.a;
    if (ok) this.correct++;
    engine.recordAction({ type:"quiz_answer", q:this.i, ok });
    this.i++;
    if (this.i < QUIZ.length) return this.show();

    const passed = this.correct === QUIZ.length;
    if (!passed) {
      this.add.text(40, 360, `Need all 6 correct. You got ${this.correct}.`, { fontFamily:"monospace", fontSize:"14px", color:"#ff9aa2" });
      return;
    }

    // Award Golden Frog and unlock Level 2
    const gs = engine.getGameState();
    gs.flags = { ...(gs.flags||{}), level1Complete: true, goldenFrog: true };
    engine.recordAction({ type:"quiz_passed", reward:"GoldenFrog" });

    const snap = engine.snapshot();
    saveRunLocal(snap);
    try { await saveRunToSupabase(snap); } catch {}

    this.add.text(40, 360, "Golden Frog acquired. Level 2 unlocked.", { fontFamily:"monospace", fontSize:"14px", color:"#8ef5a2" });
    // Auto‑transition after a short pause
    this.time.delayedCall(900, () => this.scene.start("Level2MapScene"));
  }
}
