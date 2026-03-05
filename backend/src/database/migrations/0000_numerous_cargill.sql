CREATE TABLE `accounts` (
	`id` varchar(255) NOT NULL,
	`user_id` int,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`expires_at` timestamp,
	`password` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classification_results` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`sensor_reading_id` int,
	`device_id` int,
	`label` varchar(255) NOT NULL,
	`confidence` float NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `classification_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_settings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`device_id` int,
	`initial_distance` float NOT NULL,
	`alert_threshold` float NOT NULL,
	`danger_threshold` float NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `device_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_user` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`device_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `device_user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`device_code` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`device_type` varchar(255),
	`latitude` double,
	`longitude` double,
	`address` text,
	`image` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_device_code_unique` UNIQUE(`device_code`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensor_readings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`device_id` int,
	`recorded_at` datetime NOT NULL,
	`temperature` double,
	`humidity` double,
	`wind_speed` double,
	`water_level` double,
	`tilt_x` double,
	`tilt_y` double,
	`tilt_z` double,
	`magnitude` double,
	`landslide_score` float,
	`landslide_status` varchar(255),
	`soil_moisture` double,
	`vib_x` double,
	`vib_y` double,
	`vib_z` double,
	`gyro_x` double,
	`gyro_y` double,
	`gyro_z` double,
	`rainfall_intensity` double,
	`device_tilt` double,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sensor_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`user_id` int,
	`token` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `telegram_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`chat_id` varchar(255) NOT NULL,
	`user_id` int,
	`message` text NOT NULL,
	`type` enum('sent','received') DEFAULT 'sent',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegram_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` text NOT NULL,
	`email_verified` boolean DEFAULT false,
	`image` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`role_id` int,
	`telegram_chat_id` varchar(255),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` varchar(255) NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weather_readings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`temperature` double NOT NULL,
	`humidity` double NOT NULL,
	`pressure` double NOT NULL,
	`wind_speed` double NOT NULL,
	`recorded_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weather_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classification_results` ADD CONSTRAINT `classification_results_sensor_reading_id_sensor_readings_id_fk` FOREIGN KEY (`sensor_reading_id`) REFERENCES `sensor_readings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classification_results` ADD CONSTRAINT `classification_results_device_id_devices_id_fk` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_settings` ADD CONSTRAINT `device_settings_device_id_devices_id_fk` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_user` ADD CONSTRAINT `device_user_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_user` ADD CONSTRAINT `device_user_device_id_devices_id_fk` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sensor_readings` ADD CONSTRAINT `sensor_readings_device_id_devices_id_fk` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `telegram_logs` ADD CONSTRAINT `telegram_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;