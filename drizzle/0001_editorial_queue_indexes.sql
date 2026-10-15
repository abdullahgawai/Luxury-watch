CREATE INDEX `audit_queue_order` ON `audit` (`at`,`id`);--> statement-breakpoint
CREATE INDEX `corrections_queue_order` ON `corrections` (`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `corrections_queue_state` ON `corrections` (`state`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `records_queue_order` ON `records` (`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `records_queue_state` ON `records` (`state`,`updated_at`,`id`);