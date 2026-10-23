import SwiftUI

/// A minimal native shell: today's headline and the next occasion, read from
/// the same data the widget uses, plus a link to the full site. This is the
/// app's own content — proof of concept scope, built out later.
struct ContentView: View {
    @State private var edition: Edition?
    @State private var loadFailed = false
    private let occasion = OccasionsStore.next(asOf: Date())

    var body: some View {
        VStack(alignment: .trailing, spacing: 16) {
            Text("يـومٌ جـديد في السـُعـوديَّـة")
                .font(.title2.bold())
                .foregroundStyle(Color.siteLavender)

            Group {
                if let edition {
                    Text(edition.headline)
                        .font(.body)
                        .multilineTextAlignment(.trailing)
                } else if loadFailed {
                    Text("تعذّر تحميل موجز اليوم. حاول مرة أخرى بعد قليل.")
                        .foregroundStyle(.secondary)
                } else {
                    ProgressView()
                }
            }
            .frame(maxWidth: .infinity, alignment: .trailing)

            if let occasion {
                HStack {
                    Spacer()
                    Text(ArabicFormat.countdown(daysAway: occasion.daysAway))
                        .foregroundStyle(.secondary)
                    Text("·").foregroundStyle(.secondary)
                    Text(occasion.title)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.siteLavender)
                }
                .font(.subheadline)
            }

            Divider()

            Link("فتح الموقع الكامل ↗", destination: URL(string: "https://imisfer.github.io/aNewDayinSaudi/")!)
                .font(.subheadline)
                .foregroundStyle(Color.siteAccent)

            Text("أضف الودجت من مركز الإشعارات، أو بالنقر مع الاستمرار على سطح المكتب ثم «تحرير الودجتات».")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(24)
        .frame(width: 360)
        .task {
            edition = await EditionFetcher.fetch()
            loadFailed = (edition == nil)
        }
    }
}

#Preview {
    ContentView()
}
