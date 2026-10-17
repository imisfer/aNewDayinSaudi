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

## News register (each story once in 30 days)
The same news often surfaces on different platforms days apart. Every card published in the last 30 days is in the register, built from the git history of `data/edition.json`, and a story may be used only once in that window.
- Before choosing cards, run `node scripts/register.mjs` and read it. Skip anything already there, even if today's source is different, newer or worded differently.
- Give each card a `story` id: a short lowercase English slug for the underlying news (e.g. `riyadh-season-2026-launch`, `inflation-2026-09`). The same news always gets the same id.
- A genuinely new development of an earlier story (results after an opening, a final after a semi-final, a new figure) may run, with `follows` set to the earlier card's `story` id or edition date. It must add a new fact; a restatement is a repeat.
- Link each card to the specific article or release page, not a site's home page.
- The validator blocks a card that reuses a register entry's link or `story` id, or whose title clearly matches one, and warns on close matches. Read the warnings.

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
- **Foreign clubs (fill-in only).** On days they play, matches of these clubs may also go on the line, after every Saudi item and only while there is room within the 6:

  | Club | Label | Official fixtures | Kit colour |
  |---|---|---|---|
  | Real Madrid | ريال مدريد | realmadrid.com | #ffffff |
  | FC Barcelona | برشلونة | fcbarcelona.com | #a50044, #004d98 |
  | Manchester City | مانشستر سيتي | mancity.com | #6cabdd |
  | Liverpool | ليفربول | liverpoolfc.com | #c8102e |
  | Manchester United | مانشستر يونايتد | manutd.com | #da291c |
  | Bayern Munich | بايرن ميونخ | fcbayern.com | #dc052d |

  Take the kick-off from the club's own fixtures page (or the competition's) on the day, convert it to Riyadh time, and skip matches that start after midnight Riyadh time. `note` is the competition · city, e.g. «الدوري الإسباني · مدريد». Changing this list is an editorial decision: edit the table and the validator's `FOREIGN_CLUBS` together.
- `time`: ISO with +03:00, on today's date, following the match-time rules below.
- `label` ≤ 40 chars: the match written as «الهلال × النصر», or the event name. `note` ≤ 40 chars: competition · city.
- `colors`: 1–2 hex colours. For matches use each team's main kit colour (home first). Never use club logos.
- Optional `duration` in minutes. Matches (a label with «×») default to 105 minutes (used to fade them once over); every timed item shows as a two-colour dot at its start time, and the text shows the start time only.
- Leave the array empty on days with nothing timed.

## Match times (timeline and city events)
Kick-off times change at short notice, sometimes the day before. Every match time in the edition follows these two rules:
1. **Official fixtures only.** Take the time from the organiser's own fixtures page: spl.com.sa (Roshn Saudi League), saff.com.sa (national teams, King's Cup and other federation competitions), the-afc.com (AFC competitions), or either club's official website. Never from round previews or news articles.
2. **Checked on the day.** Re-check every match time on the edition date itself, even if it was confirmed earlier. If today's time can't be confirmed on the official page, drop the item from `timeline` and remove `time` from the city event so it shows as all-day, rather than risk a stale kick-off.

## City events (Riyadh fixed, plus two cities the reader picks)
`regions` lists the top events per city. The page always shows Riyadh, plus two cities each reader picks from a fixed list (default جدة and the first other city with events). So every city below needs its own research each day.
- Keys and cities: `riyadh` الرياض · `jeddah` جدة · `makkah` مكة (مكة المكرمة) · `madinah` المدينة (المدينة المنورة) · `eastern` الدمام (Dammam, Khobar, Dhahran) · `alula` العلا · `abha` أبها · `taif` الطائف · `tabuk` تبوك. Don't use `other` (legacy) and don't add keys outside this list; an event elsewhere is left out.
- Sources: ticketing and tourism platforms are the primary source here. Check each in turn: webook.com, the city calendars on platinumlist.net (e.g. riyadh.platinumlist.net/calendar/this-weekend, jeddah.platinumlist.net/calendar/this-weekend, khobar.platinumlist.net), visitsaudi.com, experiencealula.com, the Riyadh/Jeddah season sites, and official announcements (SPA, ministries, Ministry of Culture, Events Investment Fund, regional municipalities). Link each item to its own event page.
- Window: events running today or starting within the next 7 days. If a city has fewer than 2 such items, extend that city up to 30 days ahead, soonest first.
- What counts as "top": festivals, national and international sports, exhibitions and fairs, concerts by well-known artists, theatre and comedy by known names, family attractions with a limited run, and for Makkah and Madinah notable cultural or service openings and exhibitions. Prefer what a general family audience would want to know about.
- Women's football has a small following in Saudi Arabia, so don't prioritise it: include a women's league match only when the city would otherwise have fewer than 2 items, and list it after the other events.
- Leave out: nightclub-style parties, brunches, restaurants, beach-club or pool passes, gyms, and permanent attractions (theme parks, standing venues) unless something new opens.
- 0–5 items per city, ordered by date. If nothing qualifies, leave the city's array empty or omit the key; the page says «لا فعاليات بارزة هذا الأسبوع». Never pad.
- Fields: `title` ≤ 45 chars (the event in plain Arabic, e.g. «حفل ندى القلعة», «افتتاح موسم الرياض للسباقات»); `place` ≤ 30 chars (venue or district); `start` and optional `end` as YYYY-MM-DD; optional `when` ≤ 25 chars for recurring items («كل سبت من 24 أكتوبر», «يوميًا»); the today panel (hover/tap the date tile) shows an item on the days its `when` matches; optional `time` (HH:MM, Riyadh time; matches follow the match-time rules above, other events are verified on their event page) puts the item on today's line on its day instead of the all-day list, with optional `duration` (minutes; matches default to 105) and `colors` (1–2 hex, home kit first, for matches); `source_url`.
- **Experiences (no set date).** Besides dated events, a city may list up to 2 bookable experiences that run on most days: guided hikes, heritage and desert tours, diving and snorkelling trips, stargazing, cooking or craft workshops. They appear after the dated events with a small «تجربة» tag, so the heading «احجـز لحظتك هـذا الأسبـوع» always has something to book.
  - Fields: `kind: "experience"`, `title`, `place`, `available` ≤ 30 chars («يوميًا», «يوميًا حتى مارس», «الخميس والجمعة»), optional `until` (YYYY-MM-DD, end of season), `source_url` to the booking page. No `start`, `end`, `time` or `when`.
  - Only experiences that are bookable now: check the booking page shows open dates this week and that the season is running (summer heat closes many outdoor trips).
  - Sources: visitsaudi.com, experiencealula.com, webook.com, the Red Sea and Soudah destination sites, and official regional tourism pages.
  - Family-friendly and safe; no extreme or unlicensed operators. Rotate: don't show the same experience in the same city two editions running when another qualifies.
- Verify the dates on the event page itself. If a listing contradicts itself, use the event page or drop the item.

## Upcoming national events
- `events`: upcoming dated national events in the next 30 days, from official sources only.
- Fields: `date` (first day, YYYY-MM-DD), optional `end` for multi-day events, and `title`. Don't put dates in the title; the page shows the date or range once, before the title.

## Publishing
1. Write `data/edition.json` with `edition_date` = today (Asia/Riyadh) and `status: "pilot"`.
2. Run `node scripts/validate.mjs --today` (it also checks the news register). If it fails, fix the edition and re-run. Never publish a failing edition.
3. If a valid edition can't be produced, change nothing. The page will label the previous edition "آخر تحديث".
4. Commit to `main` as `edition: YYYY-MM-DD` and push.
