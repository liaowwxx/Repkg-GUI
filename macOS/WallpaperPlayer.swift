import Cocoa
import AVFoundation

class WallpaperWindow: NSWindow {
    init(screen: NSScreen, videoURL: URL, isMuted: Bool) {
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
        player.isMuted = isMuted
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
    let isMuted: Bool
    
    init(videoURL: URL, isMuted: Bool) {
        self.videoURL = videoURL
        self.isMuted = isMuted
    }
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        for screen in NSScreen.screens {
            let window = WallpaperWindow(screen: screen, videoURL: videoURL, isMuted: isMuted)
            window.makeKeyAndOrderFront(nil)
            windows.append(window)
        }
    }
}

let args = CommandLine.arguments
if args.count < 2 {
    print("Usage: WallpaperPlayer <video_path> [--mute]")
    exit(1)
}

let videoPath = args[1]
let isMuted = args.contains("--mute")
let videoURL = URL(fileURLWithPath: videoPath)

let app = NSApplication.shared
let delegate = AppDelegate(videoURL: videoURL, isMuted: isMuted)
app.delegate = delegate
app.run()
