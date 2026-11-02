#!/usr/bin/env node
// Gate for automatic publishing. Exits non-zero if data/edition.json breaks the editorial contract.
// Usage: node scripts/validate.mjs [path] [--today]   (--today also requires edition_date == today in Riyadh)
//        node scripts/validate.mjs --night              (checks data/today.json, the night update: date must be today)
import { readFileSync } from "node:fs";
import { loadRegister, findRepeats } from "./register.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) || (args.includes("--night") ? "data/today.json" : "data/edition.json");
const requireToday = args.includes("--today");
const night = args.includes("--night");

// Official Saudi sources are preferred; these reputable outlets are allowed when no official release exists.
const OFFICIAL = /(^|\.)(edu\.sa|med\.sa|mawhiba\.org|mawhiba\.sa|ksrelief\.org)$|(^|\.)gov\.sa$|(^|\.)spa\.gov\.sa$|(^|\.)pif\.gov\.sa$|(^|\.)sama\.gov\.sa$|(^|\.)stats\.gov\.sa$|(^|\.)vision2030\.gov\.sa$|(^|\.)saudiexchange\.sa$|(^|\.)aramco\.com$|(^|\.)ncm\.gov\.sa$|(^|\.)my\.gov\.sa$/;
const REPUTABLE = /(^|\.)(arabnews\.com|arabnews\.pk|aljazeera\.net|alyaum\.com|the-afc\.com|thenationalnews\.com|reuters\.com|bloomberg\.com|aawsat\.com|alarabiya\.net|okaz\.com\.sa|alriyadh\.com|aleqt\.com|argaam\.com|sabq\.org|saudigazette\.com\.sa|spl\.com\.sa|saff\.com\.sa)$/;
// Arabic letters that join to the following letter (excludes ا أ إ آ د ذ ر ز و ؤ ة ء).
const JOINING = /[\u0626\u0628\u062A-\u062E\u0633-\u063A\u0640-\u0647\u0649\u064A]/;
// Foreign clubs allowed on the timeline as fill-in (see EDITORIAL.md): their official sites count as fixture sources.
const FOREIGN_CLUBS = /(^|\.)(realmadrid\.com|fcbarcelona\.com|mancity\.com|liverpoolfc\.com|manutd\.com|fcbayern\.com)$/;
// Match colours: [home, away] with one hex each, or [[home1, home2], [away1, away2]] with two per club.
const HEX = /^#[0-9a-fA-F]{6}$/;
const validColors = (c) => Array.isArray(c) && c.length >= 1 && c.length <= 2 &&
  (c.every((x) => typeof x === "string" && HEX.test(x)) || c.every((x) => Array.isArray(x) && x.length >= 1 && x.length <= 2 && x.every((y) => HEX.test(y))));
// Science and technology items must be research or public-institution news, not a company's product news.
const PRODUCT_NEWS = /(يطلق هاتف|هاتف جديد|تطلق تطبيق|إطلاق تطبيق|إصدار جديد من|نموذج ذكاء اصطناعي جديد|جولة تمويل|طرح عام|أرباح|سهم|آيفون|أندرويد)/;
const SECURITY_WORDS = /(صاروخ|صواريخ|مسيّر|مسير[ةا]ت|اعتراض|هجوم|هجمات|قصف|حوثي|الحوثي|إيران|استهداف|انفجار|شظايا|عسكري)/;
const BANNED_WORDS = /(صادم|عاجل|كارثة|فضيحة|لن تصدق|مذهل|الأعظم في التاريخ)/;

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

let ed;
try {
  ed = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`FAIL: cannot parse ${file}: ${e.message}`);
  process.exit(1);
}

const iso = /^\d{4}-\d{2}-\d{2}$/;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

