# Editorial playbook — daily automatic edition

This file is the brief for the automated editor that publishes `data/edition.json` every morning. Change the rules here, not in the scheduler.

## Goal
One screen, under a minute of reading: what happened in Saudi Arabia in the last 24–72 hours that is constructive, factual and relevant to citizens.

## Sources (in order of preference)
1. **Official:** SPA (spa.gov.sa), ministries and authorities (*.gov.sa), GASTAT (stats.gov.sa), PIF (pif.gov.sa), SAMA (sama.gov.sa), Saudi Exchange (saudiexchange.sa), Vision 2030 (vision2030.gov.sa), NCM weather (ncm.gov.sa).
2. **Reputable, only when no official release is findable:** Arab News, Asharq Al-Awsat, Al Arabiya, Okaz, Al Riyadh, Al Eqtisadiah, Argaam, Saudi Gazette, The National, Reuters, Bloomberg.
Always look for the official release first and link to it.

## What goes in
National achievements, Vision 2030 milestones, economic indicators, new projects and openings, science, sports, culture, and new government services that affect citizens.

## What stays out
Crime, accidents, disputes, politics and foreign conflicts, rumours, anything that cannot be traced to a dated source, and anything older than 14 days.

## Rules for every card
- **Verify before writing.** Open the source and confirm each number, name and date. If a figure can't be confirmed, drop it or drop the card.
- Write in our own words in formal, warm Modern Standard Arabic. Never copy sentences from the source.
- Title ≤ 70 characters. Summary ≤ 35 words, one or two sentences, with a concrete number or fact where possible.
- `date` = the date of the event or release, not today's date.
- Claim only what the source says. No "every year", "first ever" or "largest" unless the source says it.
- No sensational words (عاجل، صادم، مذهل، كارثة…) and no exaggeration.
- 5–8 cards. If fewer than 5 items pass verification, publish fewer (minimum 3). Never pad with weak items.
- Mix categories; avoid more than 2 cards from the same category.

## Headline
One line (≤ 140 characters) summarising the 2–3 strongest items. It must only mention items that appear as cards.

## Indicators and events
- Indicators: only figures with a dated official source (e.g., latest inflation, GDP, PMI). Leave the array empty rather than guess. No live prices (Tadawul, Brent) until a licensed feed exists.
- Events: upcoming dated national events in the next 30 days, from official sources only.

## Publishing
1. Write `data/edition.json` with `edition_date` = today (Asia/Riyadh) and `status: "pilot"`.
2. Run `node scripts/validate.mjs --today`. If it fails, fix the edition and re-run. Never publish a failing edition.
3. If a valid edition can't be produced, change nothing. The page will label the previous edition "آخر تحديث".
4. Commit to `main` as `edition: YYYY-MM-DD` and push.
