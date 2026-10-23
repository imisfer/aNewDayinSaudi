import Foundation

enum TZ {
    // Riyadh is fixed, matching the site (assets/app.js: LOCATION).
    static let riyadh = TimeZone(identifier: "Asia/Riyadh")!
}

enum ArabicFormat {
    /// "٢٠ نوفمبر" — matches the site's fmtDate(): Arabic-Gregorian day + long month.
    static func dayMonth(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ar_SA")
        f.calendar = Calendar(identifier: .gregorian)
        f.timeZone = TZ.riyadh
        f.setLocalizedDateFormatFromTemplate("d MMMM")
        return f.string(from: date)
    }

    /// Short Hijri day/month/year tile, Umm al-Qura calendar.
    static func hijri(_ date: Date) -> (day: String, month: String, year: String) {
        var cal = Calendar(identifier: .islamicUmmAlQura)
        cal.timeZone = TZ.riyadh
        cal.locale = Locale(identifier: "ar_SA")
        let c = cal.dateComponents([.day, .month, .year], from: date)
        let monthNames = [
            "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
            "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
        ]
        let day = String(c.day ?? 1)
        let month = monthNames[((c.month ?? 1) - 1 + 12) % 12]
        let year = String(c.year ?? 0)
        return (day, month, year)
    }

    /// "بعد 5 أيام" / "غدًا" / "اليوم" — matches the site's countdown() exactly.
    static func countdown(daysAway n: Int) -> String {
        if n < 0 { return "" }
        if n == 0 { return "اليوم" }
        if n == 1 { return "غدًا" }
        if n == 2 { return "بعد يومين" }
        let r = n % 100
        let unit: String
        if r >= 3 && r <= 10 { unit = "أيام" } else if n >= 100 && r <= 2 { unit = "يوم" } else { unit = "يومًا" }
        return "بعد \(n) \(unit)"
    }

    /// "11:34 م" style 12-hour clock, matching the site's `clock` formatter.
    static func clock(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ar-SA-u-nu-latn")
        f.timeZone = TZ.riyadh
        f.dateFormat = "h:mm a"
        return f.string(from: date)
    }

    static let prayerNames: [String: String] = [
        "fajr": "فجر", "sunrise": "شروق", "dhuhr": "ظهر",
        "asr": "عصر", "maghrib": "مغرب", "isha": "عشاء",
    ]
}

extension Date {
    /// "YYYY-MM-DD" in Riyadh time, matching the site's todayISO.
    var isoDateRiyadh: String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.timeZone = TZ.riyadh
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: self)
    }

    static func fromISODate(_ iso: String) -> Date? {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.timeZone = TZ.riyadh
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: iso)
    }

    /// Whole days between this date's Riyadh-local day and another's.
    func daysUntil(_ iso: String) -> Int? {
        guard let target = Date.fromISODate(iso) else { return nil }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TZ.riyadh
        let from = cal.startOfDay(for: self)
        let to = cal.startOfDay(for: target)
        return cal.dateComponents([.day], from: from, to: to).day
    }
}