// Night update (data/today.json): only the new day's timeline and notices, published just after midnight.
// The checks themselves are the edition's (function declarations below are hoisted).
if (night) {
  const allowed = ["date", "timeline", "notices"];
  for (const k of Object.keys(ed)) if (!allowed.includes(k)) err(`night update: unexpected key "${k}" (only ${allowed.join(", ")})`);
  if (!iso.test(ed.date || "")) err("night update: date missing or not YYYY-MM-DD");
  else if (ed.date !== today) err(`night update: date ${ed.date} is not today (${today})`);
  checkNotices(ed.notices, ed.date);
  checkTimeline(ed.timeline, ed.date);
  for (const w of warnings) console.log(`WARN: ${w}`);
  for (const e of errors) console.log(`FAIL: ${e}`);
  console.log(errors.length ? `\n${errors.length} error(s) — do not publish.` : `\nOK — night update for ${ed.date}: ${(ed.timeline || []).length} timeline item(s), ${(ed.notices || []).length} notice(s).`);
  process.exit(errors.length ? 1 : 0);
}

if (!iso.test(ed.edition_date || "")) err("edition_date missing or not YYYY-MM-DD");
if (ed.edition_date > today) err(`edition_date ${ed.edition_date} is in the future`);
if (requireToday && ed.edition_date !== today) err(`edition_date ${ed.edition_date} is not today (${today})`);
if (!["pilot", "live"].includes(ed.status)) err('status must be "pilot" or "live"');

if (typeof ed.headline !== "string" || ed.headline.length < 15) err("headline missing or too short");
else if (ed.headline.length > 140) err(`headline too long (${ed.headline.length} chars, max 140)`);

const headline = typeof ed.headline === "string" ? ed.headline : "";

if (!Array.isArray(ed.cards)) err("cards must be an array");
const cards = ed.cards || [];
if (cards.length < 3) err(`only ${cards.length} cards; minimum to publish is 3`);
else if (cards.length < 5) warn(`${cards.length} cards; target is 5–8`);
if (cards.length > 8) err(`${cards.length} cards; maximum is 8`);

const inHeadline = cards.filter((c) => c.keyword && headline.includes(c.keyword)).length;
if (inHeadline < 2) err(`only ${inHeadline} card keyword(s) appear in the headline; at least 2 must`);

const seen = new Set();
cards.forEach((c, i) => {
  const n = `card ${i + 1}`;
  if (c.keyword) {
    // Keywords found in the headline become links there; the rest are shown as "وأيضًا" chips.
    const at = headline.indexOf(c.keyword);
    if (at > 0 && JOINING.test(headline[at - 1]) && /[\u0621-\u064A]/.test(c.keyword[0])) err(`${n}: keyword "${c.keyword}" is glued to a preceding Arabic letter in the headline (breaks letter joining)`);
    if (c.keyword.split(/\s+/).length > 4) err(`${n}: keyword too long (max 4 words)`);
    if (cards.some((o, j) => j !== i && o.keyword && o.keyword.includes(c.keyword))) err(`${n}: keyword "${c.keyword}" overlaps another card's keyword`);
  }
  for (const k of ["category", "keyword", "title", "summary", "date", "source_name", "source_url"]) {
    if (!c[k] || typeof c[k] !== "string") err(`${n}: missing ${k}`);
  }
  if (c.date && !iso.test(c.date)) err(`${n}: date not YYYY-MM-DD`);
  if (c.date && ed.edition_date && c.date > ed.edition_date) err(`${n}: date ${c.date} after edition date`);
  if (c.date && ed.edition_date && daysBetween(c.date, ed.edition_date) > 14) err(`${n}: item is older than 14 days (${c.date})`);
  let host = "";
  try {
    const u = new URL(c.source_url);
    if (u.protocol !== "https:") err(`${n}: source_url must be https`);
    host = u.hostname.replace(/^www\./, "");
  } catch { err(`${n}: source_url is not a valid URL`); }
  if (host && !OFFICIAL.test(host) && !REPUTABLE.test(host)) err(`${n}: source ${host} is not on the allowed list`);
  else if (host && !OFFICIAL.test(host)) warn(`${n}: non-official source (${host})`);
  if (c.source_url && seen.has(c.source_url)) err(`${n}: duplicate source_url`);
  seen.add(c.source_url);
  if (c.title && c.title.length > 70) err(`${n}: title too long (${c.title.length} chars, max 70)`);
  const words = (c.summary || "").trim().split(/\s+/).length;
  if (words > 35) err(`${n}: summary too long (${words} words, max 35)`);
  for (const t of [c.title, c.summary]) if (t && BANNED_WORDS.test(t)) err(`${n}: sensational wording: "${t.match(BANNED_WORDS)[0]}"`);
});
if (ed.headline && BANNED_WORDS.test(ed.headline)) err("headline: sensational wording");

