/* ==========================================================================
   EASYLEADS CLIENT DASHBOARD
   A read-only view of a client's Easyleads (GoHighLevel) account. Accounts are
   created by EDGE in the SEO tool; the data comes through the EDGE tracker
   (Apps Script, tracker/portal.gs), which holds the GoHighLevel token. Nothing
   here can change anything in GoHighLevel.
   ========================================================================== */
(function(){
'use strict';
const API = (window.PORTAL_CONFIG || {}).api || '';
const BRAND = (window.PORTAL_CONFIG || {}).brand || 'Easyleads';
const app = document.getElementById('app');
const SKEY = 'el_portal_session';
const LAYOUT_V = 3;
const ls = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = n => (Number(n) || 0).toLocaleString('en-CA');
const money = n => (Number(n) || 0).toLocaleString('en-CA', {style: 'currency', currency: 'CAD', maximumFractionDigits: 0});
const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 + '%' : '—';
const day = 86400000;
const iso = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fullDate = t => new Date(t).toLocaleString('en-CA', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'});
const when = t => {
  if (!t) return '';
  const d = Date.now() - t;
  if (d >= 0 && d < 60000) return 'just now';
  if (d >= 0 && d < 3600000) return Math.round(d / 60000) + ' min ago';
  if (d >= 0 && d < day && new Date(t).getDate() === new Date().getDate()) return 'today, ' + new Date(t).toLocaleTimeString('en-CA', {hour: 'numeric', minute: '2-digit'});
  return new Date(t).toLocaleString('en-CA', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
};
const relDay = t => { const a = new Date(); a.setHours(0, 0, 0, 0); const d = Math.floor((a.getTime() - new Date(t).setHours(0, 0, 0, 0)) / day); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 7 ? d + ' days ago' : new Date(t).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'}); };
const dur = s => { s = Number(s) || 0; return s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's'; };
const initials = s => String(s || '?').trim().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || '?';
const AV = ['#2563eb', '#7c3aed', '#0e9f6e', '#d97706', '#db2777', '#0891b2', '#4f46e5', '#b45309', '#059669', '#9333ea', '#0284c7', '#be123c'];
const hue = s => { let h = 0; String(s || '').split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return AV[h % AV.length]; };
const uid = () => 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/* ---------- icons ---------- */
const P = {
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  form: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
  users: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  cal: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  money: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  line: 'M3 3v18h18M7 15l4-4 3 3 6-7',
  bars: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  donut: 'M12 3a9 9 0 1 0 9 9h-9zM15 3.5A9 9 0 0 1 20.5 9H15z',
  funnel: 'M3 4h18l-7 9v6l-4 2v-8z',
  in: 'M17 7 7 17M7 8v9h9', out: 'M7 17 17 7M8 7h9v9', missed: 'M3 3l18 18M17 7 7 17',
  plus: 'M12 5v14M5 12h14', send: 'M4.5 12 20 4.5 15.5 20l-3.2-6.3zM12.3 13.7 20 4.5', x: 'M6 6l12 12M18 6 6 18', grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4', bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  source: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  inbox: 'M3 13h5l2 3h4l2-3h5M5 5h14l2 8v6H3v-6z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
  down: 'M6 9l6 6 6-6', dl: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  reply: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v4',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  book: 'M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM18 20a2 2 0 0 0 2-2V6',
  out2: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5', eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  move: 'M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3', size: 'M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6', check: 'M5 12l5 5 9-10', clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  chev: 'M9 6l6 6-6 6', chevl: 'M15 6l-6 6 6 6', spark: 'M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z'
};
const ic = (k, sz) => '<svg viewBox="0 0 24 24" width="' + (sz || 18) + '" height="' + (sz || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (P[k] || P.grid) + '"/></svg>';

/* ---------- loading pieces ---------- */
const SK = {
  list: n => '<div class="list">' + Array.from({length: n || 5}, () => '<div class="sk-row"><div class="sk av"></div><div class="lines"><div class="sk l1"></div><div class="sk l2"></div></div></div>').join('') + '</div>',
  kpis: n => '<div class="sk-kpis">' + Array.from({length: n || 5}, () => '<div class="sk"></div>').join('') + '</div>',
  chart: () => '<div class="sk chart"></div><div style="display:flex;gap:12px;margin-top:12px"><div class="sk" style="height:10px;width:90px"></div><div class="sk" style="height:10px;width:70px"></div></div>',
  inbox: () => SK.kpis(4) + '<div class="sk" style="height:44px;margin:14px 0;border-radius:14px"></div><div class="ib-body"><div>' + SK.list(4) + '</div><div>' + Array.from({length: 3}, () => '<div class="sk" style="height:104px;border-radius:16px;margin-bottom:10px"></div>').join('') + '</div></div>',
  table: () => '<div class="sk" style="height:42px;border-radius:14px;margin-bottom:12px"></div>' + SK.list(7),
  note: () => '<div class="sk" style="height:12px;width:92%"></div><div class="sk" style="height:12px;width:80%;margin-top:9px"></div><div class="sk" style="height:12px;width:64%;margin-top:9px"></div>'
};
function veil(text){
  const v = document.createElement('div'); v.className = 'veil';
  v.innerHTML = '<div class="box"><span class="spin"></span><span>' + esc(text) + '</span></div>';
  document.body.appendChild(v);
  return {set(t){ v.querySelector('.box span:last-child').textContent = t; }, done(){ v.remove(); }};
}

/* ---------- API ---------- */
async function api(action, body){
  if (!API) throw new Error('This dashboard isn’t set up yet.');
  const res = await fetch(API, {method: 'POST', body: JSON.stringify(Object.assign({action}, body || {})), redirect: 'follow'});
  if (!res.ok) throw new Error('The server answered ' + res.status + '. Try again in a moment.');
  const j = await res.json();
  if (j && j.error === 'signedout' && action !== 'portalLogin'){ signOut(true); throw new Error('Please sign in again.'); }
  return j;
}

/* ---------- state & periods ---------- */
const S = {session: null, me: null, domain: '', period: '30', dash: 0, editing: false, cache: {}, layout: null, ui: {}};
const PERIODS = [['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['month', 'This month'], ['lastmonth', 'Last month']];
function range(p){
  p = p || S.period;
  const now = new Date(), end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'month') return {s: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), e: end.getTime()};
  if (p === 'lastmonth') return {s: new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(), e: new Date(now.getFullYear(), now.getMonth(), 0).getTime()};
  const n = Number(p) || 30;
  return {s: end.getTime() - (n - 1) * day, e: end.getTime()};
}
/* The period before, the same length, to compare with. */
function prevRange(p){
  p = p || S.period;
  const r = range(p);
  if (p === 'month'){ const s = new Date(r.s); const ps = new Date(s.getFullYear(), s.getMonth() - 1, 1); const last = new Date(s.getFullYear(), s.getMonth(), 0); const e = new Date(ps.getFullYear(), ps.getMonth(), Math.min(new Date(r.e).getDate(), last.getDate())); return {s: ps.getTime(), e: e.getTime()}; }
  if (p === 'lastmonth'){ const s = new Date(r.s); return {s: new Date(s.getFullYear(), s.getMonth() - 1, 1).getTime(), e: new Date(s.getFullYear(), s.getMonth(), 0).getTime()}; }
  const len = r.e - r.s + day;
  return {s: r.s - len, e: r.s - day};
}
const inR = (x, r) => x.at >= r.s && x.at < r.e + day;
/* One request covers this period and the one before, so every widget can show the change. */
/* A small key-value store in IndexedDB. localStorage on this site is nearly full with the
   tool's own saved state (about 5 MB), so copies kept there never fit; IndexedDB has room. */
const kv = (() => {
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => { try{ const r = indexedDB.open('edge-cache', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }catch(e){ rej(e); } }).catch(() => null));
  const tx = (mode, fn) => db().then(d => d ? new Promise(res => { try{ const t = d.transaction('kv', mode), q = fn(t.objectStore('kv')); t.oncomplete = () => res(q ? q.result : undefined); t.onerror = t.onabort = () => res(undefined); }catch(e){ res(undefined); } }) : undefined);
  const each = (prefix, drop) => tx('readwrite', s => { const r = s.openCursor(); r.onsuccess = () => { const c = r.result; if (!c) return; if (String(c.key).indexOf(prefix) === 0 && drop(c.value)) c.delete(); c.continue(); }; return null; });
  return {
    get: k => tx('readonly', s => s.get(k)),
    set: (k, v) => tx('readwrite', s => { s.put(v, k); return null; }),
    del: k => tx('readwrite', s => { s.delete(k); return null; }),
    clear: prefix => each(prefix, () => true),
    prune: (prefix, age) => each(prefix, v => !v || !v.at || Date.now() - v.at > age)
  };
})();
/* This browser's last copy of each widget's data (per person, per business, per period).
   A widget draws from it straight away; the live answer is fetched behind it and the
   widget redraws only if something changed. Kept 4 days; signing out clears it. */
const LKEY = 'el_d1|';
const sigOf = j => { const s = JSON.stringify(Object.assign({}, j, {at: 0, stale: 0})); let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return s.length + ':' + (h >>> 0); };
setTimeout(() => kv.prune(LKEY, 4 * day), 8000);
const fresh = kind => { const domain = S.domain; setTimeout(() => { try{ window.dispatchEvent(new CustomEvent('el-fresh', {detail: {kind, domain}})); }catch(e){} }, 0); };
/* Appointments, Search Console and AI visibility are asked for this period only: the last two carry
   their own earlier days for the comparison, and totals (searches, pages, AI Overview checks) with no date. */
const ONE_K = {appts: 1, gsc: 1, ai: 1};
const shape = (kind, j, cur, prev) => { const all = j.rows || []; return {all, rows: ONE_K[kind] ? all : all.filter(x => inR(x, cur)), prev: ONE_K[kind] ? [] : all.filter(x => inR(x, prev)), extra: j.extra || null, at: j.at}; };
/* One request covers this period and the one before, so every widget can show the change. */
/* What is already loaded for a kind of data, to draw at once (no loading flash); ok = still fresh. */
function getNow(kind, p){
  const cur = range(p), prev = ONE_K[kind] ? cur : prevRange(p);
  const c = S.cache[[S.domain, kind, iso(prev.s), iso(cur.e)].join('|')];
  return c && c.v !== undefined ? {v: c.v, ok: c.vp === c.p && Date.now() - c.at < 4 * 60000} : null;
}
function get(kind, p){
  const cur = range(p), prev = ONE_K[kind] ? cur : prevRange(p);
  const k = [S.domain, kind, iso(prev.s), iso(cur.e)].join('|');
  const c = S.cache[k];
  if (c && Date.now() - c.at < 4 * 60000) return c.p;
  const body = {session: S.session, domain: S.domain, kind, start: iso(prev.s), end: iso(cur.e)};
  const lk = LKEY + ((S.me && S.me.user && S.me.user.email) || '') + '|' + k;
  const check = j => { if (j.error){ const e = new Error(j.error); e.code = j.error; e.scope = j.scope; throw e; } return j; };
  const keep = j => { const sig = sigOf(j); kv.set(lk, {at: Date.now(), sig, j}); return sig; };
  /* The tracker may answer first with its last copy (stale); then it's asked for the live numbers. */
  const live = api('portalData', body).then(check).then(j => ({j, more: j.stale ? api('portalData', Object.assign({fresh: 1}, body)).then(check) : null}));
  live.catch(() => {});
  let shown = '';
  const swap = j => { const sig = keep(j); if (sig !== shown){ shown = sig; const val = shape(kind, j, cur, prev), p2 = Promise.resolve(val); S.cache[k] = {at: Date.now(), p: p2, v: val, vp: p2}; fresh(kind); } };
  const pr = kv.get(lk).then(had => {
    const mine = had && had.j && had.sig && Date.now() - had.at < 4 * day ? had : null;
    if (mine){
      shown = mine.sig;
      live.then(x => { swap(x.j); if (x.more) x.more.then(swap).catch(() => {}); }).catch(() => {});
      return shape(kind, mine.j, cur, prev);
    }
    return live.then(x => { shown = keep(x.j); if (x.more) x.more.then(swap).catch(() => {}); return shape(kind, x.j, cur, prev); });
  });
  const old = S.cache[k];
  S.cache[k] = {at: Date.now(), p: pr, v: old ? old.v : undefined, vp: null};
  pr.then(v => { const c2 = S.cache[k]; if (c2 && c2.p === pr){ c2.v = v; c2.vp = pr; } }, () => {});
  pr.catch(() => { if (S.cache[k] && S.cache[k].p === pr) delete S.cache[k]; });
  return pr;
}
function delta(a, b){
  if (!b && !a) return '<span class="delta flat">–</span>';
  if (!b) return '<span class="delta up">new</span>';
  const d = Math.round((a - b) / b * 100);
  if (!d) return '<span class="delta flat">0%</span>';
  return '<span class="delta ' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '▲ ' : '▼ ') + Math.abs(d) + '%</span>';
}

/* ---------- lead source (channel) and location ---------- */
const CH = [['Organic', '#16a37a', /^organic search$/i], ['Paid', '#eda100', /^paid/i], ['Direct', '#2a78d6', /^direct$/i], ['Social', '#d6409f', /social/i],
  ['Email', '#7c3aed', /^e-?mail$/i], ['Referral', '#e8590c', /^referral$/i], ['AI assistants', '#0891b2', /^ai/i], ['Website', '#0ea5e9', /^website$/i], ['Phone', '#0f9d6b', /phone/i]];
const chGroup = ch => { const s = String(ch || ''); if (!s || /not tracked|not recorded/i.test(s)) return 'Not recorded'; const g = CH.find(x => x[2].test(s)); return g ? g[0] : 'Other'; };
const chColor = k => (CH.find(x => x[0] === k) || [0, k === 'Not recorded' ? '#c3ccd3' : '#64748b'])[1];
const PROV = {AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick', NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories', NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan', YT: 'Yukon'};
const tidy = v => { v = String(v || '').trim().replace(/\s+/g, ' '); if (!v || v.length > 60) return ''; if (/^[A-Z]{2}$/.test(v) && PROV[v]) return PROV[v]; return v.split(' ').map(w => w.length > 2 && w === w.toUpperCase() ? cap(w.toLowerCase()) : cap(w)).join(' '); };
const fieldOf = (r, re) => { const f = (r.fields || []).find(x => re.test(x[0]) && String(x[1]).trim()); return f ? f[1] : ''; };
function cityOf(r){
  if (r._city != null) return r._city;
  let v = fieldOf(r, /^(city|town|location|office|branch|nearest (office|location|city|town)|closest (city|town|office)|preferred (office|location)|which (office|location)|service area)\b/i);
  if (!v){
    const p = String(r.page || '').split('?')[0].replace(/\/+$/, '').split('/').filter(Boolean);
    if (p.length >= 2 && /contact|location|office|branch|area|cit(y|ies)|service-area/i.test(p[p.length - 2])) v = p[p.length - 1].replace(/[-_]+/g, ' ');
  }
  if (!v && r.city) v = r.city;
  return (r._city = tidy(v));
}
function regionOf(r){
  let v = fieldOf(r, /^(province|state|region|province\/state|state\/province)\b/i) || r.state || '';
  v = tidy(v);
  return PROV[String(v).toUpperCase()] || v;
}
const pathOf = r => { const p = String(r.page || '').split('?')[0]; return p || ''; };

/* ---------- widgets ---------- */
const T = {web: '#0086ff', forms: '#1d7cf2', calls: '#0f9d6b', contacts: '#7c3aed', opps: '#d97706', appts: '#db2777', mix: '#14b8a6', email: '#6d5cf6', loc: '#e8590c'};
const W = {
  kpis: {g: 'Overview', t: 'At a glance', d: 'Leads, calls, new contacts, bookings and pipeline, compared with the period before.', ic: 'bolt', tint: T.mix, c: 12, sk: 'kpis', needs: ['forms', 'calls', 'contacts', 'appts', 'opps', 'ga'], soft: true, ds: 'Form leads and calls from your website, compared with the period before.', draw: drawKpis},
  inbox: {g: 'Leads', t: 'Lead inbox', d: 'Every form submission in one searchable inbox: filter by city, source, form and page.', ic: 'inbox', tint: '#0f7a58', c: 12, sk: 'inbox', needs: ['forms'], draw: drawInbox},
  trend: {g: 'Leads', t: 'Leads over time', d: 'Form submissions, calls and new contacts, day by day.', ic: 'line', tint: T.forms, c: 8, sk: 'chart', needs: ['forms', 'calls', 'contacts'], soft: true, ds: 'Form leads and calls from your website, day by day.', draw: drawTrend},
  sources: {g: 'Leads', t: 'Lead sources', d: 'Where your form leads came from: organic, paid, direct, social and more.', ic: 'donut', tint: '#16a37a', c: 4, sk: 'chart', needs: ['forms'], draw: drawSources},
  near_city: {g: 'Leads', t: 'Leads by nearest city', d: 'Each lead’s nearest city, and the channel it came through: organic, paid, direct and more.', ds: 'Each lead’s nearest city, and the channel it came through: organic, paid, direct and more.', ic: 'pin', tint: '#0b8fa3', c: 12, sk: 'list', needs: ['forms'], only: ['kcbdesignbuild.com'], draw: drawNearCity},
  locations: {g: 'Leads', t: 'Where leads come from', d: 'Leads by city and by province, with the change from the period before.', ic: 'pin', tint: T.loc, c: 6, sk: 'list', needs: ['forms', 'contacts'], soft: true, draw: drawLocations},
  forms_by: {g: 'Leads', t: 'Leads by form', d: 'Which forms bring in the most leads.', ic: 'bars', tint: T.forms, c: 6, sk: 'list', needs: ['forms'], draw: drawFormsBy},
  pages: {g: 'Leads', t: 'Top pages for leads', d: 'The pages people were on when they sent a form.', ic: 'book', tint: '#0891b2', c: 6, sk: 'list', needs: ['forms'], draw: drawPages},
  email: {g: 'Marketing', t: 'Email marketing', d: 'Campaigns that went out, how many were delivered, who replied, and the leads and pipeline that came from email.', ic: 'mail', tint: T.email, c: 12, sk: 'inbox', needs: ['emails', 'forms', 'contacts', 'opps'], soft: true, el: true, draw: drawEmail},
  calls_mix: {g: 'Calls', t: 'Calls answered vs missed', d: 'How many calls were answered, missed or went to voicemail.', ic: 'donut', tint: T.calls, c: 4, sk: 'chart', needs: ['calls'], draw: drawCallMix},
  calls_list: {g: 'Calls', t: 'Recent calls', d: 'Inbound and outbound calls with their status and length.', ic: 'phone', tint: T.calls, c: 6, sk: 'list', needs: ['calls'], draw: drawCalls},
  forms_list: {g: 'Leads', t: 'Latest form submissions', d: 'A compact list of the newest submissions.', ic: 'form', tint: T.forms, c: 6, sk: 'list', needs: ['forms'], draw: drawForms},
  contacts_list: {g: 'Contacts', t: 'New contacts', d: 'People added to your account in the period.', ic: 'users', tint: T.contacts, c: 6, sk: 'list', needs: ['contacts'], draw: drawContacts},
  people: {g: 'Contacts', t: 'Contact list', d: 'Your full contact list: search anyone by name, email, phone or company.', ic: 'users', tint: '#4f46e5', c: 12, sk: 'table', needs: [], el: true, draw: drawPeople},
  pipeline: {g: 'Sales', t: 'Pipeline by stage', d: 'Open opportunities in each stage, with their value.', ic: 'funnel', tint: T.opps, c: 6, sk: 'list', needs: ['opps'], draw: drawPipeline},
  opps_list: {g: 'Sales', t: 'Latest opportunities', d: 'New and updated deals, with value and status.', ic: 'money', tint: T.opps, c: 6, sk: 'list', needs: ['opps'], draw: drawOpps},
  appts: {g: 'Sales', t: 'Appointments', d: 'Upcoming bookings, and the ones in the period.', ic: 'cal', tint: T.appts, c: 6, sk: 'list', needs: ['appts'], draw: drawAppts},
  web_kpis: {g: 'Website', t: 'Website at a glance', d: 'Visits, visitors, page views and how many visits turned into leads, from Google Analytics.', ic: 'source', tint: '#0086ff', c: 12, sk: 'kpis', needs: ['ga', 'forms'], soft: true, ga: true, draw: drawWebKpis},
  web_trend: {g: 'Website', t: 'Visits and leads over time', d: 'Website visits day by day, with the leads they brought in.', ic: 'line', tint: '#0086ff', c: 8, sk: 'chart', needs: ['ga', 'forms'], soft: true, ga: true, draw: drawWebTrend},
  web_sources: {g: 'Website', t: 'Where visitors come from', d: 'Visits by channel: search, ads, social, email, other sites and direct.', ic: 'donut', tint: '#16a37a', c: 4, sk: 'chart', needs: ['ga'], ga: true, draw: drawWebSources},
  web_pages: {g: 'Website', t: 'Most visited pages', d: 'The pages people look at most, with how many people saw each.', ic: 'book', tint: '#0891b2', c: 6, sk: 'list', needs: ['ga'], ga: true, draw: drawWebPages},
  sc_kpis: {g: 'Google Search', t: 'Google Search at a glance', d: 'Clicks, impressions, click rate and average position on Google, from Search Console.', ic: 'search', tint: '#1a73e8', c: 12, sk: 'kpis', needs: ['gsc'], gsc: true, draw: drawScKpis},
  sc_trend: {g: 'Google Search', t: 'Clicks from Google over time', d: 'Clicks from Google search day by day, with the leads that came from search.', ic: 'line', tint: '#1a73e8', c: 8, sk: 'chart', needs: ['gsc', 'forms'], soft: true, gsc: true, draw: drawScTrend},
  sc_devices: {g: 'Google Search', t: 'Search clicks by device', d: 'Phone, computer or tablet: how people searching on Google reach the site.', ic: 'donut', tint: '#16a37a', c: 4, sk: 'chart', needs: ['gsc'], gsc: true, draw: drawScDevices},
  sc_queries: {g: 'Google Search', t: 'What people search for', d: 'The Google searches the site showed up for, with clicks, impressions, click rate and position.', ic: 'search', tint: '#1a73e8', c: 12, sk: 'list', needs: ['gsc'], gsc: true, draw: drawScQueries},
  sc_almost: {g: 'Google Search', t: 'Almost on page one', d: 'Searches where the site sits just below the top results: the quickest wins.', ic: 'target', tint: '#d97706', c: 6, sk: 'list', needs: ['gsc'], gsc: true, draw: drawScAlmost},
  sc_pages: {g: 'Google Search', t: 'Pages Google sends people to', d: 'The pages that get the most clicks from Google search.', ic: 'book', tint: '#0891b2', c: 6, sk: 'list', needs: ['gsc'], gsc: true, draw: drawScPages},
  sc_countries: {g: 'Google Search', t: 'Search clicks by country', d: 'Where the people clicking through from Google are.', ic: 'pin', tint: T.loc, c: 6, sk: 'list', needs: ['gsc'], gsc: true, draw: drawScCountries},
  ai_kpis: {g: 'AI visibility', t: 'AI visibility at a glance', d: 'Visits and leads from ChatGPT, Perplexity, Gemini, Copilot and Claude, and how often Google’s AI Overviews mention the business.', ic: 'bolt', tint: '#7c3aed', c: 12, sk: 'kpis', needs: ['ai', 'forms'], soft: true, ai: true, draw: drawAiKpis},
  ai_trend: {g: 'AI visibility', t: 'Visits from AI assistants over time', d: 'Visits from AI assistants day by day, with the leads they brought in.', ic: 'line', tint: '#7c3aed', c: 8, sk: 'chart', needs: ['ai', 'forms'], soft: true, ai: true, draw: drawAiTrend},
  ai_assistants: {g: 'AI visibility', t: 'Which AI assistants send visitors', d: 'Visits by assistant: ChatGPT, Perplexity, Gemini, Copilot, Claude and others.', ic: 'donut', tint: '#7c3aed', c: 4, sk: 'chart', needs: ['ai'], ai: true, draw: drawAiAssistants},
  ai_overviews: {g: 'AI visibility', t: 'Google AI Overviews', d: 'For each tracked search: whether Google showed an AI Overview, and whether it cited or named the business.', ic: 'search', tint: '#1baf7a', c: 12, sk: 'list', needs: ['ai'], ai: true, draw: drawAiOverviews},
  ai_pages: {g: 'AI visibility', t: 'Pages AI assistants send people to', d: 'Where visitors from AI assistants land on the site.', ic: 'book', tint: '#0891b2', c: 6, sk: 'list', needs: ['ai'], ai: true, draw: drawAiPages},
  ai_leads: {g: 'AI visibility', t: 'Leads from AI assistants', d: 'Form leads from people who came from ChatGPT, Perplexity, Gemini, Copilot or Claude.', ic: 'form', tint: '#7c3aed', c: 6, sk: 'list', needs: ['forms'], ai: true, draw: drawAiLeads},
  web_cities: {g: 'Website', t: 'Where visitors are', d: 'Visitors by city, from Google Analytics.', ic: 'pin', tint: T.loc, c: 6, sk: 'list', needs: ['ga'], ga: true, draw: drawWebCities},
  crm_kpis: {g: 'Clients', t: 'Clients at a glance', d: 'Open pipeline, jobs won, win rate, how fast new leads get a first reply, and follow-ups that are late.', ic: 'bolt', tint: '#0f7a58', c: 12, sk: 'kpis', needs: ['forms'], draw: drawCrmKpis},
  crm_board: {g: 'Clients', t: 'Client pipeline', d: 'Every person who reached out, as a card: drag them from New lead to Contacted, Quote sent, Booked, Won or Lost. Your whole team sees it live.', ic: 'grid', tint: '#4f46e5', c: 12, sk: 'table', needs: ['forms'], draw: drawCrmBoard},
  crm_follow: {g: 'Clients', t: 'Follow-ups', d: 'Who to call back today, what is late, and new leads still waiting for a first reply.', ic: 'clock', tint: '#d9820b', c: 12, sk: 'list', needs: ['forms'], draw: drawCrmFollow},
  crm_clients: {g: 'Clients', t: 'Client list', d: 'One row per person across every form they sent: stage, job value, owner, first and latest request. Export to CSV.', ic: 'users', tint: '#0891b2', c: 12, sk: 'table', needs: ['forms'], draw: drawCrmClients},
  ghl_deals: {g: 'Sales desk', t: 'Deals pipeline', d: 'Your Easyleads pipeline: drag a deal to another stage, mark it won or lost, change its value or create a new one. Every change is made in Easyleads right away.', ic: 'funnel', tint: '#1d7cf2', c: 12, sk: 'table', needs: [], wr: true, draw: drawGhlDeals},
  ghl_contacts: {g: 'Sales desk', t: 'Contacts desk', d: 'Search any contact, then edit details, tags and notes, add tasks, book or move appointments and send a text or email, right in Easyleads.', ic: 'users', tint: '#0b5fd0', c: 12, sk: 'list', needs: [], wr: true, draw: drawGhlContacts},
  ghl_pipe: {g: 'Sales desk', t: 'Pipeline summary', d: 'Open pipeline value, deals won this month, win rate and new deals, with the count and value in every stage. Live from Easyleads.', ic: 'bars', tint: '#7c3aed', c: 12, sk: 'kpis', needs: [], wr: true, draw: drawGhlPipe},
  ghl_tasks: {g: 'Sales desk', t: 'Tasks due', d: 'Every open task in Easyleads: overdue, due today and coming up. Tick one off and it’s done in Easyleads.', ic: 'check', tint: '#0f9d6b', c: 6, sk: 'list', needs: [], wr: true, draw: drawGhlTasks},
  ghl_appts: {g: 'Sales desk', t: 'Appointments', d: 'Today’s bookings on every Easyleads calendar. Confirm, mark a no-show, move or cancel right here.', ic: 'cal', tint: '#0891b2', c: 6, sk: 'list', needs: [], wr: true, draw: drawGhlAppts},
  ghl_convs: {g: 'Sales desk', t: 'Conversations', d: 'The latest texts and emails with your contacts. See who is waiting for a reply and answer without leaving the dashboard.', ic: 'inbox', tint: '#1d7cf2', c: 12, sk: 'list', needs: [], wr: true, draw: drawGhlConvs},
  ghl_camp: {g: 'Sales desk', t: 'Campaigns', d: 'Write a text or email campaign, choose who gets it by tags, preview it for each person and send it through Easyleads.', ic: 'send', tint: '#db2777', c: 12, sk: 'list', needs: [], wr: 2, draw: drawGhlCamp},
  note: {g: 'Text', t: 'Heading & summary', d: 'A heading and a short write-up. Attach it to a widget and it explains that widget’s numbers in plain words.', ic: 'spark', tint: '#475569', c: 12, sk: 'note', needs: [], draw: drawNote}
};
/* Where this business's data comes from: its Easyleads account, or the EDGE tracker (website forms, phone taps). */
const SITE_K = {forms: 1, calls: 1};
const srcOf = () => ((S.me && S.me.clients.find(c => c.domain === S.domain)) || {}).source || 'easyleads';
const gaOn = () => !!((S.me && S.me.clients.find(c => c.domain === S.domain)) || {}).ga;
const gscOn = () => !!((S.me && S.me.clients.find(c => c.domain === S.domain)) || {}).gsc;
const aiOn = () => !!((S.me && S.me.clients.find(c => c.domain === S.domain)) || {}).ai;
const kOn = k => k === 'ga' ? gaOn() : k === 'gsc' ? gscOn() : k === 'ai' ? aiOn() : null;
const okFor = t => { const w = W[t]; if (!w) return false; if (w.only && w.only.indexOf(S.domain) < 0) return false; if (w.wr) return canGhl() && ghLv() >= (w.wr === true ? 1 : w.wr); if (w.ga) return gaOn(); if (w.gsc) return gscOn(); if (w.ai) return aiOn(); if (t === 'note' || srcOf() === 'easyleads') return true; if (w.el) return false; return w.soft ? w.needs.some(k => SITE_K[k]) : w.needs.every(k => SITE_K[k]); };
const needsOf = it => it.t === 'note' ? (it.about && W[it.about] && it.about !== 'note' ? W[it.about].needs : []) : W[it.t].needs;
/* Anything a business can't have yet is left out of its report entirely (it stays in the layout, so it shows up by itself once available). */
const visIt = it => it.t === 'note' ? (!it.about || okFor(it.about)) : okFor(it.t);
const visDash = d => d.items.some(it => it.t !== 'note' && visIt(it));
const arranging = () => !!(S.editing && canEdit());
const dashList = () => { const L = layout(); const v = arranging() ? L.dashes : L.dashes.filter(visDash); return v.length ? v : L.dashes.slice(0, 1); };
const curDash = () => { const L = layout(), v = dashList(), d = L.dashes[Math.min(S.dash, L.dashes.length - 1)]; return v.indexOf(d) >= 0 ? d : v[0]; };
const item = (t, c, x) => Object.assign({id: uid(), t, c: c || W[t].c}, x || {});
/* The standard dashboards. Every row fills the full width and the widgets side by side share one
   height, so the grid lines up; each tab opens with a heading and a plain-words summary of its
   numbers. Overview and Leads work for every business; Marketing and Sales need Easyleads. */
const DEFAULT_DASHES = src => {
  const H = 440;
  const base = [
    {id: 'd1', name: 'Overview', items: [
      item('note', 12, {title: 'Your business at a glance', about: 'kpis', text: 'The headline numbers for the period picked at the top, compared with the period before.'}),
      item('kpis'),
      item('trend', 8, {h: 420}), item('sources', 4, {h: 420}),
      item('locations', 6, {h: H}), item('forms_by', 6, {h: H}),
      item('forms_list', 6, {h: H}), item('calls_list', 6, {h: H})]},
    {id: 'd2', name: 'Leads', items: [
      item('note', 12, {title: 'Every lead in one place', about: 'inbox', text: 'Search and filter every form submission by city, source, form and page. Click a lead to see everything they sent.'}),
      item('inbox'),
      item('pages', 6, {h: H}), item('calls_mix', 6, {h: H})]}
  ];
  if ((src || srcOf()) === 'site') return base;
  return base.concat([
    {id: 'd3', name: 'Marketing', items: [
      item('note', 12, {title: 'Email marketing', about: 'email', text: 'Every campaign that went out, how many were delivered, who replied, and the leads and pipeline that came from email.'}),
      item('email'),
      item('contacts_list', 6, {h: 460}), item('sources', 6, {h: 460})]},
    {id: 'd4', name: 'Sales', items: [
      item('note', 12, {title: 'Sales pipeline', about: 'pipeline', text: 'Open deals by stage with their value, the newest opportunities, and the bookings coming up.'}),
      item('pipeline', 6, {h: 460}), item('opps_list', 6, {h: 460}),
      item('appts', 12),
      item('note', 12, {title: 'Your contacts', about: 'people', text: 'Everyone in your account. Search by name, email, phone or company.'}),
      item('people')]}
  ]);
};

function errHtml(e){
  if (e && e.code === 'scope') return '<div class="err">' + ic('lock', 22) + '<br><b>Not switched on yet</b><br>This needs “' + esc(e.scope) + '” access on your ' + esc(BRAND) + ' account. Your Easyleads team can turn it on for you.</div>';
  if (e && e.code === 'hidden') return '<div class="err">' + ic('lock', 22) + '<br><b>Hidden from this business</b><br>They don’t see this widget. It shows up for them by itself once it’s available.</div>';
  if (e && /^ga_/.test(e.code || '')) return '<div class="err">' + ic('lock', 22) + '<br><b>Google Analytics isn’t answering</b><br>' + (e.code === 'ga_access' ? 'Access to the Google Analytics property was removed.' : 'The Google Analytics property couldn’t be read.') + ' Your Easyleads team can reconnect it.</div>';
  if (e && /^gsc_/.test(e.code || '')) return '<div class="err">' + ic('lock', 22) + '<br><b>Search Console isn’t answering</b><br>' + (e.code === 'gsc_access' ? 'Access to the Search Console property was removed.' : e.code === 'gsc_scope' ? 'Search Console still needs to be approved.' : 'The Search Console property couldn’t be read.') + ' Your Easyleads team can reconnect it.</div>';
  if (e && e.code === 'notavailable') return '<div class="err">' + ic('lock', 22) + '<br><b>Not available for this business</b><br>This widget needs an ' + esc(BRAND) + ' account. Your Easyleads team can tell you more.</div>';
  if (e && e.code === 'notconnected') return '<div class="err"><b>Your ' + esc(BRAND) + ' account isn’t connected yet.</b><br>Your Easyleads team will let you know when it’s ready.</div>';
  return '<div class="err">Couldn’t load this right now.<br><span style="font-size:12px">' + esc(e && e.message || e) + '</span></div>';
}
function rowHtml(o){
  return '<div class="row' + (o.cls ? ' ' + o.cls : '') + '" data-i="' + o.i + '">' + (o.icon ? '<div class="av" style="background:' + (o.bg || '#94a3b8') + '">' + o.icon + '</div>'
    : '<div class="av" style="background:' + hue(o.title) + '">' + esc(initials(o.title)) + '</div>') +
    '<div class="t"><b>' + esc(o.title) + '</b><small>' + o.sub + '</small></div><div class="r">' + (o.right || '') + '</div></div>';
}
function listWith(h, rows, toRow, onOpen, empty, n){
  let shown = n || 6;
  const draw = () => {
    if (!rows.length){ h.innerHTML = '<div class="empty">' + empty + '</div>'; return; }
    h.innerHTML = '<div class="list fade-in">' + rows.slice(0, shown).map((r, i) => rowHtml(Object.assign({i}, toRow(r)))).join('') + '</div>' +
      (rows.length > shown ? '<button class="more" type="button">Show more · ' + fmt(rows.length - shown) + ' left</button>' : '');
    h.querySelectorAll('.row').forEach(el => el.addEventListener('click', () => onOpen(rows[Number(el.dataset.i)])));
    const m = h.querySelector('.more'); if (m) m.addEventListener('click', () => { shown += 10; draw(); });
  };
  draw();
}
const callState = c => {
  if (c.tap) return {k: 'ok', label: c.ads ? 'From an ad' : 'Tapped to call', cls: c.ads ? 'warn' : 'blue'};
  const s = String(c.status || '').toLowerCase();
  if (/voicemail/.test(s)) return {k: 'vm', label: 'Voicemail', cls: 'warn'};
  if (/no-answer|busy|failed|cancel|missed/.test(s) || (c.dir === 'inbound' && !c.dur)) return {k: 'missed', label: 'Missed', cls: 'bad'};
  return {k: 'ok', label: c.dir === 'outbound' ? 'Outbound' : 'Answered', cls: 'good'};
};
const groupBy = (rows, f) => { const m = {}; rows.forEach(r => { const k = f(r); if (!k) return; m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(k => ({k, n: m[k]})).sort((a, b) => b.n - a.n); };
function ranked(h, items, color, opt){
  opt = opt || {};
  const max = Math.max(1, ...items.map(x => x.n)), tot = items.reduce((s, x) => s + x.n, 0) || 1;
  h.innerHTML = items.length ? '<div class="rank fade-in">' + items.map((x, i) => '<div class="it' + (opt.onClick ? ' click' : '') + '" data-i="' + i + '"' + (opt.onClick ? ' role="button" tabindex="0" title="See these leads"' : '') + '><span class="no">' + (i + 1) + '</span><div class="nm"><span title="' + esc(x.k) + '">' + esc(x.label || x.k) + '</span><div class="tr"><i style="width:' + Math.max(2, x.n / max * 100) + '%;background:' + (x.color || color) + '"></i></div></div>' +
    '<div class="vv">' + (opt.val ? opt.val(x) : fmt(x.n)) + '<small>' + (opt.sub ? opt.sub(x) : pct(x.n, tot)) + '</small></div></div>').join('') + '</div>'
    : '<div class="empty">' + (opt.empty || 'Nothing in this period.') + '</div>';
  if (opt.onClick) h.querySelectorAll('.it').forEach(el => { const go = () => opt.onClick(items[Number(el.dataset.i)]); el.addEventListener('click', go); el.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); });
}
function spark(vals, color){
  if (!vals.some(Boolean)) return '<svg class="sp" viewBox="0 0 100 30" preserveAspectRatio="none"><line x1="0" y1="27" x2="100" y2="27" stroke="#eef2f7" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  const max = Math.max(...vals), n = vals.length;
  const pts = vals.map((v, i) => [n === 1 ? 50 : i * 100 / (n - 1), 27 - v / max * 23]);
  const d = smooth(pts);
  const gid = 'g' + Math.random().toString(36).slice(2, 7);
  return '<svg class="sp" viewBox="0 0 100 30" preserveAspectRatio="none"><defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".22"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs><path d="' + d + 'L100,30L0,30Z" fill="url(#' + gid + ')"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
}
/* A gentle curve through the points (monotone-ish Catmull-Rom). */
function smooth(pts){
  if (pts.length < 3) return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
  let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, t = .18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t], c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    const lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]);
    c1[1] = Math.max(lo, Math.min(hi, c1[1])); c2[1] = Math.max(lo, Math.min(hi, c2[1]));
    d += 'C' + c1[0].toFixed(1) + ',' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ',' + c2[1].toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
  }
  return d;
}
function daySeries(rows, r){ const days = Math.round((r.e - r.s) / day) + 1, a = new Array(days).fill(0); (rows || []).forEach(x => { const i = Math.floor((x.at - r.s) / day); if (i >= 0 && i < days) a[i]++; }); return a; }
function lineChart(h, labels, series, height){
  const H = height || 230, W0 = 640, pad = {l: 34, r: 12, t: 14, b: 26};
  const max = Math.max(1, ...series.flatMap(s => s.values));
  const nice = max <= 4 ? 4 : Math.ceil(max / 4) * 4;
  const x = i => pad.l + (labels.length === 1 ? (W0 - pad.l - pad.r) / 2 : i * (W0 - pad.l - pad.r) / (labels.length - 1));
  const y = v => pad.t + (1 - v / nice) * (H - pad.t - pad.b);
  let svg = '<svg viewBox="0 0 ' + W0 + ' ' + H + '" preserveAspectRatio="none" style="height:' + H + 'px"><defs>' + series.map((s, i) => '<linearGradient id="lg' + i + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + s.color + '" stop-opacity=".18"/><stop offset="1" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient>').join('') + '</defs>';
  /* Axis labels are HTML on top of the chart, so they never stretch with it. */
  let axis = '';
  for (let g = 0; g <= 4; g++){ const v = nice * g / 4; svg += '<line x1="' + pad.l + '" x2="' + (W0 - pad.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#eef2f7" vector-effect="non-scaling-stroke" ' + (g ? 'stroke-dasharray="3 4"' : '') + '/>';
    axis += '<span class="ay" style="top:' + (y(v) / H * 100) + '%">' + fmt(v) + '</span>'; }
  const step = Math.max(1, Math.ceil(labels.length / 7));
  labels.forEach((l, i) => { if (i % step === 0) axis += '<span class="ax' + (i === 0 ? ' first' : i === labels.length - 1 ? ' last' : '') + '" style="left:' + (x(i) / W0 * 100) + '%">' + esc(l) + '</span>'; });
  series.forEach((s, si) => {
    const d = smooth(s.values.map((v, i) => [x(i), y(v)]));
    if (si === 0) svg += '<path d="' + d + 'L' + x(labels.length - 1) + ',' + y(0) + 'L' + x(0) + ',' + y(0) + 'Z" fill="url(#lg' + si + ')"/>';
    svg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
  });
  svg += '<line class="cur" y1="' + pad.t + '" y2="' + (H - pad.b) + '" stroke="#c9d4e3" stroke-dasharray="3 3" opacity="0"/>' + series.map((s, si) => '<circle class="dot' + si + '" r="4" fill="#fff" stroke="' + s.color + '" stroke-width="2.4" opacity="0"/>').join('') + '</svg>';
  h.innerHTML = '<div class="chart fade-in">' + svg + '<div class="axis">' + axis + '</div><div class="tip"></div></div><div class="chips">' + series.map(s => '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + ' · <b>' + fmt(s.values.reduce((a, b) => a + b, 0)) + '</b></span>').join('') + '</div>';
  const box = h.querySelector('.chart'), el = box.querySelector('svg'), tip = box.querySelector('.tip'), cur = el.querySelector('.cur');
  box.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W0;
    let i = Math.round((px - pad.l) / ((W0 - pad.l - pad.r) / Math.max(1, labels.length - 1)));
    i = Math.max(0, Math.min(labels.length - 1, i));
    cur.setAttribute('x1', x(i)); cur.setAttribute('x2', x(i)); cur.setAttribute('opacity', 1);
    series.forEach((s, si) => { const c = el.querySelector('.dot' + si); c.setAttribute('cx', x(i)); c.setAttribute('cy', y(s.values[i])); c.setAttribute('opacity', 1); });
    tip.innerHTML = '<b>' + esc(labels[i]) + '</b><br>' + series.map(s => '<i style="background:' + s.color + '"></i>' + esc(s.name) + ': <b>' + s.values[i] + '</b>').join('<br>');
    tip.style.left = Math.max(70, Math.min(r.width - 70, x(i) / W0 * r.width)) + 'px'; tip.style.top = (y(Math.max(...series.map(s => s.values[i]))) / H * r.height) + 'px'; tip.style.opacity = 1;
  });
  box.addEventListener('mouseleave', () => { tip.style.opacity = 0; cur.setAttribute('opacity', 0); el.querySelectorAll('circle').forEach(c => c.setAttribute('opacity', 0)); });
}
function donut(segs, sub){
  const tot = segs.reduce((s, x) => s + x.n, 0) || 1; let a = -Math.PI / 2, d = '';
  segs.forEach(s => { if (!s.n) return; const gap = segs.filter(x => x.n).length > 1 ? .025 : 0; const b = a + s.n / tot * Math.PI * 2 - (s.n === tot ? 0.0001 : 0); const a1 = a + gap / 2, b1 = b - gap / 2; const big = b1 - a1 > Math.PI ? 1 : 0;
    const p = (r, t) => (75 + r * Math.cos(t)).toFixed(2) + ' ' + (75 + r * Math.sin(t)).toFixed(2);
    d += '<path d="M' + p(68, a1) + 'A68 68 0 ' + big + ' 1 ' + p(68, b1) + 'L' + p(48, b1) + 'A48 48 0 ' + big + ' 0 ' + p(48, a1) + 'Z" fill="' + s.color + '"><title>' + esc(s.label) + ': ' + s.n + '</title></path>'; a = b; });
  return '<svg class="donut" viewBox="0 0 150 150">' + (d || '<circle cx="75" cy="75" r="58" fill="none" stroke="#eef2f7" stroke-width="20"/>') +
    '<text x="75" y="77" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="26" fill="#0d1726">' + fmt(segs.reduce((s, x) => s + x.n, 0)) + '</text><text x="75" y="96" text-anchor="middle" font-size="9.5" fill="#9aa8bb" letter-spacing="1.4">' + esc(sub) + '</text></svg>';
}
const legend = (segs, tot) => '<div class="legend">' + segs.filter(s => s.n || s.always).map(s => '<div><i style="background:' + s.color + '"></i><span>' + esc(s.label) + '</span><b>' + fmt(s.n) + '</b><em>' + pct(s.n, tot) + '</em></div>').join('') + '</div>';

/* ----- At a glance ----- */
function drawKpis(h, D){
  const r = range(), pr = prevRange();
  const tile = (key, label, val, d, note, icon, tint, sp) => '<button class="kpi" type="button" data-go="' + key + '" style="--t:' + tint + '"><div class="l">' + esc(label) + ic(icon, 16) + '</div><div class="v">' + val + (d || '') + '</div><div class="n">' + note + '</div>' + (sp || '') + '</button>';
  const t = [];
  if (D.forms) t.push(tile('inbox', 'Form leads', fmt(D.forms.rows.length), delta(D.forms.rows.length, D.forms.prev.length), 'vs ' + fmt(D.forms.prev.length) + ' the period before', 'form', T.forms, spark(daySeries(D.forms.rows, r), T.forms)));
  if (D.calls){ const taps = D.calls.rows.some(c => c.tap) || srcOf() === 'site', miss = D.calls.rows.filter(c => callState(c).k === 'missed').length; t.push(tile('calls_list', taps ? 'Calls from the website' : 'Calls', fmt(D.calls.rows.length), delta(D.calls.rows.length, D.calls.prev.length), taps ? 'taps on your phone number' : miss ? '<span style="color:var(--bad)">' + miss + ' missed</span>' : 'none missed', 'phone', T.calls, spark(daySeries(D.calls.rows, r), T.calls))); }
  if (D.contacts) t.push(tile('contacts_list', 'New contacts', fmt(D.contacts.rows.length), delta(D.contacts.rows.length, D.contacts.prev.length), 'added to your account', 'users', T.contacts, spark(daySeries(D.contacts.rows, r), T.contacts)));
  if (D.appts){ const up = D.appts.rows.filter(a => a.at >= Date.now()).length; t.push(tile('appts', 'Appointments', fmt(D.appts.rows.filter(a => inR(a, r)).length), '', up + ' upcoming', 'cal', T.appts, spark(daySeries(D.appts.rows, r), T.appts))); }
  if (D.opps){ const open = D.opps.rows.concat(D.opps.prev).filter(o => o.status === 'open'), won = D.opps.all.filter(o => o.status === 'won' && inR({at: o.upd || o.at}, r));
    t.push(tile('pipeline', 'Open pipeline', money(open.reduce((s, o) => s + o.value, 0)), '', open.length + ' open · ' + won.length + ' won · ' + money(won.reduce((s, o) => s + o.value, 0)), 'money', T.opps)); }
  if (D.ga){ const a = D.ga.rows.filter(x => x.t === 'd'), b = D.ga.prev.filter(x => x.t === 'd'), sa = gaSum(a, 's'), sb = gaSum(b, 's');
    t.push(tile('web_kpis', 'Website visits', fmt(sa), delta(sa, sb), D.forms && sa ? pct(D.forms.rows.length, sa) + ' became leads' : fmt(gaSum(a, 'n')) + ' new visitors', 'source', T.web, spark(gaSeries(a, r, 's'), T.web))); }
  void pr;
  h.innerHTML = t.length ? '<div class="kpis fade-in">' + t.join('') + '</div>' : '<div class="empty">Nothing to show yet.</div>';
  h.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => openList(b.dataset.go)));
}
/* ----- Lead inbox ----- */
/* Forms are named "site.com - Request a Quote": the site part is noise inside the client's own dashboard. */
const formLabel = f => String(f || 'Website form').replace(/^[a-z0-9.-]+\.[a-z]{2,}\s*[-–—:|]\s*/i, '') || String(f);
const IB_FACETS = [['form', 'Form', f => f.form], ['city', 'City', cityOf], ['source', 'Source', f => chGroup(f.channel)], ['page', 'Page', pathOf], ['mark', 'Status', f => markStatus(IB_M, f)]];
let IB_M = {};
/* KCB: every lead with its nearest city and the channel it came through. */
function drawNearCity(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {city: ''};
  const rows = D.forms.rows;
  if (!rows.length){ h.innerHTML = '<div class="empty">No leads in this period yet.</div>'; return; }
  const cityName = r => cityOf(r) || 'Not given';
  const cities = groupBy(rows, cityName), max = Math.max(...cities.map(c => c.n));
  const chans = [...new Set(rows.map(r => chGroup(r.channel)))].sort((a, b) => rows.filter(r => chGroup(r.channel) === b).length - rows.filter(r => chGroup(r.channel) === a).length);
  const paint = () => {
    const list = rows.filter(r => !st.city || cityName(r) === st.city).sort((a, b) => b.at - a.at);
    h.innerHTML = '<div class="nc fade-in"><div class="nc-cities">' + cities.slice(0, 12).map(c => {
      const mine = rows.filter(r => cityName(r) === c.k);
      const segs = chans.map(g => [g, mine.filter(r => chGroup(r.channel) === g).length]).filter(x => x[1]);
      return '<button type="button" class="nc-c' + (st.city === c.k ? ' on' : '') + (c.k === 'Not given' ? ' muted' : '') + '" data-city="' + esc(c.k) + '"><span class="nm">' + ic('pin', 13) + esc(c.k) + '</span>' +
        '<span class="bar" style="width:' + Math.max(8, c.n / max * 100) + '%">' + segs.map(x => '<i style="flex:' + x[1] + ';background:' + chColor(x[0]) + '" title="' + esc(x[0]) + ': ' + x[1] + '"></i>').join('') + '</span><b>' + c.n + '</b></button>';
    }).join('') + '</div>' +
      '<div class="nc-leg">' + chans.map(g => '<span><i style="background:' + chColor(g) + '"></i>' + esc(g) + '</span>').join('') + (st.city ? '<button type="button" data-all>Show every city</button>' : '') + '</div>' +
      '<div class="nc-tbl"><table><thead><tr><th>Lead</th><th>Nearest city</th><th>Came through</th><th>Received</th></tr></thead><tbody>' +
      list.slice(0, 80).map((r, i) => { const g = chGroup(r.channel); return '<tr data-i="' + i + '"><td><b>' + esc(r.name || r.email || r.phone || 'New submission') + '</b><small>' + esc(formLabel(r.form)) + '</small></td>' +
        '<td>' + (cityOf(r) ? esc(cityOf(r)) : '<span class="muted">Not given</span>') + '</td><td><span class="nc-ch" style="--c:' + chColor(g) + '"><i></i>' + esc(g === 'Not recorded' ? 'Not recorded' : g) + '</span>' + (r.channel && g !== r.channel && g !== 'Not recorded' ? '<small>' + esc(r.channel) + '</small>' : '') + '</td>' +
        '<td class="dt">' + esc(fullDate(r.at)) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    h.querySelectorAll('[data-city]').forEach(b => b.addEventListener('click', () => { st.city = st.city === b.dataset.city ? '' : b.dataset.city; paint(); }));
    const all = h.querySelector('[data-all]'); if (all) all.addEventListener('click', () => { st.city = ''; paint(); });
    h.querySelectorAll('tr[data-i]').forEach(tr => tr.addEventListener('click', () => openSubmission(list[Number(tr.dataset.i)])));
  };
  paint();
}
/* ----- lead marks: Done / Pending / Spam, one per person, kept on the tracker ----- */
const MARKS = {done: ['Done', '#0f9d6b', 'check'], pending: ['Pending', '#d9820b', 'clock'], spam: ['Spam', '#e0413a', 'x']};
const myMarkName = () => S.me && S.me.edge ? (S.me.edgeName || 'Easyleads team') : (S.me && S.me.user.name) || '';
function marksFor(domain){
  S.marks = S.marks || {};
  const c = S.marks[domain];
  if (c && Date.now() - c.at < 60000) return c.p;
  const p = api('portalMarks', {session: S.session, domain}).then(j => { if (j.error) throw new Error(j.error); return j.marks || {}; });
  S.marks[domain] = {at: Date.now(), p};
  p.catch(() => { delete S.marks[domain]; });
  return p;
}
const markStatus = (M, r) => { const l = (M && M[r.id]) || []; return l.length ? MARKS[l[l.length - 1].s][0] : 'Unmarked'; };
function marksHtml(list, id){
  const mine = myMarkName();
  return (list || []).map(m => '<span class="mk-chip' + (m.name === mine ? ' me' : '') + '" style="--c:' + MARKS[m.s][1] + '" title="' + esc(MARKS[m.s][0] + ' · ' + (m.name || m.by) + ' · ' + fullDate(m.t)) + '">' + ic(MARKS[m.s][2], 11) + MARKS[m.s][0] + '<em>' + esc(m.by) + '</em></span>').join('') +
    '<button type="button" class="mk-add" data-mk="' + esc(id) + '" title="Mark this lead" aria-label="Mark this lead">' + ((list || []).some(m => m.name === mine) ? ic('edit', 12) : ic('plus', 12) + '<span>Mark</span>') + '</button>';
}
function markMenu(btn, r, M, onDone){
  const was = btn.parentNode.querySelector('.mk-menu');
  closePops();
  if (was) return;                     /* a second click closes it */
  const mine = myMarkName(), cur = ((M[r.id] || []).find(m => m.name === mine) || {}).s;
  const m = document.createElement('div'); m.className = 'mk-menu'; m.dataset.pop = 1;
  m.innerHTML = '<div class="mk-h">Mark as</div>' + Object.keys(MARKS).map(k => '<button type="button" data-s="' + k + '" style="--c:' + MARKS[k][1] + '"' + (cur === k ? ' class="on"' : '') + '><i>' + ic(MARKS[k][2], 12) + '</i>' + MARKS[k][0] + (cur === k ? '<small>yours</small>' : '') + '</button>').join('') +
    (cur ? '<button type="button" data-s="none" class="clr">Remove my mark</button>' : '') + '<div class="mk-f">Others’ marks stay as they are.</div>';
  btn.parentNode.appendChild(m);
  placeMenu(m, btn);
  m.addEventListener('click', e => e.stopPropagation());
  m.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', async () => {
    const s = b.dataset.s; closePops();
    const before = (M[r.id] || []).slice();
    const others = before.filter(x => x.name !== mine);
    M[r.id] = s === 'none' ? others : others.concat({s, by: S.me && S.me.edge && !S.me.edgeName ? 'EM' : initials(mine || S.me.user.email), name: mine, t: Date.now()});
    onDone();
    try{ const j = await api('portalMark', {session: S.session, domain: S.domain, id: r.id, s}); if (j.error) throw new Error(j.error); M[r.id] = j.marks || []; onDone(); teamFetch();
      undoPush(s === 'none' ? 'Removed your mark' : 'Marked as ' + MARKS[s][0], () => markSetQuiet(r, cur || 'none', M, onDone)); }
    catch(e){ M[r.id] = before; onDone(); toast('Couldn’t save that mark: ' + e.message); }
  }));
}
/* The menu opens upward; on the first leads of the list, where there is no room above, it opens
   downward instead, and the list scrolls a little if it would be cut off at the bottom. */
function placeMenu(m, btn){
  const sc = btn.closest('.ib-list'), top = Math.max(sc ? sc.getBoundingClientRect().top : 0, 72) + 4;
  if (m.getBoundingClientRect().top >= top) return;
  m.classList.add('down');
  const bot = sc ? sc.getBoundingClientRect().bottom : innerHeight, over = m.getBoundingClientRect().bottom - bot + 10;
  if (over > 0) (sc || window).scrollBy({top: over, behavior: 'smooth'});
}
/* ----- the same person across every submission, past and future -----
   A person is their email, else their phone number (last ten digits), else
   their name. Their whole history comes from one long request for the
   business's form leads (kept for the visit), so a lead from three years ago
   and one from today line up. */
const personKey = r => {
  const e = String(r.email || '').trim().toLowerCase(); if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return 'e:' + e;
  const p = String(r.phone || '').replace(/\D/g, ''); if (p.length >= 7) return 'p:' + p.slice(-10);
  const n = String(r.name || '').trim().toLowerCase().replace(/\s+/g, ' '); return n.length > 2 ? 'n:' + n : '';
};
const HIST = {};
function formsHistory(){
  const dom = S.domain;
  if (!HIST[dom]){
    HIST[dom] = api('portalData', {session: S.session, domain: dom, kind: 'forms', start: '2015-01-01', end: iso(Date.now())})
      .then(j => { if (j.error) throw new Error(j.error); return j.rows || []; });
    HIST[dom].catch(() => { delete HIST[dom]; });
  }
  return HIST[dom];
}
function peopleOf(rows){
  const m = {}, seen = {};
  rows.forEach(r => { const k = personKey(r); if (!k) return; const id = r.id || (k + r.at); if (seen[id]) return; seen[id] = 1; (m[k] = m[k] || []).push(r); });
  Object.values(m).forEach(a => a.sort((x, y) => y.at - x.at));
  return m;
}
function openPerson(list){
  if (!list || !list.length) return;
  const ck = personKey(list[0]); if (ck) return openClient(ck, list);
  const f = list[0], nm = (list.find(x => x.name) || f).name || f.email || f.phone || 'Person';
  const forms = groupBy(list, x => formLabel(x.form)).map(x => x.k + (x.n > 1 ? ' (' + x.n + ')' : '')).join(', ');
  const b = drawer(nm, [['Submissions', fmt(list.length)], ['First one', fullDate(list[list.length - 1].at)], ['Latest', fullDate(f.at)], ['Email', (list.find(x => x.email) || {}).email], ['Phone', (list.find(x => x.phone) || {}).phone], ['Company', (list.find(x => x.company) || {}).company], ['City', cityOf(list.find(x => cityOf(x)) || f)], ['Forms used', forms]],
    '<div class="pp-h">' + ic('users', 14) + 'Every submission from this person</div><div data-pl></div>', {sub: esc([(list.find(x => x.email) || {}).email, (list.find(x => x.phone) || {}).phone].filter(Boolean).join(' · '))});
  listWith(b.querySelector('[data-pl]'), list, x => ({title: formLabel(x.form), sub: esc(fullDate(x.at)) + (x.message ? ' · ' + esc(String(x.message).slice(0, 90)) : ''), icon: ic('form', 15), bg: '#1d7cf2', right: esc(relDay(x.at))}),
    x => openSubmission(x), 'No submissions.', 25);
}
(function(){ if (document.getElementById('pp-css')) return; const st = document.createElement('style'); st.id = 'pp-css';
  st.textContent = '.mk-menu.down{bottom:auto;top:30px}' +
    '.sc-bar{display:flex;align-items:center;gap:12px;margin-bottom:10px}.sc-bar input{flex:1;max-width:320px;height:36px;border:1px solid var(--line);border-radius:10px;padding:0 12px;font:inherit;background:#fff}.sc-bar input:focus{outline:none;border-color:#1a73e8;box-shadow:0 0 0 3px rgba(26,115,232,.12)}.sc-bar span{font-size:12.5px;color:var(--ink-3)}' +
    '.sc-sort{border:0;background:none;font:inherit;color:inherit;cursor:pointer;padding:0}.sc-sort.on{color:#1a73e8}.sc-sort.on:after{content:" ↓"}' +
    '.ai-st{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--ink-2);padding:3px 9px 3px 8px;border-radius:99px;background:color-mix(in srgb,var(--c) 10%,#fff);white-space:nowrap}.ai-st i{width:7px;height:7px;border-radius:50%;background:var(--c)}.ai-st b{color:var(--ink)}' +
    '.ai-sum{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}.ai-sum em{margin-left:auto;font-style:normal;font-size:12px;color:var(--ink-3)}' +
    '.tm-btn{width:auto;min-width:40px;padding:0 9px}.tm-btn.live{border-color:#bfe8d4;background:#f2fbf6}.tm-btn [data-teamav]{display:flex;align-items:center;gap:4px}.tm-btn em{font-style:normal;font-size:11.5px;font-weight:700;color:var(--ink-2)}' +
    '.tm-stack{display:flex}.tm-stack i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 10px var(--ui);font-style:normal;border:2px solid #fff;margin-left:-7px;position:relative}.tm-stack i:first-child{margin-left:0}.tm-btn.live .tm-stack i:last-child:after{content:"";position:absolute;right:-3px;bottom:-2px;width:8px;height:8px;border-radius:50%;background:#12a26b;border:2px solid #fff}' +
    '.tm-pop{width:min(380px,calc(100vw - 24px))}.tm-live{display:inline-flex;align-items:center;gap:6px;font:500 12px var(--ui);color:var(--ink-3)}.tm-live i{width:7px;height:7px;border-radius:50%;background:#12a26b}' +
    '.tm-ppl{display:flex;flex-direction:column;gap:2px;padding:0 4px 6px;max-height:210px;overflow:auto}.tm-p{display:flex;align-items:center;gap:10px;padding:7px 6px;border-radius:10px}.tm-p .av{position:relative;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:11.5px;flex:none}' +
    '.tm-p .av i{position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;background:#cbd2dc;border:2px solid #fff}.tm-p.on .av i{background:#12a26b}.tm-p .t{min-width:0;line-height:1.3}.tm-p .t b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tm-p .t b small{font-weight:500;color:var(--ink-3);font-size:11.5px}.tm-p .t>small{color:var(--ink-3);font-size:12px}.tm-p.on .t>small{color:#0f8a5c;font-weight:600}' +
    '.tm-h{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);padding:10px 10px 6px;border-top:1px solid var(--line-2)}.tm-acts{max-height:300px}.tm-a .t small span{color:var(--ink);font-weight:600}' +
    '.pp-badge{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:2px 9px 2px 7px;border-radius:99px;background:#eef4ff;color:#1d5fd0;font-size:11.5px;font-weight:700;cursor:pointer;vertical-align:middle;transition:background .2s,transform .2s}.pp-badge:hover{background:#dbe8ff;transform:translateY(-1px)}.pp-badge svg{width:12px;height:12px}' +
    '.pp-h{display:flex;align-items:center;gap:7px;margin:4px 0 8px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}.pp-box{margin:6px 0 14px;padding:12px 14px;border-radius:14px;background:#f5f8ff;border:1px solid #e2ebfa}.pp-box b{color:var(--ink)}.pp-box button{margin-top:8px}' +
    '.ib-list{max-height:none}';
  document.head.appendChild(st); })();
function drawInbox(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {q: '', sort: 'new', f: {}};
  const rows = D.forms.rows, prev = D.forms.prev;
  const people = new Set(rows.map(r => personKey(r) || r.id)).size;
  let P = peopleOf(D.forms.all);
  const cities = groupBy(rows, cityOf), top = cities[0];
  const latest = rows[0];
  h.innerHTML = '<div class="fade-in"><div class="ib-stats">' +
    '<div class="ib-stat"><div class="l">Submissions' + ic('form', 16) + '</div><div class="v">' + fmt(rows.length) + delta(rows.length, prev.length) + '</div><div class="n">' + esc(PERIODS.find(p => p[0] === S.period)[1]) + ' · ' + fmt(prev.length) + ' before</div></div>' +
    '<div class="ib-stat"><div class="l">People' + ic('users', 16) + '</div><div class="v">' + fmt(people) + '</div><div class="n" data-ppn>different senders</div></div>' +
    '<div class="ib-stat"><div class="l">Top city' + ic('pin', 16) + '</div><div class="v" title="' + esc(top ? top.k : '') + '">' + esc(top ? top.k : '—') + '</div><div class="n">' + (top ? pct(top.n, rows.length) + ' of submissions' : 'no city given yet') + '</div></div>' +
    '<div class="ib-stat"><div class="l">Latest' + ic('cal', 16) + '</div><div class="v">' + esc(latest ? relDay(latest.at) : '—') + '</div><div class="n">' + esc(latest ? fullDate(latest.at) : 'no submissions yet') + '</div></div></div>' +
    '<div class="ib-tools"><label class="search">' + ic('search', 17) + '<input type="search" data-q placeholder="Search names, emails, companies, cities, messages…" value="' + esc(st.q) + '"><kbd>/</kbd></label>' +
    '<button class="btn ib-act" type="button" data-act><span class="ia-av" data-iaav></span>' + ic('clock', 15) + 'Activity<em data-iac></em></button><button class="btn" type="button" data-sort>' + (st.sort === 'new' ? 'Newest first' : 'Oldest first') + '</button><button class="btn" type="button" data-export>' + ic('dl', 15) + 'Export</button></div>' +
    '<div class="ib-filters" data-chips></div>' +
    '<div class="ib-body"><aside class="ib-side" data-side></aside><div><div class="ib-count" data-count></div><div class="ib-list" data-list></div></div></div></div>';
  const $ = s => h.querySelector(s);
  const match = (r, skip) => IB_FACETS.every(([k, , f]) => k === skip || !st.f[k] || f(r) === st.f[k]) &&
    (!st.q || [r.name, r.email, r.phone, r.company, r.message, r.form, cityOf(r), regionOf(r), r.page, (r.fields || []).map(x => x[1]).join(' ')].join(' ').toLowerCase().indexOf(st.q.toLowerCase()) > -1);
  const shownRows = () => rows.filter(r => match(r)).sort((a, b) => st.sort === 'new' ? b.at - a.at : a.at - b.at);
  let limit = 30, M = {};
  const paint = () => {
    IB_M = M;
    const list = shownRows();
    /* filter chips */
    $('[data-chips]').innerHTML = IB_FACETS.map(([k, label]) => '<div class="fchip"><button type="button" data-chip="' + k + '"' + (st.f[k] ? ' class="on"' : '') + '>' + esc(st.f[k] ? label + ': ' + (k === 'form' ? formLabel(st.f[k]) : st.f[k]) : label) + ic('down', 14) + '</button></div>').join('');
    $('[data-chips]').querySelectorAll('[data-chip]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); chipMenu(b); }));
    /* facets */
    $('[data-side]').innerHTML = [['mark', 'Status', 'check'], ['city', 'City', 'pin'], ['source', 'Source', 'source'], ['form', 'Form', 'form'], ['page', 'Page', 'book']].map(([k, title, icon]) => {
      const f = IB_FACETS.find(x => x[0] === k)[2];
      const all = groupBy(rows.filter(r => match(r, k)), f), g = all.slice(0, 6);
      if (!g.length) return '';
      const max = Math.max(...g.map(x => x.n)), tot = all.reduce((a, x) => a + x.n, 0);
      const col = x => k === 'mark' ? ((Object.values(MARKS).find(v => v[0] === x.k) || [0, '#94a3b8'])[1]) : k === 'source' ? chColor(x.k) : k === 'city' ? '#0f9d6b' : k === 'form' ? '#1d7cf2' : '#7c5cff';
      const lab = x => k === 'form' ? formLabel(x.k) : x.k;
      return '<section class="fs"><h5><span class="hi" style="--c:' + col(g[0]) + '">' + ic(icon, 13) + '</span>' + esc(title) + (all.length > 6 ? '<small>Top 6 of ' + all.length + '</small>' : '') + '</h5><div class="facet">' +
        g.map(x => '<button type="button" data-fk="' + k + '" data-fv="' + esc(x.k) + '" title="' + esc(x.k) + '"' + (st.f[k] === x.k ? ' class="on"' : '') + ' style="--c:' + col(x) + '">' +
          '<div class="fl"><span class="t">' + esc(lab(x)) + '</span><em>' + x.n + '<small>' + pct(x.n, tot) + '</small></em></div><div class="tr"><b style="width:' + Math.max(4, x.n / max * 100) + '%"></b></div></button>').join('') + '</div></section>';
    }).join('') || '<div class="foot-note">Filters appear here once leads come in.</div>';
    $('[data-side]').querySelectorAll('[data-fk]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.fk; st.f[k] = st.f[k] === b.dataset.fv ? '' : b.dataset.fv; limit = 30; paint(); }));
    const active = Object.values(st.f).some(Boolean) || st.q;
    $('[data-count]').innerHTML = '<span>' + fmt(list.length) + ' submission' + (list.length === 1 ? '' : 's') + (active ? ' match' : '') + '</span>' + (active ? '<button type="button" data-clear>Clear filters</button>' : '');
    const cl = $('[data-clear]'); if (cl) cl.addEventListener('click', () => { st.f = {}; st.q = ''; $('[data-q]').value = ''; paint(); });
    $('[data-list]').innerHTML = list.length ? list.slice(0, limit).map((r, i) => {
      const nm = r.name || r.email || r.phone || 'New submission', city = cityOf(r), g = chGroup(r.channel);
      return '<div class="ibrow"><button class="card" type="button" data-i="' + i + '"><div class="av" style="background:' + hue(nm) + '">' + esc(initials(nm)) + '</div><div class="cb"><div class="ch"><b>' + esc(nm) + (function(){ const k = personKey(r), n = k && P[k] ? P[k].length : 0; return n > 1 ? '<span class="pp-badge" data-pk="' + esc(k) + '" title="This person has sent ' + n + ' submissions in total. Click to see them all.">' + ic('users', 12) + n + ' submissions</span>' : ''; })() + '</b><time>' + esc(fullDate(r.at)) + '</time></div>' +
        '<div class="cc">' + esc([r.email, r.phone].filter(Boolean).join(' · ') || r.company || '—') + '</div>' + (r.message ? '<div class="cm">' + esc(r.message) + '</div>' : '') +
        '<div class="tags"><span class="tag" title="' + esc(r.form) + '"><i style="background:#1d7cf2"></i>' + esc(formLabel(r.form)) + '</span>' + (city ? '<span class="tag loc">' + ic('pin', 12) + esc(city) + '</span>' : '') +
        (g !== 'Not recorded' ? '<span class="tag"><i style="background:' + chColor(g) + '"></i>' + esc(r.channel) + '</span>' : '') + '</div><div class="ib-seen" data-seen="' + esc(r.id) + '"></div><div class="ib-crm" data-crk="' + esc(personKey(r)) + '"></div></div></button>' +
        '<div class="mk" data-mki="' + i + '">' + marksHtml(M[r.id], r.id) + '</div></div>';
    }).join('') + (list.length > limit ? '<button class="more" type="button" data-more>Show more · ' + fmt(list.length - limit) + ' left</button>' : '')
      : '<div class="empty">' + (rows.length ? 'No submissions match these filters.' : 'No form submissions in this period yet.') + '</div>';
    $('[data-list]').querySelectorAll('.card').forEach(el => el.addEventListener('click', e => { const pb = e.target.closest('[data-pk]'); if (pb){ e.stopPropagation(); openPerson(P[pb.dataset.pk]); return; } const r0 = list[Number(el.dataset.i)]; const cc = e.target.closest('[data-crc]'); if (cc){ e.stopPropagation(); const ck = personKey(r0); openPerson((ck && P[ck]) || [r0]); return; } openSubmission(r0); leadSeen(r0); }));
    ibTeam(h); ibCrm(h);
    fitList();
    $('[data-list]').querySelectorAll('[data-mki]').forEach(box => box.addEventListener('click', e => {
      const b = e.target.closest('[data-mk]'); if (!b) return;
      e.stopPropagation();
      const r = list[Number(box.dataset.mki)];
      markMenu(b, r, M, () => { box.innerHTML = marksHtml(M[r.id], r.id); });
    }));
    const mo = $('[data-more]'); if (mo) mo.addEventListener('click', () => { limit += 30; paint(); });
  };
  const chipMenu = b => {
    closePops();
    const k = b.dataset.chip, f = IB_FACETS.find(x => x[0] === k)[2];
    const g = groupBy(rows.filter(r => match(r, k)), f);
    const m = document.createElement('div'); m.className = 'fmenu'; m.dataset.pop = 1;
    m.innerHTML = '<button type="button" data-v=""' + (!st.f[k] ? ' class="on"' : '') + '><span>All</span><em>' + fmt(rows.filter(r => match(r, k)).length) + '</em></button>' + g.map(x => '<button type="button" data-v="' + esc(x.k) + '"' + (st.f[k] === x.k ? ' class="on"' : '') + ' title="' + esc(x.k) + '"><span>' + esc(k === 'form' ? formLabel(x.k) : x.k) + '</span><em>' + x.n + '</em></button>').join('');
    b.parentNode.appendChild(m);
    m.addEventListener('click', e => e.stopPropagation());
    m.querySelectorAll('[data-v]').forEach(x => x.addEventListener('click', () => { st.f[k] = x.dataset.v; closePops(); limit = 30; paint(); }));
  };
  let qT = null;
  $('[data-q]').addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { st.q = e.target.value.trim(); limit = 30; paint(); }, 140); });
  $('[data-sort]').addEventListener('click', e => { st.sort = st.sort === 'new' ? 'old' : 'new'; e.currentTarget.textContent = st.sort === 'new' ? 'Newest first' : 'Oldest first'; paint(); });
  $('[data-export]').addEventListener('click', () => csv('leads-' + S.domain + '-' + iso(Date.now()) + '.csv', [['Received', 'Name', 'Email', 'Phone', 'Company', 'City', 'Province', 'Source', 'Form', 'Page', 'Message', 'Marks']].concat(shownRows().map(r => [fullDate(r.at), r.name, r.email, r.phone, r.company, cityOf(r), regionOf(r), r.channel, r.form, r.page, r.message, (M[r.id] || []).map(m => MARKS[m.s][0] + ' (' + m.by + ')').join('; ')]))));
  /* The list is as tall as the filters beside it (never shorter than 520 px), so no blank space opens under it. */
  function fitList(){
    const side = $('[data-side]'), list = $('[data-list]'), cnt = $('[data-count]'), body = h.querySelector('.ib-body');
    if (!side || !list || !body) return;
    const stacked = getComputedStyle(body).gridTemplateColumns.split(' ').length < 2;
    list.style.maxHeight = stacked ? '640px' : Math.max(520, side.offsetHeight - (cnt ? cnt.offsetHeight + 8 : 0)) + 'px';
  }
  if (window.ResizeObserver){ const ro2 = new ResizeObserver(() => fitList()); ro2.observe($('[data-side]')); }
  paint();
  const dom = S.domain;
  marksFor(dom).then(m => { if (!h.isConnected || S.domain !== dom) return; M = m; paint(); }).catch(() => {});
  /* Marks made by anyone else on the team show up here within half a minute. */
  const onMk = e => {
    if (!h.isConnected){ document.removeEventListener('el-marks', onMk); return; }
    if (e.detail.domain !== dom || JSON.stringify(e.detail.marks) === JSON.stringify(M)) return;
    M = IB_M = e.detail.marks;
    if (document.querySelector('.mk-menu')) return;            /* not while someone is choosing a mark */
    if (st.f.mark) { paint(); return; }
    h.querySelectorAll('[data-mki]').forEach(box => { const b = box.querySelector('[data-mk]'); if (b) box.innerHTML = marksHtml(M[b.dataset.mk], b.dataset.mk); });
  };
  document.addEventListener('el-marks', onMk);
  /* Shared activity: who opened and marked what, live for everyone. */
  h.classList.add('ia-host');
  h.__leads = {}; (D.forms.all || rows).forEach(r => { if (r.id) h.__leads[r.id] = r; });
  $('[data-act]').addEventListener('click', e => { e.stopPropagation(); ibActPanel(h); });
  const onTm = e => { if (!h.isConnected){ document.removeEventListener('el-team', onTm); return; } if (e.detail.domain === dom) ibTeam(h); };
  document.addEventListener('el-team', onTm);
  /* Client stage, owner and follow-up on each lead, and CRM changes in the Activity panel, live. */
  const onCrm = e => { if (!h.isConnected){ document.removeEventListener('el-crm', onCrm); return; } if (e.detail.domain !== dom) return; ibCrm(h); const pn = h.querySelector('.ia-panel'); if (pn && pn.redraw) pn.redraw(); };
  document.addEventListener('el-crm', onCrm);
  crmFor(dom).then(() => { if (h.isConnected && S.domain === dom){ ibCrm(h); const pn = h.querySelector('.ia-panel'); if (pn && pn.redraw) pn.redraw(); } }).catch(() => {});
  /* Everyone's full history, then the badges and how many had been in touch before. */
  formsHistory().then(all => {
    if (!h.isConnected || S.domain !== dom) return;
    P = peopleOf(all.concat(D.forms.all));
    all.forEach(r => { if (r.id && !h.__leads[r.id]) h.__leads[r.id] = r; });
    const keys = [...new Set(rows.map(personKey).filter(Boolean))];
    const back = keys.filter(k => P[k] && P[k].some(x => x.at < Math.min(...rows.filter(r => personKey(r) === k).map(r => r.at)))).length;
    const n = h.querySelector('[data-ppn]'); if (n) n.textContent = back ? back + ' had been in touch before' : 'different senders';
    paint();
  }).catch(() => {});
}
function csv(name, rows){
  const s = rows.map(r => r.map(v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + s], {type: 'text/csv'})); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
/* ----- trend, sources, locations ----- */
function drawTrend(h, D, it){
  const r = range(), days = Math.round((r.e - r.s) / day) + 1, labels = [];
  for (let i = 0; i < days; i++) labels.push(new Date(r.s + i * day).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'}));
  const series = [];
  if (D.forms) series.push({name: 'Form leads', values: daySeries(D.forms.rows, r), color: T.forms});
  if (D.calls) series.push({name: 'Calls', values: daySeries(D.calls.rows, r), color: T.calls});
  if (D.contacts) series.push({name: 'New contacts', values: daySeries(D.contacts.rows, r), color: T.contacts});
  if (!series.length){ h.innerHTML = '<div class="empty">Nothing to show yet.</div>'; return; }
  lineChart(h, labels, series, 240);
}
function drawSources(h, D){
  const g = groupBy(D.forms.rows, f => chGroup(f.channel));
  const segs = g.map(x => ({label: x.k, n: x.n, color: chColor(x.k)}));
  if (!segs.length){ h.innerHTML = '<div class="empty">No leads in this period yet.</div>'; return; }
  h.innerHTML = '<div class="donutrow fade-in">' + donut(segs, 'LEADS') + legend(segs, D.forms.rows.length) + '</div>' +
    (g.some(x => x.k === 'Not recorded') ? '<div class="foot-note">“Not recorded” means the form didn’t pass on where the visitor came from.</div>' : '');
}
function drawLocations(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {by: 'city'};
  const src = D.forms ? D.forms : null, cts = D.contacts ? D.contacts : null;
  const paint = () => {
    const f = st.by === 'city' ? cityOf : regionOf;
    let cur = src ? src.rows : [], prv = src ? src.prev : [];
    /* No location on the forms: use the contacts' address instead. */
    if (!cur.some(f) && cts){ cur = cts.rows; prv = cts.prev; }
    const pm = {}; groupBy(prv, f).forEach(x => { pm[x.k] = x.n; });
    const items = groupBy(cur, f).slice(0, 10).map(x => Object.assign(x, {p: pm[x.k] || 0}));
    const unknown = cur.filter(r => !f(r)).length;
    h.innerHTML = '<div class="mini-seg"><button type="button" data-by="city"' + (st.by === 'city' ? ' class="on"' : '') + '>City</button><button type="button" data-by="region"' + (st.by === 'region' ? ' class="on"' : '') + '>Province / state</button></div><div data-r></div>' +
      (unknown && items.length ? '<div class="foot-note">' + fmt(unknown) + ' lead' + (unknown === 1 ? '' : 's') + ' didn’t say where they’re from.</div>' : '');
    const isForms = src && cur === src.rows;
    ranked(h.querySelector('[data-r]'), items, T.loc, {val: x => fmt(x.n) + ' ' + delta(x.n, x.p), sub: x => pct(x.n, cur.length) + ' of leads', empty: 'None of your leads said where they’re from in this period.',
      onClick: isForms ? x => leadsDrawer(x.k, 'Leads from ' + x.k, cur.filter(r => f(r) === x.k), 'pin') : null});
    h.querySelectorAll('[data-by]').forEach(b => b.addEventListener('click', () => { st.by = b.dataset.by; paint(); }));
  };
  paint();
}
function drawFormsBy(h, D){
  const pm = {}; groupBy(D.forms.prev, f => f.form).forEach(x => { pm[x.k] = x.n; });
  ranked(h, groupBy(D.forms.rows, f => f.form).slice(0, 10).map(x => Object.assign(x, {p: pm[x.k] || 0, label: formLabel(x.k)})), T.forms, {val: x => fmt(x.n) + ' ' + delta(x.n, x.p), empty: 'No form submissions in this period.',
    onClick: x => leadsDrawer(formLabel(x.k), 'Leads from this form', D.forms.rows.filter(f => f.form === x.k))});
}
function drawPages(h, D){
  ranked(h, groupBy(D.forms.rows, pathOf).slice(0, 10), '#0891b2', {empty: 'No pages recorded in this period.',
    onClick: x => leadsDrawer(x.k, 'Leads sent from this page', D.forms.rows.filter(f => pathOf(f) === x.k), 'book')});
}
/* Every lead behind a number: a side panel listing them, each one opens in full. */
function leadsDrawer(title, sub, rows, icon){
  rows = rows.slice().sort((a, b) => b.at - a.at);
  const b = drawer(title, [], '<div class="ld-sum"><b>' + fmt(rows.length) + '</b> lead' + (rows.length === 1 ? '' : 's') + ' in this period' +
    (rows.length ? ' · latest ' + esc(relDay(rows[0].at)) : '') + '</div><div data-ll></div>', {icon: icon || 'form', tint: T.forms, sub: esc(sub)});
  listWith(b.querySelector('[data-ll]'), rows, f => ({title: f.name || f.email || f.phone || 'New submission', sub: esc(formLabel(f.form)) + (cityOf(f) ? ' · ' + esc(cityOf(f)) : '') + (f.email ? ' · ' + esc(f.email) : ''), right: esc(when(f.at))}),
    openSubmission, 'No leads.', 12);
}
function drawForms(h, D){
  listWith(h, D.forms.rows, f => ({title: f.name || f.email || f.phone || 'New submission', sub: esc(f.form) + (cityOf(f) ? ' · ' + esc(cityOf(f)) : '') + (f.email ? ' · ' + esc(f.email) : ''), right: esc(when(f.at))}),
    openSubmission, 'No form submissions in this period.', 6);
}
/* ----- website traffic (Google Analytics) ----- */
const gaSum = (rows, k) => rows.reduce((s, x) => s + (Number(x[k]) || 0), 0);
function gaSeries(rows, r, k){ const days = Math.round((r.e - r.s) / day) + 1, a = new Array(days).fill(0); rows.forEach(x => { const i = Math.floor((x.at - r.s) / day); if (i >= 0 && i < days) a[i] += Number(x[k]) || 0; }); return a; }
const gaGroup = (rows, kf, vf) => { const m = {}; rows.forEach(x => { const k = kf(x); if (!k) return; m[k] = (m[k] || 0) + vf(x); }); return Object.keys(m).map(k => ({k, n: m[k]})).sort((a, b) => b.n - a.n); };
const gaNone = '<div class="empty">No website visits recorded in this period yet.</div>';
function drawWebKpis(h, D){
  const r = range(), a = D.ga.rows.filter(x => x.t === 'd'), b = D.ga.prev.filter(x => x.t === 'd');
  const tile = (label, val, d, note, icon, tint, sp) => '<div class="kpi" style="--t:' + tint + ';cursor:default"><div class="l">' + esc(label) + ic(icon, 16) + '</div><div class="v">' + val + (d || '') + '</div><div class="n">' + note + '</div>' + (sp || '') + '</div>';
  const S1 = k => gaSum(a, k), S0 = k => gaSum(b, k);
  const er = x => x.s ? Math.round(x.e / x.s * 100) : 0, eA = er({s: S1('s'), e: S1('e')}), eB = er({s: S0('s'), e: S0('e')});
  const t = [
    tile('Visits', fmt(S1('s')), delta(S1('s'), S0('s')), 'vs ' + fmt(S0('s')) + ' the period before', 'source', T.web, spark(gaSeries(a, r, 's'), T.web)),
    tile('New visitors', fmt(S1('n')), delta(S1('n'), S0('n')), 'people seeing the site for the first time', 'users', '#7c3aed', spark(gaSeries(a, r, 'n'), '#7c3aed')),
    tile('Page views', fmt(S1('v')), delta(S1('v'), S0('v')), S1('s') ? (S1('v') / S1('s')).toFixed(1) + ' pages per visit' : '—', 'book', '#0891b2', spark(gaSeries(a, r, 'v'), '#0891b2')),
    tile('Engaged visits', eA + '%', '', 'stayed 10 s+, viewed 2+ pages or acted · was ' + eB + '%', 'target', '#16a37a')];
  if (D.forms) t.push(tile('Visits that became leads', S1('s') ? pct(D.forms.rows.length, S1('s')) : '—', '', fmt(D.forms.rows.length) + ' form leads · was ' + (S0('s') ? pct(D.forms.prev.length, S0('s')) : '—'), 'form', T.forms));
  else if (S1('k') || S0('k')) t.push(tile('Key events', fmt(S1('k')), delta(S1('k'), S0('k')), 'conversions set up in Google Analytics', 'bolt', T.forms));
  h.innerHTML = a.length || b.length ? '<div class="kpis fade-in">' + t.join('') + '</div>' : gaNone;
}
function drawWebTrend(h, D){
  const r = range(), days = Math.round((r.e - r.s) / day) + 1, labels = [];
  for (let i = 0; i < days; i++) labels.push(new Date(r.s + i * day).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'}));
  const a = D.ga.rows.filter(x => x.t === 'd');
  if (!a.length){ h.innerHTML = gaNone; return; }
  const series = [{name: 'Visits', values: gaSeries(a, r, 's'), color: T.web}, {name: 'New visitors', values: gaSeries(a, r, 'n'), color: '#7c3aed'}];
  if (D.forms) series.push({name: 'Form leads', values: daySeries(D.forms.rows, r), color: '#0f9d6b'});
  lineChart(h, labels, series, 240);
}
function drawWebSources(h, D){
  const g = gaGroup(D.ga.rows.filter(x => x.t === 'c'), x => x.ch === '(not set)' || x.ch === 'Unassigned' ? 'Other' : x.ch, x => x.s);
  const segs = g.map(x => ({label: x.k, n: x.n, color: chColor(chGroup(x.k))}));
  const fix = {}; segs.forEach(sg => { if (fix[sg.color]) sg.color = ['#94a3b8', '#64748b', '#b45309', '#0e7490', '#9333ea'][fix[sg.color]++ % 5]; else fix[sg.color] = 1; });
  if (!segs.length){ h.innerHTML = gaNone; return; }
  const tot = segs.reduce((s, x) => s + x.n, 0);
  h.innerHTML = '<div class="donutrow fade-in">' + donut(segs, 'VISITS') + legend(segs, tot) + '</div>';
}
function drawWebPages(h, D){
  const rows = D.ga.rows.filter(x => x.t === 'p'), users = {}; rows.forEach(x => { users[x.p] = (users[x.p] || 0) + x.u; });
  const items = gaGroup(rows, x => x.p, x => x.v).slice(0, 10).map(x => Object.assign(x, {label: x.k === '/' ? 'Home page' : x.k}));
  const tot = items.reduce((s, x) => s + x.n, 0);
  ranked(h, items, '#0891b2', {val: x => fmt(x.n) + ' views', sub: x => fmt(users[x.k] || 0) + ' visitors', empty: 'No page views recorded in this period yet.'});
  void tot;
}
function drawWebCities(h, D){
  const rows = D.ga.rows.filter(x => x.t === 'g'), tot = gaSum(rows, 'u');
  ranked(h, gaGroup(rows, x => x.city + (x.region && x.region !== '(not set)' ? ', ' + x.region : ''), x => x.u).slice(0, 10), T.loc, {sub: x => pct(x.n, tot) + ' of visitors', empty: 'No visitor locations recorded in this period yet.'});
}
/* ----- Google Search (Search Console) ----- */
const SC_C = '#1a73e8', SC_I = '#a142f4';
const scDays = (D, r) => D.gsc.all.filter(x => x.t === 'd' && inR(x, r));
const scTot = rows => { const c = gaSum(rows, 'c'), i = gaSum(rows, 'i'), pw = rows.reduce((s, x) => s + (x.pos || 0) * (x.i || 0), 0); return {c, i, ctr: i ? c / i : 0, pos: i ? pw / i : 0}; };
const pos1 = n => n ? (Math.round(n * 10) / 10).toFixed(1) : '—';
const posDelta = (a, b) => { if (!a || !b) return ''; const d = Math.round((b - a) * 10) / 10; return !d ? '<span class="delta flat">0</span>' : '<span class="delta ' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(1) + '</span>'; };
const scNone = '<div class="empty">No Google search data for this period yet. Search Console reports two to three days late.</div>';
const isSearchLead = f => chGroup(f.channel) === 'Organic' || /google\s*\/\s*organic|bing\s*\/\s*organic/i.test(f.source || '');
function drawScKpis(h, D){
  const r = range(), a = scDays(D, r), b = scDays(D, prevRange()), A = scTot(a), B = scTot(b);
  if (!a.length && !b.length){ h.innerHTML = scNone; return; }
  const tile = (label, val, d, note, icon, tint, sp) => '<div class="kpi" style="--t:' + tint + ';cursor:default"><div class="l">' + esc(label) + ic(icon, 16) + '</div><div class="v">' + val + (d || '') + '</div><div class="n">' + note + '</div>' + (sp || '') + '</div>';
  h.innerHTML = '<div class="kpis fade-in">' + [
    tile('Clicks from Google', fmt(A.c), delta(A.c, B.c), 'vs ' + fmt(B.c) + ' the period before', 'search', SC_C, spark(gaSeries(a, r, 'c'), SC_C)),
    tile('Impressions', fmt(A.i), delta(A.i, B.i), 'times the site showed up in results', 'eye', SC_I, spark(gaSeries(a, r, 'i'), SC_I)),
    tile('Click rate', A.i ? (A.ctr * 100).toFixed(1) + '%' : '—', '', 'of people who saw it clicked · was ' + (B.i ? (B.ctr * 100).toFixed(1) + '%' : '—'), 'target', '#16a37a'),
    tile('Average position', pos1(A.pos), posDelta(A.pos, B.pos), 'place in Google’s results (1 is the top) · was ' + pos1(B.pos), 'bolt', '#d97706')].join('') + '</div>';
}
function drawScTrend(h, D){
  const r = range(), days = Math.round((r.e - r.s) / day) + 1, labels = [];
  for (let i = 0; i < days; i++) labels.push(new Date(r.s + i * day).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'}));
  const a = scDays(D, r);
  if (!a.length){ h.innerHTML = scNone; return; }
  /* Google is two to three days behind: end the chart on its last day rather than dropping to zero. */
  const last = Math.min(days, Math.floor((Math.max(...a.map(x => x.at)) - r.s) / day) + 1), cut = v => v.slice(0, last);
  const series = [{name: 'Clicks from Google', values: cut(gaSeries(a, r, 'c')), color: SC_C}];
  if (D.forms) series.push({name: 'Leads from search', values: cut(daySeries(D.forms.rows.filter(isSearchLead), r)), color: '#0f9d6b'});
  lineChart(h, cut(labels), series, 240);
}
function drawScDevices(h, D){
  const rows = D.gsc.all.filter(x => x.t === 'v'), name = {MOBILE: 'Phone', DESKTOP: 'Computer', TABLET: 'Tablet'}, col = {MOBILE: SC_C, DESKTOP: '#0f9d6b', TABLET: '#d97706'};
  const segs = rows.map(x => ({label: name[x.k] || x.k, n: x.c, color: col[x.k] || '#94a3b8'})).sort((a, b) => b.n - a.n);
  if (!segs.some(x => x.n)){ h.innerHTML = scNone; return; }
  const tot = segs.reduce((s, x) => s + x.n, 0);
  h.innerHTML = '<div class="donutrow fade-in">' + donut(segs, 'CLICKS') + legend(segs, tot) + '</div>';
}
function drawScQueries(h, D, it){
  const all = D.gsc.all.filter(x => x.t === 'q');
  const st = S.ui[it.id] = S.ui[it.id] || {q: '', by: 'c', n: 25};
  const draw = () => {
    const f = st.q.trim().toLowerCase(), list = all.filter(x => !f || x.q.toLowerCase().indexOf(f) > -1).sort((a, b) => st.by === 'pos' ? a.pos - b.pos : (b[st.by] - a[st.by]) || (b.i - a.i));
    const th = (k, l) => '<th class="num"><button type="button" class="sc-sort' + (st.by === k ? ' on' : '') + '" data-by="' + k + '">' + l + '</button></th>';
    h.innerHTML = all.length ? '<div class="sc-bar"><input type="search" placeholder="Find a search…" value="' + esc(st.q) + '" data-q><span>' + fmt(list.length) + ' searches</span></div>' +
      '<div class="tbl-wrap fade-in"><table class="tbl"><thead><tr><th>Search</th>' + th('c', 'Clicks') + th('i', 'Impressions') + '<th class="num">Click rate</th>' + th('pos', 'Position') + '</tr></thead><tbody>' +
      list.slice(0, st.n).map(x => '<tr><td>' + esc(x.q) + '</td><td class="num">' + fmt(x.c) + '</td><td class="num">' + fmt(x.i) + '</td><td class="num">' + (x.i ? (x.c / x.i * 100).toFixed(1) + '%' : '—') + '</td><td class="num">' + pos1(x.pos) + '</td></tr>').join('') +
      '</tbody></table></div>' + (list.length > st.n ? '<button class="more" type="button" data-more>Show more · ' + fmt(list.length - st.n) + ' left</button>' : '') : scNone;
    const q = h.querySelector('[data-q]'); if (q) q.addEventListener('input', () => { st.q = q.value; const at = q.selectionStart; draw(); const q2 = h.querySelector('[data-q]'); q2.focus(); q2.setSelectionRange(at, at); });
    h.querySelectorAll('[data-by]').forEach(b => b.addEventListener('click', () => { st.by = b.dataset.by; draw(); }));
    const m = h.querySelector('[data-more]'); if (m) m.addEventListener('click', () => { st.n += 25; draw(); });
  };
  draw();
}
function drawScAlmost(h, D){
  const rows = D.gsc.all.filter(x => x.t === 'q' && x.pos >= 8 && x.pos <= 20 && x.i >= 5).sort((a, b) => b.i - a.i).slice(0, 10);
  ranked(h, rows.map(x => ({k: x.q, n: x.i})), '#d97706', {val: x => fmt(x.n) + ' views', sub: x => 'position ' + pos1(rows.find(y => y.q === x.k).pos), empty: 'No searches sitting just below the top results in this period.'});
}
function drawScPages(h, D){
  const rows = D.gsc.all.filter(x => x.t === 'p').sort((a, b) => b.c - a.c).slice(0, 10);
  const short = u => { const p = String(u).replace(/^https?:\/\/[^\/]+/i, '') || '/'; return p === '/' ? 'Home page' : p; };
  ranked(h, rows.map(x => ({k: x.u, label: short(x.u), n: x.c, i: x.i})), '#0891b2', {val: x => fmt(x.n) + ' clicks', sub: x => fmt(x.i) + ' impressions', empty: 'No clicks from Google in this period yet.'});
}
const COUNTRY = {can: 'Canada', usa: 'United States', gbr: 'United Kingdom', ind: 'India', aus: 'Australia', phl: 'Philippines', deu: 'Germany', fra: 'France', mex: 'Mexico', chn: 'China', bra: 'Brazil', pak: 'Pakistan', nga: 'Nigeria', zaf: 'South Africa', nld: 'Netherlands', irl: 'Ireland', nzl: 'New Zealand', are: 'United Arab Emirates', sau: 'Saudi Arabia', esp: 'Spain', ita: 'Italy', jpn: 'Japan', kor: 'South Korea', sgp: 'Singapore', bgd: 'Bangladesh', idn: 'Indonesia', vnm: 'Vietnam', egy: 'Egypt', tur: 'Turkey', pol: 'Poland'};
function drawScCountries(h, D){
  const rows = D.gsc.all.filter(x => x.t === 'g').sort((a, b) => b.c - a.c).slice(0, 10), tot = gaSum(D.gsc.all.filter(x => x.t === 'g'), 'c');
  ranked(h, rows.map(x => ({k: COUNTRY[x.k] || String(x.k).toUpperCase(), n: x.c})), T.loc, {sub: x => pct(x.n, tot) + ' of clicks', empty: 'No clicks from Google in this period yet.'});
}

/* ----- AI visibility ----- */
const AI_C = '#7c3aed', AI_COL = {ChatGPT: '#10a37f', Perplexity: '#1f8a9e', Gemini: '#4285f4', Copilot: '#0078d4', Claude: '#d97757', 'Meta AI': '#0866ff', DeepSeek: '#4d6bfe', Grok: '#111827', 'Other AI': '#94a3b8'};
const AI_RE = /chatgpt|openai|perplexity|gemini\.google|bard\.google|copilot|claude\.ai|meta\.ai|deepseek|grok|mistral|you\.com|phind/i;
const isAiLead = f => chGroup(f.channel) === 'AI assistants' || AI_RE.test(f.source || '') || AI_RE.test(f.referrer || '');
const aiName = s => { s = String(s || '').toLowerCase(); return /chatgpt|openai/.test(s) ? 'ChatGPT' : /perplexity/.test(s) ? 'Perplexity' : /gemini|bard/.test(s) ? 'Gemini' : /copilot/.test(s) ? 'Copilot' : /claude|anthropic/.test(s) ? 'Claude' : 'Other AI'; };
const aiVisits = (D, r) => D.ai ? D.ai.all.filter(x => x.t === 'a' && inR(x, r)) : [];
/* The latest run of AI Overview checks, one per search and place. */
function aioLatest(D){
  const all = D.ai ? D.ai.all.filter(x => x.t === 'o') : [], run = all.reduce((m, c) => c.d > m ? c.d : m, ''), seen = {};
  return {run, list: all.filter(c => c.d === run).filter(c => { const k = c.k + '|' + c.loc; if (seen[k]) return false; seen[k] = 1; return true; })};
}
const aioState = c => c.cited ? ['Cited', '#0f9d6b'] : c.named ? ['Named', '#1a73e8'] : c.shown ? ['Not mentioned', '#d97706'] : ['No AI Overview', '#94a3b8'];
const aiNone = '<div class="empty">No visits from AI assistants recorded in this period yet.</div>';
function drawAiKpis(h, D){
  const r = range(), pr = prevRange(), a = aiVisits(D, r), b = aiVisits(D, pr);
  const tile = (label, val, d, note, icon, tint, sp) => '<div class="kpi" style="--t:' + tint + ';cursor:default"><div class="l">' + esc(label) + ic(icon, 16) + '</div><div class="v">' + val + (d || '') + '</div><div class="n">' + note + '</div>' + (sp || '') + '</div>';
  const t = [], ex = (D.ai && D.ai.extra) || {};
  if (ex.ga !== false && D.ai){ const sa = gaSum(a, 's'), sb = gaSum(b, 's'); t.push(tile('Visits from AI assistants', fmt(sa), delta(sa, sb), 'vs ' + fmt(sb) + ' the period before', 'source', AI_C, spark(gaSeries(a, r, 's'), AI_C))); }
  if (D.forms){ const la = D.forms.rows.filter(isAiLead), lb = D.forms.prev.filter(isAiLead); t.push(tile('Leads from AI assistants', fmt(la.length), delta(la.length, lb.length), 'form leads from people who came from an AI assistant', 'form', T.forms, spark(daySeries(la, r), T.forms))); }
  const L = aioLatest(D).list;
  if (L.length){ const m = L.filter(c => c.cited || c.named).length; t.push(tile('Mentioned in AI Overviews', pct(m, L.length), '', fmt(m) + ' of ' + fmt(L.length) + ' tracked searches · ' + fmt(L.filter(c => c.shown).length) + ' showed an AI Overview', 'search', '#1baf7a')); }
  const gi = D.ai ? D.ai.all.filter(x => x.t === 'gi') : [];
  if (gi.length){ const ga = gaSum(gi.filter(x => inR(x, r)), 'n'), gb = gaSum(gi.filter(x => inR(x, pr)), 'n'); t.push(tile('Seen in Google’s AI answers', fmt(ga), delta(ga, gb), 'impressions in AI Overviews and AI Mode', 'eye', '#1a73e8')); }
  const bc = D.ai ? D.ai.all.filter(x => x.t === 'bc') : [];
  if (bc.length){ const ca = gaSum(bc.filter(x => inR(x, r)), 'n'), cb = gaSum(bc.filter(x => inR(x, pr)), 'n'); t.push(tile('Cited by Copilot', fmt(ca), delta(ca, cb), 'times Bing’s Copilot pointed to the site', 'bolt', '#0078d4')); }
  h.innerHTML = t.length ? '<div class="kpis fade-in">' + t.join('') + '</div>' : aiNone;
}
function drawAiTrend(h, D){
  const r = range(), days = Math.round((r.e - r.s) / day) + 1, labels = [];
  for (let i = 0; i < days; i++) labels.push(new Date(r.s + i * day).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'}));
  const a = aiVisits(D, r), series = [];
  if (D.ai && D.ai.extra && D.ai.extra.ga !== false) series.push({name: 'Visits from AI assistants', values: gaSeries(a, r, 's'), color: AI_C});
  if (D.forms) series.push({name: 'Leads from AI assistants', values: daySeries(D.forms.rows.filter(isAiLead), r), color: '#0f9d6b'});
  if (!series.some(x => x.values.some(Boolean))){ h.innerHTML = aiNone; return; }
  lineChart(h, labels, series, 240);
}
function drawAiAssistants(h, D){
  const g = gaGroup(aiVisits(D, range()), x => x.ai, x => x.s), segs = g.map(x => ({label: x.k, n: x.n, color: AI_COL[x.k] || '#94a3b8'}));
  if (!segs.length){ h.innerHTML = aiNone; return; }
  const tot = segs.reduce((s, x) => s + x.n, 0);
  h.innerHTML = '<div class="donutrow fade-in">' + donut(segs, 'VISITS') + legend(segs, tot) + '</div>';
}
function drawAiPages(h, D){
  const rows = aiVisits(D, range()), by = {};
  rows.forEach(x => { const o = by[x.p] = by[x.p] || {}; o[x.ai] = (o[x.ai] || 0) + x.s; });
  const items = gaGroup(rows, x => x.p, x => x.s).slice(0, 10).map(x => Object.assign(x, {label: x.k === '/' ? 'Home page' : x.k}));
  ranked(h, items, '#0891b2', {val: x => fmt(x.n) + ' visits', sub: x => Object.keys(by[x.k]).sort((a, b) => by[x.k][b] - by[x.k][a]).slice(0, 2).join(', '), empty: 'No visits from AI assistants recorded in this period yet.'});
}
function drawAiOverviews(h, D){
  const L = aioLatest(D);
  if (!L.list.length){ h.innerHTML = '<div class="empty">' + (D.ai && D.ai.extra && D.ai.extra.tracker ? 'No AI Overview checks yet for this business.' : 'AI Overview checks appear here once your Easyleads team adds this business to the AI Visibility Tracker.') + '</div>'; return; }
  const order = c => c.cited ? 0 : c.named ? 1 : c.shown ? 2 : 3;
  const list = L.list.slice().sort((a, b) => order(a) - order(b) || a.k.localeCompare(b.k));
  const cnt = s => L.list.filter(c => aioState(c)[0] === s).length;
  h.innerHTML = '<div class="ai-sum">' + ['Cited', 'Named', 'Not mentioned', 'No AI Overview'].map(s => '<span class="ai-st" style="--c:' + aioState({cited: s === 'Cited', named: s === 'Named', shown: s !== 'No AI Overview'})[1] + '"><i></i>' + s + ' <b>' + cnt(s) + '</b></span>').join('') + '<em>Checked ' + esc(new Date(L.run + 'T12:00:00').toLocaleDateString('en-CA', {month: 'short', day: 'numeric', year: 'numeric'})) + '</em></div>' +
    '<div class="tbl-wrap fade-in"><table class="tbl"><thead><tr><th>Search</th><th>Place</th><th>AI Overview</th><th>Page cited</th></tr></thead><tbody>' +
    list.map(c => { const st = aioState(c), u = (c.urls || [])[0]; return '<tr><td>' + esc(c.k) + '</td><td>' + esc(c.loc || '—') + '</td><td><span class="ai-st" style="--c:' + st[1] + '"><i></i>' + st[0] + '</span></td><td>' + (u && /^https?:\/\//.test(u) ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(String(u).replace(/^https?:\/\/(www\.)?/, '').slice(0, 48)) + '</a>' : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>';
}
function drawAiLeads(h, D){
  const rows = D.forms ? D.forms.rows.filter(isAiLead) : [];
  listWith(h, rows, f => ({title: f.name || f.email || f.phone || 'New submission', sub: esc(aiName((f.source || '') + ' ' + (f.referrer || '')) === 'Other AI' ? 'AI assistant' : aiName((f.source || '') + ' ' + (f.referrer || ''))) + ' · ' + esc(f.form || ''), right: esc(when(f.at))}),
    openSubmission, 'No leads from AI assistants in this period yet. New ones are recognised as they come in.', 6);
}
/* ----- email marketing ----- */
const subjKey = t => String(t || '').replace(/^\s*((re|fw|fwd|aw|tr)\s*:\s*)+/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
function drawEmail(h, D, it){
  if (!D.emails){ h.innerHTML = errHtml({code: 'scope', scope: 'View Conversation Messages'}); return; }
  const r = range(), pr = prevRange(), E = D.emails, cur = E.rows, prev = E.prev;
  const sent = cur.filter(m => m.dir === 'outbound'), psent = prev.filter(m => m.dir === 'outbound');
  const rep = cur.filter(m => m.dir === 'inbound'), prep = prev.filter(m => m.dir === 'inbound');
  const people = new Set(rep.map(m => m.contactId || m.from).filter(Boolean));
  const allC = (E.extra && E.extra.campaigns) || null;
  const camps = allC ? allC.filter(c => inR(c, r)) : [], pcamps = allC ? allC.filter(c => inR(c, pr)) : [];
  /* Replies to a campaign: an email back with the campaign's subject (Re: …). */
  const repBy = {}; rep.forEach(m => { const k = subjKey(m.subject); (repBy[k] = repBy[k] || []).push(m); });
  camps.forEach(c => { c.replies = (repBy[subjKey(c.subject)] || []).length; c.repliers = new Set((repBy[subjKey(c.subject)] || []).map(m => m.contactId || m.from)).size; });
  const sum = (a, k) => a.reduce((t, x) => t + (x[k] || 0), 0);
  const recips = sum(camps, 'total'), deliv = sum(camps, 'delivered'), failed = sum(camps, 'failed'), pdeliv = sum(pcamps, 'delivered');
  const isEmailCh = x => chGroup(x.channel) === 'Email' || /e-?mail|newsletter/i.test(x.source || '');
  const lf = D.forms ? D.forms.rows.filter(isEmailCh) : [], lfp = D.forms ? D.forms.prev.filter(isEmailCh) : [];
  const lc = D.contacts ? D.contacts.rows.filter(isEmailCh) : [], lcp = D.contacts ? D.contacts.prev.filter(isEmailCh) : [];
  const key = x => String(x.email || x.phone || x.name || x.id).toLowerCase();
  const leads = new Set(lf.map(key).concat(lc.map(key))).size, pleads = new Set(lfp.map(key).concat(lcp.map(key))).size;
  const ecIds = new Set((D.contacts ? D.contacts.all : []).filter(isEmailCh).map(c => c.id).concat(rep.map(m => m.contactId)));
  const opps = D.opps ? D.opps.all.filter(o => /e-?mail|newsletter|campaign/i.test(o.source || '') || ecIds.has(o.contactId)) : [];
  const oppsCur = opps.filter(o => inR(o, r)), won = opps.filter(o => o.status === 'won');
  const tile = (label, val, d, note, icon, tint) => '<div class="kpi" style="--t:' + tint + ';cursor:default"><div class="l">' + esc(label) + ic(icon, 16) + '</div><div class="v">' + val + (d || '') + '</div><div class="n">' + note + '</div></div>';
  const top = camps.slice().sort((a, b) => (b.replies - a.replies) || (b.delivered - a.delivered))[0];
  const sumTxt = (camps.length ? '<b>' + fmt(camps.length) + ' campaign' + (camps.length === 1 ? '' : 's') + '</b> went out this period to <b>' + fmt(recips) + ' recipients</b>, and <b>' + fmt(deliv) + ' were delivered</b> (' + pct(deliv, recips) + ')' + (failed ? ', ' + fmt(failed) + ' couldn’t be delivered' : '') + '. '
      : allC ? 'No email campaigns went out this period. ' : '') +
    '<b>' + fmt(rep.length) + ' repl' + (rep.length === 1 ? 'y' : 'ies') + '</b> came in from <b>' + fmt(people.size) + ' ' + (people.size === 1 ? 'person' : 'people') + '</b>' +
    (top && top.replies ? ', most of them to “' + esc(top.name) + '”' : '') + (leads ? ', and <b>' + fmt(leads) + ' new lead' + (leads === 1 ? '' : 's') + '</b> came from email' : '') +
    (oppsCur.length ? ', adding <b>' + money(oppsCur.reduce((s2, o) => s2 + o.value, 0)) + '</b> in new pipeline' : '') + '.';
  h.innerHTML = '<div class="fade-in"><div class="kpis">' +
    tile('Campaigns sent', fmt(camps.length), delta(camps.length, pcamps.length), fmt(recips) + ' recipients', 'mail', T.email) +
    tile('Delivered', fmt(deliv), delta(deliv, pdeliv), recips ? pct(deliv, recips) + ' delivered' + (failed ? ' · <span style="color:var(--bad)">' + fmt(failed) + ' failed</span>' : '') : 'no campaigns this period', 'in', '#0891b2') +
    tile('Replies', fmt(rep.length), delta(rep.length, prep.length), fmt(people.size) + ' ' + (people.size === 1 ? 'person' : 'people') + ' replied', 'reply', '#0f9d6b') +
    tile('Leads from email', fmt(leads), delta(leads, pleads), 'forms and new contacts from email', 'target', '#db2777') +
    (D.opps ? tile('Pipeline from email', money(opps.filter(o => o.status === 'open').reduce((s2, o) => s2 + o.value, 0)), '', oppsCur.length + ' new · ' + won.length + ' won · ' + money(won.reduce((s2, o) => s2 + o.value, 0)), 'money', T.opps) : '') +
    '</div><div class="em-sum"><div class="wic">' + ic('spark', 18) + '</div><div>' + sumTxt + '</div></div>' +
    '<div class="two"><div><div class="sec-h">Email activity <small>one-to-one emails sent and replies, by day</small></div><div data-chart></div></div><div>' +
    (allC ? '<div class="sec-h">Campaigns <small>' + fmt(camps.length) + ' this period · click one to see the email</small></div>' + (camps.length ? '<div class="tbl-wrap" style="max-height:340px"><table class="tbl clicky"><thead><tr><th>Campaign</th><th class="num">Recipients</th><th class="num">Delivered</th><th class="num">Replies</th></tr></thead><tbody>' +
      camps.map((c, i) => '<tr data-c="' + i + '" tabindex="0"><td><b class="cn" title="' + esc(c.name) + '">' + esc(c.name) + '</b><div class="muted" style="font-size:11.5px">' + esc(new Date(c.at).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'})) + (c.subject ? ' · ' + esc(c.subject) : '') + '</div></td>' +
        '<td class="num">' + fmt(c.total) + '</td><td class="num">' + fmt(c.delivered) + '<div class="muted" style="font-size:11px">' + pct(c.delivered, c.total) + '</div></td><td class="num">' + (c.replies ? '<b>' + fmt(c.replies) + '</b>' : '0') + '</td></tr>').join('') + '</tbody></table></div>'
        : '<div class="empty">No campaigns went out in this period.</div>')
      : '<div class="empty">Campaigns aren’t switched on for this account yet.</div>') +
    '</div></div>' + (rep.length ? '<div class="sec-h" style="margin-top:18px">Latest replies <small>' + fmt(rep.length) + ' · click one to read it</small></div><div data-replies></div>' : '') +
    (E.extra && E.extra.truncated ? '<div class="foot-note">This period has a lot of email; the oldest messages may not be counted. Pick a shorter period for exact numbers.</div>' : '') +
    '<div class="foot-note">Delivered and failed are ' + esc(BRAND) + '’s own counts for each send. Opens and clicks aren’t shared by ' + esc(BRAND) + '’s API, so they aren’t shown rather than guessed.</div></div>';
  const days = Math.round((r.e - r.s) / day) + 1, labels = [];
  for (let i = 0; i < days; i++) labels.push(new Date(r.s + i * day).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'}));
  lineChart(h.querySelector('[data-chart]'), labels, [{name: 'Sent', values: daySeries(sent, r), color: T.email}, {name: 'Replies', values: daySeries(rep, r), color: '#0f9d6b'}], 220);
  h.querySelectorAll('[data-c]').forEach(tr => { const go = () => openCampaign(camps[Number(tr.dataset.c)], repBy); tr.addEventListener('click', go); tr.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); });
  const rh = h.querySelector('[data-replies]');
  if (rh) listWith(rh, rep, m => ({title: m.name || m.from || 'A contact', sub: esc(m.snip ? m.snip.split('\n')[0].slice(0, 140) : (m.subject || 'Email reply')), icon: ic('reply', 16), bg: '#0f9d6b', right: esc(when(m.at))}),
    openMessage, '', 5);
}
/* An email shown exactly as it looks, in a sealed frame (no scripts run). */
function emailFrame(host, html){
  const f = document.createElement('iframe');
  f.className = 'mailframe'; f.setAttribute('sandbox', 'allow-same-origin allow-popups allow-popups-to-escape-sandbox'); f.setAttribute('referrerpolicy', 'no-referrer'); f.title = 'Email';
  const full = /<(html|body)[\s>]/i.test(html);
  const base = '<base target="_blank"><style>html,body{margin:0}img{max-width:100%;height:auto}' + (full ? 'body{padding:0 4px}' : 'body{padding:22px 26px;font:15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1b2533}blockquote{margin:12px 0;padding-left:12px;border-left:3px solid #dfe5ee;color:#6b7a90}') + '</style>';
  f.srcdoc = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + base) : base + html;
  host.innerHTML = ''; host.appendChild(f);
  const fit = () => { try{ const d = f.contentDocument; if (d && d.body) f.style.height = Math.max(240, Math.min(6000, d.documentElement.scrollHeight)) + 'px'; }catch(e){} };
  f.addEventListener('load', () => { fit(); setTimeout(fit, 400); setTimeout(fit, 1500); });
  return f;
}
function mailModal(title, sub, head){
  const b = document.createElement('div'); b.className = 'modal-back';
  b.innerHTML = '<div class="modal mailm" role="dialog" aria-modal="true"><div class="mm-top"><div class="wic" style="--t:' + T.email + '">' + ic('mail', 19) + '</div><div style="min-width:0;flex:1"><h2>' + esc(title) + '</h2><div class="mm-sub">' + sub + '</div></div>' +
    '<div class="seg sm" data-dev><button type="button" class="on" data-v="d">Desktop</button><button type="button" data-v="m">Phone</button></div><button class="iconbtn" type="button" data-x aria-label="Close">' + ic('x') + '</button></div>' +
    (head || '') + '<div class="mm-stage"><div class="mm-paper" data-paper><div class="mm-load"><span class="spin lg"></span><span>Loading the email…</span></div></div></div></div>';
  document.body.appendChild(b);
  const close = () => { b.remove(); document.removeEventListener('keydown', k); };
  const k = e => { if (e.key === 'Escape'){ const all = document.querySelectorAll('.drawer-back,.modal-back'); if (all[all.length - 1] === b) close(); } };
  document.addEventListener('keydown', k);
  b.addEventListener('click', e => { if (e.target === b) close(); });
  b.querySelector('[data-x]').addEventListener('click', close);
  b.querySelectorAll('[data-dev] button').forEach(x => x.addEventListener('click', () => { b.querySelectorAll('[data-dev] button').forEach(y => y.classList.toggle('on', y === x)); b.querySelector('[data-paper]').classList.toggle('phone', x.dataset.v === 'm'); }));
  return b;
}
async function openCampaign(c, repBy){
  const reps = (repBy && repBy[subjKey(c.subject)]) || [];
  const stat = (l, v, n) => '<div class="mm-stat"><b>' + v + '</b><span>' + esc(l) + '</span>' + (n ? '<small>' + n + '</small>' : '') + '</div>';
  const b = mailModal(c.name, esc((c.subject ? 'Subject: ' + c.subject + ' · ' : '') + fullDate(c.at)),
    '<div class="mm-stats">' + stat('Recipients', fmt(c.total)) + stat('Delivered', fmt(c.delivered), pct(c.delivered, c.total)) + stat('Couldn’t be delivered', fmt(c.failed), c.failed ? pct(c.failed, c.total) : '') +
    stat('Replies', fmt(reps.length), reps.length ? fmt(new Set(reps.map(m => m.contactId || m.from)).size) + ' people' : '') + '</div>' +
    (reps.length ? '<details class="mm-reps"><summary>Who replied (' + fmt(reps.length) + ')</summary><div data-reps></div></details>' : ''));
  const rr = b.querySelector('[data-reps]');
  if (rr) listWith(rr, reps, m => ({title: m.name || m.from || 'A contact', sub: esc((m.snip || m.subject || '').split('\n')[0].slice(0, 140)), icon: ic('reply', 16), bg: '#0f9d6b', right: esc(when(m.at))}), openMessage, '', 6);
  try{
    const j = await api('portalData', {session: S.session, domain: S.domain, kind: 'campaign', id: c.id});
    if (!b.isConnected) return;
    if (j.error) throw new Error(j.error);
    if (!j.html) throw new Error('This campaign’s email isn’t available to preview.');
    emailFrame(b.querySelector('[data-paper]'), j.html);
  }catch(e){ if (b.isConnected) b.querySelector('[data-paper]').innerHTML = errHtml(e); }
}
async function openMessage(m){
  const b = mailModal(m.subject || 'Email', esc((m.dir === 'inbound' ? 'From ' + (m.name ? m.name + ' · ' : '') + (m.from || '') : 'Sent') + ' · ' + fullDate(m.at)));
  b.querySelector('[data-dev]').style.display = 'none';
  try{
    const j = await api('portalData', {session: S.session, domain: S.domain, kind: 'message', id: m.id});
    if (!b.isConnected) return;
    if (j.error){ const e = new Error(j.error); e.code = j.error; e.scope = j.scope; throw e; }
    const x = j.message || {};
    b.querySelector('.mm-sub').textContent = [x.from ? 'From ' + x.from : '', x.to ? 'to ' + x.to : '', fullDate(x.at || m.at), x.attachments ? x.attachments + ' attachment' + (x.attachments === 1 ? '' : 's') : ''].filter(Boolean).join(' · ');
    if (j.html && /<[a-z][\s\S]*>/i.test(j.html)) emailFrame(b.querySelector('[data-paper]'), j.html);
    else b.querySelector('[data-paper]').innerHTML = '<div class="msgbox" style="margin:0">' + esc(j.html || m.snip || '(no text)') + '</div>';
  }catch(e){
    if (!b.isConnected) return;
    b.querySelector('[data-paper]').innerHTML = m.snip ? '<div class="msgbox" style="margin:0">' + esc(m.snip) + '</div>' : errHtml(e);
  }
}
/* ----- calls ----- */
function drawCallMix(h, D){
  if (D.calls.rows.some(x => x.tap)){
    const ads = D.calls.rows.filter(x => x.ads).length, segs2 = [{label: 'From the website', n: D.calls.rows.length - ads, color: T.calls, always: 1}, {label: 'From ads', n: ads, color: '#eda100', always: 1}];
    h.innerHTML = '<div class="donutrow fade-in">' + donut(segs2, 'CALL TAPS') + legend(segs2, D.calls.rows.length) + '</div><div class="foot-note">Taps on your phone number, recorded by Google Analytics. It can’t tell whether a call was answered.</div>';
    return;
  }
  const c = {ok: 0, missed: 0, vm: 0}; D.calls.rows.forEach(x => { c[callState(x).k]++; });
  const segs = [{label: 'Answered / outbound', n: c.ok, color: T.calls, always: 1}, {label: 'Missed', n: c.missed, color: '#e0413a', always: 1}, {label: 'Voicemail', n: c.vm, color: '#d9820b', always: 1}];
  h.innerHTML = '<div class="donutrow fade-in">' + donut(segs, 'CALLS') + legend(segs, D.calls.rows.length) + '</div>';
}
function drawCalls(h, D){
  listWith(h, D.calls.rows, c => { const st = callState(c);
    if (c.tap) return {title: c.ads ? 'Call from an ad' : 'Call from the website', sub: esc((c.page || '/') + ' · ' + chLabel(c.source)), icon: ic('phone', 16), bg: c.ads ? '#eda100' : T.calls,
      right: '<span class="pill ' + st.cls + '">' + st.label + '</span><br>' + esc(when(c.at))};
    return {title: c.name || (c.dir === 'outbound' ? c.to : c.from) || 'Unknown caller', sub: (c.dir === 'outbound' ? 'Outbound' : 'Inbound') + ' · ' + (c.dur ? dur(c.dur) : 'no answer'),
      icon: ic(st.k === 'missed' ? 'missed' : c.dir === 'outbound' ? 'out' : 'in', 16), bg: st.k === 'missed' ? '#e0413a' : st.k === 'vm' ? '#d9820b' : T.calls,
      right: '<span class="pill ' + st.cls + '">' + st.label + '</span><br>' + esc(when(c.at))}; }, openCall, 'No calls in this period.', 6);
}
/* ----- contacts ----- */
function drawContacts(h, D){
  listWith(h, D.contacts.rows, k => ({title: k.name, sub: [k.email, k.phone, [k.city, k.state].filter(Boolean).join(', ')].filter(Boolean).map(esc).join(' · ') || 'No contact details', right: (k.channel ? '<span class="pill blue">' + esc(k.channel) + '</span><br>' : '') + esc(when(k.at))}),
    openContact, 'No new contacts in this period.', 6);
}
function drawPeople(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {q: '', page: 1};
  h.innerHTML = '<div class="ib-tools"><label class="search">' + ic('search', 17) + '<input type="search" data-q placeholder="Search your contacts by name, email, phone or company…" value="' + esc(st.q) + '"></label><button class="btn" type="button" data-export>' + ic('dl', 15) + 'Export page</button></div><div data-t>' + SK.list(6) + '</div>';
  let rows = [], seq = 0;
  const load = async () => {
    const my = ++seq, t = h.querySelector('[data-t]');
    t.style.opacity = rows.length ? .55 : 1;
    try{
      const j = await api('portalData', {session: S.session, domain: S.domain, kind: 'people', page: st.page, q: st.q});
      if (my !== seq || !t.isConnected) return;
      if (j.error){ const e = new Error(j.error); e.code = j.error; e.scope = j.scope; throw e; }
      rows = j.rows || [];
      const tot = (j.extra && j.extra.total) || rows.length, from = (st.page - 1) * 100 + 1;
      t.style.opacity = 1;
      t.innerHTML = rows.length ? '<div class="tbl-wrap fade-in"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Source</th><th>Tags</th><th class="num">Added</th></tr></thead><tbody>' +
        rows.map((k, i) => '<tr class="click" data-i="' + i + '"><td><div class="who"><div class="av" style="background:' + hue(k.name) + '">' + esc(initials(k.name)) + '</div><div style="min-width:0"><b>' + esc(k.name) + '</b>' + (k.company ? '<span class="muted" style="font-size:12px">' + esc(k.company) + '</span>' : '') + '</div></div></td>' +
          '<td>' + esc(k.email || '—') + '</td><td style="white-space:nowrap">' + esc(k.phone || '—') + '</td><td>' + esc([k.city, k.state].filter(Boolean).join(', ') || '—') + '</td><td>' + (k.channel ? '<span class="pill blue">' + esc(k.channel) + '</span>' : '<span class="muted">—</span>') + '</td>' +
          '<td>' + (k.tags || []).slice(0, 3).map(x => '<span class="pill" style="margin:1px">' + esc(x) + '</span>').join('') + ((k.tags || []).length > 3 ? '<span class="muted" style="font-size:11px"> +' + (k.tags.length - 3) + '</span>' : '') + '</td><td class="num muted">' + esc(relDay(k.at)) + '</td></tr>').join('') + '</tbody></table></div>' +
        '<div class="pager"><span>' + fmt(from) + '–' + fmt(from + rows.length - 1) + ' of ' + fmt(tot) + ' contact' + (tot === 1 ? '' : 's') + (st.q ? ' matching “' + esc(st.q) + '”' : '') + '</span><div><button class="btn sm" type="button" data-pg="-1"' + (st.page <= 1 ? ' disabled' : '') + '>' + ic('chevl', 14) + 'Previous</button><button class="btn sm" type="button" data-pg="1"' + (from + rows.length - 1 >= tot ? ' disabled' : '') + '>Next' + ic('chev', 14) + '</button></div></div>'
        : '<div class="empty">' + (st.q ? 'No contacts match “' + esc(st.q) + '”.' : 'No contacts yet.') + '</div>';
      t.querySelectorAll('tr[data-i]').forEach(tr => tr.addEventListener('click', () => openContact(rows[Number(tr.dataset.i)])));
      t.querySelectorAll('[data-pg]').forEach(b => b.addEventListener('click', () => { st.page = Math.max(1, st.page + Number(b.dataset.pg)); load(); h.scrollIntoView({behavior: 'smooth', block: 'start'}); }));
    }catch(e){ if (my === seq && t.isConnected){ t.style.opacity = 1; t.innerHTML = errHtml(e); } }
  };
  let qT = null;
  h.querySelector('[data-q]').addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { st.q = e.target.value.trim(); st.page = 1; load(); }, 400); });
  h.querySelector('[data-export]').addEventListener('click', () => csv('contacts-' + S.domain + '-p' + st.page + '.csv', [['Name', 'Company', 'Email', 'Phone', 'City', 'Province/state', 'Source', 'Tags', 'Added']].concat(rows.map(k => [k.name, k.company, k.email, k.phone, k.city, k.state, k.channel || k.source, (k.tags || []).join('; '), fullDate(k.at)]))));
  load();
}
/* ----- sales ----- */
function drawPipeline(h, D){
  const open = D.opps.all.filter(o => o.status === 'open'), m = {};
  open.forEach(o => { const k = o.stage || 'No stage'; m[k] = m[k] || {k, n: 0, v: 0, pos: o.stagePos}; m[k].n++; m[k].v += o.value; });
  const items = Object.values(m).sort((a, b) => a.pos - b.pos);
  if (!items.length){ h.innerHTML = '<div class="empty">No open opportunities.</div>'; return; }
  ranked(h, items, T.opps, {val: x => money(x.v), sub: x => x.n + ' open'});
}
function drawOpps(h, D){
  const rows = D.opps.all.slice().sort((a, b) => (b.upd || b.at) - (a.upd || a.at));
  listWith(h, rows, o => ({title: o.name, sub: esc([o.pipeline, o.stage].filter(Boolean).join(' › ')), icon: ic('money', 16), bg: T.opps,
    right: '<b style="color:var(--ink)">' + money(o.value) + '</b><br><span class="pill ' + (o.status === 'won' ? 'good' : o.status === 'lost' || o.status === 'abandoned' ? 'bad' : 'blue') + '">' + esc(o.status) + '</span>'}),
    o => drawer(o.name, [['Value', money(o.value)], ['Status', o.status], ['Pipeline', o.pipeline], ['Stage', o.stage], ['Contact', o.contact], ['Source', o.source], ['Created', fullDate(o.at)], ['Updated', o.upd ? fullDate(o.upd) : '']], null, {icon: 'money', tint: T.opps}),
    'No opportunities yet.', 6);
}
function drawAppts(h, D){
  const now = Date.now(), up = D.appts.rows.filter(a => a.at >= now), past = D.appts.rows.filter(a => a.at < now).reverse();
  listWith(h, up.concat(past), a => ({title: a.title, sub: esc(a.calendar) + ' · ' + esc(new Date(a.at).toLocaleString('en-CA', {weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})),
    icon: ic('cal', 16), bg: a.at >= now ? T.appts : '#94a3b8', right: '<span class="pill ' + (/cancel|no.?show/i.test(a.status) ? 'bad' : /confirm|show/i.test(a.status) ? 'good' : '') + '">' + esc(a.status || (a.at >= now ? 'upcoming' : 'done')) + '</span>'}),
    a => drawer(a.title, [['When', fullDate(a.at)], ['Calendar', a.calendar], ['Status', a.status]], null, {icon: 'cal', tint: T.appts}), 'No appointments.', 6);
}


/* ----- heading & summary ----- */
/* Plain-words read of a widget's numbers: what changed, what stands out, what's next. */
const plural = (n, a, b) => fmt(n) + ' ' + (n === 1 ? a : (b || a + 's'));
const chg = (a, b) => { if (!b && !a) return 'the same as the period before'; if (!b) return 'up from none the period before'; const d = Math.round((a - b) / b * 100); return d === 0 ? 'level with the period before' : (d > 0 ? 'up ' : 'down ') + Math.abs(d) + '% from ' + fmt(b) + ' the period before'; };
function busiest(rows, r){ const a = daySeries(rows, r); let mi = -1, mx = 0; a.forEach((v, i) => { if (v > mx){ mx = v; mi = i; } }); return mi < 0 ? null : {n: mx, d: new Date(r.s + mi * day).toLocaleDateString('en-CA', {weekday: 'long', month: 'short', day: 'numeric'})}; }
function weekdayPeak(rows){ if (rows.length < 5) return ''; const c = [0, 0, 0, 0, 0, 0, 0]; rows.forEach(x => c[new Date(x.at).getDay()]++); const i = c.indexOf(Math.max(...c)); return ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][i]; }
function sumForms(D, focus){
  const F = D.forms; if (!F) return [];
  const r = range(), rows = F.rows, out = [];
  out.push('<b>' + plural(rows.length, 'form lead') + '</b> came in, ' + chg(rows.length, F.prev.length) + '.');
  if (!rows.length) return out;
  const src = groupBy(rows, f => chGroup(f.channel)).filter(x => x.k !== 'Not recorded'), pg = groupBy(rows, pathOf), fm = groupBy(rows, f => f.form), ct = groupBy(rows, cityOf);
  if (focus !== 'pages' && src[0]) out.push('<b>' + esc(src[0].k) + '</b> brought the most, ' + pct(src[0].n, rows.length) + ' of them' + (src[1] ? ', then ' + esc(src[1].k) + ' (' + pct(src[1].n, rows.length) + ')' : '') + '.');
  if ((focus === 'pages' || focus === 'inbox') && pg[0]) out.push('The page that sends the most leads is <b>' + esc(pg[0].k) + '</b> (' + plural(pg[0].n, 'lead') + ')' + (pg[1] ? ', followed by ' + esc(pg[1].k) : '') + '.');
  if ((focus === 'forms_by' || focus === 'inbox' || focus === 'forms_list') && fm[0]) out.push('Most people used <b>' + esc(formLabel(fm[0].k)) + '</b> (' + pct(fm[0].n, rows.length) + ').');
  if ((focus === 'locations' || focus === 'inbox') && ct[0]) out.push('<b>' + esc(ct[0].k) + '</b> is where the most leads are from (' + plural(ct[0].n, 'lead') + ').');
  const b = busiest(rows, r), wd = weekdayPeak(rows);
  if (focus === 'trend' || focus === 'kpis' || focus === 'inbox'){ if (b && b.n > 1) out.push('The busiest day was <b>' + esc(b.d) + '</b> with ' + plural(b.n, 'lead') + (wd ? '; ' + wd + ' tend to be busiest' : '') + '.'); }
  return out;
}
const SUM = {
  kpis: D => { const o = sumForms(D, 'kpis').slice(0, 2);
    if (D.calls) o.push(D.calls.rows.some(c => c.tap) || srcOf() === 'site' ? '<b>' + plural(D.calls.rows.length, 'call') + '</b> started from your website, ' + chg(D.calls.rows.length, D.calls.prev.length) + '.'
      : '<b>' + plural(D.calls.rows.length, 'call') + '</b>, ' + chg(D.calls.rows.length, D.calls.prev.length) + (D.calls.rows.filter(c => callState(c).k === 'missed').length ? '; ' + D.calls.rows.filter(c => callState(c).k === 'missed').length + ' were missed' : '') + '.');
    if (D.contacts) o.push('<b>' + plural(D.contacts.rows.length, 'new contact') + '</b> were added.');
    if (D.opps){ const open = D.opps.all.filter(x => x.status === 'open'); o.push('<b>' + money(open.reduce((a, x) => a + x.value, 0)) + '</b> is open in your pipeline across ' + plural(open.length, 'deal') + '.'); }
    return o; },
  inbox: D => sumForms(D, 'inbox'), forms_list: D => sumForms(D, 'forms_list'), forms_by: D => sumForms(D, 'forms_by'), pages: D => sumForms(D, 'pages'),
  sources: D => sumForms(D, 'sources'), locations: D => sumForms(D, 'locations'), trend: D => sumForms(D, 'trend'),
  calls_list: D => SUM.calls_mix(D), calls_mix: D => { const c = D.calls; if (!c) return []; const rows = c.rows, o = ['<b>' + plural(rows.length, 'call') + '</b>, ' + chg(rows.length, c.prev.length) + '.'];
    if (rows.some(x => x.tap)){ const ads = rows.filter(x => x.ads).length; if (rows.length) o.push(ads ? pct(ads, rows.length) + ' came from ads, the rest from people browsing your site.' : 'All of them came from people browsing your site.'); const pg = groupBy(rows, x => x.page); if (pg[0]) o.push('Most calls start on <b>' + esc(pg[0].k || '/') + '</b>.'); return o; }
    const st = {ok: 0, missed: 0, vm: 0}; rows.forEach(x => st[callState(x).k]++); if (rows.length) o.push(pct(st.ok, rows.length) + ' were answered' + (st.missed ? ', ' + st.missed + ' missed' : '') + (st.vm ? ' and ' + st.vm + ' went to voicemail' : '') + '.');
    const wd = weekdayPeak(rows); if (wd) o.push(wd + ' are your busiest days for calls.'); return o; },
  contacts_list: D => { const c = D.contacts; if (!c) return []; const o = ['<b>' + plural(c.rows.length, 'new contact') + '</b>, ' + chg(c.rows.length, c.prev.length) + '.']; const g = groupBy(c.rows, k => k.channel).filter(x => x.k); if (g[0]) o.push('Most came through <b>' + esc(g[0].k) + '</b>.'); return o; },
  people: () => ['Your full contact list, searchable by name, email, phone or company.'],
  pipeline: D => { const p = D.opps; if (!p) return []; const open = p.all.filter(x => x.status === 'open'), won = p.all.filter(x => x.status === 'won' && inR({at: x.upd || x.at}, range()));
    const st = {}; open.forEach(x => { st[x.stage] = (st[x.stage] || 0) + x.value; }); const top = Object.keys(st).sort((a, b) => st[b] - st[a])[0];
    return ['<b>' + money(open.reduce((a, x) => a + x.value, 0)) + '</b> is open across ' + plural(open.length, 'deal') + '.', top ? 'The most value sits in <b>' + esc(top) + '</b> (' + money(st[top]) + ').' : '', won.length ? '<b>' + plural(won.length, 'deal') + ' won</b> this period, worth ' + money(won.reduce((a, x) => a + x.value, 0)) + '.' : 'No deals were marked won this period.'].filter(Boolean); },
  opps_list: D => SUM.pipeline(D),
  appts: D => { const a = D.appts; if (!a) return []; const now = Date.now(), up = a.rows.filter(x => x.at >= now), inP = a.rows.filter(x => inR(x, range()));
    return ['<b>' + plural(inP.length, 'appointment') + '</b> in this period.', up.length ? '<b>' + plural(up.length, 'upcoming booking') + '</b>; the next is ' + esc(new Date(up[0].at).toLocaleString('en-CA', {weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})) + '.' : 'Nothing booked ahead yet.']; },
  email: D => { const E = D.emails; if (!E) return []; const r = range(), c = ((E.extra && E.extra.campaigns) || []).filter(x => inR(x, r)), rep = E.rows.filter(m => m.dir === 'inbound');
    const tot = c.reduce((a, x) => a + x.total, 0), del = c.reduce((a, x) => a + x.delivered, 0);
    return [c.length ? '<b>' + plural(c.length, 'campaign') + '</b> reached <b>' + fmt(del) + '</b> of ' + fmt(tot) + ' recipients (' + pct(del, tot) + ' delivered).' : 'No campaigns went out this period.',
      '<b>' + plural(rep.length, 'reply', 'replies') + '</b> came back, ' + chg(rep.length, E.prev.filter(m => m.dir === 'inbound').length) + '.']; }
};
function drawNote(h, D, it){
  const about = it.about && W[it.about] && it.about !== 'note' ? it.about : '';
  const lines = about && SUM[about] ? SUM[about](D).filter(Boolean) : [];
  const text = String(it.text || '').trim();
  h.innerHTML = '<div class="note fade-in">' +
    (text ? '<p class="nt">' + esc(text).replace(/\n/g, '<br>') + '</p>' : '') +
    (lines.length ? '<div class="nsum"><div class="nsh">' + ic('spark', 14) + 'What the numbers say' + (about ? '<span>about “' + esc(W[about].t) + '” · ' + esc(rangeText()) + '</span>' : '') + '</div><ul>' + lines.map(l => '<li>' + l + '</li>').join('') + '</ul></div>' : '') +
    (!text && !lines.length ? '<div class="empty">' + (S.editing ? 'Click the pencil to write a note, or attach it to a widget for an automatic summary.' : 'Nothing here yet.') + '</div>' : '') + '</div>';
}
function noteEditor(it, dash, done){
  const b = document.createElement('div'); b.className = 'modal-back';
  const types = [...new Set(dash.items.map(x => x.t).filter(t => t !== 'note' && W[t]))];
  b.innerHTML = '<div class="modal" style="width:min(560px,100%)" role="dialog" aria-modal="true"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><h2>Heading &amp; summary</h2><div style="color:var(--ink-2);font-size:13px">A title for a section of the dashboard, with your own words and an automatic read of the numbers.</div></div><button class="iconbtn" type="button" data-x aria-label="Close">' + ic('x') + '</button></div>' +
    '<div class="ne"><label>Heading</label><input type="text" data-t maxlength="80" value="' + esc(it.title || '') + '" placeholder="e.g. How your leads are doing">' +
    '<label>Your note <small>optional</small></label><textarea data-n rows="4" maxlength="600" placeholder="Anything you want to say about this section">' + esc(it.text || '') + '</textarea>' +
    '<label>Explain the numbers of</label><select data-a><option value="">Nothing, just my note</option>' + types.map(t => '<option value="' + t + '"' + (it.about === t ? ' selected' : '') + '>' + esc(W[t].t) + '</option>').join('') + '</select>' +
    '<div class="ne-act"><button class="btn" type="button" data-x2>Cancel</button><button class="btn go" type="button" data-ok>Save</button></div></div></div>';
  document.body.appendChild(b);
  const close = () => b.remove();
  b.addEventListener('click', e => { if (e.target === b) close(); });
  b.querySelector('[data-x]').addEventListener('click', close); b.querySelector('[data-x2]').addEventListener('click', close);
  b.querySelector('[data-ok]').addEventListener('click', () => {
    it.title = b.querySelector('[data-t]').value.trim().slice(0, 80); it.text = b.querySelector('[data-n]').value.trim().slice(0, 600); it.about = b.querySelector('[data-a]').value;
    close(); saveLayout(); done();
  });
  setTimeout(() => b.querySelector('[data-t]').focus(), 30);
}

/* ---------- detail drawers ---------- */
function drawer(title, pairs, extra, o){
  o = o || {};
  const b = document.createElement('div'); b.className = 'drawer-back';
  b.innerHTML = '<div class="drawer" role="dialog" aria-modal="true"><div style="display:flex;justify-content:space-between;align-items:center">' + (o.rw ? '<span class="pill blue">' + ic('users', 12) + ' Shared with your team · syncs live</span>' : '<span class="pill">' + ic('lock', 12) + ' Read only</span>') + '<button class="iconbtn" type="button" data-x aria-label="Close">' + ic('x') + '</button></div>' +
    '<div class="dh">' + (o.icon ? '<div class="av" style="background:' + (o.tint || T.email) + ';border-radius:16px">' + ic(o.icon, 22) + '</div>' : '<div class="av" style="background:' + hue(title) + '">' + esc(initials(title)) + '</div>') + '<div style="min-width:0"><h3>' + esc(title) + '</h3>' + (o.sub ? '<div class="dsub">' + o.sub + '</div>' : '') + '</div></div>' +
    (extra || '') + (pairs.length ? '<dl class="kv">' : '<dl class="kv" hidden>') + pairs.filter(p => p[1] != null && p[1] !== '').map(p => '<dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd>').join('') + '</dl></div>';
  document.body.appendChild(b);
  const close = () => { b.remove(); document.removeEventListener('keydown', k); };
  const k = e => { if (e.key === 'Escape'){ const all = document.querySelectorAll('.drawer-back,.modal-back'); if (all[all.length - 1] === b) close(); } };
  document.addEventListener('keydown', k);
  b.addEventListener('click', e => { if (e.target === b) close(); });
  b.querySelector('[data-x]').addEventListener('click', close);
  b.close = close;
  return b;
}
const openSubmission = f => { const b = openSubmission0(f); const k = personKey(f); if (!k) return b;
  const box = document.createElement('div'); box.className = 'pp-box'; box.innerHTML = '<div class="pp-h" style="margin:0">' + ic('users', 14) + 'This person</div><span style="font-size:13px;color:var(--ink-3)">Checking their other submissions…</span>';
  const dl = b.querySelector('.drawer .kv'); if (dl) dl.parentNode.insertBefore(box, dl);
  const show = all => { if (!box.isConnected) return; const list = peopleOf(all.concat([f]))[k] || [f];
    box.innerHTML = '<div class="pp-h" style="margin:0 0 4px">' + ic('users', 14) + 'This person</div>' + (list.length > 1
      ? '<div style="font-size:13.5px"><b>' + list.length + ' submissions</b> in total, from <b>' + esc(fullDate(list[list.length - 1].at)) + '</b> to <b>' + esc(fullDate(list[0].at)) + '</b>.</div><button class="btn" type="button" data-all>' + ic('users', 14) + 'See all ' + list.length + '</button>'
      : '<div style="font-size:13.5px">This is the only submission from them so far.</div>');
    const a = box.querySelector('[data-all]'); if (a) a.addEventListener('click', () => { b.close(); openPerson(list); }); };
  formsHistory().then(show).catch(() => show([f]));
  return b; };
const openSubmission0 = f => drawer(f.name || f.email || 'Form submission',
  [['Received', fullDate(f.at)], ['Form', f.form], ['Email', f.email], ['Phone', f.phone], ['Company', f.company], ['City', cityOf(f)], ['Province / state', regionOf(f)], ['Source', f.channel], ['Page', f.page]]
    .concat((f.fields || []).filter(x => !/^(phone|company|message|comments?|questions?|city|town|province|state|region)$/i.test(x[0]) && x[1] !== f.message)),
  f.message ? '<div class="msgbox">' + esc(f.message) + '</div>' : '', {sub: esc([f.email, f.phone].filter(Boolean).join(' · '))});
const chLabel = sm => { const p = String(sm || '').split(' / '), s = p[0] || '', m = (p[1] || '').toLowerCase(); if (/cpc|ppc|paid/.test(m)) return 'Ads · ' + s; if (m === 'organic') return 'Organic · ' + s; if (s === '(direct)') return 'Direct'; if (m === 'referral') return 'Referral · ' + s; return sm || 'Not recorded'; };
const openCall = c => { if (c.tap){ drawer(c.ads ? 'Call from an ad' : 'Call from the website', [['When', fullDate(c.at)], ['Page', c.page || '/'], ['Came from', chLabel(c.source)], ['Source / medium', c.source]], '<div class="msgbox" style="white-space:normal">Someone tapped your phone number on your website. Google Analytics records the tap; it can’t tell whether the call was answered or who called.</div>', {icon: 'phone', tint: T.calls}); return; }
  const st = callState(c); drawer(c.name || 'Call', [['Status', st.label], ['Direction', c.dir], ['Length', c.dur ? dur(c.dur) : '—'], ['From', c.from], ['To', c.to], ['When', fullDate(c.at)]], null, {icon: 'phone', tint: st.k === 'missed' ? '#e0413a' : T.calls}); };
const openContact = k => drawer(k.name, [['Email', k.email], ['Phone', k.phone], ['Company', k.company], ['City', k.city], ['Province / state', k.state], ['Country', k.country], ['Source', k.channel || k.source], ['Tags', (k.tags || []).join(', ')], ['Added', fullDate(k.at)]], null, {sub: esc(k.email || k.phone || '')});
function openList(type){
  const el = document.querySelector('.w[data-t="' + type + '"]');
  if (el){ el.scrollIntoView({behavior: 'smooth', block: 'center'}); el.animate([{boxShadow: '0 0 0 3px #1d7cf2'}, {boxShadow: '0 0 0 0 transparent'}], {duration: 1400}); }
  else toast('Add the “' + W[type].t + '” widget to see the details.');
}

/* ---------- dashboards ---------- */
function layout(){
  if (!S.layout || !Array.isArray(S.layout.dashes) || !S.layout.dashes.length) S.layout = {v: LAYOUT_V, dashes: DEFAULT_DASHES()};
  if (S.layout.v === 2) S.layout.v = LAYOUT_V;   /* v3 only adds sizes and notes; nothing to migrate */
  /* Dashboards saved before the inbox, email and contact-list widgets: add them once. */
  if ((S.layout.v || 1) < LAYOUT_V){
    const L = S.layout, first = L.dashes[0];
    if (first && !first.items.some(i => i.t === 'inbox')) first.items.splice(Math.min(1, first.items.length), 0, item('inbox'));
    if (!L.dashes.some(d => d.items.some(i => i.t === 'email'))) { const mk = DEFAULT_DASHES().find(d => d.items.some(i => i.t === 'email')); if (mk) L.dashes.push(mk); }
    if (!L.dashes.some(d => d.items.some(i => i.t === 'people'))){ const sales = L.dashes.find(d => /sales/i.test(d.name)); if (sales) sales.items.push(item('people')); else L.dashes.push({id: uid(), name: 'Contacts', items: [item('people')]}); }
    L.v = LAYOUT_V; setTimeout(() => saveLayout(true), 0);
  }
  /* Tabs added by themselves (Website, Google Search, AI visibility, Clients) are added once, and
     remembered in the layout, so a tab someone deletes stays deleted. */
  const A = S.layout.auto = S.layout.auto || {}, A0 = JSON.stringify(A);
  const hasAny = f => S.layout.dashes.some(d => d.items.some(i => W[i.t] && W[i.t][f]));
  const hasT = re => S.layout.dashes.some(d => d.items.some(i => re.test(i.t)));
  if (!A.web && hasT(/^web_/)) A.web = 1;
  if (!A.gsc && hasAny('gsc')) A.gsc = 1;
  if (!A.ai && hasAny('ai')) A.ai = 1;
  if (!A.crm && hasT(/^crm_/)) A.crm = 1;
  if (gaOn() && !A.web){
    A.web = 1;
    S.layout.dashes.splice(Math.min(1, S.layout.dashes.length), 0, {id: uid(), name: 'Website', items: [
      item('note', 12, {title: 'Your website', about: 'web_kpis', text: 'Visits, visitors and pages from Google Analytics, and how many visits turned into leads, compared with the period before.'}),
      item('web_kpis'), item('web_trend', 8, {h: 420}), item('web_sources', 4, {h: 420}), item('web_pages', 6, {h: 440}), item('web_cities', 6, {h: 440})]});
  }
  /* A business with Search Console gets a Google Search tab, and one with AI visibility an AI visibility tab, once each. */
  if (gscOn() && !A.gsc){
    A.gsc = 1;
    S.layout.dashes.push({id: uid(), name: 'Google Search', items: [
      item('note', 12, {title: 'How you show up on Google', about: 'sc_kpis', text: 'Clicks, impressions and positions from Google Search Console. Google reports these two to three days late.'}),
      item('sc_kpis'), item('sc_trend', 8, {h: 420}), item('sc_devices', 4, {h: 420}), item('sc_queries', 12, {h: 520}), item('sc_almost', 6, {h: 460}), item('sc_pages', 6, {h: 460})]});
  }
  if (aiOn() && !A.ai){
    A.ai = 1;
    S.layout.dashes.push({id: uid(), name: 'AI visibility', items: [
      item('note', 12, {title: 'How AI assistants see you', about: 'ai_kpis', text: 'People who found the business through ChatGPT, Perplexity, Gemini, Copilot or Claude, and how often Google’s AI Overviews mention it. AI assistants don’t pass on what the person asked, only that they came from them.'}),
      item('ai_kpis'), item('ai_trend', 8, {h: 420}), item('ai_assistants', 4, {h: 420}), item('ai_overviews', 12, {h: 480}), item('ai_pages', 6, {h: 440}), item('ai_leads', 6, {h: 440})]});
  }
  /* Every business gets a Clients tab (a shared CRM of everyone who reached out), once. */
  if (!A.crm){
    A.crm = 1;
    S.layout.dashes.splice(Math.min(2, S.layout.dashes.length), 0, {id: uid(), name: 'Clients', items: [
      item('note', 12, {title: 'Your clients', about: 'crm_board', text: 'Everyone who reached out, on any form. Move them through the stages, set a value, an owner and a follow-up date, and leave notes; your whole team sees it live.'}),
      item('crm_kpis'), item('crm_board', 12), item('crm_follow', 12), item('crm_clients', 12)]});
  }
  if (JSON.stringify(A) !== A0 && canEdit()) setTimeout(() => saveLayout(true), 0);
  /* Widgets made for one client appear on their dashboard by themselves (hidden everywhere else). */
  Object.keys(W).filter(t => W[t].only && W[t].only.indexOf(S.domain) > -1).forEach(t => {
    const L = S.layout;
    if (L.dashes.some(d => d.items.some(i => i.t === t))) return;
    const first = L.dashes[0], at = first.items.findIndex(i => i.t === 'kpis');
    first.items.splice(at < 0 ? 0 : at + 1, 0, item(t));
  });
  /* Logins allowed to change things in Easyleads get a Sales desk tab, once. */
  if (!A.desk && S.me && ghLogin() > 0 && !S.me.edge){ A.desk = 1; A.desk2 = 1; S.layout.dashes.splice(Math.min(1, S.layout.dashes.length), 0, deskDash()); if (canEdit()) setTimeout(() => saveLayout(true), 0); }
  /* Sales desks made before tasks, appointments, conversations, the summary and campaigns existed get them, once. */
  if (!A.desk2){ const dd = S.layout.dashes.find(d => d.items.some(i => i.t === 'ghl_deals')); if (dd){ A.desk2 = 1; deskUpgrade(dd); if (canEdit()) setTimeout(() => saveLayout(true), 0); } }
  if (LSNAP_OBJ !== S.layout){ LSNAP_OBJ = S.layout; LSNAP = JSON.stringify(S.layout); }
  return S.layout;
}
let saveT = null;
function saveLayout(silent){
  if (!canEdit()) return;
  const now = JSON.stringify(S.layout);
  if (silent !== true && !UNDO_BUSY && LSNAP && LSNAP !== now){
    const prev = LSNAP;
    undoPush(layLabel(JSON.parse(prev), S.layout), () => { S.layout = JSON.parse(prev); saveLayout(); renderApp(); }, {lay: 1});
  }
  LSNAP = now; LSNAP_OBJ = S.layout;
  ls.set('el_layout_' + (S.me && S.me.user.email), S.layout);
  clearTimeout(saveT);
  saveT = setTimeout(() => api('portalSaveLayout', {session: S.session, layout: S.layout}).then(j => { if (j.error) toast(j.error); }).catch(() => {}), 1200);
}
function header(me, c){
  return '<header class="top"><div class="top-in">' +
    '<div class="brandmark"><img src="img/easyleads-logo.png" alt="' + esc(BRAND) + '"></div><div class="sep hide-sm"></div>' +
    (me ? '<div class="client"><img alt="" src="https://www.google.com/s2/favicons?domain=' + encodeURIComponent(c.domain || '') + '&sz=64" onerror="this.style.visibility=\'hidden\'">' +
      (me.clients.length > 1 ? '<button type="button" class="biz-btn" data-client aria-haspopup="listbox" aria-label="Switch business"><b>' + esc(c.name || '') + '</b><svg class="biz-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button>' : '<b>' + esc(c.name || '') + '</b>') + '</div>' +
      (S.preview ? '<span class="pill warn hide-sm">' + ic('eye', 12) + ' Preview as client</span>' : '') : '<div class="sk" style="width:180px;height:38px;border-radius:14px"></div>') +
    '<div class="grow"></div>' +
    (me ? '<div class="seg hide-sm" data-period>' + PERIODS.map(p => '<button type="button" data-p="' + p[0] + '"' + (p[0] === S.period ? ' class="on"' : '') + '>' + p[1] + '</button>').join('') + '</div>' +
      '<div class="anchor"><button class="iconbtn tm-btn" type="button" data-team title="Your team: who is here and what they did" aria-label="Your team"><span data-teamav>' + ic('users') + '</span></button></div>' +
      '<div class="anchor"><button class="iconbtn" type="button" data-bell title="Form submissions" aria-label="Form submissions">' + ic('bell') + '<span class="spin" data-bells></span><span class="badge" data-bellc hidden></span></button></div>' +
      '<div class="anchor"><button class="iconbtn" type="button" data-phone title="Calls" aria-label="Calls">' + ic('phone') + '<span class="spin" data-phones></span><span class="badge" data-phonec hidden></span></button></div>' +
      '<div class="anchor"><button class="avatar" type="button" data-me aria-label="Account">' + esc(initials(me.user.name || me.user.email)) + '</button></div>'
      : '<div class="sk hide-sm" style="width:360px;height:38px;border-radius:13px"></div><div class="sk" style="width:40px;height:40px;border-radius:13px"></div><div class="sk" style="width:40px;height:40px;border-radius:13px"></div>') +
    '</div></header>';
}
/* The page while the account is loading: the real shape, shimmering. */
function renderShell(){
  app.innerHTML = header(null, {}) + '<main class="wrap"><div class="tabs"><div class="sk" style="width:96px;height:36px;border-radius:12px"></div><div class="sk" style="width:96px;height:36px;border-radius:12px"></div><div class="sk" style="width:80px;height:36px;border-radius:12px"></div></div>' +
    '<div class="bar"><div><div class="sk" style="width:220px;height:30px"></div><div class="sk" style="width:300px;height:12px;margin-top:10px"></div></div></div><div class="grid">' +
    [[12, 'kpis'], [8, 'chart'], [4, 'chart'], [12, 'inbox']].map(x => '<section class="w" style="--c:' + x[0] + '"><div class="wh"><div class="sk" style="width:38px;height:38px;border-radius:12px"></div><div style="flex:1"><div class="sk" style="width:160px;height:13px"></div><div class="sk" style="width:240px;height:10px;margin-top:7px"></div></div></div>' + SK[x[1]]() + '</section>').join('') + '</div></main>';
}
function renderApp(){
  const me = S.me, L = layout(), dash = curDash(), VD = dashList();
  const c = me.clients.find(x => x.domain === S.domain) || me.clients[0] || {};
  app.innerHTML = header(me, c) +
    '<main class="wrap' + (S.editing ? ' editing' : '') + '">' +
    '<div class="seg mob-period" data-period>' + PERIODS.map(p => '<button type="button" data-p="' + p[0] + '"' + (p[0] === S.period ? ' class="on"' : '') + '>' + p[1] + '</button>').join('') + '</div>' +
    (me.edge ? '<div class="edgebar">' + ic('edit', 15) + '<div class="eb-t"><b>You’re arranging this dashboard as EDGE.</b> Whatever you set here is exactly what ' + esc(me.user.name || me.user.email) + ' sees.</div>' +
      '<button class="btn eb-std" type="button" data-std title="Every new login, and any login without a dashboard of its own, starts with these dashboards and tabs">' + ic('grid', 14) + 'Make this the standard for new logins</button>' + (srcOf() === 'easyleads' ? '<label class="btn eb-wr' + (ghLogin() ? ' on' : '') + '" title="What this login may change in Easyleads from the dashboard">' + ic('bolt', 14) + 'Easyleads access:<select data-wr>' + GH_LV.map((n, i) => '<option value="' + i + '"' + (ghLogin() === i ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' : '') + '</div>' : '') +
    (VD.length > 1 || canEdit() ? '<div class="tabs" role="tablist">' + VD.map(d => { const hid = !visDash(d); return '<button class="tab' + (d === dash ? ' on' : '') + '" type="button" role="tab" data-dash="' + L.dashes.indexOf(d) + '"' + (hid ? ' style="opacity:.5" title="Hidden from this business until something on it is available"' : '') + '>' + esc(d.name) + (hid ? ' · hidden' : '') + '</button>'; }).join('') +
      (canEdit() ? '<button class="tab add" type="button" data-newdash>' + ic('plus', 14) + ' New dashboard</button>' : '') + '</div>' : '') +
    '<div class="bar"><div><h2>' + esc(dash.name) + '</h2><div class="sub">' + ic('cal', 13) + esc(rangeText()) + ' <span style="opacity:.5">·</span> <span class="ro">' + (canGhl() && dash.items.some(i => W[i.t] && W[i.t].wr) ? ic('bolt', 12) + 'Changes on this dashboard go live in ' + esc(BRAND) + '</span>' : ic('lock', 12) + (srcOf() === 'site' ? 'Read-only view of your website leads' : 'Read-only view of your ' + esc(BRAND) + ' account') + '</span>') + '</div></div><div class="grow"></div>' +
      (S.editing ? '<button class="btn" type="button" data-addw>' + ic('plus', 15) + 'Add widget</button><button class="btn" type="button" data-addnote>' + ic('spark', 15) + 'Add heading</button><button class="btn" type="button" data-rename>' + ic('edit', 15) + 'Rename</button>' +
        (L.dashes.length > 1 ? '<button class="btn" type="button" data-deldash>Delete dashboard</button>' : '') : '') +
      (canEdit() ? '<button class="btn' + (S.editing ? ' go' : '') + '" type="button" data-edit>' + (S.editing ? ic('check', 15) + 'Done' : ic('grid', 15) + 'Customize') + '</button>' : '') + '</div>' +
      (S.editing ? '<div class="edithint">' + ic('grid', 14) + '<span>Drag a dashboard tab to change the order. Drag a widget by its top bar to move it. Drag its edges or corner to make it wider, narrower, taller or shorter. Double-click the bottom edge to fit its content.</span></div>' : '') +
    '<div class="grid" data-grid></div></main>';
  wireTop(); drawGrid(dash);
  bellCheck();
  teamStart();
  botMount();
}
const rangeText = () => { const r = range(); return new Date(r.s).toLocaleDateString('en-CA', {month: 'short', day: 'numeric', year: 'numeric'}) + ' – ' + new Date(r.e).toLocaleDateString('en-CA', {month: 'short', day: 'numeric', year: 'numeric'}); };

function wireTop(){
  const q = s => app.querySelector(s);
  app.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { S.period = b.dataset.p; ls.set('el_period', S.period); renderApp(); }));
  const cs = q('[data-client]'); if (cs) cs.addEventListener('click', e => { e.stopPropagation(); bizMenu(cs); });
  app.querySelectorAll('[data-dash]').forEach(b => b.addEventListener('click', () => { S.dash = Number(b.dataset.dash); renderApp(); }));
  const nd = q('[data-newdash]'); if (nd) nd.addEventListener('click', () => {
    const name = prompt('Name the new dashboard:', 'My dashboard'); if (!name || !name.trim()) return;
    layout().dashes.push({id: uid(), name: name.trim().slice(0, 40), items: [item('kpis')]});
    S.dash = layout().dashes.length - 1; S.editing = true; saveLayout(); renderApp();
  });
  const wr = q('[data-wr]'); if (wr) wr.addEventListener('change', async () => {
    const lv = Number(wr.value) || 0, was = ghLogin(); wr.disabled = true;
    try{ const j = await api('portalSetWrite', {session: S.session, level: lv}); if (j.error) throw new Error(j.error); S.me.ghl = lv; S.me.write = lv > 0;
      const L2 = layout(); if (lv && !L2.dashes.some(d => d.items.some(i => W[i.t] && W[i.t].wr))){ L2.dashes.splice(Math.min(1, L2.dashes.length), 0, deskDash()); const A2 = (L2.auto = L2.auto || {}); A2.desk = 1; A2.desk2 = 1; saveLayout(true); }
      toast((S.me.user.name || 'This login') + ': Easyleads access set to ' + GH_LV[lv]); renderApp(); }
    catch(e){ toast(e.message); wr.value = String(was); wr.disabled = false; }
  });
  const sd = q('[data-std]'); if (sd) sd.addEventListener('click', async () => {
    if (!confirm('Make these dashboards and tabs the standard for every new login?\n\nLogins that already have their own dashboard keep it.')) return;
    sd.disabled = true;
    try{ const j = await api('portalSaveDefaultLayout', {session: S.session, layout: layout()}); toast(j && j.ok ? 'Saved: new logins start with this dashboard' : (j && j.error) || 'Couldn’t save that.'); }
    catch(e){ toast(e.message); }
    sd.disabled = false;
  });
  const ed = q('[data-edit]'); if (ed) ed.addEventListener('click', () => { S.editing = !S.editing; renderApp(); });
  const an = q('[data-addnote]'); if (an) an.addEventListener('click', () => { const dd = curDash(); const n = item('note', 12, {title: 'Summary'}); dd.items.unshift(n); saveLayout(); renderApp(); noteEditor(n, dd, () => renderApp()); });
  const L = layout(), dash = curDash();
  const aw = q('[data-addw]'); if (aw) aw.addEventListener('click', () => catalog(dash));
  const rn = q('[data-rename]'); if (rn) rn.addEventListener('click', () => { const n = prompt('Dashboard name:', dash.name); if (n && n.trim()){ dash.name = n.trim().slice(0, 40); saveLayout(); renderApp(); } });
  const delDash = d => { if (L.dashes.length < 2){ toast('Keep at least one dashboard.'); return; } const at = L.dashes.indexOf(d); L.dashes.splice(at, 1); S.dash = Math.max(0, Math.min(S.dash > at ? S.dash - 1 : S.dash, L.dashes.length - 1)); saveLayout(); renderApp(); };
  const dd = q('[data-deldash]'); if (dd) dd.addEventListener('click', () => delDash(dash));
  if (arranging()) tabsReorder(L);
  if (arranging() && L.dashes.length > 1) app.querySelectorAll('.tab[data-dash]').forEach(b => { const x = document.createElement('span'); x.className = 'tab-x'; x.title = 'Delete this dashboard'; x.innerHTML = ic('x', 11); x.addEventListener('click', e => { e.stopPropagation(); delDash(L.dashes[Number(b.dataset.dash)]); }); b.appendChild(x); });
  q('[data-bell]').addEventListener('click', e => { e.stopPropagation(); feedPop('forms'); });
  q('[data-team]').addEventListener('click', e => { e.stopPropagation(); teamPop(); });
  q('[data-phone]').addEventListener('click', e => { e.stopPropagation(); feedPop('calls'); });
  q('[data-me]').addEventListener('click', e => { e.stopPropagation(); meMenu(); });
}
/* Wide or narrow layout inside a widget, from its own width; and its height in the masonry grid. */
const ROW = 1, GAP = 18;
const fitRow = el => { if (!el.isConnected) return; const h = el.getBoundingClientRect().height; el.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((h + GAP) / ROW)); };
const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(es => es.forEach(e => { const w = e.contentRect.width; e.target.classList.toggle('nar', w < 640); e.target.classList.toggle('mid', w >= 640 && w < 900); fitRow(e.target); })) : null;
const canEdit = () => !!(S.me && S.me.canEdit !== false);
const SIZES = {w: [[3, '¼'], [4, '⅓'], [6, '½'], [8, '⅔'], [9, '¾'], [12, 'Full']], h: [[0, 'Fit content'], [260, 'Compact'], [420, 'Medium'], [620, 'Tall'], [860, 'Extra tall']]};
const MINH = 160, MAXH = 1600;

function drawGrid(dash){
  const grid = app.querySelector('[data-grid]');
  /* Redrawn on the same business and period (switching tabs, an undo, a widget moved…): no entrance animation, so nothing blinks. */
  const gsig = S.domain + '|' + S.period, calm = gsig === drawGrid.last; drawGrid.last = gsig;
  grid.innerHTML = '';
  const shown = arranging() ? dash.items : dash.items.filter(visIt);
  if (!shown.length){ grid.innerHTML = '<div class="w" style="--c:12"><div class="empty">This dashboard is empty.' + (canEdit() ? ' Click <b>Customize</b>, then <b>Add widget</b>.' : '') + '</div></div>'; return; }
  shown.forEach(it => {
    const def = W[it.t]; if (!def) return;
    const el = document.createElement('section');
    const cols = Math.max(3, Math.min(12, it.c || def.c));
    el.className = 'w' + (it.t === 'note' ? ' w-note' : '') + (it.h ? ' fixed' : '');
    el.style.setProperty('--c', cols); el.style.setProperty('--t', def.tint); if (it.h) el.style.setProperty('--h', it.h + 'px');
    el.dataset.t = it.t; el.dataset.id = it.id;
    if (calm) el.classList.add('no-anim'); else setTimeout(() => el.classList.add('no-anim'), 900);
    const title = it.t === 'note' ? (it.title || 'Summary') : (it.title || def.t), dsc = srcOf() === 'site' && def.ds ? def.ds : def.d;
    el.innerHTML = '<div class="wh" data-grip><div class="wic">' + ic(def.ic, 19) + '</div><div class="tt"><h3>' + esc(title) + '</h3>' + (it.t === 'note' ? '' : '<div class="d" title="' + esc(dsc) + '">' + esc(dsc) + '</div>') + '</div><div class="wtools">' +
      '<span class="grip" title="Drag to move">' + ic('move', 15) + '</span>' +
      (it.t === 'note' ? '<button class="tb" type="button" data-note title="Edit heading and summary">' + ic('edit', 13) + '</button>' : '<button class="tb" type="button" data-sum title="Add a heading and summary above this widget">' + ic('spark', 13) + '</button>') +
      '<button class="tb" type="button" data-size title="Size">' + ic('size', 13) + '<span>' + cols + '/12</span></button><button class="tb" type="button" data-del title="Remove">' + ic('x', 13) + '</button></div></div>' +
      '<div class="wbody" data-body><div class="wl">' + SK[def.sk || 'list']() + '<div class="wl-badge"><span class="wl-ring"><img src="img/easyleads-mark.png" alt=""></span><span class="wl-t">Loading ' + esc(String(title).toLowerCase()) + '</span></div></div></div>' +
      (canEdit() ? '<div class="rz rz-e" data-rz="e" title="Drag to change the width"></div><div class="rz rz-s" data-rz="s" title="Drag to change the height · double-click to fit"></div><div class="rz rz-se" data-rz="se" title="Drag to resize"></div>' : '');
    grid.appendChild(el);
    if (ro) ro.observe(el); else fitRow(el);
    const body = el.querySelector('[data-body]');
    const needs = needsOf(it);
    if (!visIt(it)){ body.innerHTML = errHtml({code: 'hidden'}); el.style.opacity = '.6'; }
    else { let drawn = null;
      const load = () => {
        const ks = needs.filter(k => kOn(k) !== null ? kOn(k) : (srcOf() === 'easyleads' || SITE_K[k]));
        /* Draw straight away from what is already loaded; only fetch (and redraw if it changed) when that is out of date. */
        const now = ks.map(k => [k, getNow(k)]);
        if (now.every(x => x[1])){ fin(now.map(x => [x[0], x[1].v])); if (now.every(x => x[1].ok)) return; }
        return Promise.all(ks.map(k => get(k).then(v => [k, v], e => [k, null, e]))).then(res => { if (drawn && res.length === drawn.length && res.every((r, i) => r[1] && r[1] === drawn[i][1])) return; fin(res); });
      };
      const fin = res => {
      if (!body.isConnected) return;
      drawn = res;
      const D = {}, errs = [];
      res.forEach(r => { if (r[1]) D[r[0]] = r[1]; else errs.push(r[2]); });
      const hard = it.t !== 'note' && needs.length && (errs.length === res.length || (!def.soft && errs.length));
      if (hard){ const ec = errs[0] && errs[0].code; if (!arranging() && (ec === 'scope' || ec === 'notavailable')){ if (ro) ro.unobserve(el); el.remove(); return; } body.innerHTML = errHtml(errs[0]); return; }
      try{ body.innerHTML = ''; def.draw(body, D, it); }catch(e){ console.warn(e); body.innerHTML = errHtml(e); }
      fitRow(el);
    }; load();
      /* Newer numbers for this widget arrived: draw them in place (not while arranging the dashboard). */
      const onFresh = e => { if (!body.isConnected){ window.removeEventListener('el-fresh', onFresh); return; } const x = e.detail || {}; if (x.domain === S.domain && needs.indexOf(x.kind) > -1 && !arranging()) load(); };
      window.addEventListener('el-fresh', onFresh);
    }
    if (!canEdit()) return;
    const setC = c => { it.c = Math.max(3, Math.min(12, c)); el.style.setProperty('--c', it.c); el.querySelector('[data-size] span').textContent = it.c + '/12'; saveLayout(); };
    const setH = h => { it.h = h ? Math.max(MINH, Math.min(MAXH, Math.round(h / 10) * 10)) : 0; el.classList.toggle('fixed', !!it.h); if (it.h) el.style.setProperty('--h', it.h + 'px'); else el.style.removeProperty('--h'); fitRow(el); saveLayout(); };
    el.querySelector('[data-del]').addEventListener('click', () => { el.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'scale(.96)'}], {duration: 160, easing: 'ease-out'}).onfinish = () => { dash.items.splice(dash.items.indexOf(it), 1); saveLayout(); drawGrid(dash); }; });
    el.querySelector('[data-size]').addEventListener('click', e => { e.stopPropagation(); sizeMenu(e.currentTarget, it, def, setC, setH, el); });
    const nb = el.querySelector('[data-note]'); if (nb) nb.addEventListener('click', () => noteEditor(it, dash, () => drawGrid(dash)));
    const sb = el.querySelector('[data-sum]'); if (sb) sb.addEventListener('click', () => { const n = item('note', 12, {title: def.t, about: it.t}); dash.items.splice(dash.items.indexOf(it), 0, n); saveLayout(); drawGrid(dash); noteEditor(n, dash, () => drawGrid(dash)); });
    /* resize: right edge = width, bottom edge = height, corner = both; snapped and shown live */
    el.querySelectorAll('[data-rz]').forEach(hd => {
      if (hd.dataset.rz === 's') hd.addEventListener('dblclick', () => setH(0));
      hd.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation(); hd.setPointerCapture(e.pointerId);
        const mode = hd.dataset.rz, r0 = el.getBoundingClientRect(), gw = grid.getBoundingClientRect().width, colW = (gw + GAP) / (getComputedStyle(grid).gridTemplateColumns.split(' ').length || 12);
        const c0 = it.c || def.c, h0 = r0.height;
        const badge = document.createElement('div'); badge.className = 'rzb'; el.appendChild(badge);
        const ghost = document.createElement('div'); ghost.className = 'rzghost'; el.appendChild(ghost);
        el.classList.add('resizing'); document.body.classList.add('resizing', 'cur-' + mode);
        let c = c0, h = it.h || 0;
        const show = () => { badge.innerHTML = '<b>' + c + '</b> of 12 wide' + (mode !== 'e' ? ' · <b>' + (h ? h + 'px' : 'fit') + '</b> tall' : ''); };
        const mv = ev => {
          if (mode !== 's'){ c = Math.max(3, Math.min(12, Math.round((r0.width + ev.clientX - e.clientX + GAP) / colW))); el.style.setProperty('--c', c); }
          if (mode !== 'e'){ h = Math.max(MINH, Math.min(MAXH, Math.round((h0 + ev.clientY - e.clientY) / 10) * 10)); el.classList.add('fixed'); el.style.setProperty('--h', h + 'px'); fitRow(el); }
          show();
        };
        const up = () => { hd.removeEventListener('pointermove', mv); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); badge.remove(); ghost.remove(); el.classList.remove('resizing'); document.body.classList.remove('resizing', 'cur-' + mode);
          if (c !== c0) setC(c); if (mode !== 'e' && h !== (it.h || 0)) setH(h); };
        show(); hd.addEventListener('pointermove', mv); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
      });
    });
    /* move: pick a widget up by its top bar; the others glide out of the way */
    el.querySelector('[data-grip]').addEventListener('pointerdown', e => {
      if (!S.editing || e.button !== 0 || e.target.closest('button')) return;
      startMove(e, el, it, dash, grid);
    });
  });
}
/* FLIP: remember where every widget was, move things in the DOM, then animate each from old to new. */
function flip(grid, change){
  const els = [...grid.children], before = new Map(els.map(x => [x, x.getBoundingClientRect()]));
  change();
  els.forEach(x => { if (x.classList.contains('lifted')) return; const a = before.get(x), b = x.getBoundingClientRect(); if (!a) return; const dx = a.left - b.left, dy = a.top - b.top;
    if (dx || dy) x.animate([{transform: 'translate(' + dx + 'px,' + dy + 'px)'}, {transform: 'none'}], {duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)'}); });
}
function startMove(e, el, it, dash, grid){
  const sx = e.clientX, sy = e.clientY, r0 = el.getBoundingClientRect();
  let started = false, ghost = null, raf = 0, lastY = sy, lastX = sx, hold = 0;
  const begin = () => {
    started = true;
    ghost = el.cloneNode(true); ghost.className += ' ghost'; ghost.style.width = r0.width + 'px'; ghost.style.height = Math.min(r0.height, 420) + 'px';
    ghost.style.left = r0.left + 'px'; ghost.style.top = r0.top + 'px'; document.body.appendChild(ghost);
    el.classList.add('placeholder'); document.body.classList.add('moving');
  };
  const scroll = () => { const m = 70, y = lastY; let d = 0; if (y < m) d = -Math.ceil((m - y) / 4); else if (y > innerHeight - m) d = Math.ceil((y - (innerHeight - m)) / 4); if (d){ scrollBy(0, d); place(lastX, lastY); } raf = requestAnimationFrame(scroll); };
  const place = (x, y) => {
    const t = document.elementFromPoint(x, y), over = t && t.closest('.grid > .w');
    if (!over || over === el || !grid.contains(over)) return;
    const rr = over.getBoundingClientRect(), after = (rr.width < grid.clientWidth * .9 && Math.abs(y - (rr.top + rr.height / 2)) < rr.height / 2) ? x > rr.left + rr.width / 2 : y > rr.top + rr.height / 2;
    const ref = after ? over.nextSibling : over;
    if (ref === el || ref === el.nextSibling && !after) return;
    if (Date.now() - hold < 180) return; hold = Date.now();
    flip(grid, () => grid.insertBefore(el, ref));
  };
  const mv = ev => {
    lastX = ev.clientX; lastY = ev.clientY;
    if (!started){ if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; begin(); raf = requestAnimationFrame(scroll); }
    ghost.style.transform = 'translate(' + (ev.clientX - sx) + 'px,' + (ev.clientY - sy) + 'px) rotate(.6deg)';
    place(ev.clientX, ev.clientY);
  };
  const up = () => {
    document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); cancelAnimationFrame(raf);
    if (!started) return;
    const to = el.getBoundingClientRect();
    ghost.animate([{transform: ghost.style.transform, opacity: 1}, {transform: 'translate(' + (to.left - r0.left) + 'px,' + (to.top - r0.top) + 'px)', opacity: .2}], {duration: 200, easing: 'ease-out'}).onfinish = () => ghost.remove();
    el.classList.remove('placeholder'); document.body.classList.remove('moving');
    const order = [...grid.children].map(x => x.dataset.id);
    dash.items.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    saveLayout();
  };
  document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
}
function sizeMenu(btn, it, def, setC, setH, el){
  closePops();
  const m = document.createElement('div'); m.className = 'menu sizem'; m.dataset.pop = 1;
  const c = it.c || def.c, h = it.h || 0;
  m.innerHTML = '<div class="sm-h">Width</div><div class="sm-row">' + SIZES.w.map(x => '<button type="button" data-c="' + x[0] + '"' + (x[0] === c ? ' class="on"' : '') + '><i style="--f:' + (x[0] / 12) + '"></i>' + x[1] + '</button>').join('') + '</div>' +
    '<div class="sm-h">Height</div><div class="sm-col">' + SIZES.h.map(x => '<button type="button" data-h="' + x[0] + '"' + (x[0] === h || (!h && !x[0]) ? ' class="on"' : '') + '>' + x[1] + (x[0] ? '<small>' + x[0] + 'px</small>' : '<small>grows with it</small>') + '</button>').join('') + '</div>' +
    '<div class="sm-tip">Or drag the widget’s edges for any size.</div>';
  btn.closest('.wtools').appendChild(m);
  m.addEventListener('click', e => e.stopPropagation());
  m.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { setC(Number(b.dataset.c)); m.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); }));
  m.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => { setH(Number(b.dataset.h)); m.querySelectorAll('[data-h]').forEach(x => x.classList.toggle('on', x === b)); }));
}

function catalog(dash){
  const b = document.createElement('div'); b.className = 'modal-back';
  const has = new Set(dash.items.map(i => i.t));
  const groups = [...new Set(Object.values(W).map(w => w.g))];
  b.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><h2>Add widgets</h2><div style="color:var(--ink-2);font-size:13px">Pick what you want to see on “' + esc(dash.name) + '”. You can add the same widget to as many dashboards as you like.</div></div>' +
    '<button class="iconbtn" type="button" data-x aria-label="Close">' + ic('x') + '</button></div><div class="cat">' +
    groups.filter(g => Object.keys(W).some(k => W[k].g === g && okFor(k))).map(g => '<div class="grp">' + esc(g) + '</div>' + Object.keys(W).filter(k => W[k].g === g && okFor(k)).map(k => '<div class="it"><div class="wic" style="--t:' + W[k].tint + '">' + ic(W[k].ic, 19) + '</div><div><b>' + esc(W[k].t) + '</b><small>' + esc(W[k].d) + '</small></div>' +
      '<button class="btn sm' + (has.has(k) ? '' : ' go') + '" type="button" data-add="' + k + '">' + (has.has(k) ? 'Add again' : 'Add') + '</button></div>').join('')).join('') + '</div></div>';
  document.body.appendChild(b);
  const close = () => { b.remove(); renderApp(); };
  b.addEventListener('click', e => { if (e.target === b) close(); });
  b.querySelector('[data-x]').addEventListener('click', close);
  b.querySelectorAll('[data-add]').forEach(x => x.addEventListener('click', () => { dash.items.push(item(x.dataset.add)); saveLayout(); x.textContent = 'Added ✓'; x.classList.remove('go'); }));
}

/* ---------- bell (forms) and phone (calls) ---------- */
const seenKey = k => 'el_seen_' + k + '_' + S.domain;
const feed = {forms: null, calls: null};
/* One notification is read once it is opened; "Mark all read" reads them all. */
const readKey = k => 'el_read_' + k + '_' + S.domain;
const nid = x => String(x.id || (x.at + '|' + (x.email || x.phone || x.from || x.name || '')));
const readSet = k => new Set(ls.get(readKey(k), []));
const isNew = (k, x, seen, rd) => !!seen && x.at > seen && !rd.has(nid(x)) && !(k === 'calls' && x.dir === 'outbound');
function markRead(k, x){
  const rd = readSet(k); rd.add(nid(x));
  const seen = ls.get(seenKey(k), 0);
  feed[k] && feed[k].then(j => { const keep = [...rd].filter(id => j.rows.some(r => nid(r) === id && r.at > seen)); ls.set(readKey(k), keep.slice(-300)); badge(k, j); }).catch(() => {});
}
function badge(k, j){
  const seen = ls.get(seenKey(k), 0), rd = readSet(k);
  const n = j.rows.filter(x => isNew(k, x, seen, rd)).length;
  const b = app.querySelector(k === 'forms' ? '[data-bellc]' : '[data-phonec]');
  if (!b) return;
  b.hidden = !n; b.textContent = n > 99 ? '99+' : n; b.parentNode.classList.toggle('ring', !!n);
}
function bellCheck(){
  ['forms', 'calls'].forEach(k => {
    const spin = app.querySelector(k === 'forms' ? '[data-bells]' : '[data-phones]');
    feed[k] = get(k, '30').then(j => {
      if (!ls.get(seenKey(k), 0)) ls.set(seenKey(k), Date.now());
      badge(k, j);
      return j;
    }).finally(() => { if (spin) spin.remove(); });
    feed[k].catch(() => {});
  });
}
async function feedPop(k){
  const open = document.querySelector('[data-pop="' + k + '"]');
  closePops();
  if (open) return;                    /* a second click on the icon closes it */
  const anchor = app.querySelector(k === 'forms' ? '[data-bell]' : '[data-phone]').parentNode;
  const pop = document.createElement('div'); pop.className = 'pop'; pop.dataset.pop = k;
  pop.innerHTML = '<h4>' + (k === 'forms' ? 'Form submissions' : 'Calls') + '<button class="tb" type="button" data-read>Mark all read</button></h4><div class="list">' + SK.list(4) + '</div><div class="pfoot">Last 30 days</div>';
  anchor.appendChild(pop);
  pop.addEventListener('click', e => e.stopPropagation());
  const seen = ls.get(seenKey(k), 0), rd = readSet(k);
  try{
    const j = await (feed[k] || get(k, '30'));
    if (!pop.isConnected) return;
    const rows = j.rows.slice(0, 30), list = pop.querySelector('.list');
    list.innerHTML = rows.length ? rows.map((x, i) => {
      if (k === 'forms') return rowHtml({i, cls: isNew(k, x, seen, rd) ? 'new' : '', title: x.name || x.email || 'New submission', sub: esc(x.form) + (cityOf(x) ? ' · ' + esc(cityOf(x)) : ''), right: esc(when(x.at))});
      const st = callState(x);
      if (x.tap) return rowHtml({i, cls: isNew(k, x, seen, rd) ? 'new' : '', title: x.ads ? 'Call from an ad' : 'Call from the website', sub: esc(x.page || '/'), icon: ic('phone', 15), bg: x.ads ? '#eda100' : T.calls, right: esc(when(x.at))});
      return rowHtml({i, cls: isNew(k, x, seen, rd) ? 'new' : '', title: x.name || (x.dir === 'outbound' ? x.to : x.from) || 'Unknown caller', sub: st.label + (x.dur ? ' · ' + dur(x.dur) : ''), icon: ic(st.k === 'missed' ? 'missed' : x.dir === 'outbound' ? 'out' : 'in', 15),
        bg: st.k === 'missed' ? '#e0413a' : st.k === 'vm' ? '#d9820b' : T.calls, right: esc(when(x.at))});
    }).join('') : '<div class="empty" style="margin:6px">' + (k === 'forms' ? 'No form submissions in the last 30 days.' : 'No calls in the last 30 days.') + '</div>';
    list.querySelectorAll('.row').forEach(el => el.addEventListener('click', () => {
      const x = rows[Number(el.dataset.i)];
      markRead(k, x); closePops();
      (k === 'forms' ? openSubmission : openCall)(x);
    }));
  }catch(e){ if (pop.isConnected) pop.querySelector('.list').innerHTML = errHtml(e); }
  pop.querySelector('[data-read]').addEventListener('click', () => {
    ls.set(seenKey(k), Date.now()); ls.set(readKey(k), []); closePops();
    const b = app.querySelector(k === 'forms' ? '[data-bellc]' : '[data-phonec]'); if (b){ b.hidden = true; b.parentNode.classList.remove('ring'); }
  });
}
/* ---------- Lead inbox: shared, live activity ----------
   Opening a lead is recorded (once every 5 minutes per person and lead) next to the marks. Every
   open dashboard gets the team's activity every few seconds: who is here, who opened which lead and
   who marked what. Each lead shows who opened it, and the inbox's Activity panel shows the history. */
const actMe = () => myMarkName() || (S.me && S.me.user && S.me.user.email) || 'You';
const actClock = t => new Date(t).toLocaleTimeString('en-CA', {hour: 'numeric', minute: '2-digit'});
function leadSeen(r){
  if (!r || !r.id || !S.session) return;
  const d = TEAM.dom === S.domain && TEAM.data, nm = actMe();
  if (d && d.acts){
    const last = d.acts.find(a => a.s === 'open' && a.id === r.id && a.name === nm);
    if (!last || Date.now() - last.t > 300000){
      d.acts.unshift({t: Date.now(), id: r.id, s: 'open', name: nm, by: S.me.edge && !S.me.edgeName ? 'EM' : initials(nm)});
      document.dispatchEvent(new CustomEvent('el-team', {detail: {domain: S.domain}}));
    }
  }
  api('portalSeen', {session: S.session, domain: S.domain, id: r.id}).catch(() => {});
}
const actVerb = (a, lead) => a.s === 'crm' ? crmVerb(a, lead) : a.s === 'open' ? 'opened <b>' + esc(lead) + '</b>'
  : MARKS[a.s] ? 'marked <b>' + esc(lead) + '</b> as <span class="ia-chip" style="--c:' + MARKS[a.s][1] + '">' + ic(MARKS[a.s][2], 11) + MARKS[a.s][0] + '</span>'
  : 'removed their mark on <b>' + esc(lead) + '</b>';
function ibTeam(h){
  const d = TEAM.dom === S.domain && TEAM.data, acts = d ? d.acts || [] : null, me = actMe();
  if (acts){
    const by = {};
    acts.forEach(a => { if (a.s !== 'open') return; const l = by[a.id] = by[a.id] || []; if (!l.some(x => x.name === a.name)) l.push(a); });
    h.querySelectorAll('[data-seen]').forEach(el => {
      const l = by[el.dataset.seen] || [];
      el.innerHTML = l.length ? '<span class="ib-eye">' + ic('eye', 12) + '</span><span class="ib-sv">' + l.slice(0, 3).map(a => '<i style="background:' + hue(a.name) + '">' + esc(a.by) + '</i>').join('') + '</span><span>Opened by ' + esc(l[0].name === me ? 'you' : l[0].name.split(' ')[0]) + (l.length > 1 ? ' +' + (l.length - 1) : '') + ' · ' + esc(ago(l[0].t)) + '</span>' : '';
      el.title = l.length ? 'Opened by ' + l.map(a => (a.name === me ? 'you' : a.name) + ' (' + ago(a.t) + ')').join(', ') : '';
    });
  }
  const b = h.querySelector('[data-act]');
  if (b && d){
    const on = d.people.filter(p => p.on && !p.me);
    b.querySelector('[data-iaav]').innerHTML = on.slice(0, 3).map(p => '<i style="background:' + hue(p.name || p.email) + '">' + esc(p.by) + '</i>').join('');
    b.classList.toggle('live', on.length > 0);
    b.title = on.length ? on.map(p => p.name || p.email).join(', ') + (on.length === 1 ? ' is' : ' are') + ' here now · see who opened and marked what' : 'Who opened and marked what in this inbox';
    const since = ls.get('el_ia_seen_' + S.domain, 0) || Date.now() - 864e5;
    const n = h.querySelector('.ia-panel') ? 0 : (acts || []).filter(a => a.t > since && a.name !== me).length;
    b.querySelector('[data-iac]').textContent = n ? (n > 99 ? '99+' : n) : '';
  }
  const pn = h.querySelector('.ia-panel'); if (pn && pn.redraw) pn.redraw();
}
function ibActPanel(h){
  const old = h.querySelector('.ia-panel'); if (old){ old.close(); return; }
  const st = {f: 'all', who: ''}, shown = new Set();
  let first = true;
  const p = document.createElement('div'); p.className = 'ia-panel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Inbox activity');
  h.appendChild(p);
  p.addEventListener('click', e => e.stopPropagation());
  const onKey = e => { if (e.key === 'Escape' && !document.querySelector('.drawer-back,.modal-back')) p.close(); };
  const tick = setInterval(() => {
    if (!p.isConnected) return clearInterval(tick);
    const u = p.querySelector('[data-upd]'); if (!u) return;
    const s = TEAM.got ? Math.max(0, Math.round((Date.now() - TEAM.got) / 1000)) : null;
    u.textContent = s == null ? 'Connecting…' : s < 3 ? 'Updated just now' : 'Updated ' + s + ' s ago';
  }, 1000);
  p.close = () => { p.classList.remove('in'); document.removeEventListener('keydown', onKey); clearInterval(tick); setTimeout(() => p.remove(), 260); const b = h.querySelector('[data-act]'); if (b) b.classList.remove('on'); };
  document.addEventListener('keydown', onKey);
  p.redraw = () => {
    const d = TEAM.dom === S.domain && TEAM.data, me = actMe(), L = h.__leads || {}, acts = d ? (d.acts || []).concat(crmActs(L)).sort((x, y) => y.t - x.t) : null;
    ls.set('el_ia_seen_' + S.domain, Date.now());
    const sc = p.querySelector('.ia-tl'), top = sc ? sc.scrollTop : 0;
    const names = acts ? [...new Set(acts.map(a => a.name))] : [];
    const list = acts ? acts.filter(a => (st.f === 'all' || (st.f === 'open' ? a.s === 'open' : st.f === 'crm' ? a.s === 'crm' : a.s !== 'open' && a.s !== 'crm')) && (!st.who || a.name === st.who)).slice(0, 150) : [];
    const on = d ? d.people.filter(x => x.on) : [];
    let day = '', tl = '';
    list.forEach((a, i) => {
      const dk = new Date(a.t).toDateString();
      if (dk !== day){ day = dk; const rd = relDay(a.t); tl += '<div class="ia-day">' + esc(rd.charAt(0).toUpperCase() + rd.slice(1)) + '</div>'; }
      const r = L[a.id], lead = r ? (r.name || r.email || r.phone || 'a lead') : 'a lead', key = a.t + '|' + a.id + '|' + a.s + '|' + a.name, isNew = !first && !shown.has(key);
      shown.add(key);
      const M_ = MARKS[a.s], cg = a.s === 'crm' ? crmLook(a) : null, c = cg ? cg[0] : a.s === 'open' ? '#6366f1' : M_ ? M_[1] : '#94a3b8', icn = cg ? cg[1] : a.s === 'open' ? 'eye' : M_ ? M_[2] : 'x';
      tl += '<div class="ia-it' + (isNew ? ' new' : '') + (r ? '' : ' nolead') + '" data-ix="' + i + '"><div class="ia-av" style="background:' + hue(a.name) + ';--c:' + c + '">' + esc(a.by) + '<b>' + ic(icn, 10) + '</b></div>' +
        '<div class="ia-tx"><strong>' + esc(a.name === me ? 'You' : a.name) + '</strong> ' + actVerb(a, lead) + '<small title="' + esc(fullDate(a.t)) + '">' + esc(ago(a.t)) + ' · ' + esc(actClock(a.t)) + '</small></div></div>';
    });
    first = false;
    p.innerHTML = '<div class="ia-hd"><div class="ia-ic">' + ic('clock', 18) + '</div><div><h4>Inbox activity</h4><p><span class="ia-dot"></span>Live · everyone on this dashboard sees the same</p></div><button type="button" class="ia-x" data-x aria-label="Close">' + ic('x', 16) + '</button></div>' +
      '<div class="ia-here' + (on.length ? '' : ' none') + '">' + (on.length ? '<span class="ia-stk">' + on.slice(0, 5).map(x => '<i style="background:' + hue(x.name || x.email) + '" title="' + esc(x.name || x.email) + '">' + esc(x.by) + '</i>').join('') + '</span><span><b>' + esc(on.map(x => x.me ? 'You' : (x.name || x.email || 'Teammate').split(' ')[0]).join(', ')) + '</b>' + (on.length === 1 && !on[0].me ? ' is' : ' are') + ' here now</span>' : '<span>No one is on this dashboard right now</span>') + '</div>' +
      '<div class="ia-f"><div class="ia-seg">' + [['all', 'All'], ['open', 'Opened'], ['mark', 'Marked'], ['crm', 'Clients']].map(([k, l]) => '<button type="button" data-f="' + k + '"' + (st.f === k ? ' class="on"' : '') + '>' + l + '</button>').join('') + '</div>' +
      (names.length > 1 ? '<div class="ia-pp">' + names.slice(0, 8).map(n => '<button type="button" data-w="' + esc(n) + '" title="' + esc(n === me ? 'Only you' : 'Only ' + n) + '" style="background:' + hue(n) + '"' + (st.who === n ? ' class="on"' : '') + '>' + esc(initials(n)) + '</button>').join('') + '</div>' : '') + '</div>' +
      '<div class="ia-tl">' + (acts ? (tl || '<div class="ia-empty"><span>' + ic('clock', 22) + '</span>' + (acts.length ? 'Nothing matches this filter.' : 'No activity yet. When anyone opens or marks a lead, or changes a client’s stage, owner, follow-up or notes, it shows here for everyone.') + '</div>') : '<div class="ia-empty"><span class="spin"></span>Loading the activity…</div>') + '</div>' +
      '<div class="ia-ft"><span class="ia-dot"></span><span data-upd>' + (TEAM.got ? 'Updated just now' : 'Connecting…') + '</span><span class="ia-n">' + (acts ? fmt(acts.length) + ' event' + (acts.length === 1 ? '' : 's') : '') + '</span></div>';
    const sc2 = p.querySelector('.ia-tl'); if (sc2) sc2.scrollTop = top;
    p.querySelector('[data-x]').addEventListener('click', () => p.close());
    p.querySelectorAll('[data-f]').forEach(x => x.addEventListener('click', () => { st.f = x.dataset.f; p.redraw(); }));
    p.querySelectorAll('[data-w]').forEach(x => x.addEventListener('click', () => { st.who = st.who === x.dataset.w ? '' : x.dataset.w; p.redraw(); }));
    p.querySelectorAll('[data-ix]').forEach(el => el.addEventListener('click', () => { const a0 = list[Number(el.dataset.ix)], r = L[a0.id]; if (a0.s === 'crm' && r){ openPerson(peopleOf(Object.values(L))[a0.k] || [r]); return; } if (r){ openSubmission(r); leadSeen(r); } }));
  };
  p.redraw();
  const b = h.querySelector('[data-act]'); if (b){ b.classList.add('on'); const c = b.querySelector('[data-iac]'); if (c) c.textContent = ''; }
  requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('in')));
  teamFetch();
}
(function(){ if (document.getElementById('ia-css')) return; const st = document.createElement('style'); st.id = 'ia-css';
  st.textContent = '.ia-host{position:relative}' +
    '.btn.ib-act{gap:8px}.btn.ib-act.on{border-color:#c7d2fe;background:#eef2ff;color:#3730a3}' +
    '.ib-act .ia-av{display:inline-flex}.ib-act .ia-av:empty{display:none}.ib-act .ia-av i{width:22px;height:22px;border-radius:50%;color:#fff;font-style:normal;font-size:9.5px;font-weight:700;display:grid;place-items:center;border:2px solid #fff;margin-left:-7px;position:relative}.ib-act .ia-av i:first-child{margin-left:0}' +
    '.ib-act .ia-av i:after{content:"";position:absolute;right:-2px;bottom:-2px;width:7px;height:7px;border-radius:50%;background:#10b981;border:1.5px solid #fff}' +
    '.ib-act em{font-style:normal;min-width:18px;height:18px;padding:0 5px;box-sizing:border-box;border-radius:9px;background:#0086ff;color:#fff;font-size:11px;font-weight:700;display:inline-grid;place-items:center;animation:iaPop .35s cubic-bezier(.2,.8,.2,1)}.ib-act em:empty{display:none}' +
    '.ia-dot{width:8px;height:8px;border-radius:50%;background:#10b981;flex:none;animation:iaPulse 2s infinite}' +
    '@keyframes iaPulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.55)}70%{box-shadow:0 0 0 7px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}@keyframes iaPop{0%{transform:scale(.4)}100%{transform:scale(1)}}' +
    '.ib-seen{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11.5px;color:#7a8396;line-height:1}.ib-seen:empty{display:none}.ib-eye{color:#6366f1;display:grid}' +
    '.ib-sv{display:inline-flex}.ib-sv i{width:18px;height:18px;border-radius:50%;color:#fff;font-style:normal;font-size:8px;font-weight:700;display:grid;place-items:center;border:1.5px solid #fff;margin-left:-5px}.ib-sv i:first-child{margin-left:0}' +
    '.ia-panel{position:absolute;top:0;right:0;bottom:0;width:min(440px,100%);z-index:20;background:rgba(255,255,255,.98);-webkit-backdrop-filter:blur(16px) saturate(1.6);backdrop-filter:blur(16px) saturate(1.6);border:1px solid rgba(11,12,15,.08);border-radius:18px;box-shadow:-24px 0 60px -28px rgba(11,12,15,.38),0 2px 6px rgba(11,12,15,.04);display:flex;flex-direction:column;overflow:hidden;transform:translateX(28px);opacity:0;transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .22s}.ia-panel.in{transform:none;opacity:1}' +
    '.ia-hd{display:flex;align-items:flex-start;gap:12px;padding:18px 18px 12px}.ia-ic{width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,#eef2ff,#e0f2fe);color:#4f46e5;display:grid;place-items:center;flex:none;box-shadow:inset 0 0 0 1px rgba(79,70,229,.1)}' +
    '.ia-hd h4{margin:1px 0 0;font-size:16px;letter-spacing:-.015em;font-weight:700}.ia-hd p{margin:3px 0 0;font-size:12.5px;color:#7a8396;display:flex;align-items:center;gap:7px}' +
    '.ia-x{margin-left:auto;border:0;background:#f3f4f7;width:32px;height:32px;border-radius:10px;cursor:pointer;color:#5b6273;display:grid;place-items:center;flex:none;transition:background .15s,color .15s}.ia-x:hover{background:#e9ebf0;color:#0b0c0f}' +
    '.ia-here{margin:0 18px 12px;padding:10px 12px;border-radius:14px;background:linear-gradient(180deg,#f4fbf8,#eef8f3);border:1px solid #d7eee3;display:flex;align-items:center;gap:10px;font-size:12.5px;color:#2f5f4b}.ia-here.none{background:#f7f8fa;border-color:#eceef2;color:#8a92a3}.ia-here b{font-weight:650}' +
    '.ia-stk{display:inline-flex;flex:none}.ia-stk i{width:26px;height:26px;border-radius:50%;color:#fff;font-style:normal;font-size:10px;font-weight:700;display:grid;place-items:center;border:2px solid #fff;margin-left:-8px;position:relative}.ia-stk i:first-child{margin-left:0}.ia-stk i:after{content:"";position:absolute;right:-2px;bottom:-2px;width:8px;height:8px;border-radius:50%;background:#10b981;border:2px solid #fff}' +
    '.ia-f{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:0 18px 10px;flex-wrap:wrap}' +
    '.ia-seg{display:inline-flex;background:#f1f2f5;border-radius:11px;padding:3px}.ia-seg button{border:0;background:none;padding:6px 12px;border-radius:8px;font:inherit;font-size:12.5px;font-weight:600;color:#677083;cursor:pointer;transition:background .15s,color .15s,box-shadow .15s}.ia-seg button:hover{color:#0b0c0f}.ia-seg button.on{background:#fff;color:#0b0c0f;box-shadow:0 1px 2px rgba(11,12,15,.1),0 0 0 1px rgba(11,12,15,.03)}' +
    '.ia-pp{display:inline-flex;gap:5px}.ia-pp button{border:0;padding:0;width:26px;height:26px;border-radius:50%;color:#fff;font:inherit;font-size:9.5px;font-weight:700;cursor:pointer;opacity:.5;transition:opacity .15s,transform .15s}.ia-pp button:hover{opacity:1;transform:translateY(-1px)}.ia-pp button.on{opacity:1;outline:2px solid #0086ff;outline-offset:2px}' +
    '.ia-tl{flex:1;overflow:auto;padding:0 14px 12px;overscroll-behavior:contain}' +
    '.ia-day{position:sticky;top:0;z-index:1;background:linear-gradient(180deg,rgba(255,255,255,.98) 70%,rgba(255,255,255,0));font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9aa2b1;padding:12px 6px 6px}' +
    '.ia-it{position:relative;display:flex;gap:12px;padding:9px 8px;border-radius:12px;cursor:pointer;transition:background .15s}.ia-it:hover{background:#f5f7fa}.ia-it.nolead{cursor:default}' +
    '.ia-it:before{content:"";position:absolute;left:25px;top:46px;bottom:-10px;width:2px;border-radius:2px;background:#eef0f4}.ia-it:last-child:before,.ia-it:has(+ .ia-day):before{display:none}' +
    '.ia-av{position:relative;flex:none;width:36px;height:36px;border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center;box-shadow:0 2px 6px -2px rgba(11,12,15,.25)}' +
    '.ia-av b{position:absolute;right:-4px;bottom:-4px;width:19px;height:19px;border-radius:50%;background:var(--c);color:#fff;display:grid;place-items:center;border:2px solid #fff}' +
    '.ia-tx{flex:1;min-width:0;font-size:13px;line-height:1.45;color:#4b5263;padding-top:1px}.ia-tx strong{color:#0b0c0f;font-weight:650}.ia-tx b{color:#0b0c0f;font-weight:600}.ia-tx small{display:block;color:#9aa2b1;font-size:11.5px;margin-top:2px}' +
    '.ia-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 8px 1px 6px;border-radius:99px;font-size:11.5px;font-weight:650;color:var(--c);background:color-mix(in srgb,var(--c) 12%,#fff);vertical-align:1px}' +
    '.ia-it.new{animation:iaNew 1.8s ease}@keyframes iaNew{0%{background:#e6f0ff;transform:translateY(-6px);opacity:0}20%{opacity:1;transform:none}100%{background:transparent}}' +
    '.ia-empty{padding:44px 24px;text-align:center;color:#9aa2b1;font-size:13px;line-height:1.5;display:flex;flex-direction:column;align-items:center;gap:10px}.ia-empty>span:first-child{width:46px;height:46px;border-radius:14px;background:#f3f4f7;display:grid;place-items:center;color:#b1b8c4}' +
    '.ia-ft{padding:10px 18px;border-top:1px solid #f1f2f5;font-size:11.5px;color:#9aa2b1;display:flex;align-items:center;gap:8px}.ia-ft .ia-n{margin-left:auto}';
  document.head.appendChild(st);
})();
/* ---------- the team: who is on this dashboard, and who marked what ----------
   Every open dashboard checks in every 30 seconds (less often in a background tab). The answer
   carries everyone's latest marks, so a mark made by one person reaches the others' inboxes, and
   the people button shows who is here now. */
const TEAM = {data: null, dom: '', iv: 0};
const ago = t => { const d = Date.now() - t; return d < 60000 ? 'just now' : d < 3600000 ? Math.round(d / 60000) + ' min ago' : d < 864e5 ? Math.round(d / 3600000) + ' h ago' : relDay(t); };
function teamFetch(){
  const dom = S.domain;
  if (!S.me || !dom || !S.session) return Promise.resolve();
  return api('portalTeam', {session: S.session, domain: dom}).then(j => {
    if (!j || j.error || !j.people || S.domain !== dom) return;
    TEAM.data = j; TEAM.dom = dom; TEAM.got = Date.now();
    S.marks = S.marks || {}; S.marks[dom] = {at: Date.now(), p: Promise.resolve(j.marks || {})};
    document.dispatchEvent(new CustomEvent('el-marks', {detail: {domain: dom, marks: j.marks || {}}}));
    teamPaint();
    document.dispatchEvent(new CustomEvent('el-team', {detail: {domain: dom}}));
  }).catch(() => {});
}
function teamStart(){
  if (TEAM.dom !== S.domain) TEAM.data = null;
  teamPaint();
  if (!TEAM.iv){
    let last = 0;
    TEAM.iv = setInterval(() => { if (Date.now() - last > (document.hidden ? 120000 : 8000)){ last = Date.now(); teamFetch(); } }, 5000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden){ last = Date.now(); teamFetch(); } });
    last = Date.now();
  }
  teamFetch();
}
function teamPaint(){
  const el = app && app.querySelector('[data-teamav]'); if (!el) return;
  const d = TEAM.dom === S.domain && TEAM.data, on = d ? d.people.filter(p => p.on && !p.me) : [];
  el.parentNode.classList.toggle('live', on.length > 0);
  el.innerHTML = on.length ? '<span class="tm-stack">' + on.slice(0, 2).map(p => '<i style="background:' + hue(p.name || p.email) + '">' + esc(p.by) + '</i>').join('') + '</span>' + (on.length > 2 ? '<em>+' + (on.length - 2) + '</em>' : '') : ic('users');
  el.parentNode.title = on.length ? on.map(p => p.name || p.email).join(', ') + (on.length === 1 ? ' is' : ' are') + ' on the dashboard now' : 'Your team: who is here and what they did';
  const pop = document.querySelector('[data-pop="team"]'); if (pop && pop.redraw) pop.redraw();
}
function teamPop(){
  const open = document.querySelector('[data-pop="team"]');
  closePops();
  if (open) return;
  const pop = document.createElement('div'); pop.className = 'pop tm-pop'; pop.dataset.pop = 'team';
  app.querySelector('[data-team]').parentNode.appendChild(pop);
  pop.addEventListener('click', e => e.stopPropagation());
  let byId = null;
  formsHistory().then(rows => { byId = {}; rows.forEach(r => { if (r.id) byId[r.id] = r; }); if (pop.isConnected) pop.redraw(); }).catch(() => { byId = {}; });
  pop.redraw = () => {
    const d = TEAM.dom === S.domain && TEAM.data;
    if (!d){ pop.innerHTML = '<h4>Your team</h4><div class="list">' + SK.list(3) + '</div>'; return; }
    const ppl = d.people.slice().sort((a, b) => (b.on - a.on) || (b.me - a.me) || (b.seen - a.seen));
    const nOn = ppl.filter(p => p.on).length;
    const acts = d.acts.slice(0, 30);
    pop.innerHTML = '<h4>Your team<span class="tm-live"><i></i>' + nOn + ' here now</span></h4>' +
      '<div class="tm-ppl">' + ppl.map(p => '<div class="tm-p' + (p.on ? ' on' : '') + '"><div class="av" style="background:' + hue(p.name || p.email) + '">' + esc(p.by) + '<i></i></div><div class="t"><b>' + esc(p.name || p.email || 'Teammate') + (p.me ? ' <small>you</small>' : '') + '</b><small>' +
        (p.on ? 'Active now' : p.seen ? 'Last active ' + esc(ago(p.seen)) : 'Hasn’t signed in yet') + '</small></div></div>').join('') + '</div>' +
      '<div class="tm-h">Recent activity</div><div class="list tm-acts">' + (acts.length ? acts.map((a, i) => {
        const r = byId && byId[a.id], lead = r ? (r.name || r.email || r.phone || 'a lead') : byId ? 'a lead' : '…', M_ = MARKS[a.s];
        return '<div class="row tm-a" data-a="' + i + '"><div class="av" style="background:' + (a.s === 'open' ? '#6366f1' : M_ ? M_[1] : '#94a3b8') + '">' + ic(a.s === 'open' ? 'eye' : M_ ? M_[2] : 'x', 14) + '</div><div class="t"><b>' + esc(a.name || 'Someone') + '</b><small>' +
          (a.s === 'open' ? 'opened <span>' + esc(lead) + '</span>' : M_ ? 'marked <span>' + esc(lead) + '</span> as ' + M_[0] : 'removed their mark on <span>' + esc(lead) + '</span>') + '</small></div><div class="r">' + esc(ago(a.t)) + '</div></div>';
      }).join('') : '<div class="empty" style="margin:8px">No marks yet. When anyone marks a lead Done, Pending or Spam, it shows here.</div>') + '</div>' +
      '<div class="pfoot">Live · updates every few seconds</div>';
    pop.querySelectorAll('[data-a]').forEach(el => el.addEventListener('click', () => { const r = byId && byId[acts[Number(el.dataset.a)].id]; if (r){ closePops(); openSubmission(r); } }));
  };
  pop.redraw();
  teamFetch();
}
function meMenu(){
  const open = document.querySelector('[data-pop="me"]');
  closePops();
  if (open) return;
  const m = document.createElement('div'); m.className = 'menu'; m.dataset.pop = 'me';
  m.innerHTML = '<div class="who"><b>' + esc(S.me.user.name || 'Your account') + '</b>' + esc(S.me.user.email) + '</div>' +
    (canEdit() ? '<button type="button" data-reset>' + ic('reset', 16) + 'Reset dashboards to the default</button>' : '') + '<button type="button" data-out>' + ic('out2', 16) + (S.preview ? 'Close preview' : 'Sign out') + '</button>';
  app.querySelector('[data-me]').parentNode.appendChild(m);
  m.addEventListener('click', e => e.stopPropagation());
  m.querySelector('[data-out]').addEventListener('click', () => { closePops(); if (S.preview){ window.close(); signOut(); } else signOut(); });
  const rs = m.querySelector('[data-reset]'); if (rs) rs.addEventListener('click', () => { if (!confirm('Put the default dashboards back? Your own dashboards will be removed.')) return; S.layout = {v: LAYOUT_V, dashes: DEFAULT_DASHES()}; S.dash = 0; S.ui = {}; saveLayout(); renderApp(); });
}
/* Business switcher: a smooth popover in place of the plain dropdown. */
function bizMenu(btn){
  const open = document.querySelector('[data-pop="biz"]');
  closePops(); if (open) return;
  const list = (S.me.clients || []).slice();
  const m = document.createElement('div'); m.className = 'biz-pop'; m.dataset.pop = 'biz'; m.setAttribute('role', 'listbox'); m.setAttribute('aria-label', 'Switch business');
  const many = list.length > 6;
  m.innerHTML = '<div class="biz-h">Switch business<span>' + list.length + '</span></div>' + (many ? '<div class="biz-q">' + ic('search', 15) + '<input type="text" placeholder="Find a business" aria-label="Find a business"></div>' : '') + '<div class="biz-list"></div>';
  const box = m.querySelector('.biz-list');
  let shown = list, act = Math.max(0, list.findIndex(x => x.domain === S.domain));
  const draw = () => {
    box.innerHTML = shown.length ? shown.map((x, i) => '<button type="button" role="option" class="biz-it' + (x.domain === S.domain ? ' cur' : '') + (i === act ? ' act' : '') + '" data-d="' + esc(x.domain) + '" aria-selected="' + (x.domain === S.domain) + '"><img alt="" src="https://www.google.com/s2/favicons?domain=' + encodeURIComponent(x.domain || '') + '&sz=64" onerror="this.style.visibility=\'hidden\'"><span class="biz-tx"><b>' + esc(x.name) + '</b><small>' + esc(x.domain) + '</small></span>' + (x.domain === S.domain ? '<span class="biz-ck">' + ic('check', 16) + '</span>' : '') + '</button>').join('') : '<div class="biz-none">No business matches that.</div>';
  };
  const pick = d => { closePops(); if (!d || d === S.domain) return; S.domain = d; S.ui = {}; UNDO.length = 0; ls.set('el_domain', S.domain); renderApp(); };
  draw();
  btn.parentNode.appendChild(m);
  requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('in')));
  const cur = box.querySelector('.act'); if (cur) cur.scrollIntoView({block: 'nearest'});
  m.addEventListener('click', e => { e.stopPropagation(); const it = e.target.closest('.biz-it'); if (it) pick(it.dataset.d); });
  m.addEventListener('mousemove', e => { const it = e.target.closest('.biz-it'); if (!it) return; const i = [...box.querySelectorAll('.biz-it')].indexOf(it); if (i !== act){ act = i; box.querySelectorAll('.biz-it').forEach((b, k) => b.classList.toggle('act', k === act)); } });
  const inp = m.querySelector('input');
  if (inp){ inp.addEventListener('input', () => { const t = inp.value.trim().toLowerCase(); shown = list.filter(x => ((x.name || '') + ' ' + (x.domain || '')).toLowerCase().indexOf(t) > -1); act = 0; draw(); }); setTimeout(() => inp.focus(), 40); }
  const key = e => {
    if (!document.body.contains(m)) return document.removeEventListener('keydown', key, true);
    if (e.key === 'Escape'){ e.preventDefault(); closePops(); btn.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (!shown.length) return; act = (act + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length; draw(); const a = box.querySelector('.act'); if (a) a.scrollIntoView({block: 'nearest'}); }
    else if (e.key === 'Enter'){ e.preventDefault(); if (shown[act]) pick(shown[act].domain); }
  };
  document.addEventListener('keydown', key, true);
}
(function(){ if (document.getElementById('biz-css')) return; const st = document.createElement('style'); st.id = 'biz-css';
  st.textContent = '.client{position:relative;overflow:visible}' +
    '.biz-btn{display:inline-flex;align-items:center;gap:6px;border:0;background:none;padding:5px 7px 5px 6px;margin:-5px -4px -5px -2px;border-radius:10px;font:inherit;color:inherit;cursor:pointer;transition:background .15s}.biz-btn:hover{background:rgba(11,12,15,.05)}.biz-btn:focus-visible{outline:0;box-shadow:0 0 0 3px rgba(0,134,255,.18)}' +
    '.biz-btn b{font-weight:650;font-size:15px;letter-spacing:-.01em;white-space:nowrap;max-width:240px;overflow:hidden;text-overflow:ellipsis}' +
    '.biz-chev{color:#8a92a3;flex:none;transition:transform .28s cubic-bezier(.2,.8,.2,1),color .15s}.biz-btn:hover .biz-chev{color:#30353f}.client:has(.biz-pop) .biz-chev{transform:rotate(180deg);color:#0086ff}' +
    '.biz-pop{position:absolute;left:0;top:calc(100% + 10px);z-index:60;width:310px;max-width:calc(100vw - 24px);background:rgba(255,255,255,.97);-webkit-backdrop-filter:saturate(1.6) blur(14px);backdrop-filter:saturate(1.6) blur(14px);border:1px solid rgba(11,12,15,.08);border-radius:16px;box-shadow:0 30px 60px -22px rgba(11,12,15,.34),0 6px 14px -6px rgba(11,12,15,.08);padding:6px;opacity:0;transform:translateY(-6px) scale(.98);transform-origin:top left;transition:opacity .18s ease,transform .24s cubic-bezier(.2,.8,.2,1)}.biz-pop.in{opacity:1;transform:none}' +
    '.biz-h{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 7px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a92a3}.biz-h span{background:#f1f2f5;color:#5b6273;border-radius:6px;padding:1px 7px;letter-spacing:0}' +
    '.biz-q{position:relative;margin:2px 4px 6px}.biz-q svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9aa2b1}.biz-q input{width:100%;box-sizing:border-box;height:36px;border:1px solid #e8eaef;border-radius:10px;padding:0 10px 0 32px;font:inherit;font-size:13.5px;background:#f8f9fb;transition:border-color .15s,box-shadow .15s,background .15s}.biz-q input:focus{outline:0;border-color:#0086ff;background:#fff;box-shadow:0 0 0 3px rgba(0,134,255,.12)}' +
    '.biz-list{max-height:min(360px,60vh);overflow:auto;display:grid;gap:2px;overscroll-behavior:contain}' +
    '.biz-it{display:flex;align-items:center;gap:11px;width:100%;border:0;background:none;text-align:left;padding:8px 10px;border-radius:11px;cursor:pointer;font:inherit;color:inherit;transition:background .12s}' +
    '.biz-it.act{background:#f3f5f9}.biz-it.cur{background:#eef6ff}.biz-it.cur.act{background:#e4f0ff}' +
    '.biz-it img{width:32px;height:32px;box-sizing:border-box;padding:6px;border-radius:10px;background:#fff;box-shadow:0 0 0 1px rgba(11,12,15,.07),0 2px 4px -2px rgba(11,12,15,.12);flex:none}' +
    '.biz-tx{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.3}.biz-tx b{font-size:14px;font-weight:600;color:#0b0c0f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.biz-tx small{font-size:12px;color:#8a92a3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.biz-ck{color:#0086ff;display:grid;place-items:center;flex:none}.biz-none{padding:16px;text-align:center;color:#8a92a3;font-size:13px}';
  document.head.appendChild(st);
})();
function closePops(){ document.querySelectorAll('[data-pop]').forEach(x => x.remove()); }
document.addEventListener('click', closePops);
document.addEventListener('keydown', e => {
  if (e.key === '/' && !/input|textarea|select/i.test((document.activeElement || {}).tagName || '')){ const q = app.querySelector('.w [data-q]'); if (q){ e.preventDefault(); q.focus(); } }
});
function toast(m){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); }

/* ---------- sign in / out ---------- */
/* The sign-in page: a split screen on wide screens (a living aurora with a glimpse of the dashboard on
   the left, the sign-in card on the right), one glass card over the aurora on phones. */
const LG_IC = {
  mail: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18v12H3zM3 7l9 6 9-6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-3.2 3.9M6.6 6.6A18 18 0 0 0 1 12s4 7 11 7a10.6 10.6 0 0 0 5.4-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  form: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v15H4zM4 10h16M8 3v4M16 3v4"/></svg>'
};
function lgShell(card){
  return '<div class="lg">' +
    '<div class="lg-aur" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i><i class="a4"></i><div class="lg-grid"></div><div class="lg-noise"></div></div>' +
    '<section class="lg-side" aria-hidden="true"><img class="lg-wlogo" src="img/easyleads-logo-white.png" alt="">' +
      '<div class="lg-pitch"><h2>Every lead, call and booking, <em>in one place.</em></h2>' +
      '<p>See who reached out, where they came from and what happened next, live, with your whole team.</p></div>' +
      '<div class="lg-stack">' +
        '<div class="lg-col"><div class="lg-chip c1"><span class="ic" style="--c:#5bb0ff">' + LG_IC.form + '</span><div><b>New lead</b><small>Contact form · just now</small></div><em class="lg-live">Live</em></div>' +
        '<div class="lg-chip c2"><span class="ic" style="--c:#34d399">' + LG_IC.phone + '</span><div><b>Call answered</b><small>From Google Ads · 4 min</small></div></div>' +
        '<div class="lg-chip c3"><span class="ic" style="--c:#fbbf24">' + LG_IC.cal + '</span><div><b>Booking confirmed</b><small>Tomorrow · 10:30 a.m.</small></div><em class="lg-amt">Won</em></div></div>' +
        '<div class="lg-spark" data-lgchart><div class="lg-sh"><div><b>Leads</b><small>updated live, every day</small></div><em class="lg-live"><i></i>Live</em></div>' +
          '<svg viewBox="0 0 400 180" preserveAspectRatio="none"><defs>' +
            '<linearGradient id="lgsa" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3a9bff" stop-opacity=".55"/><stop offset=".6" stop-color="#1d7cf2" stop-opacity=".14"/><stop offset="1" stop-color="#1d7cf2" stop-opacity="0"/></linearGradient>' +
            '<linearGradient id="lgsl" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#5bb0ff"/><stop offset="1" stop-color="#bfe0ff"/></linearGradient>' +
            '<filter id="lgglow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
            '<g class="lg-gl"><line x1="0" x2="400" y1="40" y2="40"/><line x1="0" x2="400" y1="85" y2="85"/><line x1="0" x2="400" y1="130" y2="130"/></g>' +
            '<g class="lg-bars"></g><path class="ar" fill="url(#lgsa)"/><path class="ln" fill="none" stroke="url(#lgsl)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#lgglow)"/>' +
            '<circle class="pr" r="11" fill="#5bb0ff" opacity="0"/><circle class="pt" r="5.5" fill="#fff" stroke="#3a9bff" stroke-width="3" opacity="0"/></svg>' +
          '<div class="lg-ax"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div>' +
      '</div><div class="lg-foot">© ' + new Date().getFullYear() + ' ' + esc(BRAND) + ' · Private and secure</div></section>' +
    '<main class="lg-main">' + card + '<div class="lg-pow">Powered by <b>' + esc(BRAND) + '</b></div></main></div>';
}
/* The Leads chart on the sign-in page redraws itself every 3 seconds, a new example curve each time. */
const LG_SHAPES = [[70, 62, 74, 52, 58, 40, 46, 28, 34, 16], [78, 66, 58, 64, 44, 50, 32, 38, 22, 14], [74, 70, 54, 60, 46, 30, 40, 26, 20, 12]];
function lgCurve(p){ let d = 'M' + p[0][0] + ' ' + p[0][1]; for (let i = 0; i < p.length - 1; i++){ const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c; d += ' C' + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + ' ' + (b[1] + (c[1] - a[1]) / 6).toFixed(1) + ' ' + (c[0] - (e[0] - b[0]) / 6).toFixed(1) + ' ' + (c[1] - (e[1] - b[1]) / 6).toFixed(1) + ' ' + c[0] + ' ' + c[1]; } return d; }
function lgChart(root){
  const el = root.querySelector('[data-lgchart]'); if (!el || !el.animate) return;
  const ln = el.querySelector('.ln'), ar = el.querySelector('.ar'), pt = el.querySelector('.pt'), pr = el.querySelector('.pr'), bars = el.querySelector('.lg-bars');
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let n = 0;
  const draw = () => {
    if (!el.isConnected){ clearInterval(iv); return; }
    const ys = LG_SHAPES[n++ % LG_SHAPES.length], p = ys.map((y, i) => [Math.round(i * 392 / (ys.length - 1)) + 4, Math.round(y * 1.75 + 6)]);
    const d = lgCurve(p), last = p[p.length - 1];
    ln.setAttribute('d', d); ar.setAttribute('d', d + ' L396 180 L4 180 Z');
    bars.innerHTML = p.slice(0, -1).map((q, i) => '<rect x="' + (q[0] + 13) + '" width="16" rx="4" y="' + (180 - (180 - q[1]) * .42).toFixed(1) + '" height="' + ((180 - q[1]) * .42).toFixed(1) + '"/>').join('');
    pt.setAttribute('cx', last[0]); pt.setAttribute('cy', last[1]); pr.setAttribute('cx', last[0]); pr.setAttribute('cy', last[1]);
    if (still){ pt.setAttribute('opacity', 1); return; }
    const len = ln.getTotalLength();
    ln.style.strokeDasharray = len;
    ln.animate([{strokeDashoffset: len}, {strokeDashoffset: 0}], {duration: 1300, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'both'});
    ar.animate([{clipPath: 'inset(0 100% 0 0)', opacity: .4}, {clipPath: 'inset(0 0% 0 0)', opacity: 1}], {duration: 1300, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'both'});
    [...bars.children].forEach((b, i) => b.animate([{transform: 'scaleY(0)', opacity: 0}, {transform: 'scaleY(1)', opacity: 1}], {duration: 600, delay: 80 + i * 70, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both'}));
    [bars].forEach(g => g.querySelectorAll('rect').forEach(r => { r.style.transformBox = 'fill-box'; r.style.transformOrigin = '50% 100%'; }));
    pt.animate([{opacity: 0, transform: 'scale(0)'}, {opacity: 1, transform: 'scale(1.25)'}, {opacity: 1, transform: 'scale(1)'}], {duration: 500, delay: 1150, easing: 'ease-out', fill: 'both'});
    pr.animate([{opacity: .55, transform: 'scale(.4)'}, {opacity: 0, transform: 'scale(2.4)'}], {duration: 1200, delay: 1300, easing: 'ease-out', fill: 'forwards'});
    [pt, pr].forEach(c => { c.style.transformBox = 'fill-box'; c.style.transformOrigin = 'center'; });
  };
  draw();
  const iv = still ? 0 : setInterval(() => { if (!document.hidden) draw(); }, 3000);
}
/* Right after signing in (never on reload or sign-out): a full-screen Easyleads welcome with the
   person's own name, while the dashboard gets ready underneath; then it opens onto it. */
function lgWelcome(me){
  try{
    const u = (me && me.user) || {}, raw = String(u.name || '').trim() || String(u.email || '').split('@')[0].replace(/[._-]+/g, ' ');
    const first = (raw.split(/\s+/)[0] || 'there').replace(/^./, c => c.toUpperCase());
    const h = new Date().getHours(), hello = h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const cl = (me && me.clients) || [], biz = cl.length === 1 ? (cl[0].name || cl[0].domain || '') : '';
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const w = document.createElement('div'); w.className = 'lw'; w.setAttribute('role', 'status'); w.setAttribute('aria-live', 'polite');
    w.innerHTML = '<div class="lg-aur" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i><i class="a4"></i><div class="lg-grid"></div><div class="lg-noise"></div></div>' +
      '<div class="lw-in"><div class="lw-mark"><i class="r1"></i><i class="r2"></i><span class="lw-ring"></span><img src="img/easyleads-mark.png" alt=""></div>' +
      '<div class="lw-hello">' + esc(hello) + '</div><h1 class="lw-h">Welcome back,</h1>' +
      '<div class="lw-name" aria-label="' + esc(first) + '">' + [...first].map((c, i) => '<span style="--i:' + i + '">' + esc(c) + '</span>').join('') + '<span class="lw-dot" style="--i:' + first.length + '">.</span></div>' +
      '<div class="lw-sub">' + (biz ? 'Opening <b>' + esc(biz) + '</b>' : 'Opening your dashboard') + '</div><div class="lw-bar"><i></i></div>' +
      '<img class="lw-logo" src="img/easyleads-logo-white.png" alt="' + esc(BRAND) + '"></div>';
    document.body.appendChild(w);
    const stay = still ? 1100 : 2900;
    setTimeout(() => { w.classList.add('out'); setTimeout(() => w.remove(), 750); }, stay);
  }catch(e){}
}
function renderLogin(msg){
  app.innerHTML = lgShell('<form class="lg-card" novalidate><div class="lg-logo"><img src="img/easyleads-logo.png" alt="' + esc(BRAND) + '"></div>' +
    '<h1>Welcome back</h1><p class="lg-sub">Sign in to see your leads, calls and bookings.</p>' +
    '<div class="lg-fld"><label for="em">Email</label><div class="lg-in"><span class="lg-li">' + LG_IC.mail + '</span><input id="em" type="email" autocomplete="username" placeholder="you@company.com" required></div></div>' +
    '<div class="lg-fld"><label for="pw">Password</label><div class="lg-in"><span class="lg-li">' + LG_IC.lock + '</span><input id="pw" type="password" autocomplete="current-password" placeholder="Your password" required><button type="button" class="lg-eye" data-eye aria-label="Show password" title="Show password">' + LG_IC.eye + '</button></div><div class="lg-caps" hidden>Caps Lock is on</div></div>' +
    '<button class="lg-go" type="submit"><span>Sign in</span>' + LG_IC.arrow + '</button><div class="msg' + (msg ? ' err' : '') + '" role="alert">' + esc(msg || '') + '</div>' +
    '<div class="lg-sec">' + LG_IC.shield + 'Secure, encrypted sign-in</div>' +
    '<div class="lg-help">Need help or forgot your password? <b>Contact your Easyleads team.</b></div></form>');
  const f = app.querySelector('form');
  const pw = f.querySelector('#pw'), eye = f.querySelector('[data-eye]'), caps = f.querySelector('.lg-caps');
  eye.addEventListener('click', () => { const show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; eye.innerHTML = show ? LG_IC.eyeOff : LG_IC.eye; eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); eye.title = eye.getAttribute('aria-label'); pw.focus(); });
  const capsChk = e => { if (e.getModifierState) caps.hidden = !e.getModifierState('CapsLock'); };
  pw.addEventListener('keyup', capsChk); pw.addEventListener('keydown', capsChk); pw.addEventListener('blur', () => { caps.hidden = true; });
  /* the aurora follows the pointer, a little */
  const lg = app.querySelector('.lg');
  lgChart(lg);
  lg.addEventListener('pointermove', e => { const r = lg.getBoundingClientRect(); lg.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); lg.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); });
  let busy = false;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    const btn = f.querySelector('button[type=submit]'), m = f.querySelector('.msg');
    const em = f.querySelector('#em').value.trim(), pv = pw.value;
    if (!em || !pv){ m.textContent = 'Enter your email and password.'; m.className = 'msg err'; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); return; }
    busy = true; btn.disabled = true; m.textContent = ''; m.className = 'msg';
    const cover = document.createElement('div'); cover.className = 'cover lg-cover'; cover.innerHTML = '<span class="lg-ring"><img src="img/easyleads-mark.png" alt=""></span><span>Signing you in…</span>';
    f.appendChild(cover);
    try{
      const j = await api('portalLogin', {email: em, password: pv});
      if (j.error) throw new Error(j.error);
      cover.querySelector('span:last-child').textContent = 'Loading your dashboard…';
      lgWelcome(j.me);
      startWith(j.session, j.me);
    }catch(err){ cover.remove(); m.textContent = err.message; m.className = 'msg err'; btn.disabled = false; busy = false; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); pw.select(); }
  });
  f.querySelector('#em').focus();
}
(function(){ if (document.getElementById('lg-css')) return; const st = document.createElement('style'); st.id = 'lg-css';
  st.textContent =
    '.lg{--mx:30%;--my:40%;position:relative;min-height:100vh;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(440px,.88fr);background:#071027;overflow:hidden;font-family:var(--ui)}' +
    '.lg-aur{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:radial-gradient(900px 600px at var(--mx) var(--my),rgba(29,124,242,.22),transparent 60%),linear-gradient(160deg,#0b1a45 0%,#0a1638 45%,#071027 100%)}' +
    '.lg-aur i{position:absolute;border-radius:50%;filter:blur(70px);opacity:.75;mix-blend-mode:screen;will-change:transform}' +
    '.lg-aur .a1{width:620px;height:620px;left:-140px;top:-180px;background:radial-gradient(circle,#1d7cf2 0%,rgba(29,124,242,0) 70%);animation:lgA 18s ease-in-out infinite alternate}' +
    '.lg-aur .a2{width:520px;height:520px;left:28%;bottom:-220px;background:radial-gradient(circle,#1d7cf2 0%,rgba(29,124,242,0) 70%);animation:lgB 22s ease-in-out infinite alternate}' +
    '.lg-aur .a3{width:420px;height:420px;left:40%;top:-120px;background:radial-gradient(circle,#5bb0ff 0%,rgba(91,176,255,0) 70%);opacity:.45;animation:lgC 26s ease-in-out infinite alternate}' +
    '.lg-aur .a4{width:380px;height:380px;right:-120px;bottom:10%;background:radial-gradient(circle,#2b88f5 0%,rgba(43,136,245,0) 70%);opacity:.35;animation:lgA 30s ease-in-out infinite alternate-reverse}' +
    '@keyframes lgA{to{transform:translate(120px,90px) scale(1.12)}}@keyframes lgB{to{transform:translate(-110px,-80px) scale(1.18)}}@keyframes lgC{to{transform:translate(-80px,120px) scale(.9)}}' +
    '.lg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:56px 56px;-webkit-mask-image:radial-gradient(ellipse 75% 70% at 30% 45%,#000 30%,transparent 80%);mask-image:radial-gradient(ellipse 75% 70% at 30% 45%,#000 30%,transparent 80%)}' +
    '.lg-noise{position:absolute;inset:0;opacity:.08;background-image:url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27140%27 height=%27140%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%27.9%27 numOctaves=%272%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>")}' +
    '.lg-side{position:relative;z-index:1;display:flex;flex-direction:column;padding:44px clamp(32px,4.5vw,64px);color:#e8efff}' +
    '.lg-wlogo{height:34px;width:auto;align-self:flex-start;opacity:.95}' +
    '.lg-pitch{margin-top:auto;max-width:640px;animation:lgUp .8s cubic-bezier(.2,.7,.2,1) both .05s}' +
    '.lg-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#a9c4ff;padding:6px 12px 6px 10px;border-radius:99px;background:rgba(120,160,255,.10);border:1px solid rgba(140,175,255,.22)}' +
    '.lg-eyebrow i{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.6);animation:lgPing 2s infinite}' +
    '@keyframes lgPing{70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}' +
    '.lg-pitch h2{font:600 clamp(36px,4vw,58px)/1.08 var(--display);letter-spacing:-.03em;margin:0 0 18px;color:#fff}' +
    '.lg-pitch h2 em{font-style:normal;background:linear-gradient(90deg,#5bb0ff,#2b8cff 55%,#8cc8ff);-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '.lg-pitch p{font-size:18px;line-height:1.6;color:#b8c6e6;margin:0;max-width:540px}' +
    '.lg-stack{position:relative;margin:46px 0 auto;display:grid;grid-template-columns:330px minmax(320px,480px);gap:22px;align-items:stretch}.lg-col{display:flex;flex-direction:column;gap:14px}' +
    '.lg-chip{position:relative;display:flex;align-items:center;gap:14px;padding:16px 20px 16px 16px;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 20px 40px -20px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.12);min-width:0}' +
    '.lg-chip .ic svg{width:22px;height:22px}.lg-chip .ic{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 18%,transparent);border:1px solid color-mix(in srgb,var(--c) 35%,transparent)}' +
    '.lg-chip b{display:block;font-size:16.5px;color:#fff;font-weight:600}.lg-chip small{display:block;font-size:13.5px;color:#a8b6d6;margin-top:2px}' +
    '.lg-chip em{margin-left:auto;font-style:normal;font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px}.lg-live{color:#4ade80;background:rgba(74,222,128,.14)}.lg-amt{color:#fbbf24;background:rgba(251,191,36,.14)}' +
    '.lg-chip.c1{animation:lgUp .8s cubic-bezier(.2,.7,.2,1) both .25s}' +
    '.lg-chip.c2{animation:lgUp .8s cubic-bezier(.2,.7,.2,1) both .4s}' +
    '.lg-chip.c3{animation:lgUp .8s cubic-bezier(.2,.7,.2,1) both .55s}' +
    '.lg-spark{position:relative;display:flex;flex-direction:column;padding:20px 22px 14px;border-radius:22px;background:linear-gradient(160deg,rgba(255,255,255,.13),rgba(255,255,255,.04) 60%);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 30px 60px -28px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.14);animation:lgUp .8s cubic-bezier(.2,.7,.2,1) both .7s;overflow:hidden}' +
    '.lg-spark:before{content:"";position:absolute;inset:-40% -20% auto auto;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(58,155,255,.35),transparent 70%);pointer-events:none}' +
    '.lg-sh{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}.lg-sh b{display:block;font:600 26px var(--display);color:#fff;letter-spacing:-.01em}.lg-sh small{display:block;font-size:12.5px;color:#a8b6d6;margin-top:1px}' +
    '.lg-sh .lg-live{display:inline-flex;align-items:center;gap:6px;font-style:normal;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:99px;color:#4ade80;background:rgba(74,222,128,.14)}.lg-sh .lg-live i{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:lgPing 2s infinite}' +
    '.lg-spark svg{position:relative;width:100%;flex:1;min-height:150px;height:auto;display:block;overflow:visible}.lg-gl line{stroke:rgba(255,255,255,.08);stroke-dasharray:3 5}' +
    '.lg-bars rect{fill:rgba(140,196,255,.16)}' +
    '.lg-ax{position:relative;display:flex;justify-content:space-between;margin-top:6px;font-size:10.5px;font-weight:600;letter-spacing:.04em;color:#7f8fb3}' +
    '@keyframes lgPing{70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}' +
    '@keyframes lgDraw{to{stroke-dashoffset:0}}@keyframes lgFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes lgUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' +
    '.lg-foot{font-size:12px;color:#7f8fb3}' +
    '.lg-main{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px clamp(28px,5vw,72px);background:#fff;box-shadow:-40px 0 90px -30px rgba(2,6,23,.55);animation:lgPanel .7s cubic-bezier(.2,.7,.2,1) both}' +
    '.lg-main:before{content:"";position:absolute;inset:0;background:radial-gradient(520px 260px at 85% 0%,rgba(29,124,242,.07),transparent 70%),radial-gradient(420px 240px at 10% 100%,rgba(91,176,255,.06),transparent 70%);pointer-events:none}' +
    '@keyframes lgPanel{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}' +
    '.lg-card{position:relative;width:min(400px,100%);animation:lgUp .7s cubic-bezier(.2,.7,.2,1) both .1s}' +
    '.lg-logo img{height:34px;width:auto;display:block}' +
    '.lg-card h1{font:600 30px var(--display);letter-spacing:-.025em;margin:40px 0 8px;color:#0b1220}' +
    '.lg-sub{color:#5b6476;font-size:14px;margin:0 0 26px;line-height:1.55}' +
    '.lg-fld{margin-bottom:16px}.lg-fld label{display:block;font-size:12.5px;font-weight:600;color:#30384a;margin:0 0 7px}' +
    '.lg-in{position:relative;display:flex;align-items:center}' +
    '.lg-in input{width:100%;height:50px;border:1px solid #e3e7ef;border-radius:14px;background:#f8faff;padding:0 46px 0 44px;font:500 14.5px var(--ui);color:#0b1220;transition:border-color .2s,box-shadow .2s,background .2s;box-sizing:border-box}' +
    '.lg-in input::placeholder{color:#a2aabb;font-weight:400}' +
    '.lg-in input:hover{border-color:#d3d9e6}.lg-in input:focus{outline:none;background:#fff;border-color:#1d7cf2;box-shadow:0 0 0 4px rgba(29,124,242,.14),0 6px 18px -10px rgba(29,124,242,.6)}' +
    '.lg-li{position:absolute;left:15px;color:#98a2b5;display:grid;pointer-events:none;transition:color .2s}.lg-in:focus-within .lg-li{color:#1d7cf2}' +
    '.lg-eye{position:absolute;right:8px;width:34px;height:34px;border:0;background:none;border-radius:10px;color:#98a2b5;cursor:pointer;display:grid;place-items:center;transition:background .15s,color .15s}.lg-eye:hover{background:#eef5ff;color:#1d7cf2}' +
    '.lg-caps{font-size:12px;color:#b86e00;margin-top:6px}' +
    '.lg-go{position:relative;width:100%;height:52px;margin-top:8px;border:0;border-radius:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;font:600 15px var(--ui);color:#fff;background:linear-gradient(135deg,#3a9bff 0%,#1d7cf2 50%,#1565d8 100%);box-shadow:0 14px 30px -12px rgba(29,124,242,.75),inset 0 1px 0 rgba(255,255,255,.25);overflow:hidden;transition:transform .2s,box-shadow .2s,filter .2s}' +
    '.lg-go:after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);transition:left .7s ease}' +
    '.lg-go:hover{transform:translateY(-1px);box-shadow:0 20px 36px -14px rgba(29,124,242,.85),inset 0 1px 0 rgba(255,255,255,.25)}.lg-go:hover:after{left:130%}.lg-go:active{transform:translateY(0);filter:brightness(.97)}' +
    '.lg-go svg{transition:transform .2s}.lg-go:hover svg{transform:translateX(3px)}.lg-go:disabled{opacity:.7;cursor:default}' +
    '.lg-card .msg{min-height:18px;margin-top:10px;font-size:13px;text-align:center}' +
    '.lg-sec{display:flex;align-items:center;justify-content:center;gap:7px;font-size:12px;font-weight:500;color:#5f8a75;margin-top:6px}' +
    '.lg-help{margin-top:22px;padding-top:18px;border-top:1px solid #eef0f5;text-align:center;font-size:12.5px;line-height:1.5;color:#8a93a5}.lg-help b{color:#3b4760;font-weight:600}' +
    '.lg-pow{position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:12.5px;color:#9aa3b5;letter-spacing:.01em}.lg-pow b{color:#3b4760;font-weight:600}' +
    '.lg-card.shake{animation:lgShake .4s cubic-bezier(.36,.07,.19,.97)}@keyframes lgShake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}' +
    '.lg-cover{position:absolute;inset:-14px;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;border-radius:28px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font:600 14px var(--ui);color:#30384a;animation:lgFade .25s ease both}@keyframes lgFade{from{opacity:0}to{opacity:1}}' +
    '.lg-ring{position:relative;width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:#fff;box-shadow:0 8px 24px -10px rgba(29,124,242,.5)}' +
    '.lg-ring:before{content:"";position:absolute;inset:-3px;border-radius:50%;background:conic-gradient(from 0deg,rgba(59,130,246,0),#1d7cf2 140deg,#5bb0ff 220deg,rgba(59,130,246,0) 300deg);-webkit-mask:radial-gradient(circle,transparent 60%,#000 61%);mask:radial-gradient(circle,transparent 60%,#000 61%);animation:spin 1s linear infinite}' +
    '.lg-ring img{width:26px;height:26px;object-fit:contain}' +
    '@media (max-width:1320px){.lg-stack{grid-template-columns:330px}.lg-spark{display:none}}' +
    '@media (max-width:1060px){.lg{grid-template-columns:minmax(0,1fr) minmax(420px,1fr)}.lg-pitch h2{font-size:36px}.lg-stack{display:none}.lg-pitch{margin-bottom:auto}}' +
    '@media (max-width:760px){.lg{grid-template-columns:1fr}.lg-side{display:none}.lg-main{min-height:100vh;background:none;box-shadow:none;padding:28px 16px;animation:none}.lg-main:before{display:none}' +
      '.lg-card{width:min(420px,100%);padding:34px 28px 24px;border-radius:26px;background:#fff;box-shadow:0 40px 80px -30px rgba(2,6,23,.8)}.lg-card h1{font-size:26px;margin-top:26px}.lg-cover{inset:0}.lg-pow{position:static;margin-top:20px;color:#8fa2cc}.lg-pow b{color:#c9d8ff}}' +
    '@media (max-width:480px){.lg-card{padding:30px 22px 22px;border-radius:24px}}' +
    '.lw{--mx:50%;--my:45%;position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#071027;overflow:hidden;animation:lwIn .45s ease both;font-family:var(--ui)}' +
    '.lw.out{animation:lwOut .7s cubic-bezier(.6,0,.4,1) forwards}.lw.out .lw-in{animation:lwZoom .7s cubic-bezier(.6,0,.4,1) forwards}' +
    '@keyframes lwIn{from{opacity:0}to{opacity:1}}@keyframes lwOut{to{opacity:0;visibility:hidden}}@keyframes lwZoom{to{transform:scale(1.06);filter:blur(6px);opacity:0}}' +
    '.lw-in{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px}' +
    '.lw-mark{position:relative;width:112px;height:112px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(160deg,rgba(255,255,255,.16),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 30px 70px -20px rgba(29,124,242,.6),inset 0 1px 0 rgba(255,255,255,.2);animation:lwPop .9s cubic-bezier(.2,1.2,.3,1) both .1s}' +
    '.lw-mark img{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 6px 16px rgba(29,124,242,.6))}' +
    '.lw-ring{position:absolute;inset:-6px;border-radius:50%;background:conic-gradient(from 0deg,rgba(91,176,255,0),#5bb0ff 120deg,#1d7cf2 200deg,rgba(29,124,242,0) 300deg);-webkit-mask:radial-gradient(circle,transparent 62%,#000 63%);mask:radial-gradient(circle,transparent 62%,#000 63%);animation:spin 1.4s linear infinite}' +
    '.lw-mark i{position:absolute;inset:0;border-radius:50%;border:1.5px solid rgba(91,176,255,.55);animation:lwWave 2.4s cubic-bezier(.2,.7,.2,1) infinite .5s}.lw-mark i.r2{animation-delay:1.3s}' +
    '@keyframes lwWave{from{transform:scale(1);opacity:.8}to{transform:scale(2.6);opacity:0}}@keyframes lwPop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}' +
    '.lw-hello{margin-top:34px;font-size:13px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#8cc8ff;animation:lgUp .7s cubic-bezier(.2,.7,.2,1) both .35s}' +
    '.lw-h{font:600 clamp(30px,4vw,46px)/1.1 var(--display);letter-spacing:-.02em;color:#fff;margin:12px 0 0;animation:lgUp .7s cubic-bezier(.2,.7,.2,1) both .5s}' +
    '.lw-name{font:700 clamp(54px,8vw,104px)/1.05 var(--display);letter-spacing:-.035em;margin-top:4px;padding:0 .06em .08em;white-space:nowrap}' +
    '.lw-name span{display:inline-block;background:linear-gradient(180deg,#fff 10%,#8cc8ff 60%,#3a9bff);-webkit-background-clip:text;background-clip:text;color:transparent;animation:lwLetter .8s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(.75s + var(--i) * .06s)}' +
    '.lw-name .lw-dot{color:#3a9bff;background:none;-webkit-text-fill-color:#3a9bff}' +
    '@keyframes lwLetter{from{opacity:0;transform:translateY(.45em) scale(.9);filter:blur(10px)}to{opacity:1;transform:none;filter:blur(0)}}' +
    '.lw-sub{margin-top:18px;font-size:16px;color:#b8c6e6;animation:lgUp .7s cubic-bezier(.2,.7,.2,1) both 1.25s}.lw-sub b{color:#fff;font-weight:600}' +
    '.lw-bar{width:220px;height:4px;border-radius:99px;background:rgba(255,255,255,.12);margin-top:22px;overflow:hidden;animation:lgUp .6s ease both 1.35s}' +
    '.lw-bar i{display:block;height:100%;width:100%;border-radius:inherit;background:linear-gradient(90deg,#1d7cf2,#5bb0ff,#bfe0ff);transform-origin:left;transform:scaleX(0);animation:lwFill 1.5s cubic-bezier(.4,0,.2,1) forwards 1.4s;box-shadow:0 0 12px rgba(91,176,255,.8)}' +
    '@keyframes lwFill{to{transform:scaleX(1)}}' +
    '.lw-logo{height:26px;width:auto;margin-top:46px;opacity:0;animation:lwFade .8s ease forwards 1.6s}@keyframes lwFade{to{opacity:.75}}' +
    '@media (prefers-reduced-motion:reduce){.lw *,.lw *:before{animation-duration:.01s!important;animation-delay:0s!important}.lw-bar i{transform:scaleX(1)}}' +
    '@media (prefers-reduced-motion:reduce){.lg *,.lg *:before,.lg *:after{animation:none!important;transition:none!important}}';
  document.head.appendChild(st); })();
let signingOut = false;
function signOut(silent){
  if (signingOut) return;
  signingOut = true;
  if (BOT.el){ BOT.el.remove(); BOT.el = null; }
  ls.del(SKEY); ls.del('el_me'); kv.clear(LKEY); const was = S.session; S.session = null; S.me = null; S.cache = {}; S.ui = {};
  closePops();
  if (silent || !was){ renderLogin(silent ? 'Your session ended. Please sign in again.' : ''); signingOut = false; return; }
  const v = veil('Signing out…');
  setTimeout(() => { v.done(); renderLogin(''); signingOut = false; }, 650);
}
function startWith(session, me){
  S.session = session; S.me = me; if (!S.preview) ls.set('el_me', me);
  if (!S.preview) ls.set(SKEY, session);
  S.layout = me.layout || ls.get('el_layout_' + me.user.email, null);
  const d = ls.get('el_domain', '');
  S.domain = me.clients.some(c => c.domain === d) ? d : (me.clients[0] || {}).domain || '';
  S.period = ls.get('el_period', '30');
  if (!PERIODS.some(p => p[0] === S.period)) S.period = '30';
  if (!me.clients.length){ app.innerHTML = lgShell('<div class="lg-card"><div class="lg-logo"><img src="img/easyleads-logo.png" alt=""></div><h1>Almost there</h1><p class="lg-sub">Your account isn’t linked to a business yet. Your Easyleads team will let you know when it’s ready.</p><button class="lg-go" type="button" id="out"><span>Sign out</span></button></div>'); app.querySelector('#out').addEventListener('click', () => signOut()); return; }
  renderApp();
}
/* Fresh numbers every few minutes while the page is open. */
setInterval(() => { if (S.me && !document.hidden && !S.editing && !document.querySelector('.drawer-back,.modal-back,[data-pop],.ia-panel') && !(document.activeElement && /input/i.test(document.activeElement.tagName))){ Object.keys(S.cache).forEach(k => { if (S.cache[k]) S.cache[k].at = 0; }); renderApp(); } }, 5 * 60000);   /* marked out of date, not thrown away: widgets keep showing what they have and update in place */

/* ---------- clients (CRM): one shared record for every person who reached out ----------
   A client is a person across every form they ever sent (same key as the inbox: email, else
   phone, else name), on Easyleads, WordPress or Concrete sites alike. Their stage, job value,
   owner, follow-up date and notes live on the tracker, shared with everyone on the dashboard;
   a change made by one person reaches the others within seconds (the team check-in carries a
   "CRM changed at" stamp, and only then is the CRM fetched again). */
const STAGES = [['new', 'New lead', '#1d7cf2', 'spark'], ['contacted', 'Contacted', '#7c3aed', 'reply'], ['quoted', 'Quote sent', '#d9820b', 'form'], ['booked', 'Booked', '#0891b2', 'cal'], ['won', 'Won', '#0f9d6b', 'check'], ['lost', 'Lost', '#8a93a3', 'x']];
const STG = {}; STAGES.forEach(s => { STG[s[0]] = s; });
const OPEN_ST = ['contacted', 'quoted', 'booked'];
const CRM = {};
function crmFor(dom){
  dom = dom || S.domain;
  const box = CRM[dom] = CRM[dom] || {};
  if (box.p && Date.now() - box.at < 60000) return box.p;
  /* Already have it: answer with that straight away (no loading flash) and refresh quietly. */
  const had = box.data ? JSON.stringify(box.data) : null;
  const p = api('portalCrm', {session: S.session, domain: dom}).then(j => {
    if (j.error) throw new Error(j.error);
    box.data = j.crm || {}; box.v = Math.max(box.v || 0, j.at || 0); box.p = Promise.resolve(box.data);
    if (had !== null && had !== JSON.stringify(box.data)) crmEmit(dom);
    return box.data;
  });
  box.at = Date.now();
  box.p = had !== null ? Promise.resolve(box.data) : p;
  p.catch(() => { if (box.p === p) box.p = null; });
  return box.p;
}
const crmEmit = dom => document.dispatchEvent(new CustomEvent('el-crm', {detail: {domain: dom}}));
/* The team check-in says when the CRM last changed; fetch it again only then. */
document.addEventListener('el-team', e => {
  const dom = e.detail.domain, at = TEAM.data && TEAM.dom === dom ? Number(TEAM.data.crmAt) || 0 : 0, box = CRM[dom];
  if (!box || !box.data || !at || at <= (box.v || 0)) return;
  box.v = at; box.at = 0; crmFor(dom).then(() => crmEmit(dom)).catch(() => {});
});
const crmMe = () => myMarkName() || (S.me && S.me.user.email) || 'You';
async function crmSave(key, set, o){
  const dom = S.domain;
  const data = await crmFor(dom).catch(() => null) || ((CRM[dom] = CRM[dom] || {}).data = (CRM[dom].data || {}));
  const before = data[key] ? JSON.parse(JSON.stringify(data[key])) : null;
  const rec = data[key] = data[key] || {notes: [], log: []};
  const name = crmMe(), by = S.me && S.me.edge && !S.me.edgeName ? 'EM' : initials(name), t = Date.now();
  Object.keys(set).forEach(f => {
    const v = set[f];
    if (f === 'note') rec.notes = (rec.notes || []).concat({t, name, by, x: v});
    else if (f === 'unnote'){ const ns = (rec.notes || []).slice(); for (let q = ns.length - 1; q >= 0; q--) if (ns[q].name === name){ ns.splice(q, 1); break; } rec.notes = ns; }
    else if (f === 'done') rec.due = '';
    else rec[f] = v;
    rec.log = (rec.log || []).concat({t, name, by, f, v});
  });
  rec.t = t; rec.name = name;
  crmEmit(dom);
  try{
    const j = await api('portalCrmSave', {session: S.session, domain: dom, key, set});
    if (j.error) throw new Error(j.error);
    if (j.rec) data[key] = j.rec;
    if (CRM[dom]) CRM[dom].v = Math.max(CRM[dom].v || 0, j.at || 0);
    crmEmit(dom);
    if (!(o && o.undo === false)){
      /* what to send to put it back the way it was */
      const prev = {}, b0 = before || {};
      Object.keys(set).forEach(f => {
        if (f === 'stage') prev.stage = STG[b0.stage] ? b0.stage : 'new';
        else if (f === 'value' || f === 'owner' || f === 'due') prev[f] = b0[f] != null ? b0[f] : '';
        else if (f === 'done') prev.due = set.done || b0.due || '';
        else if (f === 'note') prev.unnote = 1;
      });
      const label = set.stage ? 'Moved to ' + STG[set.stage][1] + (set.value ? ' · ' + money(set.value) : '') : set.note ? 'Added a note' : set.done != null ? 'Finished a follow-up' : set.value != null ? 'Changed the job value' : set.owner != null ? 'Changed the owner' : set.due != null ? 'Changed the follow-up date' : 'Client change';
      if (Object.keys(prev).length) undoPush(label, () => crmSave(key, prev, {undo: false}).then(ok => { if (!ok) throw new Error('not saved'); }));
    }
    return true;
  }catch(e){
    if (before) data[key] = before; else delete data[key];
    crmEmit(dom); toast('Couldn’t save that: ' + e.message);
    return false;
  }
}
/* Every client, built from all-time form leads (plus any newer rows the widget already has). */
async function crmClients(extra){
  const dom = S.domain;
  const tm = TEAM.dom === dom && TEAM.data && TEAM.data.marks;
  const [rows, crm, M] = await Promise.all([formsHistory().catch(() => []), crmFor(dom).catch(() => ({})), tm ? tm : marksFor(dom).catch(() => ({}))]);
  const P = peopleOf((extra || []).concat(rows));
  return Object.keys(P).map(k => {
    const list = P[k], f = list[0], first = list[list.length - 1], r = crm[k] || {};
    const pick = x => (list.find(y => y[x]) || {})[x] || '';
    const lastStage = (r.log || []).filter(x => x.f === 'stage').pop();
    return {k, list, name: pick('name') || pick('email') || pick('phone') || 'Someone', email: pick('email'), phone: pick('phone'), company: pick('company'),
      city: list.map(cityOf).find(Boolean) || '', first: first.at, last: f.at, n: list.length, form: formLabel(f.form), channel: first.channel || '',
      stage: STG[r.stage] ? r.stage : 'new', staged: !!STG[r.stage], value: Number(r.value) || 0, owner: r.owner || '', due: r.due || '',
      notes: r.notes || [], log: r.log || [], touched: r.t || 0, stageAt: lastStage ? lastStage.t : 0,
      spam: list.every(x => markStatus(M, x) === 'Spam'), M,
      marks: [].concat.apply([], list.map(x => ((M || {})[x.id] || []).map(m => Object.assign({id: x.id}, m)))).sort((a, b) => b.t - a.t),
      views: crmViews(list)};
  }).filter(c => c.list.length);
}
/* Who opened this person's requests (from the team check-in), newest first, once per person. */
function crmViews(list){
  const d = TEAM.dom === S.domain && TEAM.data; if (!d || !d.acts) return [];
  const ids = {}; list.forEach(r => { if (r.id) ids[r.id] = 1; });
  const out = [], seen = {};
  d.acts.forEach(a => { if (a.s === 'open' && ids[a.id] && !seen[a.name]){ seen[a.name] = 1; out.push(a); } });
  return out;
}
/* Marks (latest per teammate) and who viewed, as small chips. */
function crmMV(c, compact){
  const me = actMe(), per = {}, ml = [];
  c.marks.forEach(m => { if (!per[m.name]){ per[m.name] = 1; ml.push(m); } });
  const mk = ml.slice(0, compact ? 2 : 3).map(m => '<span class="cr-mk" style="--c:' + MARKS[m.s][1] + '" title="' + esc(MARKS[m.s][0] + ' · marked by ' + (m.name === me ? 'you' : m.name) + ' · ' + fullDate(m.t)) + '">' + ic(MARKS[m.s][2], 10) + (compact ? '' : MARKS[m.s][0]) + '<em>' + esc(m.by) + '</em></span>').join('');
  const v = c.views, vw = v.length ? '<span class="cr-vw" title="' + esc('Opened by ' + v.map(a => (a.name === me ? 'you' : a.name) + ' (' + ago(a.t) + ')').join(', ')) + '">' + ic('eye', 11) + '<span>' + v.slice(0, 3).map(a => '<i style="background:' + hue(a.name) + '">' + esc(a.by) + '</i>').join('') + '</span>' + (compact ? '' : esc(v[0].name === me ? 'You' : v[0].name.split(' ')[0]) + (v.length > 1 ? ' +' + (v.length - 1) : '') + ' · ' + esc(ago(v[0].t))) + '</span>' : '';
  return mk + vw;
}
/* After a mark is made from a client card, show it in every inbox on the page right away. */
function crmMarksOut(M){
  document.querySelectorAll('[data-mki]').forEach(box => { const b = box.querySelector('[data-mk]'); if (b) box.innerHTML = marksHtml(M[b.dataset.mk], b.dataset.mk); });
  crmEmit(S.domain);
}
const dueOf = c => {
  if (!c.due) return null;
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const d = Math.round((new Date(c.due + 'T00:00:00').getTime() - a.getTime()) / 864e5);
  return {d, k: d < 0 ? 'late' : d === 0 ? 'today' : 'soon', label: d < 0 ? (d === -1 ? 'Due yesterday' : Math.abs(d) + ' days late') : d === 0 ? 'Due today' : d === 1 ? 'Tomorrow' : new Date(c.due + 'T00:00:00').toLocaleDateString('en-CA', {month: 'short', day: 'numeric'})};
};
const dueChip = c => { const u = dueOf(c); return u ? '<span class="cr-due ' + u.k + '">' + ic('clock', 11) + esc(u.label) + '</span>' : ''; };
const stagePill = s => '<span class="cr-st" style="--c:' + STG[s][2] + '"><i></i>' + esc(STG[s][1]) + '</span>';
const waitTxt = ms => ms < 36e5 ? Math.max(1, Math.round(ms / 6e4)) + ' min' : ms < 864e5 ? Math.round(ms / 36e5) + ' h' : Math.round(ms / 864e5) + ' days';
function keepScroll(h, sel, fn){ const st = [...h.querySelectorAll(sel)].map(e => e.scrollTop); fn(); h.querySelectorAll(sel).forEach((e, i) => { if (st[i]) e.scrollTop = st[i]; }); }
const crmMatch = (c, q) => !q || [c.name, c.email, c.phone, c.company, c.city, c.owner, c.form].join(' ').toLowerCase().indexOf(q.toLowerCase()) > -1;
/* Repaint a widget when the CRM changes; wait while someone is typing in it. */
function crmWire(h, paint){
  const dom = S.domain;
  const on = e => {
    if (!h.isConnected){ document.removeEventListener('el-crm', on); return; }
    if (e.detail.domain !== dom) return;
    const a = document.activeElement;
    if (a && h.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)){ a.addEventListener('blur', () => paint(), {once: true}); return; }
    paint();
  };
  document.addEventListener('el-crm', on);
  /* Marks and "opened by" come with the team check-in: repaint only when they changed. */
  const sig = () => { const d = TEAM.dom === dom && TEAM.data; if (!d) return ''; const o = (d.acts || []).filter(a => a.s === 'open'); return JSON.stringify(d.marks || {}) + '|' + o.length + '|' + (o[0] ? o[0].t + o[0].name : ''); };
  let last = sig();
  const onT = e => {
    if (!h.isConnected){ document.removeEventListener('el-team', onT); return; }
    if (e.detail.domain !== dom) return;
    const s2 = sig(); if (s2 === last) return; last = s2;
    if (h.querySelector('.dragging') || document.querySelector('.mk-menu')) return;
    on({detail: {domain: dom}});
  };
  document.addEventListener('el-team', onT);
}
const crmLoading = n => '<div class="cr-load">' + Array.from({length: n || 4}, (_, i) => '<div class="sk" style="height:' + (i ? 44 : 30) + 'px;border-radius:12px;margin-bottom:8px;opacity:' + (1 - i * .15) + '"></div>').join('') + '</div>';
const crmErr = e => '<div class="err">' + ic('lock', 22) + '<br><b>Clients couldn’t load</b><br>' + esc(e && e.message || 'Try again in a moment.') + '</div>';

/* ----- Clients at a glance ----- */
function drawCrmKpis(h, D){
  h.innerHTML = '<div class="ib-stats">' + SK.kpis(5) + '</div>';
  const paint = async () => {
    let C; try{ C = (await crmClients(D.forms && D.forms.rows)).filter(c => !c.spam); }catch(e){ h.innerHTML = crmErr(e); return; }
    if (!h.isConnected) return;
    const r = range(), s = r.s, e = r.e + 864e5;
    const open = C.filter(c => OPEN_ST.indexOf(c.stage) > -1), openV = open.reduce((a, c) => a + c.value, 0);
    const wonP = C.filter(c => c.stage === 'won' && c.stageAt >= s && c.stageAt < e), wonV = wonP.reduce((a, c) => a + c.value, 0);
    const won = C.filter(c => c.stage === 'won').length, lost = C.filter(c => c.stage === 'lost').length;
    const fresh = C.filter(c => c.first >= s && c.first < e);
    const waits = fresh.map(c => { const x = c.log.find(l => l.f === 'stage' && l.v !== 'new'); return x ? x.t - c.first : null; }).filter(x => x != null && x >= 0).sort((a, b) => a - b);
    const med = waits.length ? waits[Math.floor(waits.length / 2)] : null;
    const late = C.filter(c => { const u = dueOf(c); return u && u.k === 'late'; }).length;
    const waiting = C.filter(c => !c.staged && Date.now() - c.last < 14 * 864e5).length;
    const repeat = C.filter(c => c.n > 1).length;
    const tile = (l, icn, v, n, cls) => '<div class="ib-stat' + (cls ? ' ' + cls : '') + '"><div class="l">' + l + ic(icn, 16) + '</div><div class="v">' + v + '</div><div class="n">' + n + '</div></div>';
    const cnt = {}; C.forEach(c => { if (c.staged || Date.now() - c.last < 90 * 864e5) cnt[c.stage] = (cnt[c.stage] || 0) + 1; });
    const tot = Object.values(cnt).reduce((a, b) => a + b, 0) || 1;
    h.innerHTML = '<div class="fade-in"><div class="ib-stats cr-kpis">' +
      tile('Open pipeline', 'money', money(openV), fmt(open.length) + ' client' + (open.length === 1 ? '' : 's') + ' in progress') +
      tile('Won this period', 'check', money(wonV), fmt(wonP.length) + ' job' + (wonP.length === 1 ? '' : 's') + ' won') +
      tile('Win rate', 'target', won + lost ? Math.round(won / (won + lost) * 100) + '%' : '—', won + lost ? fmt(won) + ' won · ' + fmt(lost) + ' lost' : 'mark clients Won or Lost') +
      tile('First reply', 'reply', med == null ? '—' : waitTxt(med), med == null ? 'move a new lead to Contacted' : 'typical wait for new leads') +
      tile('Needs attention', 'clock', fmt(late + waiting), fmt(late) + ' late follow-up' + (late === 1 ? '' : 's') + ' · ' + fmt(waiting) + ' not replied', late ? 'cr-hot' : '') +
      '</div><div class="cr-funnel">' + STAGES.filter(x => cnt[x[0]]).map(x => '<span style="--c:' + x[2] + ';flex:' + cnt[x[0]] + '" title="' + esc(x[1] + ': ' + cnt[x[0]]) + '"></span>').join('') + '</div>' +
      '<div class="cr-leg">' + STAGES.map(x => '<span><i style="background:' + x[2] + '"></i>' + esc(x[1]) + ' <b>' + fmt(cnt[x[0]] || 0) + '</b></span>').join('') + '<em>' + fmt(repeat) + ' repeat client' + (repeat === 1 ? '' : 's') + ' · ' + fmt(tot) + ' active</em></div></div>';
  };
  paint(); crmWire(h, paint);
}

/* ----- Client pipeline (drag cards between stages) ----- */
function drawCrmBoard(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {q: '', mine: false, more: {}};
  h.innerHTML = '<div class="cr-tools"><label class="search">' + ic('search', 17) + '<input type="search" data-q placeholder="Find a client by name, email, phone, city or owner…" value="' + esc(st.q) + '"></label>' +
    '<div class="seg cr-seg"><button type="button" data-mine="0"' + (st.mine ? '' : ' class="on"') + '>Everyone</button><button type="button" data-mine="1"' + (st.mine ? ' class="on"' : '') + '>Mine</button></div></div>' +
    '<div class="cr-board" data-b>' + STAGES.map(x => '<div class="cr-col"><div class="cr-ch"><i style="background:' + x[2] + '"></i>' + esc(x[1]) + '</div>' + crmLoading(3) + '</div>').join('') + '</div>' +
    '<div class="cr-hint">' + ic('move', 13) + 'Drag a card to move it to another stage. Click it to open the client: notes, job value, owner and follow-up date. Everyone on this dashboard sees changes live.</div>';
  const B = h.querySelector('[data-b]');
  let C = [];
  const qi = h.querySelector('[data-q]');
  qi.addEventListener('input', () => { st.q = qi.value; render(); });
  h.querySelectorAll('[data-mine]').forEach(b => b.addEventListener('click', () => { st.mine = b.dataset.mine === '1'; h.querySelectorAll('[data-mine]').forEach(x => x.classList.toggle('on', x === b)); render(); }));
  const render = () => {
    const now = Date.now(), me = crmMe();
    const vis = C.filter(c => !c.spam && crmMatch(c, st.q) && (!st.mine || c.owner === me) &&
      (c.staged ? (OPEN_ST.indexOf(c.stage) > -1 || c.stage === 'new' || now - (c.stageAt || c.touched) < 120 * 864e5) : now - c.last < 90 * 864e5));
    B.innerHTML = STAGES.map(x => {
      const list = vis.filter(c => c.stage === x[0]).sort((a, b) => x[0] === 'new' ? b.last - a.last : (b.stageAt || b.touched) - (a.stageAt || a.touched));
      const sum = list.reduce((a, c) => a + c.value, 0), cap = st.more[x[0]] ? 400 : 30;
      return '<div class="cr-col" data-st="' + x[0] + '" style="--c:' + x[2] + '"><div class="cr-ch"><i></i>' + esc(x[1]) + '<b>' + fmt(list.length) + '</b>' + (sum ? '<em>' + money(sum) + '</em>' : '') + '</div><div class="cr-cards">' +
        (list.length ? list.slice(0, cap).map(c => {
          const wait = !c.staged && now - c.last;
          return '<div class="cr-card" draggable="true" data-k="' + esc(c.k) + '"><div class="cc-top"><span class="cc-av" style="background:' + hue(c.name) + '">' + esc(initials(c.name)) + '</span><div class="cc-n"><b>' + esc(c.name) + '</b><small>' + esc(c.company || c.form) + ' · ' + esc(relDay(c.last)) + '</small></div>' + (c.value ? '<em>' + money(c.value) + '</em>' : '') + '</div>' +
            '<div class="cc-meta">' + (wait ? '<span class="cr-wait ' + (wait < 36e5 ? 'ok' : wait < 864e5 ? 'mid' : 'bad') + '">' + ic('clock', 11) + waitTxt(wait) + ' waiting</span>' : '') + dueChip(c) +
            (c.n > 1 ? '<span class="cc-tag">' + ic('reset', 11) + c.n + ' requests</span>' : '') + (c.notes.length ? '<span class="cc-tag">' + ic('edit', 11) + c.notes.length + '</span>' : '') +
            crmMV(c, true) + (c.owner ? '<span class="cc-own" title="Owner: ' + esc(c.owner) + '" style="background:' + hue(c.owner) + '">' + esc(initials(c.owner)) + '</span>' : '') + '</div></div>';
        }).join('') + (list.length > cap ? '<button type="button" class="cr-more" data-more="' + x[0] + '">Show ' + fmt(list.length - cap) + ' more</button>' : '') : '<div class="cr-empty">' + (x[0] === 'new' ? 'No new leads waiting' : 'Drop a client here') + '</div>') +
        '</div></div>';
    }).join('');
    B.querySelectorAll('[data-more]').forEach(b => b.addEventListener('click', () => { st.more[b.dataset.more] = 1; render(); }));
    B.querySelectorAll('.cr-card').forEach(card => {
      card.addEventListener('click', () => { const c = C.find(x => x.k === card.dataset.k); if (c) openClient(c.k, c.list); });
      card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', card.dataset.k); e.dataTransfer.effectAllowed = 'move'; card.classList.add('drag'); B.classList.add('dragging'); });
      card.addEventListener('dragend', () => { card.classList.remove('drag'); B.classList.remove('dragging'); B.querySelectorAll('.cr-col.over').forEach(x => x.classList.remove('over')); });
    });
    B.querySelectorAll('.cr-col').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; col.classList.add('over'); });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', async e => {
        e.preventDefault(); col.classList.remove('over');
        const k = e.dataTransfer.getData('text/plain'), c = C.find(x => x.k === k), s = col.dataset.st;
        if (!c || c.stage === s && c.staged) return;
        const set = {stage: s};
        if ((s === 'quoted' || s === 'won') && !c.value){ const v = prompt((s === 'won' ? 'Nice! What was the job worth?' : 'What is the quote worth?') + ' (optional, in dollars)', ''); const n = Number(String(v || '').replace(/[^0-9.]/g, '')); if (n > 0) set.value = Math.round(n); }
        c.stage = s; c.staged = true; c.stageAt = Date.now(); if (set.value) c.value = set.value; render();
        if (s === 'won') edgeConfetti(col);
        crmSave(k, set);
      });
    });
  };
  const paint = async () => { try{ C = await crmClients(D.forms && D.forms.rows); }catch(e){ B.innerHTML = crmErr(e); return; } if (h.isConnected) keepScroll(h, '.cr-cards', render); };
  paint(); crmWire(h, paint);
}
function edgeConfetti(el){
  const r = el.getBoundingClientRect(), cs = ['#0f9d6b', '#1d7cf2', '#f5b301', '#7c3aed', '#e0413a'];
  for (let i = 0; i < 26; i++){
    const p = document.createElement('i'); p.className = 'cr-conf';
    p.style.cssText = 'left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + 40) + 'px;background:' + cs[i % cs.length];
    document.body.appendChild(p);
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
    p.animate([{transform: 'translate(0,0) rotate(0)', opacity: 1}, {transform: 'translate(' + Math.cos(a) * d + 'px,' + (Math.sin(a) * d + 80) + 'px) rotate(' + (Math.random() * 540) + 'deg)', opacity: 0}], {duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)'}).onfinish = () => p.remove();
  }
}

/* ----- Follow-ups: late, today, coming up, and new leads still waiting for a first reply ----- */
function drawCrmFollow(h, D){
  h.innerHTML = crmLoading(5);
  const paint = async () => {
    let C; try{ C = (await crmClients(D.forms && D.forms.rows)).filter(c => !c.spam); }catch(e){ h.innerHTML = crmErr(e); return; }
    if (!h.isConnected) return;
    const now = Date.now();
    const withDue = C.filter(c => c.due && c.stage !== 'won' && c.stage !== 'lost').map(c => [c, dueOf(c)]);
    const late = withDue.filter(x => x[1].k === 'late').sort((a, b) => a[1].d - b[1].d).map(x => x[0]);
    const today = withDue.filter(x => x[1].k === 'today').map(x => x[0]);
    const soon = withDue.filter(x => x[1].k === 'soon' && x[1].d <= 14).sort((a, b) => a[1].d - b[1].d).map(x => x[0]);
    const waiting = C.filter(c => !c.staged && now - c.last < 14 * 864e5).sort((a, b) => a.last - b.last);
    const row = (c, kind) => '<div class="cr-row" data-k="' + esc(c.k) + '"><span class="cc-av" style="background:' + hue(c.name) + '">' + esc(initials(c.name)) + '</span><div class="cr-rt"><b>' + esc(c.name) + '</b><small>' +
      (kind === 'wait' ? esc(c.form) + ' · ' + '<span class="cr-wait ' + (now - c.last < 36e5 ? 'ok' : now - c.last < 864e5 ? 'mid' : 'bad') + '">' + waitTxt(now - c.last) + ' waiting</span>'
        : stagePill(c.stage) + (c.owner ? ' · ' + esc(c.owner) : '') + (c.notes.length ? ' · ' + esc(String(c.notes[c.notes.length - 1].x).slice(0, 60)) : '')) + '</small></div>' +
      '<div class="cr-ra">' + (kind === 'wait' ? '<button class="btn sm" type="button" data-act="contacted">' + ic('reply', 13) + 'Contacted</button>'
        : (kind === 'soon' ? dueChip(c) : '') + '<button class="cr-ib" type="button" data-act="snooze" title="Push to tomorrow">+1d</button><button class="cr-ib go" type="button" data-act="done" title="Mark this follow-up done">' + ic('check', 13) + '</button>') + '</div></div>';
    const sec = (t, icn, list, kind, cls, empty) => '<div class="cr-sec ' + (cls || '') + '"><div class="cr-sh">' + ic(icn, 14) + esc(t) + '<b>' + fmt(list.length) + '</b></div>' + (list.length ? list.slice(0, 12).map(c => row(c, kind)).join('') + (list.length > 12 ? '<div class="cr-moretxt">+ ' + fmt(list.length - 12) + ' more</div>' : '') : '<div class="cr-empty">' + empty + '</div>') + '</div>';
    h.innerHTML = '<div class="cr-follow fade-in">' +
      sec('Late', 'clock', late, 'due', 'late', 'Nothing late. Nice.') +
      sec('Today', 'cal', today, 'due', 'today', 'No follow-ups due today.') +
      sec('Waiting for a first reply', 'inbox', waiting, 'wait', 'wait', 'Every new lead has been contacted.') +
      sec('Coming up', 'chev', soon, 'soon', '', 'Set a follow-up date on a client to see it here.') + '</div>';
    h.querySelectorAll('.cr-row').forEach(r => r.addEventListener('click', e => {
      const c = C.find(x => x.k === r.dataset.k); if (!c) return;
      const b = e.target.closest('[data-act]');
      if (!b){ openClient(c.k, c.list); return; }
      e.stopPropagation(); r.classList.add('going');
      const a = b.dataset.act;
      if (a === 'contacted') crmSave(c.k, {stage: 'contacted'});
      else if (a === 'done') crmSave(c.k, {done: c.due});
      else { const t = new Date(); t.setDate(t.getDate() + 1); crmSave(c.k, {due: t.toISOString().slice(0, 10)}); }
    }));
  };
  paint(); crmWire(h, paint);
}

/* ----- Client list: one row per person, every stage, exportable ----- */
function drawCrmClients(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {q: '', st: '', sort: 'last', n: 50};
  h.innerHTML = '<div class="cr-tools"><label class="search">' + ic('search', 17) + '<input type="search" data-q placeholder="Search clients…" value="' + esc(st.q) + '"></label><button class="btn" type="button" data-csv>' + ic('dl', 15) + 'Export CSV</button></div><div data-chips class="cr-chips"></div><div data-t>' + crmLoading(6) + '</div>';
  let C = [];
  const qi = h.querySelector('[data-q]'); qi.addEventListener('input', () => { st.q = qi.value; st.n = 50; render(); });
  const list = () => C.filter(c => !c.spam && crmMatch(c, st.q) && (!st.st || (st.st === 'repeat' ? c.n > 1 : c.stage === st.st)));
  const SORTS = {last: (a, b) => b.last - a.last, first: (a, b) => b.first - a.first, value: (a, b) => b.value - a.value, n: (a, b) => b.n - a.n, name: (a, b) => a.name.localeCompare(b.name), stage: (a, b) => STAGES.findIndex(x => x[0] === a.stage) - STAGES.findIndex(x => x[0] === b.stage)};
  const render = () => {
    const ok = C.filter(c => !c.spam), cnt = {}; ok.forEach(c => { cnt[c.stage] = (cnt[c.stage] || 0) + 1; });
    h.querySelector('[data-chips]').innerHTML = [['', 'All', ok.length, '#0b0c0f']].concat(STAGES.map(x => [x[0], x[1], cnt[x[0]] || 0, x[2]]), [['repeat', 'Repeat clients', ok.filter(c => c.n > 1).length, '#4f46e5']])
      .map(x => '<button type="button" data-st="' + x[0] + '" class="cr-chip' + (st.st === x[0] ? ' on' : '') + '" style="--c:' + x[3] + '">' + esc(x[1]) + '<b>' + fmt(x[2]) + '</b></button>').join('');
    h.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { st.st = b.dataset.st; st.n = 50; render(); }));
    const L = list().sort(SORTS[st.sort] || SORTS.last), th = (k, t, cls) => '<th' + (cls ? ' class="' + cls + '"' : '') + '><button type="button" class="sc-sort' + (st.sort === k ? ' on' : '') + '" data-sort="' + k + '">' + t + '</button></th>';
    const spam = C.length - ok.length;
    h.querySelector('[data-t]').innerHTML = L.length ? '<div class="tbl-wrap fade-in"><table class="tbl cr-tbl"><thead><tr>' + th('name', 'Client') + '<th>Contact</th>' + th('stage', 'Stage') + th('value', 'Value', 'num') + '<th>Owner</th><th>Marks &amp; views</th>' + th('n', 'Requests', 'num') + th('first', 'First seen', 'num') + th('last', 'Latest', 'num') + '<th>Came from</th></tr></thead><tbody>' +
      L.slice(0, st.n).map(c => '<tr class="click" data-k="' + esc(c.k) + '"><td><div class="who"><div class="av" style="background:' + hue(c.name) + '">' + esc(initials(c.name)) + '</div><div style="min-width:0"><b>' + esc(c.name) + '</b>' + (c.company || c.city ? '<span class="muted" style="font-size:12px">' + esc([c.company, c.city].filter(Boolean).join(' · ')) + '</span>' : '') + '</div></div></td>' +
        '<td style="font-size:12.5px">' + esc(c.email || '') + (c.email && c.phone ? '<br>' : '') + '<span class="muted">' + esc(c.phone || (c.email ? '' : '—')) + '</span></td><td>' + stagePill(c.stage) + (dueOf(c) ? '<br>' + dueChip(c) : '') + '</td>' +
        '<td class="num">' + (c.value ? money(c.value) : '<span class="muted">—</span>') + '</td><td>' + (c.owner ? '<span class="cr-ownc"><i style="background:' + hue(c.owner) + '">' + esc(initials(c.owner)) + '</i>' + esc(c.owner) + '</span>' : '<span class="muted">—</span>') + '</td>' +
        '<td><div class="cr-mvc">' + (crmMV(c) || '<span class="muted">—</span>') + '</div></td><td class="num">' + fmt(c.n) + '</td><td class="num muted">' + esc(relDay(c.first)) + '</td><td class="num muted">' + esc(relDay(c.last)) + '</td><td>' + (c.channel ? '<span class="pill blue">' + esc(c.channel) + '</span>' : '<span class="muted">—</span>') + '</td></tr>').join('') +
      '</tbody></table></div><div class="pager"><span>' + fmt(Math.min(st.n, L.length)) + ' of ' + fmt(L.length) + ' client' + (L.length === 1 ? '' : 's') + (spam ? ' · ' + fmt(spam) + ' marked spam left out' : '') + '</span><div>' + (L.length > st.n ? '<button class="btn sm" type="button" data-morec>Show more</button>' : '') + '</div></div>'
      : '<div class="empty">' + (C.length ? 'No clients match.' : 'No clients yet. Everyone who sends a form shows up here.') + '</div>';
    h.querySelectorAll('[data-sort]').forEach(b => b.addEventListener('click', () => { st.sort = b.dataset.sort; render(); }));
    const mc = h.querySelector('[data-morec]'); if (mc) mc.addEventListener('click', () => { st.n += 100; render(); });
    h.querySelectorAll('tr[data-k]').forEach(tr => tr.addEventListener('click', () => { const c = C.find(x => x.k === tr.dataset.k); if (c) openClient(c.k, c.list); }));
  };
  h.querySelector('[data-csv]').addEventListener('click', () => {
    const L = list(), q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = [['Name', 'Email', 'Phone', 'Company', 'City', 'Stage', 'Value', 'Owner', 'Follow up', 'Requests', 'First seen', 'Latest', 'Came from', 'Latest note']].concat(L.map(c => [c.name, c.email, c.phone, c.company, c.city, STG[c.stage][1], c.value || '', c.owner, c.due, c.n, iso(c.first), iso(c.last), c.channel, c.notes.length ? c.notes[c.notes.length - 1].x : ''])).map(r => r.map(q).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'})); a.download = 'clients-' + S.domain + '-' + iso(Date.now()) + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  const paint = async () => { try{ C = await crmClients(D.forms && D.forms.rows); }catch(e){ h.querySelector('[data-t]').innerHTML = crmErr(e); return; } if (h.isConnected) keepScroll(h, '.tbl-wrap', render); };
  paint(); crmWire(h, paint);
}

/* ----- The client card: stage, value, owner, follow-up, notes and the whole timeline ----- */
function openClient(key, list){
  const f = list[0], pick = x => (list.find(y => y[x]) || {})[x] || '';
  const nm = pick('name') || pick('email') || pick('phone') || 'Client';
  const b = drawer(nm, [['Email', pick('email')], ['Phone', pick('phone')], ['Company', pick('company')], ['City', list.map(cityOf).find(Boolean)], ['Requests', fmt(list.length)], ['First request', fullDate(list[list.length - 1].at)], ['Latest', fullDate(f.at)], ['Came from', list[list.length - 1].channel]],
    '<div class="cr-card-d" data-cr>' + crmLoading(3) + '</div>', {sub: esc([pick('email'), pick('phone')].filter(Boolean).join(' · ')), rw: true});
  const box = b.querySelector('[data-cr]');
  let c = null;
  const owners = () => { const s = new Set(); ((TEAM.data && TEAM.data.people) || []).forEach(p => { if (p.name) s.add(p.name); }); Object.values((CRM[S.domain] || {}).data || {}).forEach(r => { if (r.owner) s.add(r.owner); }); s.add(crmMe()); return [...s]; };
  let EV = [];
  /* Every request from this person, with the same Done / Pending / Spam marks as the inbox (and who opened it). */
  const reqs = () => c.list.slice(0, 20).map((r, i) => {
    const v = crmViews([r]);
    return '<div class="cr-req"><div class="cr-rq" data-rq="' + i + '"><b>' + esc(formLabel(r.form)) + '</b><small>' + esc(fullDate(r.at)) + (r.message ? ' · ' + esc(String(r.message).slice(0, 70)) : '') + '</small>' +
      (v.length ? '<span class="cr-vw">' + ic('eye', 11) + '<span>' + v.slice(0, 3).map(a => '<i style="background:' + hue(a.name) + '">' + esc(a.by) + '</i>').join('') + '</span>Opened by ' + esc(v[0].name === actMe() ? 'you' : v[0].name.split(' ')[0]) + (v.length > 1 ? ' +' + (v.length - 1) : '') + '</span>' : '') +
      '</div><div class="mk" data-rmk="' + i + '">' + marksHtml(((c.M || {})[r.id]), r.id) + '</div></div>';
  }).join('') + (c.list.length > 20 ? '<div class="cr-moretxt">+ ' + (c.list.length - 20) + ' older requests</div>' : '');
  const tl = () => {
    const ev = EV = [];
    const ids = {}; c.list.forEach(r => { if (r.id) ids[r.id] = r; });
    ((TEAM.dom === S.domain && TEAM.data && TEAM.data.acts) || []).forEach(a => { if (a.s === 'open' && ids[a.id]) ev.push({t: a.t, ic: 'eye', col: '#6366f1', h: '<b>' + esc(a.name === actMe() ? 'You' : a.name) + '</b> opened “' + esc(formLabel(ids[a.id].form)) + '”', r: ids[a.id], who: a.name}); });
    c.list.forEach(r => { ev.push({t: r.at, ic: 'form', col: '#1d7cf2', h: '<b>Sent “' + esc(formLabel(r.form)) + '”</b>' + (r.message ? '<small class="cr-q">' + esc(String(r.message).slice(0, 140)) + '</small>' : ''), r});
      ((c.M || {})[r.id] || []).forEach(m => ev.push({t: m.t, ic: MARKS[m.s][2], col: MARKS[m.s][1], h: '<b>' + esc(m.name || m.by) + '</b> marked a request <b>' + esc(MARKS[m.s][0]) + '</b>', who: m.name || m.by})); });
    c.log.forEach(l => {
      const w = '<b>' + esc(l.name || l.by) + '</b> ';
      const h = l.f === 'stage' ? w + 'moved them to ' + stagePill(STG[l.v] ? l.v : 'new') : l.f === 'value' ? w + (Number(l.v) ? 'set the job value to <b>' + money(l.v) + '</b>' : 'cleared the job value') : l.f === 'owner' ? w + (l.v ? 'gave this client to <b>' + esc(l.v) + '</b>' : 'removed the owner') :
        l.f === 'due' ? w + (l.v ? 'set a follow-up for <b>' + esc(new Date(l.v + 'T00:00:00').toLocaleDateString('en-CA', {weekday: 'short', month: 'short', day: 'numeric'})) + '</b>' : 'cleared the follow-up') : l.f === 'done' ? w + 'finished the follow-up' : l.f === 'unnote' ? w + 'removed a note' : w + 'added a note';
      ev.push({t: l.t, ic: l.f === 'stage' ? (STG[l.v] || STG.new)[3] : l.f === 'value' ? 'money' : l.f === 'owner' ? 'users' : l.f === 'note' ? 'edit' : 'clock', col: l.f === 'stage' ? (STG[l.v] || STG.new)[2] : '#64748b', h, who: l.name || l.by});
    });
    ev.sort((a, b) => b.t - a.t); EV = ev.slice(0, 80);
    return EV.map((e, i) => '<div class="cr-ev"' + (e.r ? ' data-sub="' + i + '"' : '') + '><span class="cr-evi" style="--c:' + e.col + '">' + ic(e.ic, 12) + '</span><div>' + e.h + '<small>' + esc(fullDate(e.t)) + ' · ' + esc(ago(e.t)) + '</small></div></div>').join('') || '<div class="cr-empty">Nothing yet.</div>';
  };
  const paint = () => {
    box.innerHTML = '<div class="cr-steps">' + STAGES.map(x => '<button type="button" data-stage="' + x[0] + '" style="--c:' + x[2] + '" class="' + (c.stage === x[0] ? 'on' : '') + '">' + ic(x[3], 13) + esc(x[1]) + '</button>').join('') + '</div>' +
      (c.spam ? '<div class="cr-note-warn">' + ic('x', 13) + 'Every request from this person was marked Spam, so they’re left out of the pipeline.</div>' : '') +
      '<div class="cr-fields"><label><span>' + ic('money', 13) + 'Job value</span><input type="number" min="0" step="50" inputmode="numeric" data-f="value" placeholder="$0" value="' + (c.value || '') + '"></label>' +
      '<label><span>' + ic('users', 13) + 'Owner</span><input data-f="owner" list="cr-owners" placeholder="Who looks after them" value="' + esc(c.owner) + '"><datalist id="cr-owners">' + owners().map(o => '<option value="' + esc(o) + '">').join('') + '</datalist></label>' +
      '<label><span>' + ic('clock', 13) + 'Follow up on</span><input type="date" data-f="due" value="' + esc(c.due) + '"></label></div>' +
      '<div class="cr-quick">' + [[1, 'Tomorrow'], [3, 'In 3 days'], [7, 'Next week']].map(x => '<button type="button" data-in="' + x[0] + '">' + x[1] + '</button>').join('') + (c.due ? '<button type="button" data-donef class="go">' + ic('check', 12) + 'Follow-up done</button>' : '') + '</div>' +
      '<div class="pp-h">' + ic('edit', 14) + 'Team notes</div><div class="cr-notes">' + (c.notes.length ? c.notes.slice().reverse().map(n => '<div class="cr-nt"><span class="cc-av" style="background:' + hue(n.name || n.by) + '">' + esc(n.by || initials(n.name)) + '</span><div><div class="cr-nh"><b>' + esc(n.name || n.by) + '</b><small>' + esc(ago(n.t)) + '</small></div><div class="cr-nx">' + esc(n.x) + '</div></div></div>').join('') : '<div class="cr-empty">No notes yet. What did they ask for? When can you call?</div>') + '</div>' +
      '<div class="cr-comp"><textarea data-crnote rows="2" placeholder="Add a note for the team… (Ctrl+Enter to save)"></textarea><button class="btn go sm" type="button" data-addnote>' + ic('send', 13) + 'Add note</button></div>' +
      '<div class="pp-h">' + ic('form', 14) + 'Requests · marks</div><div class="cr-reqs">' + reqs() + '</div>' +
      '<div class="pp-h">' + ic('clock', 14) + 'Timeline · marks, views and changes</div><div class="cr-tl">' + tl() + '</div>';
    box.querySelectorAll('[data-stage]').forEach(x => x.addEventListener('click', () => { if (c.stage === x.dataset.stage && c.staged) return; const s = x.dataset.stage, set = {stage: s};
      if ((s === 'won' || s === 'quoted') && !c.value){ const v = prompt((s === 'won' ? 'Nice! What was the job worth?' : 'What is the quote worth?') + ' (optional, in dollars)', ''); const n = Number(String(v || '').replace(/[^0-9.]/g, '')); if (n > 0) set.value = Math.round(n); }
      if (s === 'won') edgeConfetti(x); crmSave(key, set); }));
    box.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', () => {
      const f2 = inp.dataset.f; let v = inp.value.trim();
      if (f2 === 'value') v = v === '' ? '' : Math.max(0, Math.round(Number(v) || 0));
      if (String(v) === String(f2 === 'value' ? (c.value || '') : c[f2] || '')) return;
      crmSave(key, {[f2]: v});
    }));
    box.querySelectorAll('[data-in]').forEach(x => x.addEventListener('click', () => { const t = new Date(); t.setDate(t.getDate() + Number(x.dataset.in)); crmSave(key, {due: t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0')}); }));
    const df = box.querySelector('[data-donef]'); if (df) df.addEventListener('click', () => crmSave(key, {done: c.due}));
    const ta = box.querySelector('[data-crnote]'), add = () => { const v = ta.value.trim(); if (!v) return; ta.value = ''; crmSave(key, {note: v.slice(0, 2000)}); };
    box.querySelector('[data-addnote]').addEventListener('click', add);
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); add(); } });
    box.querySelectorAll('[data-sub]').forEach(el => el.addEventListener('click', () => {
      const e0 = EV[Number(el.dataset.sub)]; if (e0 && e0.r){ openSubmission(e0.r); leadSeen(e0.r); }
    }));
    box.querySelectorAll('[data-rq]').forEach(el => el.addEventListener('click', () => { const r = c.list[Number(el.dataset.rq)]; if (r){ openSubmission(r); leadSeen(r); } }));
    box.querySelectorAll('[data-rmk]').forEach(mb => mb.addEventListener('click', e => {
      const bt = e.target.closest('[data-mk]'); if (!bt) return; e.stopPropagation();
      const r = c.list[Number(mb.dataset.rmk)], M = c.M || {};
      markMenu(bt, r, M, () => { mb.innerHTML = marksHtml(M[r.id], r.id); crmMarksOut(M); });
    }));
  };
  const load = async () => {
    try{ const all = await crmClients(list); c = all.find(x => x.k === key); }catch(e){ box.innerHTML = crmErr(e); return; }
    if (!c){ box.innerHTML = '<div class="cr-empty">This person has no form leads yet.</div>'; return; }
    if (!box.isConnected) return;
    const a = document.activeElement;
    if (a && box.contains(a) && /INPUT|TEXTAREA/.test(a.tagName) && a.value){ a.addEventListener('blur', () => load(), {once: true}); return; }
    paint();
  };
  load();
  if (list[0] && list[0].id) leadSeen(list[0]);
  const onT = e => { if (!b.isConnected){ document.removeEventListener('el-team', onT); return; } if (e.detail.domain === S.domain && c && !document.querySelector('.mk-menu')) load(); };
  document.addEventListener('el-team', onT);
  const on = e => { if (!b.isConnected){ document.removeEventListener('el-crm', on); return; } if (e.detail.domain === S.domain) load(); };
  document.addEventListener('el-crm', on);
  return b;
}

/* ----- In the Lead inbox: each lead's client stage, owner and follow-up; CRM changes in its Activity ----- */
function ibCrm(h){
  const data = (CRM[S.domain] || {}).data; if (!data) return;
  h.querySelectorAll('[data-crk]').forEach(el => {
    const k = el.dataset.crk, r = k && data[k];
    if (!k){ el.innerHTML = ''; return; }
    const st = r && STG[r.stage] ? r.stage : '', last = r && r.log && r.log.length ? r.log[r.log.length - 1] : null;
    el.innerHTML = r && (st || r.owner || r.due || (r.notes || []).length)
      ? '<span role="button" tabindex="0" class="ib-cr" data-crc title="Open the client card">' + (st ? stagePill(st) : '') + (Number(r.value) ? '<span class="ib-crv">' + money(r.value) + '</span>' : '') +
        (r.owner ? '<span class="cr-ownc"><i style="background:' + hue(r.owner) + '">' + esc(initials(r.owner)) + '</i>' + esc(r.owner.split(' ')[0]) + '</span>' : '') + dueChip({due: r.due || ''}) +
        ((r.notes || []).length ? '<span class="cc-tag">' + ic('edit', 11) + r.notes.length + '</span>' : '') +
        (last ? '<span class="ib-crw">' + esc(last.name === actMe() ? 'You' : String(last.name || last.by).split(' ')[0]) + ' · ' + esc(ago(last.t)) + '</span>' : '') + ic('chev', 12) + '</span>'
      : '<span role="button" tabindex="0" class="ib-cr ghost" data-crc title="Open the client card">' + ic('grid', 11) + 'Client card' + ic('chev', 12) + '</span>';
  });
}
function crmActs(L){
  const data = (CRM[S.domain] || {}).data; if (!data) return [];
  const byK = {}; Object.values(L || {}).forEach(r => { const k = personKey(r); if (k && (!byK[k] || r.at > byK[k].at)) byK[k] = r; });
  const out = [];
  Object.keys(data).forEach(k => (data[k].log || []).forEach(l => out.push({t: l.t, name: l.name || l.by, by: l.by || initials(l.name), s: 'crm', f: l.f, v: l.v, k, id: byK[k] ? byK[k].id : ''})));
  return out;
}
const crmLook = a => a.f === 'stage' ? [(STG[a.v] || STG.new)[2], (STG[a.v] || STG.new)[3]] : a.f === 'value' ? ['#0f7a58', 'money'] : a.f === 'owner' ? ['#4f46e5', 'users'] : a.f === 'note' ? ['#475569', 'edit'] : ['#d9820b', 'clock'];
const crmVerb = (a, lead) => { const L = '<b>' + esc(lead) + '</b>';
  return a.f === 'stage' ? 'moved ' + L + ' to ' + stagePill(STG[a.v] ? a.v : 'new') : a.f === 'value' ? (Number(a.v) ? 'set ' + L + '’s job value to <b>' + money(a.v) + '</b>' : 'cleared ' + L + '’s job value') :
    a.f === 'owner' ? (a.v ? 'gave ' + L + ' to <b>' + esc(a.v) + '</b>' : 'removed ' + L + '’s owner') : a.f === 'due' ? (a.v ? 'set a follow-up with ' + L + ' for <b>' + esc(new Date(a.v + 'T00:00:00').toLocaleDateString('en-CA', {month: 'short', day: 'numeric'})) + '</b>' : 'cleared the follow-up with ' + L) :
    a.f === 'done' ? 'finished the follow-up with ' + L : a.f === 'unnote' ? 'removed a note on ' + L : 'left a note on ' + L; };

/* ----- Dashboard tabs: drag to reorder (while customizing) ----- */
function tabsReorder(L){
  const tabs = app.querySelectorAll('.tab[data-dash]'); let from = null;
  const clear = () => tabs.forEach(x => x.classList.remove('tab-ovl', 'tab-ovr'));
  tabs.forEach(b => {
    b.draggable = true; b.classList.add('tab-dr'); b.title = 'Drag to move this dashboard';
    b.addEventListener('dragstart', e => { from = Number(b.dataset.dash); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'tab'); setTimeout(() => b.classList.add('tab-drag'), 0); });
    b.addEventListener('dragend', () => { from = null; b.classList.remove('tab-drag'); clear(); });
    b.addEventListener('dragover', e => { if (from == null) return; e.preventDefault(); const r = b.getBoundingClientRect(), right = e.clientX > r.left + r.width / 2; clear(); b.classList.add(right ? 'tab-ovr' : 'tab-ovl'); });
    b.addEventListener('dragleave', e => { if (!b.contains(e.relatedTarget)) b.classList.remove('tab-ovl', 'tab-ovr'); });
    b.addEventListener('drop', e => {
      e.preventDefault(); if (from == null) return;
      const right = b.classList.contains('tab-ovr'), target = L.dashes[Number(b.dataset.dash)], moved = L.dashes[from], cur = L.dashes[S.dash];
      clear(); if (!target || !moved || target === moved) return;
      L.dashes.splice(from, 1); L.dashes.splice(L.dashes.indexOf(target) + (right ? 1 : 0), 0, moved);
      S.dash = Math.max(0, L.dashes.indexOf(cur)); saveLayout(); renderApp();
    });
  });
}

(function(){ if (document.getElementById('cr-css')) return; const st = document.createElement('style'); st.id = 'cr-css';
  st.textContent =
    '.cr-tools{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}.cr-tools .search{flex:1;min-width:220px}.cr-seg{flex:none}' +
    '.ib-stats.cr-kpis{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}.cr-kpis .ib-stat .v{font-variant-numeric:tabular-nums}.cr-hot .v{color:#d03b33}' +
    '.cr-funnel{display:flex;gap:3px;height:10px;border-radius:99px;overflow:hidden;margin:16px 0 10px;background:#f1f3f6}.cr-funnel span{background:var(--c);min-width:6px;transition:flex .5s cubic-bezier(.2,.7,.3,1)}' +
    '.cr-leg{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12.5px;color:var(--ink-2)}.cr-leg span{display:inline-flex;align-items:center;gap:6px}.cr-leg i{width:8px;height:8px;border-radius:50%}.cr-leg b{color:var(--ink)}.cr-leg em{margin-left:auto;font-style:normal;color:var(--ink-3)}' +
    '.cr-board{display:grid;grid-template-columns:repeat(6,minmax(210px,1fr));gap:12px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x proximity}' +
    '.cr-col{background:#f6f7f9;border:1px solid #eef0f3;border-radius:16px;padding:10px;min-height:220px;display:flex;flex-direction:column;scroll-snap-align:start;transition:background .2s,border-color .2s,box-shadow .2s}' +
    '.cr-board.dragging .cr-col{border-style:dashed}.cr-col.over{background:color-mix(in srgb,var(--c) 8%,#fff);border-color:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 18%,transparent)}' +
    '.cr-ch{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--ink);padding:2px 4px 10px}.cr-ch i{width:9px;height:9px;border-radius:50%;background:var(--c)}.cr-ch b{font-size:11.5px;color:var(--ink-3);background:#fff;border-radius:99px;padding:1px 8px;border:1px solid #eceef2}.cr-ch em{margin-left:auto;font-style:normal;font-size:12px;font-weight:650;color:var(--c)}' +
    '.cr-cards{display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:560px;padding:1px}' +
    '.cr-card{background:#fff;border:1px solid #e9ebef;border-radius:13px;padding:10px 11px;cursor:grab;box-shadow:0 1px 2px rgba(11,12,15,.04);transition:transform .18s,box-shadow .18s,border-color .18s;animation:crIn .35s ease both}' +
    '.cr-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px -10px rgba(11,12,15,.25);border-color:#dfe3ea}.cr-card.drag{opacity:.45;transform:rotate(2deg) scale(.98)}' +
    '@keyframes crIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
    '.cc-top{display:flex;align-items:center;gap:9px}.cc-av{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 11px var(--ui)}.cc-n{min-width:0;flex:1;line-height:1.25}.cc-n b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc-n small{display:block;font-size:11.5px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc-top em{font-style:normal;font-size:12.5px;font-weight:700;color:#0f7a58}' +
    '.cc-meta{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:8px}.cc-meta:empty{display:none}.cc-tag{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:var(--ink-2);background:#f3f4f7;border-radius:99px;padding:2px 8px}.cc-own{margin-left:auto;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 9.5px var(--ui);border:2px solid #fff;box-shadow:0 0 0 1px #e9ebef}' +
    '.cr-due,.cr-wait{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:650;border-radius:99px;padding:2px 8px;white-space:nowrap}.cr-due{background:#eef4ff;color:#1d5fd0}.cr-due.today{background:#fff4e0;color:#b86e00}.cr-due.late{background:#fdecec;color:#c8352e}' +
    '.cr-wait.ok{background:#e9f8f1;color:#0f7a58}.cr-wait.mid{background:#fff4e0;color:#b86e00}.cr-wait.bad{background:#fdecec;color:#c8352e}' +
    '.cr-empty{padding:18px 10px;text-align:center;font-size:12.5px;color:var(--ink-3)}.cr-col .cr-empty{border:1.5px dashed #e3e6eb;border-radius:12px}' +
    '.cr-more{border:0;background:none;font:600 12.5px var(--ui);color:#1d5fd0;padding:6px;cursor:pointer;border-radius:8px}.cr-more:hover{background:#eef4ff}' +
    '.cr-hint{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ink-3);margin-top:10px}' +
    '.cr-conf{position:fixed;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:9999}' +
    '.cr-follow{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}.cr-sec{border:1px solid #eef0f3;border-radius:16px;padding:10px;background:#fbfbfc}' +
    '.cr-sh{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3);padding:2px 6px 8px}.cr-sh b{margin-left:auto;font-size:11.5px;letter-spacing:0;color:var(--ink-2);background:#fff;border:1px solid #eceef2;border-radius:99px;padding:1px 8px}' +
    '.cr-sec.late .cr-sh{color:#c8352e}.cr-sec.today .cr-sh{color:#b86e00}.cr-sec.wait .cr-sh{color:#1d5fd0}' +
    '.cr-row{display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;cursor:pointer;background:#fff;border:1px solid transparent;margin-bottom:4px;transition:background .15s,border-color .15s,opacity .3s,transform .3s}.cr-row:hover{border-color:#e6e9ee}.cr-row.going{opacity:.4;transform:translateX(8px)}' +
    '.cr-rt{flex:1;min-width:0;line-height:1.35}.cr-rt b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cr-rt small{display:block;font-size:11.5px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.cr-ra{display:flex;align-items:center;gap:5px;flex:none}.cr-ib{height:28px;min-width:28px;padding:0 7px;border-radius:9px;border:1px solid var(--line);background:#fff;font:600 11.5px var(--ui);color:var(--ink-2);cursor:pointer;display:grid;place-items:center;transition:background .15s,border-color .15s}.cr-ib:hover{background:#f5f7fa}.cr-ib.go{color:#0f7a58;border-color:#bfe8d4;background:#f2fbf6}.cr-ib.go:hover{background:#e3f6ec}' +
    '.cr-moretxt{font-size:12px;color:var(--ink-3);padding:4px 8px}' +
    '.cr-st{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:650;color:var(--ink);background:color-mix(in srgb,var(--c) 11%,#fff);border-radius:99px;padding:2px 9px 2px 7px;white-space:nowrap}.cr-st i{width:7px;height:7px;border-radius:50%;background:var(--c)}' +
    '.cr-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.cr-chip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:99px;border:1px solid var(--line);background:#fff;font:600 12.5px var(--ui);color:var(--ink-2);cursor:pointer;transition:all .15s}.cr-chip b{font-size:11px;color:var(--ink-3)}.cr-chip:hover{border-color:var(--c)}.cr-chip.on{background:var(--c);border-color:var(--c);color:#fff}.cr-chip.on b{color:rgba(255,255,255,.8)}' +
    '.cr-ownc{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;white-space:nowrap}.cr-ownc i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 9px var(--ui);font-style:normal}.cr-tbl td{vertical-align:middle}.cr-tbl .cr-due{margin-top:4px}' +
    '.cr-card-d{margin:4px 0 16px}.cr-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px}.cr-steps button{display:flex;align-items:center;justify-content:center;gap:6px;height:36px;border-radius:11px;border:1px solid var(--line);background:#fff;font:600 12.5px var(--ui);color:var(--ink-2);cursor:pointer;transition:all .18s}.cr-steps button:hover{border-color:var(--c);color:var(--c)}.cr-steps button.on{background:var(--c);border-color:var(--c);color:#fff;box-shadow:0 6px 16px -8px var(--c)}' +
    '.cr-fields{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.cr-fields label{display:flex;flex-direction:column;gap:5px;min-width:0}.cr-fields span{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3)}' +
    '.cr-fields input{height:38px;border:1px solid var(--line);border-radius:10px;padding:0 10px;font:inherit;font-size:13.5px;background:#fff;min-width:0;width:100%;box-sizing:border-box;transition:border-color .15s,box-shadow .15s}.cr-fields input:focus{outline:none;border-color:#1d7cf2;box-shadow:0 0 0 3px rgba(29,124,242,.15)}' +
    '.cr-quick{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 16px}.cr-quick button{height:28px;padding:0 10px;border-radius:99px;border:1px solid var(--line);background:#fff;font:600 12px var(--ui);color:var(--ink-2);cursor:pointer;display:inline-flex;align-items:center;gap:5px}.cr-quick button:hover{background:#f5f7fa}.cr-quick button.go{color:#0f7a58;border-color:#bfe8d4;background:#f2fbf6}' +
    '.cr-notes{display:flex;flex-direction:column;gap:10px;max-height:260px;overflow:auto;margin-bottom:8px}.cr-nt{display:flex;gap:10px}.cr-nt .cc-av{width:28px;height:28px;font-size:10px}.cr-nt>div{flex:1;min-width:0;background:#f6f7f9;border-radius:4px 14px 14px 14px;padding:8px 11px}.cr-nh{display:flex;align-items:baseline;gap:8px;font-size:12.5px}.cr-nh small{color:var(--ink-3);font-size:11px}.cr-nx{font-size:13.5px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;margin-top:2px}' +
    '.cr-comp{display:flex;gap:8px;align-items:flex-end;margin-bottom:16px}.cr-comp textarea{flex:1;border:1px solid var(--line);border-radius:12px;padding:9px 11px;font:inherit;font-size:13.5px;resize:vertical;min-height:42px}.cr-comp textarea:focus{outline:none;border-color:#1d7cf2;box-shadow:0 0 0 3px rgba(29,124,242,.15)}' +
    '.cr-tl{display:flex;flex-direction:column;max-height:340px;overflow:auto;margin-bottom:14px}.cr-ev{position:relative;display:flex;gap:11px;padding:7px 4px;font-size:13px;line-height:1.45;color:var(--ink-2)}.cr-ev[data-sub]{cursor:pointer;border-radius:10px}.cr-ev[data-sub]:hover{background:#f5f7fa}' +
    '.cr-ev:before{content:"";position:absolute;left:16px;top:34px;bottom:-8px;width:2px;background:#eef0f4}.cr-ev:last-child:before{display:none}.cr-ev b{color:var(--ink);font-weight:600}.cr-ev small{display:block;font-size:11.5px;color:var(--ink-3)}.cr-ev small.cr-q{color:var(--ink-2);font-size:12.5px;margin:2px 0}' +
    '.cr-evi{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;color:#fff;background:var(--c);box-shadow:0 0 0 3px #fff}' +
    '.cr-note-warn{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#c8352e;background:#fdecec;border-radius:10px;padding:8px 11px;margin-bottom:12px}' +
    '@media (max-width:640px){.cr-fields{grid-template-columns:1fr}.cr-steps{grid-template-columns:repeat(2,1fr)}}' +
    '.cr-mk{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:650;color:var(--c);background:color-mix(in srgb,var(--c) 11%,#fff);border-radius:99px;padding:2px 7px 2px 6px;white-space:nowrap}.cr-mk em{font-style:normal;color:var(--ink-2);font-weight:700;font-size:10px}' +
    '.cr-vw{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--ink-3);white-space:nowrap}.cr-vw>svg{color:#6366f1}.cr-vw>span{display:inline-flex}.cr-vw i{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 8.5px var(--ui);font-style:normal;border:1.5px solid #fff;margin-left:-5px}.cr-vw i:first-child{margin-left:0}' +
    '.cr-mvc{display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center;max-width:260px}' +
    '.cr-reqs{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}.cr-req{display:flex;align-items:flex-start;gap:10px;padding:9px 11px;border:1px solid #eef0f3;border-radius:12px;background:#fff}.cr-rq{flex:1;min-width:0;cursor:pointer}.cr-rq b{display:block;font-size:13px}.cr-rq small{display:block;font-size:11.5px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}.cr-req .mk{position:relative;left:auto;right:auto;bottom:auto;flex:none;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px;max-width:55%}' +
    '.ib-crm:empty{display:none}.ib-crm{margin-top:7px}.ib-cr{display:inline-flex;align-items:center;flex-wrap:wrap;gap:6px;border:1px solid #e6e9ee;background:#fafbfc;border-radius:99px;padding:3px 8px 3px 4px;font:inherit;font-size:11.5px;color:var(--ink-2);cursor:pointer;transition:border-color .15s,background .15s}.ib-cr:hover{border-color:#c9d3e3;background:#f3f6fb}.ib-cr>svg:last-child{color:var(--ink-3)}' +
    '.ib-cr.ghost{opacity:0;padding:3px 9px;gap:5px;transition:opacity .2s}.ibrow:hover .ib-cr.ghost,.ib-cr.ghost:focus{opacity:1}.ib-crv{font-weight:700;color:#0f7a58}.ib-crw{color:var(--ink-3)}' +
    '.tab-dr{cursor:grab}.tab-drag{opacity:.35}.tab-ovl{box-shadow:inset 3px 0 0 #1d7cf2}.tab-ovr{box-shadow:inset -3px 0 0 #1d7cf2}' +
    '.toast.ut{display:flex;align-items:center;gap:12px;padding:8px 8px 8px 16px}.toast.ut button{display:inline-flex;align-items:center;gap:6px;border:0;background:rgba(255,255,255,.14);color:#fff;font:600 12.5px var(--ui);padding:6px 11px;border-radius:9px;cursor:pointer;transition:background .15s}.toast.ut button:hover{background:rgba(255,255,255,.26)}.toast.ut kbd{font:600 11px var(--ui);color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:2px 6px}.toast.out{opacity:0;transition:opacity .25s}' +
    '.w.no-anim,.w.no-anim .fade-in,.w.no-anim .cr-card,.w.no-anim .facet .tr b,.w.no-anim .mk-chip,.w.no-anim .cr-funnel span{animation:none!important;transition:none}' +
    '.tab-x{display:inline-grid;place-items:center;width:18px;height:18px;margin-left:6px;margin-right:-4px;border-radius:50%;color:var(--ink-3);vertical-align:-3px;transition:background .15s,color .15s}.tab-x:hover{background:#fdecec;color:#c8352e}';
  document.head.appendChild(st); })();
/* ---------- Undo: Ctrl+Z (⌘Z on a Mac), or the Undo button on the note that appears after a change ----------
   Covers dashboard changes (widgets added, removed, moved or resized, dashboards added, deleted,
   renamed or moved), client changes (stage, value, owner, follow-up, notes) and lead marks. Inside a
   text box Ctrl+Z keeps undoing typing, as usual. Switching business starts a fresh history. */
/* Easyleads stores notes written in its own editor as HTML: show them as plain lines. DOMParser documents are inert, and the result is escaped again where it is drawn. */
function ghNoteText(s){ s = String(s == null ? '' : s); if (!/<[a-z!\/]/i.test(s) && !/&[a-z#0-9]+;/i.test(s)) return s; try{ const d = new DOMParser().parseFromString('<div>' + s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n$&') + '</div>', 'text/html'); return (d.body.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }catch(e){ return s.replace(/<[^>]+>/g, ' '); } }
const UNDO = [];
let UNDO_BUSY = false;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
function undoPush(label, run, x){
  const top = UNDO[UNDO.length - 1];
  if (x && x.lay && top && top.lay && top.label === label && Date.now() - top.t < 1500){ top.t = Date.now(); undoToast(label); return; }   /* one drag or resize = one undo */
  UNDO.push(Object.assign({label, run, t: Date.now(), dom: S.domain}, x || {}));
  if (UNDO.length > 60) UNDO.shift();
  undoToast(label);
}
async function undoLast(){
  const u = UNDO.pop();
  document.querySelectorAll('.toast.ut').forEach(x => x.remove());
  if (!u){ toast('Nothing to undo'); return; }
  if (u.dom !== S.domain){ UNDO.length = 0; toast('Nothing to undo'); return; }
  UNDO_BUSY = true;
  try{ await u.run(); toast('Undone: ' + u.label); }
  catch(e){ toast('Couldn’t undo that: ' + (e && e.message || 'try again')); }
  finally{ UNDO_BUSY = false; }
}
function undoToast(label){
  document.querySelectorAll('.toast.ut').forEach(x => x.remove());
  const t = document.createElement('div'); t.className = 'toast ut';
  t.innerHTML = '<span>' + esc(label) + '</span><button type="button">' + ic('reset', 13) + 'Undo</button><kbd>' + (isMac ? '⌘Z' : 'Ctrl Z') + '</kbd>';
  t.querySelector('button').addEventListener('click', () => undoLast());
  document.body.appendChild(t);
  clearTimeout(undoToast.tm); undoToast.tm = setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 6500);
}
document.addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || String(e.key).toLowerCase() !== 'z') return;
  const a = document.activeElement;
  if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
  if (!S.me) return;
  e.preventDefault(); undoLast();
});
/* What changed between two saved layouts, in words, for the undo note. */
function layLabel(a, b){
  try{
    const did = d => d.id || d.name, A = a.dashes, B = b.dashes;
    if (A.length > B.length){ const g = A.find(d => !B.some(x => did(x) === did(d))); return 'Deleted dashboard “' + (g ? g.name : '') + '”'; }
    if (A.length < B.length) return 'Added a dashboard';
    if (A.map(did).join('|') !== B.map(did).join('|')) return 'Moved a dashboard';
    for (let i = 0; i < A.length; i++){
      const x = A[i], y = B[i];
      if (x.name !== y.name) return 'Renamed dashboard to “' + y.name + '”';
      if (x.items.length > y.items.length) return 'Removed a widget';
      if (x.items.length < y.items.length) return 'Added a widget';
      if (x.items.map(z => z.id).join() !== y.items.map(z => z.id).join()) return 'Moved a widget';
      for (let k = 0; k < x.items.length; k++){ const p = x.items[k], q = y.items[k]; if (JSON.stringify(p) !== JSON.stringify(q)) return (p.c !== q.c || p.h !== q.h) ? 'Resized a widget' : (q.t === 'note' ? 'Edited a heading' : 'Changed a widget'); }
    }
  }catch(e){}
  return 'Dashboard change';
}
let LSNAP = null, LSNAP_OBJ = null;
async function markSetQuiet(r, s, M, onDone){
  const j = await api('portalMark', {session: S.session, domain: S.domain, id: r.id, s});
  if (j.error) throw new Error(j.error);
  M[r.id] = j.marks || [];
  try{ onDone(); }catch(e){}
  crmMarksOut(M); teamFetch();
}

/* ---------- Sales desk: change things in Easyleads (GoHighLevel) straight from the dashboard ----------
   Only for Easyleads businesses, and only for logins EDGE switched on (or EDGE itself). Every change
   is applied in Easyleads at once, logged on the tracker, and can be undone with Ctrl+Z. */
/* Access levels EDGE sets per login: 0 View only, 1 Notes & tasks, 2 Sales, 3 Full. EDGE itself can do everything.
   The backend checks the same levels on every action; the page only hides what a login can't use. */
const GH_LV = ['View only', 'Notes & tasks', 'Sales', 'Full'];
const GH_LV_D = ['Sees the dashboard. Can’t change anything in Easyleads.', 'Adds notes and tasks, ticks tasks off and tags contacts.', 'Also moves deals, edits contact details, books, moves and cancels appointments and drafts campaigns.', 'Also sends texts and emails, and sends campaigns.'];
const ghLogin = () => !S.me ? 0 : S.me.ghl != null ? Number(S.me.ghl) || 0 : (S.me.write ? 3 : 0);
const ghLv = () => !S.me ? 0 : S.me.edge ? 3 : ghLogin();
const ghCan = n => ghLv() >= n;
const canGhl = () => ghLv() > 0 && srcOf() === 'easyleads';
async function ghl(op, p, o){
  const j = await api('portalGhl', {session: S.session, domain: S.domain, op, p: p || {}, undo: !!(o && o.undo)});
  if (!j || j.error){ const e = new Error((j && j.error) || 'Easyleads didn’t answer.'); e.code = j && j.code; throw e; }
  return j;
}
/* A change: apply it, tell everyone on the page, and offer Undo. */
async function ghlDo(op, p, label){
  const j = await ghl(op, p);
  document.dispatchEvent(new CustomEvent('el-ghl', {detail: {domain: S.domain, op}}));
  if (j.undo){ const u = j.undo; undoPush(label, async () => { await ghl(u.op, u.p, {undo: true}); document.dispatchEvent(new CustomEvent('el-ghl', {detail: {domain: S.domain, op: u.op}})); }); }
  else { document.querySelectorAll('.toast.ut').forEach(x => x.remove()); toast(label); }
  return j;
}
const ghlErr = e => '<div class="err">' + ic('lock', 22) + '<br><b>' + (e && e.code === 'scope' ? 'One more permission needed' : 'Easyleads didn’t answer') + '</b><br>' + esc(e && e.message || 'Try again in a moment.') + '</div>';
function ghlWire(h, paint){
  const dom = S.domain;
  const on = e => { if (!h.isConnected){ document.removeEventListener('el-ghl', on); return; } if (e.detail.domain === dom) paint(true); };
  document.addEventListener('el-ghl', on);
}
const GH = {};   /* per business: pipelines, calendars */
const ghPipes = () => (GH[S.domain] = GH[S.domain] || {}).pipes || (GH[S.domain].pipes = ghl('pipelines').then(j => j.pipelines || [], e => { delete GH[S.domain].pipes; throw e; }));
const ghCals = () => (GH[S.domain] = GH[S.domain] || {}).cals || (GH[S.domain].cals = ghl('calendars').then(j => j.calendars || [], e => { delete GH[S.domain].cals; throw e; }));
const ghLive = '<span class="gh-live" title="Changes here are made in Easyleads right away">' + ic('bolt', 12) + 'Live in Easyleads</span>';
const ghStatus = {open: ['Open', '#1d7cf2'], won: ['Won', '#0f9d6b'], lost: ['Lost', '#e0413a'], abandoned: ['Abandoned', '#8a93a3']};

/* ----- Deals pipeline: drag a deal to another stage and it moves in Easyleads ----- */
function drawGhlDeals(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {pipe: '', q: ''};
  h.innerHTML = '<div class="gh-top">' + ghLive + '<select class="gh-sel" data-pipe><option>Loading pipelines…</option></select><label class="search gh-q">' + ic('search', 16) + '<input type="search" data-q placeholder="Find a deal or contact…" value="' + esc(st.q) + '"></label>' + (ghCan(2) ? '<button class="btn go sm" type="button" data-new>' + ic('plus', 14) + 'New deal</button>' : '') + '</div>' +
    '<div class="cr-board gh-board" data-b>' + Array.from({length: 4}, () => '<div class="cr-col">' + crmLoading(3) + '</div>').join('') + '</div>';
  const B = h.querySelector('[data-b]'), sel = h.querySelector('[data-pipe]');
  let pipes = [], opps = [];
  const pipe = () => pipes.find(x => x.id === st.pipe) || pipes[0];
  const render = () => {
    const pl = pipe(); if (!pl){ B.innerHTML = '<div class="empty">No pipelines in this Easyleads account yet.</div>'; return; }
    const q = st.q.toLowerCase(), list = opps.filter(o => !q || (o.name + ' ' + o.contact + ' ' + o.email).toLowerCase().indexOf(q) > -1);
    B.style.gridTemplateColumns = 'repeat(' + pl.stages.length + ',minmax(220px,1fr))';
    B.innerHTML = pl.stages.map((s, si) => {
      const L = list.filter(o => o.stageId === s.id), sum = L.reduce((a, o) => a + o.value, 0), col = ['#1d7cf2', '#7c3aed', '#d9820b', '#0891b2', '#0f9d6b', '#db2777', '#475569'][si % 7];
      return '<div class="cr-col" data-st="' + esc(s.id) + '" style="--c:' + col + '"><div class="cr-ch"><i></i>' + esc(s.name) + '<b>' + fmt(L.length) + '</b>' + (sum ? '<em>' + money(sum) + '</em>' : '') + '</div><div class="cr-cards">' +
        (L.length ? L.map(o => '<div class="cr-card" draggable="' + (ghCan(2) ? 'true' : 'false') + '" data-id="' + esc(o.id) + '"><div class="cc-top"><span class="cc-av" style="background:' + hue(o.contact) + '">' + esc(initials(o.contact)) + '</span><div class="cc-n"><b>' + esc(o.name) + '</b><small>' + esc(o.contact) + '</small></div>' + (o.value ? '<em>' + money(o.value) + '</em>' : '') + '</div>' +
          (o.status !== 'open' ? '<div class="cc-meta"><span class="cr-st" style="--c:' + (ghStatus[o.status] || ghStatus.open)[1] + '"><i></i>' + esc((ghStatus[o.status] || ghStatus.open)[0]) + '</span></div>' : '') + '</div>').join('') : '<div class="cr-empty">Drop a deal here</div>') + '</div></div>';
    }).join('');
    B.querySelectorAll('.cr-card').forEach(card => {
      card.addEventListener('click', () => { const o = opps.find(x => x.id === card.dataset.id); if (o) ghlDeal(o, pl); });
      card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', card.dataset.id); card.classList.add('drag'); B.classList.add('dragging'); });
      card.addEventListener('dragend', () => { card.classList.remove('drag'); B.classList.remove('dragging'); B.querySelectorAll('.over').forEach(x => x.classList.remove('over')); });
    });
    B.querySelectorAll('.cr-col').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', async e => {
        e.preventDefault(); col.classList.remove('over'); if (!ghCan(2)) return;
        const o = opps.find(x => x.id === e.dataTransfer.getData('text/plain')), sid = col.dataset.st;
        if (!o || o.stageId === sid) return;
        const was = o.stageId, sname = (pl.stages.find(s => s.id === sid) || {}).name;
        o.stageId = sid; render();
        try{ await ghlDo('opp.move', {id: o.id, pipelineId: pl.id, stageId: sid}, 'Moved “' + o.name + '” to ' + sname); }
        catch(err){ o.stageId = was; render(); toast(err.message); }
      });
    });
  };
  const load = async quiet => {
    try{
      if (!pipes.length){ pipes = await ghPipes(); if (!st.pipe && pipes[0]) st.pipe = pipes[0].id; sel.innerHTML = pipes.map(x => '<option value="' + esc(x.id) + '"' + (x.id === st.pipe ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') || '<option>No pipelines</option>'; }
      const pl = pipe(); if (!pl){ render(); return; }
      opps = (await ghl('opps', {pipelineId: pl.id})).opps || [];
      if (h.isConnected) keepScroll(h, '.cr-cards', render);
    }catch(e){ if (!quiet) B.innerHTML = ghlErr(e); }
  };
  sel.addEventListener('change', () => { st.pipe = sel.value; opps = []; B.innerHTML = Array.from({length: 4}, () => '<div class="cr-col">' + crmLoading(3) + '</div>').join(''); load(); });
  h.querySelector('[data-q]').addEventListener('input', e => { st.q = e.target.value; render(); });
  const nb = h.querySelector('[data-new]'); if (nb) nb.addEventListener('click', () => { const pl = pipe(); if (pl) ghlNewDeal(pl); });
  load(); ghlWire(h, load);
}
/* A deal: value, status and stage, all saved in Easyleads. */
function ghlDeal(o, pl){
  const b = drawer(o.name, [['Contact', o.contact], ['Email', o.email], ['Phone', o.phone]], '<div class="gh-d" data-g></div>', {icon: 'money', tint: '#0f7a58', sub: ghLive, rw: true});
  const box = b.querySelector('[data-g]');
  const paint = () => {
    box.innerHTML = '<div class="pp-h">' + ic('funnel', 14) + 'Stage</div><div class="cr-steps gh-steps">' + pl.stages.map(s => '<button type="button" data-s="' + esc(s.id) + '"' + (s.id === o.stageId ? ' class="on"' : '') + ' style="--c:#1d7cf2">' + esc(s.name) + '</button>').join('') + '</div>' +
      '<div class="pp-h">' + ic('check', 14) + 'Status</div><div class="cr-steps">' + Object.keys(ghStatus).map(k => '<button type="button" data-status="' + k + '"' + (o.status === k ? ' class="on"' : '') + ' style="--c:' + ghStatus[k][1] + '">' + ghStatus[k][0] + '</button>').join('') + '</div>' +
      '<div class="cr-fields gh-two"><label><span>' + ic('form', 13) + 'Deal name</span><input data-f="name" value="' + esc(o.name) + '"></label><label><span>' + ic('money', 13) + 'Value</span><input data-f="monetaryValue" type="number" min="0" step="50" value="' + (o.value || '') + '"></label></div>' +
      (o.contactId ? '<button class="btn" type="button" data-ct>' + ic('users', 14) + 'Open ' + esc(o.contact) + '</button>' : '');
    box.querySelectorAll('[data-s]').forEach(x => x.addEventListener('click', async () => { if (x.dataset.s === o.stageId) return; const was = o.stageId; o.stageId = x.dataset.s; paint();
      try{ await ghlDo('opp.move', {id: o.id, pipelineId: pl.id, stageId: o.stageId}, 'Moved “' + o.name + '” to ' + x.textContent); }catch(e){ o.stageId = was; paint(); toast(e.message); } }));
    box.querySelectorAll('[data-status]').forEach(x => x.addEventListener('click', async () => { const s = x.dataset.status; if (s === o.status) return; const was = o.status; o.status = s; paint();
      if (s === 'won') edgeConfetti(x);
      try{ await ghlDo('opp.update', {id: o.id, status: s}, 'Marked “' + o.name + '” ' + ghStatus[s][0]); }catch(e){ o.status = was; paint(); toast(e.message); } }));
    box.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', async () => {
      const f = inp.dataset.f, v = f === 'monetaryValue' ? Math.max(0, Number(inp.value) || 0) : inp.value.trim(); if (!v && f === 'name') return;
      const was = f === 'name' ? o.name : o.value;
      try{ await ghlDo('opp.update', {id: o.id, [f]: v}, f === 'name' ? 'Renamed the deal' : 'Set the deal value to ' + money(v)); if (f === 'name') o.name = v; else o.value = v; }
      catch(e){ inp.value = was || ''; toast(e.message); }
    }));
    const ct = box.querySelector('[data-ct]'); if (ct) ct.addEventListener('click', () => { b.close(); ghlContact(o.contactId, o.contact); });
    if (!ghCan(2)){ box.querySelectorAll('[data-s],[data-status],[data-f]').forEach(x => { x.disabled = true; }); box.insertAdjacentHTML('afterbegin', '<div class="gh-note gh-ro">' + ic('lock', 12) + 'Changing deals needs Sales access.</div>'); }
  };
  paint();
}
/* New deal: pick a contact, name it, give it a value, pick the stage. */
function ghlNewDeal(pl){
  const m = document.createElement('div'); m.className = 'modal-back';
  m.innerHTML = '<div class="modal gh-modal" role="dialog" aria-modal="true"><div class="gh-mh"><div><h2>New deal</h2>' + ghLive + '</div><button class="iconbtn" type="button" data-x aria-label="Close">' + ic('x') + '</button></div>' +
    '<div class="pp-h">' + ic('users', 14) + 'Contact</div><label class="search">' + ic('search', 16) + '<input type="search" data-cq placeholder="Search a contact by name, email or phone…"></label><div class="gh-pick" data-cl></div>' +
    '<div class="cr-fields gh-two"><label><span>' + ic('form', 13) + 'Deal name</span><input data-n placeholder="e.g. Kitchen renovation"></label><label><span>' + ic('money', 13) + 'Value</span><input data-v type="number" min="0" step="50" placeholder="$0"></label></div>' +
    '<div class="pp-h">' + ic('funnel', 14) + 'Stage</div><div class="cr-steps gh-steps">' + pl.stages.map((s, i) => '<button type="button" data-s="' + esc(s.id) + '"' + (i ? '' : ' class="on"') + ' style="--c:#1d7cf2">' + esc(s.name) + '</button>').join('') + '</div>' +
    '<div class="gh-mf"><button class="btn" type="button" data-x>Cancel</button><button class="btn go" type="button" data-go disabled>' + ic('plus', 14) + 'Create in Easyleads</button></div></div>';
  document.body.appendChild(m);
  let contact = null, stage = pl.stages[0] && pl.stages[0].id, t = 0;
  const close = () => m.remove();
  m.addEventListener('click', e => { if (e.target === m) close(); });
  m.querySelectorAll('[data-x]').forEach(x => x.addEventListener('click', close));
  const go = m.querySelector('[data-go]'), cl = m.querySelector('[data-cl]'), n = m.querySelector('[data-n]');
  const ready = () => { go.disabled = !(contact && stage); };
  const search = async q => { cl.innerHTML = crmLoading(2); try{ const r = (await ghl('contacts', {q})).contacts || []; cl.innerHTML = r.length ? r.slice(0, 8).map((c, i) => '<button type="button" data-i="' + i + '"' + (contact && contact.id === c.id ? ' class="on"' : '') + '><span class="cc-av" style="background:' + hue(c.name) + '">' + esc(initials(c.name)) + '</span><span><b>' + esc(c.name) + '</b><small>' + esc([c.email, c.phone].filter(Boolean).join(' · ')) + '</small></span></button>').join('') : '<div class="cr-empty">No contacts match.</div>';
    cl.querySelectorAll('[data-i]').forEach(x => x.addEventListener('click', () => { contact = r[Number(x.dataset.i)]; cl.querySelectorAll('button').forEach(y => y.classList.toggle('on', y === x)); if (!n.value) n.value = contact.name; ready(); })); }catch(e){ cl.innerHTML = ghlErr(e); } };
  m.querySelector('[data-cq]').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => search(e.target.value.trim()), 300); });
  m.querySelectorAll('[data-s]').forEach(x => x.addEventListener('click', () => { stage = x.dataset.s; m.querySelectorAll('[data-s]').forEach(y => y.classList.toggle('on', y === x)); ready(); }));
  go.addEventListener('click', async () => { go.disabled = true; go.innerHTML = '<span class="spin"></span>Creating…';
    try{ await ghlDo('opp.create', {contactId: contact.id, pipelineId: pl.id, stageId: stage, name: n.value.trim() || contact.name, value: m.querySelector('[data-v]').value}, 'Created deal “' + (n.value.trim() || contact.name) + '”'); close(); }
    catch(e){ toast(e.message); go.disabled = false; go.innerHTML = ic('plus', 14) + 'Create in Easyleads'; } });
  search('');
  setTimeout(() => m.querySelector('[data-cq]').focus(), 30);
}

/* ----- Contacts: search, open, edit ----- */
function drawGhlContacts(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {q: ''};
  h.innerHTML = '<div class="gh-top">' + ghLive + '<label class="search gh-q">' + ic('search', 16) + '<input type="search" data-q placeholder="Search contacts by name, email or phone…" value="' + esc(st.q) + '"></label></div><div class="gh-list" data-l>' + crmLoading(5) + '</div>';
  const L = h.querySelector('[data-l]'); let t = 0, seq = 0;
  const load = async quiet => {
    const my = ++seq;
    try{
      const r = (await ghl('contacts', {q: st.q})).contacts || []; if (my !== seq || !h.isConnected) return;
      L.innerHTML = r.length ? r.map((c, i) => '<button type="button" class="gh-row" data-i="' + i + '"><span class="cc-av" style="background:' + hue(c.name) + '">' + esc(initials(c.name)) + '</span><span class="gh-rt"><b>' + esc(c.name) + '</b><small>' + esc([c.email, c.phone, c.company].filter(Boolean).join(' · ') || 'No details') + '</small></span><span class="gh-tags">' + (c.tags || []).slice(0, 3).map(x => '<i>' + esc(x) + '</i>').join('') + ((c.tags || []).length > 3 ? '<i>+' + (c.tags.length - 3) + '</i>' : '') + '</span>' + ic('chev', 14) + '</button>').join('') : '<div class="empty">' + (st.q ? 'No contacts match “' + esc(st.q) + '”.' : 'No contacts yet.') + '</div>';
      L.querySelectorAll('[data-i]').forEach(x => x.addEventListener('click', () => { const c = r[Number(x.dataset.i)]; ghlContact(c.id, c.name); }));
    }catch(e){ if (!quiet) L.innerHTML = ghlErr(e); }
  };
  h.querySelector('[data-q]').addEventListener('input', e => { st.q = e.target.value.trim(); clearTimeout(t); t = setTimeout(load, 300); });
  load(); ghlWire(h, load);
}
/* The contact card: details, tags, notes, tasks, appointments and messages, all live in Easyleads. */
function ghlContact(id, name){
  const b = drawer(name || 'Contact', [], '<div class="gh-c" data-g>' + crmLoading(4) + '</div>', {sub: ghLive, rw: true});
  const box = b.querySelector('[data-g]');
  let C = null, tab = 'note';
  const load = async () => { try{ C = await ghl('contact', {id}); if (box.isConnected) paint(); }catch(e){ box.innerHTML = ghlErr(e); } };
  const when = s => s ? new Date(s).toLocaleString('en-CA', {weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) : '';
  const paint = () => {
    const c = C.contact, notes = C.notes || [], tasks = C.tasks || [], appts = (C.appts || []).filter(a => a.status !== 'cancelled').sort((x, y) => new Date(x.start) - new Date(y.start));
    b.querySelector('.dh h3').textContent = c.name;
    box.innerHTML =
      '<div class="gh-acts">' + [['note', 'edit', 'Note', 1], ['task', 'check', 'Task', 1], ['appt', 'cal', 'Appointment', 2], ['msg', 'send', 'Message', 3], ['deal', 'money', 'Deal', 2]].map(x => '<button type="button" data-tab="' + x[0] + '"' + (tab === x[0] ? ' class="on"' : '') + (ghCan(x[3]) ? '' : ' disabled title="Needs ' + GH_LV[x[3]] + ' access"') + '>' + ic(ghCan(x[3]) ? x[1] : 'lock', 15) + x[2] + '</button>').join('') + '</div>' +
      '<div class="gh-panel" data-panel></div>' +
      '<div class="pp-h">' + ic('users', 14) + 'Details</div><div class="cr-fields gh-two">' + [['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'], ['phone', 'Phone'], ['companyName', 'Company']].map(f => '<label><span>' + esc(f[1]) + '</span><input data-f="' + f[0] + '" value="' + esc(c[f[0]]) + '"' + (ghCan(2) ? '' : ' disabled') + '></label>').join('') + '</div>' +
      '<div class="pp-h">' + ic('spark', 14) + 'Tags</div><div class="gh-tagbox">' + (c.tags || []).map(t => '<span class="gh-tag">' + esc(t) + '<button type="button" data-untag="' + esc(t) + '" aria-label="Remove tag">' + ic('x', 10) + '</button></span>').join('') + '<input data-tag placeholder="Add a tag and press Enter"></div>' +
      '<div class="pp-h">' + ic('cal', 14) + 'Appointments</div><div class="gh-items">' + (appts.length ? appts.map(a => '<div class="gh-item"><span class="cr-evi" style="--c:#0891b2">' + ic('cal', 12) + '</span><div><b>' + esc(a.title || 'Appointment') + '</b><small>' + esc(when(a.start)) + ' · ' + esc(a.status || '') + '</small></div>' + (ghCan(2) ? '<div class="gh-ia"><button class="cr-ib" type="button" data-move="' + esc(a.id) + '" data-cal="' + esc(a.calendarId) + '">Move</button><button class="cr-ib" type="button" data-cancel="' + esc(a.id) + '">Cancel</button></div>' : '') + '</div>').join('') : '<div class="cr-empty">No upcoming appointments.</div>') + '</div>' +
      '<div class="pp-h">' + ic('check', 14) + 'Tasks</div><div class="gh-items">' + (tasks.length ? tasks.map(t => '<label class="gh-item gh-task' + (t.done ? ' done' : '') + '"><input type="checkbox" data-task="' + esc(t.id) + '"' + (t.done ? ' checked' : '') + '><div><b>' + esc(t.title) + '</b><small>' + (t.due ? 'Due ' + esc(when(t.due)) : 'No due date') + '</small></div></label>').join('') : '<div class="cr-empty">No tasks.</div>') + '</div>' +
      '<div class="pp-h">' + ic('edit', 14) + 'Notes</div><div class="cr-notes">' + (notes.length ? notes.map(n => '<div class="cr-nt"><span class="cc-av" style="background:#475569">' + ic('edit', 12) + '</span><div><div class="cr-nh"><small>' + esc(when(n.at)) + '</small></div><div class="cr-nx">' + esc(ghNoteText(n.body)) + '</div></div></div>').join('') : '<div class="cr-empty">No notes yet.</div>') + '</div>';
    panel();
    box.querySelectorAll('[data-tab]').forEach(x => x.addEventListener('click', () => { tab = tab === x.dataset.tab ? '' : x.dataset.tab; box.querySelectorAll('[data-tab]').forEach(y => y.classList.toggle('on', y.dataset.tab === tab)); panel(); }));
    box.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', async () => {
      const f = inp.dataset.f, v = inp.value.trim(), was = c[f]; if (v === was) return;
      try{ await ghlDo('contact.update', {id, [f]: v}, 'Updated ' + c.name); c[f] = v; }catch(e){ inp.value = was; toast(e.message); }
    }));
    const tg = box.querySelector('[data-tag]');
    tg.addEventListener('keydown', async e => { if (e.key !== 'Enter') return; e.preventDefault(); const v = tg.value.trim(); if (!v) return; tg.disabled = true;
      try{ await ghlDo('tags.add', {id, tags: [v]}, 'Tagged ' + c.name + ' “' + v + '”'); }catch(err){ toast(err.message); tg.disabled = false; } });
    box.querySelectorAll('[data-untag]').forEach(x => x.addEventListener('click', async () => { try{ await ghlDo('tags.remove', {id, tags: [x.dataset.untag]}, 'Removed tag “' + x.dataset.untag + '”'); }catch(e){ toast(e.message); } }));
    box.querySelectorAll('[data-task]').forEach(x => x.addEventListener('change', async () => { try{ await ghlDo('task.done', {id, taskId: x.dataset.task, done: x.checked}, x.checked ? 'Task done' : 'Task reopened'); }catch(e){ x.checked = !x.checked; toast(e.message); } }));
    box.querySelectorAll('[data-cancel]').forEach(x => x.addEventListener('click', async () => { if (!confirm('Cancel this appointment in Easyleads?')) return; try{ await ghlDo('appt.status', {eventId: x.dataset.cancel, status: 'cancelled'}, 'Cancelled the appointment'); }catch(e){ toast(e.message); } }));
    box.querySelectorAll('[data-move]').forEach(x => x.addEventListener('click', () => { tab = 'appt'; panel({move: x.dataset.move, cal: x.dataset.cal}); box.querySelector('[data-panel]').scrollIntoView({behavior: 'smooth', block: 'nearest'}); }));
  };
  /* The action panel under the buttons. */
  const panel = o => {
    const P = box.querySelector('[data-panel]'); if (!P) return;
    P.className = 'gh-panel' + (tab ? ' open' : '');
    const c = C.contact;
    if (tab === 'note'){
      P.innerHTML = '<div class="cr-comp"><textarea data-nt rows="2" placeholder="Write a note for ' + esc(c.name) + '… (Ctrl+Enter)"></textarea><button class="btn go sm" type="button" data-go>' + ic('send', 13) + 'Add note</button></div>';
      const ta = P.querySelector('[data-nt]'), go = async () => { const v = ta.value.trim(); if (!v) return; ta.disabled = true; try{ await ghlDo('note.add', {id, body: v}, 'Added a note to ' + c.name); }catch(e){ toast(e.message); ta.disabled = false; } };
      P.querySelector('[data-go]').addEventListener('click', go); ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); go(); } });
    } else if (tab === 'task'){
      const d = new Date(Date.now() + 864e5); d.setHours(10, 0, 0, 0);
      const loc = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
      P.innerHTML = '<div class="cr-fields gh-two"><label><span>Task</span><input data-tt placeholder="e.g. Call back about the quote"></label><label><span>Due</span><input data-td type="datetime-local" value="' + loc + '"></label></div><div class="gh-mf"><button class="btn go sm" type="button" data-go>' + ic('check', 13) + 'Add task</button></div>';
      P.querySelector('[data-go]').addEventListener('click', async e => { const t = P.querySelector('[data-tt]').value.trim() || 'Follow up', dv = P.querySelector('[data-td]').value; e.currentTarget.disabled = true;
        try{ await ghlDo('task.add', {id, title: t, due: dv ? new Date(dv).toISOString() : ''}, 'Added task “' + t + '”'); }catch(err){ toast(err.message); e.currentTarget.disabled = false; } });
    } else if (tab === 'appt'){
      P.innerHTML = '<div class="gh-cal"><select class="gh-sel" data-cal><option>Loading calendars…</option></select><div class="gh-days" data-days></div><div class="gh-slots" data-slots><div class="cr-empty">Pick a day.</div></div></div>';
      const sel = P.querySelector('[data-cal]'), days = P.querySelector('[data-days]'), sl = P.querySelector('[data-slots]');
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Winnipeg';
      let slots = {}, day = '';
      const showDays = () => { const ks = Object.keys(slots).sort(); days.innerHTML = ks.length ? ks.slice(0, 10).map(k => { const dt = new Date(k + 'T12:00:00'); return '<button type="button" data-day="' + k + '"' + (k === day ? ' class="on"' : '') + '><small>' + dt.toLocaleDateString('en-CA', {weekday: 'short'}) + '</small><b>' + dt.getDate() + '</b><small>' + dt.toLocaleDateString('en-CA', {month: 'short'}) + '</small></button>'; }).join('') : '<div class="cr-empty">No free times in the next two weeks.</div>';
        days.querySelectorAll('[data-day]').forEach(x => x.addEventListener('click', () => { day = x.dataset.day; showDays(); showSlots(); })); };
      const showSlots = () => { const L = slots[day] || []; sl.innerHTML = L.length ? L.map(s => '<button type="button" data-t="' + esc(s) + '">' + new Date(s).toLocaleTimeString('en-CA', {hour: 'numeric', minute: '2-digit'}) + '</button>').join('') : '<div class="cr-empty">Pick a day.</div>';
        sl.querySelectorAll('[data-t]').forEach(x => x.addEventListener('click', async () => {
          const when2 = new Date(x.dataset.t).toLocaleString('en-CA', {weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
          x.disabled = true; x.classList.add('on');
          try{
            if (o && o.move) await ghlDo('appt.move', {eventId: o.move, start: x.dataset.t}, 'Moved the appointment to ' + when2);
            else await ghlDo('appt.book', {calendarId: sel.value, contactId: id, start: x.dataset.t, title: c.name}, 'Booked ' + c.name + ' for ' + when2);
          }catch(e){ toast(e.message); x.disabled = false; x.classList.remove('on'); }
        })); };
      const loadSlots = async () => { days.innerHTML = crmLoading(1); sl.innerHTML = ''; day = '';
        try{ const now = Date.now(); slots = (await ghl('slots', {calendarId: sel.value, from: now, to: now + 14 * 864e5, tz})).slots || {}; day = Object.keys(slots).sort()[0] || ''; showDays(); showSlots(); }catch(e){ days.innerHTML = ghlErr(e); } };
      ghCals().then(cs => { sel.innerHTML = cs.map(k => '<option value="' + esc(k.id) + '"' + (o && o.cal === k.id ? ' selected' : '') + '>' + esc(k.name) + '</option>').join('') || '<option value="">No calendars</option>'; if (cs.length) loadSlots(); else days.innerHTML = '<div class="cr-empty">No calendars in this Easyleads account.</div>'; }, e => { days.innerHTML = ghlErr(e); });
      sel.addEventListener('change', loadSlots);
    } else if (tab === 'msg'){
      P.innerHTML = '<div class="seg gh-mt"><button type="button" data-mt="SMS" class="on">SMS</button><button type="button" data-mt="Email">Email</button></div><input class="gh-subj" data-subj placeholder="Subject" hidden><div class="cr-comp"><textarea data-mx rows="3" placeholder="Write a text to ' + esc(c.name) + '…"></textarea><button class="btn go sm" type="button" data-go>' + ic('send', 13) + 'Send</button></div><div class="gh-note">' + ic('lock', 12) + 'Sent from Easyleads to ' + esc(c.phone || c.email || 'this contact') + '. A sent message can’t be undone.</div>';
      let type = 'SMS';
      P.querySelectorAll('[data-mt]').forEach(x => x.addEventListener('click', () => { type = x.dataset.mt; P.querySelectorAll('[data-mt]').forEach(y => y.classList.toggle('on', y === x)); P.querySelector('[data-subj]').hidden = type !== 'Email'; P.querySelector('[data-mx]').placeholder = type === 'Email' ? 'Write an email to ' + c.name + '…' : 'Write a text to ' + c.name + '…'; P.querySelector('.gh-note').innerHTML = ic('lock', 12) + 'Sent from Easyleads to ' + esc((type === 'Email' ? c.email : c.phone) || 'this contact') + '. A sent message can’t be undone.'; }));
      P.querySelector('[data-go]').addEventListener('click', async e => {
        const msg = P.querySelector('[data-mx]').value.trim(); if (!msg) return;
        if (!confirm('Send this ' + (type === 'Email' ? 'email' : 'text') + ' to ' + c.name + ' now? It can’t be unsent.')) return;
        const btn = e.currentTarget; btn.disabled = true;
        try{ await ghlDo('message', {contactId: id, type, message: msg, subject: P.querySelector('[data-subj]').value}, (type === 'Email' ? 'Email' : 'Text') + ' sent to ' + c.name); P.querySelector('[data-mx]').value = ''; }
        catch(err){ toast(err.message); }
        btn.disabled = false;
      });
    } else if (tab === 'deal'){
      P.innerHTML = '<div class="gh-mf" style="justify-content:flex-start"><button class="btn go sm" type="button" data-go>' + ic('plus', 13) + 'Create a deal for ' + esc(c.name) + '</button></div>';
      P.querySelector('[data-go]').addEventListener('click', async () => { try{ const pl = (await ghPipes())[0]; if (!pl) return toast('No pipelines in this Easyleads account.'); ghlNewDealFor(pl, c); }catch(e){ toast(e.message); } });
    } else P.innerHTML = '';
  };
  load();
  const on = e => { if (!b.isConnected){ document.removeEventListener('el-ghl', on); return; } if (e.detail.domain === S.domain) load(); };
  document.addEventListener('el-ghl', on);
}
function ghlNewDealFor(pl, c){
  ghlNewDeal(pl);
  const m = document.querySelector('.gh-modal'); if (!m) return;
  const q = m.querySelector('[data-cq]'); q.value = c.email || c.phone || c.name; q.dispatchEvent(new Event('input'));
}


/* ----- Pipeline summary: deals and value per stage, won this month, win rate ----- */
function drawGhlPipe(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {pipe: ''};
  h.innerHTML = '<div class="gh-top">' + ghLive + '<select class="gh-sel" data-pipe hidden></select></div><div data-b>' + crmLoading(3) + '</div>';
  const B = h.querySelector('[data-b]'), sel = h.querySelector('[data-pipe]');
  let P = null;
  const tile = (label, val, note, icon, tint) => '<div class="kpi" style="--t:' + tint + ';cursor:default"><div class="l">' + esc(label) + ic(icon, 16) + '</div><div class="v">' + val + '</div><div class="n">' + note + '</div></div>';
  const render = () => {
    if (!P) return;
    const pls = P.pipelines || [], pl = pls.find(x => x.id === st.pipe) || pls[0];
    if (!pl){ B.innerHTML = '<div class="empty">No pipelines in this Easyleads account yet.</div>'; return; }
    const all = (P.opps || []).filter(o => o.pipelineId === pl.id), open = all.filter(o => o.status === 'open');
    const now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime(), r = range(), inR = t => { const x = new Date(t).getTime(); return x >= r.s && x < r.e + day; };
    const wonM = all.filter(o => o.status === 'won' && new Date(o.sat).getTime() >= m0), wonP = all.filter(o => o.status === 'won' && inR(o.sat)), lostP = all.filter(o => o.status === 'lost' && inR(o.sat));
    const rate = wonP.length + lostP.length ? Math.round(wonP.length / (wonP.length + lostP.length) * 100) + '%' : '—';
    const newP = all.filter(o => inR(o.at));
    const sum = L => L.reduce((a, o) => a + o.value, 0);
    const max = Math.max(1, ...pl.stages.map(s => open.filter(o => o.stageId === s.id).length));
    B.innerHTML = '<div class="kpis gh-kpis">' +
      tile('Open pipeline', money(sum(open)), fmt(open.length) + ' open deal' + (open.length === 1 ? '' : 's'), 'money', '#1d7cf2') +
      tile('Won this month', money(sum(wonM)), fmt(wonM.length) + ' deal' + (wonM.length === 1 ? '' : 's') + ' won since the 1st', 'check', '#0f9d6b') +
      tile('Win rate', rate, wonP.length + lostP.length ? fmt(wonP.length) + ' won, ' + fmt(lostP.length) + ' lost · ' + esc(rangeText()) : 'no deals won or lost in this period', 'target', '#7c3aed') +
      tile('New deals', fmt(newP.length), money(sum(newP)) + ' added · ' + esc(rangeText()), 'plus', '#d9820b') + '</div>' +
      '<div class="gh-stages">' + pl.stages.map((s, si) => { const L = open.filter(o => o.stageId === s.id), col = ['#1d7cf2', '#7c3aed', '#d9820b', '#0891b2', '#0f9d6b', '#db2777', '#475569'][si % 7];
        return '<div class="gh-stg" style="--c:' + col + '"><div class="gh-sn"><i></i>' + esc(s.name) + '</div><div class="gh-bar"><span style="width:' + Math.max(L.length ? 4 : 0, L.length / max * 100) + '%"></span></div><b>' + fmt(L.length) + '</b><em>' + money(sum(L)) + '</em></div>'; }).join('') + '</div>';
  };
  const load = async quiet => {
    try{
      P = await ghl('pipe.sum');
      const pls = P.pipelines || []; if (!st.pipe && pls[0]) st.pipe = pls[0].id;
      sel.hidden = pls.length < 2; sel.innerHTML = pls.map(x => '<option value="' + esc(x.id) + '"' + (x.id === st.pipe ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('');
      if (h.isConnected) render();
    }catch(e){ if (!quiet) B.innerHTML = ghlErr(e); }
  };
  sel.addEventListener('change', () => { st.pipe = sel.value; render(); });
  load(); ghlWire(h, load);
}

/* ----- Tasks due: every open task in the account, ticked off right here ----- */
function drawGhlTasks(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {f: 'due'};
  h.innerHTML = '<div class="gh-top">' + ghLive + '<div class="seg" data-f>' + [['due', 'Due now'], ['all', 'All open']].map(x => '<button type="button" data-v="' + x[0] + '"' + (st.f === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>').join('') + '</div></div><div class="gh-tl" data-l>' + crmLoading(4) + '</div>';
  const L = h.querySelector('[data-l]');
  let T = null;
  const day0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const grp = t => { if (!t.due) return 'none'; const x = new Date(t.due).getTime(), d0 = day0(); return x < Date.now() && x < d0 + day ? (x < d0 ? 'late' : 'today') : x < d0 + day ? 'today' : 'soon'; };
  const G = [['late', 'Overdue', '#e0413a', 'clock'], ['today', 'Today', '#d9820b', 'cal'], ['soon', 'Coming up', '#1d7cf2', 'chev'], ['none', 'No due date', '#8a93a3', 'check']];
  const whenT = s => { const x = new Date(s), d0 = day0(); const t = x.toLocaleTimeString('en-CA', {hour: 'numeric', minute: '2-digit'}); return x.getTime() >= d0 && x.getTime() < d0 + day ? 'Today ' + t : x.getTime() >= d0 + day && x.getTime() < d0 + 2 * day ? 'Tomorrow ' + t : x.toLocaleDateString('en-CA', {weekday: 'short', month: 'short', day: 'numeric'}) + ' ' + t; };
  const render = () => {
    if (!T) return;
    const list = T.filter(t => st.f === 'all' || ['late', 'today'].indexOf(grp(t)) > -1);
    if (!list.length){ L.innerHTML = '<div class="gh-done">' + ic('check', 22) + '<b>' + (st.f === 'due' ? 'Nothing due right now' : 'No open tasks') + '</b><small>' + (st.f === 'due' && T.length ? fmt(T.length) + ' task' + (T.length === 1 ? '' : 's') + ' coming up later.' : 'Add a task from any contact card.') + '</small></div>'; return; }
    L.innerHTML = G.map(g => { const R = list.filter(t => grp(t) === g[0]); if (!R.length) return '';
      return '<div class="gh-tg"><div class="gh-th" style="--c:' + g[2] + '">' + ic(g[3], 13) + g[1] + '<b>' + fmt(R.length) + '</b></div>' + R.map(t => '<div class="gh-tr" data-t="' + esc(t.id) + '"><label class="gh-ck"><input type="checkbox" data-done' + (ghCan(1) ? '' : ' disabled') + '><i></i></label><div class="gh-tx"><b>' + esc(t.title) + '</b><small>' + (t.contact ? '<button type="button" class="gh-lk" data-ct>' + esc(t.contact) + '</button> · ' : '') + (t.due ? '<span' + (g[0] === 'late' ? ' class="late"' : '') + '>' + esc(whenT(t.due)) + '</span>' : 'No due date') + '</small></div></div>').join('') + '</div>'; }).join('');
    L.querySelectorAll('.gh-tr').forEach(row => {
      const t = T.find(x => x.id === row.dataset.t);
      const ct = row.querySelector('[data-ct]'); if (ct) ct.addEventListener('click', () => ghlContact(t.contactId, t.contact));
      row.querySelector('[data-done]').addEventListener('change', async e => {
        row.classList.add('going');
        try{ await ghlDo('task.done', {id: t.contactId, taskId: t.id, done: true}, 'Done: ' + t.title); }
        catch(err){ row.classList.remove('going'); e.target.checked = false; toast(err.message); return; }
        setTimeout(() => { T = T.filter(x => x !== t); render(); }, 380);
      });
    });
  };
  const load = async quiet => {
    try{ T = (await ghl('tasks.all')).tasks || []; if (h.isConnected) keepScroll(h, '.gh-tl', render); }
    catch(e){ if (!quiet) L.innerHTML = ghlErr(e); }
  };
  h.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { st.f = b.dataset.v; h.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); render(); }));
  load(); ghlWire(h, load);
}

/* ----- Appointments: today's bookings on every calendar ----- */
const ghApSt = {confirmed: ['Confirmed', '#0f9d6b'], new: ['New', '#1d7cf2'], showed: ['Showed', '#0891b2'], noshow: ['No-show', '#e0413a'], cancelled: ['Cancelled', '#8a93a3'], invalid: ['Invalid', '#8a93a3']};
function drawGhlAppts(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {d: 'today'};
  h.innerHTML = '<div class="gh-top">' + ghLive + '<div class="seg" data-f>' + [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'Next 7 days']].map(x => '<button type="button" data-v="' + x[0] + '"' + (st.d === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>').join('') + '</div></div><div class="gh-al" data-l>' + crmLoading(4) + '</div>';
  const L = h.querySelector('[data-l]');
  let A = null, seq = 0;
  const span = () => { const d = new Date(); d.setHours(0, 0, 0, 0); const s = d.getTime() + (st.d === 'tomorrow' ? day : 0); return {from: s, to: s + (st.d === 'week' ? 7 : 1) * day}; };
  const render = () => {
    const list = (A || []).filter(a => a.status !== 'cancelled' || st.d === 'today');
    if (!list.length){ L.innerHTML = '<div class="gh-done">' + ic('cal', 22) + '<b>No appointments ' + (st.d === 'today' ? 'today' : st.d === 'tomorrow' ? 'tomorrow' : 'in the next 7 days') + '</b><small>Bookings from every Easyleads calendar show here.</small></div>'; return; }
    let lastDay = '';
    L.innerHTML = list.map(a => {
      const s = new Date(a.start), dk = s.toDateString(), stt = ghApSt[a.status] || ghApSt.confirmed, past = s.getTime() < Date.now(), dead = a.status === 'cancelled';
      const head = st.d === 'week' && dk !== lastDay ? '<div class="gh-ad">' + s.toLocaleDateString('en-CA', {weekday: 'long', month: 'short', day: 'numeric'}) + '</div>' : ''; lastDay = dk;
      const can = ghCan(2) && !dead;
      return head + '<div class="gh-ap' + (dead ? ' dead' : '') + '" data-a="' + esc(a.id) + '"><div class="gh-at"><b>' + s.toLocaleTimeString('en-CA', {hour: 'numeric', minute: '2-digit'}) + '</b>' + (a.end ? '<small>' + Math.max(5, Math.round((new Date(a.end) - s) / 6e4)) + ' min</small>' : '') + '</div>' +
        '<div class="gh-ai"><b>' + esc(a.contact || a.title) + '</b><small>' + esc([a.contact && a.title !== a.contact ? a.title : '', a.calendar].filter(Boolean).join(' · ')) + '</small><span class="cr-st" style="--c:' + stt[1] + '"><i></i>' + stt[0] + '</span></div>' +
        (can ? '<div class="gh-aa">' + (a.status !== 'confirmed' && !past ? '<button class="cr-ib" type="button" data-s="confirmed">' + ic('check', 12) + 'Confirm</button>' : '') +
          (past && a.status !== 'showed' ? '<button class="cr-ib" type="button" data-s="showed">Showed</button>' : '') +
          (a.status !== 'noshow' ? '<button class="cr-ib" type="button" data-s="noshow">No-show</button>' : '') +
          '<button class="cr-ib" type="button" data-mv>Move</button><button class="cr-ib bad" type="button" data-s="cancelled">Cancel</button></div>' : (a.contactId ? '<div class="gh-aa"><button class="cr-ib" type="button" data-open>Open</button></div>' : '')) + '</div>';
    }).join('');
    L.querySelectorAll('.gh-ap').forEach(row => {
      const a = A.find(x => x.id === row.dataset.a);
      row.querySelector('.gh-ai b').addEventListener('click', () => { if (a.contactId) ghlContact(a.contactId, a.contact); });
      const op = row.querySelector('[data-open]'); if (op) op.addEventListener('click', () => ghlContact(a.contactId, a.contact));
      row.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', async () => {
        const s = b.dataset.s; if (s === 'cancelled' && !confirm('Cancel ' + (a.contact || 'this') + '’s appointment in Easyleads?')) return;
        const was = a.status; a.status = s; render();
        try{ await ghlDo('appt.status', {eventId: a.id, status: s}, (ghApSt[s] || [s])[0] + ': ' + (a.contact || a.title)); }
        catch(e){ a.status = was; render(); toast(e.message); }
      }));
      const mv = row.querySelector('[data-mv]'); if (mv) mv.addEventListener('click', () => ghlMoveAppt(a));
    });
  };
  const load = async quiet => {
    const my = ++seq;
    try{ const j = await ghl('appts.range', span()); if (my !== seq || !h.isConnected) return; A = j.appts || []; keepScroll(h, '.gh-al', render); }
    catch(e){ if (!quiet && my === seq) L.innerHTML = ghlErr(e); }
  };
  h.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { st.d = b.dataset.v; h.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); A = null; L.innerHTML = crmLoading(3); load(); }));
  load(); ghlWire(h, load);
}
/* Pick a new time for an appointment on its own calendar. */
function ghlMoveAppt(a){
  const m = document.createElement('div'); m.className = 'modal-back';
  m.innerHTML = '<div class="modal gh-modal" role="dialog" aria-modal="true"><div class="gh-mh"><div><h2>Move ' + esc(a.contact || 'the appointment') + '</h2>' + ghLive + '</div><button class="iconbtn" type="button" data-x aria-label="Close">' + ic('x') + '</button></div>' +
    '<p class="gh-sub">Now ' + esc(new Date(a.start).toLocaleString('en-CA', {weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})) + ' · ' + esc(a.calendar || '') + '</p><div class="gh-cal"><div class="gh-days" data-days>' + crmLoading(1) + '</div><div class="gh-slots" data-slots></div></div></div>';
  document.body.appendChild(m);
  const close = () => m.remove();
  m.addEventListener('click', e => { if (e.target === m) close(); });
  m.querySelector('[data-x]').addEventListener('click', close);
  const days = m.querySelector('[data-days]'), sl = m.querySelector('[data-slots]');
  let slots = {}, dsel = '';
  const showDays = () => { const ks = Object.keys(slots).sort(); days.innerHTML = ks.length ? ks.slice(0, 10).map(k => { const dt = new Date(k + 'T12:00:00'); return '<button type="button" data-day="' + k + '"' + (k === dsel ? ' class="on"' : '') + '><small>' + dt.toLocaleDateString('en-CA', {weekday: 'short'}) + '</small><b>' + dt.getDate() + '</b><small>' + dt.toLocaleDateString('en-CA', {month: 'short'}) + '</small></button>'; }).join('') : '<div class="cr-empty">No free times in the next two weeks.</div>';
    days.querySelectorAll('[data-day]').forEach(x => x.addEventListener('click', () => { dsel = x.dataset.day; showDays(); showSlots(); })); };
  const showSlots = () => { const L = slots[dsel] || []; sl.innerHTML = L.map(s => '<button type="button" data-t="' + esc(s) + '">' + new Date(s).toLocaleTimeString('en-CA', {hour: 'numeric', minute: '2-digit'}) + '</button>').join('');
    sl.querySelectorAll('[data-t]').forEach(x => x.addEventListener('click', async () => { x.disabled = true; x.classList.add('on');
      const w2 = new Date(x.dataset.t).toLocaleString('en-CA', {weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
      try{ await ghlDo('appt.move', {eventId: a.id, start: x.dataset.t}, 'Moved ' + (a.contact || 'the appointment') + ' to ' + w2); close(); }
      catch(e){ toast(e.message); x.disabled = false; x.classList.remove('on'); } })); };
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Winnipeg', now = Date.now();
  ghl('slots', {calendarId: a.calendarId, from: now, to: now + 14 * day, tz}).then(j => { slots = j.slots || {}; dsel = Object.keys(slots).sort()[0] || ''; showDays(); showSlots(); }, e => { days.innerHTML = ghlErr(e); });
}

/* ----- Conversations: latest texts and emails, who is waiting for a reply, answer right here ----- */
function drawGhlConvs(h, D, it){
  const st = S.ui[it.id] = S.ui[it.id] || {f: 'all', q: '', open: ''};
  h.innerHTML = '<div class="gh-top">' + ghLive + '<div class="seg" data-f>' + [['all', 'All'], ['wait', 'Waiting for a reply'], ['unread', 'Unread']].map(x => '<button type="button" data-v="' + x[0] + '"' + (st.f === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>').join('') + '</div><label class="search gh-q">' + ic('search', 16) + '<input type="search" data-q placeholder="Find a conversation…" value="' + esc(st.q) + '"></label></div>' +
    '<div class="gh-cv"><div class="gh-cl" data-l>' + crmLoading(5) + '</div><div class="gh-th2" data-t><div class="gh-done">' + ic('inbox', 22) + '<b>Pick a conversation</b><small>Texts and emails with your contacts, newest first.</small></div></div></div>';
  const L = h.querySelector('[data-l]'), TH = h.querySelector('[data-t]');
  let C = null, t = 0, seq = 0, tseq = 0;
  const tIc = x => /EMAIL/i.test(x) ? 'mail' : /CALL|PHONE/i.test(x) ? 'phone' : 'send';
  const render = () => {
    if (!C) return;
    const list = C.filter(c => st.f === 'all' || (st.f === 'wait' ? c.dir === 'inbound' : c.unread > 0));
    const nW = C.filter(c => c.dir === 'inbound').length, wb = h.querySelector('[data-v="wait"]'); if (wb) wb.innerHTML = 'Waiting for a reply' + (nW ? ' <b class="gh-n">' + nW + '</b>' : '');
    L.innerHTML = list.length ? list.map(c => '<button type="button" class="gh-ci' + (c.id === st.open ? ' on' : '') + (c.unread ? ' unread' : '') + '" data-c="' + esc(c.id) + '"><span class="cc-av" style="background:' + hue(c.name) + '">' + esc(initials(c.name)) + '</span><span class="gh-cm"><span class="gh-cn"><b>' + esc(c.name) + '</b><small>' + (c.at ? esc(ago(new Date(c.at).getTime())) : '') + '</small></span><span class="gh-cs">' + ic(tIc(c.type), 12) + (c.dir === 'outbound' ? '<em>You:</em> ' : '') + esc(c.last || '(no text)') + '</span>' + (c.dir === 'inbound' ? '<span class="gh-wait">Waiting for a reply</span>' : '') + '</span></button>').join('')
      : '<div class="empty">' + (st.f === 'wait' ? 'Nobody is waiting for a reply.' : st.f === 'unread' ? 'Nothing unread.' : 'No conversations yet.') + '</div>';
    L.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { st.open = b.dataset.c; L.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); thread(); }));
  };
  const thread = async quiet => {
    const c = (C || []).find(x => x.id === st.open); if (!c) return;
    const my = ++tseq;
    if (!quiet) TH.innerHTML = '<div class="gh-tt"><span class="cc-av" style="background:' + hue(c.name) + '">' + esc(initials(c.name)) + '</span><div><b>' + esc(c.name) + '</b><small>' + esc([c.phone, c.email].filter(Boolean).join(' · ')) + '</small></div></div>' + crmLoading(3);
    try{
      const ms = (await ghl('conv', {id: c.id})).messages || []; if (my !== tseq || !TH.isConnected) return;
      const lastT = (ms.filter(m => /SMS|EMAIL/i.test(m.type)).slice(-1)[0] || {}).type || (c.email && !c.phone ? 'EMAIL' : 'SMS');
      const can = ghCan(3);
      TH.innerHTML = '<div class="gh-tt"><span class="cc-av" style="background:' + hue(c.name) + '">' + esc(initials(c.name)) + '</span><div><b>' + esc(c.name) + '</b><small>' + esc([c.phone, c.email].filter(Boolean).join(' · ')) + '</small></div>' + (c.contactId ? '<button class="cr-ib" type="button" data-ct>' + ic('users', 12) + 'Contact card</button>' : '') + '</div>' +
        '<div class="gh-ms" data-ms>' + (ms.length ? ms.map(m => '<div class="gh-m ' + (m.dir === 'outbound' ? 'out' : 'in') + '"><div class="gh-mb">' + (/CALL|PHONE/i.test(m.type) ? ic('phone', 12) + ' Call' : esc(m.body || '(no text)')) + '</div><small>' + ic(tIc(m.type), 10) + (m.at ? esc(new Date(m.at).toLocaleString('en-CA', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})) : '') + '</small></div>').join('') : '<div class="cr-empty">No messages yet.</div>') + '</div>' +
        (can ? '<div class="gh-rp"><div class="seg gh-mt">' + [['SMS', 'Text'], ['Email', 'Email']].map(x => '<button type="button" data-mt="' + x[0] + '"' + ((/EMAIL/i.test(lastT) ? 'Email' : 'SMS') === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>').join('') + '</div><input class="gh-subj" data-subj placeholder="Subject"' + (/EMAIL/i.test(lastT) ? '' : ' hidden') + '><div class="cr-comp"><textarea data-mx rows="2" placeholder="Write a reply to ' + esc(c.name) + '…"></textarea><button class="btn go sm" type="button" data-go>' + ic('send', 13) + 'Send</button></div><div class="gh-note">' + ic('lock', 12) + 'Sent from Easyleads. A sent message can’t be undone.</div></div>'
          : '<div class="gh-note gh-ro">' + ic('lock', 12) + 'Replying needs Full access. Your Easyleads team can turn it on.</div>');
      const box = TH.querySelector('[data-ms]'); box.scrollTop = box.scrollHeight;
      const ct = TH.querySelector('[data-ct]'); if (ct) ct.addEventListener('click', () => ghlContact(c.contactId, c.name));
      if (!can) return;
      let type = /EMAIL/i.test(lastT) ? 'Email' : 'SMS';
      TH.querySelectorAll('[data-mt]').forEach(x => x.addEventListener('click', () => { type = x.dataset.mt; TH.querySelectorAll('[data-mt]').forEach(y => y.classList.toggle('on', y === x)); TH.querySelector('[data-subj]').hidden = type !== 'Email'; }));
      TH.querySelector('[data-go]').addEventListener('click', async e => {
        const ta = TH.querySelector('[data-mx]'), msg = ta.value.trim(); if (!msg) return ta.focus();
        if (type === 'SMS' && !c.phone) return toast(c.name + ' has no phone number in Easyleads.');
        if (type === 'Email' && !c.email) return toast(c.name + ' has no email address in Easyleads.');
        const btn = e.currentTarget; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Sending…';
        try{ await ghlDo('message', {contactId: c.contactId, type, message: msg, subject: TH.querySelector('[data-subj]').value}, (type === 'Email' ? 'Email' : 'Text') + ' sent to ' + c.name); c.dir = 'outbound'; c.last = msg; c.unread = 0; render(); }
        catch(err){ toast(err.message); btn.disabled = false; btn.innerHTML = ic('send', 13) + 'Send'; }
      });
    }catch(e){ if (my === tseq) TH.innerHTML = ghlErr(e); }
  };
  const load = async quiet => {
    const my = ++seq;
    try{ const r = (await ghl('convs', {q: st.q})).convs || []; if (my !== seq || !h.isConnected) return; C = r; keepScroll(h, '.gh-cl', render); if (st.open && quiet) thread(true); else if (st.open) thread(); }
    catch(e){ if (!quiet && my === seq) L.innerHTML = ghlErr(e); }
  };
  h.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { st.f = b.dataset.v; h.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); render(); }));
  h.querySelector('[data-q]').addEventListener('input', e => { st.q = e.target.value.trim(); clearTimeout(t); t = setTimeout(load, 350); });
  load(); ghlWire(h, load);
}

/* ----- Campaigns: draft a text or email campaign, pick who gets it by tags, preview it, send it ----- */
const GH_TPL = {
  SMS: [['Special offer', 'Hi {{first_name}}, it’s {{business}}. This month only we have a special offer for our clients. Reply YES and we’ll save you a spot!'],
    ['Check-in', 'Hi {{first_name}}, just checking in from {{business}}. Is there anything we can help you with this month?'],
    ['Review request', 'Hi {{first_name}}, thank you for choosing {{business}}! Would you mind leaving us a quick review? It means a lot to our team.']],
  Email: [['Special offer', 'A special offer for you', 'Hi {{first_name}},\n\nThis month only, {{business}} has a special offer for our clients.\n\nJust reply to this email and we’ll get you booked in.\n\nTalk soon,\nThe {{business}} team'],
    ['Newsletter', 'What’s new at {{business}}', 'Hi {{first_name}},\n\nHere’s a quick update from all of us at {{business}}.\n\n• \n• \n• \n\nAs always, just reply if there’s anything we can help with.\n\nThe {{business}} team'],
    ['We miss you', 'It’s been a while, {{first_name}}', 'Hi {{first_name}},\n\nIt’s been a little while since we last saw you at {{business}}, and we’d love to help again.\n\nReply to this email or give us a call to book a time that suits you.\n\nThe {{business}} team']]
};
const ghCampSt = {draft: ['Draft', '#8a93a3'], sending: ['Sending paused', '#d9820b'], sent: ['Sent', '#0f9d6b']};
function drawGhlCamp(h, D, it){
  h.innerHTML = '<div class="gh-top">' + ghLive + '<div class="grow"></div><button class="btn go sm" type="button" data-new>' + ic('plus', 14) + 'New campaign</button></div><div class="gh-cg" data-l>' + crmLoading(3) + '</div>';
  const L = h.querySelector('[data-l]');
  const load = async quiet => {
    try{
      const ks = (await ghl('camp.list')).camps || []; if (!h.isConnected) return;
      L.innerHTML = ks.length ? ks.map(k => { const s = ghCampSt[k.status] || ghCampSt.draft;
        return '<button type="button" class="gh-kc" data-k="' + esc(k.id) + '"><div class="gh-kh"><span class="gh-kch ' + (k.channel === 'Email' ? 'em' : '') + '">' + ic(k.channel === 'Email' ? 'mail' : 'send', 13) + (k.channel === 'Email' ? 'Email' : 'Text') + '</span><span class="cr-st" style="--c:' + s[1] + '"><i></i>' + s[0] + '</span></div><b>' + esc(k.name) + '</b><p>' + (esc(String(k.channel === 'Email' && k.subject ? k.subject : k.body || '').slice(0, 110)).replace(/\{\{\s*(first_name|last_name|name|business)\s*\}\}/gi, (x, t) => '<i class="gh-tok">' + ({first_name: 'First name', last_name: 'Last name', name: 'Name', business: 'Business'})[t.toLowerCase()] + '</i>') || 'No message yet') + '</p><small>' + (k.tags && k.tags.length ? ic('spark', 11) + esc(k.tags.join(k.mode === 'all' ? ' + ' : ', ')) : ic('users', 11) + 'Everyone') + (k.sent ? ' · ' + fmt(k.sent) + ' sent' + (k.failed ? ', ' + fmt(k.failed) + ' failed' : '') : '') + '</small><small class="gh-kby">' + esc(k.by || '') + (k.updated ? ' · ' + esc(ago(k.updated)) : '') + '</small></button>'; }).join('')
        : '<div class="gh-done gh-wide">' + ic('send', 22) + '<b>No campaigns yet</b><small>Write a text or email once, pick who gets it by tags, preview it and send it, all through Easyleads.</small></div>';
      L.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => ghlCampEdit(ks.find(k => k.id === b.dataset.k), load)));
    }catch(e){ if (!quiet) L.innerHTML = ghlErr(e); }
  };
  h.querySelector('[data-new]').addEventListener('click', () => ghlCampEdit(null, load));
  load(); ghlWire(h, load);
}
function ghlCampEdit(k0, onDone){
  const k = Object.assign({name: '', channel: 'SMS', subject: '', body: '', tags: [], mode: 'any', status: 'draft', sent: 0}, k0 || {});
  const sent = k.status === 'sent', canSend = ghCan(3);
  const m = document.createElement('div'); m.className = 'modal-back gh-kb';
  m.innerHTML = '<div class="modal gh-km" role="dialog" aria-modal="true"><div class="gh-mh"><div><h2>' + (k0 ? esc(k.name || 'Campaign') : 'New campaign') + '</h2>' + ghLive + '</div><button class="iconbtn" type="button" data-x aria-label="Close">' + ic('x') + '</button></div>' +
    '<div class="gh-kw"><div class="gh-kf">' +
      '<label class="gh-fl"><span>Campaign name</span><input data-n maxlength="80" placeholder="e.g. November check-in" value="' + esc(k.name) + '"></label>' +
      '<div class="gh-fl"><span>Send as</span><div class="seg gh-ch" data-ch>' + [['SMS', 'send', 'Text message'], ['Email', 'mail', 'Email']].map(x => '<button type="button" data-v="' + x[0] + '"' + (k.channel === x[0] ? ' class="on"' : '') + '>' + ic(x[1], 14) + x[2] + '</button>').join('') + '</div></div>' +
      '<div class="gh-fl"><span>Who gets it</span><div class="gh-aud" data-aud>' + crmLoading(1) + '</div></div>' +
      '<div class="gh-fl"><span>Start from</span><div class="gh-tpl" data-tpl></div></div>' +
      '<label class="gh-fl" data-subjw><span>Subject line</span><input data-s maxlength="200" placeholder="What the email is about" value="' + esc(k.subject) + '"></label>' +
      '<label class="gh-fl"><span>Message</span><textarea data-b rows="7" placeholder="Write your message…">' + esc(k.body) + '</textarea></label>' +
      '<div class="gh-mf2"><div class="gh-merge">Insert: ' + [['first_name', 'First name'], ['last_name', 'Last name'], ['business', 'Business name']].map(x => '<button type="button" data-mg="' + x[0] + '">' + x[1] + '</button>').join('') + '</div><small data-cnt></small></div>' +
    '</div><div class="gh-kp"><div class="gh-pvh"><span>Preview</span><span class="gh-pvn"><button type="button" class="iconbtn sm" data-pv="-1" aria-label="Previous person">' + ic('chevl', 14) + '</button><small data-pvw>—</small><button type="button" class="iconbtn sm" data-pv="1" aria-label="Next person">' + ic('chev', 14) + '</button></span></div><div data-pvb></div></div></div>' +
    '<div class="gh-kft" data-ft></div></div>';
  document.body.appendChild(m);
  const $ = s => m.querySelector(s);
  let people = null, pv = 0, dirty = false, busy = false;
  const close = () => { if (busy) return toast('Sending… pause it first.'); if (dirty && !confirm('Close without saving your changes?')) return; m.remove(); onDone && onDone(true); };
  m.addEventListener('click', e => { if (e.target === m) close(); });
  $('[data-x]').addEventListener('click', close);
  const biz = (S.me.clients.find(x => x.domain === S.domain) || {}).name || 'our team';
  const fill = (s, x) => String(s || '').replace(/\{\{\s*first_name\s*\}\}/gi, x.f || 'there').replace(/\{\{\s*last_name\s*\}\}/gi, x.l || '').replace(/\{\{\s*name\s*\}\}/gi, x.n || x.f || 'there').replace(/\{\{\s*business\s*\}\}/gi, biz);
  const reach = x => !x.dnd && (k.channel === 'Email' ? !!x.e : !!x.ph);
  const inAud = x => !k.tags.length || (k.mode === 'all' ? k.tags.every(t => (x.t || []).map(s => s.toLowerCase()).indexOf(t.toLowerCase()) > -1) : k.tags.some(t => (x.t || []).map(s => s.toLowerCase()).indexOf(t.toLowerCase()) > -1));
  const aud = () => (people || []).filter(inAud), rec = () => aud().filter(reach);
  /* Text messages: 160 characters per part (70 with emoji or accents). */
  const segs = s => { const uni = /[^\x00-\x7F€£¥èéùìòÇØøÅåÆæßÉÄÖÑÜ§¿äöñüà]/.test(s), n = s.length, per = uni ? (n > 70 ? 67 : 70) : (n > 160 ? 153 : 160); return {n, parts: n ? Math.ceil(n / per) : 0, uni}; };
  const paintAud = () => {
    const A = $('[data-aud]');
    if (!people){ A.innerHTML = crmLoading(1); return; }
    const cnt = {}; people.forEach(x => (x.t || []).forEach(t => { const kk = t.toLowerCase(); cnt[kk] = cnt[kk] || [t, 0]; cnt[kk][1]++; }));
    const tags = Object.keys(cnt).map(x => cnt[x]).sort((a, b) => b[1] - a[1]);
    const a = aud(), r = a.filter(reach), skip = a.length - r.length;
    A.innerHTML = '<div class="gh-tagpick"><button type="button" class="gh-tp' + (k.tags.length ? '' : ' on') + '" data-all>' + ic('users', 12) + 'Everyone <b>' + fmt(people.length) + '</b></button>' + tags.slice(0, 40).map(t => '<button type="button" class="gh-tp' + (k.tags.map(s => s.toLowerCase()).indexOf(t[0].toLowerCase()) > -1 ? ' on' : '') + '" data-tg="' + esc(t[0]) + '">' + esc(t[0]) + ' <b>' + fmt(t[1]) + '</b></button>').join('') + '</div>' +
      (k.tags.length > 1 ? '<div class="gh-mode">People with <button type="button" data-mode="any"' + (k.mode === 'any' ? ' class="on"' : '') + '>any</button> / <button type="button" data-mode="all"' + (k.mode === 'all' ? ' class="on"' : '') + '>all</button> of these tags</div>' : '') +
      '<div class="gh-reach"><b>' + fmt(r.length) + '</b> ' + (r.length === 1 ? 'person' : 'people') + ' will get this' + (skip ? '<small>' + fmt(skip) + ' left out: no ' + (k.channel === 'Email' ? 'email address' : 'phone number') + ' or Do Not Disturb is on</small>' : '') + '</div>';
    A.querySelector('[data-all]').addEventListener('click', () => { k.tags = []; dirty = true; pv = 0; paintAud(); paintPv(); paintFt(); });
    A.querySelectorAll('[data-tg]').forEach(b => b.addEventListener('click', () => { const t = b.dataset.tg, i = k.tags.map(s => s.toLowerCase()).indexOf(t.toLowerCase()); if (i > -1) k.tags.splice(i, 1); else k.tags.push(t); dirty = true; pv = 0; paintAud(); paintPv(); paintFt(); }));
    A.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { k.mode = b.dataset.mode; dirty = true; pv = 0; paintAud(); paintPv(); paintFt(); }));
  };
  const paintTpl = () => { $('[data-tpl]').innerHTML = GH_TPL[k.channel].map((t, i) => '<button type="button" data-t="' + i + '">' + esc(t[0]) + '</button>').join('');
    m.querySelectorAll('[data-tpl] [data-t]').forEach(b => b.addEventListener('click', () => { const t = GH_TPL[k.channel][Number(b.dataset.t)];
      if (k.body.trim() && !confirm('Replace your message with the “' + t[0] + '” starter?')) return;
      if (k.channel === 'Email'){ k.subject = t[1]; k.body = t[2]; $('[data-s]').value = k.subject; } else k.body = t[1];
      $('[data-b]').value = k.body; dirty = true; paintPv(); paintCnt(); })); };
  const paintCnt = () => { const c = $('[data-cnt]'); if (k.channel === 'Email'){ c.textContent = fmt(k.body.length) + ' characters'; return; } const s = segs(fill(k.body, {f: 'Alexandra', l: 'Thompson'})); c.innerHTML = fmt(s.n) + ' characters · ' + s.parts + ' text' + (s.parts === 1 ? '' : 's') + ' per person' + (s.uni ? ' <span title="Emoji and some accents make each text shorter">(emoji: 70 per text)</span>' : ''); c.classList.toggle('warn', s.parts > 2); };
  const paintPv = () => {
    const R = rec(), x = R.length ? R[((pv % R.length) + R.length) % R.length] : {f: 'Alexandra', l: 'Thompson', n: 'Alexandra Thompson', e: 'alexandra@example.com', ph: '+1 204 555 0134'};
    $('[data-pvw]').textContent = R.length ? (x.n || x.f || 'Contact') + ' · ' + (((pv % R.length) + R.length) % R.length + 1) + ' of ' + fmt(R.length) : 'Example person';
    const body = fill(k.body, x);
    $('[data-pvb]').innerHTML = k.channel === 'Email'
      ? '<div class="gh-pe"><div class="gh-peh"><small>To</small> ' + esc(x.e || '') + '<br><small>Subject</small> <b>' + esc(fill(k.subject, x) || '(no subject)') + '</b></div><div class="gh-peb">' + (body ? esc(body).replace(/\n/g, '<br>') : '<span class="gh-ph">Your email shows here.</span>') + '</div></div>'
      : '<div class="gh-ps"><div class="gh-psh">' + esc(biz) + '</div><div class="gh-psb">' + (body ? '<div class="gh-bub">' + esc(body).replace(/\n/g, '<br>') + '</div>' : '<span class="gh-ph">Your text shows here.</span>') + '</div><div class="gh-psf">To ' + esc(x.ph || '') + '</div></div>';
  };
  const paintFt = () => {
    const R = rec(), F = $('[data-ft]');
    F.innerHTML = '<div class="gh-ftl">' + (k.id ? '<button class="btn sm ghost bad" type="button" data-del>' + ic('x', 13) + 'Delete</button>' : '') + (sent ? '<button class="btn sm" type="button" data-dup>' + ic('plus', 13) + 'Duplicate</button>' : '') + '</div>' +
      (sent ? '<div class="gh-ftm">' + ic('check', 14) + 'Sent to ' + fmt(k.sent) + (k.failed ? ' · ' + fmt(k.failed) + ' failed' : '') + (k.sentAt ? ' · ' + esc(new Date(k.sentAt).toLocaleString('en-CA', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})) : '') + '</div>'
        : '<button class="btn" type="button" data-save>' + ic('check', 14) + 'Save draft</button>' +
          '<button class="btn" type="button" data-test' + (canSend ? '' : ' disabled title="Sending needs Full access"') + '>' + ic('eye', 14) + 'Send a test</button>' +
          '<button class="btn go" type="button" data-send' + (canSend && R.length ? '' : ' disabled') + (canSend ? '' : ' title="Sending needs Full access. You can still save the draft."') + '>' + ic('send', 14) + (k.status === 'sending' ? 'Resume sending' : 'Send to ' + fmt(R.length) + ' ' + (R.length === 1 ? 'person' : 'people')) + '</button>');
    const q = s => F.querySelector(s);
    if (q('[data-save]')) q('[data-save]').addEventListener('click', () => save(true));
    if (q('[data-del]')) q('[data-del]').addEventListener('click', async () => { if (!confirm('Delete “' + (k.name || 'this campaign') + '”?' + (sent ? '' : ' The draft can’t be brought back.'))) return; try{ await ghl('camp.delete', {id: k.id}); dirty = false; toast('Campaign deleted'); m.remove(); onDone && onDone(); }catch(e){ toast(e.message); } });
    if (q('[data-dup]')) q('[data-dup]').addEventListener('click', () => { m.remove(); ghlCampEdit({name: k.name + ' (copy)', channel: k.channel, subject: k.subject, body: k.body, tags: k.tags.slice(), mode: k.mode}, onDone); });
    if (q('[data-test]')) q('[data-test]').addEventListener('click', testSend);
    if (q('[data-send]')) q('[data-send]').addEventListener('click', sendAll);
  };
  const lock = () => { if (!sent && ghCan(2)) return; m.querySelectorAll('.gh-kf input,.gh-kf textarea,.gh-kf button').forEach(x => { x.disabled = true; }); };
  const save = async loud => {
    if (!ghCan(2)) { toast('Drafting campaigns needs Sales access.'); return false; }
    k.name = $('[data-n]').value.trim() || (k.channel === 'Email' ? (k.subject || 'Email campaign') : 'Text campaign') ;
    try{ const j = await ghl('camp.save', {id: k.id, name: k.name, channel: k.channel, subject: k.subject, body: k.body, tags: k.tags, mode: k.mode}); Object.assign(k, j.camp); dirty = false; m.querySelector('.gh-mh h2').textContent = k.name; if (loud) toast('Draft saved'); paintFt(); return true; }
    catch(e){ toast(e.message); return false; }
  };
  const check = () => { if (!k.body.trim()) { toast('Write the message first.'); $('[data-b]').focus(); return false; } if (k.channel === 'Email' && !k.subject.trim()) { toast('Add a subject line.'); $('[data-s]').focus(); return false; } return true; };
  /* A test: one copy to a contact you pick (yourself, ideally: add yourself as a contact in Easyleads). */
  const testSend = () => {
    if (!check()) return;
    const F = $('[data-ft]'), em = k.channel === 'Email';
    F.innerHTML = '<div class="gh-tst"><label class="search">' + ic('search', 15) + '<input data-tq placeholder="Send one test ' + (em ? 'email' : 'text') + ' to… (type a name, ' + (em ? 'email' : 'phone') + ')"></label><div class="gh-tsl" data-tl></div></div><button class="btn" type="button" data-tc>Cancel</button>';
    const inp = F.querySelector('[data-tq]'), TL = F.querySelector('[data-tl]');
    const pool = (people || []).filter(x => !x.dnd && (em ? x.e : x.ph));
    const show = () => { const w = inp.value.trim().toLowerCase(), hit = pool.filter(x => !w || ((x.n || '') + ' ' + (x.e || '') + ' ' + (x.ph || '')).toLowerCase().indexOf(w) > -1).slice(0, 5);
      TL.innerHTML = hit.length ? hit.map((x, i) => '<button type="button" data-i="' + i + '"><b>' + esc(x.n) + '</b><small>' + esc(em ? x.e : x.ph) + '</small></button>').join('') : '<small class="gh-ph">No reachable contact matches.</small>';
      TL.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', async () => { const x = hit[Number(b.dataset.i)];
        b.disabled = true; b.innerHTML = '<span class="spin"></span>Sending…';
        if (dirty || !k.id){ if (!(await save())) return paintFt(); }
        try{ const j = await ghl('camp.send', {id: k.id, to: [{id: x.id, f: x.f, l: x.l, n: x.n}], test: true}); toast(j.fails && j.fails.length ? 'Test didn’t go: ' + j.fails[0].err : 'Test sent to ' + x.n); }catch(e){ toast(e.message); }
        paintFt(); })); };
    inp.addEventListener('input', show); F.querySelector('[data-tc]').addEventListener('click', paintFt);
    show(); inp.focus();
  };
  /* Send to everyone, 20 at a time, with a progress bar and a pause button. */
  const sendAll = async () => {
    if (!check()) return;
    const R = rec(); if (!R.length) return;
    if (!confirm('Send “' + (k.name || 'this campaign') + '” as ' + (k.channel === 'Email' ? 'an email' : 'a text') + ' to ' + fmt(R.length) + ' ' + (R.length === 1 ? 'person' : 'people') + ' now?\n\nMessages go out from Easyleads right away and can’t be unsent.')) return;
    if (dirty || !k.id){ if (!(await save())) return; }
    busy = true; let stop = false, done = 0, failed = [], skipped = 0;
    m.querySelectorAll('.gh-kf input,.gh-kf textarea,.gh-kf button').forEach(x => { x.disabled = true; });
    const F = $('[data-ft]');
    F.innerHTML = '<div class="gh-prog"><div class="gh-pb"><span data-pb></span></div><small data-pt>Starting…</small></div><button class="btn" type="button" data-stop>Pause</button>';
    F.querySelector('[data-stop]').addEventListener('click', e => { stop = true; e.currentTarget.disabled = true; e.currentTarget.textContent = 'Pausing…'; });
    const bar = F.querySelector('[data-pb]'), txt = F.querySelector('[data-pt]');
    for (let i = 0; i < R.length && !stop; i += 20){
      const part = R.slice(i, i + 20).map(x => ({id: x.id, f: x.f, l: x.l, n: x.n}));
      try{ const j = await ghl('camp.send', {id: k.id, to: part, last: i + 20 >= R.length}); done += j.sent; skipped += j.skipped || 0; failed = failed.concat(j.fails || []); Object.assign(k, j.camp); }
      catch(e){ toast(e.message); stop = true; }
      const n = Math.min(R.length, i + 20); bar.style.width = Math.round(n / R.length * 100) + '%'; txt.textContent = fmt(done + skipped) + ' of ' + fmt(R.length) + ' sent' + (failed.length ? ' · ' + fmt(failed.length) + ' failed' : '');
      if (i + 20 < R.length && !stop) await new Promise(r => setTimeout(r, 1200));
    }
    busy = false;
    toast(stop ? 'Paused after ' + fmt(done + skipped) + ' of ' + fmt(R.length) + '. Open it to resume.' : 'Campaign sent to ' + fmt(done + skipped) + ' ' + (done + skipped === 1 ? 'person' : 'people') + (failed.length ? ' · ' + fmt(failed.length) + ' failed' : ''));
    if (failed.length) txt.innerHTML = esc(txt.textContent) + '<br><span class="gh-fails">Didn’t go: ' + failed.slice(0, 5).map(f => esc(f.n || f.id) + ' (' + esc(f.err) + ')').join(', ') + (failed.length > 5 ? '…' : '') + '</span>';
    F.insertAdjacentHTML('beforeend', '<button class="btn go" type="button" data-fin>Done</button>');
    F.querySelector('[data-stop]').remove();
    F.querySelector('[data-fin]').addEventListener('click', () => { m.remove(); onDone && onDone(); });
  };
  /* wiring */
  m.querySelectorAll('[data-ch] [data-v]').forEach(b => b.addEventListener('click', () => { if (sent) return; k.channel = b.dataset.v; dirty = true; pv = 0; m.querySelectorAll('[data-ch] [data-v]').forEach(x => x.classList.toggle('on', x === b)); $('[data-subjw]').hidden = k.channel !== 'Email'; paintTpl(); paintAud(); paintPv(); paintCnt(); paintFt(); }));
  $('[data-n]').addEventListener('input', () => { dirty = true; });
  $('[data-s]').addEventListener('input', e => { k.subject = e.target.value; dirty = true; paintPv(); });
  $('[data-b]').addEventListener('input', e => { k.body = e.target.value; dirty = true; paintPv(); paintCnt(); });
  m.querySelectorAll('[data-mg]').forEach(b => b.addEventListener('click', () => { const ta = $('[data-b]'), tok = '{{' + b.dataset.mg + '}}', s0 = ta.selectionStart || ta.value.length, s1 = ta.selectionEnd || s0;
    ta.value = ta.value.slice(0, s0) + tok + ta.value.slice(s1); ta.focus(); ta.selectionStart = ta.selectionEnd = s0 + tok.length; k.body = ta.value; dirty = true; paintPv(); paintCnt(); }));
  m.querySelectorAll('[data-pv]').forEach(b => b.addEventListener('click', () => { pv += Number(b.dataset.pv); paintPv(); }));
  $('[data-subjw]').hidden = k.channel !== 'Email';
  paintTpl(); paintAud(); paintPv(); paintCnt(); paintFt(); lock();
  ghl('camp.people').then(j => { people = j.people || []; if (!m.isConnected) return; paintAud(); paintPv(); paintFt(); lock(); if (j.capped) toast('Showing the first 2,000 contacts.'); }, e => { $('[data-aud]').innerHTML = ghlErr(e); });
  setTimeout(() => { if (!k0) $('[data-n]').focus(); }, 30);
}

(function(){ if (document.getElementById('gh-css')) return; const st = document.createElement('style'); st.id = 'gh-css';
  st.textContent =
    '.gh-live{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:#0b5fd0;background:linear-gradient(135deg,#eaf3ff,#dcebff);border:1px solid #cfe2ff;border-radius:99px;padding:3px 10px 3px 8px;white-space:nowrap}.gh-live svg{color:#1d7cf2}' +
    '.gh-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}.gh-q{flex:1;min-width:200px}' +
    '.gh-sel{height:38px;border:1px solid var(--line);border-radius:11px;padding:0 34px 0 12px;font:600 13px var(--ui);background:#fff url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272.2%27><path d=%27M6 9l6 6 6-6%27/></svg>") no-repeat right 12px center;appearance:none;-webkit-appearance:none;color:var(--ink);cursor:pointer}' +
    '.gh-board{grid-template-columns:repeat(4,minmax(220px,1fr))}' +
    '.gh-list{display:flex;flex-direction:column;gap:6px;max-height:560px;overflow:auto}' +
    '.gh-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:10px 12px;border:1px solid #eef0f3;border-radius:14px;background:#fff;font:inherit;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}.gh-row:hover{border-color:#cfe2ff;box-shadow:0 8px 20px -14px rgba(29,124,242,.6);transform:translateY(-1px)}.gh-row>svg{color:var(--ink-3)}' +
    '.gh-rt{flex:1;min-width:0;line-height:1.35}.gh-rt b{display:block;font-size:14px}.gh-rt small{display:block;font-size:12px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.gh-tags{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;max-width:40%}.gh-tags i{font-style:normal;font-size:11px;font-weight:600;color:#3b4760;background:#f1f4f9;border-radius:99px;padding:2px 8px}' +
    '.gh-acts{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:4px 0 10px}.gh-acts button{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 4px;border:1px solid var(--line);border-radius:14px;background:#fff;font:600 12px var(--ui);color:var(--ink-2);cursor:pointer;transition:all .18s}.gh-acts button svg{color:#1d7cf2}.gh-acts button:hover{border-color:#bcd6ff;background:#f6faff}.gh-acts button.on{background:linear-gradient(135deg,#2b88f5,#1d7cf2);border-color:#1d7cf2;color:#fff;box-shadow:0 10px 22px -12px rgba(29,124,242,.9)}.gh-acts button.on svg{color:#fff}' +
    '.gh-panel{display:none;margin-bottom:16px;padding:14px;border-radius:16px;background:linear-gradient(180deg,#f6faff,#fff);border:1px solid #e1edff}.gh-panel.open{display:block;animation:crIn .25s ease both}.gh-panel:empty{display:none}.gh-panel .cr-comp{margin-bottom:0}' +
    '.gh-two{grid-template-columns:1fr 1fr!important;margin-bottom:12px}.gh-mf{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}' +
    '.gh-tagbox{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:12px;margin-bottom:16px}.gh-tagbox input{flex:1;min-width:140px;border:0;font:inherit;font-size:13px;padding:4px;outline:none}' +
    '.gh-tag{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#0b5fd0;background:#eaf3ff;border-radius:99px;padding:3px 4px 3px 10px}.gh-tag button{border:0;background:none;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;color:#5b8fd8;cursor:pointer}.gh-tag button:hover{background:#d3e5ff;color:#0b5fd0}' +
    '.gh-items{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}.gh-item{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid #eef0f3;border-radius:12px;background:#fff}.gh-item>div{flex:1;min-width:0;line-height:1.35}.gh-item b{display:block;font-size:13px}.gh-item small{display:block;font-size:11.5px;color:var(--ink-3)}.gh-ia{display:flex;gap:5px;flex:none!important}' +
    '.gh-task{cursor:pointer}.gh-task input{width:18px;height:18px;accent-color:#0f9d6b;flex:none}.gh-task.done b{text-decoration:line-through;color:var(--ink-3)}' +
    '.gh-cal{display:flex;flex-direction:column;gap:10px}.gh-days{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}.gh-days button{flex:none;width:58px;padding:7px 0;border:1px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;line-height:1.2;font:inherit}.gh-days button b{font:700 17px var(--display)}.gh-days button small{font-size:10.5px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.04em}.gh-days button.on{background:#1d7cf2;border-color:#1d7cf2;color:#fff}.gh-days button.on small{color:rgba(255,255,255,.8)}' +
    '.gh-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px}.gh-slots button{height:34px;border:1px solid #cfe2ff;border-radius:10px;background:#fff;color:#0b5fd0;font:600 12.5px var(--ui);cursor:pointer;transition:all .15s}.gh-slots button:hover{background:#eaf3ff}.gh-slots button.on{background:#1d7cf2;color:#fff;border-color:#1d7cf2}' +
    '.gh-mt{margin-bottom:8px}.gh-subj{width:100%;box-sizing:border-box;height:38px;border:1px solid var(--line);border-radius:10px;padding:0 11px;font:inherit;font-size:13.5px;margin-bottom:8px}.gh-note{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--ink-3);margin-top:8px}' +
    '.gh-modal{width:min(560px,100%)}.gh-mh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}.gh-mh h2{margin:0 0 6px}' +
    '.gh-pick{display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto;margin:8px 0 14px}.gh-pick button{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid transparent;border-radius:12px;background:#fafbfc;font:inherit;text-align:left;cursor:pointer}.gh-pick button span:last-child{line-height:1.3}.gh-pick b{display:block;font-size:13.5px}.gh-pick small{display:block;font-size:11.5px;color:var(--ink-3)}.gh-pick button:hover{background:#f1f6ff}.gh-pick button.on{border-color:#1d7cf2;background:#eaf3ff}' +
    '.gh-steps{grid-template-columns:repeat(auto-fit,minmax(110px,1fr))!important}' +
    '.eb-wr{margin-left:8px;gap:6px}.eb-wr.on{background:linear-gradient(135deg,#2b88f5,#1d7cf2);border-color:#1d7cf2;color:#fff}.eb-wr select{border:0;background:transparent;font:inherit;font-weight:700;color:inherit;cursor:pointer;outline:none;padding-right:2px}.eb-wr.on select option{color:#111}' +
    '.gh-ro{background:#f6f7f9;border-radius:10px;padding:8px 10px;margin:0 0 10px}.gh-acts button:disabled{opacity:.45;cursor:not-allowed;background:#fafbfc}.gh-acts button:disabled svg{color:var(--ink-3)}.cr-steps button:disabled{cursor:not-allowed;opacity:.6}' +
    '.gh-kpis{margin-bottom:16px}.gh-stages{display:flex;flex-direction:column;gap:9px}.gh-stg{display:grid;grid-template-columns:minmax(120px,190px) 1fr 44px 92px;align-items:center;gap:12px;font-size:13px}.gh-sn{display:flex;align-items:center;gap:8px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gh-sn i{width:8px;height:8px;border-radius:50%;background:var(--c);flex:none}.gh-bar{height:10px;border-radius:99px;background:#f1f4f9;overflow:hidden}.gh-bar span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--c),color-mix(in srgb,var(--c) 70%,#fff));transition:width .6s cubic-bezier(.2,.8,.2,1)}.gh-stg b{text-align:right;font:700 14px var(--display)}.gh-stg em{font-style:normal;text-align:right;color:var(--ink-3);font-size:12.5px}' +
    '.gh-tl,.gh-al{display:flex;flex-direction:column;gap:4px;overflow:auto;max-height:calc(100% - 52px)}.gh-tg{margin-bottom:8px}.gh-th{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--c);margin:4px 2px 6px}.gh-th b{margin-left:auto;color:var(--ink-3);font-weight:600}' +
    '.gh-tr{display:flex;align-items:center;gap:11px;padding:9px 11px;border:1px solid #eef0f3;border-radius:12px;background:#fff;margin-bottom:5px;transition:opacity .35s,transform .35s}.gh-tr.going{opacity:0;transform:translateX(14px)}.gh-tx{flex:1;min-width:0;line-height:1.35}.gh-tx b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gh-tx small{font-size:12px;color:var(--ink-3)}.gh-tx .late{color:#e0413a;font-weight:600}' +
    '.gh-ck{position:relative;width:20px;height:20px;flex:none;cursor:pointer}.gh-ck input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}.gh-ck i{position:absolute;inset:0;border:2px solid #cbd3df;border-radius:7px;transition:all .15s}.gh-ck:hover i{border-color:#0f9d6b}.gh-ck input:checked+i{background:#0f9d6b;border-color:#0f9d6b}.gh-ck input:checked+i:after{content:"";position:absolute;left:5px;top:1px;width:5px;height:10px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}.gh-ck input:disabled+i{opacity:.4}' +
    '.gh-lk{border:0;background:none;padding:0;font:inherit;color:#0b5fd0;font-weight:600;cursor:pointer}.gh-lk:hover{text-decoration:underline}' +
    '.gh-done{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;padding:30px 12px;color:var(--ink-3)}.gh-done svg{color:#0f9d6b;margin-bottom:4px}.gh-done b{color:var(--ink);font-size:14px}.gh-done small{font-size:12.5px;max-width:340px}.gh-wide{grid-column:1/-1}' +
    '.gh-ad{font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);margin:8px 2px 2px}' +
    '.gh-ap{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid #eef0f3;border-radius:14px;background:#fff;margin-bottom:5px}.gh-ap.dead{opacity:.55}.gh-ap.dead .gh-ai b{text-decoration:line-through}.gh-at{width:66px;flex:none;line-height:1.2}.gh-at b{display:block;font:700 15px var(--display)}.gh-at small{font-size:11px;color:var(--ink-3)}.gh-ai{flex:1;min-width:0;line-height:1.35}.gh-ai b{display:block;font-size:13.5px;cursor:pointer}.gh-ai b:hover{color:#0b5fd0}.gh-ai small{display:block;font-size:12px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gh-ai .cr-st{margin-top:4px}.gh-aa{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;max-width:52%}.cr-ib.bad{color:#c2342e}' +
    '.gh-sub{margin:-2px 0 12px;color:var(--ink-3);font-size:13px}' +
    '.gh-cv{display:grid;grid-template-columns:minmax(260px,36%) 1fr;gap:12px;height:calc(100% - 52px);min-height:420px}.gh-cl{overflow:auto;display:flex;flex-direction:column;gap:4px;padding-right:2px}' +
    '.gh-ci{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;padding:10px;border:1px solid transparent;border-radius:13px;background:#fafbfc;font:inherit;cursor:pointer;transition:background .15s,border-color .15s}.gh-ci:hover{background:#f3f7fd}.gh-ci.on{background:#eaf3ff;border-color:#cfe2ff}.gh-cm{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.gh-cn{display:flex;justify-content:space-between;gap:8px}.gh-cn b{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gh-cn small{font-size:11px;color:var(--ink-3);white-space:nowrap}.gh-ci.unread .gh-cn b:after{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#1d7cf2;margin-left:6px;vertical-align:middle}' +
    '.gh-cs{display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gh-cs svg{flex:none;color:var(--ink-3)}.gh-cs em{font-style:normal;color:var(--ink-3)}.gh-wait{align-self:flex-start;font-size:10.5px;font-weight:700;color:#b45309;background:#fff4e0;border-radius:99px;padding:2px 8px;margin-top:3px}.gh-n{display:inline-grid;place-items:center;min-width:17px;height:17px;padding:0 5px;border-radius:99px;background:#f59e0b;color:#fff;font-size:10.5px;margin-left:4px}' +
    '.gh-th2{display:flex;flex-direction:column;border:1px solid #eef0f3;border-radius:16px;background:#fff;min-height:0;overflow:hidden}.gh-tt{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #f0f2f5}.gh-tt>div{flex:1;min-width:0;line-height:1.3}.gh-tt b{display:block;font-size:14px}.gh-tt small{font-size:12px;color:var(--ink-3)}' +
    '.gh-ms{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:linear-gradient(180deg,#fbfcfe,#fff)}.gh-m{max-width:78%;display:flex;flex-direction:column;gap:3px}.gh-m.in{align-self:flex-start}.gh-m.out{align-self:flex-end;align-items:flex-end}.gh-mb{padding:9px 12px;border-radius:16px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}.gh-m.in .gh-mb{background:#f1f4f9;border-bottom-left-radius:5px}.gh-m.out .gh-mb{background:linear-gradient(135deg,#2b88f5,#1d7cf2);color:#fff;border-bottom-right-radius:5px}.gh-m small{display:flex;align-items:center;gap:4px;font-size:10.5px;color:var(--ink-3)}' +
    '.gh-rp{padding:10px 12px;border-top:1px solid #f0f2f5}.gh-rp .cr-comp{margin:0}.gh-th2>.gh-ro{margin:10px 12px}' +
    '.gh-cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.gh-kc{display:flex;flex-direction:column;gap:6px;text-align:left;padding:14px;border:1px solid #eef0f3;border-radius:16px;background:#fff;font:inherit;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}.gh-kc:hover{border-color:#f5c6dd;box-shadow:0 12px 26px -18px rgba(219,39,119,.55);transform:translateY(-1px)}.gh-kc b{font-size:14.5px}.gh-kc p{margin:0;font-size:12.5px;color:var(--ink-2);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.gh-kc small{display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--ink-3)}.gh-kh{display:flex;justify-content:space-between;align-items:center}.gh-kch{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#0b5fd0;background:#eaf3ff;border-radius:99px;padding:3px 9px}.gh-kch.em{color:#be185d;background:#fdeaf3}.gh-kby{margin-top:auto}' +
    '.gh-kb{align-items:flex-start;padding-top:4vh}.gh-km{width:min(1060px,100%);max-height:92vh;display:flex;flex-direction:column}.gh-kw{display:grid;grid-template-columns:1.25fr 1fr;gap:20px;overflow:auto;min-height:0;padding:2px}.gh-kf{display:flex;flex-direction:column;gap:14px}.gh-fl{display:flex;flex-direction:column;gap:6px}.gh-fl>span{font-size:12px;font-weight:700;color:var(--ink-2)}.gh-fl input,.gh-fl textarea{border:1px solid var(--line);border-radius:12px;padding:10px 12px;font:inherit;font-size:14px;resize:vertical;outline:none;transition:border-color .15s,box-shadow .15s}.gh-fl input:focus,.gh-fl textarea:focus{border-color:#1d7cf2;box-shadow:0 0 0 4px rgba(29,124,242,.12)}.gh-fl textarea{min-height:150px;line-height:1.5}' +
    '.gh-ch{align-self:flex-start}.gh-ch button{display:inline-flex;align-items:center;gap:6px}' +
    '.gh-tagpick{display:flex;flex-wrap:wrap;gap:6px}.gh-tp{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:99px;padding:5px 11px;font:600 12.5px var(--ui);color:var(--ink-2);cursor:pointer;transition:all .15s}.gh-tp b{font-weight:600;color:var(--ink-3);font-size:11.5px}.gh-tp:hover{border-color:#bcd6ff}.gh-tp.on{background:#1d7cf2;border-color:#1d7cf2;color:#fff}.gh-tp.on b{color:rgba(255,255,255,.8)}' +
    '.gh-mode{font-size:12.5px;color:var(--ink-3);margin-top:8px}.gh-mode button{border:0;background:#f1f4f9;border-radius:7px;padding:2px 8px;font:600 12px var(--ui);cursor:pointer;color:var(--ink-2)}.gh-mode button.on{background:#1d7cf2;color:#fff}' +
    '.gh-reach{margin-top:10px;padding:10px 12px;border-radius:12px;background:linear-gradient(135deg,#f0f7ff,#f8fbff);border:1px solid #dcebff;font-size:13px}.gh-reach b{font:700 18px var(--display);color:#0b5fd0;margin-right:2px}.gh-reach small{display:block;color:var(--ink-3);font-size:11.5px;margin-top:2px}' +
    '.gh-tpl{display:flex;gap:6px;flex-wrap:wrap}.gh-tpl button{border:1px dashed #cfd6e2;background:#fafbfc;border-radius:10px;padding:6px 11px;font:600 12.5px var(--ui);color:var(--ink-2);cursor:pointer}.gh-tpl button:hover{border-color:#1d7cf2;color:#0b5fd0;background:#f3f8ff}' +
    '.gh-mf2{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:-6px}.gh-merge{font-size:12px;color:var(--ink-3);display:flex;gap:5px;align-items:center;flex-wrap:wrap}.gh-merge button{border:1px solid #e3e8f0;background:#fff;border-radius:8px;padding:3px 8px;font:600 11.5px var(--ui);color:#0b5fd0;cursor:pointer}.gh-merge button:hover{background:#eaf3ff}.gh-mf2 small{font-size:11.5px;color:var(--ink-3)}.gh-mf2 small.warn{color:#b45309}' +
    '.gh-kp{position:sticky;top:0;align-self:start;background:linear-gradient(180deg,#f5f8fc,#eef3f9);border-radius:18px;padding:14px}.gh-pvh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;font-weight:700;color:var(--ink-2)}.gh-pvn{display:flex;align-items:center;gap:4px}.gh-pvn small{font-weight:500;color:var(--ink-3);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gh-pvn .iconbtn{width:26px;height:26px}' +
    '.gh-ps{width:min(300px,100%);margin:0 auto;background:#fff;border-radius:30px;padding:12px;box-shadow:0 20px 40px -24px rgba(15,23,42,.45),inset 0 0 0 7px #0f172a}.gh-psh{text-align:center;font-size:12px;font-weight:700;padding:14px 0 10px;border-bottom:1px solid #f0f2f5;margin:0 6px}.gh-psb{min-height:250px;padding:14px 10px;display:flex;flex-direction:column}.gh-bub{align-self:flex-start;max-width:88%;background:#e9e9eb;color:#111;padding:9px 12px;border-radius:18px;border-bottom-left-radius:5px;font-size:13.5px;line-height:1.4;word-wrap:break-word}.gh-psf{text-align:center;font-size:10.5px;color:var(--ink-3);padding:4px 0 10px}' +
    '.gh-pe{background:#fff;border-radius:14px;box-shadow:0 14px 30px -22px rgba(15,23,42,.5);overflow:hidden}.gh-peh{padding:12px 14px;border-bottom:1px solid #f0f2f5;font-size:12.5px;line-height:1.7}.gh-peh small{display:inline-block;width:56px;color:var(--ink-3)}.gh-peb{padding:16px 14px;font-size:13.5px;line-height:1.6;min-height:240px;word-wrap:break-word}.gh-ph{color:var(--ink-3);font-style:italic}' +
    '.gh-kft{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding-top:14px;margin-top:14px;border-top:1px solid #f0f2f5;flex-wrap:wrap}.gh-ftl{margin-right:auto;display:flex;gap:6px}.gh-ftm{display:flex;align-items:center;gap:6px;color:#0f7a58;font-weight:600;font-size:13px}.btn.bad{color:#c2342e}' +
    '.gh-prog{flex:1;min-width:220px}.gh-pb{height:10px;border-radius:99px;background:#eef2f8;overflow:hidden}.gh-pb span{display:block;height:100%;width:0;background:linear-gradient(90deg,#1d7cf2,#7c3aed);border-radius:99px;transition:width .4s}.gh-prog small{display:block;margin-top:6px;font-size:12px;color:var(--ink-2)}.gh-fails{color:#c2342e}' +
    '.gh-tst{flex:1;min-width:260px;position:relative}.gh-tsl{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.gh-tsl button{display:flex;flex-direction:column;align-items:flex-start;border:1px solid var(--line);background:#fff;border-radius:10px;padding:6px 10px;font:inherit;cursor:pointer;line-height:1.3}.gh-tsl button:hover{border-color:#1d7cf2;background:#f3f8ff}.gh-tsl b{font-size:12.5px}.gh-tsl small{font-size:11px;color:var(--ink-3)}' +
    '.gh-fl[hidden]{display:none!important}.gh-aa .cr-ib,.gh-tt .cr-ib{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}.gh-at{width:80px;white-space:nowrap}.gh-at b{font-size:14.5px}.gh-th2>.gh-done{flex:1}.gh-tok{font-style:normal;font-size:11px;font-weight:700;color:#0b5fd0;background:#eaf3ff;border-radius:6px;padding:1px 5px}' +
    '@media(max-width:860px){.gh-kw{grid-template-columns:1fr}.gh-kp{position:static}.gh-cv{grid-template-columns:1fr}.gh-stg{grid-template-columns:110px 1fr 34px 76px;gap:8px}}';
  document.head.appendChild(st); })();

const deskDash = () => ({id: uid(), name: 'Sales desk', items: [item('note', 12, {title: 'Your sales desk', about: 'ghl_deals', text: 'Move deals, update contacts, add tasks and notes, book appointments and send messages. Everything you do here happens in Easyleads right away, and Ctrl+Z undoes it.'}),
  item('ghl_pipe', 12), item('ghl_tasks', 6, {h: 460}), item('ghl_appts', 6, {h: 460}), item('ghl_deals', 12), item('ghl_convs', 12, {h: 600}), item('ghl_contacts', 12), item('ghl_camp', 12)]});
function deskUpgrade(dd){
  const has = t => dd.items.some(i => i.t === t), at = t => dd.items.findIndex(i => i.t === t);
  if (!has('ghl_pipe')){ const n = dd.items.findIndex(i => i.t === 'note'); dd.items.splice(n < 0 ? 0 : n + 1, 0, item('ghl_pipe', 12)); }
  if (!has('ghl_tasks')) dd.items.splice(at('ghl_pipe') + 1, 0, item('ghl_tasks', 6, {h: 460}), item('ghl_appts', 6, {h: 460}));
  if (!has('ghl_convs')){ const d = at('ghl_deals'); dd.items.splice(d < 0 ? dd.items.length : d + 1, 0, item('ghl_convs', 12, {h: 600})); }
  if (!has('ghl_camp')) dd.items.push(item('ghl_camp', 12));
}
(async function boot(){
  /* "Open as client" from the EDGE tool passes a short session in the address. */
  const hash = new URLSearchParams(location.hash.slice(1));
  let session = ls.get(SKEY, null);
  /* A preview session is kept in this tab only, never saved in the browser. */
  if (hash.get('s')){ session = hash.get('s'); S.preview = true; history.replaceState(null, '', location.pathname); }
  if (!session){ renderLogin(); return; }
  /* Signed in before on this browser: open the dashboard straight away from what was kept,
     and check the session behind it (a revoked or expired one still signs out). */
  const kept = !S.preview && ls.get('el_me', null);
  if (kept && kept.user && Array.isArray(kept.clients)){
    /* Let the rest of this file finish loading first (the assistant below is used while drawing). */
    await null;
    startWith(session, kept);
    api('portalMe', {session}).then(j => { if (!j || j.error || S.session !== session) return; if (JSON.stringify(j) !== JSON.stringify(kept)) startWith(session, j); else ls.set('el_me', j); }).catch(() => {});
    return;
  }
  renderShell();
  try{
    const j = await api('portalMe', {session});
    if (j.error) throw new Error(j.error);
    S.session = session;
    startWith(session, j);
  }catch(e){ if (app.querySelector('form')) return; renderLogin(S.preview ? 'This preview link has expired. Open it again from the EDGE tool.' : ''); }
})();


/* ==========================================================================
   DASHBOARD ASSISTANT
   Shown only when EDGE has switched it on for this client. It answers from
   this dashboard's own data for the period on screen (the tracker does the
   reading and the asking), and nothing else. The EDGE team's faces take
   turns: a new one each time it opens and with every answer.
   ========================================================================== */
const BOT = {el: null, open: false, conv: {}, busy: false, face: Math.floor(Math.random() * 8), t: null, warm: {}, typing: null};
const botClient = () => { const c = S.me && S.me.clients.find(x => x.domain === S.domain); return c && c.bot ? c : null; };
const botTeam = () => (S.me && Array.isArray(S.me.team) ? S.me.team : []).filter(m => m && /^https:\/\//.test(m.img || ''));
const botNext = () => { const t = botTeam(); if (!t.length) return null; BOT.face = (BOT.face + 1) % t.length; return t[BOT.face]; };
const botFace = (m, cls) => m ? '<img class="' + (cls || '') + '" src="' + esc(m.img) + '" alt="' + esc(m.n) + '" title="' + esc(m.n + ', ' + m.r) + '" loading="lazy" referrerpolicy="no-referrer">' : '<span class="' + (cls || '') + ' bot-mono">' + ic('spark', 16) + '</span>';
const BOT_SUG = {easyleads: ['How many leads did I get?', 'Where are my leads coming from?', 'Any missed calls to follow up?', 'What’s in my pipeline?'],
  site: ['How many leads did I get?', 'Which pages bring in leads?', 'Which form is used most?', 'How many calls came from the website?']};
/* One conversation per business in this browser tab. The team member who answers is picked when the
   conversation starts and stays with it to the end; a new conversation brings the next person. */
function botConv(){
  const d = S.domain;
  if (!BOT.conv[d]){
    let saved = null;
    try{ saved = JSON.parse(sessionStorage.getItem('el_bot_' + d) || 'null'); }catch(e){}
    BOT.conv[d] = saved && Array.isArray(saved.msgs) ? saved : {id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), msgs: []};
  }
  const cv = BOT.conv[d];
  if (!cv.face || !cv.face.img){ const f = botNext(); if (f) cv.face = f; }
  return cv;
}
const botSave = () => { try{ sessionStorage.setItem('el_bot_' + S.domain, JSON.stringify(botConv())); }catch(e){} };
/* Light formatting for answers: paragraphs, bullets and bold, everything else as text. */
function botFormat(t){
  const lines = String(t || '').split(/\n/);
  let h = '', list = false;
  lines.forEach(l => {
    const b = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/.exec(l);
    const inl = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*\*/g, '');
    if (b){ if (!list){ h += '<ul>'; list = true; } h += '<li>' + inl(b[1]) + '</li>'; return; }
    if (list){ h += '</ul>'; list = false; }
    if (l.trim()) h += '<p>' + inl(l.replace(/^#+\s*/, '')) + '</p>';
  });
  return h + (list ? '</ul>' : '');
}
/* The dates the widgets read (this period and the one before), so the assistant reuses their data. */
const botDates = () => { const r = range(); return {start: iso(r.s), end: iso(r.e), dstart: iso(prevRange().s)}; };
/* Ask the tracker to get this dashboard's data ready as soon as the assistant opens. */
function botWarm(){
  const c = botClient(); if (!c) return;
  const d = botDates(), k = S.domain + '|' + d.dstart + '|' + d.end;
  if (BOT.warm[k]) return;
  BOT.warm[k] = 1;
  api('portalChatWarm', Object.assign({session: S.session, domain: S.domain}, d)).catch(() => {});
}
/* What is on the screen right now, as plain text: the dashboard tab, the period and every widget the way
   the person sees it this moment. Sent with each question, so answers follow the dashboard live. */
function botScreen(){
  try{
    const dash = curDash(), out = ['Dashboard tab: ' + (dash ? dash.name : '') + ' · period: ' + rangeText()];
    let left = 7000;
    document.querySelectorAll('[data-grid] > section.w').forEach(w => {
      if (left <= 0 || w.querySelector('.wl-badge')) return;
      const h = w.querySelector('.wh h3'), body = w.querySelector('[data-body]');
      const txt = (body ? body.innerText : '').replace(/\s*\n\s*/g, ' | ').replace(/\s{2,}/g, ' ').trim().slice(0, 600);
      const line = '[' + (h ? h.textContent.trim() : (w.dataset.t || 'Widget')) + '] ' + txt;
      out.push(line.slice(0, left)); left -= line.length;
    });
    return out.join('\n').slice(0, 7500);
  }catch(e){ return ''; }
}
/* When the numbers on screen update while the assistant is open, it says so for a moment. */
function botLive(){
  if (!BOT.el || !BOT.open) return;
  const r = BOT.el.querySelector('[data-hrole]'); if (!r) return;
  r.textContent = 'Dashboard just updated · ask me about it'; r.classList.add('upd');
  clearTimeout(BOT.lt); BOT.lt = setTimeout(() => { r.classList.remove('upd'); botHead(); }, 6000);
}
function botHead(){
  if (!BOT.el) return;
  const c = botClient(), f = botConv().face;
  BOT.el.querySelector('[data-hav]').innerHTML = botFace(f, 'bot-hface');
  BOT.el.querySelector('[data-hname]').textContent = f ? f.n + ' · Easyleads' : 'Easyleads Assistant';
  BOT.el.querySelector('[data-hrole]').textContent = 'Automated assistant · watching your dashboard live';
}
function botMount(){
  const c = botClient();
  if (!c){ if (BOT.el){ BOT.el.remove(); BOT.el = null; } clearInterval(BOT.t); return; }
  if (!BOT.el){
    const el = BOT.el = document.createElement('div');
    el.className = 'botw';
    el.innerHTML = '<button type="button" class="bot-fab" data-bopen aria-label="Ask about your dashboard"><span class="bot-faces" data-faces></span><span class="bot-fab-t"><b>Questions about your numbers?</b><small>Instant answers from your dashboard</small></span></button>' +
      '<aside class="bot" role="dialog" aria-label="Dashboard assistant" aria-hidden="true">' +
      '<header class="bot-h"><span class="bot-hav" data-hav></span><div class="bot-ht"><b data-hname>Ask about your dashboard</b><small data-hrole>Automated assistant</small></div>' +
      '<button type="button" class="bot-x" data-bnew title="Start a new conversation">' + ic('plus', 15) + '</button><button type="button" class="bot-x" data-bclose aria-label="Close">' + ic('x', 16) + '</button></header>' +
      '<div class="bot-msgs" data-msgs></div>' +
      '<form class="bot-in" data-bform><textarea rows="1" data-bq maxlength="600" placeholder="Ask about your leads, calls, pipeline…"></textarea><button type="submit" class="bot-send" aria-label="Send">' + ic('send', 17) + '</button></form>' +
      '<div class="bot-foot" data-bfoot></div></aside>';
    document.body.appendChild(el);
    const q = s => el.querySelector(s);
    q('[data-bopen]').addEventListener('click', () => botOpen(true));
    q('[data-bclose]').addEventListener('click', () => botOpen(false));
    q('[data-bnew]').addEventListener('click', () => { botStopTyping(); BOT.conv[S.domain] = null; try{ sessionStorage.removeItem('el_bot_' + S.domain); }catch(e){} botHead(); botDraw(); });
    const ta = q('[data-bq]');
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(110, ta.scrollHeight) + 'px'; });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); botAsk(ta.value); } });
    q('[data-bform]').addEventListener('submit', e => { e.preventDefault(); botAsk(ta.value); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && BOT.open) botOpen(false); });
    /* the launcher's faces take turns */
    const spin = () => { const t = botTeam(), f = q('[data-faces]'); if (!f || !t.length) return; const i = BOT.face; f.innerHTML = [0, 1, 2].map(k => botFace(t[(i + k) % t.length], 'bf' + k)).join(''); BOT.face = (BOT.face + 1) % t.length; };
    spin(); clearInterval(BOT.t); BOT.t = setInterval(() => { if (!BOT.open) spin(); }, 3600);
    window.addEventListener('el-fresh', botLive);
  }
  botHead();
  botDraw();
}
function botOpen(on){
  if (!BOT.el) return;
  BOT.open = on;
  BOT.el.classList.toggle('open', on);
  BOT.el.querySelector('.bot').setAttribute('aria-hidden', on ? 'false' : 'true');
  if (on){ botWarm(); botHead(); botDraw(); setTimeout(() => { const t = BOT.el && BOT.el.querySelector('[data-bq]'); if (t) t.focus(); }, 220); }
}
function botDraw(){
  if (!BOT.el) return;
  const c = botClient(), cv = botConv(), box = BOT.el.querySelector('[data-msgs]'), who = cv.face;
  const bft = BOT.el.querySelector('[data-bfoot]'); if (bft){ bft.textContent = ''; bft.style.display = 'none'; }
  if (!cv.msgs.length){
    const sug = BOT_SUG[(c && c.source) === 'site' ? 'site' : 'easyleads'];
    box.innerHTML = '<div class="bot-hello">' +
      (who ? '<div class="bot-who">' + botFace(who, 'bot-who-img') + '<div><b>' + esc(who.n) + '</b><small>' + esc(who.r) + ' · Easyleads</small></div><span class="bot-who-ai"><i></i>Live</span></div>' : '<div class="bot-team">' + botTeam().slice(0, 5).map(m => botFace(m)).join('') + '</div>') +
      '<b class="bot-hi">Hi' + (S.me && S.me.user.name ? ' ' + esc(S.me.user.name.split(' ')[0]) : '') + ', what would you like to know?</b>' +
      '<p>Ask anything about the numbers on this dashboard. For anything else, your Easyleads team is a message away.</p>' +
      '<div class="bot-sug">' + sug.map(s => '<button type="button" data-sug="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div></div>';
    box.querySelectorAll('[data-sug]').forEach(b => b.addEventListener('click', () => botAsk(b.dataset.sug)));
    return;
  }
  const ty = BOT.typing;
  box.innerHTML = cv.msgs.map((m, i) => {
    if (m.role === 'user') return '<div class="bm me"><div class="bb">' + esc(m.content) + '</div></div>';
    const live = ty && ty.i === i;
    return '<div class="bm"><span class="bav">' + botFace(m.face || who || null) + '</span><div class="bb' + (m.err ? ' err' : '') + '"' + (live ? ' data-typing' : '') + '>' +
      (live ? botFormat(m.content.slice(0, ty.n)) + '<span class="bcaret"></span>' : botFormat(m.content)) + '</div></div>';
  }).join('') +
    (BOT.busy ? '<div class="bm"><span class="bav">' + botFace(who || null) + '</span><div class="bb thinking"><span class="bt-name">' + esc(who ? who.n + ' is looking at your numbers' : 'Looking at your numbers') + '</span><span class="bt-dots"><i></i><i></i><i></i></span></div></div>' : '');
  box.scrollTop = box.scrollHeight;
}
/* The answer appears word by word, quickly (about a second whatever its length). */
function botStopTyping(){ if (BOT.typing){ clearInterval(BOT.typing.t); BOT.typing = null; } }
function botType(i){
  botStopTyping();
  const cv = botConv(), m = cv.msgs[i]; if (!m) return;
  const full = String(m.content || ''), step = Math.max(3, Math.ceil(full.length / 55));
  const ty = BOT.typing = {i, n: 0, t: 0};
  ty.t = setInterval(() => {
    let n = full.indexOf(' ', ty.n + step); ty.n = n < 0 ? full.length : n;
    const bb = BOT.el && BOT.el.querySelector('[data-typing]');
    const done = ty.n >= full.length;
    if (bb){ bb.innerHTML = botFormat(full.slice(0, ty.n)) + (done ? '' : '<span class="bcaret"></span>'); const box = BOT.el.querySelector('[data-msgs]'); box.scrollTop = box.scrollHeight; }
    if (done){ botStopTyping(); if (bb) bb.removeAttribute('data-typing'); }
  }, 18);
}
async function botAsk(text){
  text = String(text || '').trim();
  if (!text || BOT.busy || !BOT.el) return;
  if (BOT.typing){ botStopTyping(); botDraw(); }
  const ta = BOT.el.querySelector('[data-bq]'); ta.value = ''; ta.style.height = 'auto';
  const cv = botConv(), dom = S.domain, face = cv.face || null;
  cv.msgs.push({role: 'user', content: text.slice(0, 600)});
  BOT.busy = true; botDraw();
  const widgets = []; try{ layout().dashes.forEach(d => d.items.filter(visIt).forEach(it => { if (W[it.t] && it.t !== 'note') widgets.push(d.name + ': ' + (it.title || W[it.t].t)); })); }catch(e){}
  let reply;
  try{
    const j = await api('portalChat', Object.assign({session: S.session, domain: dom, conv: cv.id, widgets, screen: botScreen(),
      messages: cv.msgs.filter(m => !m.err).slice(-10).map(m => ({role: m.role, content: m.content}))}, botDates()));
    reply = j && j.ok ? {role: 'assistant', content: j.answer} : {role: 'assistant', content: (j && j.error) || 'Something went wrong. Please try again.', err: true};
  }catch(e){ reply = {role: 'assistant', content: e.message || 'Something went wrong. Please try again.', err: true}; }
  reply.face = face;
  const conv = BOT.conv[dom] || cv;
  conv.msgs.push(reply);
  BOT.busy = false;
  botSave();
  if (S.domain !== dom || BOT.conv[dom] !== cv){ botDraw(); return; }
  if (!reply.err){ BOT.typing = {i: conv.msgs.length - 1, n: 0, t: 0}; botDraw(); botType(conv.msgs.length - 1); }
  else botDraw();
}
})();
