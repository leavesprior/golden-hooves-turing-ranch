// Ranch guest guide. BENCH 2026-11-09 (r2, after the fresh-context review). Static, no build step.
// Everything a guest does stays in this browser. No email, no name, no tracking.
// Karma: only NEUTRAL is ever shown. Every option of a choice gives the SAME neutral amount, so the
// shown number never tells a guest which choice was good or bad (r2 fix). No karma-chain write here.
(function () {
  'use strict';
  const R = window.RANCH;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ------------------------------------------------------------ storage: localStorage, else memory
  const mem = new Map();
  const store = {
    get(k, d) {
      try { const v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch (e) { /* blocked */ }
      return mem.has(k) ? JSON.parse(mem.get(k)) : d;
    },
    set(k, v) { const s = JSON.stringify(v); mem.set(k, s); try { localStorage.setItem(k, s); } catch (e) { /* memory keeps it */ } },
  };
  const K = { tour: 'ranch_tour_v1', clue: 'ranch_clue_v1', towns: 'ranch_towns_v1', karma: 'ranch_karma_v1', choices: 'ranch_choices_v1', hints: 'ranch_hints_v1' };

  // ------------------------------------------------------------ karma
  function addKarmaOnce(action, k) {
    const led = store.get(K.karma, []);
    if (led.some((e) => e.action === action)) return;
    led.push({ t: Date.now(), action, neutral: k.neutral || 0, good: k.good || 0, bad: k.bad || 0 });
    store.set(K.karma, led); renderKarma();
  }
  const neutralTotal = () => store.get(K.karma, []).reduce((a, e) => a + (e.neutral || 0), 0);
  function renderKarma() { const el = $('#karma'); if (el) el.textContent = neutralTotal(); }

  // ------------------------------------------------------------ season (month only; no forecast yet)
  function season(d) { const m = (d || new Date()).getMonth() + 1; return (m >= 11 || m <= 3) ? 'cold' : 'warm'; }
  const fits = (s) => s === 'all' || s === season();

  // ------------------------------------------------------------ host config
  // A clue counts as set up only when the host marked it Ready and gave a hint or a place.
  // Per clue: the host's own phone wins if Ready there, else the published data/host-config.json.
  let pubCfg = null;
  const usable = (c) => !!(c && c.ready && (c.hint1 || c.hint2 || c.hint3 || c.room));
  function clueCfg(id) {
    const localCfg = store.get('ranch_host_config', null);
    const l = localCfg && localCfg.clues && localCfg.clues[id];
    if (usable(l)) return l;
    const p = pubCfg && pubCfg.clues && pubCfg.clues[id];
    return usable(p) ? p : null;
  }

  let towns = null;
  const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
  const townsReady = fetch('data/towns.json').then((r) => (r.ok ? r.json() : [])).then((j) => { towns = j; }).catch(() => { towns = []; });
  const hostReady = fetch('data/host-config.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null)).then((j) => { pubCfg = j; }).catch(() => {});

  // ------------------------------------------------------------ views
  const view = (html) => { $('#main').innerHTML = html; window.scrollTo(0, 0); };
  const back = (to, label) => `<a class="back" href="#${to}">‹ ${esc(label)}</a>`;
  const bar = (buttons) => (buttons ? `<div class="always">${buttons}</div>` : '');

  function home() {
    const t = store.get(K.tour, {}), c = store.get(K.clue, {});
    const tourDone = R.stations.filter((s) => t[s.id] === 'done' || t[s.id] === 'na').length;
    const clueDone = R.mystery.clues.filter((x) => c[x.id] === 'found').length;
    view(`
      <h1 class="welcome">Welcome to<br>Back of Beyond Ranch</h1>
      <p class="lede">Three ways in. Start anywhere, skip anything, come back any time.</p>
      <a class="door" href="#tour"><span class="i">🏡</span><span><b>Take the tour</b><small>Get to know the house: ${tourDone}/${R.stations.length} rooms</small></span></a>
      <a class="door" href="#mystery"><span class="i">🗝️</span><span><b>${esc(R.mystery.title)}</b><small>A mystery inside the house: ${clueDone}/${R.mystery.clues.length} found</small></span></a>
      <a class="door" href="#towns"><span class="i">🧭</span><span><b>Gold Country guide</b><small>Real towns nearby and their history</small></span></a>
      <p class="fine">Tap <b>Share</b>, then <b>Add to Home Screen</b> to keep this guide on your phone.</p>`);
  }

  function tour() {
    const t = store.get(K.tour, {});
    const mark = (st) => (st === 'done' ? '✓' : st === 'na' ? '–' : st === 'skip' ? '↺' : '');
    view(`${back('home', 'Home')}<h2>The house tour</h2>
      <p class="lede">For your comfort: one stop per room. Every stop can be skipped and saved for later.</p>
      <ul class="list">${R.stations.map((s) => `<li><a href="#tour/${esc(s.id)}"><span>${s.icon} ${esc(s.title)}</span><em>${mark(t[s.id])}</em></a></li>`).join('')}</ul>`);
  }

  function station(id) {
    const s = R.stations.find((x) => x.id === id); if (!s) return tour();
    const chosen = store.get(K.choices, {});
    const lines = s.comfort.filter((c) => fits(c.season)).map((c) => `<p>${esc(c.text)}</p>`).join('');
    const choice = !s.choice ? '' : chosen[s.id]
      ? `<div class="choice"><p><b>${esc(s.choice.prompt)}</b></p><p class="fine">You chose: ${esc(chosen[s.id])}</p>${s.choice.after ? `<p>${esc(s.choice.after)}</p>` : ''}</div>`
      : `<div class="choice"><p><b>${esc(s.choice.prompt)}</b></p>${s.choice.options.map((o, i) => `<button data-act="choose" data-st="${esc(s.id)}" data-i="${i}">${esc(o.label)}</button>`).join('')}</div>`;
    view(`${back('tour', 'Tour')}<h2>${s.icon} ${esc(s.title)}</h2>
      <div class="photos">${s.photos.map((p) => `<img src="img/${esc(p)}" alt="${esc(s.title)}" loading="lazy">`).join('')}</div>
      <p class="notice">${esc(s.notice)}</p>
      <div class="comfort"><h3>For your comfort</h3>${lines}</div>
      ${choice}
      <div class="ask"><h3>Ask about this room</h3><p>The stories behind the pictures and keepsakes here are still being written. Ask your host.</p></div>
      ${bar(`<button data-act="tour" data-st="${esc(s.id)}" data-v="done">I've seen it</button>
        <button class="ghost" data-act="tour" data-st="${esc(s.id)}" data-v="skip">Skip for now</button>
        <button class="ghost" data-act="tour" data-st="${esc(s.id)}" data-v="na">Doesn't apply</button>`)}`);
  }

  // The ending needs the finale found, and every other clue found or reported missing.
  function mysteryDone() {
    const c = store.get(K.clue, {});
    return R.mystery.clues.every((x) => c[x.id] === 'found' || (!x.finale && c[x.id] === 'missing'));
  }

  function mystery() {
    const c = store.get(K.clue, {}); const m = R.mystery;
    const mark = (st) => (st === 'found' ? '✓' : st === 'skip' ? '↺' : st === 'missing' ? '–' : '');
    view(`${back('home', 'Home')}<h2>${esc(m.title)}</h2>
      ${m.intro.map((p) => `<p>${esc(p)}</p>`).join('')}
      <ul class="list">${m.clues.map((x, i) => `<li><a href="#clue/${esc(x.id)}"><span>${i + 1}. ${esc(x.prop)}</span><em>${mark(c[x.id])}</em></a></li>`).join('')}</ul>
      ${letters()}
      ${mysteryDone() ? `<div class="ending">${m.ending.map((p) => `<p>${esc(p)}</p>`).join('')}<a class="door" href="#towns"><span class="i">🧭</span><span><b>Open the Gold Country guide</b></span></a></div>` : ''}`);
  }

  function letters() {
    const c = store.get(K.clue, {});
    const got = R.mystery.clues.filter((x) => c[x.id] === 'found' && clueCfg(x.id) && clueCfg(x.id).letter).map((x) => clueCfg(x.id).letter);
    return got.length ? `<p class="letters">Letters gathered: <b>${got.map(esc).join(' ')}</b></p>` : '';
  }

  // Hints one tap at a time; the place only on its own "Show me where", never unasked.
  function clue(id) {
    const x = R.mystery.clues.find((y) => y.id === id); if (!x) return mystery();
    const cfg = clueCfg(id); const c = store.get(K.clue, {});
    const hints = cfg ? [cfg.hint1, cfg.hint2, cfg.hint3].filter(Boolean) : [];
    const shown = store.get(K.hints, {})[id] || 0;
    let help = '';
    if (!cfg) help = '<p class="fine">Your host is still setting this one up. Skip it for now, or contact your host.</p>';
    else {
      help = hints.slice(0, Math.min(shown, hints.length)).map((h, i) => `<p class="hint">Hint ${i + 1}: ${esc(h)}</p>`).join('');
      if (shown > hints.length && cfg.room) help += `<p class="hint">Where to look: ${esc(cfg.room)}</p>`;
      else if (shown < hints.length) help += `<button class="ghost" data-act="hint" data-c="${esc(id)}">${shown ? 'Another hint' : 'A hint, please'}</button>`;
      else if (cfg.room) help += `<button class="ghost" data-act="hint" data-c="${esc(id)}">Show me where</button>`;
    }
    const found = c[id] === 'found';
    view(`${back('mystery', 'The mystery')}<h2>${esc(x.prop)}</h2>
      <p class="story">${esc(x.story)}</p>${found ? '' : help}
      ${found ? `<p class="found">Found. ${cfg && cfg.letter ? `It gave you the letter <b>${esc(cfg.letter)}</b>.` : ''}</p>` : ''}
      ${bar(found ? '' : `<button data-act="clue" data-c="${esc(id)}" data-v="found">I found it</button>
        <button class="ghost" data-act="clue" data-c="${esc(id)}" data-v="skip">Skip for now</button>
        ${x.finale ? '' : `<button class="ghost" data-act="clue" data-c="${esc(id)}" data-v="missing">It isn't here</button>`}`)}`);
  }

  function townList() {
    if (towns === null) return view(`${back('home', 'Home')}<h2>Gold Country guide</h2><p class="lede">Loading the towns…</p>`);
    const v = store.get(K.towns, {});
    const mins = (t) => parseInt(t.driveTime, 10) || 0;
    const sorted = towns.slice().sort((a, b) => mins(a) - mins(b));
    view(`${back('home', 'Home')}<h2>Gold Country guide</h2>
      <p class="lede">Real places near the ranch. Go there, tap <b>I'm here</b>, and the place opens a little more.</p>
      ${sorted.length ? `<ul class="list">${sorted.map((t) => `<li><a href="#town/${esc(t.id)}"><span>${esc(name(t))}</span><em>${v[t.id] ? '✓' : esc(drive(t))}</em></a></li>`).join('')}</ul>` :
        '<p class="fine">The town list did not load. Check the Wi-Fi and try again.</p>'}`);
  }
  const name = (t) => (t.id === 'bobr_cabin' ? 'Around the ranch' : t.name);
  // Drive times the source marks "TODO verify" (caverns, Big Trees) are shown as "about".
  const UNVERIFIED_DRIVE = ['california_caverns', 'big_trees'];
  const drive = (t) => (UNVERIFIED_DRIVE.includes(t.id) ? 'about ' : '') + t.driveTime.replace(' from BOBR', '');
  // No booking links inside an Airbnb guest's guide (off-platform booking risk): drop any /stay or /book link.
  const guestSites = (t) => (t.sites || []).filter((s) => /^https:\/\//.test(s.url) && !/backofbeyondranch\.farm\/(stay|book)/.test(s.url));

  // Each town check-in offers one quiet choice. Every option gives the same neutral karma.
  const TOWN_CHOICES = [
    { prompt: 'Someone who works here went out of their way to help you.', options: [
      { label: 'Thank them and leave a tip', karma: { neutral: 1, good: 2, bad: 0 } },
      { label: "Head on, you're on a schedule", karma: { neutral: 1, good: 0, bad: 0 } }] },
    { prompt: 'A shortcut across a fenced field would save you ten minutes.', options: [
      { label: 'Take the shortcut', karma: { neutral: 1, good: 0, bad: 2 } },
      { label: 'Stay on the road', karma: { neutral: 1, good: 1, bad: 0 } }] },
    { prompt: 'A small local shop and a big chain store sell the same thing.', options: [
      { label: 'Buy from the local shop', karma: { neutral: 1, good: 2, bad: 0 } },
      { label: 'Grab it at the chain, it is cheaper', karma: { neutral: 1, good: 0, bad: 1 } }] },
  ];
  const townChoice = (id) => TOWN_CHOICES[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % TOWN_CHOICES.length];

  function town(id) {
    if (towns === null) return view(`${back('towns', 'Gold Country guide')}<p class="lede">Loading…</p>`);
    const t = towns.find((x) => x.id === id); if (!t) return townList();
    const v = store.get(K.towns, {}); const chosen = store.get(K.choices, {}); const ch = townChoice(id);
    const lat = Number(t.coordinates.lat), lng = Number(t.coordinates.lng);
    const sites = guestSites(t);
    view(`${back('towns', 'Gold Country guide')}<h2>${esc(name(t))}</h2>
      <p class="fine">${esc(drive(t))}</p>
      <p class="fine">Told first as a traveler in 1849 would see it, with a little story. The "Later" and "Now" parts are the history since.</p>
      <p>${esc(t.description)}</p>
      ${sites.length ? `<h3>Read more</h3><ul class="links">${sites.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join('')}</ul>` : ''}
      <p><a class="button" href="https://www.google.com/maps/dir/?api=1&amp;destination=${lat},${lng}" target="_blank" rel="noopener">Directions in Google Maps</a></p>
      ${v[id] ? '<p class="found">You\'ve been here.</p>' + (chosen['town:' + id]
        ? `<div class="choice"><p><b>${esc(ch.prompt)}</b></p><p class="fine">You chose: ${esc(chosen['town:' + id])}</p></div>`
        : `<div class="choice"><p><b>${esc(ch.prompt)}</b></p>${ch.options.map((o, i) => `<button data-act="tchoose" data-t="${esc(id)}" data-i="${i}">${esc(o.label)}</button>`).join('')}</div>`)
        : `<button data-act="here" data-t="${esc(id)}">I'm here</button><p class="fine">Uses your phone's location once, only if you allow it. Nothing is sent anywhere.</p>`}
      <p class="fine" id="geo"></p>`);
  }

  function km(a, b) {
    const r = (d) => (d * Math.PI) / 180, R0 = 6371;
    const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
    return 2 * R0 * Math.asin(Math.sqrt(h));
  }

  function contact() {
    if (document.querySelector('.sheet')) return;
    const d = document.createElement('div'); d.className = 'sheet';
    d.innerHTML = `<div><h3>Contact your host</h3><p>${esc(R.contactHost)}</p><button data-act="close">OK</button></div>`;
    document.body.appendChild(d);
  }

  // ------------------------------------------------------------ actions
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'contact') return contact();
    if (a === 'close') return b.closest('.sheet').remove();
    if (a === 'tour') {
      const t = store.get(K.tour, {}); t[b.dataset.st] = b.dataset.v; store.set(K.tour, t);
      if (b.dataset.v === 'done') addKarmaOnce('tour:' + b.dataset.st, { neutral: 1 });
      return (location.hash = '#tour');
    }
    if (a === 'choose') {
      const s = R.stations.find((x) => x.id === b.dataset.st); const o = s.choice.options[+b.dataset.i];
      const ch = store.get(K.choices, {}); if (ch[s.id]) return; ch[s.id] = o.label; store.set(K.choices, ch);
      addKarmaOnce('choice:' + s.id, o.karma); return station(s.id);
    }
    if (a === 'hint') { const h = store.get(K.hints, {}); h[b.dataset.c] = (h[b.dataset.c] || 0) + 1; store.set(K.hints, h); return clue(b.dataset.c); }
    if (a === 'clue') {
      const c = store.get(K.clue, {}); if (c[b.dataset.c] === 'found') return;
      c[b.dataset.c] = b.dataset.v; store.set(K.clue, c);
      if (b.dataset.v === 'found') { addKarmaOnce('clue:' + b.dataset.c, { neutral: 2 }); return clue(b.dataset.c); }
      return (location.hash = '#mystery');
    }
    if (a === 'here') {
      const id = b.dataset.t; const t = towns.find((x) => x.id === id); const g = $('#geo');
      if (!navigator.geolocation) { g.textContent = 'This phone cannot share its location.'; return; }
      g.textContent = 'Checking…';
      const stillHere = () => location.hash === '#town/' + id;
      navigator.geolocation.getCurrentPosition((p) => {
        const d = km({ lat: p.coords.latitude, lng: p.coords.longitude }, t.coordinates);
        if (d <= 3) {
          const v = store.get(K.towns, {}); if (!v[id]) { v[id] = Date.now(); store.set(K.towns, v); addKarmaOnce('town:' + id, { neutral: 3 }); }
          if (stillHere()) town(id);
        } else if (stillHere()) $('#geo').textContent = `You're about ${Math.round(d * 0.621)} miles away. Tap again when you arrive.`;
      }, () => { if (stillHere()) $('#geo').textContent = 'Location was not shared, and that is fine. The history is still here to read.'; },
      { timeout: 15000, maximumAge: 60000 });
    }
    if (a === 'tchoose') {
      const id = b.dataset.t; const ch = store.get(K.choices, {}); if (ch['town:' + id]) return;
      const o = townChoice(id).options[+b.dataset.i];
      ch['town:' + id] = o.label; store.set(K.choices, ch); addKarmaOnce('tchoice:' + id, o.karma); return town(id);
    }
  });

  // ------------------------------------------------------------ router
  function route() {
    const [p, arg] = (location.hash.replace(/^#/, '') || 'home').split('/');
    if (p === 'tour') return arg ? station(arg) : tour();
    if (p === 'mystery') return mystery();
    if (p === 'clue') return clue(arg);
    if (p === 'towns') return townList();
    if (p === 'town') return town(arg);
    return home();
  }
  window.addEventListener('hashchange', route);
  renderKarma(); route();                                   // draw at once, even on a weak signal
  withTimeout(Promise.all([townsReady, hostReady]), 8000).then(() => { if (towns === null) towns = []; route(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