// City events, keyed by city (the page shows three columns, each with a city picker). Ticketing and tourism platforms are allowed here only.
// "other" is the legacy catch-all bucket from older editions; it is still accepted but new editions should use the city keys.
const CITY_KEYS = ["riyadh", "jeddah", "makkah", "madinah", "eastern", "alula", "abha", "taif", "tabuk"];
const EVENT_HOSTS = /(^|\.)(webook\.com|platinumlist\.net|visitsaudi\.com|experiencealula\.com|riyadhseason\.com|jeddahseason\.sa|redseaglobal\.com|soudahdevelopment\.com)$/;
if (ed.regions != null) {
  if (typeof ed.regions !== "object" || Array.isArray(ed.regions)) err(`regions must be an object keyed by city (${CITY_KEYS.join(", ")})`);
  else {
    for (const key of Object.keys(ed.regions)) if (![...CITY_KEYS, "other"].includes(key)) err(`regions: unknown key "${key}"`);
    for (const key of [...CITY_KEYS, "other"]) {
      const list = ed.regions[key] || [];
      if (!Array.isArray(list)) { err(`regions.${key} must be an array`); continue; }
      if (list.length > 5) err(`regions.${key} has ${list.length} items; maximum is 5`);
      if (list.filter((x) => x.kind === "experience").length > 2) err(`regions.${key}: at most 2 experiences per city`);
      const urls = new Set();
      list.forEach((x, i) => {
        const n = `regions.${key} ${i + 1}`;
        if (!x.title || x.title.length > 45) err(`${n}: title missing or longer than 45 chars`);
        if (!x.place || x.place.length > 30) err(`${n}: place missing or longer than 30 chars`);
        if (key === "other" && x.place && /^(الرياض|جدة)$/.test(x.place)) err(`${n}: "other" items must be outside Riyadh and Jeddah`);
        const exp = x.kind === "experience";
        if (x.kind != null && !exp) err(`${n}: kind must be "experience" or absent`);
        if (exp) { // bookable experiences with no set date (tours, hikes, dives): see EDITORIAL.md
          if (!x.available || x.available.length > 30) err(`${n}: experience needs "available" (≤ 30 chars), e.g. «يوميًا حتى مارس»`);
          if (x.start || x.end || x.time || x.when) err(`${n}: an experience has no start/end/time/when; use "available" and optional "until"`);
          if (x.until && (!iso.test(x.until) || (ed.edition_date && x.until < ed.edition_date))) err(`${n}: until must be YYYY-MM-DD, today or later`);
          if (list.slice(i + 1).some((y) => y.kind !== "experience")) err(`${n}: experiences go after the dated events`);
        }
        if (!exp && !iso.test(x.start || "")) err(`${n}: start not YYYY-MM-DD`);
        if (x.end && !iso.test(x.end)) err(`${n}: end not YYYY-MM-DD`);
        if (x.end && x.start && x.end < x.start) err(`${n}: end before start`);
        const last = x.end || x.start;
        if (last && ed.edition_date && last < ed.edition_date) err(`${n}: event already over (${last})`);
        if (x.start && ed.edition_date && daysBetween(ed.edition_date, x.start) > 30) err(`${n}: starts more than 30 days ahead (${x.start})`);
        if (x.when && x.when.length > 25) err(`${n}: when longer than 25 chars`);
        if (x.time != null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)) err(`${n}: time must be HH:MM (Riyadh time), e.g. 21:00`);
        if (x.duration != null && !(Number.isInteger(x.duration) && x.duration >= 15 && x.duration <= 600)) err(`${n}: duration must be whole minutes, 15–600`);
        if (x.colors != null && !validColors(x.colors)) err(`${n}: colors must be [home, away] hex values, or [[home1, home2], [away1, away2]]`);
        for (const t of [x.title, x.place]) if (t && BANNED_WORDS.test(t)) err(`${n}: sensational wording`);
        try {
          const u = new URL(x.source_url);
          const h = u.hostname.replace(/^www\./, "");
          if (u.protocol !== "https:") err(`${n}: source_url must be https`);
          if (!EVENT_HOSTS.test(h) && !OFFICIAL.test(h) && !REPUTABLE.test(h)) err(`${n}: source ${h} is not on the allowed list`);
        } catch { err(`${n}: source_url is not a valid URL`); }
        if (urls.has(x.source_url)) err(`${n}: duplicate source_url`);
        urls.add(x.source_url);
      });
    }
  }
}
for (const [i, x] of (ed.events || []).entries()) {
  if (!iso.test(x.date || "")) err(`event ${i + 1}: date not YYYY-MM-DD`);
  if (!x.title) err(`event ${i + 1}: missing title`);
  if (x.date && ed.edition_date && x.date < ed.edition_date) err(`event ${i + 1}: date is in the past`);
  if (x.end && (!iso.test(x.end) || x.end < x.date)) err(`event ${i + 1}: end missing format or before date`);
  if (x.title && /\(\s*\d/.test(x.title)) warn(`event ${i + 1}: title seems to include a date; use date/end instead`);
}

// News register: a story may be used only once in 30 days (read from the git history of this file).
{
  const reg = loadRegister({ before: ed.edition_date });
  if (!reg.ok) warn("news register unavailable (no git history); repeats were not checked");
  cards.forEach((c, i) => {
    if (c.story != null && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.story)) err(`card ${i + 1}: story must be a short lowercase slug, e.g. "riyadh-season-2026-launch"`);
    for (const h of findRepeats(c, reg.entries)) {
      const m = `card ${i + 1}: ${h.why} with ${h.e.date} «${h.e.title}»`;
      if (h.level === "error") err(m + " — already used; pick another story or mark a genuine new development with \"follows\"");
      else warn(m);
    }
  });
  const ids = cards.map((c) => c.story).filter(Boolean);
  if (new Set(ids).size !== ids.length) err("two cards share the same story id");
}

