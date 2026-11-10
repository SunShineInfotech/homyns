-- Run once after sql/agencies.sql on an existing application database.
ALTER TABLE `tbl_agency`
  ADD COLUMN `wallet` DECIMAL(14,2) NOT NULL DEFAULT 0.00
    COMMENT 'Current agency wallet balance; credits increase it and debits reduce it'
    AFTER `gst_number`;

CREATE TABLE IF NOT EXISTS `tbl_agency_wallet_entry` (
  `entry_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `agency_id` BIGINT NOT NULL,
  `entry_date` DATE NOT NULL,
  `entry_type` ENUM('Credit','Debit') NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `remark` VARCHAR(500) DEFAULT NULL,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`entry_id`),
  KEY `idx_agency_wallet_entries` (`company_id`,`agency_id`,`is_deleted`,`entry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
