import Foundation

/// Loads the bundled occasions.json snapshot (holidays + celebrated days) and
/// resolves "what's next", the same way the site's renderOccasions() does:
/// holidays are kept while still running (end >= today); yearly celebrated
/// days ("MM-DD") roll forward to their next occurrence.
enum OccasionsStore {
    static func load() -> OccasionsFile? {
        guard let url = Bundle.main.url(forResource: "occasions", withExtension: "json"),
            let data = try? Data(contentsOf: url)
        else { return nil }
        return try? JSONDecoder().decode(OccasionsFile.self, from: data)
    }

    static func nextHoliday(in file: OccasionsFile, asOf now: Date) -> UpcomingOccasion? {
        let todayISO = now.isoDateRiyadh
        return file.holidays
            .filter { ($0.end ?? $0.targetDate) >= todayISO }
            .sorted { ($0.start ?? $0.targetDate) < ($1.start ?? $1.targetDate) }
            .first
            .flatMap { h -> UpcomingOccasion? in
                guard let days = now.daysUntil(h.targetDate) else { return nil }
                return UpcomingOccasion(title: h.title, dateISO: h.targetDate, estimated: h.estimated ?? false, daysAway: max(days, 0))
            }
    }

    static func nextCelebratedDay(in file: OccasionsFile, asOf now: Date) -> UpcomingOccasion? {
        let todayISO = now.isoDateRiyadh
        let year = Calendar(identifier: .gregorian).component(.year, from: now)
        return file.days
            .compactMap { d -> (CelebratedDay, String)? in
                if d.on.count == 5 {
                    var iso = "\(year)-\(d.on)"
                    if iso < todayISO { iso = "\(year + 1)-\(d.on)" }
                    return (d, iso)
                }
                return d.on >= todayISO ? (d, d.on) : nil
            }
            .sorted { $0.1 < $1.1 }
            .first
            .flatMap { (d, iso) -> UpcomingOccasion? in
                guard let days = now.daysUntil(iso) else { return nil }
                return UpcomingOccasion(title: d.title, dateISO: iso, estimated: d.estimated ?? false, daysAway: max(days, 0))
            }
    }

    /// The single nearest upcoming item across both holidays and celebrated
    /// days, as of `now`. Returns nil if the bundled file is missing or empty.
    static func next(asOf now: Date) -> UpcomingOccasion? {
        guard let file = load() else { return nil }
        let holiday = nextHoliday(in: file, asOf: now)
        let day = nextCelebratedDay(in: file, asOf: now)
        switch (holiday, day) {
        case (nil, nil): return nil
        case (let h?, nil): return h
        case (nil, let d?): return d
        case (let h?, let d?): return h.daysAway <= d.daysAway ? h : d
        }
    }

    /// Both nearest-upcoming items separately — for the extraLarge layout,
    /// which (like the site's two "قادم" columns) shows a holiday and a
    /// celebrated day side by side rather than merging them into one line.
    static func nextBoth(asOf now: Date) -> (holiday: UpcomingOccasion?, day: UpcomingOccasion?) {
        guard let file = load() else { return (nil, nil) }
        return (nextHoliday(in: file, asOf: now), nextCelebratedDay(in: file, asOf: now))
    }
}
