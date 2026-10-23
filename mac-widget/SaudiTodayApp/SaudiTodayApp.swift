import SwiftUI
import WidgetKit

@main
struct SaudiTodayApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.layoutDirection, .rightToLeft)
                .environment(\.locale, Locale(identifier: "ar"))
                .onAppear { WidgetCenter.shared.reloadAllTimelines() }
        }
        .windowResizability(.contentSize)
    }
}
