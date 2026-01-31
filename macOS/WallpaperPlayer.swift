import Cocoa
import AVFoundation

class WallpaperWindow: NSWindow {
    init(screen: NSScreen, videoURL: URL) {
        super.init(
            contentRect: screen.frame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        
        self.level = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.desktopWindow)))
        self.canHide = false
        self.ignoresMouseEvents = true
        self.collectionBehavior = [.canJoinAllSpaces, .stationary]
        self.backgroundColor = .black
        
        let player = AVPlayer(url: videoURL)
        let playerLayer = AVPlayerLayer(player: player)
        playerLayer.frame = self.contentView!.bounds
        playerLayer.videoGravity = .resizeAspectFill
        
        let view = NSView(frame: self.contentView!.bounds)
        view.wantsLayer = true
        view.layer?.addSublayer(playerLayer)
        self.contentView = view
        
        NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: player.currentItem, queue: .main) { _ in
            player.seek(to: .zero)
            player.play()
        }
        
        player.play()
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var windows: [WallpaperWindow] = []
    let videoURL: URL
    
    init(videoURL: URL) {
        self.videoURL = videoURL
    }
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        for screen in NSScreen.screens {
            let window = WallpaperWindow(screen: screen, videoURL: videoURL)
            window.makeKeyAndOrderFront(nil)
            windows.append(window)
        }
    }
}

let args = CommandLine.arguments
if args.count < 2 {
    print("Usage: WallpaperPlayer <video_path>")
    exit(1)
}

let videoPath = args[1]
let videoURL = URL(fileURLWithPath: videoPath)

let app = NSApplication.shared
let delegate = AppDelegate(videoURL: videoURL)
app.delegate = delegate
app.run()
