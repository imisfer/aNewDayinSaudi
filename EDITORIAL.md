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
Crime, accidents, disputes, politics and foreign conflicts, rumours, anything that cannot be traced to a dated source, and anything older than 14 days (60 for «بعيون العالم»).

## Rules for every card
- **Verify before writing.** Open the source and confirm each number, name and date. If a figure can't be confirmed, drop it or drop the card.
- Write in our own words in formal, warm Modern Standard Arabic. Never copy sentences from the source.
- Title ≤ 70 characters. Summary ≤ 35 words, one or two sentences, with a concrete number or fact where possible.
- `date` = the date of the event or release, not today's date.
- Claim only what the source says. No "every year", "first ever" or "largest" unless the source says it.
- Amounts in riyals: write the word as usual («1.3 مليار ريال», «بـ500 ريال»). The page replaces «ريال» after a number with the Saudi riyal sign, placed per SAMA's usage rules: to the left of the number or of its written value, with a space («251.7 مليار ر.س»; the Thmanyah fonts draw «ر.س» as the sign). Don't type the sign or «ر.س» yourself.
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

## «يهمّك اليوم» (official service notices)
`notices` holds 0–4 notices that change a citizen's day: school schedule changes (remote learning, suspensions), airport and flight status, NCM weather alerts, a public holiday or office-hours change, a ministry service going down or changing. It shows as a small block right under the headline and hides when empty.
- **The service change, stated plainly.** Say what changes, for whom, where, and until when: «الدراسة عن بُعد عبر منصة مدرستي لمدارس الرياض والدرعية». Never the security event behind it (no attacks, interceptions, debris, names of parties); the validator rejects those words. No sensational wording.
- **From the issuer.** Link the issuing body's own release (`*.gov.sa`, SPA). When the body announced it only on its social account, a reputable Saudi outlet that names the body may stand in. Name the body in `issuer` («تعليم الرياض»، «المركز الوطني للأرصاد»، «الهيئة العامة للطيران المدني»).
- **Checked on the day.** Notices change at short notice and are sometimes reversed within hours. Confirm each one on the edition date; if the latest word can't be confirmed, leave it out.
- **Research it every day**, before the cards: search for «تعليق الدراسة», «الدراسة عن بعد», «تنبيه الأرصاد», «الطيران المدني» and the like for the last 48 hours. An empty block must be a finding.
- Fields: `title` ≤ 90 chars, `issuer` ≤ 30, optional `area` ≤ 25 («الرياض والدرعية»), `date` (announced, within 7 days), optional `until` (last day it applies; without it the notice runs 2 days at most), `source_url`.
- A notice is not a card: it doesn't enter the headline, the news register or the 30-day repeat check, and it may repeat while it still applies.

## Timeline (dots at the bottom of the screen)
`timeline` holds today's timed moments. Each one shows as a dot at its time on a Fajr-to-midnight line, with a small bubble on tap. The next one within 3 hours shows its bubble automatically.
- Include: Saudi national team matches; Roshn Saudi League and King's Cup matches for Al-Hilal, Al-Nassr, Al-Ittihad, Al-Ahli, Al-Qadsiah and Al-Shabab; Saudi clubs in AFC competitions; major tournaments hosted in Saudi Arabia (all their matches); official openings or national moments with a set time.
- At most 6 items. If there are more, keep the national team first, then the biggest clubs.
- **Foreign clubs (fill-in only).** On days they play, matches of these clubs may also go on the line, after every Saudi item and only while there is room within the 6:

  | Club | Label | Official fixtures |
  |---|---|---|
  | Real Madrid | ريال مدريد | realmadrid.com |
  | FC Barcelona | برشلونة | fcbarcelona.com |
  | Manchester City | مانشستر سيتي | mancity.com |
  | Liverpool | ليفربول | liverpoolfc.com |
  | Manchester United | مانشستر يونايتد | manutd.com |
  | Bayern Munich | بايرن ميونخ | fcbayern.com |

  Their colours are in the club colours table above.

  Take the kick-off from the club's own fixtures page (or the competition's) on the day, convert it to Riyadh time, and skip matches that start after midnight Riyadh time. `note` is the competition · city, e.g. «الدوري الإسباني · مدريد». Changing this list is an editorial decision: edit the table and the validator's `FOREIGN_CLUBS` together.
- `time`: ISO with +03:00, on today's date, following the match-time rules below.
- `label` ≤ 40 chars: the match written as «الهلال × النصر», or the event name. `note` ≤ 40 chars: competition · city.
- `colors`: for matches, two colours per club, home first: `[["#home1", "#home2"], ["#away1", "#away2"]]` (main kit colour, then its trim). The page draws a banner across the top of the match popup on the timeline (not in the today panel): the home club's two colours on the right half, the away club's on the left, each split by a sharp diagonal; the timeline dot uses the first colour of each. Never use club logos or crests (they are trademarks we have no licence for). Non-match items: 1–2 hex colours.
- Club colours for the regulars (use these exact values so a club always looks the same):

  | Club | Colours |
  |---|---|
  | الهلال | #0050a0, #ffffff |
  | النصر | #fcd116, #003a8c |
  | الاتحاد | #fcd116, #000000 |
  | الأهلي | #007a3d, #ffffff |
  | ريال مدريد | #ffffff, #00529f |
  | برشلونة | #a50044, #004d98 |
  | مانشستر سيتي | #6cabdd, #1c2c5b |
  | ليفربول | #c8102e, #ffffff |
  | مانشستر يونايتد | #da291c, #000000 |
  | بايرن ميونخ | #dc052d, #ffffff |

  For other clubs, take the two colours from the club's own kit. Add a club here once it appears often.
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
  - Sources: start with the city's webook explore page (e.g. webook.com/en/explore/sa/ruh for Riyadh), which lists experiences with their season dates; then visitsaudi.com, experiencealula.com, the Red Sea and Soudah destination sites, and official regional tourism pages. Use the listing's validity window for `available`/`until`, and leave out kids' play centres, escape rooms and venue-only listings.
  - Family-friendly and safe; no extreme or unlicensed operators. Rotate: don't show the same experience in the same city two editions running when another qualifies.
