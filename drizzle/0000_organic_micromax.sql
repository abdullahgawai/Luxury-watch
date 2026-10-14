CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `corrections` (
	`id` text PRIMARY KEY NOT NULL,
	`page` text NOT NULL,
	`field` text NOT NULL,
	`claim` text NOT NULL,
	`contact` text,
	`state` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fx_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`base` text NOT NULL,
	`quote` text NOT NULL,
	`rate` text NOT NULL,
	`source_id` text NOT NULL,
	`effective_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `imports` (
	`key` text PRIMARY KEY NOT NULL,
	`hash` text NOT NULL,
	`record_id` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`observation_id` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `observations` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`type` text NOT NULL,
	`country` text NOT NULL,
	`currency` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`observed_at` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`brand` text NOT NULL,
	`reference` text NOT NULL,
	`configuration` text NOT NULL,
	`payload` text NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exact_configuration` ON `records` (`brand`,`reference`,`configuration`);--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`actor` text NOT NULL,
	`at` text NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `record_revision` ON `revisions` (`record_id`,`revision`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `spec_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`field` text NOT NULL,
	`source_id` text NOT NULL,
	`value` text,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
