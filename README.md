# يوم جديد في السعودية — aNewDayinSaudi

A one-screen, Arabic-first daily briefing on what's happening in Saudi Arabia: dated, sourced, calm. Under a minute of reading.

## What's in v0.1
- `index.html`: the page (RTL, mobile-first, light/dark).
- `data/edition.json`: today's edition. A headline, 5–8 cards, indicators and upcoming events. **Every card needs a `date` and a `source_url`.**
- `assets/app.js`: renders the edition, the Hijri (Umm al-Qura) and Gregorian dates, prayer times (computed on-device with [adhan-js](https://github.com/batoulapps/adhan-js), Umm al-Qura method), and weather ([Open-Meteo](https://open-meteo.com), no key).
- No cookies, no analytics, no ads. The only third-party requests are Google Fonts and Open-Meteo.

## Publishing an edition (pilot: manual)
1. Edit `data/edition.json`.
2. Commit to `main`. GitHub Pages redeploys in about a minute.

## Editorial rules
- Factual, dated, traceable. Official sources first (SPA, ministries, GASTAT, PIF, SAMA).
- Summarize in our own words and link out. Don't republish articles.
- No exaggeration, no clickbait, no doom framing.

## Next steps
- Pipeline: collect from official feeds, AI summarizes into `edition.json` as a draft PR, human approves by merging.
- City picker for weather and prayer times (stored on-device).
- English toggle.
- Live indicators (Tadawul, Brent) from a licensed source.

Prayer-times library: adhan-js, MIT License.
