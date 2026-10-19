#!/usr/bin/env node
// Register of news already used: every card and world item published in the last 30 days, read from the git history of
// data/edition.json (the last commit of each edition date counts). A story may appear only once in that window.
// Usage: node scripts/register.mjs [--days 30] [--json]      (prints the register for the editor)
// The validator imports loadRegister() and findRepeats() to block repeats.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 64 << 20 });

export function loadRegister({ days = 30, before } = {}) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  const until = before || today; // entries strictly before this edition date
  const from = new Date(Date.parse(until) - days * 864e5).toISOString().slice(0, 10);
  let log = "";
  // A shallow clone (common in CI) lacks the history the register needs: fetch enough of it first.
  try {
    if (git("rev-parse", "--is-shallow-repository").trim() === "true") git("fetch", "--quiet", `--shallow-since=${days + 10} days ago`);
  } catch { /* offline: fall through and use what history there is */ }
  try {
    log = git("log", `--since=${days + 10}.days`, "--format=%H", "--", "data/edition.json");
  } catch {
    return { entries: [], from, until, ok: false };
  }
  const byDate = new Map(); // newest commit first, so the first version seen for a date is its final one
  for (const hash of log.split("\n").filter(Boolean)) {
    let ed;
    try { ed = JSON.parse(git("show", `${hash}:data/edition.json`)); } catch { continue; }
    const d = ed.edition_date;
    if (!d || d >= until || d < from || byDate.has(d)) continue;
    byDate.set(d, [...(ed.cards || []), ...(ed.world || [])].map((c) => ({
      date: d, story: c.story || null, title: c.title || "", keyword: c.keyword || "",
      summary: c.summary || "", source_url: c.source_url || "",
    })));
  }
  const entries = [...byDate.values()].flat().sort((a, b) => (a.date < b.date ? 1 : -1));
  return { entries, from, until, ok: true };
}

// --- Matching -------------------------------------------------------------------------------------
const STOP = new Set(["في", "من", "على", "الى", "إلى", "عن", "مع", "و", "او", "أو", "ان", "أن", "التي", "الذي", "بعد", "قبل",
  "خلال", "حتى", "منذ", "بين", "عبر", "لدى", "هذا", "هذه", "ذلك", "كما", "اول", "أول", "جديد", "جديده", "السعوديه", "السعودي",
  "المملكه", "سعودي", "سعوديه", "ب", "ل", "ك", "ف"]);
const norm = (s) => (s || "")
  .replace(/[ً-ْـ]/g, "")           // diacritics, tatweel
  .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
  .replace(/[«»"'“”‘’(),.:؛،!?؟\-–—/%]/g, " ")
  .toLowerCase();
function tokens(s) {
  const out = new Set();
  for (let w of norm(s).split(/\s+/)) {
    if (!w) continue;
    if (/^و..../.test(w)) w = w.slice(1);            // leading «و»
    if (/^(بال|لل|وال|فال|كال)../.test(w)) w = w.replace(/^(بال|وال|فال|كال)/, "").replace(/^لل/, "");
    else if (/^ال.../.test(w)) w = w.slice(2);       // article
    if (w.length < 2 || STOP.has(w)) continue;
    out.add(w);
  }
  return out;
}
const numbers = (s) => new Set((norm(s).match(/\d[\d,.]*/g) || []).map((n) => n.replace(/[,.]$/, "")).filter((n) => !/^(19|20)\d\d$/.test(n) && n.length > 1));
const jaccard = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
// A link identifies a story only when it points at a specific page (not a site's home or language root like /en/).
const urlKey = (u) => {
  try {
    const x = new URL(u);
    const path = x.pathname.replace(/\/$/, "");
    if (path.split("/").filter(Boolean).length < 2 && path.length < 12) return null;
    return (x.hostname.replace(/^www\./, "") + path + x.search).toLowerCase();
  } catch { return null; }
};

// For one card, the register entries it repeats. level "error" blocks publishing; "warn" asks the editor to look.
// A card with "follows": "<story id or YYYY-MM-DD>" is a genuinely new development of an earlier story (a final after a
// semi-final, results after an opening): look-alike titles then only warn. A repeated link or story id still blocks.
export function findRepeats(card, entries) {
  const hits = [];
  const t = tokens(card.title + " " + card.keyword);
  const n = numbers(card.title + " " + card.summary);
  for (const e of entries) {
    if (card.story && e.story && card.story === e.story) { hits.push({ level: "error", why: `same story id "${e.story}"`, e }); continue; }
    const k = urlKey(card.source_url);
    if (k && k === urlKey(e.source_url)) { hits.push({ level: "error", why: "same source link", e }); continue; }
    const sim = jaccard(t, tokens(e.title + " " + e.keyword));
    let shared = 0; for (const x of numbers(e.title + " " + e.summary)) if (n.has(x)) shared++;
    const how = `title overlap ${Math.round(sim * 100)}%${shared ? `, ${shared} shared figures` : ""}`;
    const followUp = card.follows && (card.follows === e.story || card.follows === e.date);
    const strong = sim >= 0.5 || (sim >= 0.3 && shared >= 2);
    const weak = sim >= 0.34 || (sim >= 0.2 && shared >= 2);
    if (strong && !followUp) hits.push({ level: "error", why: `same story (${how})`, e });
    else if (strong || weak) hits.push({ level: "warn", why: followUp ? `follow-up (${how}): make sure it adds a new fact` : `possibly the same story (${how})`, e });
  }
  return hits;
}

// --- CLI ------------------------------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const days = +(args[args.indexOf("--days") + 1] || 30) || 30;
  const reg = loadRegister({ days });
  if (args.includes("--json")) { console.log(JSON.stringify(reg, null, 2)); process.exit(0); }
  console.log(`News register: ${reg.entries.length} stories used ${reg.from} → ${reg.until} (exclusive). Do not reuse any of them.\n`);
  for (const e of reg.entries) console.log(`${e.date}  ${e.story ? `[${e.story}] ` : ""}${e.title}\n            ${e.source_url}`);
}
