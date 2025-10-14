export function normalize(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s]/g," ")
    .replace(/\b(what|who|where|when|why|how|is|are|the|a|an|of|in|on|to|for)\b/g," ")
    .replace(/\s+/g," ").trim();
}

function tokenSet(s: string) { return new Set(normalize(s).split(" ").filter(Boolean)); }

function overlap(a: Set<string>, b: Set<string>) {
  let c=0; for (const t of a) if (b.has(t)) c++; return c;
}

/** accept if >= 0.67 token overlap against any canonical */
export function matchesAnswer(input: string, canon: string[]) {
  const A = tokenSet(input);
  for (const k of canon) {
    const B = tokenSet(k);
    const ov = overlap(A,B);
    const thr = Math.ceil(B.size * 0.67);
    if (ov >= thr) return true;
  }
  return false;
}