// «يهمّك اليوم»: official service notices (see EDITORIAL.md). The service change, never the security event behind it.
function checkNotices(list, date) {
  const ns = list || [];
  if (!Array.isArray(ns)) err("notices must be an array");
  if (ns.length > 4) err(`notices has ${ns.length} items; maximum is 4`);
  const nUrls = new Set();
  ns.forEach((x, i) => {
    const n = `notice ${i + 1}`;
    if (!x.title || x.title.length > 90) err(`${n}: title missing or longer than 90 chars`);
    if (!x.issuer || x.issuer.length > 30) err(`${n}: issuer (the body that announced it, in Arabic) missing or longer than 30 chars`);
    if (x.area && x.area.length > 25) err(`${n}: area longer than 25 chars`);
    if (!iso.test(x.date || "")) err(`${n}: date (when it was announced) not YYYY-MM-DD`);
    else if (date && (x.date > date || daysBetween(x.date, date) > 7)) err(`${n}: announced more than 7 days before the edition`);
    if (x.until != null && !iso.test(x.until)) err(`${n}: until not YYYY-MM-DD`);
    if (x.until && date && x.until < date) err(`${n}: already over (until ${x.until})`);
    if (!x.until && x.date && date && daysBetween(x.date, date) > 2) err(`${n}: without "until", a notice may run for 2 days only`);
    for (const t of [x.title, x.area]) if (t && BANNED_WORDS.test(t)) err(`${n}: sensational wording`);
    if (x.title && SECURITY_WORDS.test(x.title)) err(`${n}: state the service change only, not the security event behind it`);
    try {
      const u = new URL(x.source_url);
      const h = u.hostname.replace(/^www\./, "");
      if (u.protocol !== "https:") err(`${n}: source_url must be https`);
      if (!OFFICIAL.test(h) && !REPUTABLE.test(h)) err(`${n}: source ${h} is not on the allowed list`);
      else if (!OFFICIAL.test(h)) warn(`${n}: non-official source (${h}); link the issuer's own release when there is one`);
    } catch { err(`${n}: source_url is not a valid URL`); }
    if (nUrls.has(x.source_url)) err(`${n}: duplicate source_url`);
    nUrls.add(x.source_url);
  });
}

