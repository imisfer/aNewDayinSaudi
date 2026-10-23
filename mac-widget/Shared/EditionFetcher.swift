import Foundation
import os

/// Fetches today's headline from the live site's published data file — the
/// same data/edition.json the web page itself reads.
enum EditionFetcher {
    private static let url = URL(string: "https://imisfer.github.io/aNewDayinSaudi/data/edition.json")!
    private static let logger = Logger(subsystem: "info.misfer.yawm.debug", category: "edition")

    static func fetch() async -> Edition? {
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 8)
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            logger.error("request failed: \(error as NSObject, privacy: .public)")
            return nil
        }
        guard let http = response as? HTTPURLResponse else {
            logger.error("no HTTPURLResponse")
            return nil
        }
        guard http.statusCode == 200 else {
            logger.error("HTTP \(http.statusCode, privacy: .public)")
            return nil
        }
        do {
            return try JSONDecoder().decode(Edition.self, from: data)
        } catch {
            logger.error("decode failed: \(error as NSObject, privacy: .public)")
            return nil
        }
    }
}
