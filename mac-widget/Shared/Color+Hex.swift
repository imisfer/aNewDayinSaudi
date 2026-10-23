import SwiftUI

extension Color {
    /// "#RRGGBB" — matches the site's palette (assets/style.css).
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        s.removeAll { $0 == "#" }
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        let r = Double((v >> 16) & 0xFF) / 255
        let g = Double((v >> 8) & 0xFF) / 255
        let b = Double(v & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }

    // From assets/style.css :root.
    static let siteAccent = Color(hex: "0b5d3b") // green
    static let siteLavender = Color(hex: "6f58b0")
    static let siteBG = Color(hex: "f7f5f0")
    static let siteInk = Color(hex: "1b1f1d")
}
