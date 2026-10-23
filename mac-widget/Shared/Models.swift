import Foundation

// Mirrors the subset of data/edition.json the widget needs.
struct Edition: Decodable {
    let editionDate: String
    let headline: String

    enum CodingKeys: String, CodingKey {
        case editionDate = "edition_date"
        case headline
    }
}

// Mirrors data/occasions.json (holidays + celebrated days), as published
// alongside the site. The widget bundles a snapshot and treats it as static
// reference data reviewed once a year — see Shared/README in the repo root.
struct OccasionsFile: Decodable {
    let holidays: [Occasion]
    let days: [CelebratedDay]
}

struct Occasion: Decodable {
    let title: String
    let date: String?
    let start: String?
    let end: String?
    let estimated: Bool?
    let note: String?

    var targetDate: String { date ?? start ?? "" }
}

struct CelebratedDay: Decodable {
    let on: String // "MM-DD" (yearly) or "YYYY-MM-DD" (dated, e.g. moon-sighting dependent)
    let title: String
    let tag: String?
    let estimated: Bool?
}

// One resolved, display-ready "next occasion" for the widget.
struct UpcomingOccasion {
    let title: String
    let dateISO: String
    let estimated: Bool
    let daysAway: Int
}

struct WidgetSnapshot {
    let now: Date
    let headline: String?
    let editionIsStale: Bool
    let nextOccasion: UpcomingOccasion? // merged holiday/day, nearest first — used by small/medium
    let nextHoliday: UpcomingOccasion?
    let nextCelebratedDay: UpcomingOccasion?
    let nextPrayerName: String?
    let nextPrayerTime: Date?
    let todayPrayers: [PrayerSlot] // all six, Fajr through Isha — used by extraLarge
}
