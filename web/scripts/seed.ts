import { db } from "../lib/db";
import { releaseFiles, releases, updateLogs } from "../lib/db/schema";
import type { Platform, UpdateStatus } from "../lib/types";

const seedReleases = [
    {
        id: "rel_001",
        version: "2.1.0",
        releaseNotes:
            "Major update with new features:\n- Dark mode support\n- Improved performance\n- Bug fixes for auto-update",
        createdAt: new Date("2024-01-15T10:30:00Z"),
        isEnabled: true,
        files: [
            {
                id: "file_001_mac",
                platform: "mac" as Platform,
                fileName: "MyApp-2.1.0-arm64.dmg",
                fileSize: 89_400_000,
                downloadUrl: "/uploads/2.1.0/MyApp-2.1.0-arm64.dmg",
                downloadCount: 1247,
            },
            {
                id: "file_001_windows",
                platform: "windows" as Platform,
                fileName: "MyApp-Setup-2.1.0.exe",
                fileSize: 76_200_000,
                downloadUrl: "/uploads/2.1.0/MyApp-Setup-2.1.0.exe",
                downloadCount: 3892,
            },
        ],
    },
    {
        id: "rel_002",
        version: "2.0.5",
        releaseNotes:
            "Hotfix release:\n- Fixed critical crash on startup\n- Memory leak fix",
        createdAt: new Date("2024-01-10T14:20:00Z"),
        isEnabled: true,
        files: [
            {
                id: "file_002_mac",
                platform: "mac" as Platform,
                fileName: "MyApp-2.0.5-arm64.dmg",
                fileSize: 88_100_000,
                downloadUrl: "/uploads/2.0.5/MyApp-2.0.5-arm64.dmg",
                downloadCount: 892,
            },
            {
                id: "file_002_windows",
                platform: "windows" as Platform,
                fileName: "MyApp-Setup-2.0.5.exe",
                fileSize: 75_800_000,
                downloadUrl: "/uploads/2.0.5/MyApp-Setup-2.0.5.exe",
                downloadCount: 2341,
            },
        ],
    },
    {
        id: "rel_003",
        version: "2.0.4",
        releaseNotes:
            "Security update:\n- Patched XSS vulnerability\n- Updated dependencies",
        createdAt: new Date("2024-01-05T09:00:00Z"),
        isEnabled: false,
        files: [
            {
                id: "file_003_mac",
                platform: "mac" as Platform,
                fileName: "MyApp-2.0.4-arm64.dmg",
                fileSize: 87_500_000,
                downloadUrl: "/uploads/2.0.4/MyApp-2.0.4-arm64.dmg",
                downloadCount: 456,
            },
            {
                id: "file_003_windows",
                platform: "windows" as Platform,
                fileName: "MyApp-Setup-2.0.4.exe",
                fileSize: 74_900_000,
                downloadUrl: "/uploads/2.0.4/MyApp-Setup-2.0.4.exe",
                downloadCount: 1123,
            },
        ],
    },
    {
        id: "rel_004",
        version: "2.0.3",
        releaseNotes: "Minor improvements:\n- UI tweaks\n- Better error messages",
        createdAt: new Date("2023-12-28T16:45:00Z"),
        isEnabled: false,
        files: [
            {
                id: "file_004_mac",
                platform: "mac" as Platform,
                fileName: "MyApp-2.0.3-arm64.dmg",
                fileSize: 86_800_000,
                downloadUrl: "/uploads/2.0.3/MyApp-2.0.3-arm64.dmg",
                downloadCount: 234,
            },
            {
                id: "file_004_windows",
                platform: "windows" as Platform,
                fileName: "MyApp-Setup-2.0.3.exe",
                fileSize: 74_200_000,
                downloadUrl: "/uploads/2.0.3/MyApp-Setup-2.0.3.exe",
                downloadCount: 567,
            },
        ],
    },
    {
        id: "rel_005",
        version: "2.0.0",
        releaseNotes:
            "Major version 2.0:\n- Complete UI redesign\n- New plugin system\n- Performance optimizations\n- Native Apple Silicon support",
        createdAt: new Date("2023-12-15T12:00:00Z"),
        isEnabled: true,
        files: [
            {
                id: "file_005_mac",
                platform: "mac" as Platform,
                fileName: "MyApp-2.0.0-arm64.dmg",
                fileSize: 85_000_000,
                downloadUrl: "/uploads/2.0.0/MyApp-2.0.0-arm64.dmg",
                downloadCount: 5678,
            },
            {
                id: "file_005_windows",
                platform: "windows" as Platform,
                fileName: "MyApp-Setup-2.0.0.exe",
                fileSize: 72_500_000,
                downloadUrl: "/uploads/2.0.0/MyApp-Setup-2.0.0.exe",
                downloadCount: 12450,
            },
        ],
    },
];

