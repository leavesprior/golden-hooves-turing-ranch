// Minimal 4‑tape core with self‑repair + market dynamics
import { supabase } from "@/integrations/supabase/client";

type Dir = -1 | 1;
type Rule = [write: string, move: Dir, next: string];
type Table = Record<string, Record<string, Rule>>;

class Tape {
  arr: string[] = Array(256).fill("_");
  head = 0;
  read() { return this.arr[this.head] ?? "_"; }
  write(s: string) { this.arr[this.head] = s; }
  move(d: Dir) { this.head = Math.max(0, this.head + d); }
  snap() { return { arr: [...this.arr], head: this.head }; }
  load(snap: {arr: string[]; head: number}) {
    // merge: keep newer prices/flags from existing cells if different and non-empty
    const L = Math.max(this.arr.length, snap.arr.length);
    const merged = new Array(L).fill("_");
    for (let i=0;i<L;i++) {
      const a = this.arr[i] ?? "_";
      const b = snap.arr[i] ?? "_";
      merged[i] = b !== "_" ? b : a;
    }
    this.arr = merged; this.head = snap.head;
  }
}

export const coreTape = new Tape();   // game flags, progress, scene hints
export const diagTape = new Tape();   // checksums, invariants
export const syncTape = new Tape();   // cloud sync cursors, retry markers
export const marketTape = new Tape(); // prices: P:item=123, stock: S:item=n

// Simple rule table; extensible
const rules: Table = {
  CORE: { "_": ["F", 1, "CORE"], "F": ["F", 1, "CORE"] },
  DIAG: { "_": ["C", 1, "DIAG"] },
  SYNC: { "_": ["Q", 1, "SYNC"] },
  MKT : { "_": ["P", 1, "MKT"] }
};

export function step(state: keyof typeof rules): string {
  const t = state === "CORE" ? coreTape : state === "DIAG" ? diagTape : state === "SYNC" ? syncTape : marketTape;
  const sym = t.read();
  const r = rules[state]?.[sym] ?? null;
  if (!r) return state;
  t.write(r[0]); t.move(r[1]); return r[2];
}

// CRC over core+market to detect corruption
function crc(): number {
  const all = coreTape.arr.join("") + marketTape.arr.join("");
  let h = 2166136261>>>0;
  for (let i=0;i<all.length;i++) { h ^= all.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h>>>0;
}

let lastCRC = crc();

// Self‑repair: restore last good snapshot on CRC drift
let lastGood = {
  core: coreTape.snap(),
  mkt: marketTape.snap(),
};

export function tick() {
  step("CORE"); step("DIAG"); step("SYNC"); step("MKT");
  const now = crc();
  if (now !== lastCRC) {
    lastCRC = now;
    lastGood = { core: coreTape.snap(), mkt: marketTape.snap() };
  }
}

// Repair if invariants fail (e.g., negative prices)
export function repairIfNeeded() {
  const bad = marketTape.arr.some(c => /^P:/.test(c) && Number(c.split("=")[1]) <= 0);
  if (bad) {
    coreTape.load(lastGood.core);
    marketTape.load(lastGood.mkt);
  }
}

// Market: recompute prices from recent trades; fallback local if offline
export async function recomputePrices() {
  try {
    const since = new Date(Date.now() - 1000*60*60*24).toISOString();
    const { data, error } = await supabase
      .from("karma_ledger")
      .select("transaction_type, amount")
      .gte("ts", since);
    if (error || !data) throw error;
    const agg: Record<string,{v:number,w:number}> = {};
    for (const r of data) {
      const item = r.transaction_type.replace("shop_", "");
      if (!agg[item]) agg[item] = { v:0, w:0 };
      agg[item].v += Math.abs(r.amount) * 10; // Estimate price from karma spent
      agg[item].w += 1;
    }
    for (const [k, {v,w}] of Object.entries(agg)) {
      const p = Math.max(1, Math.round(v / Math.max(1,w)));
      writePrice(k, p);
    }
  } catch {
    // local damped update
    for (let i=0;i<marketTape.arr.length;i++) {
      const c = marketTape.arr[i];
      if (/^P:/.test(c)) {
        const [_, kv] = c.split(":");
        const [item, raw] = kv.split("=");
        const p = Math.max(1, Math.round(Number(raw||"10") * 0.99));
        marketTape.arr[i] = `P:${item}=${p}`;
      }
    }
  } finally {
    repairIfNeeded();
  }
}

export function writePrice(item: string, price: number) {
  const line = `P:${item}=${Math.max(1, Math.round(price))}`;
  const idx = marketTape.arr.findIndex(c => c.startsWith(`P:${item}=`));
  if (idx >= 0) marketTape.arr[idx] = line;
  else { marketTape.arr[marketTape.head] = line; marketTape.move(1); }
}

export function readPrice(item: string): number {
  const c = marketTape.arr.find(x => x.startsWith(`P:${item}=`));
  if (!c) return 10; // default
  return Number(c.split("=")[1]) || 10;
}
