import SwiftUI
import WidgetKit

// MARK: - Small: the date tile + next prayer, mirrors the site's date-tile + timeline.
struct SmallWidgetView: View {
    let entry: WidgetEntry

    var body: some View {
        let hijri = ArabicFormat.hijri(entry.snapshot.now)
        VStack(alignment: .trailing, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Spacer()
                VStack(alignment: .trailing, spacing: 0) {
                    Text(hijri.day)
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    Text(hijri.month)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.85))
                }
            }
            Text(ArabicFormat.dayMonth(entry.snapshot.now))
                .font(.system(size: 11))
                .foregroundStyle(.white.opacity(0.6))

            Spacer(minLength: 0)

            if let name = entry.snapshot.nextPrayerName, let time = entry.snapshot.nextPrayerTime {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(name)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color(hex: "b8a5ee"))
                    HStack(spacing: 4) {
                        Text(time, style: .relative)
                            .font(.system(size: 11))
                            .foregroundStyle(.white.opacity(0.65))
                        Text(ArabicFormat.clock(time))
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.white.opacity(0.9))
                    }
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
        .environment(\.layoutDirection, .rightToLeft)
        .environment(\.locale, Locale(identifier: "ar"))
        .containerBackground(for: .widget) {
            LinearGradient(colors: [Color(hex: "0e1838"), Color(hex: "27305c")], startPoint: .top, endPoint: .bottom)
        }
    }
}

// MARK: - Medium: today's headline + the next occasion, mirrors the lead + «قادم».
struct MediumWidgetView: View {
    let entry: WidgetEntry

    var body: some View {
        VStack(alignment: .trailing, spacing: 8) {
            Text("يـومٌ جـديد في السـُعـوديَّـة")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Color(hex: "b8a5ee"))

            if let headline = entry.snapshot.headline {
                Text(headline)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white)
                    .lineLimit(3)
                    .multilineTextAlignment(.trailing)
            } else {
                Text("تعذّر تحميل موجز اليوم")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.6))
            }

            Spacer(minLength: 0)

            if let occ = entry.snapshot.nextOccasion {
                HStack {
                    Spacer()
                    Text(ArabicFormat.countdown(daysAway: occ.daysAway))
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.55))
                    Text("·").foregroundStyle(.white.opacity(0.3))
                    Text(occ.title + (occ.estimated ? " (متوقع)" : ""))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.85))
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
        .environment(\.layoutDirection, .rightToLeft)
        .environment(\.locale, Locale(identifier: "ar"))
        .containerBackground(for: .widget) {
            Color(hex: "111513")
        }
    }
}

// MARK: - Extra large: headline + today's full prayer row + both occasion columns.
struct ExtraLargeWidgetView: View {
    let entry: WidgetEntry

    private func occasionBlock(title: String, occasion: UpcomingOccasion?) -> some View {
        VStack(alignment: .trailing, spacing: 4) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Color(hex: "b8a5ee"))
            if let occasion {
                Text(occasion.title + (occasion.estimated ? " (متوقع)" : ""))
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                    .multilineTextAlignment(.trailing)
                Text(ArabicFormat.countdown(daysAway: occasion.daysAway))
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.55))
            } else {
                Text("لا يوجد قريبًا").font(.system(size: 12)).foregroundStyle(.white.opacity(0.4))
            }
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
    }

    var body: some View {
        let now = entry.snapshot.now
        HStack(alignment: .top, spacing: 20) {
            // Left: the day's six prayer times, soonest highlighted.
            VStack(alignment: .trailing, spacing: 10) {
                ForEach(entry.snapshot.todayPrayers, id: \.key) { slot in
                    let isNext = entry.snapshot.nextPrayerName == slot.name && slot.time == entry.snapshot.nextPrayerTime
                    HStack(spacing: 8) {
                        Text(ArabicFormat.clock(slot.time))
                            .font(.system(size: 12, weight: isNext ? .bold : .regular))
                            .foregroundStyle(isNext ? Color(hex: "b8a5ee") : .white.opacity(slot.time < now ? 0.35 : 0.75))
                        Text(slot.name)
                            .font(.system(size: 12, weight: isNext ? .bold : .medium))
                            .foregroundStyle(isNext ? Color(hex: "b8a5ee") : .white.opacity(slot.time < now ? 0.35 : 0.75))
                            .frame(width: 44, alignment: .trailing)
                    }
                }
            }
            .frame(width: 110)

            Divider().overlay(Color.white.opacity(0.15))

            // Middle: today's headline.
            VStack(alignment: .trailing, spacing: 8) {
                Text("يـومٌ جـديد في السـُعـوديَّـة")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color(hex: "b8a5ee"))
                if let headline = entry.snapshot.headline {
                    Text(headline)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.white)
                        .lineLimit(5)
                        .multilineTextAlignment(.trailing)
                } else {
                    Text("تعذّر تحميل موجز اليوم")
                        .font(.system(size: 13))
                        .foregroundStyle(.white.opacity(0.6))
                }
                Spacer(minLength: 0)
                Text(ArabicFormat.dayMonth(now))
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.5))
            }
            .frame(maxWidth: .infinity, alignment: .trailing)

            Divider().overlay(Color.white.opacity(0.15))

            // Right: the two «قادم» columns, matching the site.
            HStack(alignment: .top, spacing: 16) {
                occasionBlock(title: "إجازات", occasion: entry.snapshot.nextHoliday)
                occasionBlock(title: "أيام نحتفي بها", occasion: entry.snapshot.nextCelebratedDay)
            }
            .frame(width: 220)
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
        .environment(\.layoutDirection, .rightToLeft)
        .environment(\.locale, Locale(identifier: "ar"))
        .containerBackground(for: .widget) {
            Color(hex: "111513")
        }
    }
}

struct SaudiTodayWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: WidgetEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemExtraLarge:
            ExtraLargeWidgetView(entry: entry)
        default:
            MediumWidgetView(entry: entry)
        }
    }
}
