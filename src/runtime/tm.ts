// src/runtime/tm.ts
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
  load(snap: { arr: string[]; head: number }) {
    const L = Math.max(this.arr.length, snap.arr.length);
    const merged = new Array(L).fill("_");
    for (let i = 0; i < L; i++) {
      const a = this.arr[i] ?? "_";
      const b = snap.arr[i] ?? "_";
      merged[i] = b !== "_" ? b : a;
    }
    this.arr = merged;
    this.head = snap.head;
  }
}

export const coreTape = new Tape();    // flags/progress
export const diagTape = new Tape();    // checksums
export const syncTape = new Tape();    // sync cursors
export const marketTape = new Tape();  // prices P:item=123

const rules: Table = {
  CORE: { "_": ["F", 1, "CORE"], "F": ["F", 1, "CORE"] },
  DIAG: { "_": ["C", 1, "DIAG"] },
  SYNC: { "_": ["Q", 1, "SYNC"] },
  MKT : { "_": ["P", 1, "MKT"] },
};

function step(state: keyof typeof rules): string {
  const t =
    state === "CORE" ? coreTape :
    state === "DIAG" ? diagTape :
    state === "SYNC" ? syncTape : marketTape;
  const sym = t.read();
  const r = rules[state]?.[sym] ?? null;
  if (!r) return state;
  t.write(r[0]); t.move(r[1]); return r[2];
}

// CRC across core+market
function crc(): number {
  const all = coreTape.arr.join("") + marketTape.arr.join("");
  let h = 2166136261 >>> 0;
  for (let i = 0; i < all.length; i++) { h ^= all.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

let lastCRC = crc();
let lastGood = { core: coreTape.snap(), mkt: marketTape.snap() };

export function tick() {
  step("CORE"); step("DIAG"); step("SYNC"); step("MKT");
  const now = crc();
  if (now !== lastCRC) {
    lastCRC = now;
    lastGood = { core: coreTape.snap(), mkt: marketTape.snap() };
  }
}

export function repairIfNeeded() {
  const bad = marketTape.arr.some(c => /^P:/.test(c) && Number(c.split("=")[1]) <= 0);
  if (bad) {
    coreTape.load(lastGood.core);
    marketTape.load(lastGood.mkt);
  }
}

export async function recomputePrices() {
  try {
    // pull recent trades; schema‑agnostic, cheap
    const { data, error } = await supabase
      .from("karma_ledger")
      .select("transaction_type, amount")
      .limit(200);
    if (error || !data) throw error;

    const agg: Record<string, number> = {}; // demand counter
    for (const r of data as Array<{transaction_type?: string; amount?: number}>) {
      const t = r.transaction_type ?? "";
      if (!t.startsWith("shop_")) continue;
      const item = t.replace("shop_","").trim();
      agg[item] = (agg[item] ?? 0) + Math.max(1, Math.abs(r.amount ?? 1));
    }
    for (const [item, demand] of Object.entries(agg)) {
      // base 10, EMA toward demand/5
      const current = readPrice(item);
      const target = Math.max(1, Math.round(10 + demand / 5));
      const next = Math.max(1, Math.round(0.8 * current + 0.2 * target));
      writePrice(item, next);
    }
  } catch {
    // local gentle decay
    for (let i = 0; i < marketTape.arr.length; i++) {
      const c = marketTape.arr[i];
      if (/^P:/.test(c)) {
        const [_, kv] = c.split(":");
        const [item, raw] = kv.split("=");
        const p = Math.max(1, Math.round((Number(raw) || 10) * 0.99));
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
  return c ? Number(c.split("=")[1]) || 10 : 10;
}
