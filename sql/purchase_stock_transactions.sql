-- Purchase stock tracking
-- Run once on the application database. The guarded ALTER keeps this safe to re-run.

SET @has_product_stock := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_product' AND COLUMN_NAME = 'current_stock'
);
SET @product_stock_sql := IF(@has_product_stock = 0,
  'ALTER TABLE `tbl_product` ADD COLUMN `current_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000 AFTER `price`',
  'SELECT 1');
PREPARE product_stock_stmt FROM @product_stock_sql;
EXECUTE product_stock_stmt;
DEALLOCATE PREPARE product_stock_stmt;

CREATE TABLE IF NOT EXISTS `tbl_product_stock_transaciton` (
  `product_stock_transaciton_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `remark` TEXT DEFAULT NULL,
  `current_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `changes_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `new_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `added_by` VARCHAR(50) DEFAULT NULL,
  `purchase_id` BIGINT UNSIGNED DEFAULT NULL,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_stock_transaciton_id`),
  KEY `idx_product_stock_history` (`company_id`,`product_id`,`date`),
  KEY `idx_product_stock_purchase` (`company_id`,`purchase_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tbl_raw_matiral_stock_trasnction` (
  `raw_matiral_stock_trasnction_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `raw_matirial_id` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `remark` TEXT DEFAULT NULL,
  `current_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `changes_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `new_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `added_by` VARCHAR(50) DEFAULT NULL,
  `purchase_id` BIGINT UNSIGNED DEFAULT NULL,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`raw_matiral_stock_trasnction_id`),
  KEY `idx_raw_stock_history` (`company_id`,`raw_matirial_id`,`date`),
  KEY `idx_raw_stock_purchase` (`company_id`,`purchase_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Compatibility fields used by the purchase API when these history tables already exist.
SET @has_product_history_company := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_product_stock_transaciton' AND COLUMN_NAME = 'company_id'
);
SET @product_history_company_sql := IF(@has_product_history_company = 0,
  'ALTER TABLE `tbl_product_stock_transaciton` ADD COLUMN `company_id` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `product_stock_transaciton_id`',
  'SELECT 1');
PREPARE product_history_company_stmt FROM @product_history_company_sql;
EXECUTE product_history_company_stmt;
DEALLOCATE PREPARE product_history_company_stmt;
SET @has_product_history_purchase := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_product_stock_transaciton' AND COLUMN_NAME = 'purchase_id'
);
SET @product_history_purchase_sql := IF(@has_product_history_purchase = 0,
  'ALTER TABLE `tbl_product_stock_transaciton` ADD COLUMN `purchase_id` BIGINT UNSIGNED DEFAULT NULL',
  'SELECT 1');
PREPARE product_history_purchase_stmt FROM @product_history_purchase_sql;
EXECUTE product_history_purchase_stmt;
DEALLOCATE PREPARE product_history_purchase_stmt;

SET @has_raw_history_company := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_raw_matiral_stock_trasnction' AND COLUMN_NAME = 'company_id'
);
SET @raw_history_company_sql := IF(@has_raw_history_company = 0,
  'ALTER TABLE `tbl_raw_matiral_stock_trasnction` ADD COLUMN `company_id` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `raw_matiral_stock_trasnction_id`',
  'SELECT 1');
PREPARE raw_history_company_stmt FROM @raw_history_company_sql;
EXECUTE raw_history_company_stmt;
DEALLOCATE PREPARE raw_history_company_stmt;
SET @has_raw_history_purchase := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_raw_matiral_stock_trasnction' AND COLUMN_NAME = 'purchase_id'
);
SET @raw_history_purchase_sql := IF(@has_raw_history_purchase = 0,
  'ALTER TABLE `tbl_raw_matiral_stock_trasnction` ADD COLUMN `purchase_id` BIGINT UNSIGNED DEFAULT NULL',
  'SELECT 1');
PREPARE raw_history_purchase_stmt FROM @raw_history_purchase_sql;
EXECUTE raw_history_purchase_stmt;
DEALLOCATE PREPARE raw_history_purchase_stmt;

-- Existing products may already have purchase movements in the stock summary.
-- Copy that net quantity into the new product master field when the summary table exists.
SET @has_purchase_stock := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_purchase_stock'
);
SET @backfill_product_stock_sql := IF(@has_purchase_stock > 0,
  'UPDATE `tbl_product` p JOIN `tbl_purchase_stock` s ON s.company_id=p.company_id AND s.item_type=''product'' AND s.item_id=p.product_id SET p.current_stock=s.stock_qty WHERE p.current_stock=0',
  'SELECT 1');
PREPARE backfill_product_stock_stmt FROM @backfill_product_stock_sql;
EXECUTE backfill_product_stock_stmt;
DEALLOCATE PREPARE backfill_product_stock_stmt;
