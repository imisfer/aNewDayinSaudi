# يوم جديد في السعودية — aNewDayinSaudi

A one-screen, Arabic-first daily briefing on what's happening in Saudi Arabia: dated, sourced, calm. Under a minute of reading.

## What's in v0.1
- `index.html`: the page (RTL, mobile-first, light/dark).
- `data/edition.json`: today's edition. A headline, 5–8 cards, the day timeline, city events per city (Riyadh fixed, plus two reader-picked cities from: Riyadh, Jeddah, Makkah, Madinah, Dammam–Khobar, AlUla, Abha, Taif, Tabuk) and upcoming national events. **Every card needs a `date` and a `source_url`.**
- `assets/app.js`: renders the edition, the Hijri (Umm al-Qura) and Gregorian dates, prayer times (computed on-device with [adhan-js](https://github.com/batoulapps/adhan-js), Umm al-Qura method), and weather ([Open-Meteo](https://open-meteo.com), no key).
- No cookies, no analytics, no ads. The only third-party request is Open-Meteo. Fonts (Thmanyah Sans and Thmanyah Serif Display) are self-hosted in `assets/fonts/`.

## Publishing an edition (automatic, daily)
- Every morning (~5:20 Riyadh) a scheduled Claude run researches the last days' news, writes `data/edition.json` following [`EDITORIAL.md`](EDITORIAL.md), and pushes to `main`. GitHub Pages redeploys in about a minute.
- `scripts/validate.mjs` is the gate: the run only publishes if `node scripts/validate.mjs --today` passes (fields, dates, 3–8 cards, allowed sources, length limits, no sensational wording, and no story repeated from the last 30 days).
- `scripts/register.mjs` prints the news register: every card used in the last 30 days, read from the git history of `data/edition.json`. The validator uses it to block repeats.
- If no valid edition can be produced, nothing is pushed and the page labels the previous edition "آخر تحديث".
- To change what gets selected or how it's written, edit `EDITORIAL.md`.

## Sharing and delivery
- **Install:** `manifest.webmanifest` and `assets/icons/` let readers add the page to their home screen (Android and iOS).
- **Link preview:** Open Graph tags point to `share/today.png`, rebuilt with each edition, so a pasted link shows today's headline in WhatsApp, X and iMessage.
- **Share button:** under the headline. It opens the phone's share sheet, or copies the headline and link where there is none.
- **WhatsApp Channel:** `share/post.png` and `share/whatsapp.txt` are the day's post, ready to paste. WhatsApp has no API for posting to a Channel, so posting is manual.
- **RSS:** `feed.xml` (last 14 editions) works with any feed reader, and with RSS-to-email services for a morning email.
- `scripts/build-share.mjs` builds all four from `data/edition.json`. The site address is set once, in `SITE` at the top of that script and in the `og:` tags in `index.html`.

## Versioning
- The footer shows `الإصدار vX.Y · date`. Bump it on every code or design change, in the footer and in the `?v=` on `style.css` and `app.js` in `index.html` (all three must match). The `?v=` makes browsers fetch the new files instead of a cached copy.
- Daily edition pushes don't change the version.

## Editorial rules
- Factual, dated, traceable. Official sources first (SPA, ministries, GASTAT, PIF, SAMA).
- Summarize in our own words and link out. Don't republish articles.
- No exaggeration, no clickbait, no doom framing.

## Next steps
- City picker for weather and prayer times (stored on-device).
- English toggle.
- Live indicators (Tadawul, Brent) from a licensed source.

Prayer-times library: adhan-js, MIT License.
