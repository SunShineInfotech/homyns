-- Run after stock_warehouses_decks.sql and purchase_stock_transactions.sql.
-- Per-deck on-hand balances plus an append-only movement journal.
CREATE TABLE IF NOT EXISTS `tbl_purchase_stock` (
  `company_id` VARCHAR(50) NOT NULL,
  `item_type` ENUM('product','raw_material') NOT NULL,
  `item_id` VARCHAR(50) NOT NULL,
  `stock_qty` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`company_id`,`item_type`,`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tbl_stock_balance` (
  `stock_balance_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `item_type` ENUM('product','raw_material') NOT NULL,
  `item_id` VARCHAR(50) NOT NULL,
  `warehouse_id` BIGINT NOT NULL,
  `deck_id` BIGINT NOT NULL,
  `quantity` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stock_balance_id`),
  UNIQUE KEY `uq_stock_location_item` (`company_id`,`item_type`,`item_id`,`warehouse_id`,`deck_id`),
  KEY `idx_stock_location` (`company_id`,`warehouse_id`,`deck_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tbl_stock_movement` (
  `movement_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `movement_ref` VARCHAR(80) DEFAULT NULL,
  `movement_type` ENUM('Purchase','Stock IN','Stock OUT','Transfer IN','Transfer OUT','Purchase Return') NOT NULL,
  `item_type` ENUM('product','raw_material') NOT NULL,
  `item_id` VARCHAR(50) NOT NULL,
  `item_name` VARCHAR(200) NOT NULL,
  `warehouse_id` BIGINT NOT NULL,
  `deck_id` BIGINT NOT NULL,
  `quantity` DECIMAL(14,3) NOT NULL,
  `balance_before` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `balance_after` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `transfer_group` VARCHAR(80) DEFAULT NULL,
  `remark` TEXT DEFAULT NULL,
  `added_by` VARCHAR(50) DEFAULT NULL,
  `movement_date` DATE NOT NULL,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`movement_id`),
  KEY `idx_stock_movement_company_date` (`company_id`,`movement_date`,`movement_id`),
  KEY `idx_stock_movement_item` (`company_id`,`item_type`,`item_id`),
  KEY `idx_stock_movement_location` (`company_id`,`warehouse_id`,`deck_id`),
  KEY `idx_stock_movement_transfer` (`company_id`,`transfer_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add the write-off movement type to databases where the stock ledger already exists.
SET @has_dead_stock_movement := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tbl_stock_movement' AND COLUMN_NAME='movement_type' AND COLUMN_TYPE LIKE '%Dead Stock%');
SET @dead_stock_movement_sql := IF(@has_dead_stock_movement=0,'ALTER TABLE `tbl_stock_movement` MODIFY COLUMN `movement_type` ENUM(''Purchase'',''Stock IN'',''Stock OUT'',''Dead Stock'',''Transfer IN'',''Transfer OUT'',''Purchase Return'') NOT NULL','SELECT 1');
PREPARE dead_stock_movement_stmt FROM @dead_stock_movement_sql; EXECUTE dead_stock_movement_stmt; DEALLOCATE PREPARE dead_stock_movement_stmt;

-- Location assignment for each received purchase line.
SET @has_pi_warehouse := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tbl_purchase_item' AND COLUMN_NAME='warehouse_id');
SET @pi_warehouse_sql := IF(@has_pi_warehouse=0,'ALTER TABLE `tbl_purchase_item` ADD COLUMN `warehouse_id` BIGINT DEFAULT NULL','SELECT 1');
PREPARE pi_warehouse_stmt FROM @pi_warehouse_sql; EXECUTE pi_warehouse_stmt; DEALLOCATE PREPARE pi_warehouse_stmt;
SET @has_pi_deck := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tbl_purchase_item' AND COLUMN_NAME='deck_id');
SET @pi_deck_sql := IF(@has_pi_deck=0,'ALTER TABLE `tbl_purchase_item` ADD COLUMN `deck_id` BIGINT DEFAULT NULL','SELECT 1');
PREPARE pi_deck_stmt FROM @pi_deck_sql; EXECUTE pi_deck_stmt; DEALLOCATE PREPARE pi_deck_stmt;

-- Existing purchase receipts do not have reliable location assignments. Do not
-- guess their deck; the stock summary above remains global until new movement.