const seedLogs = [
    {
        id: "log_001",
        timestamp: new Date("2024-01-15T18:30:00Z"),
        clientId: "client_abc123",
        fromVersion: "2.0.5",
        toVersion: "2.1.0",
        platform: "mac" as Platform,
        status: "installed" as UpdateStatus,
        ipAddress: "192.168.1.100",
        userAgent: "MyApp/2.0.5 (macOS 14.2; arm64)",
    },
    {
        id: "log_002",
        timestamp: new Date("2024-01-15T18:25:00Z"),
        clientId: "client_def456",
        fromVersion: "2.0.0",
        toVersion: "2.1.0",
        platform: "windows" as Platform,
        status: "failed" as UpdateStatus,
        errorMessage:
            "Installation failed: EACCES permission denied. Administrator privileges required.",
        ipAddress: "10.0.0.50",
        userAgent: "MyApp/2.0.0 (Windows 11; x64)",
    },
    {
        id: "log_003",
        timestamp: new Date("2024-01-15T17:45:00Z"),
        clientId: "client_ghi789",
        fromVersion: "2.0.5",
        toVersion: "2.1.0",
        platform: "windows" as Platform,
        status: "installed" as UpdateStatus,
        ipAddress: "172.16.0.25",
        userAgent: "MyApp/2.0.5 (Windows 10; x64)",
    },
    {
        id: "log_004",
        timestamp: new Date("2024-01-15T16:20:00Z"),
        clientId: "client_jkl012",
        fromVersion: null,
        toVersion: "2.1.0",
        platform: "mac" as Platform,
        status: "installed" as UpdateStatus,
        ipAddress: "192.168.2.50",
        userAgent: "MyApp/fresh-install (macOS 13.5; arm64)",
    },
    {
        id: "log_005",
        timestamp: new Date("2024-01-15T15:10:00Z"),
        clientId: "client_mno345",
        fromVersion: "2.0.3",
        toVersion: "2.1.0",
        platform: "windows" as Platform,
        status: "downloaded" as UpdateStatus,
        ipAddress: "10.10.10.100",
        userAgent: "MyApp/2.0.3 (Windows 11; x64)",
    },
    {
        id: "log_006",
        timestamp: new Date("2024-01-15T14:00:00Z"),
        clientId: "client_pqr678",
        fromVersion: "2.0.5",
        toVersion: "2.1.0",
        platform: "mac" as Platform,
        status: "started" as UpdateStatus,
        ipAddress: "192.168.1.200",
        userAgent: "MyApp/2.0.5 (macOS 14.1; x86_64)",
    },
    {
        id: "log_007",
        timestamp: new Date("2024-01-14T20:30:00Z"),
        clientId: "client_stu901",
        fromVersion: "1.9.0",
        toVersion: "2.0.5",
        platform: "windows" as Platform,
        status: "failed" as UpdateStatus,
        errorMessage:
            "Download failed: Network timeout after 30 seconds. Please check your internet connection.",
        ipAddress: "192.168.0.75",
        userAgent: "MyApp/1.9.0 (Windows 10; x64)",
    },
    {
        id: "log_008",
        timestamp: new Date("2024-01-14T18:15:00Z"),
        clientId: "client_vwx234",
        fromVersion: "2.0.0",
        toVersion: "2.0.5",
        platform: "mac" as Platform,
        status: "installed" as UpdateStatus,
        ipAddress: "10.0.1.150",
        userAgent: "MyApp/2.0.0 (macOS 14.0; arm64)",
    },
    {
        id: "log_009",
        timestamp: new Date("2024-01-14T12:45:00Z"),
        clientId: "client_yza567",
        fromVersion: "2.0.4",
        toVersion: "2.0.5",
        platform: "windows" as Platform,
        status: "installed" as UpdateStatus,
        ipAddress: "172.20.0.100",
        userAgent: "MyApp/2.0.4 (Windows 11; x64)",
    },
    {
        id: "log_010",
        timestamp: new Date("2024-01-13T09:30:00Z"),
        clientId: "client_bcd890",
        fromVersion: "1.8.5",
        toVersion: "2.0.0",
        platform: "mac" as Platform,
        status: "installed" as UpdateStatus,
        ipAddress: "192.168.5.25",
        userAgent: "MyApp/1.8.5 (macOS 13.0; x86_64)",
    },
];

db.transaction(() => {
    db.delete(updateLogs).run();
    db.delete(releaseFiles).run();
    db.delete(releases).run();

    for (const release of seedReleases) {
        db.insert(releases)
            .values({
                id: release.id,
                version: release.version,
                releaseNotes: release.releaseNotes,
                createdAt: release.createdAt,
                isEnabled: release.isEnabled,
            })
            .run();

        for (const file of release.files) {
            db.insert(releaseFiles)
                .values({
                    ...file,
                    releaseId: release.id,
                })
                .run();
        }
    }

    for (const log of seedLogs) {
        db.insert(updateLogs).values(log).run();
    }
});

console.log("Seeded update server database.");
