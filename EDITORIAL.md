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

## Headline (the lead readers tap)
Cards are not shown as a list. The one-line `headline` (≤ 140 characters) is the lead: it names the 2–3 strongest items, and each card's `keyword` that appears in it becomes a tappable phrase opening that card's details and source. Cards whose keyword isn't in the headline appear under it as "وأيضًا" chips.
- Every card needs a `keyword`: 1–4 words. At least 2 keywords must appear verbatim in the headline.
- Headline keywords should be the natural subject of each clause (e.g. «موسم الرياض», «149 مصنعًا»). Put quotation marks inside the keyword: «توريد», not توريد.
- For chip-only cards the keyword is the chip label, so make it self-explanatory (e.g. «التضخم 1.8%», «ناقل جوي جديد»).
- Never attach a joining letter to a headline keyword (write «في موسم الرياض», not «بموسم الرياض»); a leading «و» is fine.
- No keyword may contain another.
- Order cards from strongest to weakest; chips follow that order.

## Timeline (dots at the bottom of the screen)
`timeline` holds today's timed moments. Each one shows as a dot at its time on a Fajr-to-midnight line, with a small bubble on tap. The next one within 3 hours shows its bubble automatically.
- Include: Saudi national team matches; Roshn Saudi League and King's Cup matches for Al-Hilal, Al-Nassr, Al-Ittihad, Al-Ahli, Al-Qadsiah and Al-Shabab; Saudi clubs in AFC competitions; major tournaments hosted in Saudi Arabia (all their matches); official openings or national moments with a set time.
- At most 6 items. If there are more, keep the national team first, then the biggest clubs.
- `time`: ISO with +03:00, on today's date, verified against a fixture source (spl.com.sa, saff.com.sa, the-afc.com or a reputable outlet).
- `label` ≤ 40 chars: the match written as «الهلال × النصر», or the event name. `note` ≤ 40 chars: competition · city.
- `colors`: 1–2 hex colours. For matches use each team's main kit colour (home first). Never use club logos.
- Leave the array empty on days with nothing timed.

## Indicators and events
- Indicators: only figures with a dated official source (e.g., latest inflation, GDP, PMI). Leave the array empty rather than guess. No live prices (Tadawul, Brent) until a licensed feed exists.
- Events: upcoming dated national events in the next 30 days, from official sources only.

## Publishing
1. Write `data/edition.json` with `edition_date` = today (Asia/Riyadh) and `status: "pilot"`.
2. Run `node scripts/validate.mjs --today`. If it fails, fix the edition and re-run. Never publish a failing edition.
3. If a valid edition can't be produced, change nothing. The page will label the previous edition "آخر تحديث".
4. Commit to `main` as `edition: YYYY-MM-DD` and push.
