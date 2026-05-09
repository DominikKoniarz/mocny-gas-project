CREATE TABLE `release_files` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`platform` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`download_url` text NOT NULL,
	`download_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`release_notes` text NOT NULL,
	`created_at` integer NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `releases_version_unique` ON `releases` (`version`);--> statement-breakpoint
CREATE TABLE `update_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer NOT NULL,
	`client_id` text NOT NULL,
	`from_version` text,
	`to_version` text NOT NULL,
	`platform` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`ip_address` text,
	`user_agent` text
);
