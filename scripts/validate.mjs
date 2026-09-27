#!/usr/bin/env node
// Gate for automatic publishing. Exits non-zero if data/edition.json breaks the editorial contract.
// Usage: node scripts/validate.mjs [path] [--today]   (--today also requires edition_date == today in Riyadh)
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) || "data/edition.json";
const requireToday = args.includes("--today");

// Official Saudi sources are preferred; these reputable outlets are allowed when no official release exists.
const OFFICIAL = /(^|\.)gov\.sa$|(^|\.)spa\.gov\.sa$|(^|\.)pif\.gov\.sa$|(^|\.)sama\.gov\.sa$|(^|\.)stats\.gov\.sa$|(^|\.)vision2030\.gov\.sa$|(^|\.)saudiexchange\.sa$|(^|\.)aramco\.com$|(^|\.)ncm\.gov\.sa$|(^|\.)my\.gov\.sa$/;
const REPUTABLE = /(^|\.)(arabnews\.com|thenationalnews\.com|reuters\.com|bloomberg\.com|aawsat\.com|alarabiya\.net|okaz\.com\.sa|alriyadh\.com|aleqt\.com|argaam\.com|sabq\.org|saudigazette\.com\.sa|spl\.com\.sa|saff\.com\.sa)$/;
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

if (!Array.isArray(ed.cards)) err("cards must be an array");
const cards = ed.cards || [];
if (cards.length < 3) err(`only ${cards.length} cards; minimum to publish is 3`);
else if (cards.length < 5) warn(`${cards.length} cards; target is 5–8`);
if (cards.length > 8) err(`${cards.length} cards; maximum is 8`);

const seen = new Set();
cards.forEach((c, i) => {
  const n = `card ${i + 1}`;
  for (const k of ["category", "title", "summary", "date", "source_name", "source_url"]) {
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

for (const [i, x] of (ed.indicators || []).entries()) {
  for (const k of ["label", "value", "note", "source_url"]) if (!x[k]) err(`indicator ${i + 1}: missing ${k}`);
}
for (const [i, x] of (ed.events || []).entries()) {
  if (!iso.test(x.date || "")) err(`event ${i + 1}: date not YYYY-MM-DD`);
  if (!x.title) err(`event ${i + 1}: missing title`);
  if (x.date && ed.edition_date && x.date < ed.edition_date) err(`event ${i + 1}: date is in the past`);
}

for (const w of warnings) console.log(`WARN: ${w}`);
for (const e of errors) console.log(`FAIL: ${e}`);
console.log(errors.length ? `\n${errors.length} error(s) — do not publish.` : `\nOK — ${cards.length} cards, edition ${ed.edition_date}.`);
process.exit(errors.length ? 1 : 0);
