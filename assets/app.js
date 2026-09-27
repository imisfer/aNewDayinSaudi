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

  // ---------- Prayer times (computed on-device, Umm al-Qura method) ----------
  function renderPrayers() {
    if (!window.adhan) return;
    const a = window.adhan;
    const params = a.CalculationMethod.UmmAlQura();
    const times = new a.PrayerTimes(new a.Coordinates(LOCATION.lat, LOCATION.lng), now, params);
    const fmt = new Intl.DateTimeFormat("ar-SA-u-nu-latn", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
    const list = [
      ["الفجر", times.fajr], ["الظهر", times.dhuhr], ["العصر", times.asr],
      ["المغرب", times.maghrib], ["العشاء", times.isha]
    ];
    // After Isha, the next prayer is tomorrow's Fajr.
    if (!list.some(([, t]) => t > now)) {
      const tomorrow = new Date(now.getTime() + 864e5);
      list[0] = ["الفجر", new a.PrayerTimes(new a.Coordinates(LOCATION.lat, LOCATION.lng), tomorrow, params).fajr];
    }
    const next = list.find(([, t]) => t > now);
    const ol = $("prayers");
    ol.textContent = "";
    for (const [name, t] of list) {
      const li = el("li", next && next[1] === t ? "next" : "");
      li.append(el("span", "p-name", name), el("span", "p-time", fmt.format(t).replace(/\s?[صم]$/, "")));
      ol.append(li);
    }
  }

  // ---------- Weather (Open-Meteo, no key, no cookies) ----------
  const WMO = {
    0: "صحو", 1: "صحو غالبًا", 2: "غائم جزئيًا", 3: "غائم",
    45: "ضباب", 48: "ضباب", 51: "رذاذ", 53: "رذاذ", 55: "رذاذ",
    61: "مطر خفيف", 63: "مطر", 65: "مطر غزير", 80: "زخات", 81: "زخات", 82: "زخات غزيرة",
    95: "عواصف رعدية", 96: "عواصف رعدية", 99: "عواصف رعدية"
  };
  async function renderWeather() {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lng}` +
        `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(TZ)}&forecast_days=1`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      const nf = new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 0 });
      $("w-temp").textContent = nf.format(d.current.temperature_2m) + "°";
      const desc = WMO[d.current.weather_code] || "";
      $("w-desc").textContent = `${LOCATION.name} · ${desc} · ${nf.format(d.daily.temperature_2m_max[0])}°/${nf.format(d.daily.temperature_2m_min[0])}°`;
    } catch (e) {
      $("w-desc").textContent = LOCATION.name;
    }
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

  // ---------- Day timeline: Fajr → midnight, prayer ticks, event dots with bubbles ----------
  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
  const clock = new Intl.DateTimeFormat("ar-SA-u-nu-latn", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  function renderTimeline(items) {
    const wrap = $("timeline");
    const track = $("tl-track");
    track.querySelectorAll(".tl-tick, .tl-dot, .tl-now").forEach((n) => n.remove());
    if (!window.adhan) return;
    const a = window.adhan;
    const pt = new a.PrayerTimes(new a.Coordinates(LOCATION.lat, LOCATION.lng), now, a.CalculationMethod.UmmAlQura());
    const start = new Date(pt.fajr.getTime() - 30 * 60e3);
    const end = new Date(Date.parse(`${todayISO}T00:00:00+03:00`) + 864e5);
    const pos = (t) => Math.min(100, Math.max(0, ((t - start) / (end - start)) * 100));
    // RTL: the day flows from right (morning) to left (night).
    track.style.setProperty("--elapsed", pos(now) + "%");
    for (const t of [pt.fajr, pt.dhuhr, pt.asr, pt.maghrib, pt.isha]) {
      const tick = el("span", "tl-tick" + (t < now ? " past" : ""));
      tick.style.insetInlineStart = pos(t) + "%";
      track.append(tick);
    }
    const nowMark = el("span", "tl-now");
    nowMark.style.insetInlineStart = pos(now) + "%";
    track.append(nowMark);

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
      const bubble = el(e.source_url ? "a" : "span", "tl-bubble" + (p < 18 ? " edge-start" : p > 82 ? " edge-end" : ""));
      if (e.source_url) { bubble.href = e.source_url; bubble.target = "_blank"; bubble.rel = "noopener"; }
      bubble.append(el("strong", "", e.label), el("span", "", `${clock.format(e.at)}${e.note ? " · " + e.note : ""}`));
      const holder = el("span", "tl-dot-wrap" + (e === soon ? " open" : ""));
      holder.style.insetInlineStart = p + "%";
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
    document.querySelectorAll(".tl-dot-wrap.open").forEach((h) => h.classList.remove("open"));
  });

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

    if (ed.indicators && ed.indicators.length) {
      $("indicators-wrap").hidden = false;
      for (const i of ed.indicators) {
        const li = el("li");
        const a = el("a");
        a.href = i.source_url; a.target = "_blank"; a.rel = "noopener";
        a.append(el("div", "ind-val", i.value), el("div", "ind-label", i.label), el("div", "ind-note", i.note));
        li.append(a);
        $("indicators").append(li);
      }
    }

    if (ed.events && ed.events.length) {
      $("events-wrap").hidden = false;
      for (const ev of ed.events) {
        $("events").append(el("li", "", `${fmtDate(ev.date)} — ${ev.title}`));
      }
    }
  }

  renderPrayers();
  renderTimeline([]);
  renderWeather();
  renderEdition();
})();