- Verify the dates on the event page itself. If a listing contradicts itself, use the event page or drop the item.

## «بعيون العالم» (the Kingdom as major non-Saudi platforms report it; replaced «ما وراء البحار» on 2026-11-01)
`world_view` holds 0–3 items: facts about Saudi Arabia reported by a major international outlet or published by an international body, from the last 60 days. It is its own section at the end of the page (it replaced «ما وراء البحار», the Kingdom abroad by continent), and hides itself when empty. Don't write a `world` array any more; the validator rejects one.
- **A fact, not praise.** The item must rest on something verifiable that the outlet or body reports: a credit rating or outlook, a growth or tourism figure, a ranking or index position, a large international deal, an international award or inscription. Never pick an item because the outlet says something flattering, and never an outlet's opinion, analysis or column.
- **Positive in substance, not just in the headline.** Read the whole piece. If the report is mixed (the positive figure sits inside a story about a dispute, a conflict, a risk or a critique), leave it out. The "What stays out" list above applies here too.
- **Two kinds** (`kind`):
  - `body`: international organisations and their reports (IMF, World Bank, UN agencies incl. UN Tourism and UNESCO, OECD, WTO, WIPO, ITU, IEA, IRENA, WEF, IMD), rating agencies (Moody's, S&P, Fitch) and established rankings (QS, Times Higher Education). Prefer these: they are the strongest evidence. Link to the body's own release or report page.
  - `press`: global outlets only, not Saudi or Saudi-owned ones (no Arab News, Asharq Al-Awsat, Al Arabiya …). Prefer the ones readers can open: Reuters, AP, AFP, BBC, CNBC, CNN, Nikkei Asia, The Guardian, DW, France 24, Euronews, NHK, ABC (Australia), SCMP, TIME. Paywalled outlets (FT, Bloomberg, WSJ, The Economist, NYT, Washington Post, Nikkei) are allowed with `"paywall": true`, and the page tags them «للمشتركين»; use one only when no open outlet reports the same fact.
- **Our words, their credit.** `title` is our own Arabic statement of the fact (≤ 70 chars), never a translation of the outlet's headline. Name the outlet in `outlet`, in Arabic («رويترز»، «صندوق النقد الدولي»، «موديز»). Don't translate or quote the article.
- **The last 60 days, three at most.** `date` (the date of the report or release) within the 60 days before the edition. Keep the three most recent items that clear the bar; when a newer one qualifies, it replaces the oldest.
- **A standing list.** Carry yesterday's items forward unchanged unless one is replaced or turns 60 days old (drop it). Re-check each source still says the same; if a body later revises the fact (a rating changed, a ranking corrected), replace or drop it. These items are not in the 30-day news register, so they may run every day while they qualify.
- **Ordered by significance**, strongest first: a sovereign credit rating or outlook, an IMF or World Bank figure, or a major international ranking or inscription before a single-sector figure or a press report. Bodies before press unless the press fact is clearly bigger; between equals, newest first. The validator warns when a body sits below a press item.
- **Research it every day.** Search in English and Arabic for fresh reports by the bodies and outlets below, then decide; an empty section must be a finding, not a skipped step.
- **No overlap:** not the same story as a card in the same edition (`story` slug).
- Fields: `kind`, `title`, `outlet`, `date`, `source_url`, `story`, optional `summary` (≤ 220 chars, kept for the record, not shown), optional `paywall`.
- Never lower the bar to fill three slots. Fewer items, or none, is fine.

## Upcoming national events
- `events`: upcoming dated national events in the next 30 days, from official sources only.
- Fields: `date` (first day, YYYY-MM-DD), optional `end` for multi-day events, and `title`. Don't put dates in the title; the page shows the date or range once, before the title.

## Night update (just after midnight)
From midnight until the morning edition, the page shows yesterday's cards labelled «آخر تحديث», but the date has changed. A light run at 00:10 Riyadh writes `data/today.json` so night readers see the new day's timed events and notices:
```json
{ "date": "YYYY-MM-DD", "timeline": [ … ], "notices": [ … ] }
```
- `date` is the new day. `timeline` and `notices` follow exactly the rules above (official fixtures, kick-offs checked on the day, notices from the issuer, the service change only). Nothing else goes in the file: no headline, no cards.
- The page uses it only while `data/edition.json` is not yet today's. Once the morning edition is out, the edition's own timeline and notices take over, so the morning run re-checks them as usual.
- Validate with `node scripts/validate.mjs --night`. Commit only `data/today.json` as `night: YYYY-MM-DD`. If nothing validates, push nothing; the page keeps yesterday's edition.

## Publishing
1. Write `data/edition.json` with `edition_date` = today (Asia/Riyadh) and `status: "pilot"`.
2. Run `node scripts/validate.mjs --today` (it also checks the news register). If it fails, fix the edition and re-run. Never publish a failing edition.
3. If a valid edition can't be produced, change nothing. The page will label the previous edition "آخر تحديث".
4. Run `node scripts/build-share.mjs`. It rebuilds `share/today.png` (link preview), `share/post.png` (WhatsApp Channel image), `share/whatsapp.txt` (the post text) and `feed.xml` (RSS, last 14 editions) from the edition. Look at both images once: the headline must fit and read cleanly.
5. Commit `data/edition.json`, `share/` and `feed.xml` together to `main` as `edition: YYYY-MM-DD` and push. Change no other file.