checkNotices(ed.notices, ed.edition_date);

// «ما وراء البحار» (`world`) was retired on 2026-11-01; «بعيون العالم» (`world_view`) replaced it on the page.
if (ed.world != null && (!Array.isArray(ed.world) || ed.world.length)) err("world is retired (the page no longer shows «ما وراء البحار»); use world_view for «بعيون العالم» or drop the key");

// «بعيون العالم»: facts about the Kingdom reported by major non-Saudi outlets and international bodies (see EDITORIAL.md).
// Global press: the outlet itself, never a Saudi or Saudi-owned one. Bodies: international organisations, rating agencies and rankings.
const WV_PRESS = /(^|\.)(reuters\.com|apnews\.com|afp\.com|bbc\.com|bbc\.co\.uk|cnbc\.com|cnn\.com|nikkei\.com|theguardian\.com|dw\.com|france24\.com|euronews\.com|nhk\.or\.jp|abc\.net\.au|scmp\.com|time\.com|ft\.com|bloomberg\.com|wsj\.com|economist\.com|nytimes\.com|washingtonpost\.com)$/;
const WV_BODIES = /(^|\.)(imf\.org|worldbank\.org|un\.org|untourism\.int|unwto\.org|unesco\.org|who\.int|oecd\.org|wto\.org|wipo\.int|itu\.int|iea\.org|irena\.org|weforum\.org|imd\.org|moodys\.com|spglobal\.com|fitchratings\.com|topuniversities\.com|timeshighereducation\.com|fifa\.com|olympics\.com)$/;
const WV_PAYWALL = /(^|\.)(ft\.com|bloomberg\.com|wsj\.com|economist\.com|nytimes\.com|washingtonpost\.com|nikkei\.com)$/;
const WV_OPINION = /\/(opinion|opinions|commentary|comment|op-ed|oped|blogs?|sponsored|partner-content|brandvoice|advertorial)(\/|$)/i;
{
  const wv = ed.world_view || [];
  if (!Array.isArray(wv)) err("world_view must be an array");
  if (wv.length > 3) err(`world_view has ${wv.length} items; maximum is 3`);
  const reg = loadRegister({ before: ed.edition_date });
  const used = new Set([...(ed.cards || [])].map((c) => c.story).filter(Boolean));
  wv.forEach((x, i) => {
    const n = `world_view ${i + 1}`;
    if (!["press", "body"].includes(x.kind)) err(`${n}: kind must be "press" (a global outlet) or "body" (an international organisation, rating agency or ranking)`);
    if (!x.title || x.title.length > 70) err(`${n}: title missing or longer than 70 chars`);
    if (!x.outlet || x.outlet.length > 30) err(`${n}: outlet (the outlet or body's name, in Arabic) missing or longer than 30 chars`);
    if (x.summary && x.summary.length > 220) err(`${n}: summary longer than 220 chars`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(x.story || "")) err(`${n}: story must be a short lowercase slug`);
    else if (used.has(x.story)) err(`${n}: story "${x.story}" is already a card in this edition`);
    if (!iso.test(x.date || "")) err(`${n}: date not YYYY-MM-DD`);
    else if (ed.edition_date && (x.date > ed.edition_date || daysBetween(x.date, ed.edition_date) > 60)) err(`${n}: date must be within the 60 days before the edition`);
    // A fact, not praise: press items must carry a figure; bodies (a ranking, a rating, an inscription) should.
    const text = `${x.title || ""} ${x.summary || ""}`;
    if (!/[0-9٠-٩]/.test(text)) (x.kind === "press" ? err : warn)(`${n}: no figure in the title or summary; state the concrete fact (a number, a rank, a rating)`);
    for (const t of [x.title, x.summary]) if (t && BANNED_WORDS.test(t)) err(`${n}: sensational wording`);
    for (const t of [x.title, x.summary]) if (t && PRODUCT_NEWS.test(t)) err(`${n}: reads like company or product news`);
    try {
      const u = new URL(x.source_url);
      const h = u.hostname.replace(/^www\./, "");
      if (u.protocol !== "https:") err(`${n}: source_url must be https`);
      const list = x.kind === "body" ? WV_BODIES : WV_PRESS;
      if (!list.test(h)) err(`${n}: ${h} is not on the «بعيون العالم» ${x.kind === "body" ? "bodies" : "global press"} list`);
      if (WV_OPINION.test(u.pathname)) err(`${n}: opinion, blog or sponsored pages are excluded; link to a news report or an official release`);
      if (WV_PAYWALL.test(h) && x.paywall !== true) err(`${n}: ${h} is paywalled; set "paywall": true so the page tags it «للمشتركين»`);
      if (!WV_PAYWALL.test(h) && x.paywall) warn(`${n}: paywall set for ${h}, which is not on the paywalled list`);
    } catch { err(`${n}: source_url is not a valid URL`); }
    // «بعيون العالم» is a standing list (the three most recent qualifying facts of the last 60 days), so its items
    // carry over from day to day and are not in the news register. A match with a recent card is worth a look, not a block.
    for (const h of findRepeats({ ...x, keyword: "" }, reg.entries)) if (h.level === "error") warn(`${n}: ${h.why} with the ${h.e.date} card «${h.e.title}»`);
  });
  // Ordered by significance, newest first among equals: bodies (ratings, rankings, international reports) lead the press.
  const firstPress = wv.findIndex((x) => x.kind === "press");
  if (firstPress >= 0 && wv.slice(firstPress).some((x) => x.kind === "body")) warn("world_view: a body item sits below a press item; order by significance (bodies first) unless the press fact is clearly bigger");
}

