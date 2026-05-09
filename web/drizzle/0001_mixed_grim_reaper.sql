ALTER TABLE `release_files` ADD `storage_path` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `release_files` ADD `content_type` text DEFAULT 'application/octet-stream' NOT NULL;--> statement-breakpoint
ALTER TABLE `release_files` ADD `sha256` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `release_files` ADD `signature` text;--> statement-breakpoint
ALTER TABLE `release_files` ADD `signature_algorithm` text;--> statement-breakpoint
ALTER TABLE `release_files` ADD `signed_at` integer;--> statement-breakpoint
ALTER TABLE `release_files` ADD `signing_key_id` text;