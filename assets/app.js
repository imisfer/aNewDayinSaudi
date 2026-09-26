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

    $("headline").textContent = ed.headline;
    $("edition-label").textContent = "موجز " + fmtDate(ed.edition_date);
    if (ed.status === "pilot") $("pilot-note").hidden = false;

    const ul = $("cards");
    for (const c of ed.cards.slice(0, 8)) {
      const li = el("li", "card");
      const a = el("a");
      a.href = c.source_url;
      a.target = "_blank";
      a.rel = "noopener";
      const meta = el("div", "meta");
      meta.append(el("span", "cat", c.category), el("time", "", fmtDate(c.date)));
      meta.lastChild.dateTime = c.date;
      a.append(meta, el("h3", "", c.title), el("p", "", c.summary), el("div", "src", c.source_name));
      li.append(a);
      ul.append(li);
    }

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
  renderWeather();
  renderEdition();
})();
