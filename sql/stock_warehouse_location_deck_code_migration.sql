-- Run once if tbl_warehouse and tbl_warehouse_deck were created before these fields were added.
ALTER TABLE `tbl_warehouse`
  ADD COLUMN `state_id` BIGINT DEFAULT NULL AFTER `address`,
  ADD COLUMN `city_id` BIGINT DEFAULT NULL AFTER `state_id`,
  ADD COLUMN `area_id` BIGINT DEFAULT NULL AFTER `city_id`,
  ADD COLUMN `pincode` VARCHAR(20) DEFAULT NULL AFTER `area_id`;

ALTER TABLE `tbl_warehouse_deck`
  ADD COLUMN `deck_code` VARCHAR(100) DEFAULT NULL AFTER `deck_name`;
