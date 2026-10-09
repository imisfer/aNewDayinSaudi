#!/usr/bin/env node
// Gate for automatic publishing. Exits non-zero if data/edition.json breaks the editorial contract.
// Usage: node scripts/validate.mjs [path] [--today]   (--today also requires edition_date == today in Riyadh)
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) || "data/edition.json";
const requireToday = args.includes("--today");

// Official Saudi sources are preferred; these reputable outlets are allowed when no official release exists.
const OFFICIAL = /(^|\.)gov\.sa$|(^|\.)spa\.gov\.sa$|(^|\.)pif\.gov\.sa$|(^|\.)sama\.gov\.sa$|(^|\.)stats\.gov\.sa$|(^|\.)vision2030\.gov\.sa$|(^|\.)saudiexchange\.sa$|(^|\.)aramco\.com$|(^|\.)ncm\.gov\.sa$|(^|\.)my\.gov\.sa$/;
const REPUTABLE = /(^|\.)(arabnews\.com|aljazeera\.net|alyaum\.com|the-afc\.com|thenationalnews\.com|reuters\.com|bloomberg\.com|aawsat\.com|alarabiya\.net|okaz\.com\.sa|alriyadh\.com|aleqt\.com|argaam\.com|sabq\.org|saudigazette\.com\.sa|spl\.com\.sa|saff\.com\.sa)$/;
// Arabic letters that join to the following letter (excludes ا أ إ آ د ذ ر ز و ؤ ة ء).
const JOINING = /[\u0626\u0628\u062A-\u062E\u0633-\u063A\u0640-\u0647\u0649\u064A]/;
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

// City events: three columns (Riyadh, Jeddah, other regions). Ticketing and tourism platforms are allowed here only.
const EVENT_HOSTS = /(^|\.)(webook\.com|platinumlist\.net|visitsaudi\.com|experiencealula\.com|riyadhseason\.com|jeddahseason\.sa)$/;
if (ed.regions != null) {
  if (typeof ed.regions !== "object" || Array.isArray(ed.regions)) err("regions must be an object with riyadh, jeddah, other");
  else {
    for (const key of Object.keys(ed.regions)) if (!["riyadh", "jeddah", "other"].includes(key)) err(`regions: unknown key "${key}"`);
    for (const key of ["riyadh", "jeddah", "other"]) {
      const list = ed.regions[key] || [];
      if (!Array.isArray(list)) { err(`regions.${key} must be an array`); continue; }
      if (list.length > 5) err(`regions.${key} has ${list.length} items; maximum is 5`);
      const urls = new Set();
      list.forEach((x, i) => {
        const n = `regions.${key} ${i + 1}`;
        if (!x.title || x.title.length > 45) err(`${n}: title missing or longer than 45 chars`);
        if (!x.place || x.place.length > 30) err(`${n}: place missing or longer than 30 chars`);
        if (key === "other" && x.place && /^(الرياض|جدة)$/.test(x.place)) err(`${n}: "other" items must be outside Riyadh and Jeddah`);
        if (!iso.test(x.start || "")) err(`${n}: start not YYYY-MM-DD`);
        if (x.end && !iso.test(x.end)) err(`${n}: end not YYYY-MM-DD`);
        if (x.end && x.start && x.end < x.start) err(`${n}: end before start`);
        const last = x.end || x.start;
        if (last && ed.edition_date && last < ed.edition_date) err(`${n}: event already over (${last})`);
        if (x.start && ed.edition_date && daysBetween(ed.edition_date, x.start) > 30) err(`${n}: starts more than 30 days ahead (${x.start})`);
        if (x.when && x.when.length > 25) err(`${n}: when longer than 25 chars`);
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
}

// Timeline: today's timed events shown as dots at the bottom (matches, openings, national moments).
const tl = ed.timeline || [];
if (!Array.isArray(tl)) err("timeline must be an array");
if (tl.length > 6) err(`timeline has ${tl.length} items; maximum is 6`);
tl.forEach((x, i) => {
  const n = `timeline ${i + 1}`;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?\+03:00$/.test(x.time || "")) err(`${n}: time must be ISO with +03:00 (e.g. 2026-09-27T21:00:00+03:00)`);
  else if (x.time.slice(0, 10) !== ed.edition_date) err(`${n}: time is not on the edition date`);
  if (!x.label || x.label.length > 40) err(`${n}: label missing or longer than 40 chars`);
  if (x.note && x.note.length > 40) err(`${n}: note longer than 40 chars`);
  if (!Array.isArray(x.colors) || x.colors.length < 1 || x.colors.length > 2 || !x.colors.every((c) => /^#[0-9a-fA-F]{6}$/.test(c))) err(`${n}: colors must be 1–2 hex values like #00732F`);
  if (x.source_url) {
    try {
      const h = new URL(x.source_url).hostname.replace(/^www\./, "");
      if (!OFFICIAL.test(h) && !REPUTABLE.test(h)) err(`${n}: source ${h} is not on the allowed list`);
    } catch { err(`${n}: source_url is not a valid URL`); }
  } else err(`${n}: missing source_url`);
});

for (const w of warnings) console.log(`WARN: ${w}`);
for (const e of errors) console.log(`FAIL: ${e}`);
console.log(errors.length ? `\n${errors.length} error(s) — do not publish.` : `\nOK — ${cards.length} cards, edition ${ed.edition_date}.`);
process.exit(errors.length ? 1 : 0);
