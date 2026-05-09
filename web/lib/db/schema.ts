import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const releases = sqliteTable("releases", {
    id: text("id").primaryKey(),
    version: text("version").notNull().unique(),
    releaseNotes: text("release_notes").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
});

export const releaseFiles = sqliteTable("release_files", {
    id: text("id").primaryKey(),
    releaseId: text("release_id")
        .notNull()
        .references(() => releases.id, { onDelete: "cascade" }),
    platform: text("platform", { enum: ["mac", "windows"] }).notNull(),
    kind: text("kind", {
        enum: ["metadata", "artifact", "blockmap"],
    })
        .notNull()
        .default("artifact"),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    storagePath: text("storage_path").notNull(),
    contentType: text("content_type").notNull(),
    sha256: text("sha256").notNull(),
    signature: text("signature"),
    signatureAlgorithm: text("signature_algorithm"),
    signedAt: integer("signed_at", { mode: "timestamp" }),
    signingKeyId: text("signing_key_id"),
    downloadUrl: text("download_url").notNull(),
    downloadCount: integer("download_count").notNull().default(0),
});

export const updateLogs = sqliteTable("update_logs", {
    id: text("id").primaryKey(),
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
    clientId: text("client_id").notNull(),
    fromVersion: text("from_version"),
    toVersion: text("to_version").notNull(),
    platform: text("platform", { enum: ["mac", "windows"] }).notNull(),
    status: text("status", {
        enum: ["started", "downloaded", "installed", "failed"],
    }).notNull(),
    errorMessage: text("error_message"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
});

export type ReleaseRow = typeof releases.$inferSelect;
export type ReleaseFileRow = typeof releaseFiles.$inferSelect;
export type UpdateLogRow = typeof updateLogs.$inferSelect;
