ALTER TABLE `release_files` ADD `kind` text DEFAULT 'artifact' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `release_files_release_id_platform_kind_unique` ON `release_files` (`release_id`,`platform`,`kind`);