// Timeline: today's timed events shown as dots at the bottom (matches, openings, national moments).
function checkTimeline(list, date) {
const tl = list || [];
if (!Array.isArray(tl)) err("timeline must be an array");
if (tl.length > 6) err(`timeline has ${tl.length} items; maximum is 6`);
let seenForeign = false; // foreign-club matches only fill in after every Saudi item
tl.forEach((x, i) => {
  const n = `timeline ${i + 1}`;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?\+03:00$/.test(x.time || "")) err(`${n}: time must be ISO with +03:00 (e.g. 2026-09-27T21:00:00+03:00)`);
  else if (x.time.slice(0, 10) !== date) err(`${n}: time is not on the edition date`);
  if (!x.label || x.label.length > 40) err(`${n}: label missing or longer than 40 chars`);
  if (x.note && x.note.length > 40) err(`${n}: note longer than 40 chars`);
  if (x.duration != null && !(Number.isInteger(x.duration) && x.duration >= 15 && x.duration <= 600)) err(`${n}: duration must be whole minutes, 15–600`);
  if (!validColors(x.colors)) err(`${n}: colors must be [home, away] hex values, or [[home1, home2], [away1, away2]]`);
  if (x.source_url) {
    try {
      const h = new URL(x.source_url).hostname.replace(/^www\./, "");
      if (FOREIGN_CLUBS.test(h)) seenForeign = true;
      else if (seenForeign) err(`${n}: Saudi items must come before foreign-club matches`);
      if (!FOREIGN_CLUBS.test(h) && !OFFICIAL.test(h) && !REPUTABLE.test(h)) err(`${n}: source ${h} is not on the allowed list`);
    } catch { err(`${n}: source_url is not a valid URL`); }
  } else err(`${n}: missing source_url`);
});
}

checkTimeline(ed.timeline, ed.edition_date);

for (const w of warnings) console.log(`WARN: ${w}`);
for (const e of errors) console.log(`FAIL: ${e}`);
console.log(errors.length ? `\n${errors.length} error(s) — do not publish.` : `\nOK — ${cards.length} cards, edition ${ed.edition_date}.`);
process.exit(errors.length ? 1 : 0);
