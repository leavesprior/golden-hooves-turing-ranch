import { Tape, djb2 } from "./tape";

export class TapeHub {
  core = new Tape();   // gameplay actions
  diag = new Tape();   // hashes for self-repair
  sync = new Tape();   // persistence cues
  proc = new Tape();   // procedural triggers

  append(which: keyof TapeHub, token: any) {
    const t = this[which] as Tape;
    t.write(JSON.stringify(token));
    t.move(1);
  }

  verifyAndRepair() {
    const c = this.core.snapshot(), d = this.diag.snapshot();
    let last = 0; try { last = JSON.parse(this.diag.at(d.head-1) || "0"); } catch {}
    if (last === c.hash) return { ok:true, repaired:false };
    const cells = c.cells.slice(0, -1); const head = Math.max(c.head-1, 0);
    this.core.restore({ head, cells });
    this.append("diag", djb2(JSON.stringify({ head, cells })));
    return { ok:false, repaired:true };
  }
}
