export type SymbolTok = string;
type Dir = -1 | 0 | 1;

export class Tape {
  private cells = new Map<number, SymbolTok>();
  private _head = 0;

  read(): SymbolTok { return this.cells.get(this._head) ?? " "; }
  write(sym: SymbolTok) { sym && sym !== " " ? this.cells.set(this._head, sym) : this.cells.delete(this._head); }
  move(dir: Dir) { this._head += dir; }
  head(): number { return this._head; }
  at(i: number): SymbolTok { return this.cells.get(i) ?? " "; }

  snapshot() {
    const cells = Array.from(this.cells.entries()).sort((a,b)=>a[0]-b[0]);
    return { head: this._head, cells, hash: djb2(JSON.stringify({ head: this._head, cells })) };
  }
  restore(s: { head: number; cells: [number, SymbolTok][] }) {
    this.cells = new Map(s.cells); this._head = s.head;
  }
}

export function djb2(str: string): number {
  let h = 5381; for (let i=0;i<str.length;i++) h=((h<<5)+h)+str.charCodeAt(i);
  return h>>>0;
}
