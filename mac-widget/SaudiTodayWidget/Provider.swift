import WidgetKit

struct WidgetEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WidgetEntry {
        let now = Date()
        let prayers = PrayerCalculator.today(asOf: now) ?? []
        return WidgetEntry(
            date: now,
            snapshot: WidgetSnapshot(
                now: now,
                headline: "«4,291 وظيفة صحية» للسعوديين في 20 تجمعًا، و«ورش السيارات» ملزمة بانتظار مكيّف يتيح متابعة الصيانة",
                editionIsStale: false,
                nextOccasion: UpcomingOccasion(title: "إجازة الخريف", dateISO: now.isoDateRiyadh, estimated: false, daysAway: 5),
                nextHoliday: UpcomingOccasion(title: "إجازة الخريف", dateISO: now.isoDateRiyadh, estimated: false, daysAway: 5),
                nextCelebratedDay: UpcomingOccasion(title: "اليوم العالمي للسكري", dateISO: now.isoDateRiyadh, estimated: false, daysAway: 22),
                nextPrayerName: "عصر",
                nextPrayerTime: now.addingTimeInterval(3600),
                todayPrayers: prayers
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (WidgetEntry) -> Void) {
        // Instant, offline — used for the widget gallery preview.
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetEntry>) -> Void) {
        Task {
            let now = Date()
            let edition = await EditionFetcher.fetch()
            let (holiday, day) = OccasionsStore.nextBoth(asOf: now)
            let occasion: UpcomingOccasion? = {
                switch (holiday, day) {
                case (nil, nil): return nil
                case (let h?, nil): return h
                case (nil, let d?): return d
                case (let h?, let d?): return h.daysAway <= d.daysAway ? h : d
                }
            }()
            let prayer = PrayerCalculator.next(asOf: now)
            let prayers = PrayerCalculator.today(asOf: now) ?? []

            let editionIsStale = (edition?.editionDate ?? "") != now.isoDateRiyadh

            let entry = WidgetEntry(
                date: now,
                snapshot: WidgetSnapshot(
                    now: now,
                    headline: edition?.headline,
                    editionIsStale: editionIsStale,
                    nextOccasion: occasion,
                    nextHoliday: holiday,
                    nextCelebratedDay: day,
                    nextPrayerName: prayer?.name,
                    nextPrayerTime: prayer?.time,
                    todayPrayers: prayers
                )
            )

            // Refresh again after the next prayer passes, or in 4 hours,
            // whichever comes first — keeps the widget's countdown honest
            // without asking WidgetKit for more than it will grant.
            let nextRefresh = prayer.map { min($0.time.addingTimeInterval(60), now.addingTimeInterval(4 * 3600)) }
                ?? now.addingTimeInterval(4 * 3600)
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }
}
