(function () {
  "use strict";

  // Default location: Riyadh. Later: let the user pick a city (stored on-device only).
  const LOCATION = { name: "الرياض", lat: 24.7136, lng: 46.6753 };
  const TZ = "Asia/Riyadh";

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // ---------- Dates ----------
  const now = new Date();
  $("hijri").textContent = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(now);
  $("gregorian").textContent = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    timeZone: TZ, day: "numeric", month: "long", year: "numeric"
  }).format(now);

  const fmtDate = (iso) => new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    timeZone: TZ, day: "numeric", month: "long"
  }).format(new Date(iso + "T12:00:00+03:00"));

  // ---------- Weather (Open-Meteo, no key, no cookies) ----------
  const WMO = {
    0: "صحو", 1: "صحو غالبًا", 2: "غائم جزئيًا", 3: "غائم",
    45: "ضباب", 48: "ضباب", 51: "رذاذ", 53: "رذاذ", 55: "رذاذ",
    61: "مطر خفيف", 63: "مطر", 65: "مطر غزير", 80: "زخات", 81: "زخات", 82: "زخات غزيرة",
    95: "عواصف رعدية", 96: "عواصف رعدية", 99: "عواصف رعدية"
  };
  // Line icons for WMO weather codes (stroke = currentColor).
  function weatherIcon(code, day) {
    const sun = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`;
    const moon = `<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>`;
    const cloud = `<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z"/>`;
    const smallSun = day
      ? `<circle cx="8" cy="8" r="3"/><path d="M8 2.5v1M2.5 8h1M4.1 4.1l.7.7M11.9 4.1l-.7.7"/>`
      : `<path d="M11 9.5A4 4 0 0 1 6.5 5a4 4 0 1 0 4.5 4.5z"/>`;
    const lowCloud = `<path d="M8 20h9a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.2A2.9 2.9 0 0 0 8 20z"/>`;
    let body;
    if (code <= 1) body = day ? sun : moon;
    else if (code === 2) body = smallSun + lowCloud;
    else if (code === 3) body = cloud;
    else if (code === 45 || code === 48) body = `<path d="M4 9h16M3 13h18M5 17h14"/>`;
    else if (code >= 95) body = `<path d="M7 15h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 15z"/><path d="M12.5 15l-2 3.5h3l-2 3.5"/>`;
    else if (code >= 51) body = `<path d="M7 15h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 15z"/><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/>`;
    else body = cloud;
    return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  }

  // Small weather line under the Riyadh and Jeddah columns.
  const WEATHER_CITIES = [["w-riyadh", 24.7136, 46.6753], ["w-jeddah", 21.4858, 39.1925]];
  async function renderWeather() {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_CITIES.map((c) => c[1]).join(",")}` +
        `&longitude=${WEATHER_CITIES.map((c) => c[2]).join(",")}` +
        `&current=temperature_2m,weather_code,is_day&timezone=${encodeURIComponent(TZ)}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      let data = await r.json();
      if (!Array.isArray(data)) data = [data];
      const nf = new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 0 });
      WEATHER_CITIES.forEach(([id], i) => {
        const d = data[i];
        if (!d) return;
        const code = d.current.weather_code;
        const line = $(id);
        line.textContent = "";
        const icon = el("span", "w-icon");
        icon.innerHTML = weatherIcon(code, d.current.is_day !== 0);
        icon.setAttribute("role", "img");
        icon.setAttribute("aria-label", WMO[code] || "");
        icon.title = WMO[code] || "";
        line.append(icon, el("span", "", `${nf.format(d.current.temperature_2m)}°`));
      });
    } catch (e) { /* the line simply stays empty */ }
  }

  // ---------- Brief: key phrases open a detail overlay ----------
  const dlg = $("detail");
  let lastTrigger = null;
  function openDetail(c, trigger) {
    lastTrigger = trigger;
    $("d-cat").textContent = c.category;
    const t = $("d-date");
    t.textContent = fmtDate(c.date);
    t.dateTime = c.date;
    $("d-title").textContent = c.title;
    $("d-summary").textContent = c.summary;
    const a = $("d-source");
    a.href = c.source_url;
    $("d-source-name").textContent = c.source_name;
    dlg.showModal();
  }
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // tap outside closes
  $("d-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => lastTrigger && lastTrigger.focus());

  function keyButton(text, c) {
    const b = el("button", "key", text);
    b.type = "button";
    b.setAttribute("aria-haspopup", "dialog");
    b.addEventListener("click", () => openDetail(c, b));
    return b;
  }

  // The one-line headline carries the links; stories it doesn't mention become "وأيضًا" chips.
  function renderHeadline(brief, cards) {
    const p = $("headline");
    p.textContent = "";
    // Locate each card's keyword (first occurrence) in the brief; ignore overlaps.
    const spans = [];
    cards.forEach((c, i) => {
      const k = c.keyword && brief.indexOf(c.keyword);
      if (k != null && k >= 0) spans.push({ s: k, e: k + c.keyword.length, i });
    });
    spans.sort((x, y) => x.s - y.s);
    const placed = new Set();
    let pos = 0;
    for (const sp of spans) {
      if (sp.s < pos) continue;
      p.append(document.createTextNode(brief.slice(pos, sp.s)), keyButton(brief.slice(sp.s, sp.e), cards[sp.i]));
      placed.add(sp.i);
      pos = sp.e;
    }
    p.append(document.createTextNode(brief.slice(pos)));
    // Any card not referenced in the brief stays reachable as a chip.
    const rest = cards.filter((_, i) => !placed.has(i));
    const more = $("more");
    more.textContent = "";
    $("more-wrap").hidden = rest.length === 0;
    for (const c of rest) {
      const li = el("li");
      li.append(keyButton(c.keyword || c.title, c));
      more.append(li);
    }
  }

  // ---------- World clocks (tooltip on the timeline's "now" marker) ----------
  const WORLD = [
    ["طوكيو", "Asia/Tokyo"], ["الرياض", "Asia/Riyadh"],
    ["لندن", "Europe/London"], ["نيويورك", "America/New_York"]
  ];
  const SVGNS = "http://www.w3.org/2000/svg";
  function clockFace(h, m) {
    let ticks = "";
    for (let i = 0; i < 12; i++) {
      const q = i % 3 === 0;
      ticks += `<line x1="0" y1="${q ? -37 : -39}" x2="0" y2="-43" stroke-width="${q ? 3 : 1.6}" transform="rotate(${i * 30})"/>`;
    }
    const nums = [["12", 0, -27], ["3", 29, 1], ["6", 0, 29], ["9", -29, 1]]
      .map(([t, x, y]) => `<text x="${x}" y="${y}">${t}</text>`).join("");
    const ha = (h % 12) * 30 + m * 0.5, ma = m * 6;
    return `<svg viewBox="-50 -50 100 100" width="58" height="58" aria-hidden="true">` +
      `<circle r="45" class="c-face"/><g class="c-ticks">${ticks}</g><g class="c-nums">${nums}</g>` +
      `<line x1="0" y1="6" x2="0" y2="-22" class="c-hour" transform="rotate(${ha})"/>` +
      `<line x1="0" y1="8" x2="0" y2="-34" class="c-min" transform="rotate(${ma})"/>` +
      `<circle r="3.2" class="c-pin"/></svg>`;
  }
  function drawClocks(box) {
    const t = new Date();
    box.textContent = "";
    for (const [name, zone] of WORLD) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
        timeZone: zone, hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(t).map((p) => [p.type, p.value]));
      const cell = el("div", "clock");
      const face = el("div", "clock-face");
      face.innerHTML = clockFace(+parts.hour, +parts.minute);
      const digital = new Intl.DateTimeFormat("ar-SA-u-nu-latn", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(t);
      cell.append(face, el("span", "clock-city", name), el("span", "clock-time", digital));
      cell.setAttribute("aria-label", `${name} ${digital}`);
      box.append(cell);
    }
  }
  setInterval(() => document.querySelectorAll(".tl-now-wrap.open .tl-clocks, .tl-now-wrap:hover .tl-clocks").forEach(drawClocks), 30e3);

  // ---------- Day timeline: Fajr → midnight, prayer ticks, event dots with bubbles ----------
  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
  const clock = new Intl.DateTimeFormat("ar-SA-u-nu-latn", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  function renderTimeline(items) {
    const wrap = $("timeline");
    const track = $("tl-track");
    track.querySelectorAll(".tl-tick, .tl-dot-wrap, .tl-now-wrap, .tl-sun").forEach((n) => n.remove());
    if (!window.adhan) return;
    const a = window.adhan;
    const pt = new a.PrayerTimes(new a.Coordinates(LOCATION.lat, LOCATION.lng), now, a.CalculationMethod.UmmAlQura());
    const start = new Date(pt.fajr.getTime() - 30 * 60e3);
    const end = new Date(Date.parse(`${todayISO}T00:00:00+03:00`) + 864e5);
    const pos = (t) => Math.min(100, Math.max(0, ((t - start) / (end - start)) * 100));
    // The day flows down the left rail: morning at the top, night at the bottom.
    track.style.setProperty("--elapsed", pos(now) + "%");
    for (const t of [pt.fajr, pt.dhuhr, pt.asr, pt.maghrib, pt.isha]) {
      const tick = el("span", "tl-tick" + (t < now ? " past" : ""));
      tick.style.top = pos(t) + "%";
      track.append(tick);
    }
    // Sunrise and sunset icons beside the line.
    const SUN = (up) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M6 17a6 6 0 0 1 12 0"/><path d="M2 17h20"/><path d="M12 3v4"/>` +
      (up ? `<path d="M9.5 5.5 12 3l2.5 2.5"/>` : `<path d="M9.5 4.5 12 7l2.5-2.5"/>`) +
      `<path d="m4.2 10.2 1.4 1.4M19.8 10.2l-1.4 1.4"/></svg>`;
    for (const [t, up, name] of [[pt.sunrise, true, "الشروق"], [pt.maghrib, false, "الغروب"]]) {
      const s = el("span", "tl-sun" + (t < now ? " past" : ""));
      s.innerHTML = SUN(up);
      s.style.top = pos(t) + "%";
      s.setAttribute("role", "img");
      s.setAttribute("aria-label", `${name} ${clock.format(t)}`);
      s.title = `${name} ${clock.format(t)}`;
      track.append(s);
    }
    // "Now" marker: hover or tap shows world clocks at this moment.
    const pn = pos(now);
    const nowWrap = el("span", "tl-now-wrap");
    nowWrap.style.top = pn + "%";
    const nowBtn = el("button", "tl-now");
    nowBtn.type = "button";
    nowBtn.setAttribute("aria-label", "الآن · الساعة حول العالم");
    const clocks = el("div", "tl-clocks" + (pn < 15 ? " edge-start" : pn > 85 ? " edge-end" : ""));
    clocks.setAttribute("role", "tooltip");
    nowWrap.append(nowBtn, clocks);
    nowBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      track.querySelectorAll(".tl-dot-wrap.open").forEach((h) => h.classList.remove("open"));
      nowWrap.classList.toggle("open");
      drawClocks(clocks);
    });
    nowWrap.addEventListener("mouseenter", () => drawClocks(clocks));
    nowBtn.addEventListener("focus", () => drawClocks(clocks));
    drawClocks(clocks);
    track.append(nowWrap);

    const today = (items || []).filter((e) => e.time && e.time.slice(0, 10) === todayISO)
      .map((e) => ({ ...e, at: new Date(e.time) }))
      .sort((x, y) => x.at - y.at);
    wrap.hidden = false;
    // The next event within 3 hours shows its bubble without a tap.
    const soon = today.find((e) => e.at > now && e.at - now < 3 * 3600e3);
    for (const e of today) {
      const p = pos(e.at);
      const dot = el("button", "tl-dot" + (e.at < now ? " past" : ""));
      dot.type = "button";
      const [c1, c2] = (e.colors && e.colors.length ? e.colors : ["var(--gold)"]);
      dot.style.setProperty("--c1", c1);
      dot.style.setProperty("--c2", c2 || c1);
      const text = `${e.label} · ${clock.format(e.at)}`;
      dot.setAttribute("aria-label", e.note ? `${text} · ${e.note}` : text);
      const bubble = el(e.source_url ? "a" : "span", "tl-bubble" + (p < 6 ? " edge-start" : p > 94 ? " edge-end" : ""));
      if (e.source_url) { bubble.href = e.source_url; bubble.target = "_blank"; bubble.rel = "noopener"; }
      bubble.append(el("strong", "", e.label), el("span", "", `${clock.format(e.at)}${e.note ? " · " + e.note : ""}`));
      const holder = el("span", "tl-dot-wrap" + (e === soon ? " open" : ""));
      holder.style.top = p + "%";
      dot.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const wasOpen = holder.classList.contains("open");
        track.querySelectorAll(".tl-dot-wrap.open").forEach((h) => h.classList.remove("open"));
        if (!wasOpen) holder.classList.add("open");
      });
      holder.append(bubble, dot);
      track.append(holder);
    }
  }
  document.addEventListener("click", () => {
    document.querySelectorAll(".tl-dot-wrap.open, .tl-now-wrap.open").forEach((h) => h.classList.remove("open"));
  });

  // ---------- City events: Riyadh, Jeddah, other regions ----------
  const dayMonth = (iso) => fmtDate(iso);
  function when(e) {
    if (e.when) return e.when; // free text for recurring items, e.g. «كل سبت»
    const end = e.end || e.start;
    if (e.start <= todayISO && end >= todayISO) return end === todayISO ? "اليوم" : "حتى " + dayMonth(end);
    if (end === e.start) return dayMonth(e.start);
    const [sm, em] = [e.start.slice(0, 7), end.slice(0, 7)];
    const d = (iso) => new Intl.NumberFormat("ar-SA-u-nu-latn").format(+iso.slice(8, 10));
    return sm === em ? `${d(e.start)}–${dayMonth(end)}` : `${dayMonth(e.start)} – ${dayMonth(end)}`;
  }
  function renderRegions(regions) {
    if (!regions) return;
    let any = false;
    for (const key of ["riyadh", "jeddah", "other"]) {
      const ul = $("r-" + key);
      ul.textContent = "";
      const items = (regions[key] || []).filter((e) => (e.end || e.start) >= todayISO).slice(0, 5);
      for (const e of items) {
        const li = el("li");
        const a = el("a");
        a.href = e.source_url; a.target = "_blank"; a.rel = "noopener";
        a.append(el("span", "ev-title", e.title));
        const meta = [when(e), e.place].filter(Boolean).join(" · ");
        a.append(el("span", "ev-meta", meta));
        li.append(a);
        ul.append(li);
        any = true;
      }
      if (!items.length) ul.append(el("li", "ev-empty", "لا فعاليات بارزة هذا الأسبوع"));
    }
    $("regions-wrap").hidden = !any;
  }

  // ---------- Edition ----------
  async function renderEdition() {
    let ed;
    try {
      const r = await fetch("data/edition.json", { cache: "no-cache" });
      ed = await r.json();
    } catch (e) {
      $("headline").textContent = "تعذّر تحميل موجز اليوم. حاول مرة أخرى بعد قليل.";
      return;
    }

    // Today's edition → "موجز اليوم"; an older one is labelled honestly as the last update.
    $("edition-label").textContent = ed.edition_date === todayISO
      ? "موجز اليوم"
      : "آخر تحديث: " + fmtDate(ed.edition_date);
    if (ed.status === "pilot") $("pilot-note").hidden = false;

    renderHeadline(ed.headline || "", ed.cards.slice(0, 8));
    renderTimeline(ed.timeline);

    renderRegions(ed.regions);

    if (ed.events && ed.events.length) {
      $("events-wrap").hidden = false;
      for (const ev of ed.events) {
        $("events").append(el("li", "", `${fmtDate(ev.date)} — ${ev.title}`));
      }
    }
  }

  renderTimeline([]);
  renderWeather();
  renderEdition();
})();
