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
  const part = (cal, opt) => new Intl.DateTimeFormat(`ar-SA-u-ca-${cal}-nu-latn`, { timeZone: TZ, ...opt }).format(now);
  // Calendar-icon tile: short weekday on top, day number below.
  // Gregorian face in English («Fri 16»); Hijri face in Arabic with short day names («جمعة 5»).
  const AR_SHORT = { Sun: "أحد", Mon: "إثنين", Tue: "ثلاثاء", Wed: "أربعاء", Thu: "خميس", Fri: "جمعة", Sat: "سبت" };
  const enDay = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(now);
  $("greg-m").textContent = enDay;
  $("greg-d").textContent = part("gregory", { day: "numeric" });
  $("hijri-m").textContent = AR_SHORT[enDay] || part("gregory", { weekday: "long" });
  $("hijri-d").textContent = part("islamic-umalqura", { day: "numeric" });
  $("greg-mo").textContent = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long" }).format(now);
  // Short Hijri month names for the small tile, e.g. «جماد أول» instead of «جمادى الأولى».
  const HIJRI_SHORT = ["محرم", "صفر", "ربيع أول", "ربيع ثاني", "جماد أول", "جماد ثاني", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
  const hijriMonth = +new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone: TZ, month: "numeric" }).format(now);
  $("hijri-mo").textContent = HIJRI_SHORT[hijriMonth - 1] || part("islamic-umalqura", { month: "long" });
  // The Hijri date must be the official Saudi calendar (Umm al-Qura). A browser that can't do Umm al-Qura
  // would silently fall back to another calendar and show a wrong day, so in that case show Gregorian only.
  const hasUmmAlQura = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura").resolvedOptions().calendar === "islamic-umalqura";
  $("date-tile").setAttribute("aria-label", part("gregory", { weekday: "long" }) + "، " +
    (hasUmmAlQura ? part("islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }) + "، " : "") +
    part("gregory", { day: "numeric", month: "long", year: "numeric" }));
  // One date tile: Gregorian, then Hijri, switching every 10 seconds.
  if (hasUmmAlQura) setInterval(() => $("date-tile").classList.toggle("show-hijri"), 10e3);

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

  // Cities offered in the event-column pickers: [key, Arabic name, lat, lng].
  const CITIES = [
    ["riyadh", "الرياض", 24.7136, 46.6753],
    ["jeddah", "جدة", 21.4858, 39.1925],
    ["makkah", "مكة", 21.3891, 39.8579],
    ["madinah", "المدينة", 24.5247, 39.5692],
    ["eastern", "الشرقية", 26.4207, 50.0888],
    ["alula", "العلا", 26.6085, 37.9232],
    ["abha", "أبها", 18.2164, 42.5053],
    ["taif", "الطائف", 21.2703, 40.4158],
    ["tabuk", "تبوك", 28.3835, 36.5662],
  ];
  const CITY_KEYS = CITIES.map((c) => c[0]);
  // City icons (original line drawings; Riyadh: Masmak tower, Jeddah: roshan, Makkah: pointed arch, Madinah: palm,
  // Dammam-Khobar: dhow, AlUla: Elephant Rock, Abha: Asiri house, Taif: rose, Tabuk: Jabal al-Lawz).
  const CITY_ICON = {
    riyadh: '<path d="M7 21l1.2-13h7.6L17 21z"/><path d="M8.2 8V5.5l1.3 1 1.2-1.5 1.3 1.5 1.3-1.5 1.2 1.5 1.3-1V8"/><path d="M10.5 21v-4h3v4"/><path d="M11 11.5h2"/>', // برج المصمك
    jeddah: '<rect x="6" y="5" width="12" height="15" rx="1"/><path d="M6 9.5h12M6 14.5h12M10 5v15M14 5v15"/><path d="M5 5h14l-1.5-2h-11z"/><path d="M5 20h14"/>', // روشان حجازي
    makkah: '<path d="M5 21V11c0-4 3-6.5 7-8.5 4 2 7 4.5 7 8.5v10"/><path d="M9 21v-8c0-2 1.3-3.2 3-4.2 1.7 1 3 2.2 3 4.2v8"/><path d="M3 21h18"/>', // قوس مدبّب
    madinah: '<path d="M12 21c0-5-.5-9 0-12"/><path d="M12 9C10 6 7 5.5 4 7M12 9c2-3 5-3.5 8-2M12 9c-1-3-3-4.5-6-5M12 9c1-3 3-4.5 6-5M12 9c-3-.5-6 1-7.5 4M12 9c3-.5 6 1 7.5 4"/><path d="M8 21h8"/>', // نخلة
    eastern: '<path d="M3 16h18l-3 4H6z"/><path d="M12 16V3"/><path d="M12 4c3 2 5 6 5.5 10H12"/><path d="M12 6c-2 2-3.5 5-4 8h4"/>', // مركب شراعي (داو)
    alula: '<path d="M3 20c0-5 1.5-9 5-11 3-1.7 7-1.7 9.5 0 2.5 1.8 3.5 5 3.5 11"/><path d="M8 20c0-3.5 1.4-5.5 3.5-5.5S14 16.5 14 20"/><path d="M2 20h20"/>', // صخرة الفيل
    abha: '<path d="M5 21V5h14v16"/><path d="M5 5l1.5-2L8 5l1.5-2L11 5l1.5-2L14 5l1.5-2L17 5l1.5-2L19 5"/><path d="M5 9h14M5 13h14M5 17h14" stroke-dasharray="1.6 1.6"/><path d="M10.5 21v-3h3v3"/>', // بيت عسيري بالقط
    taif: '<path d="M12 12c-2.5 0-4-1.7-4-4 1.5.5 2.5 0 4-2 1.5 2 2.5 2.5 4 2 0 2.3-1.5 4-4 4z"/><path d="M12 6c-.8 1.5-.8 3 0 4.5.8-1.5.8-3 0-4.5z"/><path d="M12 12v9"/><path d="M12 17c-1.5-2-3.5-2.5-5-2 1 2 3 2.8 5 2zM12 15.5c1.5-1.8 3.3-2.2 4.8-1.8-.9 1.9-2.8 2.5-4.8 1.8z"/>', // الورد الطائفي
    tabuk: '<path d="M2 20l7-12 4 6 2.5-3L22 20z"/><path d="M6.6 12.1l1.4.9 1-1.5 1.2 1.6 1.3-.6"/><path d="M14 13l1.5.5 1.4-1"/>', // جبل اللوز المكسو بالثلج
  };
  const cityIcon = (key) => `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${CITY_ICON[key] || ""}</svg>`;

  // Current weather for every city, fetched once (Open-Meteo accepts a list of coordinates).
  const weatherByCity = {};
  let weatherReady = null;
  function loadWeather() {
    if (!weatherReady) weatherReady = (async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${CITIES.map((c) => c[2]).join(",")}` +
          `&longitude=${CITIES.map((c) => c[3]).join(",")}` +
          `&current=temperature_2m,weather_code,is_day&timezone=${encodeURIComponent(TZ)}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(r.status);
        let data = await r.json();
        if (!Array.isArray(data)) data = [data];
        CITIES.forEach(([key], i) => { if (data[i]) weatherByCity[key] = data[i].current; });
      } catch (e) { /* weather lines simply stay empty */ }
    })();
    return weatherReady;
  }
  const nf0 = new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 0 });
  function renderWeatherLine(line, key) {
    line.textContent = "";
    const w = weatherByCity[key];
    if (!w) return;
    const code = w.weather_code;
    const icon = el("span", "w-icon");
    icon.innerHTML = weatherIcon(code, w.is_day !== 0);
    icon.setAttribute("role", "img");
    icon.setAttribute("aria-label", WMO[code] || "");
    icon.title = WMO[code] || "";
    line.append(icon, el("span", "", `${nf0.format(w.temperature_2m)}°`));
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
      let before = brief.slice(pos, sp.s);
      const btn = keyButton(brief.slice(sp.s, sp.e), cards[sp.i]);
      if (/(^|\s)و$/.test(before)) {
        // Keep a joining «و» on the same line as its key phrase (no dangling «و» at a line end).
        before = before.slice(0, -1);
        const keep = el("span", "nowrap", "و");
        keep.append(btn);
        p.append(document.createTextNode(before), keep);
      } else {
        p.append(document.createTextNode(before), btn);
      }
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
    box.append(el("div", "clocks-title", "الوقت الآن حول العالم"));
    const row = el("div", "clocks-row");
    box.append(row);
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
      row.append(cell);
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
    // Sky colours along the line, anchored to today's real dawn, sunrise, noon, sunset and nightfall.
    const m = (t, min) => new Date(t.getTime() + min * 60e3);
    const sky = [
      [start, "#0e1838"],                 // night before dawn
      [pt.fajr, "#26305f"],               // first light
      [m(pt.sunrise, -25), "#b86b8f"],    // pink dawn
      [pt.sunrise, "#f2a15e"],            // sunrise
      [m(pt.sunrise, 70), "#8cc2e8"],     // morning blue
      [pt.dhuhr, "#4c9fdc"],              // midday
      [pt.asr, "#6ea8d6"],                // afternoon
      [m(pt.maghrib, -35), "#f0b26b"],    // golden hour
      [pt.maghrib, "#e06a4c"],            // sunset
      [m(pt.maghrib, 25), "#6f4b8c"],     // dusk
      [pt.isha, "#27305c"],               // nightfall
      [end, "#0b1430"],                   // midnight
    ];
    track.style.setProperty("--sky", `linear-gradient(to bottom, ${sky.map(([t, c]) => `${c} ${pos(t).toFixed(2)}%`).join(", ")})`);
    // Hover, focus or tap a prayer name, the sun or the moon to see its time in a small bubble.
    const timeBubble = (node, name, t, p) => {
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `${name} ${clock.format(t)}`);
      const b = el("span", "tl-bubble tl-time" + (p < 6 ? " edge-start" : p > 94 ? " edge-end" : ""));
      b.setAttribute("aria-hidden", "true");
      b.append(el("strong", "", name), el("span", "", clock.format(t)));
      node.append(b);
      node.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const wasOpen = node.classList.contains("open");
        closeBubbles();
        if (!wasOpen) node.classList.add("open");
      });
    };
    // Prayer times: the short Arabic name in very small text beside the line.
    // Maghrib is sunset, so it is drawn once below as the moon with its name under it.
    for (const [t, name, full] of [[pt.fajr, "فجر", "الفجر"], [pt.dhuhr, "ظهر", "الظهر"], [pt.asr, "عصر", "العصر"], [pt.isha, "عشاء", "العشاء"]]) {
      const tick = el("span", "tl-tick" + (t < now ? " past" : ""));
      tick.append(el("span", "tl-label", name)); // only the label is rotated, so the time bubble stays upright
      tick.style.top = pos(t) + "%";
      timeBubble(tick, full, t, pos(t));
      track.append(tick);
    }
    // Sunrise (sun) and sunset (moon) icons beside the line.
    for (const [t, up, name] of [[pt.sunrise, true, "الشروق"], [pt.maghrib, false, "المغرب · الغروب"]]) {
      const s = el("span", "tl-sun" + (t < now ? " past" : ""));
      s.innerHTML = `<span class="tl-dash" aria-hidden="true"></span>`; // a short dash across the line marks sunrise / sunset
      if (!up) s.append(el("span", "tl-sub", "مغرب"));
      s.style.top = pos(t) + "%";
      timeBubble(s, name, t, pos(t));
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
      const wasOpen = nowWrap.classList.contains("open");
      closeBubbles();
      if (!wasOpen) nowWrap.classList.add("open");
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
      const [c1, c2] = (e.colors && e.colors.length ? e.colors : ["var(--lavender)"]);
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
        closeBubbles();
        if (!wasOpen) holder.classList.add("open");
      });
      holder.append(bubble, dot);
      track.append(holder);
    }
  }
  function closeBubbles() {
    document.querySelectorAll(".tl-dot-wrap.open, .tl-now-wrap.open, .tl-tick.open, .tl-sun.open").forEach((h) => h.classList.remove("open"));
  }
  document.addEventListener("click", closeBubbles);

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
  // Three columns, each with a city picker. Choices are remembered on this device only.
  const PICK_KEY = "cityColumns";
  const loadPicks = () => {
    try {
      const v = JSON.parse(localStorage.getItem(PICK_KEY));
      // Riyadh is always the first column; the reader picks the other two.
      if (Array.isArray(v) && v.length === 3 && v.every((k) => CITY_KEYS.includes(k)) && new Set(v).size === 3) {
        if (v[0] === "riyadh") return v;
        const others = v.filter((k) => k !== "riyadh");
        return ["riyadh", others[0], others[1] || CITY_KEYS.find((k) => k !== "riyadh" && !others.includes(k))];
      }
    } catch (e) { /* storage unavailable */ }
    return null;
  };
  const savePicks = (v) => { try { localStorage.setItem(PICK_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ } };

  // Older editions used an "other" bucket; place it under the matching city by name.
  function normalizeRegions(regions) {
    const out = {};
    for (const key of CITY_KEYS) out[key] = (regions[key] || []).slice();
    for (const e of regions.other || []) {
      const hit = CITIES.find(([, name]) => (e.place || "").includes(name) || name.includes(e.place || "-"));
      if (hit) out[hit[0]].push(e);
    }
    for (const key of CITY_KEYS) {
      out[key] = out[key].filter((e) => (e.end || e.start) >= todayISO)
        .sort((x, y) => (x.start < y.start ? -1 : 1)).slice(0, 5);
    }
    return out;
  }

  function renderColumn(i, key, byCity) {
    const ul = $("r-" + i);
    ul.textContent = "";
    for (const e of byCity[key]) {
      const li = el("li");
      const a = el("a");
      a.href = e.source_url; a.target = "_blank"; a.rel = "noopener";
      a.append(el("span", "ev-title", e.title));
      const meta = [when(e), e.place].filter(Boolean).join(" · ");
      a.append(el("span", "ev-meta", meta));
      li.append(a);
      ul.append(li);
    }
    if (!byCity[key].length) ul.append(el("li", "ev-empty", "لا فعاليات بارزة هذا الأسبوع"));
    renderWeatherLine($("w-" + i), key);
    $("ic-" + i).innerHTML = cityIcon(key);
    $("nm-" + i).textContent = (CITIES.find((c) => c[0] === key) || [, key])[1];
  }

  function renderRegions(regions) {
    if (!regions) return;
    const byCity = normalizeRegions(regions);
    if (!CITY_KEYS.some((k) => byCity[k].length)) return;

    let picks = loadPicks();
    if (!picks) {
      const third = CITY_KEYS.find((k) => !["riyadh", "jeddah"].includes(k) && byCity[k].length) || "makkah";
      picks = ["riyadh", "jeddah", third];
    }
    renderColumn(0, "riyadh", byCity);
    const selects = { 1: $("pick-1"), 2: $("pick-2") };
    [1, 2].forEach((i) => {
      const sel = selects[i];
      sel.textContent = "";
      // Cities with events first, then the rest; names stay plain so the column title reads cleanly.
      for (const [label, has] of [["فيها فعاليات", true], ["لا فعاليات هذا الأسبوع", false]]) {
        const group = el("optgroup");
        group.label = label;
        for (const [key, name] of CITIES) {
          if (key === "riyadh" || !!byCity[key].length !== has) continue;
          const o = el("option", "", name);
          o.value = key;
          group.append(o);
        }
        if (group.children.length) sel.append(group);
      }
      sel.value = picks[i];
      sel.addEventListener("change", () => {
        const next = sel.value, prev = picks[i];
        const other = picks.indexOf(next);
        if (other > 0 && other !== i) { // the city is already in the other column: swap them
          picks[other] = prev;
          selects[other].value = prev;
          renderColumn(other, prev, byCity);
        }
        picks[i] = next;
        savePicks(picks);
        renderColumn(i, next, byCity);
      });
      renderColumn(i, picks[i], byCity);
    });
    $("regions-wrap").hidden = false;
    loadWeather().then(() => picks.forEach((key, i) => renderWeatherLine($("w-" + i), key)));
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

    // An edition that isn't today's is labelled honestly as the last update.
    if (ed.edition_date !== todayISO) {
      $("edition-label").textContent = "آخر تحديث: " + fmtDate(ed.edition_date);
      $("edition-label").hidden = false;
    }
    if (ed.status === "pilot") $("pilot-note").hidden = false;

    renderHeadline(ed.headline || "", ed.cards.slice(0, 8));
    renderTimeline(ed.timeline);

    renderRegions(ed.regions);

    if (ed.events && ed.events.length) {
      $("events-wrap").hidden = false;
      for (const ev of ed.events) {
        // Date (or date range) once, then the title; a date in brackets at the end of an older title is dropped.
        const title = ev.title.replace(/\s*\([^)]*\d[^)]*\)\s*$/, "");
        const range = ev.end && ev.end !== ev.date ? when({ start: ev.date, end: ev.end }) : fmtDate(ev.date);
        $("events").append(el("li", "", `${range} — ${title}`));
      }
    }
  }

  renderTimeline([]);
  loadWeather();
  renderEdition();
})();
