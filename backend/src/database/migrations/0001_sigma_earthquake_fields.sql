ALTER TABLE `sensor_readings` ADD COLUMN `shindo` double;--> statement-breakpoint
ALTER TABLE `sensor_readings` ADD COLUMN `pga_gal` double;--> statement-breakpoint
ALTER TABLE `sensor_readings` ADD COLUMN `earthquake_status` varchar(20);--> statement-breakpoint
ALTER TABLE `sensor_readings` ADD COLUMN `gempa_lat` double;--> statement-breakpoint
ALTER TABLE `sensor_readings` ADD COLUMN `gempa_lng` double;--> statement-breakpoint
ALTER TABLE `sensor_readings` ADD COLUMN `satellite_count` int;
