import SwiftUI
import WidgetKit

struct SaudiTodayWidget: Widget {
    let kind = "SaudiTodayWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SaudiTodayWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("يوم جديد في السعودية")
        .description("الموجز اليومي، وأقرب صلاة أو إجازة أو يوم نحتفي به.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemExtraLarge])
    }
}

@main
struct SaudiTodayWidgetBundle: WidgetBundle {
    var body: some Widget {
        SaudiTodayWidget()
    }
}
