import Adhan
import Foundation

struct PrayerSlot {
    let key: String
    let name: String
    let time: Date
}

enum PrayerCalculator {
    // Matches assets/app.js: LOCATION = { lat: 24.7136, lng: 46.6753 } (Riyadh).
    private static let coordinates = Coordinates(latitude: 24.7136, longitude: 46.6753)

    private static func times(onDaysFromNow offset: Int, from now: Date) -> PrayerTimes? {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TZ.riyadh
        guard let day = cal.date(byAdding: .day, value: offset, to: now) else { return nil }
        let comps = cal.dateComponents([.year, .month, .day], from: day)
        return PrayerTimes(coordinates: coordinates, date: comps, calculationParameters: CalculationMethod.ummAlQura.params)
    }

    /// Today's six prayer slots (Fajr through Isha, sunrise included), in order.
    static func today(asOf now: Date) -> [PrayerSlot]? {
        guard let t = times(onDaysFromNow: 0, from: now) else { return nil }
        let ordered: [(String, Date)] = [
            ("fajr", t.fajr), ("sunrise", t.sunrise), ("dhuhr", t.dhuhr),
            ("asr", t.asr), ("maghrib", t.maghrib), ("isha", t.isha),
        ]
        return ordered.map { PrayerSlot(key: $0.0, name: ArabicFormat.prayerNames[$0.0] ?? $0.0, time: $0.1) }
    }

    /// The next prayer (or sunrise) at or after `now`.
    /// Falls back to tomorrow's Fajr if `now` is after today's Isha.
    static func next(asOf now: Date) -> PrayerSlot? {
        if let slot = today(asOf: now)?.first(where: { $0.time > now }) {
            return slot
        }
        guard let tomorrow = times(onDaysFromNow: 1, from: now) else { return nil }
        return PrayerSlot(key: "fajr", name: ArabicFormat.prayerNames["fajr"]!, time: tomorrow.fajr)
    }
}
