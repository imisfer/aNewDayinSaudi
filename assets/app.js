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
  // One date tile: Hijri first (the official calendar), then Gregorian, switching every 10 seconds.
  if (hasUmmAlQura) setInterval(() => $("date-tile").classList.toggle("show-greg"), 10e3);
  else $("date-tile").classList.add("show-greg");

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
    ["eastern", "الدمام", 26.4207, 50.0888],
    ["alula", "العلا", 26.6085, 37.9232],
    ["abha", "أبها", 18.2164, 42.5053],
    ["taif", "الطائف", 21.2703, 40.4158],
    ["tabuk", "تبوك", 28.3835, 36.5662],
  ];
  // Column titles: the names as the editor styled them (diacritics, stretched letters), shown with swash letters.
  const CITY_TITLES = { riyadh: "الرِّياض", makkah: "مكَّة", madinah: "المـدينَة", eastern: "الدَّمـام", jeddah: "جـدَّة",
    alula: "العُـــــلا", abha: "أبْهَـــــا", tabuk: "تبـُوك", taif: "الطَّـائِف" };
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
    ["طوكيو", "Asia/Tokyo", 35.68, 139.69], ["الرياض", "Asia/Riyadh", 24.71, 46.68],
    ["لندن", "Europe/London", 51.51, -0.13], ["نيويورك", "America/New_York", 40.71, -74.01]
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
  // Day or night at a city right now: between that city's real sunrise and sunset (from adhan), else 6:00–18:00 local.
  function isDaytime(lat, lng, zone, t) {
    if (window.adhan) {
      const a = window.adhan;
      const c = new a.Coordinates(lat, lng);
      for (const shift of [-1, 0, 1]) {
        const d = new Date(t.getTime() + shift * 864e5);
        const pt = new a.PrayerTimes(c, d, a.CalculationMethod.MuslimWorldLeague());
        if (t >= pt.sunrise && t < pt.maghrib) return true;
      }
      return false;
    }
    const h = +new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", hourCycle: "h23" }).format(t);
    return h >= 6 && h < 18;
  }
  // Where the sun is overhead right now (low-precision solar position; plenty for a background map).
  function subsolar(t) {
    const d = t.getTime() / 864e5 - 10957.5; // days since J2000.0
    const rad = Math.PI / 180;
    const g = (357.529 + 0.98560028 * d) * rad;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
    const e = (23.439 - 0.00000036 * d) * rad;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
    const dec = Math.asin(Math.sin(e) * Math.sin(L)) / rad;
    const gmst = 280.46061837 + 360.98564736629 * d;
    const lon = ((ra - gmst) % 360 + 540) % 360 - 180;
    return { lat: dec, lon };
  }
  // Background for the clocks: the world map with tonight's side shaded, edge = the day/night curve.
  // Map coordinates are equirectangular: x = lon + 180, y = 90 − lat.
  function worldNightMap(t, id = "nm") {
    if (!window.WORLD_LAND) return null;
    const sun = subsolar(t);
    const rad = Math.PI / 180;
    const dec = Math.abs(sun.lat) < 0.1 ? 0.1 : sun.lat; // avoid a flat line at the equinox
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 2) {
      const lat = Math.atan(-Math.cos((lon - sun.lon) * rad) / Math.tan(dec * rad)) / rad;
      pts.push(`${(lon + 180).toFixed(1)},${(90 - lat).toFixed(1)}`);
    }
    // Night wraps the pole that is tilted away from the sun.
    const edge = dec > 0 ? "180" : "0";
    const night = `M0,${edge} L${pts.join(" L")} L360,${edge} Z`;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "clocks-map");
    svg.setAttribute("viewBox", "0 0 360 180"); // whole world; the box crops a little at the poles, never the longitudes
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `<defs><filter id="${id}-soft" x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>` +
      `<path class="m-land" d="${window.WORLD_LAND}"/>` +
      `<path class="m-night" d="${night}" filter="url(#${id}-soft)"/>`;
    return svg;
  }
  function drawClocks(box) {
    const t = new Date();
    box.textContent = "";
    const map = worldNightMap(t);
    if (map) box.append(map);
    box.append(el("div", "clocks-title", "الوقت الآن حول العالم"));
    const row = el("div", "clocks-row");
    box.append(row);
    for (const [name, zone, lat, lng] of WORLD) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
        timeZone: zone, hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(t).map((p) => [p.type, p.value]));
      const day = isDaytime(lat, lng, zone, t);
      const cell = el("div", "clock " + (day ? "day" : "night"));
      const face = el("div", "clock-face");
      face.innerHTML = clockFace(+parts.hour, +parts.minute);
      const digital = new Intl.DateTimeFormat("ar-SA-u-nu-latn", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(t);
      cell.append(face, el("span", "clock-city", name), el("span", "clock-time", digital));
      cell.setAttribute("aria-label", `${name} ${digital} · ${day ? "نهار" : "ليل"}`);
      row.append(cell);
    }
  }
  setInterval(() => document.querySelectorAll(".tl-now-wrap.open .tl-clocks, .tl-now-wrap:hover .tl-clocks").forEach(drawClocks), 30e3);

  // ---------- Day timeline: Fajr → midnight, prayer ticks, event dots with bubbles ----------
  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
  const clock = new Intl.DateTimeFormat("ar-SA-u-nu-latn", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  const MATCH_MIN = 105;
  const isMatch = (e) => /×/.test(e.label || e.title || "");
  // Club colours: either [home, away] (one colour each) or [[home1, home2], [away1, away2]] (two per club).
  function teamColors(colors) {
    if (!colors || !colors.length) return null;
    const team = (c) => (Array.isArray(c) ? [c[0], c[1] || c[0]] : [c, c]);
    return [team(colors[0]), team(colors[1] || colors[0])];
  }
  // Club banner: each club as a two-colour tile (sharp diagonal split), home on the right, away on the left,
  // drawn as a band across the top of a match popup or card, in place of crests we have no rights to use.
  function clubBanner(node, colors) {
    const tc = teamColors(colors);
    if (!tc) return;
    node.classList.add("club-banner");
    [["--h1", tc[0][0]], ["--h2", tc[0][1]], ["--a1", tc[1][0]], ["--a2", tc[1][1]]].forEach(([k, v]) => node.style.setProperty(k, v));
  }
  let dayModel = null; // today's prayer times, line positions and timed items, for the expanded agenda
  let edition = null;
  function renderTimeline(items) {
    const wrap = $("timeline");
    const track = $("tl-track");
    track.querySelectorAll(".tl-tick, .tl-dot-wrap, .tl-now-wrap, .tl-sun, .tl-hour").forEach((n) => n.remove());
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
    // A prayer, sunrise or sunset that passed 15 minutes to 16 hours ago is hidden from the line.
    const stale = (t) => now - t >= 15 * 60e3 && now - t <= 16 * 3600e3;
    // Hour marks: a tiny dash every hour along the line's right edge; every even hour a small label beside it (6 ص، 8 ص، 10 ص …).
    for (let h = 1; h < 24; h++) {
      const t = new Date(`${todayISO}T${String(h).padStart(2, "0")}:00:00+03:00`);
      const p = pos(t);
      if (p <= 0.5 || p >= 99.5) continue;
      // Hours in the next 1h30 are drawn in 50% grey.
      const mark = el("span", "tl-hour" + (h % 2 === 0 ? " major" : "") + (t >= now && t - now <= 90 * 60e3 ? " soon" : ""));
      mark.style.top = p + "%";
      // Skip the hour's label when a prayer, sunrise/sunset or match dot sits within 25 minutes of it.
      const dots = (items || []).filter((e) => e.time && e.time.slice(0, 10) === todayISO).map((e) => new Date(e.time));
      const crowded = [pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha].filter((x) => !stale(x)).concat(dots).some((x) => Math.abs(x - t) < 25 * 60e3);
      if (h % 2 === 0 && !crowded) mark.append(el("span", "tl-hlabel", h === 12 ? "12 م" : h < 12 ? `${h} ص` : `${h - 12} م`));
      track.append(mark);
    }
    // Prayer times: a dash on the line and the short name beside it, in the same style as the hour labels.
    // Maghrib is sunset, so it is drawn once below as the moon with its name under it.
    // Sunrise and sunset (Maghrib) are marked the same way.
    for (const [t, name, full] of [[pt.fajr, "فجــــر", "الفجر"], [pt.sunrise, "شروق", "الشروق"], [pt.dhuhr, "ظهـــر", "الظهر"], [pt.asr, "عصر", "العصر"], [pt.maghrib, "مغرب", "المغرب"], [pt.isha, "عشـاء", "العشاء"]]) {
      if (stale(t)) continue;
      const tick = el("span", "tl-hour major tl-tick" + (t < now ? " past" : ""));
      // The time sits just above the name, small (e.g. 11:34 over «ظهر»).
      const hm = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(t).map((x) => [x.type, x.value]));
      const lab = el("span", "tl-hlabel", name);
      lab.append(el("span", "tl-ptime", `${hm.hour}:${hm.minute}`));
      tick.append(lab);
      tick.style.top = pos(t) + "%";
      tick.setAttribute("aria-label", `${full} ${clock.format(t)}`); // read by screen readers; no hover or tap
      track.append(tick);
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
      .map((e) => {
        const at = new Date(e.time);
        // Matches last about 1h45 unless a duration is given; other timed moments are a single point.
        const dur = e.duration || (isMatch(e) ? MATCH_MIN : 0);
        return { ...e, at, end: dur ? new Date(at.getTime() + dur * 60e3) : null };
      })
      .sort((x, y) => x.at - y.at);
    wrap.hidden = false;
    dayModel = { pos, pt, items: today };
    // The next event within 3 hours shows its bubble without a tap.
    const soon = today.find((e) => e.at > now && e.at - now < 3 * 3600e3);
    for (const e of today) {
      const p = pos(e.at);
      const dot = el("button", "tl-dot" + ((e.end || e.at) < now ? " past" : ""));
      dot.type = "button";
      const tc = teamColors(e.colors);
      const [c1, c2] = tc ? [tc[0][0], tc[1][0]] : ["var(--lavender)"];
      dot.style.setProperty("--c1", c1);
      dot.style.setProperty("--c2", c2 || c1);
      const span = clock.format(e.at); // start time only
      const text = `${e.label} · ${span}`;
      dot.setAttribute("aria-label", e.note ? `${text} · ${e.note}` : text);
      const bubble = el(e.source_url ? "a" : "span", "tl-bubble" + (p < 6 ? " edge-start" : p > 94 ? " edge-end" : ""));
      if (e.source_url) { bubble.href = e.source_url; bubble.target = "_blank"; bubble.rel = "noopener"; }
      if (isMatch(e)) clubBanner(bubble, e.colors);
      bubble.append(el("strong", "", e.label), el("span", "", `${span}${e.note ? " · " + e.note : ""}`));
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
  const isExp = (e) => e.kind === "experience";
  function normalizeRegions(regions) {
    const out = {};
    for (const key of CITY_KEYS) out[key] = (regions[key] || []).slice();
    for (const e of regions.other || []) {
      const hit = CITIES.find(([, name]) => (e.place || "").includes(name) || name.includes(e.place || "-"));
      if (hit) out[hit[0]].push(e);
    }
    // Dated events first (soonest first), then up to two bookable experiences that have no set date.
    for (const key of CITY_KEYS) {
      const dated = out[key].filter((e) => !isExp(e) && (e.end || e.start) >= todayISO).sort((x, y) => (x.start < y.start ? -1 : 1));
      const exps = out[key].filter((e) => isExp(e) && (!e.until || e.until >= todayISO)).slice(0, 2);
      out[key] = [...dated.slice(0, 5 - Math.min(exps.length, 2)), ...exps].slice(0, 5);
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
      if (isExp(e)) { // an experience: no date, so say so and when it's available
        li.className = "ev-exp";
        const meta = el("span", "ev-meta");
        meta.append(el("span", "ev-tag", "تجربة"), " · " + [e.available, e.place].filter(Boolean).join(" · "));
        a.append(meta);
      } else a.append(el("span", "ev-meta", [when(e), e.place].filter(Boolean).join(" · ")));
      li.append(a);
      ul.append(li);
    }
    if (!byCity[key].length) ul.append(el("li", "ev-empty", "لا فعاليات بارزة هذا الأسبوع"));
    renderWeatherLine($("w-" + i), key);
    $("ic-" + i).innerHTML = cityIcon(key);
    $("nm-" + i).textContent = CITY_TITLES[key] || (CITIES.find((c) => c[0] === key) || [, key])[1];
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

  // ---------- «ما وراء البحار»: the Kingdom abroad, by continent (same layout as the city events) ----------
  const CONTINENTS = [["asia", "آسيا"], ["africa", "أفريقيا"], ["europe", "أوروبا"], ["namerica", "أمريكا الشمالية"], ["samerica", "أمريكا الجنوبية"], ["oceania", "أوقيانوسيا"]];
  const CONT_KEYS = CONTINENTS.map((c) => c[0]);
  const contName = (k) => (CONTINENTS.find((c) => c[0] === k) || [, k])[1];
  const GLOBE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9"/></svg>';
  const W_PICK_KEY = "continentColumns";
  function renderWorldColumn(i, key, byCont) {
    const ul = $("wr-" + i);
    ul.textContent = "";
    for (const w of byCont[key]) {
      const li = el("li");
      const a = el("a");
      a.href = w.source_url; a.target = "_blank"; a.rel = "noopener";
      a.append(el("span", "ev-title", w.title), el("span", "ev-meta", [fmtDate(w.date), w.place, w.source_name].filter(Boolean).join(" · ")));
      li.append(a);
      ul.append(li);
    }
    if (!byCont[key].length) ul.append(el("li", "ev-empty", "لا أخبار هذا الشهر"));
    $("wic-" + i).innerHTML = GLOBE;
    $("wnm-" + i).textContent = contName(key);
  }
  function renderWorld(items) {
    const byCont = Object.fromEntries(CONT_KEYS.map((k) => [k, []]));
    for (const w of items || []) if (byCont[w.continent]) byCont[w.continent].push(w);
    for (const k of CONT_KEYS) byCont[k] = byCont[k].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
    const withNews = CONT_KEYS.filter((k) => byCont[k].length).sort((a, b) => byCont[b].length - byCont[a].length);
    if (!withNews.length) return;
    const main = withNews[0];
    renderWorldColumn(0, main, byCont);
    $("world-wrap").hidden = false;
    // With news from one continent only, it takes the full width; otherwise the reader picks two more.
    if (withNews.length < 2) { $("world-wrap").classList.add("solo"); $("w-stack").hidden = true; return; }
    let picks = null;
    try { const v = JSON.parse(localStorage.getItem(W_PICK_KEY)); if (Array.isArray(v) && v.length === 2 && v.every((k) => CONT_KEYS.includes(k) && k !== main) && v[0] !== v[1]) picks = v; } catch (e) { /* storage unavailable */ }
    if (!picks) {
      const rest = [...withNews.slice(1), ...CONT_KEYS.filter((k) => k !== main && !withNews.includes(k))];
      picks = [rest[0], rest[1]];
    }
    const selects = { 1: $("wpick-1"), 2: $("wpick-2") };
    [1, 2].forEach((i) => {
      const sel = selects[i];
      sel.textContent = "";
      for (const [label, has] of [["فيها أخبار", true], ["لا أخبار هذا الشهر", false]]) {
        const group = el("optgroup");
        group.label = label;
        for (const [key, name] of CONTINENTS) {
          if (key === main || !!byCont[key].length !== has) continue;
          const o = el("option", "", name);
          o.value = key;
          group.append(o);
        }
        if (group.children.length) sel.append(group);
      }
      sel.value = picks[i - 1];
      sel.addEventListener("change", () => {
        const next = sel.value, other = i === 1 ? 2 : 1;
        if (picks[other - 1] === next) { picks[other - 1] = picks[i - 1]; selects[other].value = picks[other - 1]; renderWorldColumn(other, picks[other - 1], byCont); }
        picks[i - 1] = next;
        try { localStorage.setItem(W_PICK_KEY, JSON.stringify(picks)); } catch (e) { /* ignore */ }
        renderWorldColumn(i, next, byCont);
      });
      renderWorldColumn(i, picks[i - 1], byCont);
    });
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
    edition = ed;

    renderHeadline(ed.headline || "", ed.cards.slice(0, 8));
    renderTimeline(timedToday(ed));

    renderRegions(ed.regions);
    collectEvents(ed);

    renderWorld(ed.world);
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

  // ---------- Month calendar (opens from the date tile) ----------
  // Saudi week: Sunday first; Friday and Saturday are the weekend.
  const WEEK = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const hijriFmt = hasUmmAlQura
    ? new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone: "UTC", day: "numeric", month: "numeric", year: "numeric" })
    : null;
  const utc = (y, m, d) => new Date(Date.UTC(y, m, d, 12));
  const isoOf = (dt) => dt.toISOString().slice(0, 10);
  function hijriOf(dt) {
    if (!hijriFmt) return null;
    const p = Object.fromEntries(hijriFmt.formatToParts(dt).map((x) => [x.type, x.value]));
    return { d: +p.day, m: +p.month, y: parseInt(p.year, 10) };
  }
  let calEvents = [];
  // Events by day. Short runs (a week or less) show on every day; long seasons show on their first and last day only.
  function eventsOn(iso) {
    const out = [];
    for (const e of calEvents) {
      const end = e.end || e.start;
      if (iso < e.start || iso > end) continue;
      const days = (Date.parse(end) - Date.parse(e.start)) / 864e5;
      if (days > 7 && iso !== e.start && iso !== end) continue;
      out.push({ ...e, closing: days > 7 && iso === end && iso !== e.start });
    }
    return out;
  }
  function collectEvents(ed) {
    const list = [];
    for (const ev of ed.events || []) {
      list.push({ kind: "national", start: ev.date, end: ev.end || ev.date, title: ev.title.replace(/\s*\([^)]*\d[^)]*\)\s*$/, "") });
    }
    if (ed.regions) {
      const byCity = {};
      for (const key of CITY_KEYS) byCity[key] = (ed.regions[key] || []).slice();
      for (const [key, items] of Object.entries(byCity)) {
        const city = (CITIES.find((c) => c[0] === key) || [, key])[1];
        for (const e of items) list.push({ kind: "city", city, start: e.start, end: e.end || e.start, title: e.title, place: e.place, url: e.source_url, when: e.when });
      }
    }
    calEvents = list.filter((e) => e.start && !e.when).sort((a, b) => (a.start < b.start ? -1 : 1));
  }

  const cal = $("cal");
  const [ty, tm] = todayISO.split("-").map(Number);
  let view = { y: ty, m: tm - 1 };
  let picked = todayISO;

  function eventLine(e, tag) {
    const n = el(tag, "cal-ev " + e.kind);
    n.append(el("span", "cal-ev-t", (e.closing ? "ختام: " : "") + e.title));
    return n;
  }
  function renderDay() {
    const box = $("cal-day");
    box.textContent = "";
    const [y, m, d] = picked.split("-").map(Number);
    const dt = utc(y, m - 1, d);
    const h = hijriOf(dt);
    const head = el("p", "cal-day-head");
    // Hijri first and bold (the official calendar), Gregorian after it.
    if (h) {
      head.append(el("b", "", `${WEEK[dt.getUTCDay()]} ${h.d} ${HIJRI_SHORT[h.m - 1]} ${h.y} هـ`));
      head.append(el("span", "", ` · ${d} ${MONTHS[m - 1]}`));
    } else head.append(el("b", "", `${WEEK[dt.getUTCDay()]} ${d} ${MONTHS[m - 1]}`));
    box.append(head);
    const evs = eventsOn(picked);
    if (!evs.length) { box.append(el("p", "cal-empty", "لا فعاليات مسجّلة في هذا اليوم.")); return; }
    const ul = el("ul", "cal-list");
    for (const e of evs) {
      const li = el("li", "cal-item " + e.kind);
      const body = e.url ? el("a") : el("div");
      if (e.url) { body.href = e.url; body.target = "_blank"; body.rel = "noopener"; }
      body.append(el("span", "cal-item-t", (e.closing ? "ختام: " : "") + e.title));
      const range = e.end !== e.start ? when({ start: e.start, end: e.end }) : "";
      const meta = [e.kind === "national" ? "وطني" : e.city, e.place, range].filter(Boolean).join(" · ");
      body.append(el("span", "cal-item-m", meta));
      li.append(body);
      ul.append(li);
    }
    box.append(ul);
  }
  function renderCal() {
    const { y, m } = view;
    const first = utc(y, m, 1), last = utc(y, m + 1, 0);
    const h1 = hijriOf(first), h2 = hijriOf(last);
    // Title: the Hijri month(s) this page covers, bold; the Gregorian month under it.
    if (h1) {
      $("cal-month").textContent = h1.m === h2.m ? HIJRI_SHORT[h1.m - 1] : `${HIJRI_SHORT[h1.m - 1]}${h1.y !== h2.y ? " " + h1.y : ""} – ${HIJRI_SHORT[h2.m - 1]}`;
      $("cal-year").textContent = `${h2.y} هـ`;
      $("cal-hijri").textContent = `${MONTHS[m]} ${y}`;
    } else {
      $("cal-month").textContent = MONTHS[m];
      $("cal-year").textContent = y;
      $("cal-hijri").textContent = "";
    }

    const grid = $("cal-grid");
    grid.textContent = "";
    WEEK.forEach((w, i) => grid.append(el("div", "cal-wd" + (i >= 5 ? " wkend" : ""), w)));
    const start = utc(y, m, 1 - first.getUTCDay());
    const weeks = Math.ceil((first.getUTCDay() + last.getUTCDate()) / 7);
    for (let i = 0; i < weeks * 7; i++) {
      const dt = utc(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i);
      const iso = isoOf(dt);
      const cell = el("button", "cal-cell");
      cell.type = "button";
      if (dt.getUTCMonth() !== m) cell.classList.add("out");
      if (iso === todayISO) cell.classList.add("today");
      if (iso === picked) cell.classList.add("picked");
      const h = hijriOf(dt);
      const num = el("span", "cal-num");
      // Hijri day big and bold; the Gregorian day small beside it (month names on the first of each month).
      const gd = dt.getUTCDate(), gLabel = gd === 1 ? `1 ${MONTHS[dt.getUTCMonth()]}` : gd;
      if (h) {
        num.append(el("span", "cal-g", h.d));
        num.append(el("span", "cal-h", h.d === 1 ? HIJRI_SHORT[h.m - 1] : gLabel));
      } else num.append(el("span", "cal-g", gd));
      cell.append(num);
      const evs = eventsOn(iso);
      const lines = el("span", "cal-evs");
      evs.slice(0, 3).forEach((e) => lines.append(eventLine(e, "span")));
      if (evs.length > 3) lines.append(el("span", "cal-more", `+${evs.length - 3}`));
      const dots = el("span", "cal-dots");
      evs.slice(0, 4).forEach((e) => dots.append(el("i", e.kind)));
      cell.append(lines, dots);
      cell.setAttribute("aria-label", `${h ? `${h.d} ${HIJRI_SHORT[h.m - 1]}، ` : ""}${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]}${evs.length ? "، " + evs.length + " فعاليات" : ""}`);
      cell.addEventListener("click", () => {
        picked = iso;
        if (dt.getUTCMonth() !== m) { view = { y: dt.getUTCFullYear(), m: dt.getUTCMonth() }; renderCal(); return; }
        grid.querySelectorAll(".picked").forEach((c) => c.classList.remove("picked"));
        cell.classList.add("picked");
        renderDay();
      });
      grid.append(cell);
    }
    renderDay();
  }
  function step(n) {
    const d = new Date(Date.UTC(view.y, view.m + n, 1));
    view = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    picked = view.y === ty && view.m === tm - 1 ? todayISO : isoOf(utc(view.y, view.m, 1));
    renderCal();
  }
  $("cal-prev").addEventListener("click", () => step(-1));
  $("cal-next").addEventListener("click", () => step(1));
  $("cal-today").addEventListener("click", () => { view = { y: ty, m: tm - 1 }; picked = todayISO; renderCal(); });
  $("cal-close").addEventListener("click", () => cal.close());
  cal.addEventListener("click", (e) => { if (e.target === cal) cal.close(); });
  cal.addEventListener("close", () => $("date-tile").focus());
  function openCal() { view = { y: ty, m: tm - 1 }; picked = todayISO; renderCal(); cal.showModal(); }

  // ---------- Today agenda: hovering or tapping the date tile widens the timeline ----------
  // Timed items (matches, moments) sit at their time; all-day and recurring events are listed in their own box. Prayers stay on the line only.
  const WD = { "أحد": 0, "الأحد": 0, "إثنين": 1, "الإثنين": 1, "الاثنين": 1, "ثلاثاء": 2, "الثلاثاء": 2, "أربعاء": 3, "الأربعاء": 3,
    "خميس": 4, "الخميس": 4, "جمعة": 5, "الجمعة": 5, "سبت": 6, "السبت": 6 };
  const todayDow = utc(ty, tm - 1, +todayISO.slice(8, 10)).getUTCDay();
  function happensToday(e, start, end) {
    if (todayISO < start || todayISO > (end || start)) return false;
    if (!e.when) return true;
    if (/يومي|كل يوم/.test(e.when)) return true;
    const m = e.when.match(/كل\s+(\S+)/);
    return m && m[1] in WD ? WD[m[1]] === todayDow : true;
  }
  // Timed items for today's line: the edition's timeline plus city events that carry a start time.
  function timedToday(ed) {
    const out = (ed.timeline || []).slice();
    const seen = new Set(out.map((x) => x.label + x.time));
    for (const [key, name] of CITIES) {
      for (const e of (ed.regions || {})[key] || []) {
        if (!e.time || !happensToday(e, e.start, e.end)) continue;
        const time = `${todayISO}T${e.time}:00+03:00`;
        if (seen.has(e.title + time)) continue;
        seen.add(e.title + time);
        out.push({ time, label: isMatch(e) ? e.title.replace(/\s*[–-]\s*[^–×-]*$/, "") : e.title, note: [name, e.place].join(" · "), source_url: e.source_url, colors: e.colors, duration: e.duration });
      }
    }
    return out;
  }
  function allDayToday() {
    if (!edition) return [];
    const out = [];
    for (const ev of edition.events || []) {
      if (happensToday(ev, ev.date, ev.end)) out.push({ kind: "national", title: ev.title.replace(/\s*\([^)]*\d[^)]*\)\s*$/, ""), meta: "وطني" + (ev.end && ev.end !== ev.date ? " · " + when({ start: ev.date, end: ev.end }) : "") });
    }
    for (const [key, name] of CITIES) {
      for (const e of (edition.regions || {})[key] || []) {
        if (isExp(e) || e.time || !happensToday(e, e.start, e.end)) continue; // timed events sit on the line; experiences aren't dated
        const span = e.when || (e.end && e.end !== e.start ? when(e) : "");
        out.push({ kind: "city", title: e.title, url: e.source_url, meta: [name, e.place, span].filter(Boolean).join(" · ") });
      }
    }
    return out;
  }
  const tl = $("timeline"), agenda = $("tl-agenda"), tile = $("date-tile");
  let agRows = [];
  function buildAgenda() {
    agenda.textContent = "";
    // Same live day/night world map as the world clocks, across the top of the panel at full width.
    const map = worldNightMap(new Date(), "ag");
    if (map) {
      map.setAttribute("class", "clocks-map ag-map");
      map.setAttribute("preserveAspectRatio", "xMidYMin meet");
      agenda.append(map);
    }
    agRows = [];
    if (!dayModel) return;
    const { items } = dayModel;
    const head = el("div", "ag-head");
    const top = el("div", "ag-top");
    const date = el("p", "ag-date");
    const h = hijriOf(utc(ty, tm - 1, +todayISO.slice(8, 10)));
    const wd = part("gregory", { weekday: "long" });
    if (h) { // Hijri first and bold (the official calendar), Gregorian after it
      date.append(el("b", "", `${wd} ${h.d} ${HIJRI_SHORT[h.m - 1]} ${h.y} هـ`));
      date.append(" ", el("span", "", `${+todayISO.slice(8, 10)} ${MONTHS[tm - 1]}`)); // may wrap as a whole under the Hijri date
    } else date.append(el("b", "", `${wd} ${+todayISO.slice(8, 10)} ${MONTHS[tm - 1]}`));
    // Header like the reader's sketch: just the date beside the tile, no buttons. Tapping the date opens the month;
    // the tile, Esc or a tap outside closes the panel.
    const open = el("button", "ag-date-btn");
    open.type = "button";
    open.title = "عرض الشهر";
    open.addEventListener("click", () => { collapse(true); openCal(); });
    open.append(date);
    top.append(open);
    head.append(top);
    const all = allDayToday();
    let allBox = null;
    if (all.length) {
      allBox = el("div", "ag-allbox");
      allBox.append(el("p", "ag-sec", "طوال اليوم"));
      const ul = el("ul", "ag-all");
      for (const e of all) {
        const li = el("li", e.kind);
        const body = e.url ? el("a") : el("div");
        if (e.url) { body.href = e.url; body.target = "_blank"; body.rel = "noopener"; }
        body.append(el("span", "ag-t", e.title), el("span", "ag-m", e.meta));
        li.append(body);
        ul.append(li);
      }
      allBox.append(ul);
    }
    agenda.append(head);
    if (allBox) agenda.append(allBox);

    const list = [
      ...items.map((e) => ({ t: e.at, end: e.end, kind: "event", name: e.label, note: e.note, url: e.source_url, colors: e.colors })),
      { t: now, kind: "now", name: "الآن" },
    ].sort((a, b) => a.t - b.t);
    for (const r of list) {
      const past = r.kind !== "now" && (r.end || r.t) < now;
      let row;
      if (r.kind === "event") { // same card as the all-day events: title, then time · city · place
        row = el("div", "ag-row ag-card" + (past ? " past" : ""));
        const body = r.url ? el("a") : el("div");
        if (r.url) { body.href = r.url; body.target = "_blank"; body.rel = "noopener"; }
        const range = clock.format(r.t); // start time only
        body.append(el("span", "ag-t", r.name), el("span", "ag-m", [range, r.note].filter(Boolean).join(" · ")));
        row.append(body);
      } else {
        row = el("div", "ag-row " + r.kind);
        row.append(el("span", "ag-name", r.name), el("span", "ag-time", clock.format(r.t)));
      }
      agenda.append(row);
      agRows.push({ row, t: r.t, end: r.end, colors: r.colors });
    }
    const lead = document.createElementNS(SVGNS, "svg");
    lead.classList.add("ag-leaders");
    lead.setAttribute("aria-hidden", "true");
    agenda.append(lead);
  }
  // Each row sits at its time on the line; rows that would overlap are nudged apart and joined to their time by a thin leader.
  function layoutAgenda() {
    if (!dayModel || agenda.hidden) return;
    const H = agenda.clientHeight;
    const headH = agenda.querySelector(".ag-head").offsetHeight;
    const box = agenda.querySelector(".ag-allbox");
    const place = (floor) => {
      const rows = agRows.map(({ row, t, end, colors }) => ({ row, a: (dayModel.pos(t) / 100) * H, b: end ? (dayModel.pos(end) / 100) * H : null, colors, h: row.offsetHeight }));
      let prev = floor;
      for (const r of rows) { r.y = Math.max(r.a - r.h / 2, prev); prev = r.y + r.h + 3; }
      let next = H - 6;
      for (let i = rows.length - 1; i >= 0; i--) { const r = rows[i]; r.y = Math.min(r.y, next - r.h); next = r.y - 3; }
      return rows;
    };
    let rows = place(headH + 4);
    // All-day events float in the largest quiet stretch of the day (usually late morning), so timed rows keep their place.
    if (box) {
      box.style.maxHeight = "";
      const need = Math.min(box.scrollHeight, 150);
      let best = { top: headH, size: 0 };
      const edges = [headH, ...rows.flatMap((r) => [r.y, r.y + r.h]), H];
      for (let i = 0; i < edges.length; i += 2) {
        const size = edges[i + 1] - edges[i];
        if (size > best.size) best = { top: edges[i], size };
      }
      if (best.size - 16 >= need) {
        box.style.top = best.top + 8 + "px";
        box.style.maxHeight = best.size - 16 + "px";
      } else { // no room: list them under the header and let the timed rows follow
        box.style.top = headH + "px";
        box.style.maxHeight = Math.round(H * 0.4) + "px";
        rows = place(headH + box.offsetHeight + 8);
      }
    }
    if (box) box.classList.toggle("more", box.scrollHeight > box.clientHeight + 2); // fade hints that the list scrolls
    const svg = agenda.querySelector("svg.ag-leaders");
    svg.setAttribute("width", 24);
    svg.setAttribute("height", H);
    svg.innerHTML = rows.map((r) => {
      const ym = r.y + r.h / 2;
      return `<path d="M0 ${r.a.toFixed(1)} H6 L18 ${ym.toFixed(1)} H24"/>`;
    }).join("");
    rows.forEach((r) => { r.row.style.top = r.y + "px"; });
  }
  let pinned = false, hideT = 0;
  // After the panel is closed on purpose (✕, Esc, tap outside), the pointer is often still over the tile.
  // Hover won't reopen it until the pointer has left the tile once; a click still does.
  let hoverLock = false;
  function expand(pin) {
    clearTimeout(hideT);
    if (pin) pinned = true;
    if (tl.classList.contains("expanded")) return;
    buildAgenda();
    agenda.hidden = false;
    tl.classList.add("expanded");
    tile.setAttribute("aria-expanded", "true");
    closeBubbles(); // the panel already shows everything the line's bubbles would
    clearTile();
    layoutAgenda();
  }
  // The date tile stays on top of the open panel; the panel's header starts below it wherever they overlap.
  function clearTile() {
    const head = agenda.querySelector(".ag-head");
    if (!head) return;
    head.style.paddingTop = head.style.minHeight = head.style.paddingLeft = "";
    // The day's details start under the world map (and under the tile, if it reaches lower), so the map stays clear.
    const a = agenda.getBoundingClientRect(), t = tile.getBoundingClientRect();
    const map = agenda.querySelector(".ag-map");
    let below = map ? map.getBoundingClientRect().bottom - a.top : 0;
    if (t.left < a.right && t.right > a.left && t.bottom > a.top) below = Math.max(below, t.bottom - a.top);
    if (below) head.style.paddingTop = Math.round(below + 8) + "px";
  }
  function collapse(byUser) {
    clearTimeout(hideT);
    if (byUser) hoverLock = true;
    pinned = false;
    tl.classList.remove("expanded");
    agenda.hidden = true;
    tile.setAttribute("aria-expanded", "false");
  }
  const laterCollapse = () => { if (!pinned) { clearTimeout(hideT); hideT = setTimeout(collapse, 300); } };
  tile.setAttribute("aria-label", tile.getAttribute("aria-label") + ". اعرض أحداث اليوم");
  tile.addEventListener("click", (e) => { e.stopPropagation(); if (pinned) collapse(true); else expand(true); });
  tile.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (pinned) collapse(true); else expand(true); } });
  if (matchMedia("(hover: hover)").matches) {
    tile.addEventListener("mouseenter", () => { if (!hoverLock) expand(false); });
    tile.addEventListener("mouseleave", () => { hoverLock = false; laterCollapse(); });
    tl.addEventListener("mouseenter", () => clearTimeout(hideT));
    tl.addEventListener("mouseleave", laterCollapse);
  }
  agenda.addEventListener("click", (e) => { e.stopPropagation(); pinned = true; });
  document.addEventListener("click", () => { if (tl.classList.contains("expanded")) collapse(true); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && tl.classList.contains("expanded")) { collapse(true); tile.focus({ preventScroll: true }); } });
  addEventListener("resize", () => { clearTile(); layoutAgenda(); });

  renderTimeline([]);
  loadWeather();
  renderEdition();
})();
