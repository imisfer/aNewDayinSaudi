#!/usr/bin/env node
// Builds the files that carry each edition beyond the page, from data/edition.json:
//   share/today.png     1200×630 link-preview image (og:image), rebuilt daily
//   share/post.png      1080×1350 portrait image for the WhatsApp Channel post
//   share/whatsapp.txt  the WhatsApp Channel post text, ready to paste
//   feed.xml            RSS feed of the last 14 editions (lets any RSS-to-email or reader service deliver it)
// Usage: node scripts/build-share.mjs            (run after `node scripts/validate.mjs --today` passes)
// Needs Playwright with Chromium (preinstalled in the scheduled run's environment).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

export const SITE = "https://imisfer.github.io/aNewDayinSaudi/";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TZ = "Asia/Riyadh";
const at = (iso) => new Date(iso + "T12:00:00+03:00");
const greg = (iso, opts) => new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { timeZone: TZ, ...opts }).format(at(iso));
const hijri = (iso) => new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(at(iso));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Same riyal rule as the page (SAMA usage: sign after the number or its written value); the Thmanyah ligature draws «ر.س» as the sign.
const RIYAL = /(\d[\d.,٬٫]*)\s*(?:(ألف|آلاف|مليون|ملايين|مليار|مليارات|تريليون)\s*)?ريال(?:ًا|اً|ا)?(?![ء-يٱ-ۓ])/g;
const toSign = (t) => String(t ?? "").replace(RIYAL, (_, n, m) => n + (m ? " " + m : "") + " ر.س");

function headlineHTML(ed) {
  // Key phrases that open cards on the page are underlined here too.
  let h = esc(toSign(ed.headline));
  const keys = (ed.cards || []).map((c) => c.keyword).filter(Boolean).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const e = esc(toSign(k));
    const i = h.indexOf(e);
    if (i >= 0) h = h.slice(0, i) + `<u>${e}</u>` + h.slice(i + e.length);
  }
  return h;
}
const chips = (ed) => (ed.cards || []).filter((c) => c.keyword && !(ed.headline || "").includes(c.keyword)).slice(0, 3);
const liveNotices = (ed) => (ed.notices || []).filter((n) => n.title && (!n.until || n.until >= ed.edition_date)).slice(0, 2);

