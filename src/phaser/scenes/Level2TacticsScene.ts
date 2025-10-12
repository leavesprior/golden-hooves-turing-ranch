import Phaser from "phaser";
import { engine } from "../../runtime/engine";

type Unit = { id: string; x: number; y: number; tag: "SIERRA" | "DONKEY" | "SHEEP" | "COYOTE" };

export class Level2TacticsScene extends Phaser.Scene {
  private gridW = 8; private gridH = 6; private tile = 64;
  private units: Unit[] = [];
  private sel = 0;
  private round = 1;
  private guardScore = 0;
  private info!: HTMLElement;

  constructor() {
    super("Level2TacticsScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#121726");
    this.info = document.getElementById("hud")!;
    this.add.text(40, 24, "Ridge Pasture — Tactics", { fontFamily: "monospace", fontSize: "16px", color: "#cde3ff" });
    this.drawGrid();

    this.units = [
      { id: "S", x: 1, y: 4, tag: "SIERRA" },
      { id: "D", x: 1, y: 2, tag: "DONKEY" },
      { id: "H", x: 3, y: 3, tag: "SHEEP" },
      { id: "C", x: 7, y: 3, tag: "COYOTE" }
    ];
    this.renderUnits();

    this.input.keyboard!.on("keydown-TAB", () => this.sel = (this.sel + 1) % 2);
    this.input.keyboard!.on("keydown-UP", () => this.move(0, -1));
    this.input.keyboard!.on("keydown-DOWN", () => this.move(0, 1));
    this.input.keyboard!.on("keydown-LEFT", () => this.move(-1, 0));
    this.input.keyboard!.on("keydown-RIGHT", () => this.move(1, 0));
    this.input.keyboard!.on("keydown-G", () => this.guard());
    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("Level2OverworldScene"));

    this.updateHUD("TAB select. Arrows move. G guard sheep. 3 rounds.");
  }

  private drawGrid() {
    for (let y = 0; y < this.gridH; y++) {
      for (let x = 0; x < this.gridW; x++) {
        const cx = 80 + x * this.tile, cy = 80 + y * this.tile;
        this.add.rectangle(cx, cy, this.tile - 2, this.tile - 2, (x + y) % 2 ? 0x203040 : 0x1a2836).setOrigin(0);
      }
    }
    this.add.text(80, 470, "Guard sheep from coyote for 3 rounds", { fontFamily: "monospace", fontSize: "14px", color: "#9ad1ff" });
  }

  private renderUnits() {
    this.children.removeAll(); // clear
    this.drawGrid();
    for (const u of this.units) {
      const cx = 80 + u.x * this.tile + this.tile / 2;
      const cy = 80 + u.y * this.tile + this.tile / 2;
      const color =
        u.tag === "SIERRA" ? 0x9ad1ff :
          u.tag === "DONKEY" ? 0xbdd08a :
            u.tag === "SHEEP" ? 0xffffff :
              0xffb366;
      this.add.circle(cx, cy, 20, color).setStrokeStyle(2, 0x223344);
      this.add.text(cx - 10, cy - 30, u.tag[0], { fontFamily: "monospace", fontSize: "12px", color: "#cde3ff" });
    }
    // selection ring
    const selU = this.units[this.sel];
    const sx = 80 + selU.x * this.tile + this.tile / 2;
    const sy = 80 + selU.y * this.tile + this.tile / 2;
    this.add.circle(sx, sy, 24).setStrokeStyle(2, 0x8ab4f8);
  }

  private move(dx: number, dy: number) {
    const u = this.units[this.sel];
    const nx = Phaser.Math.Clamp(u.x + dx, 0, this.gridW - 1);
    const ny = Phaser.Math.Clamp(u.y + dy, 0, this.gridH - 1);
    if (this.occupied(nx, ny)) return;
    u.x = nx; u.y = ny;
    engine.recordAction({ type: "l2_move", unit: u.tag, x: nx, y: ny });
    this.renderUnits();
  }

  private occupied(x: number, y: number) {
    return this.units.some(u => u.x === x && u.y === y);
  }

  private guard() {
    const d = this.units[1]; // donkey
    const h = this.units[2]; // sheep
    const touching = Math.abs(d.x - h.x) + Math.abs(d.y - h.y) === 1;
    if (!touching) {
      this.updateHUD("Donkey must stand next to sheep.");
      return;
    }
    this.guardScore++;
    engine.recordAction({ type: "l2_guard", score: this.guardScore, round: this.round });
    this.enemyTurn();
  }

  private enemyTurn() {
    const c = this.units[3]; const h = this.units[2];
    const dx = Math.sign(h.x - c.x); const dy = Math.sign(h.y - c.y);
    // prefer horizontal
    if (!this.occupied(c.x + dx, c.y)) c.x += dx;
    else if (!this.occupied(c.x, c.y + dy)) c.y += dy;
    this.round++;
    this.renderUnits();

    if (c.x === h.x && c.y === h.y) return this.fail();
    if (this.round > 3) return this.win();
    this.updateHUD(`Round ${this.round}/3`);
  }

  private win() {
    const gs = engine.getGameState();
    engine.earnKarma(15, "Level2 tactics success");
    gs.flags = { ...(gs.flags || {}), gateKey: true };
    engine.recordAction({ type: "l2_tactics_win", guard: this.guardScore });
    this.updateHUD("Win. Gate key earned. ESC to hub.");
  }

  private fail() {
    engine.recordAction({ type: "l2_tactics_fail" });
    this.updateHUD("Coyote reached sheep. Try again. ESC to hub.");
  }

  private updateHUD(msg: string) {
    const g = engine.getGameState();
    this.info.textContent = [
      "Level 2 — Tactics",
      msg,
      `Karma: ${g.player.karma} | Herd: ${g.herdHealth}`,
      `Guard score: ${this.guardScore} | Round: ${this.round}`
    ].join("\n");
  }
}
