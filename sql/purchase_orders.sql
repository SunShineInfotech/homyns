-- Run once on the application database to add material purchase orders.
CREATE TABLE IF NOT EXISTS `tbl_purchase_order` (
  `purchase_order_id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `po_number` VARCHAR(40) NOT NULL,
  `order_date` DATE NOT NULL,
  `vendor_id` BIGINT NOT NULL,
  `generated_by` VARCHAR(50) NOT NULL,
  `warehouse_id` BIGINT NOT NULL,
  `expected_delivery_date` DATE DEFAULT NULL,
  `subtotal` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `gst_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Pending','Approved','Received','Cancelled') NOT NULL DEFAULT 'Pending',
  `remark` TEXT DEFAULT NULL,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`purchase_order_id`),
  UNIQUE KEY `uq_po_company_number` (`company_id`,`po_number`),
  KEY `idx_po_company_date` (`company_id`,`is_deleted`,`order_date`),
  KEY `idx_po_vendor` (`company_id`,`vendor_id`),
  KEY `idx_po_warehouse` (`company_id`,`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migrate existing purchase orders to the single-page status workflow.
-- Ordered becomes Pending; Partially Received is represented as Received.
ALTER TABLE `tbl_purchase_order`
  MODIFY COLUMN `status` ENUM('Pending','Approved','Received','Cancelled','Ordered','Partially Received') NOT NULL DEFAULT 'Pending';
UPDATE `tbl_purchase_order` SET `status`='Pending' WHERE `status`='Ordered';
UPDATE `tbl_purchase_order` SET `status`='Received' WHERE `status`='Partially Received';
ALTER TABLE `tbl_purchase_order`
  MODIFY COLUMN `status` ENUM('Pending','Approved','Received','Cancelled') NOT NULL DEFAULT 'Pending';

CREATE TABLE IF NOT EXISTS `tbl_purchase_order_item` (
  `purchase_order_item_id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `purchase_order_id` BIGINT NOT NULL,
  `item_type` ENUM('raw_material','product') NOT NULL DEFAULT 'raw_material',
  `material_id` VARCHAR(50) NOT NULL,
  `material_name` VARCHAR(200) NOT NULL,
  `unit_name` VARCHAR(80) DEFAULT NULL,
  `quantity` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `rate` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `gst_percent` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `gst_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`purchase_order_item_id`),
  KEY `idx_poi_order` (`company_id`,`purchase_order_id`,`is_deleted`),
  KEY `idx_poi_material` (`company_id`,`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add the item type field to existing installations without changing old rows.
SET @po_item_type_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_purchase_order_item' AND COLUMN_NAME = 'item_type');
SET @po_item_type_sql = IF(@po_item_type_exists = 0,
  'ALTER TABLE `tbl_purchase_order_item` ADD COLUMN `item_type` ENUM(''raw_material'',''product'') NOT NULL DEFAULT ''raw_material'' AFTER `purchase_order_id`',
  'SELECT 1');
PREPARE po_item_type_stmt FROM @po_item_type_sql;
EXECUTE po_item_type_stmt;
DEALLOCATE PREPARE po_item_type_stmt;

-- Link an actual purchase receipt back to the optional purchase order.
SET @purchase_po_ref_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_purchase' AND COLUMN_NAME = 'purchase_order_id');
SET @purchase_po_ref_sql = IF(@purchase_po_ref_exists = 0,
  'ALTER TABLE `tbl_purchase` ADD COLUMN `purchase_order_id` BIGINT NULL DEFAULT NULL AFTER `vendor_id`, ADD KEY `idx_purchase_order_ref` (`company_id`,`purchase_order_id`)',
  'SELECT 1');
PREPARE purchase_po_ref_stmt FROM @purchase_po_ref_sql;
EXECUTE purchase_po_ref_stmt;
DEALLOCATE PREPARE purchase_po_ref_stmt;
