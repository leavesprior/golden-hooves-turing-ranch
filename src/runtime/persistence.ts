const MEM_PREFIX = "ranch:run:";

export function saveRunLocal(snapshot: any) {
  const key = MEM_PREFIX + Date.now();
  localStorage.setItem(key, JSON.stringify(snapshot));
  return key;
}

export function listRunsLocal() {
  return Object.keys(localStorage).filter(k=>k.startsWith(MEM_PREFIX))
    .map(k => ({ key: k, snapshot: JSON.parse(localStorage.getItem(k)!) }));
}