function cardPage(ed, w, h) {
  const font = (f) => pathToFileURL(join(ROOT, "assets/fonts", f)).href;
  const portrait = h > w;
  const ch = chips(ed), ns = liveNotices(ed);
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face { font-family: TS; src: url("${font("thmanyahsans-Regular.woff2")}"); font-weight: 400; }
@font-face { font-family: TS; src: url("${font("thmanyahsans-Bold.woff2")}"); font-weight: 700; }
@font-face { font-family: TD; src: url("${font("thmanyahserifdisplay-Bold.woff2")}"); font-weight: 700; }
@font-face { font-family: TD; src: url("${font("thmanyahserifdisplay-Light.woff2")}"); font-weight: 300; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${w}px; height: ${h}px; }
body { background: #f7f5f0; color: #1b1f1d; font-family: TS, sans-serif; padding: ${portrait ? "84px 76px" : "52px 64px"}; display: flex; flex-direction: column; gap: ${portrait ? 40 : 22}px; position: relative; overflow: hidden; }
body::after { content: ""; position: absolute; inset: auto 0 0 0; height: ${portrait ? 18 : 12}px; background: #0b5d3b; }
header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
.title { font-family: TD; font-weight: 700; font-size: ${portrait ? 64 : 46}px; line-height: 1.3; font-feature-settings: "swsh" 1; color: #6f58b0; white-space: nowrap; }
.date { text-align: left; font-size: ${portrait ? 26 : 20}px; line-height: 1.5; color: #5f6763; white-space: nowrap; }
.date b { display: block; color: #1b1f1d; font-weight: 700; }
h1 { font-family: TD; font-weight: 700; font-size: ${portrait ? 72 : 54}px; line-height: 1.55; text-wrap: balance; }
.mid { flex: 1; display: flex; align-items: center; min-height: 0; }
h1 u { color: #0b5d3b; text-decoration-style: dotted; text-decoration-thickness: 3px; text-underline-offset: ${portrait ? 16 : 12}px; }
.also { font-size: ${portrait ? 30 : 22}px; color: #5f6763; display: flex; gap: 14px; flex-wrap: wrap; }
.also b { color: #1b1f1d; } .also span { color: #0b5d3b; font-weight: 700; }
.notice { border-right: 5px solid #0b5d3b; background: #fff; padding: 14px 20px; font-size: ${portrait ? 28 : 21}px; line-height: 1.5; border-radius: 12px 0 0 12px; }
.notice b { color: #0b5d3b; margin-left: 10px; }
footer { display: flex; justify-content: space-between; align-items: baseline; font-size: ${portrait ? 24 : 18}px; color: #5f6763; padding-bottom: 8px; }
footer .url { direction: ltr; font-weight: 700; color: #0b5d3b; }
</style></head><body>
<header><p class="title">يومٌ جديد في السُعوديَّة</p><p class="date"><b>${esc(greg(ed.edition_date, { weekday: "long", day: "numeric", month: "long" }))}</b>${esc(hijri(ed.edition_date))}</p></header>
<div class="mid"><h1>${headlineHTML(ed)}</h1></div>
${ns.map((n) => `<p class="notice"><b>يهمّك اليوم</b>${esc(n.title)}</p>`).join("")}
${ch.length ? `<p class="also"><b>وأيضًا</b>${ch.map((c) => `<span>${esc(toSign(c.keyword))}</span>`).join("")}</p>` : ""}
<footer><span>كل خبر مؤرخ ومربوط بمصدره</span><span class="url">${esc(SITE.replace(/^https:\/\//, "").replace(/\/$/, ""))}</span></footer>
</body></html>`;
}

async function renderImages(ed, outDir) {
  const require = createRequire(import.meta.url);
  let chromium;
  try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("/opt/npm-tools/node_modules/playwright")); }
  const browser = await chromium.launch();
  try {
    for (const [name, w, h] of [["today.png", 1200, 630], ["post.png", 1080, 1350]]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      const tmp = join(outDir, `.${name}.html`);
      writeFileSync(tmp, cardPage(ed, w, h));
      await page.goto(pathToFileURL(tmp).href);
      await page.evaluate(() => document.fonts.ready);
      // Shrink the headline until the page fits (long headlines on the wide card).
      await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        let size = parseFloat(getComputedStyle(h1).fontSize);
        while (document.body.scrollHeight > innerHeight && size > 26) { size -= 2; h1.style.fontSize = size + "px"; }
      });
      await page.screenshot({ path: join(outDir, name) });
      await page.close();
      execFileSync("rm", ["-f", tmp]);
    }
  } finally { await browser.close(); }
}

function whatsappText(ed) {
  const lines = [`*يوم جديد في السعودية*`, `${greg(ed.edition_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${hijri(ed.edition_date)}`, "", toSign(ed.headline), ""];
  const ns = liveNotices(ed);
  if (ns.length) { lines.push("*يهمّك اليوم*"); for (const n of ns) lines.push(`▪️ ${n.title}${n.issuer ? ` (${n.issuer})` : ""}`); lines.push(""); }
  for (const c of (ed.cards || []).slice(0, 8)) lines.push(`• ${toSign(c.title)}`);
  lines.push("", `التفاصيل ومصدر كل خبر: ${SITE}`);
  return lines.join("\n") + "\n";
}

function editions(current, n = 14) {
  // The latest version of each edition date in git history, plus the working copy (today's, possibly uncommitted).
  const byDate = new Map([[current.edition_date, current]]);
  let log = "";
  try { log = execFileSync("git", ["log", "--format=%H", "-n", "200", "--", "data/edition.json"], { cwd: ROOT, encoding: "utf8" }); } catch { /* no history */ }
  for (const hash of log.split("\n").filter(Boolean)) {
    if (byDate.size >= n) break;
    try {
      const ed = JSON.parse(execFileSync("git", ["show", `${hash}:data/edition.json`], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 << 20 }));
      if (ed.edition_date && !byDate.has(ed.edition_date)) byDate.set(ed.edition_date, ed);
    } catch { /* skip */ }
  }
  return [...byDate.values()].sort((a, b) => (a.edition_date < b.edition_date ? 1 : -1)).slice(0, n);
}

function rss(list) {
  const rfc = (iso) => new Date(iso + "T05:30:00+03:00").toUTCString();
  const items = list.map((ed) => {
    const body = [
      ...(liveNotices(ed).length ? [`<p><b>يهمّك اليوم:</b> ${liveNotices(ed).map((n) => esc(n.title)).join(" · ")}</p>`] : []),
      "<ul>",
      ...(ed.cards || []).map((c) => `<li><b>${esc(toSign(c.title))}</b> ${esc(toSign(c.summary))} <a href="${esc(c.source_url)}">${esc(c.source_name || "المصدر")}</a></li>`),
      "</ul>",
    ].join("");
    return `  <item>
    <title>${esc(toSign(ed.headline))}</title>
    <link>${SITE}#${ed.edition_date}</link>
    <guid isPermaLink="false">anewdayinsaudi-${ed.edition_date}</guid>
    <pubDate>${rfc(ed.edition_date)}</pubDate>
    <description><![CDATA[${body.replace(/]]>/g, "]]&gt;")}]]></description>
  </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>يوم جديد في السعودية</title>
  <link>${SITE}</link>
  <atom:link href="${SITE}feed.xml" rel="self" type="application/rss+xml"/>
  <description>موجز يومي هادئ لما يحدث في المملكة. كل خبر مؤرخ ومربوط بمصدره.</description>
  <language>ar</language>
  <lastBuildDate>${rfc(list[0].edition_date)}</lastBuildDate>
${items}
</channel>
</rss>
`;
}

const ed = JSON.parse(readFileSync(join(ROOT, "data/edition.json"), "utf8"));
const outDir = join(ROOT, "share");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "whatsapp.txt"), whatsappText(ed));
writeFileSync(join(ROOT, "feed.xml"), rss(editions(ed)));
await renderImages(ed, outDir);
console.log(`share/today.png, share/post.png, share/whatsapp.txt and feed.xml built for ${ed.edition_date}`);
