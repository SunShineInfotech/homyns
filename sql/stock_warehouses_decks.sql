-- Run once on the application database to enable warehouse and deck setup.
CREATE TABLE IF NOT EXISTS `tbl_warehouse` (
  `warehouse_id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `warehouse_name` VARCHAR(150) NOT NULL,
  `address` TEXT DEFAULT NULL,
  `state_id` BIGINT DEFAULT NULL,
  `city_id` BIGINT DEFAULT NULL,
  `area_id` BIGINT DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`warehouse_id`),
  KEY `idx_warehouse_company` (`company_id`,`is_deleted`,`warehouse_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Existing installations: run sql/stock_warehouse_location_deck_code_migration.sql.

CREATE TABLE IF NOT EXISTS `tbl_warehouse_deck` (
  `deck_id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `warehouse_id` BIGINT NOT NULL,
  `deck_name` VARCHAR(150) NOT NULL,
  `deck_code` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`deck_id`),
  KEY `idx_deck_warehouse` (`company_id`,`warehouse_id`,`is_deleted`,`deck_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
