#!/bin/bash
# Installer daglig cron-jobb på macOS som kjører daglig.sh kl 22:30 alle hverdager
# Kjør: bash scripts/install-cron.sh

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.kman.daglig.plist"
LOG_DIR="$REPO_DIR/.claude/logs"

mkdir -p "$LOG_DIR"

cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kman.daglig</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$REPO_DIR/scripts/daglig.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$REPO_DIR</string>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/daglig-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/daglig-stderr.log</string>
    <key>StartCalendarInterval</key>
    <array>
        <dict>
            <key>Hour</key><integer>22</integer>
            <key>Minute</key><integer>30</integer>
            <key>Weekday</key><integer>1</integer>
        </dict>
        <dict>
            <key>Hour</key><integer>22</integer>
            <key>Minute</key><integer>30</integer>
            <key>Weekday</key><integer>2</integer>
        </dict>
        <dict>
            <key>Hour</key><integer>22</integer>
            <key>Minute</key><integer>30</integer>
            <key>Weekday</key><integer>3</integer>
        </dict>
        <dict>
            <key>Hour</key><integer>22</integer>
            <key>Minute</key><integer>30</integer>
            <key>Weekday</key><integer>4</integer>
        </dict>
        <dict>
            <key>Hour</key><integer>22</integer>
            <key>Minute</key><integer>30</integer>
            <key>Weekday</key><integer>5</integer>
        </dict>
    </array>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
EOF

# Unload old version if exists, then load new
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo "✅ Installert! Pipeline kjører automatisk hver mandag-fredag kl 22:30"
echo ""
echo "Logger: $LOG_DIR/daglig-{stdout,stderr}.log"
echo ""
echo "Slå av:  launchctl unload $PLIST"
echo "Test nå: launchctl start com.kman.daglig"
